const fs=require('fs'),{pdf}=require('pdf-to-img');
(async()=>{
  const tasks=[
    {n:'t1q', path:'公式TOEIC问题集1-12/公式TOEIC问题集1-12/公式TOEIC® Listening & Reading 問題集 11/公式TOEIC11-TEST1.pdf', dir:'/tmp/opencode/set11_t1q', start:1, end:41, prefix:'q'},
    {n:'t2q', path:'公式TOEIC问题集1-12/公式TOEIC问题集1-12/公式TOEIC® Listening & Reading 問題集 11/公式TOEIC 11TEST2.pdf', dir:'/tmp/opencode/set11_t2q', start:1, end:40, prefix:'q'},
    {n:'t1a', path:'公式TOEIC问题集1-12/公式TOEIC问题集1-12/公式TOEIC® Listening & Reading 問題集 11/公式11-TEST1详细解答.pdf', dir:'/tmp/opencode/set11_t1a', start:1, end:95, prefix:'ans'},
    {n:'t2a', path:'公式TOEIC问题集1-12/公式TOEIC问题集1-12/公式TOEIC® Listening & Reading 問題集 11/公式11-TEST2详细解答.pdf', dir:'/tmp/opencode/set11_t2a', start:1, end:95, prefix:'ans'},
  ];
  for(const t of tasks){
    fs.mkdirSync(t.dir,{recursive:true});
    const doc=await pdf(t.path,{scale:1.0});
    let i=0;
    for await(const img of doc){
      i++;
      if(i>=t.start&&i<=t.end){
        const f=`${t.dir}/${t.prefix}_${i}.png`;
        if(!fs.existsSync(f)) fs.writeFileSync(f,img);
      }
      if(i>t.end) break;
    }
    console.log(t.n,'done',i);
  }
})();
