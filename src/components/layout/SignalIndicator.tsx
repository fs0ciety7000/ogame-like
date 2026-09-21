import { useConnectionStore } from "@/store/connectionStore";

function Bars({ level, color }: { level: 0 | 1 | 2 | 3; color: string }) {
  const heights = [4, 7, 10];
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" className="shrink-0">
      {heights.map((h, i) => (
        <rect
          key={i}
          x={i * 6}
          y={12 - h}
          width="4"
          height={h}
          rx="1"
          fill={i < level ? color : "rgba(255,255,255,0.15)"}
        />
      ))}
    </svg>
  );
}

/** Reflète l'état réel de la connexion à Firestore (pas un simple point
 *  statique) : hors-ligne navigateur, données en cache local, ou données
 *  fraîches du serveur. */
export function SignalIndicator() {
  const { online, synced } = useConnectionStore();

  let level: 0 | 1 | 2 | 3;
  let color: string;
  let label: string;

  if (!online) {
    level = 0;
    color = "var(--color-danger-glow)";
    label = "Hors ligne";
  } else if (synced) {
    level = 3;
    color = "var(--color-mint-glow)";
    label = "Sync";
  } else {
    level = 1;
    color = "var(--color-gold-glow)";
    label = "Cache";
  }

  return (
    <span className="inline-flex items-center gap-1.5" title={label}>
      <Bars level={level} color={color} />
      <span className="hud-eyebrow" style={{ color }}>
        {label}
      </span>
    </span>
  );
}
