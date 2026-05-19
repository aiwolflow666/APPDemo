(function() {
    'use strict';

    const DB_NAME = 'toeic_study.db';
    let db = null;
    let SQL = null;

    async function init() {
        if (db) return db;
        SQL = await initSqlJs({
            locateFile: file => `js/${file}`
        });
        const saved = localStorage.getItem('toeic_sqlite_db');
        if (saved) {
            const buf = Uint8Array.from(atob(saved), c => c.charCodeAt(0));
            db = new SQL.Database(buf);
        } else {
            db = new SQL.Database();
        }
        createTables();
        return db;
    }

    function createTables() {
        db.run(`
            CREATE TABLE IF NOT EXISTS questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                question_text TEXT NOT NULL,
                options TEXT NOT NULL,
                options_cn TEXT DEFAULT '[]',
                correct_index INTEGER NOT NULL,
                correct_answer TEXT DEFAULT '',
                translation TEXT DEFAULT '',
                keywords TEXT DEFAULT '[]',
                category TEXT DEFAULT '',
                difficulty INTEGER DEFAULT 2,
                solution_steps TEXT DEFAULT '',
                wrong_option_analysis TEXT DEFAULT '[]',
                summary_tip TEXT DEFAULT '',
                source TEXT DEFAULT 'import',
                hash TEXT UNIQUE,
                created_at TEXT DEFAULT (datetime('now'))
            );
        `);
        db.run(`
            CREATE TABLE IF NOT EXISTS records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp INTEGER NOT NULL,
                question_text TEXT NOT NULL,
                options TEXT DEFAULT '[]',
                options_cn TEXT DEFAULT '[]',
                user_answer TEXT DEFAULT '',
                correct_answer TEXT DEFAULT '',
                correct INTEGER DEFAULT 0,
                category TEXT DEFAULT '',
                translation TEXT DEFAULT '',
                keywords TEXT DEFAULT '[]',
                solution_steps TEXT DEFAULT '',
                wrong_option_analysis TEXT DEFAULT '[]',
                summary_tip TEXT DEFAULT '',
                exam_mode INTEGER DEFAULT 0
            );
        `);
        db.run(`
            CREATE TABLE IF NOT EXISTS exam_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp INTEGER NOT NULL,
                total_questions INTEGER NOT NULL,
                correct INTEGER NOT NULL,
                accuracy INTEGER NOT NULL,
                time_spent INTEGER NOT NULL,
                category_stats TEXT DEFAULT '{}'
            );
        `);
        db.run(`
            CREATE TABLE IF NOT EXISTS vocab_progress (
                word TEXT PRIMARY KEY,
                status TEXT DEFAULT '',
                updated_at INTEGER DEFAULT 0
            );
        `);
        db.run(`CREATE INDEX IF NOT EXISTS idx_questions_hash ON questions(hash);`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_records_timestamp ON records(timestamp);`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_records_correct ON records(correct);`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_records_category ON records(category);`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_exam_history_timestamp ON exam_history(timestamp);`);
        save();
    }

    function save() {
        if (!db) return;
        try {
            const data = db.export();
            const buf = String.fromCharCode(...new Uint8Array(data));
            localStorage.setItem('toeic_sqlite_db', btoa(buf));
        } catch (e) {
            console.error('Failed to save SQLite DB:', e);
        }
    }

    function hashText(text) {
        let h = 0;
        for (let i = 0; i < text.length; i++) {
            h = ((h << 5) - h + text.charCodeAt(i)) | 0;
        }
        return h.toString(36);
    }

    // ---- Questions (题库) ----

    function insertQuestion(q) {
        const hash = hashText((q.questionText || '').substring(0, 80).replace(/\s+/g, ' '));
        try {
            db.run(
                `INSERT OR IGNORE INTO questions (question_text, options, options_cn, correct_index, correct_answer, translation, keywords, category, difficulty, solution_steps, wrong_option_analysis, summary_tip, source, hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    q.questionText || '',
                    JSON.stringify(q.options || []),
                    JSON.stringify(q.options_cn || []),
                    q.correctIndex !== undefined ? q.correctIndex : 0,
                    q.correctAnswer || '',
                    q.translation || '',
                    JSON.stringify(q.keywords || []),
                    q.category || '',
                    q.difficulty || 2,
                    q.solutionSteps || '',
                    JSON.stringify(q.wrongOptionAnalysis || []),
                    q.summaryTip || '',
                    q.source || 'import',
                    hash
                ]
            );
            return true;
        } catch (e) {
            return false;
        }
    }

    function importQuestions(questions) {
        let added = 0, skipped = 0;
        db.run('BEGIN TRANSACTION');
        for (const q of questions) {
            const hash = hashText((q.questionText || '').substring(0, 80).replace(/\s+/g, ' '));
            const existing = queryOne('SELECT id FROM questions WHERE hash = ?', [hash]);
            if (existing) { skipped++; continue; }
            insertQuestion(q);
            added++;
        }
        db.run('COMMIT');
        save();
        return { added, skipped, total: questions.length };
    }

    function getAllQuestions() {
        return queryAll('SELECT * FROM questions ORDER BY id DESC');
    }

    function getQuestionCount() {
        const r = queryOne('SELECT COUNT(*) as cnt FROM questions');
        return r ? r.cnt : 0;
    }

    function getQuestionsByCategory() {
        return queryAll('SELECT category, COUNT(*) as cnt, SUM(CASE WHEN difficulty>=4 THEN 1 ELSE 0 END) as hard_count FROM questions GROUP BY category ORDER BY cnt DESC');
    }

    function getRandomQuestions(count) {
        const total = getQuestionCount();
        if (total === 0) return [];
        const limit = Math.min(count, total);
        return queryAll('SELECT * FROM questions ORDER BY RANDOM() LIMIT ?', [limit]);
    }

    function deleteQuestion(id) {
        db.run('DELETE FROM questions WHERE id = ?', [id]);
        save();
    }

    function clearAllQuestions() {
        db.run('DELETE FROM questions');
        save();
    }

    function searchQuestions(keyword) {
        return queryAll('SELECT * FROM questions WHERE question_text LIKE ? OR category LIKE ? ORDER BY id DESC LIMIT 100', [`%${keyword}%`, `%${keyword}%`]);
    }

    // ---- Records (刷题记录) ----

    function insertRecord(r) {
        db.run(
            `INSERT INTO records (timestamp, question_text, options, options_cn, user_answer, correct_answer, correct, category, translation, keywords, solution_steps, wrong_option_analysis, summary_tip, exam_mode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                r.timestamp || Date.now(),
                r.questionText || '',
                JSON.stringify(r.options || []),
                JSON.stringify(r.options_cn || []),
                r.userAnswer || '',
                r.correctAnswer || '',
                r.correct ? 1 : 0,
                r.category || '',
                r.translation || '',
                JSON.stringify(r.keywords || []),
                r.solutionSteps || '',
                JSON.stringify(r.wrongOptionAnalysis || []),
                r.summaryTip || '',
                r.examMode ? 1 : 0
            ]
        );
        save();
    }

    function getAllRecords() {
        return queryAll('SELECT * FROM records ORDER BY timestamp DESC');
    }

    function getRecordStats() {
        const total = queryOne('SELECT COUNT(*) as cnt FROM records');
        const correct = queryOne('SELECT COUNT(*) as cnt FROM records WHERE correct = 1');
        const wrong = queryOne('SELECT COUNT(*) as cnt FROM records WHERE correct = 0');
        const cats = queryAll('SELECT category, COUNT(*) as total, SUM(correct) as correct_cnt FROM records GROUP BY category ORDER BY total DESC');
        return {
            total: total ? total.cnt : 0,
            correct: correct ? correct.cnt : 0,
            wrong: wrong ? wrong.cnt : 0,
            accuracy: (total && total.cnt > 0) ? Math.round(((correct ? correct.cnt : 0) / total.cnt) * 100) : 0,
            categories: cats
        };
    }

    function getWrongRecords() {
        return queryAll('SELECT * FROM records WHERE correct = 0 ORDER BY timestamp DESC');
    }

    function clearAllRecords() {
        db.run('DELETE FROM records');
        save();
    }

    // ---- Exam History (考试记录) ----

    function insertExamHistory(h) {
        db.run(
            `INSERT INTO exam_history (timestamp, total_questions, correct, accuracy, time_spent, category_stats) VALUES (?, ?, ?, ?, ?, ?)`,
            [
                h.timestamp || Date.now(),
                h.totalQuestions,
                h.correct,
                h.accuracy,
                h.timeSpent,
                JSON.stringify(h.categoryStats || {})
            ]
        );
        save();
    }

    function getAllExamHistory() {
        return queryAll('SELECT * FROM exam_history ORDER BY timestamp ASC');
    }

    function clearExamHistory() {
        db.run('DELETE FROM exam_history');
        save();
    }

    // ---- Vocab Progress (单词进度) ----

    function setVocabProgress(word, status) {
        db.run('INSERT OR REPLACE INTO vocab_progress (word, status, updated_at) VALUES (?, ?, ?)', [word, status, Date.now()]);
        save();
    }

    function getVocabProgress(word) {
        const r = queryOne('SELECT status FROM vocab_progress WHERE word = ?', [word]);
        return r ? r.status : null;
    }

    function getAllVocabProgress() {
        return queryAll('SELECT word, status FROM vocab_progress');
    }

    function getVocabStats() {
        const total = queryOne('SELECT COUNT(*) as cnt FROM vocab_progress');
        const known = queryOne("SELECT COUNT(*) as cnt FROM vocab_progress WHERE status = 'know'");
        const dunno = queryOne("SELECT COUNT(*) as cnt FROM vocab_progress WHERE status = 'dunno'");
        const star = queryOne("SELECT COUNT(*) as cnt FROM vocab_progress WHERE status = 'star'");
        return {
            total: total ? total.cnt : 0,
            known: known ? known.cnt : 0,
            dunno: dunno ? dunno.cnt : 0,
            star: star ? star.cnt : 0
        };
    }

    // ---- Query Helpers ----

    function queryAll(sql, params) {
        if (!db) return [];
        try {
            const stmt = db.prepare(sql);
            if (params) stmt.bind(params);
            const results = [];
            while (stmt.step()) results.push(stmt.getAsObject());
            stmt.free();
            return results;
        } catch (e) {
            console.error('queryAll error:', sql, e);
            return [];
        }
    }

    function queryOne(sql, params) {
        const rows = queryAll(sql, params);
        return rows.length > 0 ? rows[0] : null;
    }

    // ---- Export / Import full DB ----

    function exportDB() {
        const data = db.export();
        return new Uint8Array(data);
    }

    function importDB(uint8array) {
        db = new SQL.Database(uint8array);
        save();
    }

    function exportAsJSON() {
        const questions = getAllQuestions();
        const records = getAllRecords();
        const examHistory = getAllExamHistory();
        const vocabProgress = getAllVocabProgress();
        return {
            version: 2,
            exportDate: new Date().toISOString(),
            questions: questions.map(q => ({
                ...q,
                options: JSON.parse(q.options || '[]'),
                options_cn: JSON.parse(q.options_cn || '[]'),
                keywords: JSON.parse(q.keywords || '[]'),
                wrongOptionAnalysis: JSON.parse(q.wrong_option_analysis || '[]')
            })),
            records: records.map(r => ({
                ...r,
                options: JSON.parse(r.options || '[]'),
                options_cn: JSON.parse(r.options_cn || '[]'),
                keywords: JSON.parse(r.keywords || '[]'),
                wrongOptionAnalysis: JSON.parse(r.wrong_option_analysis || '[]'),
                correct: !!r.correct,
                examMode: !!r.exam_mode
            })),
            examHistory: examHistory.map(h => ({
                ...h,
                categoryStats: JSON.parse(h.category_stats || '{}')
            })),
            vocabProgress: vocabProgress
        };
    }

    window.ToeicDB = {
        init,
        save,
        // Questions
        insertQuestion,
        importQuestions,
        getAllQuestions,
        getQuestionCount,
        getQuestionsByCategory,
        getRandomQuestions,
        deleteQuestion,
        clearAllQuestions,
        searchQuestions,
        // Records
        insertRecord,
        getAllRecords,
        getRecordStats,
        getWrongRecords,
        clearAllRecords,
        // Exam History
        insertExamHistory,
        getAllExamHistory,
        clearExamHistory,
        // Vocab Progress
        setVocabProgress,
        getVocabProgress,
        getAllVocabProgress,
        getVocabStats,
        // Export/Import
        exportDB,
        importDB,
        exportAsJSON
    };
})();
