const {pdf}=require('pdf-to-img');
(async()=>{
  const ps=[
    {n:'T1试题',p:'公式TOEIC问题集1-12/公式TOEIC问题集1-12/公式TOEIC® Listening & Reading 問題集 11/公式TOEIC11-TEST1.pdf'},
    {n:'T1解析',p:'公式TOEIC问题集1-12/公式TOEIC问题集1-12/公式TOEIC® Listening & Reading 問題集 11/公式11-TEST1详细解答.pdf'},
    {n:'T2试题',p:'公式TOEIC问题集1-12/公式TOEIC问题集1-12/公式TOEIC® Listening & Reading 問題集 11/公式TOEIC 11TEST2.pdf'},
    {n:'T2解析',p:'公式TOEIC问题集1-12/公式TOEIC问题集1-12/公式TOEIC® Listening & Reading 問題集 11/公式11-TEST2详细解答.pdf'},
  ];
  for(const x of ps){
    const doc=await pdf(x.p,{scale:0.4});
    let i=0; for await(const _ of doc) i++;
    console.log(x.n, 'pages:', i);
  }
})();
