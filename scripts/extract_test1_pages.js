const fs=require('fs'), {pdf}=require('pdf-to-img');
(async()=>{
  const ansPdf='公式TOEIC问题集1-12/公式TOEIC问题集1-12/公式TOEIC® Listening & Reading 問題集 12/问题集12-解析.pdf';
  const W='/tmp/opencode/set12_test1_ans';
  fs.mkdirSync(W,{recursive:true});
  const doc=await pdf(ansPdf,{scale:1.0});
  let pi=0;
  for await(const img of doc){
    pi++;
    if(pi>=54&&pi<=103){
      const f=`${W}/ans_${pi}.png`;
      fs.writeFileSync(f,img);
      if(pi%10===0||pi===54||pi===103) console.log('saved p',pi);
    }
    if(pi>103)break;
  }
  console.log('done');
})();
