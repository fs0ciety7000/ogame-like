import { useEffect, useState } from "react";
import { HomePlanet } from "@/components/game/HomePlanet";
import { normalizePlanetLook, type PlanetLook } from "@/game/planetLook";
import { profileStyle } from "@/game/profile";
import { fetchPublicPlanet } from "@/services/playerService";
import { usePlayerStore } from "@/store/playerStore";

/** 5.16 : planète personnalisée d'un joueur (la sienne : son choix en direct ; les autres : leur vitrine publique). */
export function PublicPlanet({
  uid,
  size = 36,
}: {
  uid: string;
  size?: number;
}) {
  const me = usePlayerStore((s) => s.player);
  const isMe = me?.uid === uid;
  const [look, setLook] = useState<PlanetLook | null>(null);
  useEffect(() => {
    if (isMe) return;
    let alive = true;
    setLook(null);
    void fetchPublicPlanet(uid).then(
      (l) => alive && setLook(l ? normalizePlanetLook(l) : null),
    );
    return () => {
      alive = false;
    };
  }, [uid, isMe]);
  const shown = isMe && me ? profileStyle(me).planet : look;
  if (!shown) return null;
  return (
    <HomePlanet
      buildings={isMe && me ? me.buildings : {}}
      size={size}
      look={shown}
    />
  );
}
