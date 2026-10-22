import { escapeHtml } from './lib.mjs';

const STATUS_LABEL = { draft: 'Draft', pilot: 'Pilot', ready: 'Ready', planned: 'Planned' };

function page({ title, css, js, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
${css.trim()}
</style>
</head>
<body>
${body.trim()}
<script>
${js.trim()}
</script>
</body>
</html>
`;
}

function renderBlocks(blocks, nextAnswerId) {
  return blocks
    .map((block) => {
      if (block.kind === 'content') return block.html.trim();
      const id = nextAnswerId();
      const title = escapeHtml(block.title);
      return `<div class="answer">
<button type="button" class="show-answer" aria-expanded="false" aria-controls="${id}" data-label="${title}">Show answer: ${title}</button>
<div class="answer-body" id="${id}" hidden>
${block.html.trim()}
</div>
</div>`;
    })
    .join('\n');
}

export function renderLabPage(lab, assets) {
  const { meta, sections } = lab;
  let counter = 0;
  const nextAnswerId = () => `answer-${++counter}`;
  const toc = sections.map((section) => `<li><a href="#${section.id}">${escapeHtml(section.title)}</a></li>`).join('\n');
  const content = sections
    .map(
      (section) => `<section id="${section.id}">
<h2>${escapeHtml(section.title)}</h2>
${renderBlocks(section.blocks, nextAnswerId)}
</section>`,
    )
    .join('\n');
  const docs = meta.docs.map((doc) => `<li><a href="${escapeHtml(doc.url)}">${escapeHtml(doc.title)}</a></li>`).join('\n');
  const body = `<header class="lab-header">
<p class="crumbs"><a href="index.html">All labs</a></p>
<p class="eyebrow">Lab ${meta.number} · ${escapeHtml(meta.feature)}</p>
<h1>${escapeHtml(meta.title)}</h1>
<p class="summary">${escapeHtml(meta.summary)}</p>
<dl class="facts">
<div><dt>Level</dt><dd>${escapeHtml(meta.level)}</dd></div>
<div><dt>Time</dt><dd>${meta.durationMinutes} min</dd></div>
<div><dt>Status</dt><dd><span class="status status-${meta.status}">${STATUS_LABEL[meta.status]}</span></dd></div>
<div><dt>Last verified</dt><dd>${escapeHtml(meta.lastVerified)}</dd></div>
</dl>
<p class="fallback"><strong>No-admin fallback:</strong> ${escapeHtml(meta.fallback)}</p>
<noscript><p class="fallback">Answers need JavaScript. Open this page in a browser with scripts enabled.</p></noscript>
</header>
<div class="layout">
<nav class="toc" aria-label="Sections">
<p class="toc-title">On this page</p>
<ol>
${toc}
</ol>
<p class="toc-title">Official docs</p>
<ul>
${docs}
</ul>
</nav>
<main>
${content}
</main>
</div>`;
  return page({ title: `Lab ${meta.number}: ${meta.title}`, css: assets.css, js: assets.js, body });
}

export function renderIndexPage(catalog, labs, assets) {
  const built = new Map(labs.map((lab) => [lab.meta.number, lab]));
  const rows = catalog
    .map((entry) => {
      const lab = built.get(entry.number);
      const status = lab ? lab.meta.status : 'planned';
      const title = lab
        ? `<a href="${lab.folder}.html">${escapeHtml(lab.meta.title)}</a>`
        : escapeHtml(entry.title);
      return `<tr>
<td>${entry.number}</td>
<td>${title}<div class="muted">${escapeHtml(lab ? lab.meta.summary : entry.brief || '')}</div></td>
<td>${escapeHtml(lab ? lab.meta.feature : entry.feature || '')}</td>
<td>${lab ? `${lab.meta.durationMinutes} min` : '—'}</td>
<td><span class="status status-${status}">${STATUS_LABEL[status]}</span></td>
</tr>`;
    })
    .join('\n');
  const body = `<header class="lab-header">
<p class="eyebrow">learn-devin-new-features</p>
<h1>Devin practice labs</h1>
<p class="summary">Promptless, customer-style labs for recent Devin features. Each lab gives you a customer brief and an evidence contract, not a prompt. Answers stay hidden until you press “Show answer”, and hide again when you reload the page.</p>
</header>
<main class="wide">
<table class="catalog">
<thead><tr><th>#</th><th>Lab</th><th>Feature</th><th>Time</th><th>Status</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>
</main>`;
  return page({ title: 'Devin practice labs', css: assets.css, js: assets.js, body });
}
