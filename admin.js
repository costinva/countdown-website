document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENT SELECTORS ---
    const fetchBtn = document.getElementById('fetch-reviews-btn');
    const reviewsList = document.getElementById('reviews-list');
    const adminKeyInput = document.getElementById('admin-key');
    const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
    const deleteTypeSelect = document.getElementById('delete-type-select');
    const deleteValueInput = document.getElementById('delete-value-input');
    
    // --- CONFIG ---
    const API_URL = 'https://runup-api.veronica-vero2vv.workers.dev'; // Your worker URL

    // --- EVENT LISTENERS ---
    fetchBtn.addEventListener('click', fetchReviews);
    bulkDeleteBtn.addEventListener('click', handleBulkDelete);

    async function fetchReviews() {
        const key = adminKeyInput.value;
        if (!key) {
            alert('Please enter the admin key.');
            return;
        }

        reviewsList.innerHTML = '<p>Loading...</p>';

        try {
            const response = await fetch(`${API_URL}/api/admin/reviews`, {
                headers: { 'Authorization': `Bearer ${key}` }
            });

            if (response.status === 403) {
                reviewsList.innerHTML = '<p style="color: red;">Forbidden: Invalid Admin Key.</p>';
                return;
            }
            if (!response.ok) throw new Error('Failed to fetch reviews.');

            const reviews = await response.json();
            renderReviews(reviews);

        } catch (error) {
            reviewsList.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        }
    }

    function renderReviews(reviews) {
        if (reviews.length === 0) {
            reviewsList.innerHTML = '<p>No reviews found.</p>';
            return;
        }
        reviewsList.innerHTML = reviews.map(review => `
            <div class="review-item" id="review-${review.id}">
                <p><strong>Author:</strong> ${review.author} | <strong>Media ID:</strong> ${review.media_id}</p>
                <p><em>${review.comment || 'No comment text.'}</em></p>
                <small>${new Date(review.timestamp).toLocaleString()}</small>
                <button class="delete-btn" data-id="${review.id}">Delete</button>
            </div>
        `).join('');
    }

    reviewsList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const key = adminKeyInput.value;
            const commentId = e.target.dataset.id;
            
            if (!confirm(`Are you sure you want to delete review ${commentId}?`)) return;

            try {
                const response = await fetch(`${API_URL}/api/admin/reviews/${commentId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${key}` }
                });

                if (!response.ok) throw new Error('Failed to delete.');

                document.getElementById(`review-${commentId}`).remove();

            } catch (error) {
                alert(`Error deleting review: ${error.message}`);
            }
        }
    });

    async function handleBulkDelete() {
        const key = adminKeyInput.value;
        const deleteType = deleteTypeSelect.value;
        const value = deleteValueInput.value.trim();

        if (!key || !deleteType || !value) {
            alert('Please provide the Admin Key, select a criteria, and enter a value.');
            return;
        }

        const confirmation = prompt(`This is a destructive action. To confirm, please type "DELETE" in the box below.`);
        if (confirmation !== 'DELETE') {
            alert('Bulk delete cancelled.');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/admin/reviews/bulk-delete`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ deleteType, value })
            });

            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }

            const result = await response.json();
            alert(`Success! Deleted ${result.deletedCount} reviews.`);

            fetchReviews(); // Refresh the reviews list

        } catch (error) {
            alert(`Error during bulk delete: ${error.message}`);
        }
    }
});