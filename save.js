// === AUTO-SAVE SYSTEM ===
// Save game state to localStorage
function saveGame() {
    const gameState = {
        coins: coins,
        collection: collection,
        storePlayers: storePlayers,
        storeDate: storeDate
    };
    localStorage.setItem('footballCardGame', JSON.stringify(gameState));
}

// Load game state from localStorage
function loadGame() {
    const saved = localStorage.getItem('footballCardGame');
    if (saved) {
        try {
            const gameState = JSON.parse(saved);
            coins = gameState.coins ?? 1000;
            collection = gameState.collection || [];
            storePlayers = gameState.storePlayers || [];
            storeDate = gameState.storeDate || "";
            return true;
        } catch (e) {
            console.error('Error loading save:', e);
            return false;
        }
    }
    return false;
}

// Reset game (clear save)
function resetGame() {
    if (confirm('Are you sure you want to reset your game? This will delete all your progress!')) {
        localStorage.removeItem('footballCardGame');
        coins = 1000;
        collection = [];
        storePlayers = [];
        storeDate = "";
        updateCoins();
        displayCollection();
        alert('Game reset! Starting fresh with 1000 coins.');
        saveGame();
    }
}

// Game state
let coins = 1000;
let collection = [];
let storePlayers = [];
let storeDate = "";

// Load saved game on startup
loadGame();

// Initialize display
updateCoins();
displayCollection();

// === PART 1: CARD COLLECTION ===

// Coins display
function updateCoins() {
    document.getElementById("coins").innerText = coins;
    saveGame();
}

// Card rarity
function cardRarity(player) {
    if (player.rating === 99) return "Ultimate";
    if (player.rating >= 97) return "Legendary";
    if (player.rating >= 93) return "Elite";
    if (player.rating >= 81) return "Rare";
    return "Common";
}

// Display collection
function displayCollection() {
    const div = document.getElementById("collection");
    div.innerHTML = "";
    if (collection.length === 0) {
        div.innerHTML = "<p style='text-align:center;color:#999;'>No cards yet. Open a pack or visit the store!</p>";
        return;
    }
    collection.forEach((p, index) => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
            <div class="rarity-label">${cardRarity(p)}</div>
            <img class="player-photo" src="${p.img}" />
            <img class="team-logo" src="${p.logo}" />
            <div class="card-content">
                <h3>${p.name}</h3>
                <p>${p.team}</p>
                <p>⭐ ${p.rating}</p>
                <button onclick="sellCard(${index})">Sell</button>
            </div>
        `;
        div.appendChild(card);
    });
}

function sellCard(index) {
    const card = collection.splice(index, 1)[0];
    const sellPrice = Math.floor(card.price / 3);
    coins += sellPrice;
    alert(`Sold ${card.name} for ${sellPrice} coins!`);
    updateCoins();
    displayCollection();
    saveGame();
}

// === DAILY GLOBAL STORE (same for everyone, refresh every 10s) ===

// Deterministic seeded RNG
function seededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

// Generate store based on time block (every 10 seconds)
function generateStore() {
    storePlayers = [];

    const now = new Date();
    const timeBlock = Math.floor(now.getTime() / 10000); // changes every 10 sec
    const seed = timeBlock;

    const shuffledPlayers = [...players];

    // Shuffle based on seed
    for (let i = shuffledPlayers.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom(seed + i) * (i + 1));
        [shuffledPlayers[i], shuffledPlayers[j]] =
            [shuffledPlayers[j], shuffledPlayers[i]];
    }

    storePlayers = shuffledPlayers.slice(0, 16);

    storeDate = seed;
    saveGame();
}

// Check if store needs refreshing
function checkStoreRefresh() {
    const now = new Date();
    const currentBlock = Math.floor(now.getTime() / 10000);

    if (storeDate !== currentBlock) {
        generateStore();
        displayStore();
    }
}

// Store UI
function toggleStore() {
    const storeDiv = document.getElementById("store-container");
    if (storeDiv.style.display === "none") {
        storeDiv.style.display = "block";
        displayStore();
    } else {
        storeDiv.style.display = "none";
    }
}

// Get price for card based on rarity
function getCardPrice(player) {
    const rarity = cardRarity(player);

    switch (rarity) {
        case "Ultimate":
            return 5000 + player.rating * 50;

        case "Legendary":
            return 3000 + player.rating * 40;

        case "Elite":
            return 1500 + player.rating * 30;

        case "Rare":
            return 600 + player.rating * 20;

        case "Common":
        default:
            return 200 + player.rating * 10;
    }
}

// Display store
function displayStore() {
    const storeDiv = document.getElementById("store");
    storeDiv.innerHTML = "";

    storePlayers.forEach((p, index) => {
        const price = getCardPrice(p);

        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
            <img src="${p.img}" width="80"><br>
            <b>${p.name}</b><br>
            ${p.team}<br>
            Rating: ${p.rating}<br>
            Price: ${price} coins<br>
            <button onclick="buyCard(${index})">Buy</button>
        `;

        storeDiv.appendChild(card);
    });
}

// Buy a card
function buyCard(index) {
    const p = storePlayers[index];
    const price = getCardPrice(p);

    if (coins >= price) {
        coins -= price;

        p.price = price; // save sell value
        collection.push(p);
        storePlayers.splice(index, 1);

        alert(`Bought ${p.name}!`);

        updateCoins();
        displayCollection();
        displayStore();
        saveGame();
    } else {
        alert("Not enough coins!");
    }
}

// Timer for store refresh
function updateStoreTimer() {
    const now = new Date();
    const nextBlock = Math.ceil(now.getTime() / 10000) * 10000;

    let diff = Math.floor((nextBlock - now.getTime()) / 1000);

    document.getElementById("store-timer").innerText =
        "Next refresh in: " +
        diff.toString().padStart(2, "0") + "s";
}

// Auto-refresh & countdown timer every 1 second
setInterval(checkStoreRefresh, 1000);
setInterval(updateStoreTimer, 1000);

// Run daily store check on startup
checkStoreRefresh();

// === PACK OPENING ===

function openPack() {
    if (coins < 200) {
        alert("Not enough coins!");
        return;
    }
    coins -= 200;
    updateCoins();
    const packContainer = document.getElementById("pack-container");
    packContainer.innerHTML = "";
    const packCards = [];
    for (let i = 0; i < 5; i++) {
        const card = players[Math.floor(Math.random() * players.length)];
        packCards.push(card);
        collection.push(card);
    }
    packCards.forEach((card, index) => {
        const cardEl = document.createElement("div");
        cardEl.className = "pack-card front";
        cardEl.style.top = "0px";
        cardEl.style.left = `${30 + index * 100}px`;
        cardEl.innerHTML = `
            <img class="player-photo" src="${card.img}" />
            <img class="team-logo" src="${card.logo}" />
            <div class="card-content">
                <h4>${card.name}</h4>
                <p class="team">${card.team}</p>
                <p class="rating">⭐ ${card.rating}</p>
            </div>
        `;
        packContainer.appendChild(cardEl);
        setTimeout(() => {
            cardEl.classList.add("revealed");
        }, 500 + index * 400);
    });
    setTimeout(() => {
        packContainer.innerHTML = "";
        displayCollection();
        saveGame();
    }, 5000);
}

// === MINI-GAME ===

const canvas = document.getElementById("mini-game");
const ctx = canvas.getContext("2d");
let gameRunning = false;

let playerObj = { x: 280, y: 250, width: 40, height: 40, speed: 5 };
let defender = { x: Math.random() * 500, y: 50, width: 40, height: 40, speed: 2 };
const endZoneY = 0;
const keys = {};

document.addEventListener('keydown', e => keys[e.key] =
