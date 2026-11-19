export function showMessage(person, elements) {
  const english = person.language === 'en';
  elements.title.textContent = english
    ? `Dear ${person.honorific} ${person.name},`
    : `Kính gửi ${person.honorific} ${person.name},`;
  elements.greeting.textContent = person.greeting;
  elements.day.textContent = "HAPPY VIETNAMESE TEACHERS' DAY 20/11";
  elements.quote.textContent = english
    ? 'Connected by technology, grateful from the heart.'
    : 'Kết nối bằng công nghệ, tri ân từ trái tim.';
  elements.panel.lang = english ? 'en' : 'vi';
}

export function clearMessage(elements) {
  elements.title.textContent = '';
  elements.greeting.textContent = '';
  elements.panel.lang = 'vi';
}
