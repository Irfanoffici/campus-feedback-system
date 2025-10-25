// Replace the form submission function with this:

feedbackForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = this.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    
    // Show loading state
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;
    
    const formData = {
        category: document.getElementById('category').value,
        message: document.getElementById('message').value,
        priority: document.getElementById('priority').value
    };
    
    try {
        const response = await fetch('http://localhost:3000/api/feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Success
            showSuccessModal();
            feedbackForm.reset();
        } else {
            throw new Error(result.error || 'Submission failed');
        }
        
    } catch (error) {
        console.error('Submission error:', error);
        alert('Sorry, there was an error submitting your feedback. Please try again.\n\nError: ' + error.message);
    } finally {
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// Remove the localStorage function - we don't need it anymore
