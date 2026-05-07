(() => {
const PAIRS = [
  { id: 'a', itemLabel: 'Insert item text 1', slotLabel: 'Insert slot title 1', slotHint: 'Insert hint 1' },
  { id: 'b', itemLabel: 'Insert item text 2', slotLabel: 'Insert slot title 2', slotHint: 'Insert hint 2' },
  { id: 'c', itemLabel: 'Insert item text 3', slotLabel: 'Insert slot title 3', slotHint: 'Insert hint 3' },
  { id: 'd', itemLabel: 'Insert item text 4', slotLabel: 'Insert slot title 4', slotHint: 'Insert hint 4' },
  { id: 'e', itemLabel: 'Insert item text 5', slotLabel: 'Insert slot title 5', slotHint: 'Insert hint 5' },
  { id: 'f', itemLabel: 'Insert item text 6', slotLabel: 'Insert slot title 6', slotHint: 'Insert hint 6' },
];

// ==============================================================

let correctCount = 0;

function shuffle(arr) {
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
  source.innerHTML = '<div class="drag-source-label">Insert label here</div>';

  shuffle(PAIRS).forEach(p => {
    const el = document.createElement('div');
    el.className = 'drag-item';
    el.draggable = true;
    el.textContent = p.itemLabel;
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

function buildSlots() {
  const grid = document.getElementById('drop-grid');
  grid.innerHTML = '';
  correctCount = 0;

  shuffle(PAIRS).forEach(p => {
    const slot = document.createElement('div');
    slot.className = 'drop-slot';
    slot.dataset.expects = p.id;
    slot.innerHTML =
      '<div class="slot-label">' + p.slotLabel + '</div>' +
      '<div class="slot-hint">' + p.slotHint + '</div>' +
      '<div class="slot-droparea">Drop here</div>';

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

  if (ok) {
    slot.classList.add('correct');
    const droparea = slot.querySelector('.slot-droparea');
    const pair = PAIRS.find(p => p.id === itemId);
    droparea.textContent = pair ? pair.itemLabel : itemId;
    if (item) item.remove();
    correctCount++;
    flashMsg('\u2713 Correct!', true);
    if (correctCount >= PAIRS.length) {
      document.getElementById('complete-banner').style.display = 'block';
    }
  } else {
    slot.classList.add('wrong-flash');
    flashMsg('\u2717 Try again', false);
    setTimeout(() => slot.classList.remove('wrong-flash'), 800);
  }
}

function startTask() {
  document.getElementById('infobox').style.display = 'none';
  document.getElementById('task-area').style.display = 'block';
  document.getElementById('complete-banner').style.display = 'none';
  buildItems();
  buildSlots();
}

function resetTask() {
  document.getElementById('complete-banner').style.display = 'none';
  buildItems();
  buildSlots();
}
})();