export const TIMELINE = Object.freeze({
  INITIALIZING: 0,
  CONNECTING: 500,
  COMPLETE: 2000,
  FRAGMENTING: 2800,
  RECONSTRUCTING: 3600,
  REVEALING: 4400,
  DONE: 5200
});

const PANEL_STATES = [
  'is-initializing', 'is-connecting', 'is-complete', 'is-fragmenting'
];

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

function createElement(className, value = '') {
  const element = document.createElement('div');
  element.className = className;
  element.textContent = value;
  return element;
}

// Sample the rendered word, so every fragment begins on a visible letter.
function sampleLetterPixels(label, limit) {
  const rect = label.getBoundingClientRect();
  const canvas = document.createElement('canvas');
  const width = Math.max(1, Math.ceil(rect.width));
  const height = Math.max(1, Math.ceil(rect.height));
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return [];
  const style = getComputedStyle(label);
  context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  if ('letterSpacing' in context) context.letterSpacing = style.letterSpacing;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#fff';
  context.fillText(label.textContent, width / 2, height / 2, width);
  const pixels = context.getImageData(0, 0, width, height).data;
  const columns = window.innerWidth <= 600 ? 12 : 16;
  const rows = 4;
  const candidates = [];
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const left = Math.floor(column * width / columns);
      const right = Math.ceil((column + 1) * width / columns);
      const top = Math.floor(row * height / rows);
      const bottom = Math.ceil((row + 1) * height / rows);
      let weight = 0, xSum = 0, ySum = 0;
      for (let y = top; y < bottom; y += 2) {
        for (let x = left; x < right; x += 2) {
          const alpha = pixels[(y * width + x) * 4 + 3];
          if (alpha < 64) continue;
          weight += alpha;
          xSum += x * alpha;
          ySum += y * alpha;
        }
      }
      if (weight) candidates.push({ x: rect.left + xSum / weight, y: rect.top + ySum / weight });
    }
  }
  if (candidates.length <= limit) return candidates;
  return Array.from({ length: limit }, (_, index) => candidates[Math.floor(index * candidates.length / limit)]);
}

function visibleCardPoint(rect, index, total) {
  const left = rect.left + 10;
  const right = rect.right - 10;
  const top = rect.top + 10;
  const bottom = Math.min(rect.bottom - 10, window.innerHeight - 12);
  const width = Math.max(1, right - left);
  const height = Math.max(1, bottom - top);
  const hasBottom = rect.bottom <= window.innerHeight;
  const perimeter = width + height * 2 + (hasBottom ? width : 0);
  let distance = (index + .5) * perimeter / total;
  if (distance < width) return { x: left + distance, y: top };
  distance -= width;
  if (distance < height) return { x: right, y: top + distance };
  distance -= height;
  if (hasBottom) {
    if (distance < width) return { x: right - distance, y: bottom };
    distance -= width;
  }
  return { x: left, y: bottom - Math.min(distance, height) };
}

export function createRunAnimation({
  panel, networkArt, phaseLabel, statusLabel, liveStatus, button,
  messageScreen, onPrepareMessage, onRevealMessage, onComplete
}) {
  let state = 'idle';
  let generation = 0;
  let timers = [];
  let animations = [];
  let stage = null;
  let completeLabel = null;
  let ghost = null;
  let fragments = [];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function schedule(at, action) {
    const currentGeneration = generation;
    const timer = window.setTimeout(() => {
      if (generation === currentGeneration) action();
    }, at);
    timers.push(timer);
  }

  function setState(next, title, status) {
    state = next;
    panel.classList.remove(...PANEL_STATES);
    panel.classList.add(`is-${next}`);
    phaseLabel.textContent = title;
    statusLabel.textContent = status;
    liveStatus.textContent = status;
  }

  function createStage() {
    stage = createElement('compilation-stage is-complete');
    stage.setAttribute('aria-hidden', 'true');
    const word = createElement('complete-word');
    const check = createElement('complete-check', '✓');
    completeLabel = document.createElement('span');
    completeLabel.className = 'complete-label';
    completeLabel.textContent = 'COMPLETE';
    word.append(check, completeLabel);
    const core = networkArt.querySelector('.network-core');
    const rect = (core || networkArt).getBoundingClientRect();
    const centerX = clamp(rect.left + rect.width / 2, 24, window.innerWidth - 24);
    const centerY = clamp(rect.top + rect.height / 2, 90, Math.max(90, window.innerHeight - 90));
    word.style.left = `${centerX}px`;
    word.style.top = `${centerY}px`;
    ghost = createElement('card-ghost');
    stage.append(word, ghost);
    document.body.append(stage);
  }

  function fragmentWord() {
    if (!stage || !completeLabel) return;
    stage.classList.add('is-fragmenting');
    const rect = completeLabel.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const positions = sampleLetterPixels(completeLabel, window.innerWidth <= 600 ? 24 : 36);
    fragments = positions.map((origin, index) => {
      const element = createElement(`data-fragment${index % 11 === 0 ? ' is-orange' : ''}`);
      element.style.left = `${origin.x}px`;
      element.style.top = `${origin.y}px`;
      stage.append(element);
      const spreadX = Math.min(window.innerWidth * .12, 95);
      const spreadY = Math.min(window.innerHeight * .1, 68);
      const dx = (origin.x - centerX) * .27 + Math.sin((index + 1) * 2.47) * spreadX * .5;
      const dy = (origin.y - centerY) * .65 + Math.cos((index + 1) * 1.89) * spreadY * .5;
      const scatter = {
        x: clamp(origin.x + dx, 12, window.innerWidth - 12),
        y: clamp(origin.y + dy, 12, window.innerHeight - 12)
      };
      const rotation = Math.round(Math.sin(index * 2.31) * 40);
      const motion = element.animate([
        { transform: 'translate(-50%,-50%) rotate(0deg) scale(1)', opacity: 1 },
        { transform: `translate(-50%,-50%) translate(${scatter.x - origin.x}px,${scatter.y - origin.y}px) rotate(${rotation}deg) scale(.8)`, opacity: .9 }
      ], { duration: 800, easing: 'cubic-bezier(.2,.7,.25,1)', fill: 'forwards' });
      animations.push(motion);
      return { element, scatter, rotation, motion, target: null };
    });
  }

  function reconstructCard(rect) {
    if (!stage || !rect) return;
    ghost.style.left = `${rect.left}px`;
    ghost.style.top = `${rect.top}px`;
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    stage.classList.add('is-reconstructing');
    fragments.forEach((fragment, index) => {
      const { element, scatter, rotation } = fragment;
      const target = visibleCardPoint(rect, index, fragments.length);
      fragment.target = target;
      fragment.motion.cancel();
      element.style.left = `${scatter.x}px`;
      element.style.top = `${scatter.y}px`;
      const motion = element.animate([
        { transform: `translate(-50%,-50%) rotate(${rotation}deg) scale(.8)`, opacity: .9 },
        { transform: `translate(-50%,-50%) translate(${target.x - scatter.x}px,${target.y - scatter.y}px) rotate(0deg) scale(.55)`, opacity: .8 }
      ], { duration: 800, easing: 'cubic-bezier(.35,0,.2,1)', fill: 'forwards' });
      fragment.motion = motion;
      animations.push(motion);
    });
  }

  function handOff() {
    if (stage) stage.classList.add('is-handing-off');
    fragments.forEach(fragment => {
      fragment.motion.cancel();
      if (!fragment.target) return;
      fragment.element.style.left = `${fragment.target.x}px`;
      fragment.element.style.top = `${fragment.target.y}px`;
      fragment.element.style.transform = 'translate(-50%,-50%) scale(.55)';
      const fade = fragment.element.animate([{ opacity: .8 }, { opacity: 0 }], { duration: 300, fill: 'forwards' });
      animations.push(fade);
    });
    onRevealMessage();
  }

  function clearStage() {
    animations.forEach(animation => animation.cancel());
    animations = [];
    fragments = [];
    stage?.remove();
    stage = null;
    completeLabel = null;
    ghost = null;
  }

  function finish() {
    state = 'done';
    timers = [];
    clearStage();
    liveStatus.textContent = 'Lời chúc đã sẵn sàng.';
    onComplete();
  }

  function reset() {
    generation++;
    timers.forEach(timer => clearTimeout(timer));
    timers = [];
    clearStage();
    state = 'idle';
    button.disabled = false;
    panel.classList.remove(...PANEL_STATES);
    messageScreen.classList.remove('is-preparing', 'is-visible');
    phaseLabel.textContent = 'SYSTEM READY';
    statusLabel.textContent = 'AWAITING INITIALIZATION';
    liveStatus.textContent = '';
  }

  function run() {
    if (state !== 'idle') return;
    generation++;
    button.disabled = true;
    setState('initializing', 'INITIALIZING', 'INITIALIZING...');
    if (reducedMotion.matches) {
      setState('complete', 'COMPLETE', 'GRATITUDE COMPLETE');
      createStage();
      schedule(400, () => { onPrepareMessage(); stage?.remove(); stage = null; });
      schedule(460, onRevealMessage);
      schedule(850, finish);
      return;
    }
    schedule(TIMELINE.CONNECTING, () => setState('connecting', 'CONNECTING', 'CONNECTING GRATITUDE NETWORK...'));
    schedule(TIMELINE.COMPLETE, () => { setState('complete', 'COMPLETE', 'GRATITUDE COMPLETE'); createStage(); });
    schedule(TIMELINE.FRAGMENTING, () => { setState('fragmenting', 'FRAGMENTING', 'ASSEMBLING DIGITAL MESSAGE...'); fragmentWord(); });
    schedule(TIMELINE.RECONSTRUCTING, () => {
      state = 'reconstructing';
      const rect = onPrepareMessage();
      reconstructCard(rect);
    });
    schedule(TIMELINE.REVEALING, () => { state = 'revealing'; handOff(); });
    schedule(TIMELINE.DONE, finish);
  }

  return { run, reset, get state() { return state; } };
}
