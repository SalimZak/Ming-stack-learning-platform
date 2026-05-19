// grafana task 2 - drag and drop

const PAIRS = [
  { id: 'gauge',     image: 'tasks/grafana/images/gauge.svg',
    itemKey: 'gt2_pair_gauge_item',     slotKey: 'gt2_pair_gauge_slot',     hintKey: 'gt2_pair_gauge_hint' },
  { id: 'line',      image: 'tasks/grafana/images/line-chart.svg',
    itemKey: 'gt2_pair_line_item',      slotKey: 'gt2_pair_line_slot',      hintKey: 'gt2_pair_line_hint' },
  { id: 'stat',      image: 'tasks/grafana/images/stat.svg',
    itemKey: 'gt2_pair_stat_item',      slotKey: 'gt2_pair_stat_slot',      hintKey: 'gt2_pair_stat_hint' },
  { id: 'bar',       image: 'tasks/grafana/images/bar-chart.svg',
    itemKey: 'gt2_pair_bar_item',       slotKey: 'gt2_pair_bar_slot',       hintKey: 'gt2_pair_bar_hint' },
  { id: 'threshold', image: 'tasks/grafana/images/threshold-line.svg',
    itemKey: 'gt2_pair_threshold_item', slotKey: 'gt2_pair_threshold_slot', hintKey: 'gt2_pair_threshold_hint' },
  { id: 'boolean',   image: 'tasks/grafana/images/boolean-timeline.svg',
    itemKey: 'gt2_pair_boolean_item',   slotKey: 'gt2_pair_boolean_slot',   hintKey: 'gt2_pair_boolean_hint' },
];

// max 5 points
const GT2_MAX_SCORE = 5;
const GT2_MIN_SCORE = 0;

let gt2Score = 0;
let gt2CorrectCount = 0;

// safe i18n lookup, returns the key itself if the translation system isn't loaded yet
function gt2T(key, fallback) {
  return (typeof t === 'function' ? t(key) : (fallback || key));
}

// Fisher-Yates shuffle — randomizes the array in place
function gt2Shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// shows a brief correct/wrong message then hides it after 900ms
function flashMsg(text, ok) {
  const el = document.getElementById('flash-msg');
  el.textContent = text;
  el.className = 'messagebox ' + (ok ? 'message-correct' : 'message-wrong');
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 900);
}

function buildItems() {
  const source = document.getElementById('drag-source');
  source.innerHTML = '<div class="drag-source-label">' + gt2T('gt2_sourceLabel', 'Elementer') + '</div>';

  gt2Shuffle(PAIRS).forEach(p => {
    const itemLabel = gt2T(p.itemKey);
    const el = document.createElement('div');
    el.className = 'drag-item';
    el.draggable = true;
    el.dataset.id = p.id;
    el.innerHTML =
      '<img class="drag-item-img" src="' + p.image + '" alt="' + itemLabel + '">' +
      '<div class="drag-item-label">' + itemLabel + '</div>';

    el.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', p.id);
      e.dataTransfer.effectAllowed = 'move';
      el.classList.add('dragging');
    });
    el.addEventListener('dragend', () => el.classList.remove('dragging'));
    source.appendChild(el);
  });
}

function buildSlots() {
  const grid = document.getElementById('drop-grid');
  grid.innerHTML = '';
  gt2CorrectCount = 0;

  gt2Shuffle(PAIRS).forEach(p => {
    const slot = document.createElement('div');
    slot.className = 'drop-slot';
    slot.dataset.expects = p.id;
    slot.dataset.tried = ''; // empty means this slot hasn't been attempted yet
    slot.innerHTML =
      '<div class="slot-label">' + gt2T(p.slotKey) + '</div>' +
      '<div class="slot-hint">'  + gt2T(p.hintKey) + '</div>' +
      '<div class="slot-droparea">' + gt2T('gt2_dropHere', 'Drop here') + '</div>';

    slot.addEventListener('dragover', e => {
      e.preventDefault(); // required to allow dropping
      e.dataTransfer.dropEffect = 'move';
      slot.classList.add('drag-over');
    });
    slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));

    slot.addEventListener('drop', e => {
      e.preventDefault();
      slot.classList.remove('drag-over');
      if (slot.classList.contains('correct')) return; // don't allow drops on already completed slots
      handleDrop(slot, e.dataTransfer.getData('text/plain'));
    });

    grid.appendChild(slot);
  });
}

function handleDrop(slot, itemId) {
  const ok = itemId === slot.dataset.expects;
  const item = document.querySelector('.drag-item[data-id="' + itemId + '"]');
  // check if this is the first attempt on this slot
  const firstTry = !slot.dataset.tried;

  if (ok) {
    slot.classList.add('correct');
    const droparea = slot.querySelector('.slot-droparea');
    const pair = PAIRS.find(p => p.id === itemId);
    if (pair) {
      const itemLabel = gt2T(pair.itemKey);
      droparea.innerHTML =
        '<img class="slot-dropped-img" src="' + pair.image + '" alt="' + itemLabel + '">' +
        '<div class="slot-dropped-label">' + itemLabel + '</div>';
    } else {
      droparea.textContent = itemId;
    }
    if (item) item.remove();
    gt2CorrectCount++;

    // only award points on the first correct attempt
    if (firstTry) {
      gt2Score = Math.min(GT2_MAX_SCORE, gt2Score + 1);
      if (typeof pointSystem === 'function') pointSystem('grafana-t2', gt2Score);
    }
    slot.dataset.tried = 'correct';

    flashMsg(gt2T('gt2_correct', '\u2713 Correct!'), true);
    if (gt2CorrectCount >= PAIRS.length) {
      document.getElementById('complete-banner').style.display = 'block';
    }
  } 
  else {
    // only deduct a point on the first wrong attempt per slot
    if (firstTry) {
      gt2Score = Math.max(GT2_MIN_SCORE, gt2Score - 1);
      if (typeof pointSystem === 'function') pointSystem('grafana-t2', gt2Score);
    }
    slot.dataset.tried = 'wrong';

    slot.classList.add('wrong-flash');
    flashMsg(gt2T('gt2_wrong', '\u2717 Try again'), false);
    setTimeout(() => slot.classList.remove('wrong-flash'), 800);
  }
}

function startTask() {
  // load any previously saved score for this task
  if (typeof readData === 'function') {
    const data = readData();
    const saved = data.tasks && data.tasks['grafana-t2'];
    gt2Score = (saved && typeof saved.points === 'number') ? saved.points : 0;
  } else {
    gt2Score = 0;
  }

  document.getElementById('infobox').style.display = 'none';
  document.getElementById('task-area').style.display = 'block';
  document.getElementById('complete-banner').style.display = 'none';
  buildItems();
  buildSlots();
}

function resetTask() {
  document.getElementById('complete-banner').style.display = 'none';
  // don't reset points here, the point system already keeps the highest score
  buildItems();
  buildSlots();
}

// called when the user switches language, rebuilds everything with the new text
function gt2RefreshLabels() {
  const taskArea = document.getElementById('task-area');
  if (!taskArea || taskArea.style.display === 'none') return;
  buildItems();
  buildSlots();

  // if the complete banner is already showing, update it to the new language too
  const banner = document.getElementById('complete-banner');
  if (banner && banner.style.display === 'block') {
    banner.textContent = gt2T('gt2_complete', '\u2713 Oppgave fullf\u00f8rt!') +
                         ' \u2014 ' + gt2T('gt2_completeScore', 'Poeng') +
                         ': ' + gt2Score + '/' + GT2_MAX_SCORE;
  }
}
