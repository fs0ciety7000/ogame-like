const RANK_LABELS = [
    "Non-classé",
    "Fer III", "Fer II", "Fer I",
    "Bronze III", "Bronze II", "Bronze I",
    "Argent III", "Argent II", "Argent I",
    "Or III", "Or II", "Or I",
    "Platine III", "Platine II", "Platine I",
    "Émeraude", "Diamant", "Master",
    "Challenger", "Elite"
];

function getRankLabel(rankIndex) {
    return RANK_LABELS[rankIndex] ?? "Non-classé";
}

function initPlayers() {
    const container = document.getElementById("playersList");
    if (!container) return;

    container.innerHTML = "";

    const players = [
        { pseudo: "Axelle", rank: 19 },   // Challenger
        { pseudo: "Tomdindon", rank: 10 }, // Or III
        { pseudo: "Tartiflex", rank: 7 },  // Bronze I
        { pseudo: "Sam", rank: 3 },     // Fer I
        { pseudo: "Trevor", rank: 0 }      // Non-classé
    ];

    players.forEach(p => {
        const card = document.createElement("div");
        card.className = "player-card";

        card.innerHTML = `
    <div class="player-main">
        <span class="player-name">${p.pseudo}</span>
        <span class="player-rank">${getRankLabel(p.rank)}</span>
    </div>

    <div class="player-actions">
        <button class="btn-player attack" data-id="${p.pseudo}" data-action="attack">Attaquer</button>
        <button class="btn-player spy" data-id="${p.pseudo}" data-action="spy">Espionner</button>
    </div>
`;



        container.appendChild(card);
    });
}
