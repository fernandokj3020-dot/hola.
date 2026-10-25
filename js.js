const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const bgMusic = document.getElementById('bg-music');
const overlayStart = document.getElementById('overlay-start');
const btnStart = document.getElementById('btn-start');

let width, height, dpr;
let musicStarted = false;
let audioCtx = null;
let synthInterval = null;

// Secuencia exacta del mensaje en orden
const wordList = [
  "QUE", "TE", "VAYA", "SUPER", "BIEN", 
  "EN", "TU", "PRIMER", "DIA", 
  "DE", "TRABAJO", "MI", "AMOR", "RECUERDA",
  "QUE", "TU", "PUEDES", "CON", "TODO", "EL", "MEJOR", "DE", 
  "LOS", "ANIMOS", "TE", "AMO...♡"
];

let wordIndex = 0;

const colors = [
  { r: 0, g: 243, b: 255 },   
  { r: 255, g: 0, b: 128 },   
  { r: 157, g: 0, b: 255 },   
  { r: 0, g: 255, b: 150 },   
  { r: 255, g: 200, b: 0 }    
];

// Generador de audio sintético de respaldo por si el archivo MP3 no carga
function startSynthFallback() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  
  if (!synthInterval) {
    const notes = [261.63, 329.63, 392.00, 523.25, 587.33, 659.25];
    synthInterval = setInterval(() => {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const freq = notes[Math.floor(Math.random() * notes.length)];
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.06, audioCtx.currentTime + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 3.0);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 3.0);
    }, 900);
  }
}

// Iniciar música con el toque del usuario
function startExperience(e) {
  if (e) e.preventDefault();

  if (!musicStarted && bgMusic) {
    bgMusic.volume = 0.8;
    
    const playPromise = bgMusic.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        musicStarted = true;
      }).catch(err => {
        console.warn("No se pudo cargar el archivo mp3. Activando sintetizador de respaldo:", err);
        startSynthFallback();
      });
    }
  } else {
    startSynthFallback();
  }

  // Ocultar overlay
  if (overlayStart) {
    overlayStart.style.opacity = '0';
    setTimeout(() => {
      overlayStart.style.visibility = 'hidden';
      overlayStart.style.display = 'none';
    }, 500);
  }
}

if (btnStart) {
  btnStart.addEventListener('click', startExperience);
  btnStart.addEventListener('touchstart', startExperience, { passive: false });
}

function setupCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);
  initStars();
}

window.addEventListener('resize', setupCanvas);

const stars = [];
function initStars() {
  stars.length = 0;
  const numStars = Math.floor((width * height) / 2000);
  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.5 + 0.3,
      alpha: Math.random(),
      speed: Math.random() * 0.02 + 0.005
    });
  }
}

function drawStars() {
  ctx.save();
  stars.forEach(star => {
    star.alpha += star.speed;
    if (star.alpha > 1 || star.alpha < 0) {
      star.speed = -star.speed;
    }
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(star.alpha)})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

const orbes = [];
const particles = [];
const floatingTexts = [];

class Orb {
  constructor(word, startY) {
    const minDimension = Math.min(width, height);
    
    if (width < 600) {
      this.radius = 34; 
    } else {
      this.radius = Math.random() * (minDimension * 0.015) + (minDimension * 0.04);
    }
    
    const padding = this.radius + 20;
    this.x = Math.random() * (width - padding * 2) + padding;
    this.y = startY;
    
    this.word = word;
    this.speedY = 1.3; 
    
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.angle = Math.random() * Math.PI * 2;
    this.swingSpeed = 0.02;
    this.swingAmplitude = width < 600 ? 0.2 : 0.4;
    this.pulse = 0;
    this.active = true;
  }

  update() {
    this.y -= this.speedY;
    this.angle += this.swingSpeed;
    this.x += Math.sin(this.angle) * this.swingAmplitude;
    
    const safetyMargin = this.radius + 8;
    if (this.x < safetyMargin) this.x = safetyMargin;
    if (this.x > width - safetyMargin) this.x = width - safetyMargin;

    this.pulse += 0.05;

    if (this.y + this.radius <= 0) {
      this.explode(false); 
    }
  }

  draw() {
    ctx.save();
    const currentRadius = this.radius + Math.sin(this.pulse) * 2;
    const { r, g, b } = this.color;

    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, currentRadius
    );
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.85)`);
    gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.25)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, currentRadius * 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.9)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    const fontSize = width < 600 ? Math.max(9, Math.floor(currentRadius * 0.28)) : Math.max(12, Math.floor(currentRadius * 0.33));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
    ctx.shadowBlur = 8;
    ctx.fillText(this.word, this.x, this.y);

    ctx.restore();
  }

  explode(manual = true) {
    if (!this.active) return;
    this.active = false;

    const particleCount = width < 600 ? 25 : 40;
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(this.x, this.y, this.color));
    }
    
    if (manual) {
      floatingTexts.push(new FloatingText(this.x, this.y, this.word, this.color));
    }
  }
}

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = Math.random() * 2.5 + 1;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 4 + 1.5;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.alpha = 1;
    this.decay = Math.random() * 0.03 + 0.015;
    this.gravity = 0.03;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.vx *= 0.96;
    this.vy *= 0.96;
    this.alpha -= this.decay;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = `rgb(${this.color.r}, ${this.color.g}, ${this.color.b})`;
    ctx.shadowColor = `rgb(${this.color.r}, ${this.color.g}, ${this.color.b})`;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class FloatingText {
  constructor(x, y, text, color) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.alpha = 1;
    this.scale = 1;
  }

  update() {
    this.y -= 0.8;
    this.scale += 0.012;
    this.alpha -= 0.025;
  }

  draw() {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = "#ffffff";
    const baseSize = width < 600 ? 16 : 22;
    ctx.font = `bold ${Math.floor(baseSize * this.scale)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = `rgb(${this.color.r}, ${this.color.g}, ${this.color.b})`;
    ctx.shadowBlur = 12;
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

setupCanvas();

function spawnNextWord() {
  let startY = height + 60;
  
  if (orbes.length > 0) {
    const lastOrb = orbes[orbes.length - 1];
    const distanceBetween = width < 600 ? 140 : 170;
    if (lastOrb.y > height - distanceBetween) {
      startY = lastOrb.y + distanceBetween;
    }
  }

  const word = wordList[wordIndex];
  orbes.push(new Orb(word, startY));
  wordIndex = (wordIndex + 1) % wordList.length; 
}

for (let i = 0; i < 3; i++) {
  spawnNextWord();
}

function handleInteraction(clientX, clientY) {
  orbes.forEach(orb => {
    if (orb.active) {
      const dist = Math.hypot(orb.x - clientX, orb.y - clientY);
      if (dist < orb.radius + 25) {
        orb.explode(true);
      }
    }
  });
}

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  for (let i = 0; i < e.touches.length; i++) {
    handleInteraction(e.touches[i].clientX, e.touches[i].clientY);
  }
}, { passive: false });

canvas.addEventListener('click', (e) => {
  handleInteraction(e.clientX, e.clientY);
});

function animate() {
  ctx.fillStyle = '#020208';
  ctx.fillRect(0, 0, width, height);

  drawStars();

  if (orbes.length < 5) {
    spawnNextWord();
  }

  for (let i = orbes.length - 1; i >= 0; i--) {
    const orb = orbes[i];
    if (orb.active) {
      orb.update();
      orb.draw();
    } else {
      orbes.splice(i, 1);
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].draw();
    if (particles[i].alpha <= 0) {
      particles.splice(i, 1);
    }
  }

  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    floatingTexts[i].update();
    floatingTexts[i].draw();
    if (floatingTexts[i].alpha <= 0) {
      floatingTexts.splice(i, 1);
    }
  }

  requestAnimationFrame(animate);
}

animate();