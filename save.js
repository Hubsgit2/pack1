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

// === DAILY GLOBAL STORE (same for everyone, refresh at midnight) ===


/ Deterministic seeded RNG
function seededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

// Generate store based on today's date
function generateDailyStore() {
    storePlayers = [];

    const today = new Date();
    const seed = parseInt(
        today.getFullYear().toString() +
        (today.getMonth() + 1).toString().padStart(2, "0") +
        today.getDate().toString().padStart(2, "0")
    );

    for (let i = 0; i < 16; i++) {
        const r = seededRandom(seed + i);
        const index = Math.floor(r * players.length);
        storePlayers.push(players[index]);
    }

    storeDate = seed;
    saveGame();
}

// Check if store needs refreshing
function checkDailyStore() {
    const today = new Date();
    const todaySeed = parseInt(
        today.getFullYear().toString() +
        (today.getMonth() + 1).toString().padStart(2, "0") +
        today.getDate().toString().padStart(2, "0")
    );

    if (storeDate !== todaySeed) {
        generateDailyStore();
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

function displayStore() {
    const storeDiv = document.getElementById("store");
    storeDiv.innerHTML = "";
    storePlayers.forEach((p, index) => {
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
<p>Price: ${getCardPrice(p)} coins</p>                
<button onclick="buyCard(${index})">Buy</button>
            </div>
        `;
        storeDiv.appendChild(card);
    });
}
function bindTouch(btnId, keyName) {
    const btn = document.getElementById(btnId);

    btn.addEventListener("touchstart", e => {
        e.preventDefault();
        keys[keyName] = true;
    });

    btn.addEventListener("touchend", e => {
        e.preventDefault();
        keys[keyName] = false;
    });

    btn.addEventListener("touchcancel", e => {
        e.preventDefault();
        keys[keyName] = false;
    });
}

bindTouch("btn-up", "ArrowUp");
bindTouch("btn-down", "ArrowDown");
bindTouch("btn-left", "ArrowLeft");
bindTouch("btn-right", "ArrowRight");


function buyCard(index) {
    const p = storePlayers[index];

    if (coins >= p.price) {
        coins -= p.price;
        collection.push(p);

        // 🔥 Remove card from shop
        storePlayers.splice(index, 1);

        alert(`Bought ${p.name}!`);

        updateCoins();
        displayCollection();
        displayStore();   // Refresh store UI
        saveGame();
    } else {
        alert("Not enough coins!");
    }
}

// Run daily store check on startup
checkDailyStore();

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

// === PART 2: MINI-GAME ===

const canvas = document.getElementById("mini-game");
const ctx = canvas.getContext("2d");
let gameRunning = false;

// Player and defender
let playerObj = { x: 280, y: 250, width: 40, height: 40, speed: 5 };
let defender = { x: Math.random() * 500, y: 50, width: 40, height: 40, speed: 2 };
const endZoneY = 0;
const keys = {};

document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

function startMiniGame() {
    if (gameRunning) return;

    document.getElementById("main-ui").classList.add("hidden");
    document.getElementById("mobile-controls").classList.remove("hidden");

    gameRunning = true;
    playerObj.x = 280;
    playerObj.y = 250;
    defender.x = Math.random() * 500;
    defender.y = 50;

    requestAnimationFrame(gameLoop);
}


function draw3DRect(obj, color) {
    const scale = 1 + (canvas.height - obj.y) / 1000;
    const w = obj.width * scale;
    const h = obj.height * scale;
    const x = obj.x - (w - obj.width) / 2;
    const y = obj.y - (h - obj.height) / 2;

    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 5;

    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);

    ctx.shadowBlur = 0;
}

function gameLoop() {
    if (!gameRunning) return;

    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, "#0b3d91");
    grad.addColorStop(1, "#004d00");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#003366";
    ctx.fillRect(0, 0, canvas.width, 40);

    if (keys['ArrowLeft'] && playerObj.x > 0) playerObj.x -= playerObj.speed;
    if (keys['ArrowRight'] && playerObj.x + playerObj.width < canvas.width) playerObj.x += playerObj.speed;
    if (keys['ArrowUp'] && playerObj.y > 0) playerObj.y -= playerObj.speed;
    if (keys['ArrowDown'] && playerObj.y + playerObj.height < canvas.height) playerObj.y += playerObj.speed;

    draw3DRect(playerObj, "yellow");

    defender.y += defender.speed;
    if (defender.y > canvas.height) defender.y = -50;
    defender.x += (defender.x + 20 < playerObj.x + playerObj.width / 2 ? 1 : -1);

    draw3DRect(defender, "red");

    if (playerObj.x < defender.x + defender.width &&
        playerObj.x + playerObj.width > defender.x &&
        playerObj.y < defender.y + defender.height &&
        playerObj.y + playerObj.height > defender.y) {
        endMiniGame(false);
        return;
    }

    if (playerObj.y <= endZoneY + 40) {
        endMiniGame(true);
        return;
    }

    requestAnimationFrame(gameLoop);
}
function returnToMenu() {
    document.getElementById("main-ui").classList.remove("hidden");
    document.getElementById("mobile-controls").classList.add("hidden");
    document.getElementById("return-btn").classList.add("hidden");

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function endMiniGame(won) {
    gameRunning = false;

    if (won) {
        coins += 200;
        alert("Touchdown! +200 coins");
    } else {
        alert("Tackle! Try again.");
    }

    updateCoins();
    saveGame();

    // 🔥 Show return button
    document.getElementById("return-btn").classList.remove("hidden");
}
function updateStoreTimer() {
    const now = new Date();

    // Next midnight
    const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0, 0, 0, 0
    );

    let diff = Math.floor((nextMidnight - now) / 1000); // seconds left

    const hours = Math.floor(diff / 3600);
    diff %= 3600;

    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;

    const formatted =
        hours.toString().padStart(2, "0") + ":" +
        minutes.toString().padStart(2, "0") + ":" +
        seconds.toString().padStart(2, "0");

    document.getElementById("store-timer").innerText =
        "Next refresh in: " + formatted;
}


// Auto-save every 10 seconds
setInterval(saveGame, 10000);
setInterval(updateStoreTimer, 1000);
updateStoreTimer();

