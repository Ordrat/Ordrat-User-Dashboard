#!/usr/bin/env node
// Extracts background JPEGs and WebP thumbnails from QR template SVGs.
// Usage: node scripts/extract-qr-backgrounds.js
// Requires: sharp (pnpm add -D sharp)

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SVG_DIR = path.join(__dirname, '../public/QR-templates');
const BG_DIR = path.join(__dirname, '../public/QR-templates/backgrounds');
const THUMB_DIR = path.join(__dirname, '../public/QR-templates/thumbnails');

const THUMB_W = 400;
const THUMB_H = 566;

fs.mkdirSync(BG_DIR, { recursive: true });
fs.mkdirSync(THUMB_DIR, { recursive: true });

async function processTemplate(id) {
  const svgPath = path.join(SVG_DIR, `${id}.svg`);
  console.log(`Processing template ${id}…`);

  const svgContent = fs.readFileSync(svgPath, 'utf8');

  // Find the first 2480×3508 image tag and extract its base64 JPEG
  // The base64 data spans multiple lines in the SVG so we can't use a simple regex
  const imageTagRegex = /<image[^>]*width="2480"[^>]*height="3508"[^>]*xlink:href="data:image\/jpeg;base64,/s;
  const tagMatch = svgContent.match(imageTagRegex);

  if (!tagMatch) {
    console.error(`  ✗ No 2480×3508 JPEG image tag found in template ${id}.svg`);
    process.exit(1);
  }

  // Extract everything from after "base64," to the closing quote
  const startIdx = tagMatch.index + tagMatch[0].length;
  const endIdx = svgContent.indexOf('"', startIdx);
  if (endIdx === -1) {
    console.error(`  ✗ Could not find end of base64 data in template ${id}.svg`);
    process.exit(1);
  }

  // Strip all whitespace (newlines, spaces) that the SVG may have inserted
  const base64Data = svgContent.slice(startIdx, endIdx).replace(/\s/g, '');
  const jpegBuffer = Buffer.from(base64Data, 'base64');
  console.log(`  Raw JPEG size: ${(jpegBuffer.length / 1024).toFixed(1)} KB`);

  // Save compressed JPEG background (quality 85, target ≤ 500 KB)
  const bgPath = path.join(BG_DIR, `${id}.jpg`);
  await sharp(jpegBuffer)
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(bgPath);

  const bgStat = fs.statSync(bgPath);
  console.log(`  Background JPEG: ${(bgStat.size / 1024).toFixed(1)} KB → ${bgPath}`);

  if (bgStat.size > 500 * 1024) {
    for (const q of [70, 60, 50, 40]) {
      console.warn(`  ⚠ Background exceeds 500 KB — re-compressing at quality ${q}`);
      await sharp(jpegBuffer)
        .jpeg({ quality: q, mozjpeg: true })
        .toFile(bgPath);
      const stat = fs.statSync(bgPath);
      console.log(`  Re-compressed (q=${q}): ${(stat.size / 1024).toFixed(1)} KB`);
      if (stat.size <= 500 * 1024) break;
    }
  }

  // Save WebP thumbnail at 400 × 566 px
  const thumbPath = path.join(THUMB_DIR, `${id}.webp`);
  await sharp(jpegBuffer)
    .resize(THUMB_W, THUMB_H, { fit: 'cover' })
    .webp({ quality: 80 })
    .toFile(thumbPath);

  const thumbStat = fs.statSync(thumbPath);
  console.log(`  Thumbnail WebP:  ${(thumbStat.size / 1024).toFixed(1)} KB → ${thumbPath}`);
  console.log(`  ✓ Template ${id} done`);
}

(async () => {
  for (const id of [1, 2, 3, 4]) {
    await processTemplate(id);
  }
  console.log('\nAll templates extracted successfully.');
})();
