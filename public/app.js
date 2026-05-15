const $ = id => document.getElementById(id);

const fields = ['problem1','problem2','solution1','solution2','kpis','beforeAfter','conclusion'];

let currentSections = [];

function getAnswers() {
  return Object.fromEntries(fields.map(f => [f, $(f).value.trim()]));
}

function wordCount(sections) {
  return sections.reduce((n, s) => n + s.content.split(/\s+/).filter(Boolean).length, 0);
}

function renderSections(sections) {
  currentSections = sections;
  const container = $('doc-sections');
  $('doc-empty').style.display = 'none';
  container.innerHTML = '';

  sections.forEach((s, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'section-wrap';

    const badge = document.createElement('span');
    badge.className = 'type-badge';
    badge.textContent = s.type;
    wrap.appendChild(badge);

    const el = document.createElement(tagFor(s.type));
    el.className = classFor(s.type);
    el.contentEditable = 'true';
    el.textContent = s.content;

    el.addEventListener('input', () => {
      currentSections[i].content = el.textContent;
      updateWordCount();
    });

    wrap.appendChild(el);
    container.appendChild(wrap);
  });

  updateWordCount();
  $('btn-correct').disabled = false;
}

function tagFor(type) {
  if (type === 'h1') return 'h1';
  if (type === 'h2') return 'h2';
  if (type === 'quote') return 'blockquote';
  return 'p';
}

function classFor(type) {
  const map = { h1: 'doc-h1', h2: 'doc-h2', p: 'doc-p', quote: 'doc-quote' };
  return map[type] || 'doc-p';
}

function updateWordCount() {
  const n = wordCount(currentSections);
  $('word-count').textContent = n ? `${n} words` : '';
}

function setLoading(btn, isLoading, label) {
  if (isLoading) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner${btn.id === 'btn-correct' ? ' spinner-dark' : ''}"></span>${label}`;
  } else {
    btn.disabled = false;
    btn.textContent = label;
  }
}

$('btn-generate').addEventListener('click', async () => {
  const answers = getAnswers();
  const missing = fields.filter(f => !answers[f]);
  if (missing.length) {
    const labels = { problem1:'Primary problem', problem2:'Secondary problem', solution1:'Solution 1', solution2:'Solution 2', kpis:'KPIs', beforeAfter:'Before/After KPI', conclusion:'Transformation' };
    alert(`Please fill in: ${missing.map(f => labels[f]).join(', ')}`);
    return;
  }

  setLoading($('btn-generate'), true, 'Generating…');
  $('btn-correct').disabled = true;

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    renderSections(data.sections);
  } catch (err) {
    alert('Generation failed: ' + err.message);
  } finally {
    setLoading($('btn-generate'), false, 'Generate Case Study');
  }
});

$('btn-correct').addEventListener('click', async () => {
  const feedback = $('feedback-input').value.trim();
  if (!feedback) { $('feedback-input').focus(); return; }
  if (!currentSections.length) return;

  setLoading($('btn-correct'), true, 'Rewriting…');

  try {
    const res = await fetch('/api/refine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sections: currentSections, feedback, answers: getAnswers() }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    renderSections(data.sections);
    $('feedback-input').value = '';
  } catch (err) {
    alert('Refinement failed: ' + err.message);
  } finally {
    setLoading($('btn-correct'), false, 'Correct');
  }
});

$('feedback-input').addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) $('btn-correct').click();
});
