/** Nappe de nébuleuses en arrière-plan (dégradés radiaux flous, sans image
 *  externe) — apporte la profondeur atmosphérique des références spatiales
 *  sans dépendre d'assets photo. Toujours rendue derrière le Starfield. */
export function Nebula() {
  return (
    <div className="nebula-field" aria-hidden>
      <div
        className="nebula-blob"
        style={{
          top: "-10%",
          left: "-5%",
          width: "55vw",
          height: "55vw",
          background: "radial-gradient(circle, var(--color-cyan-glow) 0%, transparent 70%)",
        }}
      />
      <div
        className="nebula-blob"
        style={{
          bottom: "-15%",
          right: "-10%",
          width: "50vw",
          height: "50vw",
          background: "radial-gradient(circle, var(--color-ember-glow) 0%, transparent 70%)",
          animationDelay: "-8s",
        }}
      />
      <div
        className="nebula-blob"
        style={{
          top: "35%",
          right: "20%",
          width: "35vw",
          height: "35vw",
          background: "radial-gradient(circle, var(--color-mint-glow) 0%, transparent 70%)",
          opacity: 0.18,
          animationDelay: "-15s",
        }}
      />
    </div>
  );
}
