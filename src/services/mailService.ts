import { pb } from "@/lib/pocketbase";

/* Campagnes e-mail (v3.9.2) : modèles servis par le jeu (public/emails),
   envoi par le serveur (SMTP de PocketBase). */

export interface MailCampaign {
  id: string;
  title: string;
  subject: string;
  fromName?: string;
  html: string;
  text: string;
}

export async function listCampaigns(): Promise<MailCampaign[]> {
  const res = await fetch(`/emails/index.json?t=${Date.now()}`);
  if (!res.ok) return [];
  return (await res.json()) as MailCampaign[];
}

export async function loadCampaign(c: MailCampaign): Promise<{ html: string; text: string }> {
  const [html, text] = await Promise.all([fetch(c.html).then((r) => r.text()), fetch(c.text).then((r) => (r.ok ? r.text() : ""))]);
  return { html, text };
}

import { campaignsState, MAIL_CAMPAIGNS_KEY, MAIL_SCHEDULE_KEY, scheduleState, type MailSegment, type ScheduledCampaign, type SentCampaign } from "@/game/mailSegments";

type MailBody = { subject: string; html: string; text: string; fromName?: string; segment?: MailSegment };

function call<T>(body: Record<string, unknown>): Promise<T> {
  return pb.send<T>("/api/cosmic/admin/mail", { method: "POST", body: { apiUrl: pb.baseURL, ...body } }).catch((err) => {
    throw new Error((err as { response?: { message?: string } })?.response?.message || "Envoi impossible.");
  });
}

export const mailCount = (segment?: MailSegment) => call<{ recipients: number; optedOut: number; smtp: boolean; queued?: number }>({ action: "count", segment });
/** 5.16 : envoi programmé (traité toutes les 5 min par le serveur) et annulation. */
export const mailSchedule = (m: MailBody, sendAtMs: number) => call<{ id: string; sendAtMs: number }>({ action: "schedule", sendAtMs, ...m });
export const mailUnschedule = (id: string) => call<{ ok: boolean }>({ action: "unschedule", id });
export const mailTest = (m: MailBody, to?: string) => call<{ sent: number; to: string }>({ action: "test", to, ...m });
/** 6.14.111 (AC-7) : la campagne entre en file ; le serveur l'envoie par lots chaque minute. */
export const mailSend = (m: MailBody) => call<{ queued: number; campaignId: string }>({ action: "send", confirm: "ENVOYER", ...m });
/** Un lot de la file tout de suite (même chemin que la cadence minute). */
export const mailQueueTick = () => call<{ sent: number; queued: number }>({ action: "tick" });

/** Préférence du joueur (Réglages). */
export async function setEmailOptOut(uid: string, optOut: boolean) {
  await pb.collection("players").update(uid, { emailOptOut: optOut });
}

/** v4.0 : notifications d'alliance (canal, canal diplomatique, annonces). */
export async function setNotifPrefs(uid: string, prefs: { allianceChat?: boolean; pactMessages?: boolean; allianceEvents?: boolean; warlords?: boolean; mentions?: boolean }) {
  await pb.collection("players").update(uid, { notifPrefs: prefs });
}

/** 5.16 : historique des campagnes (ouvertures, clics) et envois programmés. */
export async function loadMailState(): Promise<{ campaigns: SentCampaign[]; scheduled: ScheduledCampaign[] }> {
  const read = async (key: string) => {
    try {
      return (await pb.collection("game_config").getFirstListItem<{ data: unknown }>(pb.filter("key = {:key}", { key }))).data;
    } catch {
      return null;
    }
  };
  const [c, s] = await Promise.all([read(MAIL_CAMPAIGNS_KEY), read(MAIL_SCHEDULE_KEY)]);
  return { campaigns: campaignsState(c).list, scheduled: scheduleState(s).list };
}
