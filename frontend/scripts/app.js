// Frontend functionality
document.addEventListener('DOMContentLoaded', function() {
    const feedbackForm = document.getElementById('feedbackForm');
    const successModal = document.getElementById('successModal');
    const closeBtn = document.querySelector('.close');
    const newFeedbackBtn = document.getElementById('newFeedback');
    
    // Handle form submission
    feedbackForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            category: document.getElementById('category').value,
            message: document.getElementById('message').value,
            priority: document.getElementById('priority').value,
            timestamp: new Date().toISOString()
        };
        
        // For demo purposes - in real system, this would call my backend API
        console.log('Submitting feedback:', formData);
        
        // Simulate API call
        try {
            // In demo, I'll use localStorage to simulate persistence
            saveFeedbackToLocalStorage(formData);
            
            // Show success message
            showSuccessModal();
            
            // Reset form
            feedbackForm.reset();
            
        } catch (error) {
            alert('Sorry, there was an error submitting your feedback. Please try again.');
            console.error('Submission error:', error);
        }
    });
    
    // Modal controls
    closeBtn.onclick = function() {
        successModal.style.display = 'none';
    }
    
    newFeedbackBtn.onclick = function() {
        successModal.style.display = 'none';
        feedbackForm.reset();
    }
    
    window.onclick = function(event) {
        if (event.target == successModal) {
            successModal.style.display = 'none';
        }
    }
    
    function showSuccessModal() {
        successModal.style.display = 'block';
    }
    
    function saveFeedbackToLocalStorage(feedback) {
        // For demo purposes - stores in browser localStorage
        const existingFeedback = JSON.parse(localStorage.getItem('campusFeedback') || '[]');
        feedback.id = Date.now(); // Simple ID generation
        existingFeedback.push(feedback);
        localStorage.setItem('campusFeedback', JSON.stringify(existingFeedback));
    }
});
