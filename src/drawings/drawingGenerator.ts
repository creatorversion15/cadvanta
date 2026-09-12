import { CADPart } from '../types/cad';

export function generateDrawingSVG(part: CADPart): string {
  const p = part.parameters;
  const mat = part.material?.name || 'AISI 304';
  const width = 840;
  const height = 594; // ISO A4 landscape aspect

  const dia = Number(p.main_diameter || 60);
  const len = Number(p.total_length || 200);
  const s1Dia = Number(p.step1_diameter || 0);
  const s1Len = Number(p.step1_length || 0);

  // Scale factor to fit inside front-view bounding box
  const scale = Math.min(2.2, 400 / Math.max(len, 100));

  const shaftL = len * scale;
  const shaftH = dia * scale;
  const s1L = s1Len * scale;
  const s1H = s1Dia * scale;

  const startX = 220;
  const centerY = 240;

  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" class="bg-[#0b0f17] text-slate-200">
    <!-- Border & Grid Frame -->
    <rect x="20" y="20" width="${width - 40}" height="${height - 40}" fill="#0b0f17" stroke="#38bdf8" stroke-width="2"/>
    <rect x="26" y="26" width="${width - 52}" height="${height - 52}" fill="none" stroke="#1e293b" stroke-width="1"/>

    <!-- Projection Symbol (Third Angle) -->
    <g transform="translate(680, 520) scale(0.6)">
      <circle cx="20" cy="20" r="14" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
      <circle cx="20" cy="20" r="8" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
      <line x1="45" y1="6" x2="80" y2="12" stroke="#94a3b8" stroke-width="1.5"/>
      <line x1="45" y1="34" x2="80" y2="28" stroke="#94a3b8" stroke-width="1.5"/>
      <line x1="45" y1="6" x2="45" y2="34" stroke="#94a3b8" stroke-width="1.5"/>
      <line x1="80" y1="12" x2="80" y2="28" stroke="#94a3b8" stroke-width="1.5"/>
    </g>

    <!-- Centerline -->
    <line x1="${startX - 40}" y1="${centerY}" x2="${startX + shaftL + 40}" y2="${centerY}" stroke="#38bdf8" stroke-dasharray="16,4,4,4" stroke-width="1.2"/>

    <!-- FRONT VIEW (Main Shaft Outline) -->
    <!-- Step 1 Left Section -->
    ${s1L > 0 ? `
      <rect x="${startX}" y="${centerY - s1H / 2}" width="${s1L}" height="${s1H}" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
      <text x="${startX + s1L / 2}" y="${centerY - s1H / 2 - 12}" fill="#38bdf8" font-size="12" text-anchor="middle" font-family="monospace">Ø${s1Dia} js6</text>
    ` : ''}

    <!-- Main Journal Center Section -->
    <rect x="${startX + s1L}" y="${centerY - shaftH / 2}" width="${shaftL - s1L}" height="${shaftH}" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
    <text x="${startX + s1L + (shaftL - s1L) / 2}" y="${centerY - shaftH / 2 - 15}" fill="#38bdf8" font-size="14" font-weight="bold" text-anchor="middle" font-family="monospace">Ø${dia} h6</text>

    <!-- Keyway Representation -->
    ${p.keyway_width ? `
      <rect x="${startX + s1L + 25}" y="${centerY - shaftH / 2}" width="50" height="${(p.keyway_depth || 3) * scale}" fill="#0284c7" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="4,2"/>
      <text x="${startX + s1L + 50}" y="${centerY + 5}" fill="#e0f2fe" font-size="11" text-anchor="middle" font-family="monospace">KEYWAY ${p.keyway_width}×${p.keyway_depth || 3} (DIN 6885)</text>
    ` : ''}

    <!-- Dimension Lines -->
    <!-- Total Length Dimension -->
    <g transform="translate(0, 140)">
      <line x1="${startX}" y1="${centerY + shaftH / 2 + 30}" x2="${startX}" y2="${centerY + shaftH / 2 + 55}" stroke="#94a3b8" stroke-width="1"/>
      <line x1="${startX + shaftL}" y1="${centerY + shaftH / 2 + 30}" x2="${startX + shaftL}" y2="${centerY + shaftH / 2 + 55}" stroke="#94a3b8" stroke-width="1"/>
      <line x1="${startX}" y1="${centerY + shaftH / 2 + 45}" x2="${startX + shaftL}" y2="${centerY + shaftH / 2 + 45}" stroke="#38bdf8" stroke-width="1.5"/>
      <text x="${startX + shaftL / 2}" y="${centerY + shaftH / 2 + 40}" fill="#38bdf8" font-size="13" font-weight="bold" text-anchor="middle" font-family="monospace">${len} ±0.2 mm</text>
    </g>

    <!-- Step 1 Length Dimension -->
    ${s1L > 0 ? `
      <line x1="${startX}" y1="${centerY + shaftH / 2 + 10}" x2="${startX}" y2="${centerY + shaftH / 2 + 25}" stroke="#94a3b8" stroke-width="1"/>
      <line x1="${startX + s1L}" y1="${centerY + shaftH / 2 + 10}" x2="${startX + s1L}" y2="${centerY + shaftH / 2 + 25}" stroke="#94a3b8" stroke-width="1"/>
      <line x1="${startX}" y1="${centerY + shaftH / 2 + 20}" x2="${startX + s1L}" y2="${centerY + shaftH / 2 + 20}" stroke="#38bdf8" stroke-width="1.2"/>
      <text x="${startX + s1L / 2}" y="${centerY + shaftH / 2 + 16}" fill="#38bdf8" font-size="11" text-anchor="middle" font-family="monospace">${s1Len} mm</text>
    ` : ''}

    <!-- ISO STANDARD TITLE BLOCK -->
    <g transform="translate(${width - 340}, ${height - 110})">
      <rect x="0" y="0" width="310" height="85" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5"/>
      <line x1="0" y1="28" x2="310" y2="28" stroke="#334155" stroke-width="1"/>
      <line x1="0" y1="56" x2="310" y2="56" stroke="#334155" stroke-width="1"/>
      <line x1="160" y1="0" x2="160" y2="85" stroke="#334155" stroke-width="1"/>

      <text x="10" y="18" fill="#94a3b8" font-size="9" font-family="sans-serif">TITLE / PART NAME:</text>
      <text x="10" y="45" fill="#f8fafc" font-size="13" font-weight="bold" font-family="sans-serif">${part.name || 'TRANSMISSION SHAFT'}</text>

      <text x="170" y="18" fill="#94a3b8" font-size="9" font-family="sans-serif">MATERIAL:</text>
      <text x="170" y="45" fill="#38bdf8" font-size="12" font-weight="bold" font-family="sans-serif">${mat}</text>

      <text x="10" y="73" fill="#94a3b8" font-size="9" font-family="sans-serif">DWG NO: MECH-2026-A1</text>
      <text x="170" y="73" fill="#94a3b8" font-size="9" font-family="sans-serif">SCALE: 1:1  |  UNITS: MM</text>
    </g>

    <!-- General Notes -->
    <g transform="translate(45, 470)">
      <text x="0" y="0" fill="#38bdf8" font-size="11" font-weight="bold" font-family="sans-serif">GENERAL ENGINEERING NOTES:</text>
      <text x="0" y="18" fill="#94a3b8" font-size="10" font-family="sans-serif">1. ALL UNSPECIFIED CORNER RADII: R${p.fillet_radius || 2} mm.</text>
      <text x="0" y="34" fill="#94a3b8" font-size="10" font-family="sans-serif">2. DEBURR AND BREAK ALL SHARP EDGES 0.5 × 45°.</text>
      <text x="0" y="50" fill="#94a3b8" font-size="10" font-family="sans-serif">3. SURFACE ROUGHNESS: Ra 0.8 µm ON BEARING JOURNALS, Ra 1.6 µm ELSEWHERE.</text>
      <text x="0" y="66" fill="#94a3b8" font-size="10" font-family="sans-serif">4. GENERAL TOLERANCES IN ACCORDANCE WITH ISO 2768-mK.</text>
    </g>
  </svg>
  `;
}
