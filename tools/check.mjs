import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { recipients } from '../js/data.js';
import { normalizeName, searchRecipients } from '../js/search.js';
import { TIMELINE } from '../js/animations.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
assert.equal(recipients.length, 24, 'Phải có 24 người nhận');
assert.equal(recipients.filter(person => person.language === 'vi').length, 22);
assert.equal(recipients.filter(person => person.language === 'en').length, 2);
assert.equal(new Set(recipients.map(person => person.id)).size, 24, 'ID phải duy nhất');
assert.equal(new Set(recipients.map(person => normalizeName(person.name))).size, 24, 'Tên phải duy nhất');
for (const person of recipients) {
  assert.ok(person.id && person.name && person.honorific && person.greeting.trim());
  assert.ok(['vi', 'en'].includes(person.language));
}
assert.deepEqual(recipients.filter(person => person.language === 'en').map(person => person.name), [
  'Ian Michael Biggar', 'Joseph Wallace Wisham III'
]);

for (const [query, expected] of [
  ['Nguyễn Thành Long', 'Nguyễn Thành Long'],
  ['Nguyen Thanh Long', 'Nguyễn Thành Long'],
  ['  NGUYEN   THANH LONG ', 'Nguyễn Thành Long'],
  ['Vinh Phuc', 'Đào Vĩnh Phúc'],
  ['Ian', 'Ian Michael Biggar'],
  ['Trung Anh', 'Đỗ Trung Anh'],
  ['Ngyuen Thanh Long', 'Nguyễn Thành Long']
]) assert.equal(searchRecipients(query)[0]?.name, expected, `Tìm kiếm: ${query}`);
assert.equal(searchRecipients('unknown recipient').length, 0);
assert.ok(searchRecipients('Long').length > 1, 'Tên mơ hồ phải có nhiều lựa chọn');

const html = await readFile(resolve(root, 'index.html'), 'utf8');
assert.equal((html.match(/class="screen /g) || []).length, 3, 'Phải có đúng 3 màn hình');
for (const path of [
  'css/style.css', 'css/animations.css', 'css/responsive.css', 'css/logo.css', 'css/compilation.css',
  'js/main.js', 'assets/images/bitc-logo.png', 'assets/images/btec-fpt-transparent.png'
]) {
  assert.ok((await stat(resolve(root, path))).isFile(), `Thiếu ${path}`);
  assert.ok(html.includes(path), `HTML chưa liên kết ${path}`);
}
assert.ok((await stat(resolve(root, 'assets/images/btec-fpt-logo.png'))).isFile(), 'Phải giữ logo BTEC gốc');
assert.deepEqual(
  await readFile(resolve(root, 'assets/images/btec-fpt-logo.png')),
  await readFile(resolve(root, 'assets/images/btec-fpt-transparent.png')),
  'Logo trong suốt đã có sẵn ở file gốc, bản mới phải giữ nguyên pixel'
);
assert.deepEqual(Object.values(TIMELINE), [0, 500, 2000, 2800, 3600, 4400, 5200]);
console.log('PASS: 24 bản ghi, ngôn ngữ, tính duy nhất, tìm kiếm và tài nguyên tĩnh.');
