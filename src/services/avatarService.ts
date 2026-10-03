import { useEffect, useState } from "react";
import { pb } from "@/lib/pocketbase";

/* v5.1 : avatar de profil, stocké sur la fiche publique (collection profiles). */

export const AVATAR_SIZE = 256;

/** URL publique d'un avatar envoyé (vide si aucun). */
export function avatarUrl(uid: string, file: string | undefined | null): string {
  if (!uid || !file) return "";
  return pb.files.getURL({ id: uid, collectionName: "profiles" } as never, file);
}

/** Recadre au centre en carré 256 px, en WebP (≈ 20 ko). */
export async function squareAvatar(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("Choisis une image (PNG, JPEG ou WebP).");
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Ton navigateur ne peut pas préparer l'image.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
  if (!blob) throw new Error("Conversion de l'image impossible.");
  return blob;
}

export async function uploadAvatar(uid: string, file: File): Promise<string> {
  const blob = await squareAvatar(file);
  const form = new FormData();
  form.append("avatar", new File([blob], "avatar.webp", { type: blob.type || "image/webp" }));
  const rec = await pb.collection("profiles").update<{ avatar?: string }>(uid, form);
  return rec.avatar ?? "";
}

export async function removeAvatar(uid: string): Promise<void> {
  await pb.collection("profiles").update(uid, { avatar: null });
}

/** Avatar d'un joueur (lecture de sa fiche publique). */
export function useAvatar(uid: string | undefined): [string, (file: string) => void] {
  const [file, setFile] = useState("");
  useEffect(() => {
    if (!uid) return;
    let active = true;
    pb.collection("profiles")
      .getOne<{ avatar?: string }>(uid, { fields: "avatar" })
      .then((r) => active && setFile(r.avatar ?? ""))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [uid]);
  return [file, setFile];
}
