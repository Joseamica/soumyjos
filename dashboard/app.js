// ============================================
// Dashboard — Soumi & Jos
// Lee tracking/visits de Firebase RTDB y renderiza 5 escenas.
// ============================================

(function () {
  'use strict';

  // --- Contraseña del dashboard (cámbiala antes de compartir el link) ---
  var DASHBOARD_PASSWORD = 'soumyjos2027';

  // --- Gate ---
  function setupGate() {
    var gate = document.getElementById('gate');
    var input = document.getElementById('gate-input');
    var btn = document.getElementById('gate-btn');
    var error = document.getElementById('gate-error');
    var dash = document.getElementById('dashboard');

    try {
      if (sessionStorage.getItem('_soumyjos_dash_auth') === 'ok') {
        openDash();
        return;
      }
    } catch (e) {}

    function openDash() {
      gate.classList.add('hidden');
      dash.classList.remove('hidden');
      init();
    }

    function submit() {
      if (input.value.trim().toLowerCase() === DASHBOARD_PASSWORD) {
        try { sessionStorage.setItem('_soumyjos_dash_auth', 'ok'); } catch (e) {}
        openDash();
      } else {
        error.textContent = 'Contraseña incorrecta';
        input.value = '';
        input.focus();
      }
    }

    btn.addEventListener('click', submit);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') submit();
    });
  }

  // --- Init ---
  function init() {
    setupObserver();
    setupFirebase();
  }

  // --- Scrollytelling ligero (IntersectionObserver) ---
  function setupObserver() {
    var scenes = document.querySelectorAll('.scene');
    if (!('IntersectionObserver' in window)) {
      // Fallback: reveal everything immediately
      scenes.forEach(function (s) { s.classList.add('scene--in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) e.target.classList.add('scene--in');
      });
    }, { threshold: 0.2 });
    scenes.forEach(function (s) { io.observe(s); });
  }

  // --- Status chip ---
  function setStatus(text, state) {
    var t = document.getElementById('status-text');
    var d = document.getElementById('status-dot');
    if (t) t.textContent = text;
    if (d) {
      d.classList.remove('status-dot--live', 'status-dot--off');
      if (state) d.classList.add('status-dot--' + state);
    }
  }

  // --- Firebase listener ---
  function setupFirebase() {
    if (typeof FIREBASE_CONFIG === 'undefined' ||
        !FIREBASE_CONFIG.apiKey ||
        FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY') {
      setStatus('Firebase no configurado', 'off');
      return;
    }

    try {
      if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
      var db = firebase.database();
      setStatus('en vivo', 'live');

      db.ref('tracking/visits').on('value', function (snap) {
        var data = snap.val() || {};
        var metrics = computeMetrics(data);
        render(metrics);
      });

      // --- RSVP (requiere auth por la regla .read: "auth != null") ---
      firebase.auth().signInAnonymously().then(function () {
        db.ref('rsvp').on('value', function (snap) {
          renderRsvp(computeRsvp(snap.val() || {}));
        });
      }).catch(function (e) {
        setText('scene-6-note', 'RSVP no disponible: ' + e.message);
      });

      var csvBtn = document.getElementById('rsvp-csv-btn');
      if (csvBtn) csvBtn.addEventListener('click', function () { exportRsvpCsv(_lastRsvp); });
    } catch (e) {
      setStatus('error: ' + e.message, 'off');
    }
  }

  // --- RSVP (nodo hermano de tracking) ---
  var _lastRsvp = [];

  function computeRsvp(rsvpData) {
    var bySid = {};
    Object.keys(rsvpData || {}).forEach(function (pushId) {
      var r = rsvpData[pushId];
      if (!r || typeof r !== 'object') return;
      var sid = r.sid || pushId;
      var ts = r.updatedAt || r.createdAt || 0;
      if (!bySid[sid] || ts >= bySid[sid]._ts) { r._ts = ts; bySid[sid] = r; } // última gana
    });
    var confirmados = 0, totalPases = 0, declinan = 0;
    var asistentes = [], restricciones = [], todas = [];
    Object.keys(bySid).forEach(function (sid) {
      var r = bySid[sid];
      todas.push(r);
      if (r.asiste) {
        confirmados++;
        totalPases += (typeof r.pases === 'number' ? r.pases : 1);
        asistentes.push(r);
        if (r.restricciones) restricciones.push({ nombre: r.nombre, texto: r.restricciones });
      } else { declinan++; }
    });
    return { confirmados: confirmados, totalPases: totalPases, declinan: declinan,
             asistentes: asistentes, restricciones: restricciones, todas: todas };
  }

  function rsvpMetaItem(container, k, v) {
    var row = document.createElement('div'); row.className = 'meta-item';
    var ks = document.createElement('span'); ks.className = 'meta-k'; ks.textContent = k;
    var vs = document.createElement('span'); vs.className = 'meta-v'; vs.textContent = v;
    row.appendChild(ks); row.appendChild(vs); container.appendChild(row);
  }

  function renderRsvp(m) {
    setText('rsvp-confirmados', m.confirmados);
    setText('rsvp-pases', m.totalPases);
    setText('rsvp-declinan', m.declinan);
    var list = document.getElementById('rsvp-list');
    if (list) {
      list.textContent = '';
      m.asistentes.forEach(function (r) {
        var pases = (typeof r.pases === 'number' ? r.pases : 1);
        rsvpMetaItem(list, r.nombre || '(sin nombre)', pases + (pases === 1 ? ' pase' : ' pases'));
      });
    }
    var restr = document.getElementById('rsvp-restricciones');
    if (restr) {
      restr.textContent = '';
      m.restricciones.forEach(function (it) { rsvpMetaItem(restr, it.nombre, it.texto); });
    }
    setText('scene-6-note',
      (m.confirmados + m.declinan) + ' respuestas · ' + m.totalPases + ' asistentes esperados');
    _lastRsvp = m.todas;
  }

  function exportRsvpCsv(list) {
    var rows = [['nombre', 'asiste', 'pases', 'acompanantes', 'restricciones', 'mensaje', 'device']];
    (list || []).forEach(function (r) {
      rows.push([
        r.nombre || '', r.asiste ? 'si' : 'no',
        (typeof r.pases === 'number' ? r.pases : ''),
        (r.acompanantes || []).join(' | '),
        r.restricciones || '', r.mensaje || '', r.device || ''
      ]);
    });
    var csv = rows.map(function (row) {
      return row.map(function (cell) {
        var s = String(cell);
        if (/[",\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
        return s;
      }).join(',');
    }).join('\r\n');
    var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'rsvp-soumyjos.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  // --- Metrics ---
  function computeMetrics(visits) {
    var sessions = Object.keys(visits);
    var total = sessions.length;
    var ics = 0, google = 0;
    var ios = 0, android = 0, other = 0;
    var wa = 0;
    var timeline = {};
    var firstAt = Infinity, lastActivity = 0;

    sessions.forEach(function (sid) {
      var v = visits[sid];
      if (!v || typeof v !== 'object') return;

      if (v.calIcsClicked) ics++;
      if (v.calGoogleClicked) google++;

      if (v.device === 'iOS') ios++;
      else if (v.device === 'Android') android++;
      else other++;

      if (v.isInAppBrowser) wa++;

      if (v.startedAt) {
        if (v.startedAt < firstAt) firstAt = v.startedAt;
        var day = toLocalDay(v.startedAt);
        timeline[day] = (timeline[day] || 0) + 1;
      }
      if (v.lastActivity && v.lastActivity > lastActivity) {
        lastActivity = v.lastActivity;
      }
    });

    return {
      total: total, ics: ics, google: google,
      ios: ios, android: android, other: other, wa: wa,
      timeline: timeline,
      firstAt: firstAt === Infinity ? null : firstAt,
      lastActivity: lastActivity || null
    };
  }

  function toLocalDay(ts) {
    var d = new Date(ts);
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + dd;
  }

  function fmtTimeAgo(ts) {
    if (!ts) return 'sin actividad';
    var diff = (Date.now() - ts) / 1000;
    if (diff < 60) return 'hace segundos';
    if (diff < 3600) return 'hace ' + Math.round(diff / 60) + ' min';
    if (diff < 86400) return 'hace ' + Math.round(diff / 3600) + ' h';
    return 'hace ' + Math.round(diff / 86400) + ' días';
  }

  function fmtDate(ts) {
    if (!ts) return '—';
    return new Date(ts).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });
  }

  // --- Render ---
  function render(m) {
    // Scene 1
    setText('total-visits', m.total);
    setText('scene-1-note',
      m.firstAt ? 'Desde ' + fmtDate(m.firstAt) : 'Esperando primera visita');

    // Scene 2
    setText('ics-count', m.ics);
    setText('google-count', m.google);
    var saved = m.ics + m.google;
    var pct = m.total > 0 ? Math.round((saved / m.total) * 100) : 0;
    setText('scene-2-note',
      m.total > 0
        ? saved + ' de ' + m.total + ' (' + pct + '%) guardaron la fecha'
        : '—');

    // Scene 3
    renderTimeline(m.timeline, m.firstAt);

    // Scene 4
    renderDevices(m.ios, m.android, m.other, m.total);
    setText('wa-count', m.wa);

    // Scene 5
    setText('last-activity', fmtTimeAgo(m.lastActivity));
    renderMeta(m);
  }

  function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function renderTimeline(timeline, firstAt) {
    var chart = document.getElementById('timeline-chart');
    if (!chart) return;

    if (!firstAt) {
      chart.innerHTML = '<p class="empty-note">Sin visitas todavía</p>';
      setText('scene-3-note', '—');
      return;
    }

    var first = new Date(firstAt); first.setHours(0,0,0,0);
    var today = new Date(); today.setHours(0,0,0,0);

    var days = [];
    var cursor = new Date(first);
    while (cursor <= today) {
      var key = toLocalDay(cursor.getTime());
      days.push({ day: key, count: timeline[key] || 0, date: new Date(cursor) });
      cursor.setDate(cursor.getDate() + 1);
    }
    if (days.length > 60) days = days.slice(-60);

    var max = 1;
    for (var i = 0; i < days.length; i++) {
      if (days[i].count > max) max = days[i].count;
    }

    var html = '<div class="bars-row">';
    days.forEach(function (d) {
      var h = (d.count / max) * 100;
      var title = fmtDate(d.date.getTime()) + ' · ' + d.count + (d.count === 1 ? ' visita' : ' visitas');
      html += '<div class="bar-col" title="' + title + '">' +
              '<div class="bar" style="height:' + h + '%"></div>' +
              '</div>';
    });
    html += '</div>';
    chart.innerHTML = html;

    setText('scene-3-note',
      'Del ' + fmtDate(days[0].date.getTime()) + ' a hoy · ' + days.length + (days.length === 1 ? ' día' : ' días'));
  }

  function renderDevices(ios, android, other, total) {
    var bars = document.getElementById('device-bars');
    if (!bars) return;

    if (total === 0) {
      bars.innerHTML = '<p class="empty-note">Sin datos de dispositivo</p>';
      return;
    }

    var rows = [
      { label: 'iOS',     count: ios },
      { label: 'Android', count: android },
      { label: 'Otro',    count: other }
    ];

    var html = '';
    rows.forEach(function (r) {
      var pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
      html += '<div class="bar-row">' +
              '  <span class="bar-label">' + r.label + '</span>' +
              '  <div class="bar-track"><div class="bar-fill" style="width:' + pct + '%"></div></div>' +
              '  <span class="bar-count">' + r.count + ' <span class="bar-pct">(' + pct + '%)</span></span>' +
              '</div>';
    });
    bars.innerHTML = html;
  }

  function renderMeta(m) {
    var el = document.getElementById('meta-list');
    if (!el) return;
    var pct = m.total > 0 ? Math.round(((m.ics + m.google) / m.total) * 100) + '%' : '—';
    var items = [
      ['Primera visita',     m.firstAt ? fmtDate(m.firstAt) : '—'],
      ['Última actividad',   fmtTimeAgo(m.lastActivity)],
      ['Tasa de conversión', pct],
      ['Actualizado',        new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })]
    ];
    el.innerHTML = items.map(function (it) {
      return '<div class="meta-item">' +
             '  <span class="meta-k">' + it[0] + '</span>' +
             '  <span class="meta-v">' + it[1] + '</span>' +
             '</div>';
    }).join('');
  }

  // --- Go ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupGate);
  } else {
    setupGate();
  }
})();
