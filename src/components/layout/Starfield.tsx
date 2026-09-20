import { useMemo } from "react";

export function Starfield({ count = 120 }: { count?: number }) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: 1.5 + Math.random() * 2.5,
        duration: 2 + Math.random() * 2.5,
        delay: Math.random() * 3,
      })),
    [count],
  );

  return (
    <div className="starfield" aria-hidden>
      {stars.map((s) => (
        <span
          key={s.id}
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
