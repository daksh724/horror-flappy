// ====== Setup ======
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Fullscreen canvas initial sizing
function resizeCanvas() {
  // keep previous proportions of birdY relative to height
  const prevH = canvas.height || window.innerHeight;
  const prevBirdRatio = birdY / prevH;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  pipeGap = Math.round(canvas.height * 0.32); // recompute gap proportionally
  // reposition bird vertically proportional to previous position (if defined)
  birdX = canvas.width / 6;
  birdY = Math.max(birdRadius + 5, Math.min(canvas.height - birdRadius - 5, (prevBirdRatio || 0.5) * canvas.height));
}
window.addEventListener("resize", resizeCanvas);

// ====== Game variables (tweakable) ======
let birdRadius = 25;
let birdX = 0; // set in resizeCanvas
let birdY = 0; // set in resizeCanvas
let gravity = 0.4; // decreased by ~10%
let velocity = 0;
let jump = -8;

let pipes = [];
let pipeWidth = Math.round(Math.max(50, window.innerWidth * 0.06));
let pipeGap = Math.round(window.innerHeight * 0.32); // vertical gap
let frame = 0;
let score = 0;
let pipeSpeed = 1.8; // slower
let spawnInterval = 170; // frames between pipes (bigger => more horizontal distance)
let isGameOver = false;
let animationId = null;

// initialize sizes & positions
resizeCanvas();
birdX = canvas.width / 6;
birdY = canvas.height / 2;

// ====== Input handling (works for play + restart) ======
function flapOrRestart() {
  if (isGameOver) restartGame();
  else velocity = jump;
}

// keyboard
document.addEventListener("keydown", (e) => {
  // allow space or ArrowUp or any key to flap
  if (e.code === "Space" || e.code === "ArrowUp" ) {
    e.preventDefault();
    flapOrRestart();
  }
});

// touch/click
document.addEventListener("touchstart", (e) => {
  e.preventDefault();
  flapOrRestart();
}, {passive:false});

document.addEventListener("mousedown", (e) => {
  // desktop click to flap
  flapOrRestart();
});

// ====== Game functions ======
function spawnPipe() {
  // choose random top pipe end (min margin)
  const margin = 100;
  const maxTop = canvas.height - pipeGap - margin;
  const topHeight = Math.floor(Math.random() * (maxTop - margin + 1)) + margin;
  pipes.push({ x: canvas.width, y: topHeight, passed: false });
}

function drawBird() {
  ctx.beginPath();
  ctx.arc(birdX, birdY, birdRadius, 0, Math.PI * 2);
  ctx.fillStyle = "black";
  ctx.fill();
  ctx.strokeStyle = "bloodred";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.closePath();
}

function drawPipes() {
  ctx.fillStyle = "green";
  for (let i = 0; i < pipes.length; i++) {
    const p = pipes[i];
    // top pipe
    ctx.fillRect(p.x, 0, pipeWidth, p.y);
    // bottom pipe
    ctx.fillRect(p.x, p.y + pipeGap, pipeWidth, canvas.height - (p.y + pipeGap));
  }
}

function detectCollisions() {
  for (let i = 0; i < pipes.length; i++) {
    const p = pipes[i];
    if (
      birdX + birdRadius > p.x &&
      birdX - birdRadius < p.x + pipeWidth &&
      (birdY - birdRadius < p.y || birdY + birdRadius > p.y + pipeGap)
    ) {
      return true;
    }
  }
  // top/bottom
  if (birdY - birdRadius < 0 || birdY + birdRadius > canvas.height) return true;
  return false;
}

function updateScore() {
  for (let i = 0; i < pipes.length; i++) {
    const p = pipes[i];
    if (!p.passed && p.x + pipeWidth < birdX) {
      p.passed = true;
      score++;
      // small visual feedback: brief scale effect (simple)
      flashScore();
    }
  }
}

// visual score flash (very small, temporary)
let scoreFlashTimer = 0;
function flashScore() {
  scoreFlashTimer = 12; // frames to flash
}

function drawScore() {
  ctx.save();
  ctx.fillStyle = "black";
  let size = 28;
  if (scoreFlashTimer > 0) {
    size = 34;
    scoreFlashTimer--;
  }
  ctx.font = `${size}px Arial`;
  ctx.fillText("Score: " + score, 20, 40);
  ctx.restore();
}

function clearOffscreenPipes() {
  pipes = pipes.filter(p => p.x + pipeWidth > 0);
}

function gameOver() {
  isGameOver = true;
  // stop animation loop (it will not request another frame)
  if (animationId) cancelAnimationFrame(animationId);
  // show message on canvas
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  ctx.font = "60px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 20);
  ctx.font = "24px Arial";
  ctx.fillText("Tap / Click / Press Space to Restart", canvas.width / 2, canvas.height / 2 + 30);
  ctx.restore();
}

function restartGame() {
  // reset everything
  pipes = [];
  score = 0;
  frame = 0;
  velocity = 0;
  isGameOver = false;
  birdX = canvas.width / 6;
  birdY = canvas.height / 2;
  // start loop again
  loop();
}

// ====== Main loop ======
function loop() {
  // stop if game ended
  if (isGameOver) return;

  // clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // spawn pipes occasionally
  if (frame % spawnInterval === 0) spawnPipe();

  // update pipes
  for (let i = 0; i < pipes.length; i++) {
    pipes[i].x -= pipeSpeed;
  }

  // bird physics
  velocity += gravity;
  birdY += velocity;

  // draw
  drawPipes();
  drawBird();

  // scoring
  updateScore();
  drawScore();

  // remove offscreen pipes
  clearOffscreenPipes();

  // detect collisions AFTER movement/drawing
  if (detectCollisions()) {
    gameOver();
    return;
  }

  frame++;
  animationId = requestAnimationFrame(loop);
}

// start
loop();
