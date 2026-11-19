import { createSearch } from './search.js';
import { buildNetwork } from './network.js';
import { createRunAnimation } from './animations.js';
import { showMessage, clearMessage } from './message.js';

const SCREENS = { WELCOME: 'welcome', RUN: 'run', MESSAGE: 'message' };
const screens = Object.fromEntries(Object.values(SCREENS).map(name => [name, document.getElementById(`screen-${name}`)]));
const input = document.getElementById('recipient-search');
const runRecipient = document.getElementById('run-recipient');
const runIntro = document.getElementById('run-intro');
const runInstruction = document.getElementById('run-instruction');
const runButton = document.getElementById('run-button');
const homeButton = document.getElementById('home-button');
const messageElements = {
  panel: document.getElementById('screen-message'),
  title: document.getElementById('message-title'),
  greeting: document.getElementById('message-greeting'),
  day: document.getElementById('message-day'),
  quote: document.getElementById('message-quote')
};
const messagePanel = document.querySelector('.message-panel');
let selectedPerson = null;
let currentScreen = SCREENS.WELCOME;

function switchScreen(name) {
  currentScreen = name;
  Object.entries(screens).forEach(([key, screen]) => { screen.hidden = key !== name; });
  window.scrollTo({ top: 0, behavior: 'auto' });
}

const search = createSearch({
  input,
  list: document.getElementById('search-results'),
  feedback: document.getElementById('search-feedback'),
  onSelect(person) {
    selectedPerson = person;
    runRecipient.textContent = `${person.honorific} ${person.name}`;
    runIntro.textContent = person.language === 'en' ? 'A personal message for' : 'Thông điệp dành riêng cho';
    runInstruction.textContent = person.language === 'en'
      ? 'Press RUN to reveal your personal message.'
      : 'Nhấn RUN để kích hoạt thông điệp của Thầy/Cô.';
    switchScreen(SCREENS.RUN);
    runButton.focus({ preventScroll: true });
  }
});

buildNetwork(document.getElementById('network-art'));
const animation = createRunAnimation({
  panel: document.getElementById('engine-panel'),
  networkArt: document.getElementById('network-art'),
  phaseLabel: document.getElementById('engine-phase'),
  statusLabel: document.getElementById('engine-status-text'),
  liveStatus: document.getElementById('run-live-status'),
  button: runButton,
  messageScreen: messageElements.panel,
  onPrepareMessage() {
    if (!selectedPerson || currentScreen !== SCREENS.RUN) return;
    showMessage(selectedPerson, messageElements);
    messageElements.panel.classList.add('is-preparing');
    switchScreen(SCREENS.MESSAGE);
    return messagePanel.getBoundingClientRect();
  },
  onRevealMessage() {
    if (currentScreen !== SCREENS.MESSAGE) return;
    messageElements.panel.classList.remove('is-preparing');
    messageElements.panel.classList.add('is-visible');
  },
  onComplete() {
    homeButton.disabled = false;
    if (currentScreen !== SCREENS.MESSAGE) return;
    messageElements.title.focus({ preventScroll: true });
  }
});

runButton.addEventListener('click', () => {
  if (selectedPerson && currentScreen === SCREENS.RUN) {
    homeButton.disabled = true;
    animation.run();
  }
});

homeButton.addEventListener('click', () => {
  // Hủy callback trước khi xóa người nhận để lời chúc cũ không thể hiện lại.
  animation.reset();
  homeButton.disabled = false;
  selectedPerson = null;
  runRecipient.textContent = '';
  runIntro.textContent = 'Thông điệp dành riêng cho';
  search.reset();
  clearMessage(messageElements);
  messageElements.panel.classList.remove('is-visible');
  switchScreen(SCREENS.WELCOME);
  input.focus({ preventScroll: true });
});
