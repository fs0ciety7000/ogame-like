// =======================================
// Liste des bâtiments du jeu
// =======================================

const buildings = [

    {
        id: "extracteur_ferraille",
        name: "Extracteur de ferraille",
        description: "Récupère automatiquement de la ferraille dans les débris environnants.",
        imageBase: "assets/buildings/extracteur_ferraille",
        maxLevel: 10,
        cost: { scrap: 50, energy: 20 },
        production: { base: 2 }
    },

    {
        id: "reacteur_instable",
        name: "Réacteur instable",
        description: "Génère de l'énergie… mais pas toujours de manière stable.",
        imageBase: "assets/buildings/reacteur_instable",
        maxLevel: 10,
        cost: { scrap: 80, energy: 0 },
        production: { base: 2 }
    },

    {
        id: "extracteur_nanocomposants",
        name: "Extracteur de nanocomposants",
        description: "Produit des nanocomposants essentiels aux technologies avancées.",
        imageBase: "assets/buildings/extracteur_nanocomposants",
        maxLevel: 10,
        cost: { scrap: 120, energy: 40 },
        production: { base: 2 }
    },

    {
        id: "archives_fracturees",
        name: "Archives fracturées",
        description: "Contient des données anciennes… parfois corrompues.",
        imageBase: "assets/buildings/archives_fracturees",
        maxLevel: 10,
        cost: { scrap: 60, energy: 30 },
        production: { base: 2 }
    },

    {
        id: "atelier_reparation",
        name: "Atelier de réparation",
        description: "Répare et entretient vos unités.",
        imageBase: "assets/buildings/atelier_reparation",
        maxLevel: 10,
        cost: { scrap: 100, energy: 50 },
        production: null
    },

    {
    id: "hangar_attaque",
    name: "Hangar d'attaque",
    description: "Augmente la capacité maximale de vos unités offensives.",
    imageBase: "assets/buildings/hangar_attaque",
    maxLevel: 10,
    cost: { scrap: 300, energy: 150 },
    production: null
    },

    {
    id: "hangar_defense",
    name: "Hangar de défense",
    description: "Augmente la capacité maximale de vos unités défensives.",
    imageBase: "assets/buildings/hangar_defense",
    maxLevel: 10,
    cost: { scrap: 300, energy: 150 },
    production: null
    }

];
