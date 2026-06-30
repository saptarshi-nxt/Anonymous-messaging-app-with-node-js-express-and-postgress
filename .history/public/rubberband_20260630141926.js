// Rubber-band card effect: 4 elastic strings connect the .card to the screen corners.
// Drag the card and it stretches the strings; release and spring physics pulls it back.
(function () {
  const card = document.querySelector('.card');
  if (!card) return;

  // Canvas overlay for drawing the strings
  const canvas = document.createElement('canvas');
  canvas.id = 'stringCanvas';
  Object.assign(canvas.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '1',
  });
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Make sure the card sits above the canvas and is draggable
  card.style.position = 'relative';
  card.style.zIndex = '2';
  card.style.cursor = 'grab';
  card.style.touchAction = 'none';
  card.style.userSelect = 'none';

  // Physics state
  let offsetX = 0, offsetY = 0;   // current displacement from rest position
  let velX = 0, velY = 0;         // velocity
  let dragging = false;
  let dragStartX = 0, dragStartY = 0;
  let startOffsetX = 0, startOffsetY = 0;

  const STIFFNESS = 0.08;   // how strongly the rubber band pulls back (higher = snappier)
  const DAMPING = 0.80;     // energy loss per frame (lower = more bounce/wobble)

  card.addEventListener('pointerdown', (e) => {
    dragging = true;
    card.style.cursor = 'grabbing';
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    startOffsetX = offsetX;
    startOffsetY = offsetY;
    velX = 0;
    velY = 0;
    card.setPointerCapture(e.pointerId);
  });

  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    offsetX = startOffsetX + (e.clientX - dragStartX);
    offsetY = startOffsetY + (e.clientY - dragStartY);
  });

  window.addEventListener('pointerup', () => {
    dragging = false;
    card.style.cursor = 'grab';
  });

  function drawString(from, to, restLength) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
    const stretchRatio = Math.max(0, (dist - restLength) / restLength); // 0 = slack, grows as it stretches

    // Base rubber-band color (warm amber) that brightens/whitens as it stretches,
    // just like real rubber going pale under tension.
    const baseColor = [230, 126, 34];   // amber
    const stretchedColor = [255, 235, 180]; // pale taut color
    const t = Math.min(1, stretchRatio * 1.8);
    const r = Math.round(baseColor[0] + (stretchedColor[0] - baseColor[0]) * t);
    const g = Math.round(baseColor[1] + (stretchedColor[1] - baseColor[1]) * t);
    const b = Math.round(baseColor[2] + (stretchedColor[2] - baseColor[2]) * t);

    // Width: thick and slack-loose when relaxed, thins out as it's pulled taut
    const width = Math.max(1.2, 5 - stretchRatio * 3.2);

    ctx.beginPath();

    if (dist <= restLength * 1.02) {
      // Slack: draw a gentle wavy/coiled line, like a loose rubber band hanging
      const segments = 14;
      const perpX = -dy / dist;
      const perpY = dx / dist;
      const slack = (restLength - dist) * 0.15; // how loose it sags
      ctx.moveTo(from.x, from.y);
      for (let i = 1; i < segments; i++) {
        const f = i / segments;
        const wave = Math.sin(f * Math.PI * 6) * slack * Math.sin(f * Math.PI);
        const px = from.x + dx * f + perpX * wave;
        const py = from.y + dy * f + perpY * wave;
        ctx.lineTo(px, py);
      }
      ctx.lineTo(to.x, to.y);
    } else {
      // Taut: straight line, slight bow toward gravity-ish midpoint sag removed as it stretches
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      ctx.moveTo(from.x, from.y);
      ctx.quadraticCurveTo(midX, midY, to.x, to.y);
    }

    const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.95)`);
    gradient.addColorStop(0.5, `rgba(${Math.min(255, r + 25)}, ${Math.min(255, g + 25)}, ${Math.min(255, b + 25)}, 1)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.95)`);

    ctx.lineCap = 'round';
    ctx.strokeStyle = gradient;
    ctx.lineWidth = width;
    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = 3;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function drawPin(point) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#d35400';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(point.x, point.y, 1.6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffe9c7';
    ctx.fill();
  }

  let restLengths = null;

  function computeRestLengths() {
    const rect = card.getBoundingClientRect();
    const cardCorners = [
      { x: rect.left, y: rect.top },
      { x: rect.right, y: rect.top },
      { x: rect.left, y: rect.bottom },
      { x: rect.right, y: rect.bottom },
    ];
    const screenCorners = [
      { x: 0, y: 0 },
      { x: canvas.width, y: 0 },
      { x: 0, y: canvas.height },
      { x: canvas.width, y: canvas.height },
    ];
    restLengths = screenCorners.map((sc, i) => {
      const dx = cardCorners[i].x - sc.x;
      const dy = cardCorners[i].y - sc.y;
      return Math.sqrt(dx * dx + dy * dy);
    });
  }

  window.addEventListener('resize', () => { resizeCanvas(); computeRestLengths(); });

  function animate() {
    if (!dragging) {
      // Spring force pulling back to rest (Hooke's law) + damping
      const fx = -STIFFNESS * offsetX;
      const fy = -STIFFNESS * offsetY;
      velX = (velX + fx) * DAMPING;
      velY = (velY + fy) * DAMPING;
      offsetX += velX;
      offsetY += velY;

      if (Math.abs(offsetX) < 0.05 && Math.abs(velX) < 0.05) { offsetX = 0; velX = 0; }
      if (Math.abs(offsetY) < 0.05 && Math.abs(velY) < 0.05) { offsetY = 0; velY = 0; }
    }

    card.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!restLengths) computeRestLengths();

    const rect = card.getBoundingClientRect();
    const cardCorners = [
      { x: rect.left, y: rect.top },
      { x: rect.right, y: rect.top },
      { x: rect.left, y: rect.bottom },
      { x: rect.right, y: rect.bottom },
    ];
    const screenCorners = [
      { x: 0, y: 0 },
      { x: canvas.width, y: 0 },
      { x: 0, y: canvas.height },
      { x: canvas.width, y: canvas.height },
    ];

    for (let i = 0; i < 4; i++) {
      drawString(screenCorners[i], cardCorners[i], restLengths[i]);
      drawPin(screenCorners[i]);
      drawPin(cardCorners[i]);
    }

    requestAnimationFrame(animate);
  }

  // Wait one frame so layout is settled before measuring rest lengths
  requestAnimationFrame(() => {
    computeRestLengths();
    animate();
  });
})();