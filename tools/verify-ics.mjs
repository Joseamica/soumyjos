// tools/verify-ics.mjs — genera y verifica Soumi-Jos-Invitacion.ics
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ICS_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', 'Soumi-Jos-Invitacion.ics');

function esc(s) {
  return String(s)
    .replace(/\\/g, '\\\\').replace(/;/g, '\\;')
    .replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function buildIcs(evt) {
  const alarms = (evt.alarms || []).map(trig => [
    'BEGIN:VALARM', 'ACTION:DISPLAY',
    'DESCRIPTION:' + esc(evt.summary), 'TRIGGER:' + trig, 'END:VALARM'
  ].join('\r\n'));
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Soumi&Jos//Invitacion//ES',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Boda Soumi & Jos',
    'X-WR-TIMEZONE:' + evt.tz,
    // VTIMEZONE explícito: México abolió el horario de verano en 2022 → -0600 permanente.
    'BEGIN:VTIMEZONE',
    'TZID:' + evt.tz,
    'BEGIN:STANDARD',
    'DTSTART:20221030T020000',
    'TZOFFSETFROM:-0500',
    'TZOFFSETTO:-0600',
    'TZNAME:CST',
    'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    'UID:' + evt.uid, 'DTSTAMP:' + evt.dtstamp,
    'DTSTART;TZID=' + evt.tz + ':' + evt.dtstart,
    'DTEND;TZID=' + evt.tz + ':' + evt.dtend,
    'SUMMARY:' + esc(evt.summary),
    'DESCRIPTION:' + esc(evt.description),
    'LOCATION:' + esc(evt.location),
    'STATUS:CONFIRMED', 'TRANSP:OPAQUE',
    ...alarms,
    'END:VEVENT', 'END:VCALENDAR'
  ];
  return lines.join('\r\n') + '\r\n';
}

// Mantener en sincronía con la agenda y las sedes de invitacion.html.
export const EVT = {
  uid: 'soumi-jos-boda-20270320@invitacion',
  dtstamp: '20260719T000000Z',
  dtstart: '20270320T170000',
  dtend:   '20270320T230000',
  tz: 'America/Mexico_City',
  summary: 'Boda de Soumi & Jos',
  location: 'Parroquia de Nuestra Señora de Lourdes, Castillo de Chapultepec 70, Lomas de Reforma, Miguel Hidalgo, Ciudad de México',
  description: 'Ceremonia a las 17:00 h en la Parroquia de Nuestra Señora de Lourdes. Recepción a las 19:00 h en Cuadra San Cristóbal.',
  alarms: ['-P1D', '-PT3H']
};

if (process.argv.includes('--write')) {
  writeFileSync(ICS_PATH, buildIcs(EVT), 'utf8');
  console.log('verify-ics: archivo regenerado');
}

const ics = readFileSync(ICS_PATH, 'utf8');
assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 1, 'exactamente un VEVENT');
assert.match(ics, /BEGIN:VTIMEZONE[\s\S]*TZID:America\/Mexico_City[\s\S]*END:VTIMEZONE/, 'VTIMEZONE presente');
assert.match(ics, /DTSTART;TZID=America\/Mexico_City:20270320T\d{6}/, 'DTSTART con hora (no VALUE=DATE)');
assert.doesNotMatch(ics, /VALUE=DATE/, 'sin all-day');
assert.equal((ics.match(/BEGIN:VALARM/g) || []).length, 2, 'dos VALARM');
assert.match(ics, /TRIGGER:-P1D/, 'alarma -P1D');
assert.match(ics, /TRIGGER:-PT3H/, 'alarma -PT3H');
assert.match(ics, /LOCATION:.+\S/, 'LOCATION no vacío');
console.log('verify-ics: OK');
