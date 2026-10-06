import { PollCard } from "@/components/game/PollCard";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { create } from "zustand";
import { Skull } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { accent } from "@/components/game/PirateUltimatum";
import { activeUltimatum, FACTIONS } from "@/game/pirates";
import { usePlayerStore } from "@/store/playerStore";
import { assetUrl } from "@/lib/assets";
import { nextAnnouncement, scheduledAnnouncements, type AnnouncementSettings, type CustomAnnouncement } from "@/game/announcements";
import { markAnnouncementsSeen } from "@/services/playerService";
import { previewAnnouncement, useAnnouncementPreview, useAnnouncementSettings } from "@/services/announcementService";
import { useContentStore } from "@/services/contentService";
import { cn } from "@/lib/utils";

/* =====================================================
   Annonces plein écran (style bande-annonce d'extension), affichées une
   seule fois par compte et par appareil. Pour en ajouter une : nouvelle
   entrée en tête de ANNOUNCEMENTS, avec un identifiant inédit.
===================================================== */

export interface Announcement {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  /** Factions mises en avant (illustrations en fond). */
  factions: string[];
  /** Illustration de fond quand l'annonce ne présente pas de factions. */
  art?: string;
  artMobile?: string;
  /** Nouveautés présentées en cartes cliquables (icône facultative). */
  features?: { title: string; text: string; to: string; image?: string }[];
  cta: { label: string; to: string };
  /** v3.9 : teinte de l'annonce (menace rouge par défaut, ambre pour un allié). */
  tone?: "danger" | "gold";
  /** v3.9 : portrait mis en avant à droite (bureau), avec sa légende. */
  spotlight?: { image: string; name: string; role: string; quote: string };
  /** v3.9 : nouvelle monnaie présentée en encart. */
  currency?: { icon: string; name: string; text: string };
  /** v3.9 : emblème affiché à côté du surtitre. */
  emblem?: string;
  /** 5.26 : sondage communautaire (annonces de l'administration). */
  poll?: import("@/game/polls").Poll | null;
}

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "v5.7-recap",
    eyebrow: "Mise à jour 5.7 · Le grand récapitulatif",
    title: "Ton empire a changé d'échelle",
    text: "Depuis la 4.9 : des colonies à biomes, des sagas d'alliance, un marché qui ne dort jamais, des chapitres écrits d'après vos parties. Et maintenant, une page qui met tout ton empire en chiffres, avec une carte à partager.",
    factions: [],
    tone: "gold",
    art: "/assets/story/v5-recap.webp",
    artMobile: "/assets/story/v5-recap.webp",
    emblem: "/assets/story/choeur-emblem.webp",
    features: [
      { title: "Statistiques et cartes", text: "Tout l'empire sur une page, export CSV ou PDF, carte d'empire et de profil à partager sur Discord.", to: "/game/statistiques", image: "/assets/logo/logo.webp" },
      { title: "Alliances", text: "24 secteurs à tenir, guerres de saison, coffre de guerre et une saga par mois aux objectifs communs.", to: "/game/alliance?onglet=saga", image: "/assets/story/gravhorn.webp" },
      { title: "Commerce", text: "Ordres d'achat, contrats de livraison et le Courtier du Comptoir quand personne ne vend.", to: "/game/marche", image: "/assets/warlords/kragmor-sceau.webp" },
      { title: "Colonies", text: "Un biome et son gisement rare par colonie, et tous les bonus de l'empire appliqués là-bas aussi.", to: "/game/colonies", image: "/assets/buildings/gisement_aiFragment.webp" },
      { title: "Chapitres vivants", text: "Un chapitre par mois écrit d'après vos exploits, avec titres, bannières et page Formules.", to: "/game/passe", image: "/assets/chronicles/2026-10-sceau.webp" },
      { title: "Fin de partie", text: "Talents d'Ascension, reliques mythiques, série de connexion et officiers qui progressent partout.", to: "/game/etat-major", image: "/assets/buildings/fonderie_quantique.webp" },
    ],
    cta: { label: "Voir mes statistiques", to: "/game/statistiques" },
  },
  {
    id: "v4.9-alliance",
    eyebrow: "Mise à jour 4.9 · Organisation",
    title: "Chaque matin, un cap commun",
    text: "À 6 h, ton alliance reçoit trois objectifs ; les officiers choisissent, tout le monde s'y met avant minuit. Et tes chantiers s'enchaînent seuls grâce à la file planifiée, même quand tu dors.",
    factions: [],
    tone: "gold",
    art: "/assets/buildings/fonderie_quantique.webp",
    artMobile: "/assets/buildings/fonderie_quantique.webp",
    emblem: "/assets/warlords/ilyon-sceau.webp",
    features: [
      { title: "Objectif du jour", text: "Vote des officiers de 6 h à 10 h : +15 points, 1 h de production, 10 % au trésor.", to: "/game/alliance?onglet=objectif" },
      { title: "File planifiée", text: "Jusqu'à 3 améliorations programmées, lancées seules (Fonderie quantique 5 et 10).", to: "/game/batiments", image: "/assets/buildings/fonderie_quantique.webp" },
      { title: "Diplomates et calendrier", text: "Deux diplomates pour les pactes et les guerres, et tous les rendez-vous de l'alliance.", to: "/game/alliance?onglet=calendrier" },
    ],
    cta: { label: "Voir l'objectif du jour", to: "/game/alliance?onglet=objectif" },
  },
  {
    id: "v4.8-codex",
    eyebrow: "Mise à jour 4.8 · Archives",
    title: "Le secteur a sa mémoire",
    text: "Chaque faction croisée, chaque seigneur affronté, chaque boss abattu ajoute une fiche à ton Codex. Et au marché, les prix des trente derniers jours démasquent les offres trop belles pour être vraies.",
    factions: [],
    tone: "gold",
    art: "/assets/chronicles/2026-10-boss.webp",
    artMobile: "/assets/warlords/brannoc.webp",
    emblem: "/assets/leviathan/leviathan-emblem.webp",
    features: [
      { title: "Codex", text: "Fiches illustrées à débloquer en jouant. À 100 %, le titre « Archiviste ».", to: "/game/codex", image: "/assets/warlords/brannoc-sceau.webp" },
      { title: "Prix du marché", text: "Courbe des 30 derniers jours par ressource, badge « Prix anormal ».", to: "/game/marche" },
      { title: "Spectacle", text: "Intro de combat, colonies en orbite, portraits vivants, neige d'hiver.", to: "/game" },
    ],
    cta: { label: "Ouvrir le Codex", to: "/game/codex" },
  },
  {
    id: "v4.7-coalitions",
    eyebrow: "Mise à jour 4.7 · Coalitions",
    title: "Le secteur fait front",
    text: "Quand un seigneur de guerre devient trop fort, tout le secteur se ligue contre lui : cinq jours pour le briser ensemble. Et si tu t'es trompé de chantier, tu peux maintenant l'annuler.",
    factions: [],
    tone: "danger",
    art: "/assets/story/varan.webp",
    artMobile: "/assets/warlords/zharkesh.webp",
    emblem: "/assets/warlords/zharkesh-sceau.webp",
    spotlight: {
      image: "/assets/bounties/vashka.webp",
      name: "Vashka",
      role: "Matriarche-Chasseuse",
      quote: "Un seigneur trop gros pour un seul empire ? Alors frappons tous ensemble.",
    },
    features: [
      { title: "Coalitions", text: "Seigneur 1,5 × plus fort que le meilleur joueur pendant 48 h : 5 jours pour le briser, +50 points, reliques épiques.", to: "/game/seigneurs", image: "/assets/warlords/brannoc-sceau.webp" },
      { title: "Annuler un chantier", text: "100 % la première minute, sinon 80 % du temps restant : bâtiments, Labo, unités, colonies.", to: "/game/batiments" },
      { title: "Chroniques d'hiver", text: "Janvier à mars : Kragmor, le Chœur brisé et les racines de Maru.", to: "/game/passe", image: "/assets/warlords/maru.webp" },
    ],
    cta: { label: "Voir les seigneurs", to: "/game/seigneurs" },
  },
  {
    id: "v4.6-social",
    eyebrow: "Mise à jour 4.6 · Social",
    title: "Un boss pour ton alliance",
    text: "Chaque semaine, ton alliance peut appeler son propre boss et l'abattre en 24 h. Et chaque lundi, la Gazette du secteur raconte qui a brillé, qui a pillé, et qui est tombé.",
    factions: [],
    tone: "danger",
    art: "/assets/story/gravhorn.webp",
    artMobile: "/assets/story/varan.webp",
    emblem: "/assets/leviathan/leviathan-emblem.webp",
    currency: {
      icon: "/assets/relics/egide_reine.webp",
      name: "Boss d'alliance",
      text: "Appelé par un officier, payé par le trésor : +40 points de passe et 2 h de production pour chaque membre qui a compté, relique rare pour le premier.",
    },
    features: [
      { title: "Boss d'alliance", text: "Cuirassé Gravhorn, Nid-mère Kesh'Vaar, Croiseur de la Confrérie : un par semaine, 24 h pour l'abattre.", to: "/game/alliance?onglet=boss", image: "/assets/story/gravhorn.webp" },
      { title: "La Gazette", text: "Chaque lundi à 9 h : boss, vendettas, guerres, progressions et casse de la semaine.", to: "/game/gazette" },
      { title: "Canal vivant", text: "Point vert pour les membres en ligne, « … écrit » quand quelqu'un tape.", to: "/game/alliance" },
    ],
    cta: { label: "Voir le boss d'alliance", to: "/game/alliance?onglet=boss" },
  },
  {
    id: "v4.5-confort",
    eyebrow: "Mise à jour 4.5 · Confort",
    title: "Ton poste de commandement, à ta façon",
    text: "Épingle tes pages favorites dans la barre du bas, réorganise l'accueil, et garde toujours un œil sur tes chantiers. Sur téléphone, les fenêtres montent du bas et se ferment d'un glissement.",
    factions: [],
    tone: "gold",
    art: "/assets/buildings/hangar_attaque.webp",
    artMobile: "/assets/buildings/synthetiseur_neuronal.webp",
    features: [
      { title: "Barre du bas sur mesure", text: "Menu Plus → Épingler : choisis tes 4 pages.", to: "/game" },
      { title: "File de chantier", text: "Construction, recherche, chantier naval, mission : toujours en haut de l'accueil.", to: "/game" },
      { title: "Accueil personnalisable", text: "Remonte, descends ou masque chaque carte.", to: "/game" },
    ],
    cta: { label: "Personnaliser", to: "/game" },
  },
  {
    id: "v4.4-spectacle",
    eyebrow: "Mise à jour 4.4 · Spectacle",
    title: "Ton empire prend vie",
    text: "Chaque palier de bâtiment se fête en plein écran, la galaxie respire sous tes flottes, et le secteur a enfin une voix : sirènes, fanfares et ambiance propre à ton thème.",
    factions: [],
    tone: "gold",
    art: "/assets/buildings/fonderie_quantique.webp",
    artMobile: "/assets/buildings/extracteur_ferraille.webp",
    features: [
      { title: "Paliers en plein écran", text: "Niveaux 5, 10, 15 et 20 : balayage lumineux, nouveau cadre et bonus gagné.", to: "/game/batiments", image: "/assets/buildings/extracteur_ferraille.webp" },
      { title: "Galaxie vivante", text: "Étoiles en parallaxe, routes cyan, rouges ou ambre, heure d'arrivée au survol.", to: "/game/galaxie" },
      { title: "Son", text: "Victoire, défaite, alertes, ambiance par thème : un volume par catégorie dans les Réglages.", to: "/game/reglages" },
    ],
    cta: { label: "Régler le son", to: "/game/reglages" },
  },
  {
    id: "v4.3-chroniques",
    eyebrow: "Mise à jour 4.3 · Chroniques",
    title: "Chaque mois, une histoire",
    text: "Quatre épisodes par mois, racontés par ceux qui font le secteur. Et le dernier week-end, le boss de la chronique surgit : tout le serveur frappe ensemble. En octobre, Varan a rouvert sa Liste.",
    factions: [],
    tone: "gold",
    art: "/assets/chronicles/2026-10-boss.webp",
    artMobile: "/assets/chronicles/2026-10-boss.webp",
    emblem: "/assets/chronicles/2026-10-sceau.webp",
    spotlight: {
      image: "/assets/bounties/vashka.webp",
      name: "Vashka",
      role: "Matriarche-Chasseuse",
      quote: "Varan n'a pas digéré sa défaite. Il a rouvert la Liste, et ton nom est dessus.",
    },
    currency: {
      icon: "/assets/chronicles/2026-10-sceau.webp",
      name: "Boss de saison",
      text: "Vendredi 30 octobre 18 h → dimanche 23 h : +60 points de passe pour tous, et s'il tombe, titre « Pourfendeur », sceau unique et relique épique pour le podium.",
    },
    features: [
      { title: "Chroniques", text: "Un épisode le 1er, le 8, le 15 et le 22 : un dialogue, un objectif, +40 points de passe.", to: "/game/passe", image: "/assets/story/varan.webp" },
      { title: "Boss de saison", text: "Le dernier week-end du mois, le Vaisseau-Liste de Varan. Assauts toutes les 4 h, classement des dégâts.", to: "/game/boss", image: "/assets/chronicles/2026-10-sceau.webp" },
      { title: "Habillage du mois", text: "Une teinte par chronique sur le fond et la nébuleuse, à couper dans les Réglages.", to: "/game/reglages" },
    ],
    cta: { label: "Lire l'épisode 1", to: "/game/passe" },
  },
  {
    id: "v4.2-seigneurs",
    eyebrow: "Mise à jour 4.2 · Seigneurs de guerre",
    title: "Le secteur n'est plus vide",
    text: "Dix seigneurs de guerre ont planté leur bannière dans la galaxie. Ils grandissent avec vous, pillent les imprudents, commercent avec les autres, et n'oublient jamais une offense. À vous de choisir : les ignorer, les piller… ou leur déclarer une vendetta.",
    factions: [],
    tone: "danger",
    art: "/assets/story/varan.webp",
    artMobile: "/assets/warlords/zharkesh.webp",
    emblem: "/assets/warlords/brannoc-sceau.webp",
    spotlight: {
      image: "/assets/warlords/brannoc.webp",
      name: "Brannoc Demi-Barbe",
      role: "Seigneur de guerre",
      quote: "Moi, je ne fais pas d'ultimatum. Je viens, c'est tout.",
    },
    currency: {
      icon: "/assets/relics/egide_reine.webp",
      name: "Vendetta",
      text: "72 h pour détruire deux fois sa flotte : relique, titre « Tombeur de… », +40 points de passe, et le seigneur fuit 7 jours.",
    },
    features: [
      { title: "Dix seigneurs", text: "Agressifs, opportunistes, bâtisseurs, marchands : badge PNJ, hors récompenses de classement.", to: "/game/seigneurs", image: "/assets/warlords/zharkesh-sceau.webp" },
      { title: "Raids mesurés", text: "Une attaque par cible tous les 3 jours au plus, jamais sous Bronze I, 3 à 5 h de trajet, butin plafonné.", to: "/game/seigneurs", image: "/assets/warlords/tivrek-sceau.webp" },
      { title: "Marché vivant", text: "Les marchands publient leurs offres chaque jour, à ±10 % du comptoir.", to: "/game/marche", image: "/assets/warlords/kragmor-sceau.webp" },
      { title: "Mode vacances", text: "2 à 21 jours : base protégée, production à 25 %, chantiers en pause.", to: "/game/reglages" },
    ],
    cta: { label: "Voir les seigneurs", to: "/game/seigneurs" },
  },
  {
    id: "v4.1-saison",
    eyebrow: "Mise à jour 4.1 · Passe de saison",
    title: "Chaque jour de jeu compte",
    text: "Un passe gratuit de 30 paliers qui se remplit avec ton activité, des amis à recruter, des victoires à afficher partout. Et pour les nouveaux venus, Vashka raconte elle-même leurs premiers pas.",
    factions: [],
    tone: "gold",
    art: "/assets/bounties/hunters.webp",
    artMobile: "/assets/bounties/vashka.webp",
    emblem: "/assets/bounties/amber.webp",
    spotlight: {
      image: "/assets/bounties/vashka.webp",
      name: "Vashka",
      role: "Matriarche-Chasseuse",
      quote: "L'Essaim récompense ceux qui reviennent. Chaque jour, commandant.",
    },
    currency: {
      icon: "/assets/bounties/amber.webp",
      name: "Passe gratuit",
      text: "30 paliers ce mois-ci : production, 370 Ambre, Dossiers, capsules, jetons du casino, une relique rare puis épique, bannière et titre de saison.",
    },
    features: [
      { title: "Passe de saison", text: "Contrats, primes, raids repoussés, victoires, Léviathan, connexion du jour : 40 points par palier.", to: "/game/passe", image: "/assets/relics/couronne_essaim.webp" },
      { title: "Parrainage", text: "Ton lien d'invitation : 150 Ambre et la bannière « Recruteur » quand ton filleul atteint Bronze I, 100 Ambre pour lui.", to: "/game/profil", image: "/assets/bounties/emoji-ok.webp" },
      { title: "Carte de victoire", text: "Un combat gagné devient une image à télécharger ou un lien qui s'affiche en aperçu sur Discord et WhatsApp.", to: "/game/combats", image: "/assets/bounties/emoji-top.webp" },
      { title: "Tutoriel raconté", text: "Les dix objectifs de départ deviennent trois chapitres, avec un premier raid de Varan à repousser.", to: "/game", image: "/assets/story/varan.webp" },
    ],
    cta: { label: "Ouvrir le passe", to: "/game/passe" },
  },
  {
    id: "v4.0-commandement",
    eyebrow: "Mise à jour 4.0 · Commandement",
    title: "Ton État-major t'attend",
    text: "Cinq officiers à recruter, des reliques arrachées aux confins du secteur et un laboratoire qui distille des capsules interdites. Ton empire ne se commande plus seul.",
    factions: [],
    tone: "gold",
    art: "/assets/buildings/labo_synthese.webp",
    artMobile: "/assets/commanders/admiral.webp",
    emblem: "/assets/relics/couronne_essaim.webp",
    spotlight: {
      image: "/assets/commanders/admiral.webp",
      name: "Rhys Calder",
      role: "Amiral",
      quote: "Donnez-moi une flotte et un poste, commandant. Je vous rendrai des victoires.",
    },
    currency: {
      icon: "/assets/commanders/strategist.webp",
      name: "Premier officier offert",
      text: "Recrute ton premier officier gratuitement depuis la page État-major. Les suivants : 150 Ambre ou 12 h de production.",
    },
    features: [
      { title: "Commandants", text: "Amiral, Stratège, Ingénieure, Espionne, Intendant : 2 en poste, jusqu'au niveau 20, +1 % par niveau.", to: "/game/etat-major", image: "/assets/commanders/engineer.webp" },
      { title: "Reliques", text: "De 3 à 15 % de bonus permanent. Expéditions, proie d'élite, Léviathan. Fusion et recyclage en Ambre.", to: "/game/etat-major", image: "/assets/relics/egide_reine.webp" },
      { title: "Labo de synthèse", text: "Capsules jusqu'à 50 % : stimulant, carapace, fausse flotte, rapports faussés. Invisibles à l'espionnage.", to: "/game/etat-major", image: "/assets/capsules/decoy.webp" },
      { title: "Anomalie chimique", text: "Une Espionne en poste peut flairer les capsules adverses : flotte truquée ou rapport faussé.", to: "/game/etat-major", image: "/assets/commanders/spy.webp" },
      { title: "Profil personnalisable", text: "Bannière, sceau et devise de ta fiche, débloqués par tes exploits. Tes officiers et reliques s'y affichent.", to: "/game/profil" },
      { title: "Planète vivante", text: "Jour et nuit, vapeurs du labo, boucliers, insignes d'officiers, flottes qui partent et menaces qui arrivent.", to: "/game" },
    ],
    cta: { label: "Ouvrir l'État-major", to: "/game/etat-major" },
  },
  {
    id: "v3.9-les-keshvaar",
    eyebrow: "Mise à jour 3.9 · Nouvelle faction alliée",
    title: "L'Essaim Kesh'Vaar recrute des chasseurs",
    text: "Leur Ruche-Mère a été pillée, leur Reine est tombée, ses œufs vendus aux quatre coins du secteur. Les Kesh'Vaar ont juré de retrouver chaque coupable — et ils paient en Ambre de Ruche les commandants qui chassent pour eux.",
    factions: [],
    tone: "gold",
    art: "/assets/bounties/hunters.webp",
    artMobile: "/assets/bounties/vashka.webp",
    emblem: "/assets/bounties/emblem.webp",
    spotlight: {
      image: "/assets/bounties/vashka.webp",
      name: "Vashka",
      role: "Matriarche-Chasseuse",
      quote: "Rapporte-nous leurs noms, commandant. L'Essaim n'oublie ni ses morts, ni ses chasseurs.",
    },
    currency: {
      icon: "/assets/bounties/amber.webp",
      name: "Ambre de Ruche",
      text: "Nouvelle monnaie, gagnée uniquement par les primes. Ni achetable, ni échangeable entre joueurs.",
    },
    features: [
      { title: "Tableau des primes", text: "3 fugitifs toutes les 8 h, 4 primes par jour : de ★ Traque à ★★★★ Élite, XP et Ambre à la clé.", to: "/game/primes" },
      { title: "Proie d'élite", text: "Chaque lundi, un grand fugitif pour tout le serveur : 300 XP et 150 Ambre s'il tombe.", to: "/game/primes" },
      { title: "Comptoir de la Ruche", text: "Accélérateur, Gelée de la Reine (+20 %), brouilleur, balise de repli, Voile de chitine…", to: "/game/primes" },
      { title: "Traqueur Kesh", text: "Un vaisseau organique rapide, +50 % d'attaque contre les factions et les fugitifs.", to: "/game/primes", image: "/assets/units/traqueur_kesh.webp" },
      { title: "Rangs de l'Essaim", text: "De Larve à Main de la Reine : plus d'Ambre par prime et des proies plus prestigieuses.", to: "/game/primes", image: "/assets/bounties/emblem.webp" },
      { title: "Emojis Kesh'Vaar", text: "Quatre emojis exclusifs pour les discussions, et un cadre de chitine pour ta fiche.", to: "/game/primes", image: "/assets/bounties/emoji-ok.webp" },
    ],
    cta: { label: "Rejoindre la traque", to: "/game/primes" },
  },
  {
    id: "v3.2-le-leviathan-arrive",
    eyebrow: "Mise à jour 3.2 · Le grand déploiement",
    title: "Le Léviathan arrive vendredi",
    text: "Le premier week-end de chaque mois, un monstre colossal menace la galaxie : unissez vos flottes pour l'abattre et partager le butin. Et ce n'est pas tout — expéditions, marché, guerres d'alliance… voici tout ce qui change.",
    factions: [],
    art: "/assets/leviathan/leviathan.webp",
    artMobile: "/assets/leviathan/leviathan-portrait.webp",
    features: [
      { title: "Le Léviathan", text: "Vendredi 18 h → lundi 18 h. Un assaut toutes les 4 h, récompenses selon tes dégâts.", to: "/game/uber" },
      { title: "Expéditions", text: "2 à 8 h dans l'inconnu : gisements, épaves, embuscades, rencontres… et des choix.", to: "/game/missions" },
      { title: "Marché", text: "Échange tes surplus avec les autres commandants, sans passer par le comptoir.", to: "/game/marche" },
      { title: "Formations et posture", text: "Assaut, Prudente, Raid… et choisis comment ta base encaisse les attaques.", to: "/game/unites" },
      { title: "Simulateur", text: "Teste un combat sans risque avant d'envoyer ta flotte.", to: "/game/simulateur" },
      { title: "Guerres d'alliance", text: "Déclare la guerre, marque des points, remporte le trésor et le titre « Vainqueurs ».", to: "/game/alliance" },
    ],
    cta: { label: "Voir le Léviathan", to: "/game/uber" },
  },
  {
    id: "v2.3-nouvelles-factions",
    eyebrow: "Nouvelles menaces · Mise à jour 2.3",
    title: "Trois factions entrent dans la guerre",
    text: "Une inquisition qui traque le savoir interdit, un cartel qui flaire les coffres pleins, une meute de cyborgs qui chasse les empires trop ambitieux. Chacune a ses raisons de frapper à ta porte… et un repaire à faire tomber.",
    factions: ["inquisition", "cartel", "meute"],
    cta: { label: "Découvrir les menaces", to: "/game/menaces" },
  },
];

const SEEN_KEY = "cosmic-empires:announcements-seen";
function readSeen(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}
function markSeen(keys: string[]) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...new Set([...readSeen(), ...keys])].slice(-300)));
  } catch {
    /* stockage indisponible : le compte garde quand même la trace */
  }
}

/** v4.7.1 : annonces vues par ce joueur, sur le compte et sur cet appareil. */
function seenIds(uid: string, account: string[] | undefined): string[] {
  const prefix = `${uid}:`;
  const local = readSeen().filter((k) => k.startsWith(prefix)).map((k) => k.slice(prefix.length));
  return [...new Set([...(account ?? []), ...local])];
}

/** Taglines courtes par type de déclencheur. */
const TAGLINE: Record<string, string> = {
  research: "Traque le savoir",
  hoard: "Flaire les coffres pleins",
  expansion: "Chasse les empires qui grandissent",
  aggression: "Traque les agresseurs",
  wealth: "Rançonne les empires riches",
};

const CLIP = [
  "polygon(0 0, 100% 0, 86% 100%, 0 100%)",
  "polygon(14% 0, 100% 0, 86% 100%, 0 100%)",
  "polygon(14% 0, 100% 0, 100% 100%, 0 100%)",
];

/** v4.1 : une annonce est en attente ou ouverte (le tutoriel raconté attend son tour). */
export const useAnnouncementPending = create<{ pending: boolean }>(() => ({ pending: false }));

/** v4.5 : annonce créée dans l'administration, au format des annonces du code. */
function fromCustom(c: CustomAnnouncement): Announcement {
  return { id: c.id, eyebrow: c.eyebrow, title: c.title, text: c.text, factions: [], art: c.art, artMobile: c.artMobile, tone: c.tone, features: c.features, cta: c.cta, poll: c.poll };
}

/** Toutes les annonces connues (créées dans l'admin puis celles du code), sans calendrier. */
export function allAnnouncements(settings: AnnouncementSettings): Announcement[] {
  return [...settings.custom.map(fromCustom), ...ANNOUNCEMENTS];
}

export function AnnouncementDialog() {
  const player = usePlayerStore((s) => s.player);
  const navigate = useNavigate();
  const [current, setCurrent] = useState<{ show: Announcement; markIds: string[] } | null>(null);
  const uid = player?.uid;
  const threatened = player ? !!activeUltimatum(player, Date.now()) : false;
  const settings = useAnnouncementSettings();
  const contentLoaded = useContentStore((s) => s.loaded);
  const previewId = useAnnouncementPreview((s) => s.id);
  const preview = previewId ? allAnnouncements(settings).find((a) => a.id === previewId) ?? null : null;

  useEffect(() => {
    // Pas par-dessus un ultimatum : l'annonce attendra le prochain chargement.
    // v4.5 : on attend le calendrier des annonces (game_config) avant de choisir.
    if (!uid || threatened || !contentLoaded || current) return;
    const list = scheduledAnnouncements(ANNOUNCEMENTS, settings, Date.now(), fromCustom).filter(
      (a) => a.factions.length === 0 || a.factions.some((id) => FACTIONS.some((f) => f.id === id && f.enabled)),
    );
    const next = nextAnnouncement(list, seenIds(uid, usePlayerStore.getState().player?.announcementsSeen));
    if (!next) return;
    useAnnouncementPending.setState({ pending: true });
    const timer = setTimeout(() => setCurrent(next), 1200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- une annonce par chargement : `current` ne relance pas le choix
  }, [uid, threatened, contentLoaded, settings]);

  const shown = preview ?? current?.show ?? null;
  if (!shown || !uid) return null;
  const gold = shown.tone === "gold";
  const factions = shown.factions.map((id) => FACTIONS.find((f) => f.id === id && f.enabled)).filter((f) => !!f);
  const close = () => {
    if (preview) {
      previewAnnouncement(null);
      return;
    }
    // Celle-ci et toutes les plus anciennes : elles ne défileront plus une à une.
    const ids = current?.markIds ?? [shown.id];
    markSeen(ids.map((id) => `${uid}:${id}`));
    void markAnnouncementsSeen(ids).catch(() => undefined);
    setCurrent(null);
    useAnnouncementPending.setState({ pending: false });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-h-[94vh] max-w-5xl overflow-hidden overflow-y-auto border-0 p-0 sm:w-[94vw]">
        <div className="relative flex min-h-[78vh] flex-col justify-end overflow-hidden bg-space-950">
          {shown.art && (
            <motion.picture className="absolute inset-x-0 top-0 h-[70%] sm:h-[62%]" initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}>
              {shown.artMobile && <source media="(max-width: 640px)" srcSet={assetUrl(shown.artMobile)} />}
              <img src={assetUrl(shown.art)} alt="" className="h-full w-full object-cover object-[center_75%]" />
            </motion.picture>
          )}
          {/* Illustrations en bandes obliques */}
          <div className="absolute inset-0 flex">
            {factions.map((f, i) => (
              <motion.div
                key={f.id}
                className={cn("relative h-full flex-1", i > 0 && "-ml-[5%]")}
                style={{ clipPath: CLIP[factions.length === 1 ? 2 : i === 0 ? 0 : i === factions.length - 1 ? 2 : 1] }}
                initial={{ opacity: 0, y: 60, scale: 1.08 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.9, delay: 0.15 + i * 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                <img src={assetUrl(f.art)} alt={`${f.leader} et ${f.enforcer}`} className="h-full w-full object-cover object-top" />
              </motion.div>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-space-950 via-space-950/75 to-space-950/0" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-space-950/80 to-transparent" />
          {shown.spotlight && (
            <motion.figure
              className="absolute right-8 top-8 z-10 hidden w-44 flex-col gap-2 lg:flex"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <img src={assetUrl(shown.spotlight.image)} alt={shown.spotlight.name} className="h-60 w-44 border border-gold-glow/50 object-cover object-top shadow-[0_0_40px_color-mix(in_srgb,var(--color-gold-glow)_35%,transparent)]" />
              <figcaption className="border border-gold-glow/30 bg-space-950/85 p-2 backdrop-blur-sm">
                <p className="font-display text-sm text-gold-glow">{shown.spotlight.name}</p>
                <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-400">{shown.spotlight.role}</p>
                <p className="mt-1 text-[11px] italic leading-snug text-slate-300">« {shown.spotlight.quote} »</p>
              </figcaption>
            </motion.figure>
          )}

          {/* Texte */}
          <motion.div
            className="relative z-10 flex flex-col gap-4 p-6 pt-[42vh] md:p-10 md:pt-64"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.75 }}
          >
            <p className={cn("hud-eyebrow flex items-center gap-2", gold ? "text-gold-glow" : "text-danger-glow")}>
              {shown.emblem ? <img src={assetUrl(shown.emblem)} alt="" className="h-7 w-7 drop-shadow-[0_0_8px_color-mix(in_srgb,var(--color-gold-glow)_50%,transparent)]" /> : <Skull className="h-3.5 w-3.5 animate-pulse" />} {shown.eyebrow}
            </p>
            <DialogTitle className="text-3xl leading-tight md:text-5xl">{shown.title}</DialogTitle>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-200 md:text-base">{shown.text}</p>
            {shown.currency && (
              <motion.div
                className="flex max-w-xl items-center gap-3 border border-gold-glow/40 bg-space-950/80 p-3 backdrop-blur-sm"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.85 }}
              >
                <motion.img
                  src={assetUrl(shown.currency.icon)}
                  alt=""
                  className="h-12 w-12 shrink-0 drop-shadow-[0_0_14px_color-mix(in_srgb,var(--color-gold-glow)_60%,transparent)]"
                  animate={{ y: [0, -4, 0], rotate: [0, 4, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
                <div>
                  <p className="font-display text-sm text-gold-glow">{shown.currency.name}</p>
                  <p className="text-[11px] leading-snug text-slate-300">{shown.currency.text}</p>
                </div>
              </motion.div>
            )}
            {shown.poll && <PollCard id={shown.id} poll={shown.poll} className="max-w-xl" />}
            {shown.features && (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {shown.features.map((f, i) => (
                  <motion.button
                    key={f.title}
                    type="button"
                    onClick={() => {
                      close();
                      navigate(f.to);
                    }}
                    className={cn(
                      "hud-cut-sm flex items-start gap-2.5 border bg-space-950/75 p-3 text-left backdrop-blur-sm transition-colors",
                      gold ? "border-gold-glow/25 hover:border-gold-glow/60" : "border-cyan-glow/25 hover:border-cyan-glow/60",
                    )}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 + i * 0.08 }}
                  >
                    {f.image && <img src={assetUrl(f.image)} alt="" className="h-10 w-10 shrink-0 object-contain" />}
                    <span>
                      <span className={cn("block font-display text-sm", gold ? "text-gold-glow" : "text-cyan-glow")}>{f.title}</span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-slate-300">{f.text}</span>
                    </span>
                  </motion.button>
                ))}
              </div>
            )}
            <div className="grid gap-2 sm:grid-cols-3">
              {factions.map((f, i) => {
                const a = accent(f);
                return (
                  <motion.div
                    key={f.id}
                    className={cn("hud-cut-sm border bg-space-950/70 p-3 backdrop-blur-sm", a.border)}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 + i * 0.12 }}
                  >
                    <p className={cn("font-display text-sm", a.text)}>{f.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {f.leader} · {TAGLINE[f.trigger.type] ?? ""}
                    </p>
                  </motion.div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={gold ? "warn" : "danger"}
                size="lg"
                onClick={() => {
                  close();
                  navigate(shown.cta.to);
                }}
              >
                {shown.cta.label}
              </Button>
              <Button variant="ghost" size="lg" onClick={close}>
                Plus tard
              </Button>
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
