import assert from 'node:assert/strict';
import { createRunAnimation } from '../js/animations.js';

// A small virtual clock checks the real timeline and cleanup without claiming visual browser QA.
let now = 0;
let nextTimer = 1;
const timers = new Map();
let reduced = false;

function tick(milliseconds) {
  const target = now + milliseconds;
  while (true) {
    const pending = [...timers].filter(([, timer]) => timer.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
    if (!pending) break;
    now = pending[1].at;
    timers.delete(pending[0]);
    pending[1].callback();
  }
  now = target;
}

class FakeElement {
  constructor(className = '') {
    this.className = className;
    this.style = {};
    this.children = [];
    this.textContent = '';
    this.disabled = false;
  }
  get classList() {
    return {
      add: (...names) => { this.className = [...new Set([...this.className.split(' ').filter(Boolean), ...names])].join(' '); },
      remove: (...names) => { this.className = this.className.split(' ').filter(name => !names.includes(name)).join(' '); }
    };
  }
  append(...children) { children.forEach(child => { child.parent = this; this.children.push(child); }); }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); }
  setAttribute() {}
  querySelector() { return new FakeElement('network-core'); }
  getBoundingClientRect() {
    if (this.className === 'complete-label') return { left: 300, top: 350, width: 260, height: 80, right: 560, bottom: 430 };
    return { left: 450, top: 370, width: 50, height: 50, right: 500, bottom: 420 };
  }
  animate() { return { cancel() {} }; }
}

class FakeCanvas {
  width = 0;
  height = 0;
  getContext() {
    return {
      fillText() {},
      getImageData: () => {
        const data = new Uint8ClampedArray(this.width * this.height * 4);
        for (let index = 3; index < data.length; index += 4) data[index] = 255;
        return { data };
      }
    };
  }
}

globalThis.window = {
  innerWidth: 1280, innerHeight: 800,
  matchMedia: () => ({ matches: reduced }),
  setTimeout: (callback, delay) => { const id = nextTimer++; timers.set(id, { at: now + delay, callback }); return id; },
  clearTimeout: id => timers.delete(id)
};
globalThis.document = {
  body: new FakeElement('body'),
  createElement: tag => tag === 'canvas' ? new FakeCanvas() : new FakeElement()
};
globalThis.getComputedStyle = () => ({ fontWeight: '700', fontSize: '80px', fontFamily: 'sans-serif', letterSpacing: '0px' });

function fixture() {
  const panel = new FakeElement('engine-panel');
  const button = new FakeElement('run-button');
  const messageScreen = new FakeElement('screen-message');
  const phaseLabel = new FakeElement();
  const statusLabel = new FakeElement();
  const liveStatus = new FakeElement();
  const calls = { prepare: 0, reveal: 0, complete: 0 };
  const animation = createRunAnimation({
    panel, networkArt: new FakeElement('network-art'), phaseLabel, statusLabel, liveStatus,
    button, messageScreen,
    onPrepareMessage: () => {
      calls.prepare++;
      return { left: 220, top: 120, right: 920, bottom: 670, width: 700, height: 550 };
    },
    onRevealMessage: () => { calls.reveal++; },
    onComplete: () => { calls.complete++; }
  });
  return { animation, panel, button, phaseLabel, calls };
}

const normal = fixture();
normal.animation.run();
normal.animation.run();
assert.equal(normal.animation.state, 'initializing');
assert.equal(normal.button.disabled, true);
assert.equal(timers.size, 6, 'RUN lặp lại không tạo thêm timer');
tick(500);
assert.equal(normal.animation.state, 'connecting');
tick(1500);
assert.equal(normal.animation.state, 'complete');
assert.equal(document.body.children.length, 1, 'COMPLETE có overlay');
tick(800);
assert.equal(normal.animation.state, 'fragmenting');
assert.ok(document.body.children[0].children.length > 20, 'Có các mảnh dữ liệu từ vùng chữ');
tick(800);
assert.equal(normal.animation.state, 'reconstructing');
assert.equal(normal.calls.prepare, 1);
tick(800);
assert.equal(normal.calls.reveal, 1);
tick(800);
assert.equal(normal.animation.state, 'done');
assert.equal(normal.calls.complete, 1);
assert.equal(document.body.children.length, 0, 'Overlay được dọn sau khi hoàn thành');

normal.animation.reset();
normal.animation.run();
tick(2000);
normal.animation.reset();
tick(5000);
assert.equal(normal.calls.prepare, 1, 'Reset hủy callback cũ');
assert.equal(normal.button.disabled, false);
assert.equal(document.body.children.length, 0);

reduced = true;
const accessible = fixture();
accessible.animation.run();
tick(400);
assert.equal(accessible.calls.prepare, 1);
assert.equal(document.body.children.length, 0, 'Reduced motion không tạo fragments');
tick(60);
assert.equal(accessible.calls.reveal, 1);
tick(390);
assert.equal(accessible.calls.complete, 1);
assert.equal(accessible.animation.state, 'done');
console.log('PASS: timeline 5.2s, khóa RUN, phân mảnh, dựng thiệp, reveal, reset và reduced motion.');
