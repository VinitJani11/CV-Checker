import assert from 'node:assert/strict';
import { analyse, extractRequirements, internals } from '../dist/js/analyser.js';

const job = `Data Analyst\nRequired: strong SQL and Power BI skills. Must have 3 years of experience in data analysis. You will build dashboards and collaborate with stakeholders. A bachelor's degree is preferred.`;
const cv = `PROFILE\nData analyst with four years of experience.\nSKILLS\nSQL, Excel, Power BI\nWORK EXPERIENCE\n• Built Power BI dashboards for finance and operations teams.\n• Collaborated with managers to gather reporting requirements.\nEDUCATION\nBachelor of Science`;

assert.equal(internals.phrasePresent('I use PowerBI daily', 'power bi'), true);
assert.ok(extractRequirements(job).some(item => item.term === 'sql'));
const result = analyse(job, cv, {});
assert.ok(result.overall > 30 && result.overall <= 100);
assert.ok(result.matches.some(item => item.term === 'power bi' && item.status === 'matched'));
assert.ok(result.improvedCv.includes('TARGETED CORE SKILLS'));
console.log(`All tests passed. Sample score: ${result.overall}%`);
