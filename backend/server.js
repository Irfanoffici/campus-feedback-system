const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable for demo simplicity
}));
app.use(cors());
app.use(express.json());

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Database setup
const db = new sqlite3.Database(':memory:', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('✅ Connected to SQLite database (in-memory)');
        // Initialize database with sample data
        const initSql = require('fs').readFileSync(
            path.join(__dirname, 'database/init.sql'), 
            'utf8'
        );
        db.exec(initSql, (err) => {
            if (err) {
                console.error('Error initializing database:', err);
            } else {
                console.log('✅ Database initialized with sample data');
            }
        });
    }
});

// 📨 API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Feedback system is running',
        timestamp: new Date().toISOString()
    });
});

// 1. Submit anonymous feedback
app.post('/api/feedback', (req, res) => {
    const { category, message, priority = 'medium' } = req.body;
    
    // Validation
    if (!category || !message) {
        return res.status(400).json({ 
            error: 'Category and message are required' 
        });
    }
    
    const sql = `INSERT INTO feedback (category, message, priority) 
                 VALUES (?, ?, ?)`;
    
    db.run(sql, [category, message, priority], function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                error: 'Failed to submit feedback' 
            });
        }
        
        console.log(`📝 New feedback submitted: ${category} - ${priority} priority`);
        
        res.json({
            success: true,
            message: 'Feedback submitted anonymously',
            // No ID returned to maintain anonymity
            privacy: 'No personal information was stored'
        });
    });
});

// 2. Get feedback stats (for admin dashboard)
app.get('/api/stats', (req, res) => {
    const queries = {
        total: 'SELECT COUNT(*) as count FROM feedback',
        byCategory: `SELECT category, COUNT(*) as count 
                     FROM feedback 
                     GROUP BY category 
                     ORDER BY count DESC`,
        byPriority: `SELECT priority, COUNT(*) as count 
                     FROM feedback 
                     GROUP BY priority 
                     ORDER BY count DESC`,
        recent: `SELECT category, message, priority, created_at 
                 FROM feedback 
                 ORDER BY created_at DESC 
                 LIMIT 5`
    };
    
    db.all(queries.total, [], (err, totalResult) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to get stats' });
        }
        
        db.all(queries.byCategory, [], (err, categoryResult) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to get category stats' });
            }
            
            db.all(queries.byPriority, [], (err, priorityResult) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to get priority stats' });
                }
                
                db.all(queries.recent, [], (err, recentResult) => {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to get recent feedback' });
                    }
                    
                    res.json({
                        total: totalResult[0].count,
                        byCategory: categoryResult,
                        byPriority: priorityResult,
                        recent: recentResult,
                        generatedAt: new Date().toISOString()
                    });
                });
            });
        });
    });
});

// 3. Get all feedback (admin view - would be protected in production)
app.get('/api/admin/feedback', (req, res) => {
    const { category, status, page = 1, limit = 20 } = req.query;
    
    let sql = `SELECT id, category, message, priority, status, created_at 
               FROM feedback WHERE 1=1`;
    let params = [];
    
    if (category && category !== 'all') {
        sql += ' AND category = ?';
        params.push(category);
    }
    
    if (status && status !== 'all') {
        sql += ' AND status = ?';
        params.push(status);
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to fetch feedback' });
        }
        
        // Get total count for pagination
        let countSql = 'SELECT COUNT(*) as total FROM feedback WHERE 1=1';
        let countParams = [];
        
        if (category && category !== 'all') {
            countSql += ' AND category = ?';
            countParams.push(category);
        }
        
        if (status && status !== 'all') {
            countSql += ' AND status = ?';
            countParams.push(status);
        }
        
        db.get(countSql, countParams, (err, countResult) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to count feedback' });
            }
            
            res.json({
                feedback: rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult.total,
                    pages: Math.ceil(countResult.total / parseInt(limit))
                }
            });
        });
    });
});

// 4. Update feedback status (admin action)
app.patch('/api/admin/feedback/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['new', 'reviewed', 'resolved'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    
    const sql = 'UPDATE feedback SET status = ? WHERE id = ?';
    
    db.run(sql, [status, id], function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to update status' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Feedback not found' });
        }
        
        res.json({
            success: true,
            message: `Status updated to ${status}`,
            id: parseInt(id)
        });
    });
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Admin dashboard route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin/dashboard.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Feedback system running on http://localhost:${PORT}`);
    console.log(`📊 Admin dashboard: http://localhost:${PORT}/admin`);
    console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('✅ Database connection closed');
        }
        process.exit(0);
    });
});

// 5. Delete single feedback item
app.delete('/api/admin/feedback/:id', (req, res) => {
    const { id } = req.params;
    
    const sql = 'DELETE FROM feedback WHERE id = ?';
    
    db.run(sql, [id], function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to delete feedback' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Feedback not found' });
        }
        
        console.log(`🗑️ Feedback ${id} deleted`);
        
        res.json({
            success: true,
            message: `Feedback #${id} deleted successfully`,
            deletedId: parseInt(id)
        });
    });
});

// 6. Delete all resolved feedback
app.delete('/api/admin/feedback/resolved', (req, res) => {
    const sql = 'DELETE FROM feedback WHERE status = ?';
    
    db.run(sql, ['resolved'], function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to delete resolved feedback' });
        }
        
        console.log(`🗑️ Deleted ${this.changes} resolved feedback items`);
        
        res.json({
            success: true,
            message: `Deleted ${this.changes} resolved feedback items`,
            deletedCount: this.changes
        });
    });
});

// 7. Delete all feedback (use with caution!)
app.delete('/api/admin/feedback', (req, res) => {
    const sql = 'DELETE FROM feedback';
    
    db.run(sql, [], function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to delete all feedback' });
        }
        
        console.log(`🗑️ Deleted ALL feedback (${this.changes} items)`);
        
        res.json({
            success: true,
            message: `Deleted all feedback (${this.changes} items)`,
            deletedCount: this.changes
        });
    });
});