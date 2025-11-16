// Review Management Functions
let currentParkReviews = [];
let userReviewForCurrentPark = null;

function renderStarRating(rating, interactive = false, onRatingChange = null) {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5 && rating < 5;
    
    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
            stars.push(`<span class="star star-filled" data-rating="${i}">★</span>`);
        } else if (i === fullStars + 1 && hasHalfStar) {
            stars.push(`<span class="star star-half" data-rating="${i}">★</span>`);
        } else {
            stars.push(`<span class="star star-empty" data-rating="${i}">★</span>`);
        }
    }
    
    const className = interactive ? 'star-rating interactive' : 'star-rating';
    return `<div class="${className}" data-rating="${rating}">${stars.join('')}</div>`;
}

function setupStarRating(element, onRatingChange, initialRating = 0) {
    if (!element) return;
    
    const stars = element.querySelectorAll('.star');
    let selectedRating = initialRating;
    
    // Set initial selected state
    if (selectedRating > 0) {
        stars.forEach((s, i) => {
            if (i < selectedRating) {
                s.classList.add('star-selected');
            } else {
                s.classList.remove('star-selected');
            }
        });
    }
    
    stars.forEach((star, index) => {
        star.addEventListener('mouseenter', () => {
            if (!onRatingChange) return;
            const rating = index + 1;
            stars.forEach((s, i) => {
                s.classList.remove('star-hover', 'star-selected');
                if (i < rating) {
                    s.classList.add('star-hover');
                }
            });
        });
        
        star.addEventListener('mouseleave', () => {
            stars.forEach(s => s.classList.remove('star-hover'));
            if (selectedRating > 0) {
                stars.forEach((s, i) => {
                    if (i < selectedRating) {
                        s.classList.add('star-selected');
                    } else {
                        s.classList.remove('star-selected');
                    }
                });
            }
        });
        
        star.addEventListener('click', () => {
            if (!onRatingChange) return;
            selectedRating = index + 1;
            stars.forEach((s, i) => {
                s.classList.remove('star-hover');
                if (i < selectedRating) {
                    s.classList.add('star-selected');
                } else {
                    s.classList.remove('star-selected');
                }
            });
            onRatingChange(selectedRating);
        });
    });
}

async function loadParkReviews(parkId) {
    try {
        currentParkReviews = await fetchParkReviews(parkId);
        // Check if current user has a review
        if (currentUser) {
            userReviewForCurrentPark = currentParkReviews.find(
                r => r.User && r.User.username === currentUser.username
            );
        } else {
            userReviewForCurrentPark = null;
        }
        return currentParkReviews;
    } catch (error) {
        console.error('Error loading reviews:', error);
        return [];
    }
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
}

function renderReviewsSection(reviews, parkId) {
    if (!reviews || reviews.length === 0) {
        return `
            <div class="reviews-section" style="margin-top: 20px; padding-top: 15px; border-top: 2px solid var(--border-color);">
                <h4 style="margin-bottom: 15px; color: var(--primary-color); font-size: 1.1em;">⭐ Reviews</h4>
                <div class="no-reviews" style="padding: 15px; background: var(--bg-color); border-radius: 8px; color: var(--text-secondary); font-style: italic; text-align: center;">
                    No reviews yet. Be the first to review this park!
                </div>
                ${renderReviewForm(parkId)}
            </div>
        `;
    }
    
    // Calculate average rating
    const avgRating = reviews.reduce((sum, r) => sum + (parseFloat(r.rating) || 0), 0) / reviews.length;
    const roundedAvg = avgRating.toFixed(1);
    
    let html = `
        <div class="reviews-section" style="margin-top: 20px; padding-top: 15px; border-top: 2px solid var(--border-color);">
            <h4 style="margin-bottom: 15px; color: var(--primary-color); font-size: 1.1em;">
                ⭐ Reviews (${reviews.length})
            </h4>
            <div class="reviews-summary" style="margin-bottom: 20px; padding: 15px; background: var(--bg-color); border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 10px;">
                    <div class="average-rating" style="font-size: 2em; font-weight: bold; color: var(--warning-color);">
                        ${roundedAvg}
                    </div>
                    <div>
                        ${renderStarRating(avgRating, false)}
                        <div style="color: var(--text-secondary); font-size: 0.9em; margin-top: 5px;">
                            Based on ${reviews.length} review${reviews.length > 1 ? 's' : ''}
                        </div>
                    </div>
                </div>
            </div>
            ${renderReviewForm(parkId)}
            <details class="review-group" style="margin-top: 20px; padding: 12px; background: var(--bg-color); border-radius: 8px; border-left: 4px solid var(--warning-color); cursor: pointer;">
                <summary class="review-header" style="font-weight: 600; color: var(--primary-color); font-size: 1em; list-style: none; cursor: pointer; user-select: none; padding: 5px 0;">
                    <span style="display: inline-flex; align-items: center; gap: 8px;">
                        <span style="font-size: 0.9em;">▶</span>
                        <span>All Reviews (${reviews.length})</span>
                    </span>
                </summary>
                <div class="reviews-list" style="margin-top: 10px; padding-left: 20px;">
    `;
    
    reviews.forEach(review => {
        const isOwnReview = currentUser && review.User && review.User.username === currentUser.username;
        html += `
            <div class="review-item" data-review-id="${review.review_id}" style="
                margin-bottom: 20px; 
                padding: 15px; 
                background: ${isOwnReview ? '#f0f7ff' : 'white'}; 
                border-radius: 8px; 
                border: 1px solid var(--border-color);
                border-left: ${isOwnReview ? '4px solid var(--primary-color)' : '1px solid var(--border-color)'};
            ">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                    <div>
                        <div style="font-weight: 600; color: var(--primary-color); margin-bottom: 5px;">
                            ${review.User ? review.User.username : 'Anonymous'}
                            ${isOwnReview ? '<span style="color: var(--success-color); font-size: 0.8em; margin-left: 8px;">(You)</span>' : ''}
                        </div>
                        ${renderStarRating(parseFloat(review.rating) || 0, false)}
                    </div>
                    <div style="color: var(--text-secondary); font-size: 0.85em;">
                        ${formatDate(review.create_time)}
                    </div>
                </div>
                ${review.comment ? `
                    <div class="review-comment" style="
                        color: var(--text-primary); 
                        line-height: 1.6; 
                        margin-top: 10px;
                        white-space: pre-wrap;
                    ">${escapeHtml(review.comment)}</div>
                ` : ''}
                ${isOwnReview ? `
                    <div style="margin-top: 10px; display: flex; gap: 10px;">
                        <button class="edit-review-btn" data-review-id="${review.review_id}" style="
                            padding: 5px 12px; 
                            background: var(--secondary-color); 
                            color: white; 
                            border: none; 
                            border-radius: 4px; 
                            cursor: pointer;
                            font-size: 0.85em;
                        ">Edit</button>
                        <button class="delete-review-btn" data-review-id="${review.review_id}" style="
                            padding: 5px 12px; 
                            background: var(--accent-color); 
                            color: white; 
                            border: none; 
                            border-radius: 4px; 
                            cursor: pointer;
                            font-size: 0.85em;
                        ">Delete</button>
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    html += `
                </div>
            </details>
        </div>
    `;
    
    return html;
}

function renderReviewForm(parkId) {
    if (!currentUser) {
        return `
            <div class="review-login-prompt" style="
                padding: 15px; 
                background: #fff3cd; 
                border-radius: 8px; 
                border: 1px solid #ffc107;
                margin-bottom: 20px;
                text-align: center;
            ">
                <p style="margin: 0; color: var(--text-primary);">
                    Please <button id="loginFromReview" style="
                        background: none; 
                        border: none; 
                        color: var(--primary-color); 
                        text-decoration: underline; 
                        cursor: pointer;
                        font-weight: 600;
                    ">login</button> to write a review
                </p>
            </div>
        `;
    }
    
    if (userReviewForCurrentPark) {
        // Show edit form for existing review
        return `
            <div class="review-form-container" style="margin-bottom: 20px;">
                <div style="padding: 15px; background: #e7f3ff; border-radius: 8px; border: 1px solid #b3d9ff;">
                    <div style="font-weight: 600; color: var(--primary-color); margin-bottom: 10px;">
                        Your Review
                    </div>
                    <div id="editReviewForm" data-review-id="${userReviewForCurrentPark.review_id}">
                        <div class="rating-input" style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 8px; color: var(--text-primary); font-weight: 500;">
                                Rating *
                            </label>
                            <div id="editRatingStars"></div>
                            <input type="hidden" id="editRatingValue" value="${userReviewForCurrentPark.rating}">
                        </div>
                        <div class="comment-input" style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 8px; color: var(--text-primary); font-weight: 500;">
                                Your Review
                            </label>
                            <textarea id="editReviewComment" rows="4" style="
                                width: 100%; 
                                padding: 10px; 
                                border: 1px solid var(--border-color); 
                                border-radius: 6px; 
                                font-family: inherit;
                                font-size: 0.95em;
                                resize: vertical;
                            " placeholder="Share your experience...">${userReviewForCurrentPark.comment || ''}</textarea>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button id="updateReviewBtn" style="
                                padding: 10px 20px; 
                                background: var(--primary-color); 
                                color: white; 
                                border: none; 
                                border-radius: 6px; 
                                cursor: pointer;
                                font-weight: 500;
                            ">Update Review</button>
                            <button id="cancelEditReviewBtn" style="
                                padding: 10px 20px; 
                                background: var(--bg-color); 
                                color: var(--text-primary); 
                                border: 1px solid var(--border-color); 
                                border-radius: 6px; 
                                cursor: pointer;
                            ">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else {
        // Show new review form
        return `
            <div class="review-form-container" style="margin-bottom: 20px;">
                <div style="padding: 15px; background: white; border-radius: 8px; border: 1px solid var(--border-color);">
                    <div style="font-weight: 600; color: var(--primary-color); margin-bottom: 15px;">
                        Write a Review
                    </div>
                    <form id="newReviewForm" data-park-id="${parkId}">
                        <div class="rating-input" style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 8px; color: var(--text-primary); font-weight: 500;">
                                Rating *
                            </label>
                            <div id="newRatingStars"></div>
                            <input type="hidden" id="newRatingValue" value="0">
                        </div>
                        <div class="comment-input" style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 8px; color: var(--text-primary); font-weight: 500;">
                                Your Review
                            </label>
                            <textarea id="newReviewComment" rows="4" style="
                                width: 100%; 
                                padding: 10px; 
                                border: 1px solid var(--border-color); 
                                border-radius: 6px; 
                                font-family: inherit;
                                font-size: 0.95em;
                                resize: vertical;
                            " placeholder="Share your experience..."></textarea>
                        </div>
                        <button type="submit" id="submitReviewBtn" style="
                            padding: 10px 20px; 
                            background: var(--primary-color); 
                            color: white; 
                            border: none; 
                            border-radius: 6px; 
                            cursor: pointer;
                            font-weight: 500;
                        ">Submit Review</button>
                    </form>
                </div>
            </div>
        `;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function setupReviewForm(parkId) {
    // Setup login button
    const loginBtn = document.getElementById('loginFromReview');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            document.getElementById('loginBtn').click();
        });
    }
    
    // Setup new review form
    const newReviewForm = document.getElementById('newReviewForm');
    if (newReviewForm) {
        const ratingStars = document.getElementById('newRatingStars');
        const ratingValue = document.getElementById('newRatingValue');
        
        if (ratingStars) {
            ratingStars.innerHTML = renderStarRating(0, true);
            setupStarRating(ratingStars, (rating) => {
                ratingValue.value = rating;
            }, 0);
        }
        
        newReviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const rating = parseFloat(ratingValue.value);
            const comment = document.getElementById('newReviewComment').value.trim();
            
            if (rating === 0) {
                alert('Please select a rating');
                return;
            }
            
            if (!currentUser) {
                alert('Please login to write a review');
                return;
            }
            
            try {
                await createParkReview(currentUser.user_id, parkId, rating, comment);
                // Reload reviews and park info
                await loadParkReviews(parkId);
                // Refresh park info to show updated reviews
                const park = allParks.find(p => p.park_id === parkId);
                if (park) {
                    await showParkInfo(park);
                }
            } catch (error) {
                alert('Failed to submit review: ' + error.message);
            }
        });
    }
    
    // Setup edit review form
    const editReviewForm = document.getElementById('editReviewForm');
    if (editReviewForm) {
        const reviewId = editReviewForm.dataset.reviewId;
        const ratingStars = document.getElementById('editRatingStars');
        const ratingValue = document.getElementById('editRatingValue');
        
        if (ratingStars && ratingValue) {
            const currentRating = parseFloat(ratingValue.value) || 0;
            ratingStars.innerHTML = renderStarRating(0, true); // Start with empty stars for interactive
            setupStarRating(ratingStars, (rating) => {
                ratingValue.value = rating;
            }, currentRating); // Pass initial rating to setup function
        }
        
        const updateBtn = document.getElementById('updateReviewBtn');
        if (updateBtn) {
            updateBtn.addEventListener('click', async () => {
                const rating = parseFloat(ratingValue.value);
                const comment = document.getElementById('editReviewComment').value.trim();
                
                if (rating === 0) {
                    alert('Please select a rating');
                    return;
                }
                
                try {
                    await updateReview(reviewId, rating, comment);
                    // Reload reviews
                    await loadParkReviews(parkId);
                    const park = allParks.find(p => p.park_id === parkId);
                    if (park) {
                        await showParkInfo(park);
                    }
                } catch (error) {
                    alert('Failed to update review: ' + error.message);
                }
            });
        }
        
        const cancelBtn = document.getElementById('cancelEditReviewBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                const park = allParks.find(p => p.park_id === parkId);
                if (park) {
                    showParkInfo(park);
                }
            });
        }
    }
    
    // Setup delete review buttons
    document.querySelectorAll('.delete-review-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const reviewId = btn.dataset.reviewId;
            if (!confirm('Are you sure you want to delete this review?')) {
                return;
            }
            
            try {
                await deleteReview(reviewId);
                // Reload reviews
                await loadParkReviews(parkId);
                const park = allParks.find(p => p.park_id === parkId);
                if (park) {
                    await showParkInfo(park);
                }
            } catch (error) {
                alert('Failed to delete review: ' + error.message);
            }
        });
    });
    
    // Setup edit review buttons
    document.querySelectorAll('.edit-review-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const park = allParks.find(p => p.park_id === parkId);
            if (park) {
                showParkInfo(park);
            }
        });
    });
}

