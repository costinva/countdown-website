// runup-api/src/index.js - UPGRADED FOR GUEST REVIEWS

function jsonResponse(data, status = 200) {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
    return new Response(JSON.stringify(data), { status, headers });
}

export default {
    async fetch(request, env) {
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
            });
        }

        const url = new URL(request.url);

        try {
            // --- ROUTE 1: Get Reviews for an item ---
            if (request.method === 'GET' && url.pathname.startsWith('/api/reviews/')) {
                const itemId = url.pathname.split('/').pop();
                if (!itemId) return jsonResponse({ error: 'Missing item ID in URL' }, 400);

                // Fetch comments including the new is_guest column
                const stmt = env.DB.prepare(
                    'SELECT author, rating, comment, timestamp, is_guest FROM comments WHERE media_id = ? ORDER BY timestamp DESC'
                ).bind(itemId);
                const { results } = await stmt.all();

                const allComments = results || [];

                // Calculate summary for Guest Reviews (for now, all comments are guest)
                const guestReviews = allComments.filter(c => c.is_guest);
                const totalGuestReviews = guestReviews.length;
                const averageGuestRating = totalGuestReviews > 0 ? guestReviews.reduce((acc, c) => acc + c.rating, 0) / totalGuestReviews : 0;
                const guestRatingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                guestReviews.forEach(r => { guestRatingCounts[r.rating]++; });

                // Placeholder for User Reviews (will be empty until user accounts are added)
                const userReviews = allComments.filter(c => !c.is_guest);
                const totalUserReviews = userReviews.length;
                const averageUserRating = totalUserReviews > 0 ? userReviews.reduce((acc, c) => acc + c.rating, 0) / totalUserReviews : 0;
                const userRatingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                userReviews.forEach(r => { userRatingCounts[r.rating]++; });

                return jsonResponse({
                    comments: allComments, // Return all comments
                    summary: {
                        guest: {
                            totalReviews: totalGuestReviews,
                            averageRating: averageGuestRating.toFixed(1),
                            ratingCounts: guestRatingCounts
                        },
                        user: { // Placeholder for future user reviews
                            totalReviews: totalUserReviews,
                            averageRating: averageUserRating.toFixed(1),
                            ratingCounts: userRatingCounts
                        }
                    }
                });
            }

            // --- ROUTE 2: Post a new Review ---
            if (request.method === 'POST' && url.pathname === '/api/reviews') {
                const { itemId, author, rating, comment } = await request.json();

                if (!itemId || !author || !rating) {
                    return jsonResponse({ error: 'Missing required fields: itemId, author, and rating are required.' }, 400);
                }

                // Insert the new comment, explicitly marking it as a guest review for now
                const stmt = env.DB.prepare(
                    'INSERT INTO comments (media_id, author, rating, comment, is_guest) VALUES (?, ?, ?, ?, TRUE)'
                ).bind(itemId, author, rating, comment || '');
                
                await stmt.run();

                return jsonResponse({ success: true }, 201);
            }

            return jsonResponse({ error: 'Not Found' }, 404);

        } catch (err) {
            console.error('An unexpected error occurred:', err.stack);
            return jsonResponse({ error: 'Internal Server Error' }, 500);
        }
    },
};