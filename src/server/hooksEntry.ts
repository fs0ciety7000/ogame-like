/* Point d'entrée compilé pour les hooks PocketBase (npm run build:hooks →
 * pocketbase/pb_hooks/cosmic_game.js). Uniquement de la logique pure :
 * les lectures/écritures en base sont faites par pb_hooks/cosmic.pb.js. */
export { performAttack } from "@/game/attack";
export { GAME_FIELDS, QUEUE_FIELDS } from "@/game/playerFields";
export { PVP_RULES } from "@/game/pvp";
export { applyGameContent, CONTENT_SECTIONS } from "@/game/content";
