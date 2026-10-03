import { assetUrl } from "@/lib/assets";

/* =====================================================
   Carte de victoire (v4.1) : image 1200 × 630 dessinée dans le navigateur
   (bannière du joueur, emblème, chiffres du combat), à télécharger ou à
   partager par un lien qui s'affiche en aperçu sur les réseaux.
===================================================== */

export interface VictoryCardInput {
  /** « VICTOIRE », « DÉFENSE HÉROÏQUE »… */
  headline: string;
  /** « contre [KRN] Vorn » */
  subtitle: string;
  pseudo: string;
  tag?: string;
  rank: string;
  banner: { image?: string; gradient?: string };
  emblem: string;
  stats: { label: string; value: string }[];
  footer: string;
}

export const CARD_W = 1200;
export const CARD_H = 630;

export function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = assetUrl(src);
  });
}

/** Dégradé CSS « linear-gradient(120deg, #a 0%, #b 50%, …) » → dégradé canvas. */
export function paintGradient(ctx: CanvasRenderingContext2D, css: string) {
  const stops = [...css.matchAll(/(#[0-9a-fA-F]{3,8})\s+(\d+)%/g)];
  const g = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  if (stops.length === 0) {
    g.addColorStop(0, "#0b1430");
    g.addColorStop(1, "#1d2a6b");
  } else for (const [, color, pct] of stops) g.addColorStop(Number(pct) / 100, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
}

export function cover(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  const r = Math.max(CARD_W / img.width, CARD_H / img.height);
  const w = img.width * r;
  const h = img.height * r;
  ctx.drawImage(img, (CARD_W - w) / 2, (CARD_H - h) / 2, w, h);
}

export async function drawVictoryCard(canvas: HTMLCanvasElement, input: VictoryCardInput): Promise<void> {
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d")!;
  await document.fonts?.ready;

  // Fond : bannière du joueur (image ou dégradé), assombrie à gauche.
  const bannerImg = input.banner.image ? await loadImage(input.banner.image) : null;
  if (bannerImg) cover(ctx, bannerImg);
  else paintGradient(ctx, input.banner.gradient ?? "");
  const shade = ctx.createLinearGradient(0, 0, CARD_W, 0);
  shade.addColorStop(0, "rgba(3,4,10,0.94)");
  shade.addColorStop(0.62, "rgba(3,4,10,0.72)");
  shade.addColorStop(1, "rgba(3,4,10,0.25)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Cadre HUD.
  ctx.strokeStyle = "rgba(75,232,255,0.55)";
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, CARD_W - 36, CARD_H - 36);
  ctx.fillStyle = "#4be8ff";
  for (const [x, y, dx, dy] of [[18, 18, 1, 1], [CARD_W - 18, 18, -1, 1], [18, CARD_H - 18, 1, -1], [CARD_W - 18, CARD_H - 18, -1, -1]]) {
    ctx.fillRect(x, y, 46 * dx, 6 * dy);
    ctx.fillRect(x, y, 6 * dx, 46 * dy);
  }

  // Logo et nom du jeu.
  const logo = await loadImage("/assets/logo/logo.webp");
  if (logo) ctx.drawImage(logo, 56, 48, 52, 52);
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "700 22px 'Chakra Petch', sans-serif";
  ctx.fillText("COSMIC EMPIRES", 120, 82);

  // Titre.
  ctx.fillStyle = "#ffd86b";
  ctx.shadowColor = "rgba(255,216,107,0.55)";
  ctx.shadowBlur = 24;
  ctx.font = "800 84px 'Chakra Petch', sans-serif";
  ctx.fillText(input.headline.toUpperCase(), 56, 210);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "600 34px Inter, sans-serif";
  ctx.fillText(input.subtitle, 58, 262);

  // Joueur : emblème, pseudo, rang.
  const emblem = await loadImage(input.emblem);
  if (emblem) ctx.drawImage(emblem, 56, 300, 96, 96);
  ctx.fillStyle = "#4be8ff";
  ctx.font = "600 22px 'JetBrains Mono', monospace";
  ctx.fillText(input.tag ? `[${input.tag}]` : "", 170, 336);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 40px 'Chakra Petch', sans-serif";
  ctx.fillText(input.pseudo, 170, 378);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "500 22px Inter, sans-serif";
  ctx.fillText(input.rank, 170, 408);

  // Chiffres du combat.
  const stats = input.stats.slice(0, 4);
  const boxW = 250;
  stats.forEach((s, i) => {
    const x = 56 + i * (boxW + 14);
    const y = 448;
    ctx.fillStyle = "rgba(16,22,43,0.85)";
    ctx.fillRect(x, y, boxW, 104);
    ctx.fillStyle = "#4be8ff";
    ctx.fillRect(x, y, 4, 104);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "600 16px 'JetBrains Mono', monospace";
    ctx.fillText(s.label.toUpperCase(), x + 20, y + 36);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 36px 'Chakra Petch', sans-serif";
    ctx.fillText(s.value, x + 20, y + 82);
  });

  ctx.fillStyle = "#64748b";
  ctx.font = "500 18px 'JetBrains Mono', monospace";
  ctx.fillText(input.footer, 58, CARD_H - 44);
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Image impossible à créer."))), "image/jpeg", 0.88));
}
