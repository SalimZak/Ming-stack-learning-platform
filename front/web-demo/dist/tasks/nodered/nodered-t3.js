// ── NODE-RED OPPGAVE 3 — Drag og slipp ──────────

const NRT3_PAIRS = [
  { id: 'node',    itemKey: 'nrt3_pair_node_item',    slotKey: 'nrt3_pair_node_slot',    hintKey: 'nrt3_pair_node_hint' },
  { id: 'flow',    itemKey: 'nrt3_pair_flow_item',    slotKey: 'nrt3_pair_flow_slot',    hintKey: 'nrt3_pair_flow_hint' },
  { id: 'wire',    itemKey: 'nrt3_pair_wire_item',    slotKey: 'nrt3_pair_wire_slot',    hintKey: 'nrt3_pair_wire_hint' },
  { id: 'message', itemKey: 'nrt3_pair_message_item', slotKey: 'nrt3_pair_message_slot', hintKey: 'nrt3_pair_message_hint' },
  { id: 'payload', itemKey: 'nrt3_pair_payload_item', slotKey: 'nrt3_pair_payload_slot', hintKey: 'nrt3_pair_payload_hint' },
  { id: 'deploy',  itemKey: 'nrt3_pair_deploy_item',  slotKey: 'nrt3_pair_deploy_slot',  hintKey: 'nrt3_pair_deploy_hint' },
];

// Maks 5 poeng (samme skala som de andre oppgavene)
const NRT3_MAX_SCORE = 5;
const NRT3_MIN_SCORE = 0;

let nrt3Score = 0;
let nrt3CorrectCount = 0;

// trygg oppslag: returnerer t(key) hvis i18n er lastet, ellers fallback
function nrt3T(key, fallback) {
  return (typeof t === 'function' ? t(key) : (fallback || key));
}

function nrt3Shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function nrt3FlashMsg(text, ok) {
  const el = document.getElementById('nrt3-flash-msg');
  el.textContent = text;
  el.className = 'messagebox ' + (ok ? 'message-correct' : 'message-wrong');
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 900);
}

// Viser fullføringsbanneret med poengsum
function nrt3ShowCompleteBanner() {
  const banner = document.getElementById('nrt3-complete-banner');
  if (!banner) return;
  banner.textContent = nrt3T('nrt3_complete', '\u2713 Oppgave fullf\u00f8rt!') +
                       ' \u2014 ' + nrt3T('nrt3_completeScore', 'Poeng') +
                       ': ' + nrt3Score + '/' + NRT3_MAX_SCORE;
  banner.style.display = 'block';
}

function nrt3BuildItems() {
  const source = document.getElementById('nrt3-drag-source');
  source.innerHTML = '<div class="drag-source-label">' + nrt3T('nrt3_sourceLabel', 'Begrep') + '</div>';

  nrt3Shuffle(NRT3_PAIRS).forEach(p => {
    const itemLabel = nrt3T(p.itemKey);
    const el = document.createElement('div');
    el.className = 'drag-item';
    el.draggable = true;
    el.textContent = itemLabel;
    el.dataset.id = p.id;

    el.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', p.id);
      e.dataTransfer.effectAllowed = 'move';
      el.classList.add('dragging');
    });
    el.addEventListener('dragend', () => el.classList.remove('dragging'));
    source.appendChild(el);
  });
}

function nrt3BuildSlots() {
  const grid = document.getElementById('nrt3-drop-grid');
  grid.innerHTML = '';
  nrt3CorrectCount = 0;

  nrt3Shuffle(NRT3_PAIRS).forEach(p => {
    const slot = document.createElement('div');
    slot.className = 'drop-slot';
    slot.dataset.expects = p.id;
    slot.dataset.tried = ''; // tom = første forsøk ikke gjort enda
    slot.innerHTML =
      '<div class="slot-label">' + nrt3T(p.slotKey) + '</div>' +
      '<div class="slot-hint">'  + nrt3T(p.hintKey) + '</div>' +
      '<div class="slot-droparea">' + nrt3T('nrt3_dropHere', 'Drop here') + '</div>';

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
      nrt3HandleDrop(slot, e.dataTransfer.getData('text/plain'));
    });

    grid.appendChild(slot);
  });
}

function nrt3HandleDrop(slot, itemId) {
  const ok = itemId === slot.dataset.expects;
  const item = document.querySelector('#nrt3-drag-source .drag-item[data-id="' + itemId + '"]');
  // første forsøk på denne sonen?
  const firstTry = !slot.dataset.tried;

  if (ok) {
    slot.classList.add('correct');
    const droparea = slot.querySelector('.slot-droparea');
    const pair = NRT3_PAIRS.find(p => p.id === itemId);
    droparea.textContent = pair ? nrt3T(pair.itemKey) : itemId;
    if (item) item.remove();
    nrt3CorrectCount++;

    // poeng kun hvis riktig på første forsøk (matcher Grafana T2)
    if (firstTry) {
      nrt3Score = Math.min(NRT3_MAX_SCORE, nrt3Score + 1);
      if (typeof pointSystem === 'function') pointSystem('nodered-t3', nrt3Score);
    }
    slot.dataset.tried = 'correct';

    nrt3FlashMsg(nrt3T('nrt3_correct', '\u2713 Correct!'), true);
    if (nrt3CorrectCount >= NRT3_PAIRS.length) {
      nrt3ShowCompleteBanner();
    }
  } else {
    // -1 kun på første feilforsøk per sone
    if (firstTry) {
      nrt3Score = Math.max(NRT3_MIN_SCORE, nrt3Score - 1);
      if (typeof pointSystem === 'function') pointSystem('nodered-t3', nrt3Score);
    }
    slot.dataset.tried = 'wrong';

    slot.classList.add('wrong-flash');
    nrt3FlashMsg(nrt3T('nrt3_wrong', '\u2717 Try again'), false);
    setTimeout(() => slot.classList.remove('wrong-flash'), 800);
  }
}

function nrt3StartTask() {
  // hent tidligere poeng fra localStorage (samme mønster som Grafana T2)
  if (typeof readData === 'function') {
    const data = readData();
    const saved = data.tasks && data.tasks['nodered-t3'];
    nrt3Score = (saved && typeof saved.points === 'number') ? saved.points : 0;
  } else {
    nrt3Score = 0;
  }

  document.getElementById('nrt3-infobox').style.display = 'none';
  document.getElementById('nrt3-task-area').style.display = 'block';
  document.getElementById('nrt3-complete-banner').style.display = 'none';
  nrt3BuildItems();
  nrt3BuildSlots();
}

function nrt3ResetTask() {
  document.getElementById('nrt3-complete-banner').style.display = 'none';
  // poeng nullstilles IKKE (pointSystem bruker Math.max så høyeste vinner)
  nrt3BuildItems();
  nrt3BuildSlots();
}

// kalles når brukeren bytter språk — bygger oppgaven på nytt hvis aktiv
function nrt3RefreshLabels() {
  const taskArea = document.getElementById('nrt3-task-area');
  if (!taskArea || taskArea.style.display === 'none') return;
  nrt3BuildItems();
  nrt3BuildSlots();

  // hvis fullføringsbanneret allerede vises, re-bygg det på nytt språk
  const banner = document.getElementById('nrt3-complete-banner');
  if (banner && banner.style.display === 'block') {
    nrt3ShowCompleteBanner();
  }
}