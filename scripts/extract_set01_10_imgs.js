const fs=require('fs'),{pdf}=require('pdf-to-img');
const BASE='公式TOEIC问题集1-12/公式TOEIC问题集1-12';

const TASKS=[
  {set:1,files:[{p:`${BASE}/公式TOEIC® Listening & Reading 問題集 1/公式TOEIC® Listening & Reading 問題集 1(压缩).pdf`,d:'/tmp/opencode/set1_combined',pre:'pg'}]},
  {set:2,files:[
    {p:`${BASE}/公式TOEIC® Listening & Reading 問題集 2/问题集2 题目.pdf`,d:'/tmp/opencode/set2_q',pre:'q'},
    {p:`${BASE}/公式TOEIC® Listening & Reading 問題集 2/问题集2 解析.pdf`,d:'/tmp/opencode/set2_a',pre:'ans'}
  ]},
  {set:3,files:[{p:`${BASE}/公式TOEIC® Listening & Reading 問題集 3/公式TOEIC® Listening & Reading 問題集 3.pdf`,d:'/tmp/opencode/set3_combined',pre:'pg'}]},
  {set:4,files:[{p:`${BASE}/公式TOEIC® Listening & Reading 問題集 4/公式TOEIC® Listening & Reading 問題集 4.pdf`,d:'/tmp/opencode/set4_combined',pre:'pg'}]},
  {set:5,files:[{p:`${BASE}/公式TOEIC® Listening & Reading 問題集 5/公式TOEIC® Listening & Reading 問題集 5.pdf`,d:'/tmp/opencode/set5_combined',pre:'pg'}]},
  {set:6,files:[{p:`${BASE}/公式TOEIC® Listening & Reading 問題集 6/TOEIC6公式試験.pdf`,d:'/tmp/opencode/set6_combined',pre:'pg'}]},
  {set:7,files:[{p:`${BASE}/公式TOEIC® Listening & Reading 問題集 7/公式TOEIC Listening & Reading 問題集 7（手机扫描版-清晰但文件较大））.pdf`,d:'/tmp/opencode/set7_combined',pre:'pg'}]},
  {set:8,files:[
    {p:`${BASE}/公式TOEIC® Listening & Reading 問題集 8/托业公式8（试题部分）.pdf`,d:'/tmp/opencode/set8_q',pre:'q'},
    {p:`${BASE}/公式TOEIC® Listening & Reading 問題集 8/托业公式8（解答部分）.pdf`,d:'/tmp/opencode/set8_a',pre:'ans'}
  ]},
  {set:9,files:[
    {p:`${BASE}/公式TOEIC® Listening & Reading 問題集 9/公式TOEIC® Listening & Reading 問題集 9.pdf`,d:'/tmp/opencode/set9_q',pre:'q'},
    {p:`${BASE}/公式TOEIC® Listening & Reading 問題集 9/公式集9 解析.pdf`,d:'/tmp/opencode/set9_a',pre:'ans'}
  ]},
  {set:10,files:[
    {p:`${BASE}/公式TOEIC® Listening & Reading 問題集 10/问题集10 试题部分.pdf`,d:'/tmp/opencode/set10_q',pre:'q'},
    {p:`${BASE}/公式TOEIC® Listening & Reading 問題集 10/问题集10 解析部分.pdf`,d:'/tmp/opencode/set10_a',pre:'ans'}
  ]},
];

(async()=>{
  const s=parseInt(process.argv[2]||'1');
  const e=parseInt(process.argv[3]||'10');
  for(const t of TASKS){
    if(t.set<s||t.set>e) continue;
    for(const f of t.files){
      console.log(`Set${t.set}: ${f.d}`);
      fs.mkdirSync(f.d,{recursive:true});
      try{
        const doc=await pdf(f.p,{scale:1.0});
        let i=0,cached=0;
        for await(const img of doc){
          i++;
          const fp=`${f.d}/${f.pre}_${i}.png`;
          if(fs.existsSync(fp)){cached++;continue}
          fs.writeFileSync(fp,img);
          if(i%20===0) process.stdout.write(`  page ${i}\n`);
        }
        console.log(`  done: ${i} pages (${cached} cached)`);
      }catch(e){console.error(`  ERROR: ${e.message}`)}
    }
  }
  console.log('All done!');
})();
