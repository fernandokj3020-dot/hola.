const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const bgMusic = document.getElementById('bg-music');

let width, height, dpr;
let musicStarted = false;

// Secuencia exacta del mensaje en orden
const wordList = [
  "QUE", "TE", "VAYA", "SUPER", "BIEN", 
  "EN", "TU", "PRIMER", "DIA", 
  "DE", "TRABAJO", "MI", "AMOR", "RECUERDA",
  "QUE", "TU", "PUEDES", "CON", "TODO", "EL", "MEJOR", "DE", 
  "LOS", "ANIMOS", "TE", "AMO...♡"
];

let wordIndex = 0; // Índice global para mantener el orden secuencial

const colors = [
  { r: 0, g: 243, b: 255 },   // Cían neón
  { r: 255, g: 0, b: 128 },   // Magenta / Rosa
  { r: 157, g: 0, b: 255 },   // Púrpura
  { r: 0, g: 255, b: 150 },   // Verde neón
  { r: 255, g: 200, b: 0 }    // Dorado
];

// Activar audio al interactuar
function playAudio() {
  if (!musicStarted && bgMusic) {
    bgMusic.volume = 0.7;
    bgMusic.play().then(() => {
      musicStarted = true;
    }).catch(err => {
      console.log("Error al reproducir audio:", err);
    });
  }
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

// Fondo de Estrellas Titilantes
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

// Clase Orbe con asignación secuencial de palabras
class Orb {
  constructor(initialDelay = 0) {
    this.reset(initialDelay);
  }

  reset(extraDelay = 0) {
    const minDimension = Math.min(width, height);
    this.radius = Math.random() * (minDimension * 0.035) + (minDimension * 0.055);
    this.x = Math.random() * (width - this.radius * 2) + this.radius;
    
    // Asignar palabra en el ORDEN EXACTO del mensaje
    this.word = wordList[wordIndex];
    wordIndex = (wordIndex + 1) % wordList.length; // Avanzar al siguiente término

    this.y = height + this.radius + extraDelay;
    this.speedY = Math.random() * 0.8 + 1.0; // Velocidad de subida constante
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.angle = Math.random() * Math.PI * 2;
    this.swingSpeed = Math.random() * 0.02 + 0.01;
    this.swingAmplitude = Math.random() * 1.0 + 0.3;
    this.pulse = 0;
  }

  update() {
    this.y -= this.speedY;
    this.angle += this.swingSpeed;
    this.x += Math.sin(this.angle) * this.swingAmplitude;
    this.pulse += 0.05;

    // Explotar al llegar arriba
    if (this.y - this.radius <= 50) {
      this.explode();
    }
  }

  draw() {
    ctx.save();
    const currentRadius = this.radius + Math.sin(this.pulse) * 2;
    const { r, g, b } = this.color;

    // Resplandor neón
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

    // Borde brillante
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.9)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Palabra interna
    ctx.fillStyle = "#ffffff";
    const fontSize = Math.max(10, Math.floor(currentRadius * 0.35));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
    ctx.shadowBlur = 8;
    ctx.fillText(this.word, this.x, this.y);

    ctx.restore();
  }

  explode() {
    const particleCount = width < 600 ? 35 : 50;
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(this.x, this.y, this.color));
    }
    floatingTexts.push(new FloatingText(this.x, this.y, this.word, this.color));
    
    // Al reiniciar la orbe, toma la siguiente palabra de la secuencia
    this.reset(Math.random() * 60);
  }
}

// Partículas tras la explosión
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = Math.random() * 3 + 1;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 6 + 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.alpha = 1;
    this.decay = Math.random() * 0.025 + 0.015;
    this.gravity = 0.04;
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
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Texto flotante al explotar
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
    this.scale += 0.015;
    this.alpha -= 0.025;
  }

  draw() {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = "#ffffff";
    const baseSize = width < 600 ? 18 : 22;
    ctx.font = `bold ${Math.floor(baseSize * this.scale)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = `rgb(${this.color.r}, ${this.color.g}, ${this.color.b})`;
    ctx.shadowBlur = 15;
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

// Inicializar el Canvas
setupCanvas();

// Crear orbes espaciadas en altura para que vayan emergiendo progresivamente en orden
const totalOrbs = width < 600 ? 5 : 7;
for (let i = 0; i < totalOrbs; i++) {
  orbes.push(new Orb(i * 120)); // Distancia inicial en Y
}

// Eventos táctiles y de clic para iniciar música y explotar orbes
window.addEventListener('click', playAudio, { once: true });
window.addEventListener('touchstart', playAudio, { once: true });

function handleInteraction(clientX, clientY) {
  orbes.forEach(orb => {
    const dist = Math.hypot(orb.x - clientX, orb.y - clientY);
    if (dist < orb.radius + 25) {
      orb.explode();
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

// Bucle de animación
function animate() {
  ctx.fillStyle = '#020208';
  ctx.fillRect(0, 0, width, height);

  drawStars();

  orbes.forEach(orb => {
    orb.update();
    orb.draw();
  });

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