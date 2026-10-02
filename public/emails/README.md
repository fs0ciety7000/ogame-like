# Campagnes e-mail

Un fichier HTML (version riche) et un fichier texte (version de secours) par campagne.

- Les images sont servies par le jeu : `public/assets/email/` → `https://empire.fs0ciety.org/assets/email/…`
  (JPG/PNG uniquement : Outlook ne lit pas le WebP). Le client doit être déployé avant l'envoi.
- Mise en page en tableaux et styles en ligne, largeur 600 px, adaptée au téléphone.
- Envoi depuis la console d'administration (onglet **E-mails**) : aperçu, test, envoi à tous.
  `{{PSEUDO}}` et `{{UNSUBSCRIBE_URL}}` sont remplacés pour chaque joueur (lien de désinscription personnel).
- Pour ajouter une campagne : déposer le .html et le .txt ici et l'ajouter à `index.json`.
- Objet conseillé et texte d'aperçu : voir l'en-tête de chaque campagne ci-dessous.

## 2026-10 · Mise à jour 3.9 (Kesh'Vaar)

- Objet : « Les Kesh'Vaar recrutent : primes, Ambre et 63 emojis 🐝 »
- Variante : « Commandant, l'Essaim a besoin de vous »
- Expéditeur : Thomas & Nicolas · Cosmic Empires
