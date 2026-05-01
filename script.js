import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// Paste your Firebase config here.
const firebaseConfig = {
  apiKey: "AIzaSyCfKu7L5cAEDrmoY7KhTKcWT8HKoUQeCrY",
  authDomain: "bonk-gabe.firebaseapp.com",
  projectId: "bonk-gabe",
  storageBucket: "bonk-gabe.firebasestorage.app",
  messagingSenderId: "47154838294",
  appId: "1:47154838294:web:bbd060ff3a28f6e6916e37"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const startScreen = document.getElementById("startScreen");
const gameScreen = document.getElementById("gameScreen");
const endScreen = document.getElementById("endScreen");

const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");

const gameArea = document.getElementById("gameArea");
const gabe = document.getElementById("gabe");
const bonkEffect = document.getElementById("bonkEffect");
const floatingText = document.getElementById("floatingText");

const scoreDisplay = document.getElementById("score");
const timeLeftDisplay = document.getElementById("timeLeft");
const finalScore = document.getElementById("finalScore");
const resultMessage = document.getElementById("resultMessage");

const scoreForm = document.getElementById("scoreForm");
const playerNameInput = document.getElementById("playerName");
const saveMessage = document.getElementById("saveMessage");

const startLeaderboardList = document.getElementById("startLeaderboardList");
const endLeaderboardList = document.getElementById("endLeaderboardList");

const bonkSound = document.getElementById("bonkSound");

const GAME_TIME = 15;

let score = 0;
let timeLeft = GAME_TIME;
let gameTimer = null;
let gabeTimeout = null;
let isGameRunning = false;
let hasSubmittedScore = false;

const gabeImages = [
  "assets/gabe-1.png",
  "assets/gabe-2.png",
  "assets/gabe-3.png"
];

const bonkTexts = [
  "bonk",
  "chud",
  "noooo",
  "caught",
  "bros bonking",
  "stop",
  "jit",
  "bruh",
  "holy bonk"
];

const resultMessages = [
  {
    min: 0,
    message: "barely bonked. gabe lives another day."
  },
  {
    min: 8,
    message: "not bad. gabe is mildly inconvenienced."
  },
  {
    min: 15,
    message: "solid bonking. gabe has been humbled."
  },
  {
    min: 25,
    message: "chud level bonking"
  },
  {
    min: 35,
    message: "god tier bonks"
  }
];

async function loadLeaderboard() {
  try {
    const scoresQuery = query(
      collection(db, "scores"),
      orderBy("score", "desc"),
      limit(10)
    );

    const snapshot = await getDocs(scoresQuery);

    const scores = [];

    snapshot.forEach((doc) => {
      scores.push(doc.data());
    });

    renderLeaderboard(scores);
  } catch (error) {
    console.error("Error loading leaderboard:", error);
    startLeaderboardList.innerHTML = "<li>could not load leaderboard</li>";
    endLeaderboardList.innerHTML = "<li>could not load leaderboard</li>";
  }
}

function renderLeaderboard(scores) {
  if (scores.length === 0) {
    startLeaderboardList.innerHTML = "<li>no scores yet. be the first menace.</li>";
    endLeaderboardList.innerHTML = "<li>no scores yet. be the first menace.</li>";
    return;
  }

  const leaderboardHTML = scores
    .map((entry) => {
      const safeName = escapeHTML(entry.name || "anonymous");
      const safeScore = Number(entry.score) || 0;

      return `<li><strong>${safeName}</strong> — ${safeScore}</li>`;
    })
    .join("");

  startLeaderboardList.innerHTML = leaderboardHTML;
  endLeaderboardList.innerHTML = leaderboardHTML;
}

async function submitScore(event) {
  event.preventDefault();

  if (hasSubmittedScore) {
    saveMessage.textContent = "you already submitted this round lol";
    return;
  }

  const name = playerNameInput.value.trim();

  if (!name) {
    saveMessage.textContent = "put a name first";
    return;
  }

  try {
    saveMessage.textContent = "saving...";

    await addDoc(collection(db, "scores"), {
      name: name.slice(0, 18),
      score: score,
      createdAt: serverTimestamp()
    });

    hasSubmittedScore = true;
    saveMessage.textContent = "saved. gabe will remember this.";

    await loadLeaderboard();
  } catch (error) {
    console.error("Error saving score:", error);
    saveMessage.textContent = "oops, score did not save";
  }
}

function startGame() {
  score = 0;
  timeLeft = GAME_TIME;
  isGameRunning = true;
  hasSubmittedScore = false;

  scoreDisplay.textContent = score;
  timeLeftDisplay.textContent = timeLeft;
  saveMessage.textContent = "";
  playerNameInput.value = "";

  startScreen.classList.add("hidden");
  endScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  showGabe();

  gameTimer = setInterval(() => {
    timeLeft--;
    timeLeftDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function endGame() {
  isGameRunning = false;

  clearInterval(gameTimer);
  clearTimeout(gabeTimeout);

  gabe.classList.add("hidden");
  bonkEffect.classList.add("hidden");
  floatingText.classList.add("hidden");

  gameScreen.classList.add("hidden");
  endScreen.classList.remove("hidden");

  finalScore.textContent = score;
  resultMessage.textContent = getResultMessage(score);

  loadLeaderboard();
}

function showGabe() {
  if (!isGameRunning) return;

  const gameRect = gameArea.getBoundingClientRect();

  const gabeSize = getGabeSize();
  const headerHeight = 80;

  const maxX = gameRect.width - gabeSize;
  const maxY = gameRect.height - gabeSize;

  const randomX = Math.floor(Math.random() * maxX);
  const randomY = Math.floor(
    headerHeight + Math.random() * (maxY - headerHeight)
  );

  gabe.src = getRandomGabeImage();
  gabe.style.width = `${gabeSize}px`;
  gabe.style.height = `${gabeSize}px`;
  gabe.style.left = `${randomX}px`;
  gabe.style.top = `${randomY}px`;

  gabe.classList.remove("hidden");

  clearTimeout(gabeTimeout);

  gabeTimeout = setTimeout(() => {
    gabe.classList.add("hidden");

    setTimeout(() => {
      showGabe();
    }, 80);
  }, getGabeSpeed());
}

function bonkGabe(event) {
  if (!isGameRunning) return;

  score++;
  scoreDisplay.textContent = score;

  playBonkSound();
  showBonkEffect(event.clientX, event.clientY);
  showFloatingText(event.clientX, event.clientY);
  shakeScreen();

  gabe.classList.add("bonked");

  clearTimeout(gabeTimeout);

  setTimeout(() => {
    gabe.classList.remove("bonked");
    gabe.classList.add("hidden");
    showGabe();
  }, 120);
}

function getRandomGabeImage() {
  const randomIndex = Math.floor(Math.random() * gabeImages.length);
  return gabeImages[randomIndex];
}

function getGabeSpeed() {
  if (score >= 25) return 420;
  if (score >= 18) return 520;
  if (score >= 10) return 650;
  if (score >= 5) return 780;
  return 900;
}

function getGabeSize() {
  if (score >= 25) return 85;
  if (score >= 18) return 95;
  if (score >= 10) return 105;
  if (score >= 5) return 118;
  return 130;
}

function showBonkEffect(x, y) {
  bonkEffect.style.left = `${x - 45}px`;
  bonkEffect.style.top = `${y - 75}px`;

  bonkEffect.classList.remove("hidden");

  setTimeout(() => {
    bonkEffect.classList.add("hidden");
  }, 180);
}

function showFloatingText(x, y) {
  const randomText = bonkTexts[Math.floor(Math.random() * bonkTexts.length)];

  floatingText.textContent = randomText;
  floatingText.style.left = `${x - 24}px`;
  floatingText.style.top = `${y - 78}px`;

  floatingText.classList.remove("hidden");

  setTimeout(() => {
    floatingText.classList.add("hidden");
  }, 450);
}

function playBonkSound() {
  if (!bonkSound) return;

  bonkSound.currentTime = 0;

  bonkSound.play().catch(() => {
    // Browser blocked sound. The game still works.
  });
}

function shakeScreen() {
  gameArea.classList.add("screen-shake");

  setTimeout(() => {
    gameArea.classList.remove("screen-shake");
  }, 120);
}

function getResultMessage(finalScoreNumber) {
  let selectedMessage = resultMessages[0].message;

  for (const result of resultMessages) {
    if (finalScoreNumber >= result.min) {
      selectedMessage = result.message;
    }
  }

  return selectedMessage;
}

function escapeHTML(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);
gabe.addEventListener("click", bonkGabe);
scoreForm.addEventListener("submit", submitScore);

loadLeaderboard();