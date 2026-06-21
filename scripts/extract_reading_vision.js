const fs = require('fs');
const path = require('path');
const { pdf } = require('pdf-to-img');

function loadOpencodeConfig() {
  try {
    const cfgPath = process.env.OPENCODE_CONFIG || `${process.env.HOME}/.config/opencode/opencode.jsonc`;
    const text = fs.readFileSync(cfgPath, 'utf8');
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

const opencodeConfig = loadOpencodeConfig();
const defaultProvider = opencodeConfig?.provider?.['volcengine-plan'];
const API_KEY = process.env.ARK_API_KEY || defaultProvider?.options?.apiKey || '';
const API_URL = process.env.ARK_VISION_API_URL || (defaultProvider?.options?.baseURL ? defaultProvider.options.baseURL.replace(/\/$/, '') + '/chat/completions' : 'https://ark.cn-beijing.volces.com/api/coding/v3/chat/completions');
const MODEL = process.env.ARK_VISION_MODEL || 'ark-code-latest';

function usage() {
  console.log('Usage: node scripts/extract_reading_vision.js --pdf <test.pdf> --answers <answer.pdf> --out <out.json> [--pages 40-83] [--answer-pages 1-40]');
  console.log('By default it reads ~/.config/opencode/opencode.jsonc and uses volcengine-plan/ark-code-latest.');
  process.exit(1);
}
function checkEnv() {
  if (!API_KEY || !MODEL) {
    console.log('Error: no vision model credentials found. Set ARK_API_KEY/ARK_VISION_MODEL or configure ~/.config/opencode/opencode.jsonc.');
    process.exit(1);
  }
}

function arg(name) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 ? process.argv[i + 1] : '';
}

function parseRanges(s, max) {
  if (!s) return Array.from({ length: max }, (_, i) => i + 1);
  const set = new Set();
  s.split(',').forEach(part => {
    const m = part.match(/^(\d+)(?:-(\d+))?$/);
    if (!m) return;
    const a = parseInt(m[1], 10);
    const b = parseInt(m[2] || m[1], 10);
    for (let i = a; i <= b; i++) if (i >= 1 && i <= max) set.add(i);
  });
  return [...set].sort((a, b) => a - b);
}

async function renderPages(pdfPath, pages, outDir, prefix) {
  fs.mkdirSync(outDir, { recursive: true });
  const scale = parseFloat(arg('scale') || '1.4');
  const doc = await pdf(pdfPath, { scale });
  const wanted = new Set(parseRanges(pages, doc.length));
  const outputs = [];
  let pageNo = 0;
  for await (const image of doc) {
    pageNo++;
    if (!wanted.has(pageNo)) continue;
    const file = path.join(outDir, `${prefix}_${String(pageNo).padStart(3, '0')}.png`);
    fs.writeFileSync(file, image);
    outputs.push({ page: pageNo, file });
  }
  return outputs;
}

function imageContent(file) {
  const base64 = fs.readFileSync(file).toString('base64');
  return { type: 'image_url', image_url: { url: `data:image/png;base64,${base64}` } };
}

function extractJson(text) {
  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  const m = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!m) throw new Error('No JSON found in model output: ' + text.slice(0, 500));
  return JSON.parse(m[0]);
}

async function callVision(messages, temperature = 0) {
  let lastErr = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODEL, temperature, stream: false, messages })
      });
      if (!resp.ok) throw new Error(`API ${resp.status}: ${await resp.text()}`);
      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content || '';
      if (!content) throw new Error('Empty model response');
      return content;
    } catch (err) {
      lastErr = err;
      await new Promise(resolve => setTimeout(resolve, attempt * 2000));
    }
  }
  throw lastErr;
}

async function detectReadingPages(images) {
  const batches = [];
  for (let i = 0; i < images.length; i += 6) batches.push(images.slice(i, i + 6));
  const hits = [];
  for (const batch of batches) {
    const content = [
      { type: 'text', text: '这些是TOEIC扫描页。请只判断每张图是否包含Reading Part 6或Part 7题目/文章。返回严格JSON数组：[{"page":页码,"part":"Part6|Part7|Other","questionRange":"如131-134或空","reason":"简短"}]。不要输出其它文字。' },
      ...batch.flatMap(x => [{ type: 'text', text: `PAGE ${x.page}` }, imageContent(x.file)])
    ];
    const raw = await callVision([{ role: 'user', content }]);
    const arr = extractJson(raw);
    hits.push(...arr.filter(x => x.part === 'Part6' || x.part === 'Part7'));
  }
  return hits;
}

function groupDetectedRanges(detected, images) {
  const imageMap = new Map(images.map(x => [x.page, x]));
  const ranges = new Map();
  for (const d of detected) {
    if (!d.questionRange || !imageMap.has(d.page)) continue;
    const key = `${d.part}:${d.questionRange}`;
    if (!ranges.has(key)) ranges.set(key, { part: d.part, questionRange: d.questionRange, pages: [] });
    ranges.get(key).pages.push(imageMap.get(d.page));
  }
  return [...ranges.values()].map(r => ({ ...r, pages: r.pages.sort((a, b) => a.page - b.page) }));
}

async function extractQuestionGroupsFromRanges(ranges) {
  const groups = [];
  for (const range of ranges) {
    const content = [
      { type: 'text', text: `从这些TOEIC ${range.part}扫描页中提取题组，题号范围必须是 ${range.questionRange}。跨页材料要合并上下文。返回严格JSON数组，通常只返回1个题组。字段：groupId(用题号范围), part(Part6或Part7), sourcePages, passageTitle, passageText, documents(数组), questions。questions字段：number, questionText, options(4项), correctAnswer空字符串, correctIndex null, explanationJa空字符串, explanationCn空字符串。必须提取该范围内所有题号，不要漏题，不要猜答案，不要输出其它文字。` },
      ...range.pages.flatMap(x => [{ type: 'text', text: `PAGE ${x.page}` }, imageContent(x.file)])
    ];
    const raw = await callVision([{ role: 'user', content }]);
    const arr = extractJson(raw);
    for (const g of arr) groups.push(g);
  }
  return groups;
}

async function extractAnswers(images) {
  const batches = [];
  for (let i = 0; i < images.length; i += 4) batches.push(images.slice(i, i + 4));
  const answers = [];
  for (const batch of batches) {
    const content = [
      { type: 'text', text: '从这些TOEIC解析扫描页中，只提取Part6和Part7答案与日文解析。返回严格JSON数组：[{"number":题号,"correctAnswer":"A|B|C|D","explanationJa":"日文解析原文"}]。没有就返回[]。不要输出其它文字。' },
      ...batch.flatMap(x => [{ type: 'text', text: `PAGE ${x.page}` }, imageContent(x.file)])
    ];
    const raw = await callVision([{ role: 'user', content }]);
    const arr = extractJson(raw);
    answers.push(...arr);
  }
  return answers;
}

async function translateAndMerge(groups, answers) {
  const answerMap = new Map(answers.map(a => [String(a.number), a]));
  for (const g of groups) {
    for (const q of g.questions || []) {
      const a = answerMap.get(String(q.number));
      if (a) {
        q.correctAnswer = a.correctAnswer || '';
        q.correctIndex = 'ABCD'.indexOf(q.correctAnswer);
        q.explanationJa = a.explanationJa || '';
      }
    }
  }
  const content = [{ type: 'text', text: '把以下TOEIC Part6/Part7题组JSON中的日文解析 explanationJa 翻译为中文 explanationCn，并补充每题 summaryTip。保留所有英文原文、题号、选项、答案，不要删字段。返回严格JSON数组，不要输出其它文字。\n' + JSON.stringify(groups) }];
  const raw = await callVision([{ role: 'user', content }], 0.1);
  return extractJson(raw);
}

(async () => {
  checkEnv();
  const pdfPath = arg('pdf');
  const answerPath = arg('answers');
  const out = arg('out');
  if (!pdfPath || !out) usage();
  const work = arg('work') || '/tmp/opencode/toeic_vision_pages';
  const testImages = await renderPages(pdfPath, arg('pages'), path.join(work, 'test'), 'test');
  const detected = await detectReadingPages(testImages);
  fs.writeFileSync(out.replace(/\.json$/, '.detected.json'), JSON.stringify(detected, null, 2));
  const readingPages = new Set(detected.map(x => x.page));
  const readingImages = testImages.filter(x => readingPages.has(x.page));
  const ranges = groupDetectedRanges(detected, readingImages);
  fs.writeFileSync(out.replace(/\.json$/, '.ranges.json'), JSON.stringify(ranges.map(r => ({ part: r.part, questionRange: r.questionRange, pages: r.pages.map(p => p.page) })), null, 2));
  let groups = await extractQuestionGroupsFromRanges(ranges);
  let answers = [];
  if (answerPath) {
    const answerImages = await renderPages(answerPath, arg('answer-pages'), path.join(work, 'answers'), 'answers');
    answers = await extractAnswers(answerImages);
    fs.writeFileSync(out.replace(/\.json$/, '.answers.json'), JSON.stringify(answers, null, 2));
    groups = await translateAndMerge(groups, answers);
  }
  fs.writeFileSync(out, JSON.stringify(groups, null, 2));
  const qCount = groups.reduce((sum, g) => sum + (g.questions || []).length, 0);
  console.log(`Wrote ${groups.length} groups, ${qCount} questions -> ${out}`);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
