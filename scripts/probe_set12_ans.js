const fs=require('fs'), {pdf}=require('pdf-to-img');
(async()=>{
  const path='公式TOEIC问题集1-12/公式TOEIC问题集1-12/公式TOEIC® Listening & Reading 問題集 12/问题集12-解析.pdf';
  const doc=await pdf(path,{scale:0.7});
  const W='/tmp/opencode/probe12_ans';
  fs.mkdirSync(W,{recursive:true});
  const sample=[1,20,50,80,100,130,150,180,200];
  let i=0;
  for await(const img of doc){
    i++;
    if(sample.includes(i)){
      fs.writeFileSync(`${W}/p${String(i).padStart(3,'0')}.png`,img);
      console.log('saved p',i);
    }
    if(i>200)break;
  }
})();
