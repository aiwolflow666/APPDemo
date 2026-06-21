const fs=require('fs'), {pdf}=require('pdf-to-img');
(async()=>{
  // TEST1 题目: 页2-40, Part6/7约在页20-40
  const qPdf='公式TOEIC问题集1-12/公式TOEIC问题集1-12/公式TOEIC® Listening & Reading 問題集 12/托业问题集12-试题.pdf';
  const W='/tmp/opencode/set12_test1_q';
  fs.mkdirSync(W,{recursive:true});
  const doc=await pdf(qPdf,{scale:1.0});
  let pi=0;
  for await(const img of doc){
    pi++;
    if(pi>=15&&pi<=40){
      const f=`${W}/q_${pi}.png`;
      fs.writeFileSync(f,img);
      if(pi%10===0||pi===15||pi===40) console.log('saved p',pi);
    }
    if(pi>40)break;
  }
  console.log('done');
})();
