import { CARD_H, CARD_W, cover, loadImage, paintGradient } from "@/lib/victoryCard";

/* =====================================================
   v5.7 : carte d'empire partageable (1200 × 630, format des aperçus
   Discord / réseaux) : bannière, avatar, pseudo, alliance, rang, titre,
   six chiffres clés et les derniers titres obtenus.
===================================================== */

export interface EmpireCardInput {
  /** Mention en haut à droite (« ÉTAT DE L'EMPIRE », « PROFIL »). */
  kicker: string;
  pseudo: string;
  tag?: string;
  rank: string;
  rankIcon: string;
  /** Ascensions (prestige des bâtiments) : 0 à 5, dessinées en étoiles. */
  ascensions?: number;
  ascensionLabel?: string;
  /** Insigne d'ascension (image), dessiné avant les étoiles. */
  ascensionIcon?: string;
  /** Titre affiché sous le pseudo (titre actif). */
  title?: string;
  avatar?: string;
  banner: { image?: string; gradient?: string };
  emblem?: string | null;
  motto?: string;
  /** Six chiffres au plus, affichés en grille 3 × 2. */
  stats: { label: string; value: string; tone?: string }[];
  /** Titres gagnés (les trois premiers sont affichés). */
  titles: string[];
  footer: string;
}

/** Réduit la police jusqu'à ce que le texte tienne dans `max` pixels. */
function fit(ctx: CanvasRenderingContext2D, text: string, max: number, weight: string, size: number, family: string): number {
  let s = size;
  ctx.font = `${weight} ${s}px ${family}`;
  while (s > 14 && ctx.measureText(text).width > max) {
    s -= 2;
    ctx.font = `${weight} ${s}px ${family}`;
  }
  return s;
}

function clipText(ctx: CanvasRenderingContext2D, text: string, max: number): string {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1);
  return `${t}…`;
}

/** Étoile à cinq branches, pleine (dorée) ou vide (contour). */
function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, filled: boolean): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  ctx.closePath();
  if (filled) {
    ctx.fillStyle = "#ffd86b";
    ctx.fill();
  } else {
    ctx.strokeStyle = "rgba(148,163,184,0.6)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

export async function drawEmpireCard(canvas: HTMLCanvasElement, input: EmpireCardInput): Promise<void> {
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d")!;
  await document.fonts?.ready;

  // Fond : bannière du joueur assombrie, plus marquée à gauche.
  const bannerImg = input.banner.image ? await loadImage(input.banner.image) : null;
  if (bannerImg) cover(ctx, bannerImg);
  else paintGradient(ctx, input.banner.gradient ?? "");
  const shade = ctx.createLinearGradient(0, 0, CARD_W, 0);
  shade.addColorStop(0, "rgba(3,4,10,0.95)");
  shade.addColorStop(0.55, "rgba(3,4,10,0.82)");
  shade.addColorStop(1, "rgba(3,4,10,0.45)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  const glow = ctx.createRadialGradient(CARD_W - 160, 120, 10, CARD_W - 160, 120, 420);
  glow.addColorStop(0, "rgba(75,232,255,0.18)");
  glow.addColorStop(1, "rgba(75,232,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Cadre HUD.
  ctx.strokeStyle = "rgba(75,232,255,0.5)";
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, CARD_W - 36, CARD_H - 36);
  ctx.fillStyle = "#4be8ff";
  for (const [x, y, dx, dy] of [[18, 18, 1, 1], [CARD_W - 18, 18, -1, 1], [18, CARD_H - 18, 1, -1], [CARD_W - 18, CARD_H - 18, -1, -1]]) {
    ctx.fillRect(x, y, 46 * dx, 6 * dy);
    ctx.fillRect(x, y, 6 * dx, 46 * dy);
  }

  // En-tête : logo, nom du jeu, mention.
  const logo = await loadImage("/assets/logo/logo.webp");
  if (logo) ctx.drawImage(logo, 52, 44, 44, 44);
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "700 20px 'Chakra Petch', sans-serif";
  ctx.fillText("COSMIC EMPIRES", 108, 74);
  ctx.textAlign = "right";
  ctx.fillStyle = "#4be8ff";
  ctx.font = "600 16px 'JetBrains Mono', monospace";
  ctx.fillText(input.kicker.toUpperCase(), CARD_W - 56, 72);
  ctx.textAlign = "left";

  // Avatar (cadre biseauté), emblème en médaillon.
  const ax = 56;
  const ay = 116;
  const as = 176;
  const avatar = input.avatar ? await loadImage(input.avatar) : await loadImage("/assets/avatars/default.webp");
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(ax + 18, ay);
  ctx.lineTo(ax + as, ay);
  ctx.lineTo(ax + as, ay + as - 18);
  ctx.lineTo(ax + as - 18, ay + as);
  ctx.lineTo(ax, ay + as);
  ctx.lineTo(ax, ay + 18);
  ctx.closePath();
  ctx.fillStyle = "#0b1020";
  ctx.fill();
  ctx.clip();
  if (avatar) {
    const r = Math.max(as / avatar.width, as / avatar.height);
    ctx.drawImage(avatar, ax + (as - avatar.width * r) / 2, ay + (as - avatar.height * r) / 2, avatar.width * r, avatar.height * r);
  }
  ctx.restore();
  ctx.strokeStyle = "rgba(75,232,255,0.8)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(ax + 18, ay);
  ctx.lineTo(ax + as, ay);
  ctx.lineTo(ax + as, ay + as - 18);
  ctx.lineTo(ax + as - 18, ay + as);
  ctx.lineTo(ax, ay + as);
  ctx.lineTo(ax, ay + 18);
  ctx.closePath();
  ctx.stroke();
  const emblem = input.emblem ? await loadImage(input.emblem) : null;
  if (emblem) ctx.drawImage(emblem, ax + as - 52, ay + as - 52, 64, 64);

  // Identité.
  const tx = ax + as + 36;
  const maxW = CARD_W - tx - 56;
  if (input.tag) {
    ctx.fillStyle = "#4be8ff";
    ctx.font = "600 22px 'JetBrains Mono', monospace";
    ctx.fillText(`[${input.tag}]`, tx, ay + 26);
  }
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(75,232,255,0.45)";
  ctx.shadowBlur = 18;
  fit(ctx, input.pseudo, maxW, "800", 64, "'Chakra Petch', sans-serif");
  ctx.fillText(input.pseudo, tx, ay + 88);
  ctx.shadowBlur = 0;
  const rankIcon = await loadImage(input.rankIcon);
  if (rankIcon) ctx.drawImage(rankIcon, tx, ay + 104, 34, 34);
  ctx.fillStyle = "#cbd5e1";
  ctx.font = "600 24px Inter, sans-serif";
  ctx.fillText(input.rank, tx + (rankIcon ? 44 : 0), ay + 130);
  // 5.15 : ascensions, cinq emplacements d'étoile après le rang.
  if ((input.ascensions ?? 0) > 0) {
    let sx = tx + (rankIcon ? 44 : 0) + ctx.measureText(input.rank).width + 28;
    const insignia = input.ascensionIcon ? await loadImage(input.ascensionIcon) : null;
    if (insignia) {
      ctx.drawImage(insignia, sx - 10, ay + 104, 34, 34);
      sx += 36;
    }
    for (let i = 0; i < 5; i++) {
      drawStar(ctx, sx + i * 26, ay + 121, 11, i < (input.ascensions ?? 0));
    }
    if (input.ascensionLabel) {
      ctx.fillStyle = "#ffd86b";
      ctx.font = "600 15px 'JetBrains Mono', monospace";
      ctx.fillText(input.ascensionLabel.toUpperCase(), sx + 5 * 26 + 6, ay + 127);
    }
  }
  if (input.title) {
    ctx.fillStyle = "#ffd86b";
    ctx.font = "italic 600 24px Inter, sans-serif";
    ctx.fillText(clipText(ctx, `« ${input.title} »`, maxW), tx, ay + 168);
  } else if (input.motto) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "italic 500 22px Inter, sans-serif";
    ctx.fillText(clipText(ctx, input.motto, maxW), tx, ay + 168);
  }

  // Chiffres clés : grille 3 × 2.
  const stats = input.stats.slice(0, 6);
  const cols = 3;
  const gap = 14;
  const boxW = (CARD_W - 112 - gap * (cols - 1)) / cols;
  const boxH = 84;
  stats.forEach((s, i) => {
    const x = 56 + (i % cols) * (boxW + gap);
    const y = 330 + Math.floor(i / cols) * (boxH + gap);
    ctx.fillStyle = "rgba(12,18,38,0.86)";
    ctx.fillRect(x, y, boxW, boxH);
    ctx.fillStyle = s.tone ?? "#4be8ff";
    ctx.fillRect(x, y, 4, boxH);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "600 14px 'JetBrains Mono', monospace";
    ctx.fillText(s.label.toUpperCase(), x + 20, y + 30);
    ctx.fillStyle = s.tone ?? "#ffffff";
    fit(ctx, s.value, boxW - 40, "700", 34, "'Chakra Petch', sans-serif");
    ctx.fillText(s.value, x + 20, y + 70);
  });

  // Titres gagnés en pastilles.
  let cx = 56;
  const cy = 540;
  ctx.font = "600 16px Inter, sans-serif";
  for (const t of input.titles.slice(0, 3)) {
    const label = clipText(ctx, t, 300);
    const w = ctx.measureText(label).width + 28;
    if (cx + w > CARD_W - 56) break;
    ctx.fillStyle = "rgba(255,216,107,0.1)";
    ctx.fillRect(cx, cy, w, 32);
    ctx.strokeStyle = "rgba(255,216,107,0.5)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx, cy, w, 32);
    ctx.fillStyle = "#ffd86b";
    ctx.fillText(label, cx + 14, cy + 22);
    cx += w + 10;
  }

  ctx.textAlign = "right";
  ctx.fillStyle = "#64748b";
  ctx.font = "500 16px 'JetBrains Mono', monospace";
  ctx.fillText(input.footer, CARD_W - 56, CARD_H - 40);
  ctx.textAlign = "left";
}
