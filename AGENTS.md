# AGENTS.md

## Project Overview

TOEIC study app — pure frontend (HTML/CSS/JS), no build tools. All data stored browser-side (localStorage + IndexedDB). Runs via a simple Python HTTP server.

## Dev Server

```bash
python local_test.py
```

Auto-picks port from 8000→8080→3000→5000→9000. No npm/node required.

## Architecture

5 HTML pages, all self-contained (CSS + JS inline, no external files except JSON data):

| File | Purpose |
|------|---------|
| `index.html` | Landing page with nav cards to all modules |
| `vocabulary_app.html` | Flashcard vocab learning (localStorage) |
| `practice_coach.html` | Quiz + exam mode (IndexedDB, largest file ~2700 lines) |
| `vocab_story.html` | Story-based vocab (largest file ~3300 lines, inlined data) |
| `question_batch_generator.html` | Batch AI question generation |

Data files: `word_database.json` (vocab), `toeic_questions_sample.json` (question bank).

## Key Patterns

- **Navigation**: Every page has `header-nav` (5 links: 主页/单词/刷题/故事/批量生成) and `bottom-nav`. When adding a new page, update nav in ALL existing HTML files.
- **Fetch cache-busting**: All `fetch('*.json')` calls use `?t=' + Date.now()` to avoid browser caching stale data.
- **IndexedDB**: DB name `ToeicTrainerDB_final`, version **2**. Stores: `records`, `metadata`, `exam_history`. If adding a new object store, increment the version in `openDB()`.
- **API**: Volcano Engine ARK API, model `ep-20260505172500-db99v`. Default key stored in JS as `DEFAULT_API_KEY`. API calls go to `https://ark.cn-beijing.volces.com/api/v3/responses`.
- **Exam mode**: Questions pulled from local question bank (not AI). 30 questions, 10 min timer. Uses `examQuestions.length` (not hardcoded `EXAM_QUESTION_COUNT`) for display since bank may have fewer than 30.

## Git

- Remote: `git@github.com:aiwolflow666/APPDemo.git` (SSH, private repo)
- Branch: `main`
- User: `aiwolflow666` / `1366901050@qq.com`
- SSH key: ed25519 at `~/.ssh/id_ed25519` (on Windows: `C:\Users\OseasyVM\.ssh\id_ed25519`)
- WSL push requires copying key and setting permissions: `cp /mnt/c/Users/OseasyVM/.ssh/id_ed25519 ~/.ssh/ && chmod 600 ~/.ssh/id_ed25519`

## Gotchas

- **Windows GBK encoding**: Python print with emoji/Chinese characters fails on Windows console. Use ASCII-only output in Python scripts.
- **Chinese filenames**: Avoid — caused git and cross-platform issues. All filenames should be English.
- **Style consistency**: All pages share the same header gradient (`#2563eb → #1d4ed8`), nav styles, `#app` container, and `fadeIn` animation. When adding styles, check at least 2 other pages for reference.
- **Data backup**: Settings page has export/import buttons — backup JSON includes records, exam history, vocab progress, and API key.
