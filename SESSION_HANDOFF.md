# Session Handoff - 2026-05-24

## 已推送到 GitHub 的提交

- `79fdb36 feat: add PPT600 question bank`
  - 新增 `question_bank_ppt600.dat`
  - 新增 `ToeicPart5PPTData/*.pptx`
  - 新增 `toeic_questions_data.json`
  - `practice_coach.html` 初步支持原题库 / PPT600 / AI 切换
- `dd86452 fix: expose PPT600 bank switcher`
  - 刷题页顶部直接显示题库切换：原题库、PPT600题库、AI生成
  - `sw.js` 升级到 `eng-pwa-v3`，改为网络优先，避免旧缓存继续显示旧题库
  - `manifest.json` 改成相对路径，适配 GitHub Pages 子路径

## 已确认事实

- 当前远端 `question_bank.dat` 解密后是 220 题。
- 当前远端 `question_bank_ppt600.dat` 解密后是 600 题。
- 用户反馈之前页面显示 219/220 题，原因很可能是旧缓存或默认选择原题库。
- `dd86452` 后刷题页已有明显的题库切换入口。

## 当前未完成问题

1. 导航栏风格仍需统一：目标是所有页面的 header/bottom nav 按 `question_bank.html` 的尺寸风格统一。
2. PPT600 解析质量不达标：字段格式和数量可以校验，但解析内容偏模板化。
3. PPT600 分类必须限制在以下考点内，最多 20 类：
   - 词性判断
   - 动词时态
   - 非谓语动词
   - 介词搭配
   - 虚拟语气
   - 倒装结构
   - 独立主格
   - 词汇搭配
   - 代词指代
   - 比较级
   - 词汇辨析
   - 定语从句
   - 连词辨析
   - 情态动词
   - 主谓一致
   - 名词单复数
   - 平行结构
   - 数量词辨析

## 重要警告

本机当前工作区有未提交改动，其中包含一次未完成的实验：

- 新增 `css/common_nav.css`
- 修改 6 个 HTML 引入公共导航 CSS
- 重新生成过 `question_bank_ppt600.dat`
- 将 `sw.js` 临时改到 `eng-pwa-v4`
- 修改了 `AGENTS.md`

这些改动**尚未提交，也不应直接信任**。尤其是重新生成的 PPT600 解析，随机抽样发现质量仍然不达标：

- 示例：`ppt600_312`
- 题目：`Ovonel Skincare has published ------- testimonials on several social media sites.`
- 正确答案：`consumer`
- 当前实验版错误分类为 `比较级`，实际应更接近 `词性判断` / `词汇搭配`
- 说明当前批量规则/模板生成方式不可靠，需要重新做。

如果换设备继续，建议从远端最新提交 `dd86452` 或本文件之后的 handoff commit 开始，不要依赖当前设备未提交的实验改动。

## 明天建议工作流

1. `git pull` 到最新远端。
2. 先修导航栏：可以新建并提交 `css/common_nav.css`，所有 HTML 页面引用它；确保不改变业务逻辑。
3. 重新处理 PPT600 解析质量：
   - 保留题干、选项、答案。
   - 逐题重新判断 category。
   - 按 `toeic_questions_data.json` 的风格写 `options_cn`、`translation`、`keywords`、`solutionSteps`、`wrongOptionAnalysis`、`summaryTip`。
   - 不要用泛化句式，如“结合题句理解”“用于判断空格处...”等。
4. 每次生成后必须校验：
   - 总数正好 600
   - category 只来自允许列表
   - category 种类不超过 20
   - 每题 4 个 options、4 个 options_cn、4 个 wrongOptionAnalysis
   - correctAnswer 与 correctIndex 一致
   - solutionSteps 有分步编号和换行
5. 重新加密生成 `question_bank_ppt600.dat`。
6. 提交并 push。

## 可用校验脚本片段

```bash
python3 - <<'PY'
import base64,json,collections
KEY=b'EngLearn2026XX'
raw=base64.b64decode(open('question_bank_ppt600.dat','rb').read())
data=json.loads(bytes(b ^ KEY[i%len(KEY)] for i,b in enumerate(raw)).decode())
print('count', len(data))
print('categories', len(collections.Counter(q.get('category','') for q in data)))
print(collections.Counter(q.get('category','') for q in data).most_common())
assert len(data)==600
assert all(q['correctAnswer']=='ABCD'[q['correctIndex']] for q in data)
assert all(len(q['options'])==4 and len(q['options_cn'])==4 and len(q['wrongOptionAnalysis'])==4 for q in data)
PY
```

## 用户最新判断

用户要求先抽样对比质量。抽样结果显示：PPT600 当前解析质量不达标，需要重做，不应直接继续使用实验版解析。
