const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database setup
const db = new sqlite3.Database('blog.db', (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    db.serialize(() => {
        // Create tables
        db.run(`CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER NOT NULL,
            text TEXT NOT NULL,
            author TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
        )`);

        // Insert sample data if empty
        db.get('SELECT COUNT(*) as count FROM posts', (err, row) => {
            if (row && row.count === 0) {
                const now = new Date().toISOString();
                const stmt = db.prepare('INSERT INTO posts (title, content, created_at) VALUES (?, ?, ?)');
                stmt.run('First Post', 'Welcome to my blog!', now);
                stmt.run('Second Post', 'This is another example post', now);
                stmt.finalize();
                console.log('Added sample posts');
            }
        });
    });
}

// API Routes

// Posts endpoints
app.get('/api/posts', (req, res) => {
    db.all('SELECT * FROM posts ORDER BY created_at DESC', [], (err, posts) => {
        if (err) return handleError(res, 'Error fetching posts', err);
        res.json(posts);
    });
});

app.get('/api/posts/:id', (req, res) => {
    const id = req.params.id;
    db.get('SELECT * FROM posts WHERE id = ?', [id], (err, post) => {
        if (err) return handleError(res, 'Error fetching post', err);
        res.json(post || {});
    });
});

app.post('/api/posts', (req, res) => {
    const { title, content } = req.body;
    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
    }

    const created_at = new Date().toISOString();
    db.run(
        'INSERT INTO posts (title, content, created_at) VALUES (?, ?, ?)',
        [title, content, created_at],
        function(err) {
            if (err) return handleError(res, 'Error creating post', err);
            getPostById(this.lastID, res);
        }
    );
});

app.delete('/api/posts/:id', (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM posts WHERE id = ?', [id], function(err) {
        if (err) return handleError(res, 'Error deleting post', err);
        res.json({ success: true, changes: this.changes });
    });
});

// Comments endpoints
app.get('/api/posts/:id/comments', (req, res) => {
    const postId = req.params.id;
    db.all(
        'SELECT * FROM comments WHERE post_id = ? ORDER BY created_at',
        [postId],
        (err, comments) => {
            if (err) return handleError(res, 'Error fetching comments', err);
            res.json(comments);
        }
    );
});

app.post('/api/comments', (req, res) => {
    const { post_id, text, author } = req.body;
    if (!post_id || !text) {
        return res.status(400).json({ error: 'Post ID and text are required' });
    }

    const created_at = new Date().toISOString();
    db.run(
        'INSERT INTO comments (post_id, text, author, created_at) VALUES (?, ?, ?, ?)',
        [post_id, text, author || 'Anonymous', created_at],
        function(err) {
            if (err) return handleError(res, 'Error creating comment', err);
            getCommentById(this.lastID, res);
        }
    );
});

// Helper functions
function getPostById(id, res) {
    db.get('SELECT * FROM posts WHERE id = ?', [id], (err, post) => {
        if (err) return handleError(res, 'Error fetching post', err);
        res.json(post);
    });
}

function getCommentById(id, res) {
    db.get('SELECT * FROM comments WHERE id = ?', [id], (err, comment) => {
        if (err) return handleError(res, 'Error fetching comment', err);
        res.json(comment);
    });
}

function handleError(res, message, err) {
    console.error(message, err);
    res.status(500).json({ error: err.message });
}

// Server configuration
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});