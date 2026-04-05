import QRCodeStyling, { type Options as QROptions } from 'qr-code-styling';

/**
 * Converts a Blob or Node.js Buffer to a data URL via FileReader.
 */
function blobToDataUrl(raw: Blob | Buffer): Promise<string> {
  let blob: Blob;
  if (raw instanceof Blob) {
    blob = raw;
  } else {
    const ab = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) as ArrayBuffer;
    blob = new Blob([ab], { type: 'image/png' });
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Fetches an image URL and converts it to a base64 data URL.
 * Returns null if the URL is falsy or the fetch fails.
 */
async function fetchLogoDataUrl(logoUrl: string | null): Promise<string | null> {
  if (!logoUrl) return null;
  try {
    const res = await fetch(logoUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await blobToDataUrl(blob);
  } catch {
    return null;
  }
}

/**
 * Downloads a branded QR sticker sheet as an SVG.
 *
 * 1. Generates a 1079×1079 PNG of the user's QR code via qr-code-styling.
 * 2. Optionally fetches the shop logo and converts it to a data URL.
 * 3. POSTs both to the internal /api/qr-template route.
 * 4. The server overlays the QR code on every plate circle and replaces
 *    the logo badge images with the shop logo.
 * 5. Triggers download of the modified SVG.
 *
 * @param templateId - Which template layout to use (1–4)
 * @param qrOptions  - Base QR styling options from the page's buildQROptions()
 * @param shopUrl    - The shop URL to encode in the QR code
 * @param logoUrl    - Optional shop logo URL to embed in the logo badge slots
 */
export async function downloadTemplate(
  templateId: 1 | 2 | 3 | 4,
  qrOptions: QROptions,
  shopUrl: string,
  logoUrl: string | null = null,
): Promise<void> {
  // Step 1: Generate 1079×1079 QR PNG
  const qr = new QRCodeStyling({ ...qrOptions, width: 1079, height: 1079, data: shopUrl });
  const raw = await qr.getRawData('png');
  if (!raw) throw new Error('QRCodeStyling returned null');
  const qrDataUrl = await blobToDataUrl(raw as Blob | Buffer);

  // Step 2: Fetch shop logo data URL (non-blocking — missing logo is fine)
  const logoDataUrl = await fetchLogoDataUrl(logoUrl);

  // Step 3: POST to the API route
  const response = await fetch('/api/qr-template', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ templateId, qrDataUrl, logoDataUrl }),
  });

  if (!response.ok) {
    let message = `Server error ${response.status}`;
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  // Step 4: Trigger SVG download
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `qr-template-${templateId}.svg`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
