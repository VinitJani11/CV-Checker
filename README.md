# CV Match Studio

A browser-only CV analyser, job matcher and fact-safe CV improvement tool. CV content is processed locally in the browser. There is no backend, database, paid API or account.

## Features

- Paste a CV and job description, or read PDF, DOCX and TXT files locally
- Dynamic requirement extraction, including terms not present in a fixed skill list
- Exact, alias, token-overlap, context and lightweight semantic-group matching
- Matched, partial, missing and needs-confirmation classifications
- Evidence sentence and confidence shown for each requirement
- Transparent weighted score and ATS structure checks
- Conservative CV rewrite that never inserts missing skills or invented numbers
- Editable original/improved comparison
- TXT, DOCX and Print/PDF export
- Optional local draft saving and one-click local data clearing
- Responsive layout and installable offline shell

## Run in VS Code

1. Open this folder in VS Code.
2. Open a terminal in the project folder.
3. Run `npm start`.
4. Visit `http://localhost:8000`.

You can also use the VS Code Live Server extension and open the `dist` folder. Do not open `index.html` directly with `file://`, because browser security rules can block JavaScript modules.

## Test

Run `npm test`. The tests use Node's built-in test dependencies and install nothing.

## Deploy to GitHub Pages

1. Create an empty GitHub repository and upload this project.
2. Push the project to the `main` branch.
3. In repository **Settings → Pages**, select **GitHub Actions** as the source.
4. The included workflow publishes the `dist` folder automatically.
5. Open the Pages URL and test paste input plus PDF/DOCX loading.

All paths are relative, so the app works correctly in a GitHub project subdirectory.

## Scoring model

- Required skills: 25%
- Experience and responsibilities: 20%
- Important keywords: 15%
- Education and certifications: 10%
- Achievements and evidence: 10%
- ATS structure: 20%

The score is an estimate based on visible rules. It cannot reproduce an employer's proprietary ATS.

## Matching method

The analyser extracts requirements from job-description sentences and recurring two- or three-word phrases. Every requirement is compared independently with CV sentences using exact/normalised terms, aliases, token overlap, context rules and curated semantic groups. It always shows the closest CV evidence so the user can judge the result.

This lightweight method works on an ordinary laptop without a model download. It will not understand language as deeply as a large language model. The safest extension is an optional Transformers.js embedding mode, kept separate from the default analyser because it requires a larger first-time download.

## Privacy and limitations

- Documents are read in the browser and are not uploaded by this code.
- Drafts are stored only if the user selects the save checkbox.
- PDF layout checks are limited because PDF text extraction does not reliably expose columns, graphics or visual reading order.
- PDF.js, Mammoth and JSZip load from public CDNs. Once cached by the service worker they may work offline, but the first load needs internet access. Vendor these files into `dist/lib/` if guaranteed first-run offline use is required.
- Review all generated wording before applying. The rewrite deliberately stays conservative.
