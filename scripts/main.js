(() => {
  'use strict';

  // Total run time: 3:30. This is the one universal audio duration — no
  // protocol/track selection exists, so this constant is the only "content"
  // driving the player.
  const DURATION_SECONDS = 210;
  const RING_CIRCUMFERENCE = 377; // matches r=60 circle in main.css

  const body = document.body;
  const playButton = document.getElementById('playButton');
  const playPauseButton = document.getElementById('playPauseButton');
  const ringProgress = document.getElementById('ringProgress');
  const timeLabel = document.getElementById('timeLabel');
  const announcer = document.getElementById('stateAnnouncer');
  const iconPlay = playPauseButton.querySelector('.icon--play');
  const iconPause = playPauseButton.querySelector('.icon--pause');

  // Audio pause actions
  const backButton = document.getElementById('backButton');
  const reflectionCtaButton = document.getElementById('reflectionCtaButton');

  // Completion's delayed inline invite
  const reflectYesInline = document.getElementById('reflectYesInline');
  const reflectNotNowInline = document.getElementById('reflectNotNowInline');

  // Reflection Setup (prototype UI only — no sending/backend)
  const reflectYesFull = document.getElementById('reflectYesFull');
  const reflectNotNowFull = document.getElementById('reflectNotNowFull');
  const reflectBackButton = document.getElementById('reflectBackButton');
  const timingButtons = document.querySelectorAll('[data-timing]');
  const channelButtons = document.querySelectorAll('[data-channel]');
  const reflectContactLabel = document.getElementById('reflectContactLabel');
  const reflectContact = document.getElementById('reflectContact');

  let elapsed = 0;
  let intervalId = null;
  let isPlaying = false;
  let reflectInviteTimeoutId = null;

  function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function updatePlaybackUI() {
    const fraction = Math.min(elapsed / DURATION_SECONDS, 1);
    const offset = RING_CIRCUMFERENCE * (1 - fraction);
    ringProgress.style.strokeDashoffset = String(offset);
    timeLabel.textContent = `${formatTime(elapsed)} / ${formatTime(DURATION_SECONDS)}`;
  }

  function setPlayPauseIcon(playing) {
    iconPlay.classList.toggle('is-hidden', playing);
    iconPause.classList.toggle('is-hidden', !playing);
    playPauseButton.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    // Lets the Audio view recede further (brand mark, badge, atmosphere)
    // only while actually playing — paused keeps the Phase 1 audio baseline.
    body.dataset.playing = playing ? 'true' : 'false';
    updateInteractivity();
  }

  // Keeps keyboard/assistive-tech focus confined to what's actually visible:
  // every button/input lives in the DOM at all times (simple state-driven
  // markup, no dynamic mounting), so anything outside the active view/step
  // must be explicitly disabled or it would still be reachable by Tab even
  // while invisible (opacity/pointer-events don't affect tab order).
  function updateInteractivity() {
    document.querySelectorAll('.view').forEach((view) => {
      const isActiveView = view.dataset.view === body.dataset.state;
      view.querySelectorAll('button, input').forEach((el) => {
        el.disabled = !isActiveView;
      });
    });

    if (body.dataset.state === 'audio') {
      backButton.disabled = isPlaying;
      reflectionCtaButton.disabled = isPlaying;
    }

    if (body.dataset.state === 'completion') {
      const revealed = body.dataset.reflectInvite === 'visible';
      reflectYesInline.disabled = !revealed;
      reflectNotNowInline.disabled = !revealed;
    }

    if (body.dataset.state === 'reflection') {
      document.querySelectorAll('.reflect-panel').forEach((panel) => {
        const isActivePanel = panel.dataset.panel === body.dataset.reflectStep;
        panel.querySelectorAll('button, input').forEach((el) => {
          el.disabled = !isActivePanel;
        });
      });
      reflectBackButton.disabled = body.dataset.reflectStep === 'ask';
    }
  }

  function tick() {
    elapsed += 1;
    updatePlaybackUI();
    if (elapsed >= DURATION_SECONDS) {
      stopPlayback();
      goToCompletion();
    }
  }

  function startPlayback() {
    if (isPlaying) return;
    isPlaying = true;
    setPlayPauseIcon(true);
    intervalId = window.setInterval(tick, 1000);
  }

  function stopPlayback() {
    isPlaying = false;
    setPlayPauseIcon(false);
    if (intervalId) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
  }

  function setState(next) {
    body.dataset.state = next;
    document.querySelectorAll('.view').forEach((view) => {
      view.setAttribute('aria-hidden', view.dataset.view === next ? 'false' : 'true');
    });
    announcer.textContent = next;
    updateInteractivity();
  }

  function goToAudio() {
    setState('audio');
    elapsed = 0;
    updatePlaybackUI();
    startPlayback();
  }

  function goToCompletion() {
    setState('completion');
    // Reset in case Completion is reached more than once in a session
    // (e.g. Back to Arrival, then play again to the end).
    window.clearTimeout(reflectInviteTimeoutId);
    delete body.dataset.reflectInvite;
    updateInteractivity();
    reflectInviteTimeoutId = window.setTimeout(() => {
      body.dataset.reflectInvite = 'visible';
      updateInteractivity();
    }, 2600);
  }

  // "Back" from a paused Audio session — same page/shell, no reload/navigation.
  function goBackToArrival() {
    stopPlayback();
    elapsed = 0;
    updatePlaybackUI();
    setState('arrival');
  }

  function setReflectStep(step, channel) {
    body.dataset.reflectStep = step;
    if (channel) {
      body.dataset.channel = channel;
      const isEmail = channel === 'email';
      reflectContactLabel.textContent = isEmail ? 'Email address' : 'Phone number';
      reflectContact.type = isEmail ? 'email' : 'tel';
      reflectContact.autocomplete = isEmail ? 'email' : 'tel';
    }
    updateInteractivity();
  }

  function goToReflection(step) {
    setState('reflection');
    setReflectStep(step);
  }

  playButton.addEventListener('click', goToAudio);
  backButton.addEventListener('click', goBackToArrival);
  reflectionCtaButton.addEventListener('click', () => goToReflection('ask'));

  playPauseButton.addEventListener('click', () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  });

  // Completion's inline invite
  reflectYesInline.addEventListener('click', () => goToReflection('timing'));
  reflectNotNowInline.addEventListener('click', () => {
    delete body.dataset.reflectInvite;
    updateInteractivity();
  });

  // Reflection Setup — prototype UI flow only, nothing is sent or stored.
  reflectYesFull.addEventListener('click', () => setReflectStep('timing'));
  reflectNotNowFull.addEventListener('click', () => setState('audio'));

  timingButtons.forEach((btn) => {
    btn.addEventListener('click', () => setReflectStep('channel'));
  });

  channelButtons.forEach((btn) => {
    btn.addEventListener('click', () => setReflectStep('contact', btn.dataset.channel));
  });

  reflectBackButton.addEventListener('click', () => {
    const previousStep = { timing: 'ask', channel: 'timing', contact: 'channel' }[body.dataset.reflectStep];
    if (previousStep) setReflectStep(previousStep);
  });

  body.dataset.playing = 'false';
  updatePlaybackUI();
  updateInteractivity();
})();