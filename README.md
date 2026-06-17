# 托业学习助手

一站式托业(TOEIC)英语学习平台，纯前端实现，数据存储在本地浏览器，支持电脑和手机访问。

**在线访问**：https://aiwolflow666.github.io/APPDemo/

## 功能概览

### 1. 单词记忆 (`vocabulary_app.html`)

- **词库导入**：支持上传自定义 JSON 词库文件，也可一键加载内置示例数据
- **卡片翻转**：正面显示单词和词性，点击翻转查看中文释义、近义词、反义词、用法、例句等
- **学习标记**：对每个单词标记「认识」「不认识」「收藏」，数据持久化到 localStorage
- **筛选模式**：只看认识 / 只看不认识 / 只看收藏 / 全部显示
- **搜索功能**：按单词、释义、词性实时模糊搜索
- **学习进度**：顶部进度条显示当前学习位置和已认识数量
- **内置词库**：`word_database.dat` 包含 1000+ 托业核心词汇（XOR 加密）

### 2. 题库练习与模拟考试 (`practice_coach.html`)

- **Part 5 语法词汇**：单题模式，支持 AI 实时出题和本地题库
- **Part 6/7 阅读题组**：按文章分组刷题（Part6 每组 4 题填空，Part7 每组 2-5 题阅读理解），支持单篇/双篇/三篇
- **模拟考试**：从本地题库随机抽题，限时作答，交卷后查看正确率、分类统计、成绩趋势
- **多维度解析**：每题提供正确答案、中文解析（语法分析、选项排除、考点要点）、文章中文翻译、核心词汇表
- **学习统计**：总练习数、正确率、错题数，记录持久化到 IndexedDB
- **错题回顾**：按全部/仅错题/仅正确筛选，点击展开详细解析

### 3. 词汇故事 (`vocab_story.html`)

- **故事串联**：通过 5 篇关联文章串联托业高频词汇，覆盖商务、职场、法律、科技、日常生活等场景
- **点击查词**：文章中高亮词汇可点击查看详细释义、词性、近义词/反义词
- **内置词库**：包含 1042 个托业核心词汇
- **搜索功能**：顶部搜索栏可快速查找单词

### 4. SQLite 题库管理 (`question_bank.html`)

- 基于 sql.js（WebAssembly）在浏览器中运行 SQLite 数据库
- 支持 SQL 查询、导入/导出题库
- 题库数据持久化到 IndexedDB

### 5. 批量题目生成器 (`question_batch_generator.html`)

- 批量生成托业 Part 5 题目并保存到本地题库
- 支持选择生成数量和难度
- 生成的题目可直接在刷题和考试中使用

### 6. 阅读题预览 (`reading_preview.html`)

- 预览已提取的 Part 6/7 阅读题组数据
- 支持**手机/PC 双模式切换**（右上角按钮切换）
- 按套题筛选（公式11、公式12、…），左侧题组列表，右侧展示文章原文、中文翻译、词汇表、题目选项和解析
- 数据来源：12 套官方公式問題集（每套 2 卷 × 70 题 = 140 题，共 1680 题目标标）

## 技术栈

- 纯 HTML + CSS + JavaScript，无需构建工具
- **数据存储**：localStorage（单词进度）+ IndexedDB（练习记录、考试历史、SQLite 题库）
- **AI 功能**：火山引擎 ARK API（用户自行配置 API Key）
- **SQLite WASM**：sql.js 实现浏览器端 SQL 题库
- **PWA**：Service Worker 离线缓存 + Manifest 可安装到手机桌面
- **移动端**：Capacitor 封装为原生 App（`capacitor.config.json`）
- **数据加密**：`.dat` 文件使用 XOR 加密（密钥内置于 `js/data_decrypt.js`）

## 文件结构

```
├── index.html                    # 统一入口页面
├── vocabulary_app.html           # 单词记忆应用
├── practice_coach.html           # 题库练习 + 模拟考试（Part 5/6/7）
├── vocab_story.html              # 词汇故事应用
├── question_bank.html            # SQLite 题库管理
├── question_batch_generator.html # 批量 AI 题目生成器
├── reading_preview.html          # Part 6/7 阅读题预览（手机/PC 双模式）
├── set12_preview.html            # 公式12 预览页（旧版）
├── word_database.dat             # 加密托业核心词库（1000+ 单词）
├── question_bank.dat             # 加密原始题库
├── question_bank_ppt600.dat      # 加密 PPT600 题库
├── reading_bank.dat              # 加密 Part 6/7 阅读题库
├── set11_preview.json            # 公式11 阅读题数据（140 题，明文预览用）
├── set12_preview.json            # 公式12 阅读题数据（140 题，明文预览用）
├── js/                           # 共享 JS 模块
│   ├── data_decrypt.js           # XOR 解密工具（fetchAndDecrypt）
│   ├── db.js                     # SQLite 封装（window.ToeicDB）
│   └── sql-wasm.js + .wasm       # sql.js 运行时
├── sw.js                         # Service Worker（PWA 离线缓存）
├── manifest.json                 # PWA Manifest
├── capacitor.config.json         # Capacitor 原生封装配置
├── local_test.py                 # 启动本地服务器
└── README.md
```

## 快速开始

### 方式一：在线访问（推荐）

直接打开 https://aiwolflow666.github.io/APPDemo/ ，无需安装任何环境。

> 手机可点击浏览器菜单「添加到主屏幕」，作为 PWA 应用安装。

### 方式二：本地运行

```bash
python local_test.py
```

启动后会显示访问地址（自动选择空闲端口 8000→8080→3000→5000→9000）：

- **电脑**：浏览器打开 `http://localhost:8000/index.html`
- **手机**：确保手机和电脑同一 Wi-Fi，手机访问 `http://[电脑IP]:8000/index.html`
  - 查看 IP：Windows 运行 `ipconfig`，找到 IPv4 地址

### 方式三：封装为手机 App

项目已配置 Capacitor，可封装为 iOS/Android 原生应用：

```bash
npm install
npx cap add android
npx cap copy
npx cap open android
```

## 使用教程

### 单词记忆

1. 进入「单词」页面，首次使用点击「加载示例数据」导入内置词库，或上传自己的 JSON 词库
2. 点击卡片翻转查看释义，标记「认识」「不认识」「收藏」
3. 使用筛选模式复习：只看不认识 / 只看收藏等
4. 顶部搜索栏可实时搜索

### 题库练习

1. 进入「考试」页面，默认进入练习模式
2. **Part 5**：单题语法/词汇选择题，选择答案后提交查看解析
3. **Part 6/7**：阅读题组模式，先读文章再答题，每组提交后查看完整解析（含文章翻译+词汇表）
4. 底部「记录」页查看历史做题记录，支持错题筛选

### 模拟考试

1. 进入「考试」页面，切换到考试模式
2. 从本地题库随机抽取 30 题，10 分钟倒计时
3. 可点击题目序号跳转答题
4. 交卷后查看：正确率、分类统计、成绩趋势图、AI 考后分析（需配置 API Key）

### 阅读题预览

1. 打开 `reading_preview.html`
2. 顶部选择套题（公式11/公式12/全部），左侧选择题组
3. 右侧查看：文章原文 + 中文翻译 + 词汇表 + 题目选项（正确答案高亮）+ 详细解析
4. 右上角「手机模式」按钮可切换手机/PC 布局

## API Key 配置

AI 出题和 AI 考后分析功能需要火山引擎 ARK API Key：

1. 打开「考试」页面 → 右上角设置图标
2. 在 API Key 输入框填入你的 Key
3. 点击保存

> 单词记忆、词汇故事、模拟考试（题库出题）、阅读题预览均无需 API Key。

## 词库 JSON 格式

```json
[
  {
    "word": "increase",
    "pos": ["名", "动"],
    "meaning": "增加",
    "synonyms": ["surge激增"],
    "antonyms": ["decrease"],
    "usage": "be expected to do",
    "notes": "考试高频词",
    "related": "相关词",
    "examples": ["例句1"]
  }
]
```

其中 `word`、`pos`、`meaning` 为必填字段，其余可选。

## 数据说明

| 文件 | 说明 | 加密 |
|------|------|------|
| `word_database.dat` | 1000+ 托业核心词汇 | XOR |
| `question_bank.dat` | 原始题库 | XOR |
| `question_bank_ppt600.dat` | PPT600 题库 | XOR |
| `reading_bank.dat` | Part 6/7 阅读题库（持续扩充中） | XOR |
| `set11_preview.json` | 公式11 阅读题明文数据（预览用） | 无 |
| `set12_preview.json` | 公式12 阅读题明文数据（预览用） | 无 |

阅读题库数据来自 12 套官方「公式TOEIC Listening & Reading 問題集」，每套含 TEST1 + TEST2 两卷，每卷 70 题（Part 6 = 16 题 + Part 7 = 54 题），总计目标 1680 题。

## 许可证

仅供学习使用
