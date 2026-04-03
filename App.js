// ===== STATE =====
let clues = [];
let currentClueIndex = 0;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  renderPlay();
  renderAdminList();

  document.getElementById('answer-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') checkAnswer();
  });
});

// ===== STORAGE =====
function loadData() {
  try {
    const stored = localStorage.getItem('scavenger_clues');
    if (stored) clues = JSON.parse(stored);
  } catch { clues = []; }

  try {
    const idx = localStorage.getItem('scavenger_current');
    if (idx !== null) currentClueIndex = parseInt(idx, 10);
  } catch { currentClueIndex = 0; }

  // Guard against index out of range
  if (currentClueIndex >= clues.length) currentClueIndex = 0;
}

function saveData() {
  localStorage.setItem('scavenger_clues', JSON.stringify(clues));
  localStorage.setItem('scavenger_current', String(currentClueIndex));
}

// ===== VIEW SWITCHING =====
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  document.getElementById('nav-' + name).classList.add('active');
}

// ===== PLAY LOGIC =====
function renderPlay() {
  const noClues = document.getElementById('no-clues-msg');
  const clueCard = document.getElementById('clue-card');
  const dots = document.getElementById('progress-dots');

  if (clues.length === 0) {
    noClues.classList.remove('hidden');
    clueCard.classList.add('hidden');
    dots.innerHTML = '';
    return;
  }

  noClues.classList.add('hidden');
  clueCard.classList.remove('hidden');

  const clue = clues[currentClueIndex];

  document.getElementById('clue-badge').textContent = `Clue ${currentClueIndex + 1}`;
  document.getElementById('clue-progress').textContent = `${currentClueIndex + 1} / ${clues.length}`;
  document.getElementById('location-name').textContent = clue.location || 'Somewhere…';
  document.getElementById('clue-text').textContent = clue.clue;
  document.getElementById('answer-input').value = '';
  document.getElementById('wrong-msg').classList.add('hidden');

  // Hint
  const hintArea = document.getElementById('hint-area');
  const hintText = document.getElementById('hint-text');
  const btnHint = document.getElementById('btn-hint');
  hintText.classList.add('hidden');
  btnHint.classList.remove('hidden');
  if (clue.hint) {
    hintArea.classList.remove('hidden');
    hintText.textContent = '💡 ' + clue.hint;
  } else {
    hintArea.classList.add('hidden');
  }

  // Progress dots
  dots.innerHTML = '';
  clues.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'dot';
    if (i < currentClueIndex) dot.classList.add('done');
    else if (i === currentClueIndex) dot.classList.add('current');
    dots.appendChild(dot);
  });

  // Re-animate card
  const card = document.getElementById('clue-card');
  card.style.animation = 'none';
  void card.offsetWidth;
  card.style.animation = '';
}

function showHint() {
  document.getElementById('hint-text').classList.remove('hidden');
  document.getElementById('btn-hint').classList.add('hidden');
}

function checkAnswer() {
  if (clues.length === 0) return;

  const input = document.getElementById('answer-input');
  const userAnswer = input.value.trim().toLowerCase();
  const correctAnswer = clues[currentClueIndex].answer.trim().toLowerCase();

  if (!userAnswer) return;

  if (userAnswer === correctAnswer) {
    showCelebration();
  } else {
    // Wrong answer feedback
    input.classList.add('shake');
    input.addEventListener('animationend', () => input.classList.remove('shake'), { once: true });
    document.getElementById('wrong-msg').classList.remove('hidden');
  }
}

function showCelebration() {
  const clue = clues[currentClueIndex];
  const isLast = currentClueIndex === clues.length - 1;

  document.getElementById('celebration-msg').textContent =
    clue.celebration || 'Amazing work, explorer!';

  const btnNext   = document.getElementById('btn-next-clue');
  const btnFinish = document.getElementById('btn-finish');

  if (isLast) {
    btnNext.classList.add('hidden');
    btnFinish.classList.remove('hidden');
    btnFinish.onclick = () => {
      hideCelebration();
      showWinScreen();
    };
  } else {
    btnNext.classList.remove('hidden');
    btnFinish.classList.add('hidden');
    btnNext.onclick = () => {
      hideCelebration();
      currentClueIndex++;
      saveData();
      renderPlay();
    };
  }

  document.getElementById('celebration').classList.remove('hidden');
  launchConfetti('confetti-canvas');
}

function hideCelebration() {
  document.getElementById('celebration').classList.add('hidden');
  stopConfetti();
}

function showWinScreen() {
  document.getElementById('win-screen').classList.remove('hidden');
  launchConfetti('confetti-canvas-win');

  document.getElementById('btn-play-again').onclick = () => {
    document.getElementById('win-screen').classList.add('hidden');
    stopConfetti();
    currentClueIndex = 0;
    saveData();
    renderPlay();
  };
}

// ===== ADMIN LOGIC =====
function saveClue() {
  const location    = document.getElementById('f-location').value.trim();
  const clueText    = document.getElementById('f-clue').value.trim();
  const answer      = document.getElementById('f-answer').value.trim();
  const hint        = document.getElementById('f-hint').value.trim();
  const celebration = document.getElementById('f-celebration').value.trim();
  const editIndex   = parseInt(document.getElementById('edit-index').value, 10);

  if (!location || !clueText || !answer) {
    alert('Please fill in Location, Clue text, and Answer before saving.');
    return;
  }

  const clueObj = { location, clue: clueText, answer, hint, celebration };

  if (editIndex >= 0) {
    clues[editIndex] = clueObj;
  } else {
    clues.push(clueObj);
  }

  saveData();
  clearForm();
  renderAdminList();
  renderPlay();
}

function cancelEdit() {
  clearForm();
}

function clearForm() {
  document.getElementById('f-location').value    = '';
  document.getElementById('f-clue').value        = '';
  document.getElementById('f-answer').value      = '';
  document.getElementById('f-hint').value        = '';
  document.getElementById('f-celebration').value = '';
  document.getElementById('edit-index').value    = '-1';
  document.getElementById('form-title').textContent = 'Add a New Clue';
  document.getElementById('btn-cancel').classList.add('hidden');
}

function editClue(index) {
  const c = clues[index];
  document.getElementById('f-location').value    = c.location || '';
  document.getElementById('f-clue').value        = c.clue || '';
  document.getElementById('f-answer').value      = c.answer || '';
  document.getElementById('f-hint').value        = c.hint || '';
  document.getElementById('f-celebration').value = c.celebration || '';
  document.getElementById('edit-index').value    = String(index);
  document.getElementById('form-title').textContent = `Edit Clue ${index + 1}`;
  document.getElementById('btn-cancel').classList.remove('hidden');

  // Scroll to form
  document.querySelector('.clue-form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function deleteClue(index) {
  if (!confirm(`Delete clue ${index + 1}? This can't be undone.`)) return;
  clues.splice(index, 1);
  if (currentClueIndex >= clues.length) currentClueIndex = Math.max(0, clues.length - 1);
  saveData();
  renderAdminList();
  renderPlay();
}

function renderAdminList() {
  const list = document.getElementById('admin-clue-list');
  const count = document.getElementById('clue-count');

  count.textContent = `${clues.length} clue${clues.length !== 1 ? 's' : ''}`;

  if (clues.length === 0) {
    list.innerHTML = '<p class="empty-list">No clues added yet. Fill in the form above!</p>';
    return;
  }

  list.innerHTML = clues.map((c, i) => `
    <div class="admin-clue-item">
      <div class="clue-item-num">${i + 1}</div>
      <div class="clue-item-body">
        <div class="clue-item-location">${escapeHtml(c.location)}</div>
        <div class="clue-item-text">${escapeHtml(c.clue)}</div>
        <div class="clue-item-answer">Answer: <strong>${escapeHtml(c.answer)}</strong>${c.hint ? ` · Hint: ${escapeHtml(c.hint)}` : ''}</div>
      </div>
      <div class="clue-item-actions">
        <button class="btn-edit" onclick="editClue(${i})">Edit</button>
        <button class="btn-delete" onclick="deleteClue(${i})">Delete</button>
      </div>
    </div>
  `).join('');
}

function resetHunt() {
  if (!confirm('Reset hunt progress to the first clue?')) return;
  currentClueIndex = 0;
  saveData();
  renderPlay();
  alert('Hunt reset! Progress is back at Clue 1.');
}

function clearAllClues() {
  if (!confirm('Delete ALL clues? This cannot be undone.')) return;
  clues = [];
  currentClueIndex = 0;
  saveData();
  renderAdminList();
  renderPlay();
}

// ===== CONFETTI =====
let confettiAnimId = null;
const confettiParticles = [];

const COLORS = ['#FFD93D','#6BCB77','#4ECDC4','#FF6B6B','#A78BFA','#F4A623','#FF9F43'];

function launchConfetti(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  confettiParticles.length = 0;
  for (let i = 0; i < 140; i++) {
    confettiParticles.push({
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height - canvas.height,
      w:  Math.random() * 10 + 5,
      h:  Math.random() * 6  + 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      speed: Math.random() * 3 + 1.5,
      angle: Math.random() * 360,
      spin:  (Math.random() - 0.5) * 4,
      drift: (Math.random() - 0.5) * 1.5,
    });
  }

  if (confettiAnimId) cancelAnimationFrame(confettiAnimId);

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    confettiParticles.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle * Math.PI / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();

      p.y     += p.speed;
      p.x     += p.drift;
      p.angle += p.spin;

      if (p.y > canvas.height + 20) {
        p.y = -20;
        p.x = Math.random() * canvas.width;
      }
    });
    confettiAnimId = requestAnimationFrame(draw);
  }
  draw();
}

function stopConfetti() {
  if (confettiAnimId) {
    cancelAnimationFrame(confettiAnimId);
    confettiAnimId = null;
  }
  ['confetti-canvas','confetti-canvas-win'].forEach(id => {
    const c = document.getElementById(id);
    if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height);
  });
  confettiParticles.length = 0;
}

// ===== HELPERS =====
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
