const fs = require('fs');
const path = require('path');
const { pdf } = require('pdf-to-img');

const cfg = JSON.parse(fs.readFileSync(`${process.env.HOME}/.config/opencode/opencode.jsonc`, 'utf8'));
const prov = cfg.provider['volcengine-plan'];
const API_KEY = process.env.ARK_API_KEY || prov.options.apiKey;
const BASE_URL = prov.options.baseURL.replace(/\/$/, '') + '/chat/completions';
const MODEL = process.env.ARK_VISION_MODEL || 'ark-code-latest';

const WORK = process.env.WORK_DIR || '/tmp/opencode/reading_extract';
const PROG = path.join(WORK, 'progress.json');
fs.mkdirSync(WORK, { recursive: true });

function loadProg() { try { return JSON.parse(fs.readFileSync(PROG, 'utf8')); } catch { return { done: [] }; } }
function saveProg(p) { fs.writeFileSync(PROG, JSON.stringify(p, null, 2)); }

async function callVision(msg) {
  for (let a = 1; a <= 3; a++) {
    try {
      const r = await fetch(BASE_URL, { method: 'POST', headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: MODEL, stream: false, temperature: 0, messages: msg }) });
      if (!r.ok) throw new Error(`API ${r.status}`);
      const d = await r.json();
      const c = d.choices?.[0]?.message?.content || '';
      if (!c) throw new Error('Empty');
      return c;
    } catch (e) { if (a === 3) throw e; await new Promise(r => setTimeout(r, 3000 * a)); }
  }
}

function xjson(text) {
  const c = text.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  const m = c.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
  if (!m) throw new Error('No JSON: ' + text.slice(0, 200));
  return JSON.parse(m[0]);
}

async function toImages(pdfPath, start, end, scale) {
  scale = scale || 1.0;
  const doc = await pdf(pdfPath, { scale });
  const want = new Set();
  for (let i = start; i <= Math.min(end, doc.length); i++) want.add(i);
  const res = []; let i = 0;
  for await (const img of doc) {
    i++;
    if (!want.has(i)) continue;
    const f = path.join(WORK, `pg_${i}.png`);
    fs.writeFileSync(f, img);
    res.push({ page: i, file: f });
  }
  return res;
}

function b64(f) { return fs.readFileSync(f).toString('base64'); }

async function detectReading(images) {
  const hits = [];
  for (let i = 0; i < images.length; i += 6) {
    const b = images.slice(i, i + 6);
    const content = [{ type: 'text', text: '这些是TOEIC试卷扫描页。只判断每页是否含Part6或Part7(题号131-200)。返回JSON数组：[{"page":页码,"part":"Part6|Part7","qRange":"131-134"}]。非Part6/7不返回。不要其它文字。' },
      ...b.flatMap(x => [{ type: 'text', text: `P${x.page}` }, { type: 'image_url', image_url: { url: `data:image/png;base64,${b64(x.file)}` } }])];
    const raw = await callVision([{ role: 'user', content }]);
    hits.push(...xjson(raw));
    console.log(`  detect p${b[0].page}-${b[b.length - 1].page}: +${hits.length}`);
  }
  return hits;
}

async function extractGroups(detected, images) {
  const imap = new Map(images.map(x => [x.page, x]));
  const rgs = new Map();
  for (const d of detected) {
    if (!imap.has(d.page)) continue;
    const key = `${d.part}:${d.qRange || d.questionRange}`;
    if (!rgs.has(key)) rgs.set(key, { part: d.part, qRange: d.qRange || d.questionRange, pages: [] });
    rgs.get(key).pages.push(imap.get(d.page));
  }
  const groups = [];
  for (const [, rg] of rgs) {
    rg.pages.sort((a, b) => a.page - b.page);
    const content = [{ type: 'text', text: `从这些TOEIC ${rg.part}页提取题组，题号范围${rg.qRange}。跨页合并。返回JSON数组：[{"groupId":"131-134","part":"Part6","sourcePages":[59],"passageTitle":"标题","passageText":"完整文章","questions":[{"number":131,"questionText":"完整题干","options":["A","B","C","D"],"correctAnswer":"","correctIndex":null}]}]。必须提取该范围所有题号，不漏题，不猜答案。` },
      ...rg.pages.flatMap(x => [{ type: 'text', text: `P${x.page}` }, { type: 'image_url', image_url: { url: `data:image/png;base64,${b64(x.file)}` } }])];
    try {
      const raw = await callVision([{ role: 'user', content }]);
      const arr = xjson(raw);
      groups.push(...arr);
      console.log(`  extract ${rg.qRange}: ${arr.reduce((s, g) => s + (g.questions || []).length, 0)} qs`);
    } catch (e) { console.error(`  FAIL ${rg.qRange}: ${e.message}`); }
  }
  return groups;
}

async function getAnswers(pdfPath, start, end) {
  const images = await toImages(pdfPath, start, end, 1.0);
  const ans = [];
  for (let i = 0; i < images.length; i += 2) {
    const b = images.slice(i, i + 2);
    const content = [{ type: 'text', text: '从这些TOEIC解析页提取Part6/7(题号131-200)答案和日文解析。返回JSON数组：[{"number":131,"correctAnswer":"A","explanationJa":"日文解析"}]。没有返回[]。不要其它文字。' },
      ...b.flatMap(x => [{ type: 'text', text: `P${x.page}` }, { type: 'image_url', image_url: { url: `data:image/png;base64,${b64(x.file)}` } }])];
    try {
      const raw = await callVision([{ role: 'user', content }]);
      ans.push(...xjson(raw));
      console.log(`  ans p${b[0].page}: total=${ans.length}`);
    } catch (e) { console.error(`  ans FAIL p${b[0].page}: ${e.message}`); }
  }
  return ans;
}

async function findAnsStart(pdfPath) {
  const images = await toImages(pdfPath, 100, 200, 1.0);
  for (let i = 0; i < images.length; i += 5) {
    const b = images.slice(i, i + 5);
    const content = [{ type: 'text', text: '这些是TOEIC解析页。找到Part6解析(题号131)的最早页码。返回JSON：{"p6":页码}。没找到返回{"p6":null}。' },
      ...b.flatMap(x => [{ type: 'text', text: `P${x.page}` }, { type: 'image_url', image_url: { url: `data:image/png;base64,${b64(x.file)}` } }])];
    try {
      const raw = await callVision([{ role: 'user', content }]);
      const d = xjson(raw);
      if (d.p6) { console.log(`  ans Part6 at p${d.p6}`); return d.p6; }
    } catch (e) {}
  }
  return 150;
}

function mergeAns(groups, answers) {
  const am = new Map(answers.map(a => [Number(a.number), a]));
  for (const g of groups) for (const q of (g.questions || [])) {
    const a = am.get(Number(q.number));
    if (a) { q.correctAnswer = a.correctAnswer || ''; q.correctIndex = q.correctAnswer ? 'ABCD'.indexOf(q.correctAnswer) : null; q.explanationJa = a.explanationJa || ''; }
  }
}

async function translate(groups) {
  for (let i = 0; i < groups.length; i += 5) {
    const chunk = groups.slice(i, i + 5);
    try {
      const content = [{ type: 'text', text: '把以下TOEIC题组JSON中日文解析explanationJa翻译为中文explanationCn，每题补充summaryTip(中文考点小结)。保留所有原字段。返回严格JSON数组。\n' + JSON.stringify(chunk) }];
      const raw = await callVision([{ role: 'user', content }]);
      const translated = xjson(raw);
      for (let j = 0; j < translated.length && i + j < groups.length; j++) groups[i + j] = translated[j];
      console.log(`  translated ${i}-${i + chunk.length - 1}`);
    } catch (e) { console.error(`  trans FAIL ${i}: ${e.message}`); }
  }
}

const BASE = '公式TOEIC问题集1-12/公式TOEIC问题集1-12';
const SETS = [
  { id: 'set01', test: `${BASE}/公式TOEIC® Listening & Reading 問題集 1/公式TOEIC® Listening & Reading 問題集 1(压缩).pdf`, ans: null, combined: true },
  { id: 'set02', test: `${BASE}/公式TOEIC® Listening & Reading 問題集 2/问题集2 题目.pdf`, ans: `${BASE}/公式TOEIC® Listening & Reading 問題集 2/问题集2 解析.pdf` },
  { id: 'set03', test: `${BASE}/公式TOEIC® Listening & Reading 問題集 3/公式TOEIC® Listening & Reading 問題集 3.pdf`, ans: null, combined: true },
  { id: 'set04', test: `${BASE}/公式TOEIC® Listening & Reading 問題集 4/公式TOEIC® Listening & Reading 問題集 4.pdf`, ans: null, combined: true },
  { id: 'set05', test: `${BASE}/公式TOEIC® Listening & Reading 問題集 5/公式TOEIC® Listening & Reading 問題集 5.pdf`, ans: null, combined: true },
  { id: 'set06', test: `${BASE}/公式TOEIC® Listening & Reading 問題集 6/TOEIC6公式試験.pdf`, ans: null, combined: true },
  { id: 'set07', test: `${BASE}/公式TOEIC® Listening & Reading 問題集 7/公式TOEIC Listening & Reading 問題集 7（手机扫描版-清晰但文件较大））.pdf`, ans: null, combined: true },
  { id: 'set08', test: `${BASE}/公式TOEIC® Listening & Reading 問題集 8/托业公式8（试题部分）.pdf`, ans: `${BASE}/公式TOEIC® Listening & Reading 問題集 8/托业公式8（解答部分）.pdf` },
  { id: 'set09', test: `${BASE}/公式TOEIC® Listening & Reading 問題集 9/公式TOEIC® Listening & Reading 問題集 9.pdf`, ans: `${BASE}/公式TOEIC® Listening & Reading 問題集 9/公式集9 解析.pdf` },
  { id: 'set10', test: `${BASE}/公式TOEIC® Listening & Reading 問題集 10/问题集10 试题部分.pdf`, ans: `${BASE}/公式TOEIC® Listening & Reading 問題集 10/问题集10 解析部分.pdf` },
  { id: 'set11a', test: `${BASE}/公式TOEIC® Listening & Reading 問題集 11/公式TOEIC11-TEST1.pdf`, ans: `${BASE}/公式TOEIC® Listening & Reading 問題集 11/公式11-TEST1详细解答.pdf` },
  { id: 'set11b', test: `${BASE}/公式TOEIC® Listening & Reading 問題集 11/公式TOEIC 11TEST2.pdf`, ans: `${BASE}/公式TOEIC® Listening & Reading 問題集 11/公式11-TEST2详细解答.pdf` },
  { id: 'set12', test: `${BASE}/公式TOEIC® Listening & Reading 問題集 12/托业问题集12-试题.pdf`, ans: `${BASE}/公式TOEIC® Listening & Reading 問題集 12/问题集12-解析.pdf` },
];

(async () => {
  const prog = loadProg();
  const only = process.argv[2] || '';

  for (const set of SETS) {
    if (only && set.id !== only) continue;
    if (prog.done.includes(set.id)) { console.log(`SKIP ${set.id}`); continue; }
    if (!fs.existsSync(set.test)) { console.log(`MISS ${set.id}`); continue; }

    console.log(`\n===== ${set.id} =====`);
    try {
      console.log('1/5 detect...');
      const imgs = await toImages(set.test, 40, 300, 1.0);
      const det = await detectReading(imgs);
      if (!det.length) { console.log('No Part6/7'); continue; }

      console.log('2/5 extract questions...');
      const groups = await extractGroups(det, imgs);
      const qc = groups.reduce((s, g) => s + (g.questions || []).length, 0);
      console.log(`  ${groups.length} groups, ${qc} qs`);

      let answers = [];
      const apdf = set.ans || (set.combined ? set.test : null);
      if (apdf) {
        console.log('3/5 extract answers...');
        const as = await findAnsStart(apdf);
        answers = await getAnswers(apdf, as, as + 50);
        console.log(`  ${answers.length} answers`);
      } else { console.log('3/5 no answer PDF, skip'); }

      mergeAns(groups, answers);

      console.log('4/5 translate...');
      await translate(groups);

      const out = path.join(WORK, `${set.id}_reading.json`);
      fs.writeFileSync(out, JSON.stringify(groups, null, 2));
      console.log(`SAVED ${out}`);

      prog.done.push(set.id);
      saveProg(prog);
    } catch (e) { console.error(`ERROR ${set.id}: ${e.message}`); }
  }

  console.log('\n===== MERGE =====');
  const all = [];
  for (const set of SETS) {
    const f = path.join(WORK, `${set.id}_reading.json`);
    if (fs.existsSync(f)) {
      const d = JSON.parse(fs.readFileSync(f, 'utf8'));
      for (const g of d) { g.source = set.id; all.push(g); }
    }
  }
  const finalOut = path.join(WORK, 'all_reading.json');
  fs.writeFileSync(finalOut, JSON.stringify(all, null, 2));
  const totalQ = all.reduce((s, g) => s + (g.questions || []).length, 0);
  console.log(`FINAL: ${all.length} groups, ${totalQ} questions -> ${finalOut}`);
})();
