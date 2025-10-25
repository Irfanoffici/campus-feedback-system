-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data for demo
INSERT OR IGNORE INTO feedback (category, message, priority) VALUES 
('facilities', 'Library computers are very slow during peak hours', 'high'),
('teaching', 'Professor Sharma''s lectures are very engaging and helpful', 'low'),
('safety', 'Broken lights near parking lot after 7 PM', 'critical'),
('administration', 'Exam result declaration takes too long', 'medium'),
('events', 'We need more technical workshops and hackathons', 'medium');
