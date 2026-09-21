import { ACTION_VERBS, ALIASES, SEMANTIC_GROUPS, SKILL_GROUPS, STANDARD_SECTIONS, STOPWORDS } from './data.js';

const clean = value => value.toLowerCase().replace(/[‐‑–—]/g, '-').replace(/[^a-z0-9+#./%\-\s]/g, ' ').replace(/\s+/g, ' ').trim();
const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const tokens = value => clean(value).split(' ').filter(word => word.length > 1 && !STOPWORDS.has(word));
const unique = list => [...new Set(list)];
const clamp = value => Math.max(0, Math.min(100, Math.round(value)));
const sentences = value => value.split(/\n+|(?<=[.!?])\s+/).map(item => item.trim()).filter(item => item.length > 3);
const allSkills = unique(Object.values(SKILL_GROUPS).flat().concat(Object.keys(ALIASES)));

function canonicalPhrase(phrase) {
  const normal = clean(phrase).replace(/\s+/g, ' ');
  for (const [canonical, aliases] of Object.entries(ALIASES)) {
    if (clean(canonical) === normal || aliases.some(alias => clean(alias) === normal)) return canonical;
  }
  return normal;
}

function phrasePresent(text, phrase) {
  const normalText = ` ${clean(text)} `;
  const candidates = [phrase, ...(ALIASES[canonicalPhrase(phrase)] || [])];
  return candidates.some(candidate => {
    const form = clean(candidate);
    return normalText.includes(` ${form} `) || normalText.replace(/\s/g, '').includes(form.replace(/\s/g, ''));
  });
}

function importanceOf(sentence) {
  if (/\b(must|required|essential|mandatory|minimum|need to|needs to)\b/i.test(sentence)) return 'required';
  if (/\b(preferred|desirable|beneficial|nice to have|advantage)\b/i.test(sentence)) return 'preferred';
  return 'standard';
}

function typeOf(term, sentence) {
  if (/\b(degree|bachelor|master|phd|diploma|education)\b/i.test(term + ' ' + sentence)) return 'education';
  if (/\b(certified|certification|certificate|licen[cs]e)\b/i.test(term + ' ' + sentence)) return 'certification';
  if (/\b(years?|experience)\b/i.test(term)) return 'experience';
  if (allSkills.includes(canonicalPhrase(term))) return 'skill';
  return 'responsibility';
}

function significantNgrams(text) {
  const source = tokens(text);
  const counts = new Map();
  for (let size = 2; size <= 3; size += 1) {
    for (let index = 0; index <= source.length - size; index += 1) {
      const phrase = source.slice(index, index + size).join(' ');
      if (phrase.length < 7 || /\b(company|team member|job description|equal opportunity|successful candidate)\b/.test(phrase)) continue;
      counts.set(phrase, (counts.get(phrase) || 0) + 1);
    }
  }
  return [...counts.entries()].filter(([, count]) => count > 1).sort((a, b) => b[1] - a[1] || b[0].length - a[0].length).slice(0, 10).map(([phrase]) => phrase);
}

export function extractRequirements(jobText) {
  const jobSentences = sentences(jobText);
  const requirements = new Map();
  const add = (term, source, forcedType) => {
    const value = canonicalPhrase(term).replace(/^(strong|excellent|proven|good)\s+/, '').replace(/[.:;,]+$/, '').trim();
    if (value.length < 2 || STOPWORDS.has(value)) return;
    const key = `${value}|${forcedType || typeOf(value, source)}`;
    const item = { term: value, type: forcedType || typeOf(value, source), importance: importanceOf(source), source };
    const old = requirements.get(key);
    if (!old || (old.importance !== 'required' && item.importance === 'required')) requirements.set(key, item);
  };

  for (const sentence of jobSentences) {
    for (const skill of allSkills) if (phrasePresent(sentence, skill)) add(skill, sentence, 'skill');
    const years = sentence.match(/\b(?:minimum\s+)?\d+\+?\s*(?:-|to\s+\d+\s*)?years?(?:\s+of)?\s+experience(?:\s+in\s+[a-z0-9 +#./-]{2,45})?/i);
    if (years) add(years[0], sentence, 'experience');
    const degree = sentence.match(/\b(?:bachelor'?s?|master'?s?|phd|doctorate|degree|diploma)\s+(?:degree\s+)?(?:in\s+)?[a-z &/-]{0,45}/i);
    if (degree) add(degree[0], sentence, 'education');
    const cert = sentence.match(/\b(?:certified|certification|certificate|licen[cs]e)\s+(?:in\s+)?[a-z0-9 &+./-]{2,40}/i);
    if (cert) add(cert[0], sentence, 'certification');
    if (/\b(responsible|will|must|required|essential|you will|ability to|experience (?:in|with))\b/i.test(sentence)) {
      const chunks = sentence.replace(/^.*?\b(?:responsible for|you will|ability to|experience (?:in|with)|must(?: have)?|required|essential|will)\b:?/i, '').split(/[,;]|\band\b/i);
      chunks.map(chunk => clean(chunk)).filter(chunk => {
        const words = chunk.split(' ');
        return words.length >= 2 && words.length <= 9 && !allSkills.some(skill => phrasePresent(chunk, skill));
      }).slice(0, 3).forEach(chunk => add(chunk, sentence, 'responsibility'));
    }
  }
  significantNgrams(jobText).forEach(phrase => add(phrase, jobSentences.find(sentence => clean(sentence).includes(phrase)) || phrase));
  return [...requirements.values()].sort((a, b) => ({ required: 0, standard: 1, preferred: 2 }[a.importance] - ({ required: 0, standard: 1, preferred: 2 }[b.importance]))).slice(0, 34);
}

function tokenSimilarity(a, b) {
  const left = new Set(tokens(a)); const right = new Set(tokens(b));
  if (!left.size || !right.size) return 0;
  const intersection = [...left].filter(word => right.has(word)).length;
  return intersection / Math.max(left.size, right.size);
}

function semanticSimilarity(a, b) {
  const left = clean(a); const right = clean(b);
  let overlap = 0;
  for (const group of SEMANTIC_GROUPS) if (group.some(word => left.includes(word)) && group.some(word => right.includes(word))) overlap += 1;
  return Math.min(1, overlap * .3);
}

function findBestEvidence(requirement, cvSentences) {
  let best = { score: 0, sentence: '' };
  for (const sentence of cvSentences) {
    const exact = phrasePresent(sentence, requirement.term) ? 1 : 0;
    const canonical = canonicalPhrase(requirement.term);
    const alias = (ALIASES[canonical] || []).some(value => phrasePresent(sentence, value)) ? 1 : 0;
    const token = tokenSimilarity(requirement.term, sentence);
    const semantic = semanticSimilarity(requirement.source, sentence);
    let context = requirement.type === 'experience' && /\b(year|month|managed|led|built|created|delivered|worked)\b/i.test(sentence) ? .7 : 0;
    if (requirement.type === 'education' && ((/bachelor/i.test(requirement.term) && /bachelor/i.test(sentence)) || (/master/i.test(requirement.term) && /master/i.test(sentence)) || (/degree/i.test(requirement.term) && /degree/i.test(sentence)))) context = 1;
    const score = exact * .5 + alias * .15 + token * .18 + semantic * .12 + context * .15;
    if (score > best.score) best = { score, sentence, parts: { exact, alias, token, semantic, context } };
  }
  return best;
}

function classifyMatch(requirement, evidence) {
  if (evidence.parts?.exact || evidence.score >= .75) return 'matched';
  if (evidence.score >= .43) return requirement.type === 'skill' && evidence.parts?.semantic > 0 ? 'confirm' : 'partial';
  if (evidence.score >= .28 && requirement.type === 'skill') return 'confirm';
  return 'missing';
}

function analyseFormat(cvText, signals = {}) {
  const lower = cvText.toLowerCase();
  const found = Object.entries(STANDARD_SECTIONS).filter(([, names]) => names.some(name => new RegExp(`(^|\\n)\\s*${escapeRegExp(name)}\\s*:?($|\\n)`, 'im').test(lower))).map(([key]) => key);
  const issues = [];
  const add = (good, message) => issues.push({ level: good ? 'good' : 'warn', message });
  add(found.includes('experience'), found.includes('experience') ? 'A standard work experience heading was found.' : 'Use a standard “Work Experience” heading.');
  add(found.includes('skills'), found.includes('skills') ? 'A clear skills section was found.' : 'Add a clearly labelled Skills section.');
  add(found.includes('education'), found.includes('education') ? 'An education section was found.' : 'Add a clearly labelled Education section.');
  const contact = /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(cvText) && /(?:\+?\d[\d ()-]{7,}\d)/.test(cvText);
  add(contact, contact ? 'Email and phone contact details are detectable.' : 'Make email and phone details easy to find in plain text.');
  const oddSymbols = (cvText.match(/[★◆■●►✓✦]/g) || []).length;
  if (oddSymbols > 5) add(false, 'Many decorative symbols were found; simple bullets parse more reliably.');
  if (signals.source === 'pdf') add(false, 'PDF layout, columns and graphics cannot be fully judged from extracted text.');
  if (signals.extractionWarnings?.length) add(false, signals.extractionWarnings[0]);
  const wordCount = tokens(cvText).length;
  if (wordCount > 1100) add(false, 'The CV is long. Consider removing less relevant detail.');
  else add(true, 'The extracted text length is within a generally readable range.');
  const score = clamp(100 - issues.filter(issue => issue.level === 'warn').length * 12);
  return { score, issues, sections: found };
}

function categoryScores(matches, format) {
  const ratio = (items, full = 1) => {
    if (!items.length) return 70;
    return clamp(items.reduce((sum, item) => sum + ({ matched: 1, partial: .55, confirm: .35, missing: 0 }[item.status]), 0) / items.length * 100 * full);
  };
  const skills = matches.filter(item => item.type === 'skill');
  const experience = matches.filter(item => ['experience','responsibility'].includes(item.type));
  const education = matches.filter(item => ['education','certification'].includes(item.type));
  const required = matches.filter(item => item.importance === 'required');
  return {
    'Required skills': ratio(skills.filter(item => item.importance === 'required')),
    'Experience': ratio(experience),
    'Keywords': ratio(required.length ? required : matches),
    'Education': ratio(education),
    'Achievements': 0,
    'ATS structure': format.score
  };
}

function achievementScore(cvText) {
  const cvSentences = sentences(cvText);
  const metrics = cvSentences.filter(sentence => /\b\d+(?:\.\d+)?%|£\s?\d|\$\s?\d|\d+\s*(?:hours?|days?|weeks?|customers?|users?|projects?)\b/i.test(sentence)).length;
  const action = cvSentences.filter(sentence => ACTION_VERBS.some(verb => new RegExp(`\\b${verb}`, 'i').test(sentence))).length;
  return clamp(25 + Math.min(45, metrics * 12) + Math.min(30, action * 3));
}

function buildRecommendations(matches, format, cvText) {
  const missingRequired = matches.filter(item => item.status === 'missing' && item.importance === 'required').slice(0, 3);
  const confirm = matches.filter(item => item.status === 'confirm').slice(0, 2);
  const items = missingRequired.map(item => ({ title: `Address “${item.term}”`, reason: 'This appears to be a required job criterion but no supporting CV evidence was found.', importance: 'High', action: 'Add it only if true. Otherwise treat it as a genuine gap and plan training or a relevant project.' }));
  confirm.forEach(item => items.push({ title: `Confirm “${item.term}”`, reason: 'Related wording was found, but the exact skill or tool is not demonstrated.', importance: 'Confirm first', action: `Review this evidence: “${item.evidence}”. Name the requirement only if it accurately describes your work.` }));
  format.issues.filter(issue => issue.level === 'warn').slice(0, 2).forEach(issue => items.push({ title: 'Improve ATS structure', reason: issue.message, importance: 'Medium', action: 'Use a single-column layout, standard headings and plain text contact details.' }));
  if (!/\b\d+(?:\.\d+)?%|£\s?\d|\$\s?\d|\d+\s*(?:hours?|days?|weeks?)\b/i.test(cvText)) items.push({ title: 'Add evidence of impact', reason: 'Few measurable outcomes were detected.', importance: 'Medium', action: 'Add real quantities, time saved, volumes or outcomes where you can verify them. Never estimate numbers.' });
  return items.slice(0, 6);
}

function improveCv(cvText, matches) {
  const verified = matches.filter(item => item.status === 'matched' && item.type === 'skill').map(item => item.term).slice(0, 10);
  const originalLines = cvText.split('\n').map(line => line.trimEnd());
  const rewritten = originalLines.map(line => {
    const indent = line.match(/^\s*/)?.[0] || '';
    let value = line.trim();
    value = value.replace(/^responsible for\s+/i, 'Supported ')
      .replace(/^worked on\s+/i, 'Contributed to ')
      .replace(/^made\s+(weekly |monthly |daily )?reports\b/i, (_, cadence = '') => `Prepared ${cadence}reports`)
      .replace(/^helped (?:with|to)\s+/i, 'Supported ');
    if (/^[-•*]\s*/.test(value)) {
      const content = value.replace(/^[-•*]\s*/, '');
      value = `• ${content.charAt(0).toUpperCase()}${content.slice(1)}`;
    }
    return indent + value;
  });
  const preface = verified.length ? `TARGETED CORE SKILLS\n${verified.map(item => item.replace(/\b\w/g, char => char.toUpperCase())).join(' • ')}\n\n` : '';
  return preface + rewritten.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function analyse(jobText, cvText, signals = {}) {
  if (tokens(jobText).length < 12) throw new Error('Add a fuller job description so the analysis has enough evidence.');
  if (tokens(cvText).length < 12) throw new Error('Add more CV content so the analysis has enough evidence.');
  const requirements = extractRequirements(jobText);
  if (!requirements.length) throw new Error('No clear job requirements could be extracted. Try including the responsibilities and qualifications sections.');
  const cvSentences = sentences(cvText);
  const matches = requirements.map(requirement => {
    const best = findBestEvidence(requirement, cvSentences);
    return { ...requirement, status: classifyMatch(requirement, best), confidence: Math.round(best.score * 100), evidence: best.sentence || '' };
  });
  const format = analyseFormat(cvText, signals);
  const categories = categoryScores(matches, format);
  categories.Achievements = achievementScore(cvText);
  const weights = { 'Required skills': .25, Experience: .2, Keywords: .15, Education: .1, Achievements: .1, 'ATS structure': .2 };
  const overall = clamp(Object.entries(categories).reduce((sum, [name, score]) => sum + score * weights[name], 0));
  return { overall, categories, matches, format, recommendations: buildRecommendations(matches, format, cvText), improvedCv: improveCv(cvText, matches), method: weights };
}

export const internals = { clean, tokens, tokenSimilarity, phrasePresent };
