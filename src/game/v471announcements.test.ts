import { describe, expect, it } from "vitest";
import { addSeenAnnouncements, nextAnnouncement, SEEN_LIMIT } from "@/game/announcements";
import { performPlayerAction } from "@/game/actions";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";

describe("v4.7.1 : annonces vues sur le compte", () => {
  const list = [{ id: "v4.7" }, { id: "v4.6" }, { id: "v4.5" }];

  it("montre la plus récente non vue et marque aussi les plus anciennes", () => {
    expect(nextAnnouncement(list, [])).toEqual({ show: list[0], markIds: ["v4.7", "v4.6", "v4.5"] });
    // Plus de défilé : une fois la 4.7 fermée, rien ne revient.
    expect(nextAnnouncement(list, ["v4.7", "v4.6", "v4.5"])).toBeNull();
    // Une nouvelle annonce en tête : seule elle s'affiche.
    expect(nextAnnouncement([{ id: "v4.8" }, ...list], ["v4.7", "v4.6", "v4.5"])).toEqual({ show: { id: "v4.8" }, markIds: ["v4.8", "v4.7", "v4.6", "v4.5"] });
  });

  it("filtre les identifiants et garde les 120 derniers", () => {
    expect(addSeenAnnouncements(["a"], ["a", "b", 3, "x y", "<script>"])).toEqual(["a", "b"]);
    const many = Array.from({ length: 200 }, (_, i) => `id-${i}`);
    const out = addSeenAnnouncements([], many);
    expect(out).toHaveLength(SEEN_LIMIT);
    expect(out[out.length - 1]).toBe("id-199");
  });

  it("l'action seenAnnouncements enregistre sur le joueur", () => {
    const player = defaultPlayerState("u1", "Testeur");
    const queues = defaultQueues();
    const out = performPlayerAction(player, queues, { type: "seenAnnouncements", ids: ["v4.7-coalitions", "v4.6-social"] }, Date.now());
    expect(out.player.announcementsSeen).toEqual(["v4.7-coalitions", "v4.6-social"]);
  });
});
