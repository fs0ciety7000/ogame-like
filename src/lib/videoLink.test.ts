import { describe, expect, it } from "vitest";
import { isVideoLink } from "@/lib/videoLink";

describe("5.24 : vidéos dans les messages", () => {
  it("reconnaît les vidéos du jeu et les liens https", () => {
    expect(isVideoLink("/assets/video/presentation.mp4")).toBe(true);
    expect(isVideoLink("https://exemple.org/clip.webm")).toBe(true);
    expect(isVideoLink("https://exemple.org/clip.mp4?t=3")).toBe(true);
  });
  it("refuse le reste", () => {
    expect(isVideoLink("http://exemple.org/clip.mp4")).toBe(false);
    expect(isVideoLink("https://exemple.org/page")).toBe(false);
    expect(isVideoLink("/assets/../secret.mp4")).toBe(false);
    expect(isVideoLink("javascript:alert(1).mp4")).toBe(false);
  });
});
