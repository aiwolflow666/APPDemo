const fs=require('fs'), path=require('path'), {pdf}=require('pdf-to-img');
const cfg=JSON.parse(fs.readFileSync(`${process.env.HOME}/.config/opencode/opencode.jsonc`,'utf8'));
const prov=cfg.provider['volcengine-plan'];
const AK=prov.options.apiKey;
const URL=prov.options.baseURL.replace(/\/$/,'')+'/chat/completions';
const MD='ark-code-latest';
const W='/tmp/opencode/set12_pipe';
fs.mkdirSync(W,{recursive:true});

async function cv(msg){for(let a=1;a<=3;a++){try{const r=await fetch(URL,{method:'POST',headers:{Authorization:`Bearer ${AK}`,'Content-Type':'application/json'},body:JSON.stringify({model:MD,stream:false,temperature:0,messages:msg})});if(!r.ok)throw new Error(r.status);const d=await r.json();return d.choices?.[0]?.message?.content||'';}catch(e){if(a===3)throw e;await new Promise(r=>setTimeout(r,3000*a));}}}
function xj(t){const c=t.trim().replace(/^```json\s*/i,'').replace(/```$/i,'').trim();const m=c.match(/\[[\s\S]*\]|\{[\s\S]*\}/);if(!m)throw new Error('NoJSON');return JSON.parse(m[0]);}
function b64(f){return fs.readFileSync(f).toString('base64');}

(async()=>{
  const groups=JSON.parse(fs.readFileSync('/tmp/opencode/p12_reading_raw_v2.json','utf8'));
  const qc=groups.reduce((s,g)=>s+(g.questions||[]).length,0);
  console.log(`Loaded ${groups.length} groups, ${qc} questions`);

  console.log('Extracting answers...');
  const ansPdf='公式TOEIC问题集1-12/公式TOEIC问题集1-12/公式TOEIC® Listening & Reading 問題集 12/问题集12-解析.pdf';
  const doc=await pdf(ansPdf,{scale:1.0});
  const ansPages=[];let pi=0;
  for await(const img of doc){pi++;if(pi>=150&&pi<=195){const f=`${W}/ans_${pi}.png`;fs.writeFileSync(f,img);ansPages.push({page:pi,file:f});}}

  const answers=[];const ansFile=`${W}/answers_progress.json`;
  for(let i=0;i<ansPages.length;i+=2){
    const b=ansPages.slice(i,i+2);
    const content=[{type:'text',text:'提取Part6/7(题号131-200)答案和日文解析。返回JSON数组：[{"number":131,"correctAnswer":"A","explanationJa":"日文"}]。没有返回[]。'},...b.flatMap(x=>[{type:'text',text:`P${x.page}`},{type:'image_url',image_url:{url:`data:image/png;base64,${b64(x.file)}`}}])];
    try{const raw=await cv([{role:'user',content}]);const arr=xj(raw);answers.push(...arr);fs.writeFileSync(ansFile,JSON.stringify(answers,null,2));console.log(`p${b[0].page}: +${arr.length} total=${answers.length}`);}
    catch(e){console.error(`FAIL p${b[0].page}: ${e.message}`);}
  }
  console.log(`Answers: ${answers.length}`);

  const am=new Map(answers.map(a=>[Number(a.number),a]));
  for(const g of groups)for(const q of(g.questions||[])){
    const a=am.get(Number(q.number));
    if(a){q.correctAnswer=a.correctAnswer||'';q.correctIndex=q.correctAnswer?'ABCD'.indexOf(q.correctAnswer):null;q.explanationJa=a.explanationJa||'';}
  }
  const withAns=groups.reduce((s,g)=>s+(g.questions||[]).filter(q=>q.correctAnswer).length,0);
  console.log(`With answers: ${withAns}/${qc}`);

  console.log('Translating...');
  for(let i=0;i<groups.length;i+=5){
    const chunk=groups.slice(i,i+5);
    try{
      const content=[{type:'text',text:'翻译TOEIC题组JSON中日文explanationJa为中文explanationCn，每题加summaryTip。保留所有原字段。返回JSON数组。\n'+JSON.stringify(chunk)}];
      const raw=await cv([{role:'user',content}]);
      const t=xj(raw);
      for(let j=0;j<t.length&&i+j<groups.length;j++)groups[i+j]=t[j];
      console.log(`trans ${i}-${i+chunk.length-1}`);
    }catch(e){console.error(`trans FAIL ${i}: ${e.message}`);}
  }

  const outFile=`${W}/set12_reading_final.json`;
  for(const g of groups)g.source='set12';
  fs.writeFileSync(outFile,JSON.stringify(groups,null,2));
  console.log(`DONE: ${groups.length} groups -> ${outFile}`);

  const KEY=Buffer.from('EngLearn2026XX');
  const jsonStr=JSON.stringify(groups);
  const bytes=Buffer.from(jsonStr,'utf8');
  const enc=Buffer.alloc(bytes.length);
  for(let i=0;i<bytes.length;i++)enc[i]=bytes[i]^KEY[i%KEY.length];
  fs.writeFileSync('reading_bank.dat',enc.toString('base64'));
  console.log('Encrypted -> reading_bank.dat');
})();
