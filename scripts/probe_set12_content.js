const fs=require('fs'), {pdf}=require('pdf-to-img');
(async()=>{
  // Sample pages 1, 40, 80 to identify structure
  const path='公式TOEIC问题集1-12/公式TOEIC问题集1-12/公式TOEIC® Listening & Reading 問題集 12/托业问题集12-试题.pdf';
  const doc=await pdf(path,{scale:0.7});
  const W='/tmp/opencode/probe12';
  fs.mkdirSync(W,{recursive:true});
  const sample=[1,5,10,20,30,40,50,60,70,80,83];
  let i=0;
  for await(const img of doc){
    i++;
    if(sample.includes(i)){
      fs.writeFileSync(`${W}/p${String(i).padStart(3,'0')}.png`,img);
      console.log('saved p',i);
    }
    if(i>83)break;
  }
})();
