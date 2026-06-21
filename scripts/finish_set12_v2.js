const fs=require('fs'), path=require('path'), {pdf}=require('pdf-to-img');
const W='/tmp/opencode/set12_pipe';
(async()=>{
  // Extract pages 196-205 (extend range)
  const ansPdf='公式TOEIC问题集1-12/公式TOEIC问题集1-12/公式TOEIC® Listening & Reading 問題集 12/问题集12-解析.pdf';
  const doc=await pdf(ansPdf,{scale:1.0});
  let pi=0;
  for await(const img of doc){
    pi++;
    if(pi>=196&&pi<=210){
      const f=`${W}/ans_${pi}.png`;
      if(!fs.existsSync(f)){
        fs.writeFileSync(f,img);
        console.log('saved',f);
      }
    }
    if(pi>210)break;
  }
  console.log('done extracting extra pages');
})();
