// ── GRAFANA OPPGAVE 2 — Drag og slipp ──────────────────────────

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

// Maks 5 poeng (visualiseres p\u00e5 5 LED-er p\u00e5 fysisk boks)
const GT2_MAX_SCORE = 5;
const GT2_MIN_SCORE = 0;

let gt2Score = 0;
let gt2CorrectCount = 0;

// trygg oppslag: returnerer t(key) hvis i18n er lastet, ellers fallback
function gt2T(key, fallback) {
  return (typeof t === 'function' ? t(key) : (fallback || key));
}

function gt2Shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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
    slot.dataset.tried = ''; // tom = f\u00f8rste fors\u00f8k ikke gjort enda
    slot.innerHTML =
      '<div class="slot-label">' + gt2T(p.slotKey) + '</div>' +
      '<div class="slot-hint">'  + gt2T(p.hintKey) + '</div>' +
      '<div class="slot-droparea">' + gt2T('gt2_dropHere', 'Drop here') + '</div>';

    slot.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      slot.classList.add('drag-over');
    });
    slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));

    slot.addEventListener('drop', e => {
      e.preventDefault();
      slot.classList.remove('drag-over');
      if (slot.classList.contains('correct')) return;
      handleDrop(slot, e.dataTransfer.getData('text/plain'));
    });

    grid.appendChild(slot);
  });
}

function handleDrop(slot, itemId) {
  const ok = itemId === slot.dataset.expects;
  const item = document.querySelector('.drag-item[data-id="' + itemId + '"]');
  // f\u00f8rste fors\u00f8k p\u00e5 denne sonen?
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

    // poeng kun hvis riktig p\u00e5 f\u00f8rste fors\u00f8k
    if (firstTry) {
      gt2Score = Math.min(GT2_MAX_SCORE, gt2Score + 1);
      if (typeof pointSystem === 'function') pointSystem('grafana-t2', gt2Score);
    }
    slot.dataset.tried = 'correct';

    flashMsg(gt2T('gt2_correct', '\u2713 Correct!'), true);
    if (gt2CorrectCount >= PAIRS.length) {
      document.getElementById('complete-banner').style.display = 'block';
    }
  } else {
    // -1 kun p\u00e5 f\u00f8rste feilfors\u00f8k per sone (matcher MQTT task 3)
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
  // hent tidligere poeng fra localStorage (samme m\u00f8nster som t3Start)
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
  // poeng nullstilles IKKE (pointSystem bruker Math.max s\u00e5 h\u00f8yeste vinner)
  buildItems();
  buildSlots();
}

// kalles n\u00e5r brukeren bytter spr\u00e5k \u2014 bygger oppgaven p\u00e5 nytt hvis aktiv
function gt2RefreshLabels() {
  const taskArea = document.getElementById('task-area');
  if (!taskArea || taskArea.style.display === 'none') return;
  buildItems();
  buildSlots();

  // hvis fullf\u00f8rings-banneret allerede vises, re-bygg det p\u00e5 nytt spr\u00e5k
  const banner = document.getElementById('complete-banner');
  if (banner && banner.style.display === 'block') {
    banner.textContent = gt2T('gt2_complete', '\u2713 Oppgave fullf\u00f8rt!') +
                         ' \u2014 ' + gt2T('gt2_completeScore', 'Poeng') +
                         ': ' + gt2Score + '/' + GT2_MAX_SCORE;
  }
}
