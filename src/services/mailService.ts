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

type MailBody = { subject: string; html: string; text: string; fromName?: string };

function call<T>(body: Record<string, unknown>): Promise<T> {
  return pb.send<T>("/api/cosmic/admin/mail", { method: "POST", body: { apiUrl: pb.baseURL, ...body } }).catch((err) => {
    throw new Error((err as { response?: { message?: string } })?.response?.message || "Envoi impossible.");
  });
}

export const mailCount = () => call<{ recipients: number; optedOut: number; smtp: boolean }>({ action: "count" });
export const mailTest = (m: MailBody, to?: string) => call<{ sent: number; to: string }>({ action: "test", to, ...m });
export const mailSend = (m: MailBody) => call<{ sent: number; failed: number; failedPseudos: string[] }>({ action: "send", confirm: "ENVOYER", ...m });

/** Préférence du joueur (Réglages). */
export async function setEmailOptOut(uid: string, optOut: boolean) {
  await pb.collection("players").update(uid, { emailOptOut: optOut });
}

/** v4.0 : notifications d'alliance (canal, canal diplomatique, annonces). */
export async function setNotifPrefs(uid: string, prefs: { allianceChat?: boolean; pactMessages?: boolean; allianceEvents?: boolean }) {
  await pb.collection("players").update(uid, { notifPrefs: prefs });
}
