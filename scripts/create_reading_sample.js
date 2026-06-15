const fs = require('fs');
const groups = [
  {
    groupId: 'sample_part6_001',
    part: 'Part6',
    source: 'sample',
    sourcePages: [],
    passageTitle: 'Office Relocation Notice',
    passageText: 'Dear employees,\n\nWe are pleased to announce that our accounting department will move to the newly renovated fifth floor next Monday. The new space has larger meeting rooms and improved lighting. All staff members are asked to pack their personal items by Friday afternoon. Moving boxes will be distributed tomorrow morning. If you need assistance, please contact Facilities Manager Ellen Park.\n\nThank you for your cooperation.',
    documents: [],
    questions: [
      { number: 131, questionText: 'What is the purpose of the notice?', options: ['To announce a department move', 'To request budget approval', 'To introduce new employees', 'To cancel a meeting'], correctAnswer: 'A', correctIndex: 0, explanationCn: '通知说明会计部门将搬到翻新的五楼，因此目的在于宣布部门搬迁。', explanationJa: '', summaryTip: 'Part6先看开头和目的句。' },
      { number: 132, questionText: 'When should staff finish packing personal items?', options: ['Monday morning', 'Tomorrow morning', 'Friday afternoon', 'Next month'], correctAnswer: 'C', correctIndex: 2, explanationCn: '文中说personal items要在Friday afternoon前打包好。', explanationJa: '', summaryTip: '时间信息题要定位日期/星期。' },
      { number: 133, questionText: 'Who should employees contact for help?', options: ['The accounting director', 'Ellen Park', 'The building owner', 'A new employee'], correctAnswer: 'B', correctIndex: 1, explanationCn: '文中说如需帮助联系Facilities Manager Ellen Park。', explanationJa: '', summaryTip: '人物定位题注意职位+姓名。' },
      { number: 134, questionText: 'What will be distributed tomorrow morning?', options: ['Office keys', 'Moving boxes', 'Meeting schedules', 'Lighting equipment'], correctAnswer: 'B', correctIndex: 1, explanationCn: '文中明确Moving boxes will be distributed tomorrow morning。', explanationJa: '', summaryTip: '物品题直接定位名词。' }
    ]
  },
  {
    groupId: 'sample_part7_001',
    part: 'Part7',
    source: 'sample',
    sourcePages: [],
    passageTitle: 'Time Wise Payroll Software',
    passageText: 'Time Wise Payroll Software\n\nElevate your small business with Time Wise, the all-in-one time sheet and payroll management system. Tailored for small businesses and designed to simplify your workflow, the app provides automated payroll processing and customizable reports.\n\nE-mail\nDear Mr. Klossner,\nThank you for signing up for Time Wise. We apologize that your introduction to our platform has not been as smooth as we had hoped. As a gesture of appreciation, we will apply our anniversary special to your company for an additional six months.',
    documents: [],
    questions: [
      { number: 191, questionText: 'What does the advertisement suggest about Time Wise?', options: ['It is the newest payroll system on the market.', 'It is the world’s highest-rated payroll system.', 'It is available in versions for both small and large companies.', 'It is easy to use.'], correctAnswer: 'D', correctIndex: 3, explanationCn: '广告中说designed to simplify your workflow，并强调user-friendly interface，说明容易使用。', explanationJa: '', summaryTip: '广告题注意形容词和卖点。' },
      { number: 194, questionText: 'What does Ms. Haagsma offer to do for Mr. Klossner?', options: ['Reduce his monthly charges for a limited time', 'Ask a technician to check his database', 'Offer a free training session to his team', 'Arrange for him to receive a refund'], correctAnswer: 'A', correctIndex: 0, explanationCn: '邮件说will apply our anniversary special ... for an additional six months，对应限时降低费用。', explanationJa: '', summaryTip: '多篇文章题要跨文档对应优惠信息。' }
    ]
  }
];
fs.writeFileSync('reading_bank_sample.json', JSON.stringify(groups, null, 2));
