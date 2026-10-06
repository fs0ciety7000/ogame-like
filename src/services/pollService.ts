import { pb } from "@/lib/pocketbase";
import type { PollResults } from "@/game/polls";

/* 5.26 : sondages des annonces (lecture des résultats, vote). */

export function fetchPollResults(id: string): Promise<PollResults> {
  return pb.send<PollResults>(`/api/cosmic/poll?id=${encodeURIComponent(id)}`, { requestKey: null });
}

export async function votePoll(id: string, choice: number): Promise<PollResults> {
  try {
    return await pb.send<PollResults>("/api/cosmic/poll", { method: "POST", body: { id, choice } });
  } catch (err) {
    throw new Error((err as { response?: { message?: string } })?.response?.message || "Vote impossible.");
  }
}
