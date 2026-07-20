// tools/verify-rsvp.mjs — asserts de validación/payload del RSVP.
// MANTENER EN SYNC con las funciones homónimas de invitacion.html.
import assert from 'node:assert/strict';

const MAX_PASES = 2;

function makeForm(v) {
  const map = {
    '#rsvpNombre': { value: v.nombre || '' },
    '#rsvpPases': { value: v.pases == null ? '' : String(v.pases) },
    '#rsvpAcompanantes': { value: v.acompanantes || '' },
    '#rsvpRestricciones': { value: v.restricciones || '' },
    '#rsvpMensaje': { value: v.mensaje || '' },
    '#rsvpWebsite': { value: v.website || '' }
  };
  return {
    querySelector(sel) {
      if (sel === 'input[name="asiste"]:checked') {
        if (v.asiste === true) return { value: 'si' };
        if (v.asiste === false) return { value: 'no' };
        return null;
      }
      return map[sel] || { value: '' };
    }
  };
}

function validateRsvp(form) {
  const errors = [];
  const nombre = (form.querySelector('#rsvpNombre').value || '').trim();
  if (nombre.length < 2) errors.push('Indíquenos su nombre completo.');
  const asisteEl = form.querySelector('input[name="asiste"]:checked');
  if (!asisteEl) { errors.push('Indíquenos si podrá acompañarnos.'); return { ok: false, errors }; }
  if (asisteEl.value === 'si') {
    const sel = form.querySelector('#rsvpPases');
    const pases = sel ? parseInt(sel.value, 10) : NaN;
    if (!(pases >= 1 && pases <= MAX_PASES)) {
      errors.push('Seleccione un número de personas válido.');
    } else if (pases > 1) {
      const names = (form.querySelector('#rsvpAcompanantes').value || '')
        .split('\n').map(s => s.trim()).filter(s => s.length > 0);
      if (names.length > pases - 1) errors.push('Ha indicado más acompañantes que lugares.');
    }
  }
  return { ok: errors.length === 0, errors };
}

assert.equal(validateRsvp(makeForm({ nombre: '', asiste: true, pases: 1 })).ok, false);
assert.equal(validateRsvp(makeForm({ nombre: 'Ana' })).ok, false);
assert.equal(validateRsvp(makeForm({ nombre: 'Ana', asiste: true, pases: 3 })).ok, false);
assert.equal(validateRsvp(makeForm({ nombre: 'Ana', asiste: true, pases: 2, acompanantes: 'X\nY' })).ok, false);
assert.equal(validateRsvp(makeForm({ nombre: 'Ana', asiste: true, pases: 2, acompanantes: 'X' })).ok, true);
assert.equal(validateRsvp(makeForm({ nombre: 'Ana', asiste: false })).ok, true);
console.log('verify-rsvp: OK');

// --- buildRsvpPayload ---
globalThis.firebase = { database: { ServerValue: { TIMESTAMP: { '.sv': 'timestamp' } } } };
// Node 24 expone un `navigator` de solo lectura; shadow local para el shim de prueba.
const navigator = { userAgent: 'Mozilla/5.0 (iPhone)' };

function buildRsvpPayload(form, sid) {
  const asisteEl = form.querySelector('input[name="asiste"]:checked');
  const asiste = asisteEl ? asisteEl.value === 'si' : false;
  let pases = 0;
  if (asiste) { const sel = form.querySelector('#rsvpPases'); pases = sel ? (parseInt(sel.value, 10) || 1) : 1; }
  let acompanantes = [];
  if (asiste && pases > 1) {
    acompanantes = (form.querySelector('#rsvpAcompanantes').value || '')
      .split('\n').map(s => s.trim()).filter(s => s.length > 0).slice(0, pases - 1);
  }
  const restr = (form.querySelector('#rsvpRestricciones').value || '').trim().slice(0, 280);
  const msg = (form.querySelector('#rsvpMensaje').value || '').trim().slice(0, 500);
  const hp = (form.querySelector('#rsvpWebsite').value || '').trim();
  const ua = navigator.userAgent || '';
  const device = /iPad|iPhone|iPod/.test(ua) ? 'iOS' : /Android/i.test(ua) ? 'Android' : 'Other';
  const payload = {
    nombre: (form.querySelector('#rsvpNombre').value || '').trim().slice(0, 80),
    asiste, pases, acompanantes, sid: sid || '',
    createdAt: firebase.database.ServerValue.TIMESTAMP, updatedAt: Date.now(),
    userAgent: ua.slice(0, 512), device, _hp: hp ? true : false
  };
  if (restr) payload.restricciones = restr;
  if (msg) payload.mensaje = msg;
  return payload;
}

const p = buildRsvpPayload(makeForm({ nombre: '  Ana Ruiz ', asiste: true, pases: 2, acompanantes: 'Luis\n\nMar' }), 'sid123');
assert.equal(p.nombre, 'Ana Ruiz');
assert.equal(p.asiste, true);
assert.equal(p.pases, 2);
assert.deepEqual(p.acompanantes, ['Luis']);
assert.equal(p.sid, 'sid123');
assert.equal(p.device, 'iOS');
assert.equal(p._hp, false);
const d = buildRsvpPayload(makeForm({ nombre: 'Bob', asiste: false }), 'sid9');
assert.equal(d.pases, 0);
assert.equal(d.acompanantes.length, 0);
console.log('verify-rsvp payload: OK');
