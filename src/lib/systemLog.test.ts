import { describe, expect, it } from "vitest";
import { isHostileFleetNotification } from "@/lib/notificationCategories";
import { systemLogStyle } from "@/lib/systemLog";
import type { NotificationKind } from "@/types/game";

/* 6.14.77 (É30-1f, écart 6 de 6.14.70) : Journal système, couleur = sens. */

const n = (kind: NotificationKind, title: string, message = "") => ({ kind, title, message });

describe("Journal système : flottes", () => {
  it("un retour de flotte ou un saut réussi n'est plus une alerte rouge", () => {
    for (const note of [
      n("fleet", "Saut réussi", "Saut réussi : ta patrouille est à quai. Prochain saut dans 22 h."),
      n("fleet", "Patrouille terminée", "Ta flotte en patrouille est rentrée à la base."),
      n("fleet", "Transport rentré", "Tes vaisseaux de transport sont revenus de Nyx."),
      n("fleet", "Livraison effectuée", "1 200 ressources livrées à Rempart-Sud."),
      n("fleet", "Renforts en approche", "Vega t'envoie une garnison de 12 vaisseaux pour 6 h."),
      n("fleet", "Expédition terminée", "Ta flotte est rentrée : 300 ferraille et +40 XP."),
      n("fleet", "Tribut payé", "Le Varan te laisse en paix… pour l'instant."),
    ]) {
      expect(isHostileFleetNotification(note), note.title).toBe(false);
      const style = systemLogStyle(note);
      expect(style.level, note.title).toBe("INFO");
      expect(style.className, note.title).not.toContain("danger");
    }
  });

  it("une attaque entrante, un raid ou une garnison au combat reste une alerte rouge", () => {
    for (const note of [
      n("fleet", "Flotte hostile en approche !", "Orion t'envoie 40 vaisseaux : impact dans 78 min. Renforce tes défenses !"),
      n("fleet", "Le Collecteur arrive", "Tu n'as pas répondu au Varan : raid dans 60 min."),
      n("fleet", "Tu as refusé", "Le Collecteur est en route : impact dans 60 min. Prépare-toi !"),
      n("fleet", "Ultimatum du Varan", "Le Varan exige 5 000 ressources. Réponds avant 12 h."),
      n("fleet", "Ta garnison a combattu", "Attaque de Orion contre Vega : 3 vaisseau(x) perdu(s)."),
    ]) {
      expect(isHostileFleetNotification(note), note.title).toBe(true);
      expect(systemLogStyle(note)).toEqual({ level: "ALERTE", className: "text-danger-glow" });
    }
  });

  it("les autres genres gardent leur niveau", () => {
    expect(systemLogStyle(n("combat-defender", "Attaque subie"))).toEqual({ level: "WARN", className: "text-ember-glow" });
    expect(systemLogStyle(n("building", "Chantier terminé"))).toEqual({ level: "SUCCESS", className: "text-mint-glow" });
    // Un texte « hostile » hors du genre flotte ne change rien.
    expect(systemLogStyle(n("alliance", "Phalange : allié menacé", "impact dans 12 min")).level).toBe("ALLIANCE");
  });
});
