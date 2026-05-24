# AGENTS.md

## Project Overview

TOEIC study app — pure frontend (HTML/CSS/JS), no build tools. Data stored browser-side (localStorage + IndexedDB + SQLite-via-WASM). Runs via Python HTTP server. PWA-capable (service worker + manifest).

## Dev Server

```bash
python local_test.py
```

Auto-picks port from 8000→8080→3000→5000→9000. No npm/node required.

## Architecture

6 HTML pages. Most are self-contained (CSS + JS inline), but 4 share `js/data_decrypt.js` and `question_bank.html` depends on `js/db.js` + `js/sql-wasm.js`:

| File | Purpose | Storage |
|------|---------|---------|
| `index.html` | Landing page with nav cards | — |
| `vocabulary_app.html` | Flashcard vocab learning | localStorage |
| `practice_coach.html` | Quiz + exam mode (~2800 lines) | IndexedDB `ToeicTrainerDB_final` |
| `vocab_story.html` | Story-based vocab (~3300 lines, inlined data) | — |
| `question_bank.html` | SQLite question bank management | SQLite (sql.js WASM), persisted in IndexedDB `toeic_sqlite_store` |
| `question_batch_generator.html` | Batch AI question generation | — |

Shared JS modules in `js/`:
- `data_decrypt.js` — XOR decrypts `.dat` files (key: `EngLearn2026XX`), used by 4 pages
- `db.js` — SQLite wrapper (`window.ToeicDB`), used only by `question_bank.html`
- `sql-wasm.js` + `.wasm` — sql.js runtime

Data files: `word_database.dat`, `question_bank.dat`, `question_bank_ppt600.dat` (encrypted, replace old `.json` files which are now `.gitignore`d).

## Key Patterns

- **Navigation**: Every page has `header-nav` (6 links: 主页/单词/刷题/故事/题库/AI生成) and `bottom-nav`. When adding a new page, update nav in ALL existing HTML files.
- **Fetch cache-busting**: All `fetch()` calls for data use `?t=' + Date.now()` (built into `DataDecrypt.fetchAndDecrypt`).
- **Two storage systems coexist**: `practice_coach.html` uses raw IndexedDB (`ToeicTrainerDB_final`, version **2**, stores: `records`, `metadata`, `exam_history`). `question_bank.html` uses SQLite via `ToeicDB` (persisted in IndexedDB `toeic_sqlite_store`). If adding a new object store to the old IndexedDB, increment version in `openDB()` inside `practice_coach.html`.
- **Data encryption**: `.dat` files are XOR-encrypted JSON. Key is hardcoded in `js/data_decrypt.js`. To add new encrypted data files, use `DataDecrypt.fetchAndDecrypt('filename.dat')`.
- **API**: Volcano Engine ARK API. Endpoint: `https://ark.cn-beijing.volces.com/api/v3/responses`. Model field is placeholder `"YOUR_MODEL_ENDPOINT"` — users set it at runtime. `DEFAULT_API_KEY` is empty string `''`.
- **Question banks**: `practice_coach.html` can switch between original `question_bank.dat`, `question_bank_ppt600.dat`, and AI generation. Exam mode uses the currently selected local bank.
- **Exam mode**: Questions from selected local question bank (not AI). 30 questions, 10 min timer. Uses `examQuestions.length` (not hardcoded count) for display since bank may have fewer than 30.
- **PWA**: All pages register `sw.js` service worker. Cache name: `eng-pwa-v2`. Manifest at `manifest.json`.

## Mobile (Capacitor)

`capacitor.config.json` + `@capacitor/core` in `package.json` for wrapping as native app. `webDir: "."` (serves from root).

## Git

- Remote: `https://github.com/aiwolflow666/APPDemo.git` (HTTPS)
- Branch: `main`
- WSL push with SSH: copy key and set permissions: `cp /mnt/c/Users/OseasyVM/.ssh/id_ed25519 ~/.ssh/ && chmod 600 ~/.ssh/id_ed25519`

## Gotchas

- **Windows GBK encoding**: Python print with emoji/Chinese characters fails on Windows console. Use ASCII-only output in Python scripts.
- **Chinese filenames**: Avoid — caused git and cross-platform issues. All filenames should be English.
- **Style consistency**: All pages share the same header gradient (`#2563eb → #1d4ed8`), nav styles, `#app` container, and `fadeIn` animation. When adding styles, check at least 2 other pages for reference.
- **Two DB systems**: Don't confuse `ToeicTrainerDB_final` (raw IndexedDB, practice_coach) with `ToeicDB` (SQLite wrapper, question_bank). They are independent.
- **`.json` data files are gitignored**: `word_database.json` and `toeic_questions_sample.json` are in `.gitignore`. Actual data ships as encrypted `.dat` files.
