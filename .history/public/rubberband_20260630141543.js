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

  function drawString(from, to) {
    // Slight curve + thinning as the string stretches, for an elastic feel
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const restLength = Math.min(canvas.width, canvas.height) * 0.4;
    const stretch = Math.max(0, dist - restLength);

    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.quadraticCurveTo(midX, midY, to.x, to.y);
    ctx.lineWidth = Math.max(1, 3 - stretch / 250);
    ctx.strokeStyle = `rgba(255,255,255,${Math.min(0.85, 0.4 + stretch / 600)})`;
    ctx.stroke();
  }

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
      drawString(screenCorners[i], cardCorners[i]);
    }

    requestAnimationFrame(animate);
  }

  animate();
})();
