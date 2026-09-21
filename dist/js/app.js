import { analyse } from './analyser.js';
import { exportDocx, exportTxt, printPdf } from './exporter.js';
import { parseCvFile } from './parsers.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const state = { signals: {}, result: null, filter: 'all' };
const elements = {
  job: $('#jobText'), cv: $('#cvText'), file: $('#cvFile'), fileName: $('#fileName'), parseNote: $('#parseNote'),
  analyse: $('#analyseButton'), results: $('#results'), save: $('#saveDraft'), improved: $('#improvedCv'), original: $('#originalPreview')
};

function wordCount(value) { return (value.trim().match(/\S+/g) || []).length; }
function updateCounters() { $('#jobCounter').textContent = `${wordCount(elements.job.value)} words`; $('#cvCounter').textContent = `${wordCount(elements.cv.value)} words`; }
function toast(message) { const el = $('#toast'); el.textContent = message; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2600); }
function escapeHtml(value) { const node = document.createElement('div'); node.textContent = value; return node.innerHTML; }

function saveDraft() {
  if (!elements.save.checked) return;
  localStorage.setItem('cvMatchDraft', JSON.stringify({ job: elements.job.value, cv: elements.cv.value, improved: elements.improved.value }));
}

function loadDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem('cvMatchDraft'));
    if (!draft) return;
    elements.job.value = draft.job || ''; elements.cv.value = draft.cv || ''; elements.improved.value = draft.improved || ''; elements.save.checked = true; updateCounters();
  } catch { localStorage.removeItem('cvMatchDraft'); }
}

function renderScores(result) {
  $('#overallScore').textContent = `${result.overall}%`;
  $('#scoreRing').style.setProperty('--score', result.overall);
  $('#scoreRing').setAttribute('aria-label', `Overall match score ${result.overall} percent`);
  $('#scoreCards').innerHTML = Object.entries(result.categories).map(([name, score]) => `<div class="score-card"><span>${escapeHtml(name)}</span><strong>${score}%</strong><div class="mini-bar"><i style="width:${score}%"></i></div></div>`).join('');
}

function renderRequirements() {
  const matches = state.result.matches.filter(item => state.filter === 'all' || item.status === state.filter);
  $('#requirementCount').textContent = `${matches.length} shown`;
  $('#requirementList').innerHTML = matches.map(item => `<article class="requirement" data-status="${item.status}">
    <div class="requirement-top"><div><h4>${escapeHtml(item.term)}</h4><div class="badges"><span class="badge">${item.importance}</span><span class="badge">${item.type}</span><span class="badge">${item.confidence}% confidence</span></div></div><span class="status ${item.status}">${item.status === 'confirm' ? 'Needs confirmation' : item.status}</span></div>
    <p class="evidence">${item.evidence ? `<strong>Closest CV evidence:</strong> “${escapeHtml(item.evidence)}”` : 'No supporting CV sentence was found.'}</p>
  </article>`).join('') || '<p>No requirements in this category.</p>';
}

function renderResult(result) {
  renderScores(result); state.result = result; renderRequirements();
  $('#formatScore').textContent = `${result.format.score}%`;
  $('#formatIssues').innerHTML = result.format.issues.map(issue => `<div class="issue ${issue.level}">${issue.level === 'good' ? '✓' : '!'} ${escapeHtml(issue.message)}</div>`).join('');
  $('#recommendations').innerHTML = result.recommendations.map(item => `<article class="recommendation"><span class="importance">${escapeHtml(item.importance)} priority</span><h4>${escapeHtml(item.title)}</h4><p><strong>Why:</strong> ${escapeHtml(item.reason)}</p><p><strong>Action:</strong> ${escapeHtml(item.action)}</p></article>`).join('');
  elements.original.value = elements.cv.value; elements.improved.value = result.improvedCv; elements.results.hidden = false; saveDraft();
  elements.results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function runAnalysis() {
  elements.analyse.disabled = true; elements.analyse.firstElementChild.textContent = 'Analysing…';
  try { renderResult(analyse(elements.job.value, elements.cv.value, state.signals)); }
  catch (error) { toast(error.message || 'The analysis could not be completed.'); }
  finally { elements.analyse.disabled = false; elements.analyse.firstElementChild.textContent = 'Analyse CV'; }
}

elements.job.addEventListener('input', () => { updateCounters(); saveDraft(); });
elements.cv.addEventListener('input', () => { updateCounters(); saveDraft(); });
elements.improved.addEventListener('input', saveDraft);
elements.analyse.addEventListener('click', runAnalysis);
elements.file.addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  elements.fileName.textContent = file.name; elements.parseNote.textContent = 'Reading file locally…';
  try {
    const parsed = await parseCvFile(file); elements.cv.value = parsed.text; state.signals = parsed.signals; updateCounters();
    elements.parseNote.textContent = `${file.name} was read locally. Review the extracted text before analysing.`; toast('CV text extracted'); saveDraft();
  } catch (error) { elements.parseNote.textContent = error.message; toast(error.message); }
});
$$('.tab').forEach(tab => tab.addEventListener('click', () => { $$('.tab').forEach(item => item.classList.remove('active')); tab.classList.add('active'); state.filter = tab.dataset.filter; renderRequirements(); }));
$('#clearDataButton').addEventListener('click', () => {
  if (!confirm('Clear the CV, job description and saved draft from this browser?')) return;
  localStorage.removeItem('cvMatchDraft'); elements.job.value = ''; elements.cv.value = ''; elements.improved.value = ''; elements.results.hidden = true; elements.save.checked = false; state.signals = {}; updateCounters(); toast('Local data cleared');
});
$('#copyButton').addEventListener('click', async () => { await navigator.clipboard.writeText(elements.improved.value); toast('Improved CV copied'); });
$('#txtButton').addEventListener('click', () => exportTxt(elements.improved.value));
$('#docxButton').addEventListener('click', async () => { try { await exportDocx(elements.improved.value); } catch (error) { toast(error.message); } });
$('#pdfButton').addEventListener('click', () => { try { printPdf(elements.improved.value); } catch (error) { toast(error.message); } });

loadDraft(); updateCounters();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(() => {});
