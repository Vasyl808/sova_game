function createStars() {
  const container = document.getElementById("starsContainer");
  for (let i = 0; i < 100; i++) {
    const star = document.createElement("div");
    star.className = "star";
    star.style.left = Math.random() * 100 + "%";
    star.style.top = Math.random() * 100 + "%";
    star.style.width = star.style.height = Math.random() * 3 + 1 + "px";
    star.style.animationDelay = Math.random() * 3 + "s";
    container.appendChild(star);
  }
}
createStars();

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // Mobile/Portrait check (using 768px as breakpoint, same as CSS)
  if (windowWidth <= 768) {
    canvas.width = windowWidth;
    canvas.height = windowHeight;
  } else {
    const maxWidth = 800;
    const maxHeight = 600;

    const padding = 20;
    const availableWidth = windowWidth - padding * 2;
    const availableHeight = windowHeight - padding * 2;

    if (availableWidth / availableHeight > maxWidth / maxHeight) {
      canvas.height = Math.min(availableHeight, maxHeight);
      canvas.width = canvas.height * (maxWidth / maxHeight);
    } else {
      canvas.width = Math.min(availableWidth, maxWidth);
      canvas.height = canvas.width * (maxHeight / maxHeight);
    }
  }
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);

let gameRunning = false;
let score = 0; // Obstacles passed
let sessionCoins = 0; // Coins collected this run
let lives = 1;
let maxLives = 3;
let isInvulnerable = false;
let invulnerableTimer = 0;
let totalCoins = parseInt(localStorage.getItem('cryptoOwlTotalCoins')) || 0;
let highScore = parseInt(localStorage.getItem('cryptoOwlHighScore')) || 0;

document.getElementById('highScoreValue').textContent = highScore;
document.getElementById('totalCoinsValue').textContent = totalCoins;
document.getElementById('highScoreValueEnd').textContent = highScore;
document.getElementById('totalCoinsValueEnd').textContent = totalCoins;

let clouds = [];
class Cloud {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height * 0.6;
    this.speed = Math.random() * 0.5 + 0.2;
    this.scale = Math.random() * 0.5 + 0.5;
    this.opacity = Math.random() * 0.3 + 0.2;
  }

  update(timeScale) {
    this.x -= this.speed * timeScale;
    if (this.x < -150) {
      this.x = canvas.width + 50;
      this.y = Math.random() * canvas.height * 0.6;
    }
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(this.x, this.y, 25 * this.scale, 0, Math.PI * 2);
    ctx.arc(
      this.x + 30 * this.scale,
      this.y - 5 * this.scale,
      35 * this.scale,
      0,
      Math.PI * 2,
    );
    ctx.arc(this.x + 60 * this.scale, this.y, 25 * this.scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

for (let i = 0; i < 5; i++) {
  clouds.push(new Cloud());
}

let particles = [];
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = (Math.random() - 0.5) * 4;
    this.life = 1;
    this.color = color;
    this.size = Math.random() * 4 + 2;
  }

  update(timeScale) {
    this.x += this.vx * timeScale;
    this.y += this.vy * timeScale;
    this.life -= 0.02 * timeScale;
    this.vy += 0.1 * timeScale;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

const owl = {
  x: canvas.width * 0.2,
  y: canvas.height / 2,
  width: 50,
  height: 50,
  velocity: 0,
  gravity: 0.3,
  jump: -6.5,
  rotation: 0,
  wingAngle: 0,
};

let lastTime = 0;
let obstacleTimer = 0;

function drawOwl() {
  ctx.save();
  ctx.translate(owl.x + owl.width / 2, owl.y + owl.height / 2);
  ctx.rotate(owl.rotation);

  owl.wingAngle += 0.15;
  const wingOffset = Math.sin(owl.wingAngle) * 8;

  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  ctx.beginPath();
  ctx.ellipse(5, 5, owl.width / 2 + 2, owl.height / 2 + 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(-20, wingOffset);
  ctx.rotate(-0.3);
  const wingGradient1 = ctx.createLinearGradient(-15, -20, -15, 20);
  wingGradient1.addColorStop(0, "#2d5a1e"); // Dark Green
  wingGradient1.addColorStop(1, "#1e3c14"); // Darker Green
  ctx.fillStyle = wingGradient1;
  ctx.beginPath();
  ctx.ellipse(0, 0, 12, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#1e3c14";
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(-8, -10 + i * 10, 3, 6, -0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.translate(20, wingOffset);
  ctx.rotate(0.3);
  const wingGradient2 = ctx.createLinearGradient(15, -20, 15, 20);
  wingGradient2.addColorStop(0, "#2d5a1e"); // Dark Green
  wingGradient2.addColorStop(1, "#1e3c14"); // Darker Green
  ctx.fillStyle = wingGradient2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 12, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#1e3c14";
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(8, -10 + i * 10, 3, 6, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  const bodyGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, owl.width / 2);
  bodyGradient.addColorStop(0, "#4CAF50"); // Bright Green
  bodyGradient.addColorStop(0.7, "#2E7D32"); // Medium Green
  bodyGradient.addColorStop(1, "#1B5E20"); // Dark Green
  ctx.fillStyle = bodyGradient;
  ctx.beginPath();
  ctx.ellipse(0, 0, owl.width / 2, owl.height / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#A5D6A7"; // Light Green belly
  ctx.beginPath();
  ctx.ellipse(0, 5, owl.width / 3, owl.height / 3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(-10, -8, 10, 0, Math.PI * 2);
  ctx.arc(10, -8, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#1B5E20";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(-10, -8, 10, 0, Math.PI * 2);
  ctx.arc(10, -8, 10, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.arc(-10, -8, 5, 0, Math.PI * 2);
  ctx.arc(10, -8, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(-12, -10, 2, 0, Math.PI * 2);
  ctx.arc(8, -10, 2, 0, Math.PI * 2);
  ctx.fill();

  const beakGradient = ctx.createLinearGradient(0, 0, 0, 12);
  beakGradient.addColorStop(0, "#FFD700");
  beakGradient.addColorStop(1, "#FFA500");
  ctx.fillStyle = beakGradient;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-6, 10);
  ctx.lineTo(6, 10);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#CC8800";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "#1B5E20";
  ctx.beginPath();
  ctx.moveTo(-18, -18);
  ctx.lineTo(-15, -25);
  ctx.lineTo(-12, -18);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(18, -18);
  ctx.lineTo(15, -25);
  ctx.lineTo(12, -18);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  if (isInvulnerable) {
      ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 50) * 0.2;
  } else {
      ctx.globalAlpha = 1;
  }
}

let obstacles = [];
const obstacleWidth = 60;
const gap = 180;
let frameCount = 0;

function drawObstacles() {
  obstacles.forEach((obs) => {
    const topGradient = ctx.createLinearGradient(
      obs.x,
      0,
      obs.x + obstacleWidth,
      0,
    );
    topGradient.addColorStop(0, "#2d5016");
    topGradient.addColorStop(0.5, "#3a6b1f");
    topGradient.addColorStop(1, "#2d5016");
    ctx.fillStyle = topGradient;
    ctx.fillRect(obs.x, 0, obstacleWidth, obs.top);

    ctx.strokeStyle = "#1a3d0a";
    ctx.lineWidth = 3;
    ctx.strokeRect(obs.x, 0, obstacleWidth, obs.top);

    ctx.fillStyle = "#1a3d0a";
    for (let i = 20; i < obs.top; i += 30) {
      ctx.fillRect(obs.x + 5, i, obstacleWidth - 10, 3);
    }

    ctx.fillStyle = topGradient;
    ctx.fillRect(
      obs.x,
      obs.top + gap,
      obstacleWidth,
      canvas.height - obs.top - gap,
    );
    ctx.strokeRect(
      obs.x,
      obs.top + gap,
      obstacleWidth,
      canvas.height - obs.top - gap,
    );

    for (let i = obs.top + gap + 20; i < canvas.height; i += 30) {
      ctx.fillRect(obs.x + 5, i, obstacleWidth - 10, 3);
    }
  });
}

let bitcoins = [];
let hearts = [];

function drawHearts() {
    hearts.forEach(heart => {
        if (!heart.collected) {
            ctx.save();
            ctx.translate(heart.x, heart.y);
            
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 10;
            
            // Draw heart shape
            ctx.fillStyle = '#ff1744';
            ctx.beginPath();
            const s = heart.size / 20; // Scale factor
            ctx.moveTo(0, 0); // Start at bottom tip if not careful, but let's use standard bezier
            // Simplified heart
            ctx.beginPath();
            ctx.moveTo(0, 10 * s);
            ctx.bezierCurveTo(10 * s, -10 * s, 25 * s, 5 * s, 0, 25 * s);
            ctx.bezierCurveTo(-25 * s, 5 * s, -10 * s, -10 * s, 0, 10 * s);
            ctx.fill();
            
            ctx.shadowBlur = 0;
            ctx.restore();
        }
    });
}

function drawBitcoins() {
  bitcoins.forEach((bitcoin) => {
    if (!bitcoin.collected) {
      ctx.save();
      ctx.translate(bitcoin.x, bitcoin.y);
      ctx.rotate(bitcoin.rotation);

      ctx.shadowColor = "#F7931A";
      ctx.shadowBlur = 15;

      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, bitcoin.size);
      gradient.addColorStop(0, "#FFB84D");
      gradient.addColorStop(0.5, "#F7931A");
      gradient.addColorStop(1, "#CC7A00");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, bitcoin.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#996600";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.fillStyle = "white";
      ctx.font = `bold ${bitcoin.size * 1.3}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("₿", 0, 0);

      ctx.restore();
    }
  });
}

function update(timeScale) {
  if (!gameRunning) return;

  owl.velocity += owl.gravity * timeScale;
  owl.y += owl.velocity * timeScale;
  owl.rotation = Math.min(Math.max(owl.velocity * 0.05, -0.5), 0.5);

  if (owl.y + owl.height > canvas.height || owl.y < 0) {
    if (!isInvulnerable) handleCollision();
    if (isInvulnerable) {
        owl.y = Math.max(0, Math.min(owl.y, canvas.height - owl.height));
        owl.velocity = 0;
    }
    return;
  }

  // Decrease invulnerability
  if (isInvulnerable) {
      invulnerableTimer -= 16.67 * timeScale;
      if (invulnerableTimer <= 0) {
          isInvulnerable = false;
      }
  }

  clouds.forEach((cloud) => cloud.update(timeScale));

  obstacleTimer += 16.67 * timeScale; // Approximate ms roughly
  // 120 frames at 60fps is ~2000ms.
  if (obstacleTimer > 2000) {
    obstacleTimer = 0;
    const topHeight = Math.random() * (canvas.height - gap - 100) + 50;
    const newObstacle = {
      x: canvas.width,
      top: topHeight,
      scored: false,
    };
    obstacles.push(newObstacle);

        if (Math.random() < 0.7) {
            let itemX, itemY;
            
            if (Math.random() < 0.5) {
                itemX = newObstacle.x + obstacleWidth / 2;
                itemY = newObstacle.top + gap / 2;
            } else {
                itemX = canvas.width - 120; 
                itemY = Math.random() * (canvas.height - 200) + 100;
            }
            
            // 10% chance for a heart if lives < maxLives
            if (lives < maxLives && Math.random() < 0.1) {
                hearts.push({
                    x: itemX,
                    y: itemY,
                    size: 25,
                    collected: false
                });
            } else {
                bitcoins.push({
                    x: itemX,
                    y: itemY,
                    size: 18,
                    collected: false,
                    rotation: 0
                });
            }
        }
  }

  obstacles.forEach((obs) => {
    obs.x -= 2 * timeScale;

    if (!obs.scored && obs.x + obstacleWidth < owl.x) {
      obs.scored = true;
      score++;
      updateScore();
    }

    if (
      !isInvulnerable &&
      owl.x + owl.width - 10 > obs.x &&
      owl.x + 10 < obs.x + obstacleWidth &&
      (owl.y + 5 < obs.top || owl.y + owl.height - 5 > obs.top + gap)
    ) {
      handleCollision();
    }
  });

  // Remove off-screen obstacles separately to avoid stutter
  obstacles = obstacles.filter(obs => obs.x + obstacleWidth >= 0);

  hearts.forEach((heart) => {
    if (!heart.collected) {
      heart.x -= 2 * timeScale;

      const dx = heart.x - (owl.x + owl.width / 2);
      const dy = heart.y - (owl.y + owl.height / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < owl.width / 2 + heart.size / 2) {
        heart.collected = true;
        if (lives < maxLives) {
          lives++;
          updateLives();
          for (let i = 0; i < 10; i++) {
            particles.push(new Particle(heart.x, heart.y, "#ff1744"));
          }
        }
      }
    }
  });

  // Remove off-screen or collected hearts
  hearts = hearts.filter(heart => heart.x >= -50 && !heart.collected);

  bitcoins.forEach((bitcoin) => {
    if (!bitcoin.collected) {
      bitcoin.x -= 2 * timeScale;
      bitcoin.rotation += 0.05 * timeScale;

      const dx = bitcoin.x - (owl.x + owl.width / 2);
      const dy = bitcoin.y - (owl.y + owl.height / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < owl.width/2 + bitcoin.size) {
                bitcoin.collected = true;
                sessionCoins++;
                totalCoins++;
                localStorage.setItem('cryptoOwlTotalCoins', totalCoins);
                updateScore();

        for (let i = 0; i < 15; i++) {
          particles.push(new Particle(bitcoin.x, bitcoin.y, "#F7931A"));
        }
      }
    }
  });

  // Remove off-screen or collected bitcoins
  bitcoins = bitcoins.filter(bitcoin => bitcoin.x >= -bitcoin.size && !bitcoin.collected);

  particles = particles.filter((p) => p.life > 0);
  particles.forEach((p) => p.update(timeScale));
}

function draw() {
  const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  skyGradient.addColorStop(0, "#1e3c72");
  skyGradient.addColorStop(0.3, "#2a5298");
  skyGradient.addColorStop(0.7, "#7e8ba3");
  skyGradient.addColorStop(1, "#a8b5c8");
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  clouds.forEach((cloud) => cloud.draw());

  drawObstacles();
  drawBitcoins();
  drawHearts();

  particles.forEach((p) => p.draw());

  drawOwl();
}

function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;

  // Normalize to 60 FPS (16.67ms per frame)
  // If playing at 120 FPS, deltaTime is ~8.33ms, timeScale is ~0.5
  // so things move half as much per frame, resulting in same speed per second.
  // Cap at 3.0 (min 20fps) to prevent huge jumps from lag
  const timeScale = Math.min(deltaTime / 16.67, 3.0);

  update(timeScale);
  draw();
  requestAnimationFrame(gameLoop);
}

function startGame() {
    gameRunning = true;
    score = 0;
    sessionCoins = 0;
    lives = 1;
    isInvulnerable = false;
    obstacles = [];
    bitcoins = [];
    hearts = [];
    particles = [];
    obstacleTimer = 0;
    lastTime = performance.now();
    owl.y = canvas.height / 2;
    owl.velocity = 0;
    
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('currentScore').style.display = 'flex';
    
    // Update display with current values
    document.getElementById('highScoreValue').textContent = highScore;
    document.getElementById('totalCoinsValue').textContent = totalCoins;
    updateScore();
    updateLives();
}

function handleCollision() {
    if (lives > 1) {
        lives--;
        isInvulnerable = true;
        invulnerableTimer = 2000; // 2 seconds
        updateLives();
        // Bounce player up slightly?
        owl.velocity = -4; 
    } else {
        gameOver();
    }
}

function updateLives() {
    const container = document.getElementById('livesContainer');
    let heartsString = '';
    for (let i = 0; i < lives; i++) {
        heartsString += '❤️';
    }
    container.textContent = heartsString;
}

function gameOver() {
    gameRunning = false;
    document.getElementById('currentScore').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'block';
    
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalCoins').textContent = sessionCoins;
    document.getElementById('totalCoinsValueEnd').textContent = totalCoins;
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('cryptoOwlHighScore', highScore);
        document.getElementById('highScoreValueEnd').textContent = highScore;
    }
}

function updateScore() {
    document.getElementById('scoreValue').textContent = score;
    document.getElementById('coinsValue').textContent = sessionCoins;
}

function jump() {
  if (gameRunning) {
    owl.velocity = owl.jump;
  }
}

document.addEventListener("click", (e) => {
  // Prevent double jump if clicking a button that also triggers an action
  // But allow start buttons to work naturally
  if (e.target.tagName !== "BUTTON") {
    jump();
  }
});

document.addEventListener(
  "touchstart",
  (e) => {
    if (e.target.tagName !== "BUTTON") {
      e.preventDefault(); // Prevent scrolling
      jump();
    }
  },
  { passive: false },
);

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && gameRunning) {
    e.preventDefault();
    jump();
  }
});

document.getElementById("startBtn").addEventListener("click", startGame);
document.getElementById("restartBtn").addEventListener("click", startGame);

gameLoop();
