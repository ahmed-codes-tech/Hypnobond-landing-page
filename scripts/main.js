(() => {
  'use strict';

  // FIX: the original file captured no data anywhere — pill/card/reminder
  // choices only lived in local variables used to update on-screen text.
  // This mirrors the data model in Section 6 of the implementation guide;
  // nothing here changes what's shown on screen.
  const session = {
    session_id: crypto.randomUUID(),
    location_code: new URLSearchParams(window.location.search).get('loc') || null,
    before_activity: null,
    before_attention: null,
    audio_chosen: null,
    audio_duration: null,
    audio_started_at: null,
    audio_completed: false,
    reminder_time: null,
    reminder_channel: null,
    reminder_contact: null,
  };

  function go(n) {
    for (let i = 0; i < 4; i++) {
      document.getElementById('s' + i).classList.remove('active');
    }
    document.getElementById('s' + n).classList.add('active');
    // Testing/preview aid only — see the navbar markup comment in
    // index.html for why this exists and why it must not ship as-is.
    document.querySelectorAll('.navbtn[data-go]').forEach((b) => {
      b.classList.toggle('active', Number(b.dataset.go) === n);
    });
  }

  // Preview nav — wired here rather than inline onclick="" because the
  // page's own CSP (script-src 'self') blocks inline event handlers;
  // confirmed by testing (Chromium logs the CSP violation and the button
  // silently does nothing with an inline handler).
  document.querySelectorAll('.navbtn[data-go]').forEach((btn) => {
    btn.addEventListener('click', () => go(Number(btn.dataset.go)));
  });

  // ---------------------------------------------------------------------
  // SCREEN 0 — Before
  // ---------------------------------------------------------------------

  document.querySelectorAll('.pill-row').forEach((row, idx) => {
    const field = idx === 0 ? 'before_activity' : 'before_attention';
    row.querySelectorAll('.pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        row.querySelectorAll('.pill').forEach((p) => {
          p.classList.remove('sel');
          p.setAttribute('aria-pressed', 'false');
        });
        pill.classList.add('sel');
        pill.setAttribute('aria-pressed', 'true');
        session[field] = pill.textContent.trim();
      });
    });
  });

  document.getElementById('continueBtn').addEventListener('click', () => go(1));
  document.getElementById('skipBtn').addEventListener('click', () => go(1));

  // ---------------------------------------------------------------------
  // SCREEN 1 — Audio selection
  // ---------------------------------------------------------------------

  let chosen = null;
  const beginBtn = document.getElementById('beginbtn');
  const cards = document.querySelectorAll('#audioCards .acard');

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      cards.forEach((c) => {
        c.classList.remove('chosen');
        c.setAttribute('aria-pressed', 'false');
      });
      card.classList.add('chosen');
      card.setAttribute('aria-pressed', 'true');
      chosen = {
        name: card.dataset.name,
        dur: card.dataset.dur,
        seconds: Number(card.dataset.seconds),
        src: card.dataset.src,
      };
      beginBtn.disabled = false;
      document.getElementById('npname').textContent = chosen.name;
      document.getElementById('tdur').textContent = chosen.dur;
    });
  });

  beginBtn.addEventListener('click', () => {
    if (!chosen) return;
    session.audio_chosen = chosen.name;
    session.audio_duration = chosen.seconds;
    session.audio_started_at = null;
    session.audio_completed = false;
    audioEl.pause();
    audioEl.src = chosen.src;
    resetPlayerUI();
    go(2);
  });

  // ---------------------------------------------------------------------
  // SCREEN 2 — Player (real HTML Audio API)
  // ---------------------------------------------------------------------

  const audioEl = document.getElementById('audioEl');
  const bigplay = document.getElementById('bigplay');
  const pfill = document.getElementById('pfill');
  const tnow = document.getElementById('tnow');
  const progarea = document.getElementById('progarea');
  const pausemsg = document.getElementById('pausemsg');

  function fmt(s) {
    const total = Math.max(0, Math.floor(s || 0));
    const m = Math.floor(total / 60);
    const r = total % 60;
    return m + ':' + (r < 10 ? '0' : '') + r;
  }

  // Shared UI updates for both the real Audio element and the simulated
  // fallback below, so the two paths can't visually drift apart.
  function setPlayingUI(isPlaying) {
    bigplay.classList.toggle('playing', isPlaying);
    bigplay.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
    progarea.classList.toggle('playing', isPlaying);
    if (isPlaying) pausemsg.textContent = '';
  }

  function setElapsedUI(elapsedSeconds, durationSeconds) {
    if (!durationSeconds) return;
    const pct = Math.min(100, (elapsedSeconds / durationSeconds) * 100);
    pfill.style.width = pct + '%';
    tnow.textContent = fmt(elapsedSeconds);
  }

  function onPlaybackEnded() {
    session.audio_completed = true;
    window.setTimeout(() => go(3), 700);
  }

  function updateProgress() {
    const duration = (audioEl.duration && isFinite(audioEl.duration)) ? audioEl.duration : (chosen ? chosen.seconds : 0);
    setElapsedUI(audioEl.currentTime, duration);
  }

  let progressTimerId = null;

  audioEl.addEventListener('play', () => {
    setPlayingUI(true);
    if (!session.audio_started_at) session.audio_started_at = new Date().toISOString();
    progressTimerId = window.setInterval(updateProgress, 200);
  });

  audioEl.addEventListener('pause', () => {
    setPlayingUI(false);
    if (audioEl.currentTime > 0) pausemsg.textContent = 'Paused — take your time.';
    if (progressTimerId) {
      window.clearInterval(progressTimerId);
      progressTimerId = null;
    }
  });

  audioEl.addEventListener('ended', onPlaybackEnded);

  // FIX ("audio bar is not working"): no MP3 files exist yet (see the
  // data-src placeholders on each card), so audioEl.play() always rejects
  // and nothing the tester clicks ever visibly happens. Once real files
  // are supplied this fallback simply never triggers — the real Audio
  // element above already does the right thing on its own. Until then, a
  // simulated clock drives the exact same UI so the interaction can
  // actually be reviewed end-to-end.
  let simMode = false;
  let simPlaying = false;
  let simElapsed = 0;
  let simTimerId = null;

  // Called every time Begin is pressed, including re-selecting a different
  // card and coming back — without this, a second run would inherit the
  // previous run's elapsed time/simMode/playing visuals.
  function resetPlayerUI() {
    if (simTimerId) { window.clearInterval(simTimerId); simTimerId = null; }
    if (progressTimerId) { window.clearInterval(progressTimerId); progressTimerId = null; }
    simMode = false;
    simPlaying = false;
    simElapsed = 0;
    setPlayingUI(false);
    setElapsedUI(0, chosen ? chosen.seconds : 0);
    pausemsg.textContent = '';
  }

  function startSimulated() {
    simPlaying = true;
    setPlayingUI(true);
    if (!session.audio_started_at) session.audio_started_at = new Date().toISOString();
    simTimerId = window.setInterval(() => {
      simElapsed += 0.2;
      const duration = chosen ? chosen.seconds : 0;
      setElapsedUI(simElapsed, duration);
      if (simElapsed >= duration) {
        pauseSimulated();
        onPlaybackEnded();
      }
    }, 200);
  }

  function pauseSimulated() {
    simPlaying = false;
    setPlayingUI(false);
    if (simElapsed > 0) pausemsg.textContent = 'Paused — take your time.';
    if (simTimerId) {
      window.clearInterval(simTimerId);
      simTimerId = null;
    }
  }

  bigplay.addEventListener('click', () => {
    if (simMode) {
      simPlaying ? pauseSimulated() : startSimulated();
      return;
    }
    if (audioEl.paused) {
      audioEl.play().catch((err) => {
        console.warn('Audio playback unavailable (placeholder URL until real files are supplied) — using a simulated timer so this can still be tested end-to-end:', err);
        simMode = true;
        startSimulated();
      });
    } else {
      audioEl.pause();
    }
  });

  // ---------------------------------------------------------------------
  // SCREEN 3 — Exit + Reminder
  // ---------------------------------------------------------------------

  const tchips = document.querySelectorAll('#tchips .tchip');
  const chanreveal = document.getElementById('chanreveal');
  const cchans = document.querySelectorAll('.cchan');
  const contact = document.getElementById('contact');
  const settled = document.getElementById('settled');

  tchips.forEach((chip) => {
    chip.addEventListener('click', () => {
      tchips.forEach((c) => {
        c.classList.remove('sel');
        c.setAttribute('aria-pressed', 'false');
      });
      chip.classList.add('sel');
      chip.setAttribute('aria-pressed', 'true');
      session.reminder_time = chip.dataset.time;

      const notNow = chip.dataset.time === 'none';
      chanreveal.classList.toggle('open', !notNow);
      if (notNow) settled.classList.add('show');
    });
  });

  cchans.forEach((btn) => {
    btn.addEventListener('click', () => {
      cchans.forEach((c) => {
        c.classList.remove('sel');
        c.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('sel');
      btn.setAttribute('aria-pressed', 'true');
      session.reminder_channel = btn.dataset.channel;
      // FIX: contact field now switches input type/keyboard to match the
      // chosen channel (was always a plain text field regardless).
      contact.type = btn.dataset.channel === 'email' ? 'email' : 'tel';
      contact.placeholder = btn.dataset.channel === 'email' ? 'Email address' : 'Mobile number';
    });
  });

  document.getElementById('setBtn').addEventListener('click', () => {
    session.reminder_contact = contact.value.trim();
    chanreveal.classList.remove('open');
    settled.classList.add('show');
    scheduleReminder();
  });

  // Calls the serverless stub in /api/schedule-reminder.js — not wired to
  // real Twilio/SendGrid (no credentials exist yet, see Section 14 of the
  // implementation guide). Fails harmlessly until deployed on a platform
  // that serves /api routes.
  function scheduleReminder() {
    fetch('/api/schedule-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: session.session_id,
        channel: session.reminder_channel,
        contact: session.reminder_contact,
        delay: session.reminder_time,
      }),
    }).catch((err) => console.warn('Reminder scheduling unavailable in this static prototype:', err));
  }
})();
