const form = document.getElementById('search-form');
const queryInput = document.getElementById('query');
const submitBtn = document.getElementById('submit-btn');
const answerEl = document.getElementById('answer');
const sourcesEl = document.getElementById('sources');
const statusPill = document.getElementById('status-pill');

function setStatus(label, tone = 'idle') {
  statusPill.textContent = label;
  statusPill.dataset.tone = tone;
}

function renderSources(sources) {
  sourcesEl.innerHTML = '';

  if (!Array.isArray(sources) || sources.length === 0) {
    const li = document.createElement('li');
    li.className = 'muted';
    li.textContent = 'No sources returned.';
    sourcesEl.appendChild(li);
    return;
  }

  for (const source of sources) {
    const li = document.createElement('li');
    li.className = 'source-item';

    if (source.type === 'web') {
      const title = source.title || 'Web Source';
      const snippet = source.snippet || 'No snippet provided.';
      const url = source.url || '#';
      li.innerHTML = `
        <p class="source-type">Web</p>
        <p class="source-title">${title}</p>
        <p class="source-content">${snippet}</p>
        <a href="${url}" target="_blank" rel="noopener noreferrer">Open Source</a>
      `;
    } else {
      const content = source.content || 'No content available.';
      const similarityText =
        typeof source.similarity === 'number'
          ? `Similarity: ${source.similarity.toFixed(4)}`
          : 'Similarity score unavailable';
      li.innerHTML = `
        <p class="source-type">Knowledge Base</p>
        <p class="source-content">${content}</p>
        <p class="source-meta">${similarityText}</p>
      `;
    }

    sourcesEl.appendChild(li);
  }
}

function applyStreamEvent(event) {
  if (event.type === 'text-delta') {
    answerEl.classList.remove('muted');
    answerEl.textContent += event.delta;
    return;
  }

  if (event.type === 'done') {
    if (!answerEl.textContent.trim()) {
      answerEl.classList.remove('muted');
      answerEl.textContent = event.answer || 'No answer generated.';
    }
    renderSources(event.sources);
    setStatus('Complete', 'success');
    return;
  }

  if (event.type === 'error') {
    throw new Error(event.error || 'Streaming request failed');
  }
}

async function consumeStream(response) {
  if (!response.body) {
    throw new Error('Streaming is not supported in this browser.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }

      applyStreamEvent(JSON.parse(line));
    }
  }

  const trailingLine = buffer.trim();
  if (trailingLine) {
    applyStreamEvent(JSON.parse(trailingLine));
  }
}

async function runSearch(query) {
  setStatus('Streaming', 'loading');
  submitBtn.disabled = true;
  answerEl.classList.remove('muted');
  answerEl.textContent = '';
  renderSources([]);

  try {
    const response = await fetch('/api/search/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Request failed');
    }

    await consumeStream(response);

    if (!answerEl.textContent.trim()) {
      answerEl.classList.add('muted');
      answerEl.textContent = 'No answer generated.';
    }
  } catch (error) {
    answerEl.classList.remove('muted');
    answerEl.textContent = `Error: ${error.message}`;
    renderSources([]);
    setStatus('Failed', 'error');
  } finally {
    submitBtn.disabled = false;
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const query = queryInput.value.trim();
  if (!query) {
    return;
  }
  runSearch(query);
});
