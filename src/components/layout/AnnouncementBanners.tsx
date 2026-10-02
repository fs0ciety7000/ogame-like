import { Fragment } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CalendarClock, Megaphone, Siren, X } from "lucide-react";
import { useNowTicker } from "@/hooks/useNowTicker";
import { dismissBanner, useBannerStore } from "@/services/bannerService";
import { BANNER_KINDS, parseBannerText, visibleBanners, type Banner, type BannerKind } from "@/game/banners";
import { cn } from "@/lib/utils";

/* Bandeaux d'annonce en haut du site (v3.7), réglés dans l'administration. */

const STYLE: Record<BannerKind, { color: string; icon: typeof Megaphone }> = {
  info: { color: "var(--color-cyan-glow)", icon: Megaphone },
  event: { color: "var(--color-violet-glow)", icon: CalendarClock },
  alert: { color: "var(--color-ember-glow)", icon: AlertTriangle },
  critical: { color: "var(--color-danger-glow)", icon: Siren },
};

export function BannerText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {parseBannerText(text).map((t, i) => {
        if (t.type === "bold") return <strong key={i} className="font-semibold text-white">{t.text}</strong>;
        if (t.type === "link") {
          const cls = "font-semibold text-[var(--banner-color)] underline decoration-dotted underline-offset-4 hover:decoration-solid";
          return t.internal ? (
            <Link key={i} to={t.href} className={cls}>
              {t.text}
            </Link>
          ) : (
            <a key={i} href={t.href} target="_blank" rel="noopener noreferrer" className={cls}>
              {t.text}
            </a>
          );
        }
        return <Fragment key={i}>{t.text}</Fragment>;
      })}
    </span>
  );
}

export function BannerStrip({ banner, onDismiss }: { banner: Banner; onDismiss?: () => void }) {
  const { color, icon: Icon } = STYLE[banner.kind];
  // Vitesse de défilement constante, quelle que soit la longueur du texte.
  const duration = Math.max(14, Math.round(banner.text.length * 0.28));
  return (
    <div
      role={banner.kind === "critical" || banner.kind === "alert" ? "alert" : "status"}
      style={{ "--banner-color": color, "--banner-duration": `${duration}s` } as React.CSSProperties}
      className="relative z-30 flex items-stretch overflow-hidden border-b border-[color-mix(in_srgb,var(--banner-color)_45%,transparent)] bg-[color-mix(in_srgb,var(--banner-color)_9%,var(--color-space-950))] text-xs text-slate-200 sm:text-[13px]"
    >
      <span aria-hidden className="banner-scan pointer-events-none absolute inset-y-0 left-0 w-1/3" />
      <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--banner-color)] to-transparent opacity-60" />
      {/* Étiquette du type, coin coupé */}
      <span className="relative flex shrink-0 items-center gap-1.5 bg-[var(--banner-color)] py-1.5 pl-3 pr-5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-space-950 [clip-path:polygon(0_0,100%_0,calc(100%-10px)_100%,0_100%)] sm:pl-4">
        <Icon className={cn("h-3.5 w-3.5", banner.kind === "critical" && "animate-pulse")} />
        <span className="max-sm:hidden">{BANNER_KINDS[banner.kind].label}</span>
      </span>
      <div className="relative min-w-0 flex-1 self-center overflow-hidden px-3 py-1.5">
        {banner.scrolling ? (
          <div className="banner-marquee">
            {[0, 1].map((copy) => (
              <span key={copy} aria-hidden={copy === 1} className="shrink-0 whitespace-nowrap pr-24">
                <BannerText text={banner.text} />
              </span>
            ))}
          </div>
        ) : (
          <BannerText text={banner.text} className="block break-words leading-snug" />
        )}
      </div>
      {onDismiss && banner.dismissible && (
        <button type="button" onClick={onDismiss} aria-label="Masquer cette annonce" className="shrink-0 px-3 text-slate-400 transition-colors hover:text-white">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/** Bandeaux actifs, les plus graves d'abord (3 au plus). */
export function AnnouncementBanners({ publicOnly = false }: { publicOnly?: boolean }) {
  useNowTicker();
  const banners = useBannerStore((s) => s.banners);
  const dismissed = useBannerStore((s) => s.dismissed);
  const shown = visibleBanners(banners, Date.now(), { dismissed, publicOnly });
  if (shown.length === 0) return null;
  return (
    <div className="shrink-0">
      {shown.map((b) => (
        <BannerStrip key={b.id} banner={b} onDismiss={() => dismissBanner(b)} />
      ))}
    </div>
  );
}
