import { recipients } from './data.js';

// Chuẩn hóa để việc tìm kiếm giữ nguyên dữ liệu gốc nhưng chấp nhận nhiều cách nhập.
export function normalizeName(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd').toLowerCase().replace(/\s+/g, ' ').trim();
}

function distance(a, b, limit = 2) {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  let row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) {
      next[j] = Math.min(next[j - 1] + 1, row[j] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    row = next;
  }
  return row[b.length];
}

export function searchRecipients(input) {
  const query = normalizeName(input);
  if (!query) return [];
  const terms = query.split(' ');
  return recipients.map(person => {
    const name = normalizeName(person.name);
    const words = name.split(' ');
    let score = -1;
    if (name === query) score = 1000;
    else if (name.startsWith(query)) score = 700 - name.length;
    else if (name.includes(query)) score = 600 - name.indexOf(query);
    else {
      let total = 0;
      let allMatch = true;
      let fuzzy = false;
      for (const term of terms) {
        if (words.some(word => word.startsWith(term))) { total += 80; continue; }
        // Sai chính tả nhẹ được gợi ý, nhưng không mở rộng từ quá ngắn.
        const max = term.length >= 6 ? 2 : term.length >= 4 ? 1 : 0;
        const closest = Math.min(...words.map(word => distance(term, word, max)));
        if (closest <= max) { total += 35 - closest * 10; fuzzy = true; }
        else { allMatch = false; break; }
      }
      if (allMatch) score = (fuzzy ? 100 : 400) + total;
    }
    return { person, score };
  }).filter(result => result.score >= 0)
    .filter((result, _, all) => result.score >= 400 || !all.some(other => other.score >= 400))
    .sort((a, b) => b.score - a.score || a.person.name.localeCompare(b.person.name, 'vi'))
    .map(result => result.person);
}

export function createSearch({ input, list, feedback, onSelect }) {
  let results = [];
  let activeIndex = -1;
  let visible = false;

  function fitListToViewport() {
    if (!visible || !window.visualViewport) return;
    const viewportBottom = window.visualViewport.offsetTop + window.visualViewport.height;
    const available = viewportBottom - input.getBoundingClientRect().bottom - 14;
    list.style.maxHeight = `${Math.max(75, Math.min(260, available))}px`;
  }

  function close() {
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    activeIndex = -1;
    visible = false;
  }

  function markActive(index) {
    activeIndex = index;
    [...list.children].forEach((element, itemIndex) => {
      element.setAttribute('aria-selected', String(itemIndex === index));
    });
    if (index >= 0) {
      const option = list.children[index];
      input.setAttribute('aria-activedescendant', option.id);
      option.scrollIntoView({ block: 'nearest' });
    } else input.removeAttribute('aria-activedescendant');
  }

  function render() {
    results = searchRecipients(input.value);
    list.replaceChildren();
    activeIndex = -1;
    const hasQuery = normalizeName(input.value).length > 0;
    if (!hasQuery) { feedback.textContent = ''; close(); return; }
    if (!results.length) {
      feedback.textContent = 'BITC chưa tìm thấy tên phù hợp. Thầy/Cô vui lòng kiểm tra lại nhé!';
      close();
      return;
    }
    feedback.textContent = '';
    for (const [index, person] of results.slice(0, 8).entries()) {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'search-option';
      option.id = `recipient-option-${index}`;
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', 'false');
      const name = document.createElement('strong');
      name.textContent = person.name;
      const honorific = document.createElement('small');
      honorific.textContent = person.honorific;
      option.append(name, honorific);
      option.addEventListener('mousedown', event => event.preventDefault());
      option.addEventListener('click', () => { close(); onSelect(person); });
      list.append(option);
    }
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    visible = true;
    fitListToViewport();
  }

  input.addEventListener('input', render);
  input.addEventListener('focus', () => window.setTimeout(() => {
    if (document.activeElement === input && window.innerWidth <= 600) {
      input.scrollIntoView({ block: 'center' });
      fitListToViewport();
    }
  }, 180));
  window.visualViewport?.addEventListener('resize', () => {
    if (document.activeElement === input && window.innerWidth <= 600) {
      input.scrollIntoView({ block: 'center' });
      window.requestAnimationFrame(fitListToViewport);
    }
  });
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') { close(); return; }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!visible) { render(); if (!visible) return; }
      const length = Math.min(results.length, 8);
      markActive(event.key === 'ArrowDown' ? (activeIndex + 1) % length : (activeIndex - 1 + length) % length);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (visible && activeIndex >= 0) { const person = results[activeIndex]; close(); onSelect(person); return; }
      const exact = results.filter(person => normalizeName(person.name) === normalizeName(input.value));
      if (exact.length === 1) { close(); onSelect(exact[0]); }
      else if (results.length) feedback.textContent = 'Thầy/Cô vui lòng chọn đúng tên trong danh sách gợi ý.';
    }
  });
  input.addEventListener('blur', () => window.setTimeout(close, 140));
  return { reset() { input.value = ''; feedback.textContent = ''; results = []; list.replaceChildren(); close(); } };
}
