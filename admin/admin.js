// Admin dashboard functionality
const API_BASE = 'http://localhost:3000/api';

// Load stats and feedback on page load
document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    loadFeedback();
});

async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/stats`);
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error);
        
        // Update stats
        document.getElementById('totalFeedback').textContent = data.total;
        
        // Category stats
        const categoryHtml = data.byCategory.map(cat => 
            `<div>${cat.category}: <strong>${cat.count}</strong></div>`
        ).join('');
        document.getElementById('categoryStats').innerHTML = categoryHtml;
        
        // Priority stats
        const priorityHtml = data.byPriority.map(pri => 
            `<div>${pri.priority}: <strong>${pri.count}</strong></div>`
        ).join('');
        document.getElementById('priorityStats').innerHTML = priorityHtml;
        
    } catch (error) {
        console.error('Error loading stats:', error);
        document.getElementById('statsGrid').innerHTML = 
            '<div class="stat-card">Error loading statistics</div>';
    }
}

async function loadFeedback() {
    const category = document.getElementById('categoryFilter').value;
    const status = document.getElementById('statusFilter').value;
    
    try {
        const params = new URLSearchParams({ category, status, limit: 50 });
        const response = await fetch(`${API_BASE}/admin/feedback?${params}`);
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error);
        
        displayFeedback(data.feedback);
        
    } catch (error) {
        console.error('Error loading feedback:', error);
        document.getElementById('feedbackItems').innerHTML = 
            '<div class="feedback-item">Error loading feedback</div>';
    }
}

function displayFeedback(feedback) {
    const container = document.getElementById('feedbackItems');
    
    if (feedback.length === 0) {
        container.innerHTML = '<div class="feedback-item">No feedback found</div>';
        return;
    }
    
    const feedbackHtml = feedback.map(item => `
        <div class="feedback-item priority-${item.priority}">
            <div style="display: flex; justify-content: between; align-items: start;">
                <div style="flex: 1;">
                    <strong>${item.category.toUpperCase()}</strong> 
                    • Priority: <span class="priority-badge">${item.priority}</span>
                    • Status: <span class="status-badge">${item.status}</span>
                    <div style="margin: 8px 0; font-size: 14px;">${item.message}</div>
                    <small>Submitted: ${new Date(item.created_at).toLocaleString()}</small>
                </div>
                <div style="margin-left: 15px;">
                    <select onchange="updateStatus(${item.id}, this.value)" 
                            style="padding: 5px; font-size: 12px;">
                        <option value="new" ${item.status === 'new' ? 'selected' : ''}>New</option>
                        <option value="reviewed" ${item.status === 'reviewed' ? 'selected' : ''}>Reviewed</option>
                        <option value="resolved" ${item.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                    </select>
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = feedbackHtml;
}

async function updateStatus(feedbackId, newStatus) {
    try {
        const response = await fetch(
            `${API_BASE}/admin/feedback/${feedbackId}/status`, 
            {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            }
        );
        
        const result = await response.json();
        
        if (!response.ok) throw new Error(result.error);
        
        console.log('Status updated:', result);
        
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Failed to update status: ' + error.message);
    }
}