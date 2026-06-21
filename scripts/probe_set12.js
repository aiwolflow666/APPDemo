const fs=require('fs'), {pdf}=require('pdf-to-img');
(async()=>{
  const pdfs=[
    {name:'试题',path:'公式TOEIC问题集1-12/公式TOEIC问题集1-12/公式TOEIC® Listening & Reading 問題集 12/托业问题集12-试题.pdf'},
    {name:'解析',path:'公式TOEIC问题集1-12/公式TOEIC问题集1-12/公式TOEIC® Listening & Reading 問題集 12/问题集12-解析.pdf'},
  ];
  for(const p of pdfs){
    const doc=await pdf(p.path,{scale:0.4});
    let i=0; for await(const _ of doc){i++;}
    console.log(p.name, 'total pages:', i);
  }
})();
