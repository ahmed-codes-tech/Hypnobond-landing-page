(() => {
  'use strict';

  const sessionId = new URLSearchParams(window.location.search).get('id');
  const invalidScreen = document.getElementById('invalidScreen');
  const checkinScreen = document.getElementById('checkinScreen');

  // This static prototype has no database to validate against — a real
  // deployment must check session_id against the sessions table (Section
  // 11 of the implementation guide) and show this same neutral message on
  // a genuine mismatch, not an error. Here we can only check an id was
  // supplied at all.
  if (!sessionId) {
    invalidScreen.classList.add('active');
    checkinScreen.classList.remove('active');
    return;
  }
  invalidScreen.classList.remove('active');
  checkinScreen.classList.add('active');

  const feedback = {
    session_id: sessionId,
    after_q1: null,
    after_q2: null,
    after_q3: null,
  };

  const fbcount = document.getElementById('fbcount');

  function showStep(n) {
    document.getElementById('fs' + n).classList.remove('show');
  }

  function ans(btn, q) {
    btn.parentNode.querySelectorAll('button').forEach((b) => {
      b.classList.remove('sel');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('sel');
    btn.setAttribute('aria-pressed', 'true');
    feedback['after_q' + q] = Number(btn.dataset.value);

    window.setTimeout(() => {
      document.getElementById('fs' + q).classList.remove('show');
      document.getElementById('fs' + (q + 1)).classList.add('show');
      fbcount.textContent = '0' + (q + 1) + ' / 03';
    }, 280);
  }

  document.querySelectorAll('#sr1 button').forEach((btn) => {
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', () => ans(btn, 1));
  });
  document.querySelectorAll('#sr2 button').forEach((btn) => {
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', () => ans(btn, 2));
  });

  function fbfinish() {
    document.getElementById('fbsteps').style.display = 'none';
    document.getElementById('fbpriv').style.display = 'none';
    document.getElementById('thanks').classList.add('show');
  }

  // POST to a real backend once one exists — see /api/schedule-reminder.js
  // for the same caveat. Never blocks the UI from reaching "thank you".
  function submitFeedback() {
    fetch('/api/submit-reflection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedback),
    }).catch((err) => console.warn('Feedback submission unavailable in this static prototype:', err));
    fbfinish();
  }

  document.getElementById('shareBtn').addEventListener('click', () => {
    feedback.after_q3 = document.getElementById('fbNote').value.trim() || null;
    submitFeedback();
  });

  document.getElementById('nothingBtn').addEventListener('click', () => {
    feedback.after_q3 = null;
    submitFeedback();
  });
})();
