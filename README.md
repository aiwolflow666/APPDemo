# 托业学习助手

一站式托业(TOEIC)英语学习平台，纯前端实现，数据存储在本地浏览器，支持电脑和手机访问。

## 功能概览

### 单词记忆 (`vocabulary_app.html`)

- **词库导入**：支持上传自定义 JSON 词库文件，也可一键加载内置示例数据
- **卡片翻转**：正面显示单词和词性，点击翻转查看中文释义、近义词、反义词、用法、例句等
- **学习标记**：对每个单词标记「认识」「不认识」「收藏」，数据持久化到 localStorage
- **筛选模式**：只看认识 / 只看不认识 / 只看收藏 / 全部显示
- **搜索功能**：按单词、释义、词性实时模糊搜索
- **学习进度**：顶部进度条显示当前学习位置和已认识数量
- **内置词库**：`word_database.json` 包含 1000+ 托业核心词汇，涵盖名词、动词、形容词、副词等

### 题库练习 (`practice_coach.html`)

- **AI 智能出题**：基于火山引擎大模型 API 实时生成托业 Part 5 语法/词汇单选题
- **本地题库**：支持导入/导出 JSON 格式题库，离线也可刷题
- **题目池机制**：预生成题目池，下一题无需等待 API 调用；后台自动补充，体验流畅
- **智能去重**：通过题干哈希记录已出题目，避免重复
- **多维度解析**：每题提供中文翻译、核心词汇、解题步骤、逐选项分析、考点小结
- **模拟考试**：30 道 Part 5 单选题，限时 25 分钟，计时器 + 题号跳转 + 自动交卷，考后可查看详细解析并将 AI 题目加入本地题库
- **难度选择**：L1 ~ L5 五档难度
- **学习统计**：总练习数、正确率、错题数、按考点类别统计
- **错题回顾**：按全部/仅错题/仅正确筛选，点击展开详细解析
- **题目缓存管理**：一键清除题目哈希缓存，允许重新生成曾出现过的题目

### 批量题目生成器 (`question_batch_generator.html`)

- 批量生成托业 Part 5 题目并保存到本地题库
- 支持选择生成数量和难度
- 生成的题目可直接在题库练习中使用

### 词汇故事 (`TOEIC词汇故事.html`)

- 通过故事语境串联托业核心词汇，加深记忆

### 统一入口 (`index.html`)

- 美观的主页面，一键跳转所有功能模块
- 响应式设计，适配手机和电脑

## 技术栈

- 纯 HTML + CSS + JavaScript，无需构建工具
- 数据存储：localStorage（单词进度）+ IndexedDB（练习记录、题目哈希）
- AI 题目生成：火山引擎 ARK API（模型 `ep-20260505172500-db99v`）
- 单词数据库：本地 JSON 文件，1000+ 托业核心词汇

## 文件结构

```
├── index.html                    # 统一入口页面
├── vocabulary_app.html           # 单词记忆应用
├── practice_coach.html           # 题库练习应用（含模拟考试）
├── question_batch_generator.html # 批量题目生成器
├── TOEIC词汇故事.html             # 词汇故事学习
├── word_database.json            # 托业核心词库（1000+ 单词）
├── toeic_questions_sample.json   # 本地题库样本
├── questions_local.json          # 本地题库
├── local_test.py                 # Python 本地测试脚本
├── simple_test.py                # Python 简化测试脚本
├── quick_test.bat                # Windows 快速启动脚本
└── README.md
```

## 快速开始

1. 启动本地 HTTP 服务器：

```bash
# Python
python -m http.server 8000

# Node.js
npx http-server -p 8000
```

2. 浏览器访问 `http://localhost:8000/index.html`

3. 手机访问：确保手机和电脑在同一 Wi-Fi 下，访问 `http://[电脑IP]:8000/index.html`

## API Key 配置

题库练习和模拟考试的 AI 出题功能需要火山引擎 ARK API Key：

1. 打开题库练习页面，点击底部「设置」
2. 在 API Key 输入框填入你的 ARK_API_KEY
3. 点击保存，即可开始刷题

> 单词记忆功能完全本地运行，无需 API Key。

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

## 许可证

仅供学习使用
