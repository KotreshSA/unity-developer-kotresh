const canvas = document.querySelector("#heroCanvas");
const ctx = canvas.getContext("2d");

let width = 0;
let height = 0;
let carX = 0;
let targetX = 0;
let animationFrame = 0;
let effects = [];
let triggeredTrackItems = new Set();
let shakeUntil = 0;

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  width = canvas.clientWidth;
  height = canvas.clientHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  carX = width * 0.68;
  targetX = carX;
}

function drawTrack(time) {
  const horizon = height * 0.18;
  const roadTop = width * 0.12;
  const roadBottom = width * 0.88;

  ctx.clearRect(0, 0, width, height);

  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#172232");
  sky.addColorStop(0.55, "#1f3740");
  sky.addColorStop(1, "#101820");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#243f39";
  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(width * 0.42, horizon);
  ctx.lineTo(width * 0.58, horizon);
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#1b2229";
  ctx.beginPath();
  ctx.moveTo(width * 0.5 - roadTop, horizon);
  ctx.lineTo(width * 0.5 + roadTop, horizon);
  ctx.lineTo(width * 0.5 + roadBottom, height);
  ctx.lineTo(width * 0.5 - roadBottom, height);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(184, 242, 79, 0.75)";
  ctx.lineWidth = 4;
  for (let i = 0; i < 8; i += 1) {
    const y = horizon + ((i * 92 + time * 0.08) % (height - horizon + 120));
    const scale = (y - horizon) / (height - horizon);
    const half = 10 + scale * 260;
    ctx.beginPath();
    ctx.moveTo(width * 0.5 - half, y);
    ctx.lineTo(width * 0.5 + half, y);
    ctx.stroke();
  }

  for (let i = 0; i < 10; i += 1) {
    const trackLength = height - horizon + 150;
    const travel = i * 126 + time * 0.1;
    const y = horizon + (travel % trackLength);
    const scale = (y - horizon) / (height - horizon);
    const lane = [-0.22, 0.12, 0.34][i % 3];
    const roadHalf = roadTop + scale * (roadBottom - roadTop);
    const x = width * 0.5 + lane * roadHalf;
    const size = 8 + scale * 24;
    const isBomb = i % 4 === 1;
    const itemKey = `${i}-${Math.floor(travel / trackLength)}`;

    if (!triggeredTrackItems.has(itemKey) && hasCarCollision(x, y, size)) {
      triggeredTrackItems.add(itemKey);
      spawnEffect(x, y, isBomb ? "bomb" : "coin", time);
    }

    if (triggeredTrackItems.has(itemKey) && !isBomb) {
      continue;
    }

    if (isBomb) {
      drawBomb(x, y, size);
    } else {
      drawCoin(x, y, size);
    }
  }

  for (let i = 0; i < 7; i += 1) {
    const x = width * (0.14 + i * 0.13);
    const y = height * (0.34 + ((i % 2) * 0.12));
    drawCrystal(x, y, 24 + i * 3, i % 2 === 0 ? "#43d7a5" : "#b8f24f", time + i * 240);
  }
}

function hasCarCollision(x, y, size) {
  const carY = height * 0.72;
  const hitWidth = 54 + size;
  const hitHeight = 78 + size;
  return Math.abs(x - carX) < hitWidth && Math.abs(y - carY) < hitHeight;
}

function spawnEffect(x, y, type, time) {
  const colors =
    type === "bomb"
      ? ["#ff6961", "#ffd166", "#ffffff", "#ff9f1c"]
      : ["#ffd166", "#fff4a3", "#ffffff", "#b8f24f"];
  const count = type === "bomb" ? 28 : 18;

  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.35;
    const speed = (type === "bomb" ? 2.4 : 1.45) + Math.random() * 3.1;
    effects.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (type === "coin" ? 1.8 : 0.8),
      size: (type === "bomb" ? 3.5 : 2.5) + Math.random() * 5,
      color: colors[i % colors.length],
      createdAt: time,
      lifetime: type === "bomb" ? 620 : 520,
      type,
    });
  }

  if (type === "bomb") {
    shakeUntil = time + 360;
  }

  if (triggeredTrackItems.size > 60) {
    triggeredTrackItems = new Set(Array.from(triggeredTrackItems).slice(-30));
  }
}

function drawEffects(time) {
  for (let i = effects.length - 1; i >= 0; i -= 1) {
    const effect = effects[i];
    const age = time - effect.createdAt;

    if (age > effect.lifetime) {
      effects.splice(i, 1);
      continue;
    }

    const progress = age / effect.lifetime;
    const x = effect.x + effect.vx * age * 0.055;
    const y = effect.y + effect.vy * age * 0.055 + progress * progress * 42;
    const alpha = 1 - progress;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = effect.color;
    ctx.beginPath();
    ctx.arc(x, y, effect.size * (1 - progress * 0.35), 0, Math.PI * 2);
    ctx.fill();

    if (effect.type === "bomb" && i % 5 === 0) {
      ctx.strokeStyle = effect.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = alpha * 0.55;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 18 + progress * 58, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

function drawCoin(x, y, size) {
  ctx.save();
  ctx.fillStyle = "#ffd166";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.72)";
  ctx.lineWidth = Math.max(2, size * 0.12);
  ctx.beginPath();
  ctx.ellipse(x, y, size * 0.82, size, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(16, 24, 32, 0.28)";
  ctx.beginPath();
  ctx.ellipse(x, y, size * 0.28, size * 0.62, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBomb(x, y, size) {
  ctx.save();
  ctx.fillStyle = "#161b22";
  ctx.beginPath();
  ctx.arc(x, y + size * 0.12, size * 0.82, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#ff6961";
  ctx.lineWidth = Math.max(2, size * 0.12);
  ctx.beginPath();
  ctx.moveTo(x + size * 0.24, y - size * 0.58);
  ctx.quadraticCurveTo(x + size * 0.58, y - size * 1.1, x + size * 0.9, y - size * 0.74);
  ctx.stroke();

  ctx.fillStyle = "#ff6961";
  ctx.beginPath();
  ctx.arc(x + size * 0.96, y - size * 0.7, size * 0.18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
  ctx.beginPath();
  ctx.arc(x - size * 0.24, y - size * 0.18, size * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCrystal(x, y, size, color, time) {
  const blink = 0.5 + Math.sin(time * 0.004) * 0.32;
  const pulseSize = size * (0.92 + blink * 0.16);

  ctx.save();
  ctx.globalAlpha = blink;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - pulseSize);
  ctx.lineTo(x + pulseSize * 0.7, y);
  ctx.lineTo(x, y + pulseSize);
  ctx.lineTo(x - pulseSize * 0.7, y);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = blink * 0.28;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y - pulseSize * 1.18);
  ctx.lineTo(x + pulseSize * 0.82, y);
  ctx.lineTo(x, y + pulseSize * 1.18);
  ctx.lineTo(x - pulseSize * 0.82, y);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawCar(time) {
  carX += (targetX - carX) * 0.035;
  const carY = height * 0.72;
  const bounce = Math.sin(time * 0.006) * 3;
  const shake = time < shakeUntil ? Math.sin(time * 0.12) * 8 : 0;

  ctx.save();
  ctx.translate(carX + shake, carY + bounce);
  ctx.rotate((carX - width * 0.68) * 0.0007);

  ctx.fillStyle = "rgba(0, 0, 0, 0.36)";
  ctx.beginPath();
  ctx.ellipse(0, 72, 82, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#d9ff3f";
  roundRect(-54, -82, 108, 154, 24);
  ctx.fill();

  ctx.fillStyle = "#18212b";
  roundRect(-34, -52, 68, 32, 9);
  ctx.fill();
  roundRect(-34, 28, 68, 28, 9);
  ctx.fill();

  ctx.fillStyle = "#43d7a5";
  roundRect(-44, -14, 88, 34, 12);
  ctx.fill();

  ctx.fillStyle = "#101820";
  roundRect(-72, -48, 18, 50, 7);
  roundRect(54, -48, 18, 50, 7);
  roundRect(-72, 26, 18, 50, 7);
  roundRect(54, 26, 18, 50, 7);
  ctx.fill();

  ctx.restore();
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function animate(time) {
  drawTrack(time);
  drawCar(time);
  drawEffects(time);
  animationFrame = requestAnimationFrame(animate);
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("pointermove", (event) => {
  targetX = Math.max(width * 0.36, Math.min(width * 0.9, event.clientX));
});

resizeCanvas();
animationFrame = requestAnimationFrame(animate);

window.addEventListener("beforeunload", () => {
  cancelAnimationFrame(animationFrame);
});

const videoPlayers = document.querySelectorAll(".video-player");

function resetVideoPlayer(player) {
  if (!player.classList.contains("is-playing")) {
    return;
  }

  player.classList.remove("is-playing");
  player.innerHTML = player.dataset.previewHtml;
}

videoPlayers.forEach((player) => {
  player.dataset.previewHtml = player.innerHTML;

  player.addEventListener("click", () => {
    const videoSrc = player.dataset.videoSrc;
    const videoId = player.dataset.youtubeId;

    if (player.querySelector("iframe") || player.querySelector("video")) {
      return;
    }

    if (videoSrc) {
      const video = document.createElement("video");
      video.title = player.dataset.videoTitle || "Gameplay video";
      video.src = videoSrc;
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;

      player.textContent = "";
      player.classList.add("is-playing");
      player.appendChild(video);
      return;
    }

    if (!videoId) {
      return;
    }

    const frame = document.createElement("iframe");
    const origin = window.location.origin.startsWith("http")
      ? `&origin=${encodeURIComponent(window.location.origin)}`
      : "";

    frame.title = player.dataset.videoTitle || "Gameplay video";
    frame.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1${origin}`;
    frame.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.allowFullscreen = true;

    player.textContent = "";
    player.classList.add("is-playing");
    player.appendChild(frame);
  });
});

const videoObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.intersectionRatio < 0.35) {
        resetVideoPlayer(entry.target);
      }
    });
  },
  { threshold: [0, 0.35, 0.7] },
);

videoPlayers.forEach((player) => videoObserver.observe(player));

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
);

document.querySelectorAll(".video-showcase").forEach((showcase) => {
  const player = showcase.querySelector(".video-player");
  const copy = showcase.querySelector(".video-copy");
  const isAlt = showcase.classList.contains("video-showcase-alt");

  if (player) {
    player.classList.add("scroll-reveal", isAlt ? "reveal-right" : "reveal-left");
  }

  if (copy) {
    copy.classList.add("scroll-reveal", isAlt ? "reveal-left" : "reveal-right");
  }
});

document
  .querySelectorAll(".section-heading, .skill-list > div, .timeline > div, .contact-section > div")
  .forEach((element) => {
    element.classList.add("scroll-reveal", "reveal-up");
  });

document.querySelectorAll(".scroll-reveal").forEach((element) => {
  revealObserver.observe(element);
});
