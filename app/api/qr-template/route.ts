import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface Circle {
  cx: number;
  cy: number;
  r: number;
}

/**
 * Parses all <circle> and <ellipse> elements from SVG text.
 * Returns circles split into two groups:
 *   - withId: circles that have an id attribute (used as clip-path shapes for logo badges)
 *   - noId:   circles that have no id (decorative plate circles indicating QR positions)
 *
 * Template 1 uses <ellipse> elements for logo clips (rx≈ry≈24), so both element
 * types must be handled.
 */
function parseCircles(svgText: string): { withId: Circle[]; noId: Circle[] } {
  const withId: Circle[] = [];
  const noId: Circle[] = [];

  const get = (attrs: string, name: string) => {
    const am = new RegExp(`\\b${name}="([^"]+)"`).exec(attrs);
    return am ? parseFloat(am[1]) : NaN;
  };

  // Match self-closing <circle .../> tags
  const circleRe = /<circle\s+([^/]+)\/>/g;
  let m: RegExpExecArray | null;
  while ((m = circleRe.exec(svgText)) !== null) {
    const attrs = m[1];
    const hasId = /\bid="/.test(attrs);
    const cx = get(attrs, 'cx');
    const cy = get(attrs, 'cy');
    const r  = get(attrs, 'r');
    if (!isNaN(cx) && !isNaN(cy) && !isNaN(r)) {
      (hasId ? withId : noId).push({ cx, cy, r });
    }
  }

  // Match self-closing <ellipse .../> tags (used in template 1 as logo clip shapes)
  const ellipseRe = /<ellipse\s+([^/]+)\/>/g;
  while ((m = ellipseRe.exec(svgText)) !== null) {
    const attrs = m[1];
    const hasId = /\bid="/.test(attrs);
    const cx = get(attrs, 'cx');
    const cy = get(attrs, 'cy');
    const rx = get(attrs, 'rx');
    const ry = get(attrs, 'ry');
    const r  = !isNaN(rx) && !isNaN(ry) ? (rx + ry) / 2 : NaN;
    if (!isNaN(cx) && !isNaN(cy) && !isNaN(r)) {
      (hasId ? withId : noId).push({ cx, cy, r });
    }
  }

  return { withId, noId };
}

/**
 * Replaces every <image width="1079" height="1079"> element with a properly-sized
 * shop logo image centered on its clip circle.
 *
 * For each logo image element we find the nearest preceding clip circle (id-bearing circle)
 * in the SVG, compute the correct x/y/width/height to center the logo inside that circle,
 * and swap the href.
 */
function replaceLogoImages(svgText: string, logoDataUrl: string): string {
  const { withId: clipCircles } = parseCircles(svgText);
  if (clipCircles.length === 0) return svgText;

  // We process left-to-right; each <image width="1079" corresponds to one clip circle in order.
  let clipIdx = 0;
  const parts: string[] = [];
  let pos = 0;

  while (pos < svgText.length) {
    const imageStart = svgText.indexOf('<image', pos);
    if (imageStart === -1) {
      parts.push(svgText.slice(pos));
      break;
    }

    const preview = svgText.slice(imageStart, imageStart + 150);
    if (preview.includes('width="1079"') && preview.includes('height="1079"')) {
      // These SVG <image> elements all end with </image> (not />), so find that first.
      // Fall back to self-closing /> for robustness.
      const closingTag = svgText.indexOf('</image>', imageStart);
      const selfClose  = svgText.indexOf('/>', imageStart);
      let elementEnd: number;
      if (closingTag !== -1 && (selfClose === -1 || closingTag < selfClose)) {
        elementEnd = closingTag + 8; // length of '</image>'
      } else if (selfClose !== -1) {
        elementEnd = selfClose + 2;
      } else {
        parts.push(svgText.slice(pos));
        break;
      }

      // Get the clip circle for this logo slot
      const circle = clipCircles[clipIdx % clipCircles.length];
      clipIdx++;

      const x = (circle.cx - circle.r).toFixed(4);
      const y = (circle.cy - circle.r).toFixed(4);
      const size = (circle.r * 2).toFixed(4);

      // Emit everything before this tag, then emit the replacement tag.
      // The original logo JPEG is pre-rotated -90° via a matrix transform; apply the same
      // rotation around the clip circle centre so the shop logo renders upright.
      parts.push(svgText.slice(pos, imageStart));
      parts.push(
        `<image style="overflow:visible;" x="${x}" y="${y}" width="${size}" height="${size}" ` +
        `transform="rotate(-90, ${circle.cx.toFixed(4)}, ${circle.cy.toFixed(4)})" ` +
        `preserveAspectRatio="xMidYMid slice" xlink:href="${logoDataUrl}"/>`,
      );
      pos = elementEnd; // skip past the entire original <image>...</image> element
    } else {
      parts.push(svgText.slice(pos, imageStart + 1));
      pos = imageStart + 1;
    }
  }

  return parts.join('');
}

/**
 * Injects QR code <image> elements (square, no clip) at each plate circle position.
 *
 * For templates that have explicit plate circles (no-id circles with r>40, e.g. template 3),
 * those are used directly.  For templates without explicit plate circles (templates 1, 2, 4),
 * we derive the QR position from the logo clip circles: QR centre = logo centre + (127, 0).
 *
 * The injected images are plain squares — no circular clip — so they fully cover the
 * black QR code baked into the background JPEG.
 */
function injectQRCodeOverlays(svgText: string, qrDataUrl: string): string {
  const { withId: clipCircles, noId: plateCircles } = parseCircles(svgText);

  // Prefer explicit plate circles (template 3); fall back to logo-derived positions.
  const qrCircles: Circle[] =
    plateCircles.filter((c) => c.r > 40).length > 0
      ? plateCircles.filter((c) => c.r > 40)
      : clipCircles.map((c) => ({ cx: c.cx + 127, cy: c.cy, r: 55.75 }));

  if (qrCircles.length === 0) return svgText;

  const images: string[] = [];

  qrCircles.forEach((c) => {
    const x = (c.cx - c.r).toFixed(4);
    const y = (c.cy - c.r).toFixed(4);
    const size = (c.r * 2).toFixed(4);
    images.push(
      `<image x="${x}" y="${y}" width="${size}" height="${size}" ` +
      `preserveAspectRatio="xMidYMid meet" ` +
      `xlink:href="${qrDataUrl}"/>`,
    );
  });

  const injection = `<g id="qr-overlays">${images.join('')}</g>`;

  // Insert just before </svg>
  const svgClose = svgText.lastIndexOf('</svg>');
  if (svgClose === -1) return svgText + injection;
  return svgText.slice(0, svgClose) + injection + svgText.slice(svgClose);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !('templateId' in body) ||
    !('qrDataUrl' in body)
  ) {
    return NextResponse.json({ error: 'Missing templateId or qrDataUrl' }, { status: 400 });
  }

  const { templateId, qrDataUrl, logoDataUrl } = body as {
    templateId: unknown;
    qrDataUrl: unknown;
    logoDataUrl?: unknown;
  };

  if (templateId !== 1 && templateId !== 2 && templateId !== 3 && templateId !== 4) {
    return NextResponse.json({ error: 'templateId must be 1, 2, 3, or 4' }, { status: 400 });
  }

  if (typeof qrDataUrl !== 'string' || !qrDataUrl.startsWith('data:image/png;base64,')) {
    return NextResponse.json(
      { error: 'qrDataUrl must be a PNG data URL starting with data:image/png;base64,' },
      { status: 400 },
    );
  }

  const svgPath = path.join(process.cwd(), 'public', 'QR-templates', `${templateId}.svg`);

  let svgText: string;
  try {
    svgText = await fs.readFile(svgPath, 'utf-8');
  } catch {
    return NextResponse.json(
      { error: `Template SVG not found: ${templateId}.svg` },
      { status: 404 },
    );
  }

  // 1. Replace logo badge images with shop logo (if provided)
  let modified = svgText;
  if (typeof logoDataUrl === 'string' && logoDataUrl.startsWith('data:')) {
    modified = replaceLogoImages(modified, logoDataUrl);
  }

  // 2. Overlay user's QR code at each plate circle position
  modified = injectQRCodeOverlays(modified, qrDataUrl);

  return new NextResponse(modified, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Content-Disposition': `attachment; filename="qr-template-${templateId}.svg"`,
    },
  });
}
