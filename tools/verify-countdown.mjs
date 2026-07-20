// tools/verify-countdown.mjs — asserts de la cuenta regresiva.
// MANTENER EN SYNC con las funciones homónimas de invitacion.html.
import assert from 'node:assert/strict';

function daysUntilWedding(fromDate) {
  const weddingDate = new Date(2027, 2, 20);
  weddingDate.setHours(0, 0, 0, 0);
  const today = new Date(fromDate.getTime());
  today.setHours(0, 0, 0, 0);
  return Math.ceil((weddingDate.getTime() - today.getTime()) / 86400000);
}

function countdownParts(days) {
  if (days > 1)   return { lead: 'Faltan', number: String(days), label: 'días' };
  if (days === 1) return { lead: 'Falta',  number: '1',          label: 'día' };
  if (days === 0) return { lead: '',       number: '',           label: 'Hoy es el día' };
  return              { lead: '',       number: '',           label: 'Gracias por acompañarnos' };
}

function countdownPhrase(days) {
  const p = countdownParts(days);
  return [p.lead, p.number, p.label].filter(Boolean).join(' ');
}

assert.equal(countdownPhrase(daysUntilWedding(new Date(2027, 2, 19))), 'Falta 1 día');
assert.equal(countdownPhrase(daysUntilWedding(new Date(2027, 2, 20))), 'Hoy es el día');
assert.equal(countdownPhrase(daysUntilWedding(new Date(2027, 2, 21))), 'Gracias por acompañarnos');
const n = daysUntilWedding(new Date(2026, 10, 12));
assert.ok(n > 1, 'debe faltar más de un día');
assert.equal(countdownPhrase(n), 'Faltan ' + n + ' días');

console.log('OK verify-countdown:', n, 'días al 20-mar-2027');
