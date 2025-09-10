// runup-api/src/index.js - FINAL, DEPENDENCY-FREE VERSION WITH ALL CRITICAL BUGS FIXED

// Helper for JSON responses with CORS headers
function jsonResponse(data, status = 200) {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    return new Response(JSON.stringify(data), { status, headers });
}

// Password hashing and comparison using Web Crypto API
async function hashPassword(password) {
    const textEncoder = new TextEncoder();
    const data = textEncoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password, hashedPassword) {
    const newHash = await hashPassword(password);
    return newHash === hashedPassword;
}

// JWT Generation and Verification using Web Crypto API
async function getJwtKey(secret) {
    const textEncoder = new TextEncoder();
    return await crypto.subtle.importKey(
        "raw",
        textEncoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"]
    );
}

async function generateJwt(payload, secret) {
    const header = { alg: "HS256", typ: "JWT" };
    const encodedHeader = btoa(JSON.stringify(header))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
    
    const issuedAt = Math.floor(Date.now() / 1000);
    const expirationTime = issuedAt + (60 * 60 * 24 * 7); // 1 week expiration
    const finalPayload = { ...payload, iat: issuedAt, exp: expirationTime };

    const encodedPayload = btoa(JSON.stringify(finalPayload))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");

    const signature = await crypto.subtle.sign(
        "HMAC",
        await getJwtKey(secret),
        new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
    );
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");

    return `${encodedHeader}.${encodedPayload}.${encodedSignature}`; // FIX: Removed duplicate encodedHeader
}

async function verifyJwt(token, secret) {
    const parts = token.split('.');
    if (parts.length !== 3) return null; // Invalid token format

    const [encodedHeader, encodedPayload, encodedSignature] = parts;

    try {
        const signature = Uint8Array.from(atob(encodedSignature.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
        
        const isValid = await crypto.subtle.verify(
            "HMAC",
            await getJwtKey(secret),
            signature,
            new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
        );

        if (!isValid) return null; // Signature doesn't match

        const decodedPayload = JSON.parse(atob(encodedPayload.replace(/-/g, "+").replace(/_/g, "/")));
        if (decodedPayload.exp < Math.floor(Date.now() / 1000)) return null; // Token expired

        return decodedPayload; // Return the payload if valid
    } catch (e) {
        console.error("JWT verification error:", e);
        return null;
    }
}

async function authenticateRequest(request, env) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null; // Not authenticated
    }

    const token = authHeader.split(' ')[1];
    const payload = await verifyJwt(token, env.JWT_SECRET);

    if (!payload || !payload.userId) {
        return null; // Invalid or expired token
    }
    return payload.userId; // Return user ID if authenticated
}


// --- Main Fetch Handler ---
export default {
    async fetch(request, env) {
        // Handle CORS preflight requests
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                },
            });
        }

        const url = new URL(request.url);

        try {
            // --- AUTHENTICATION ROUTES ---
            if (request.method === 'POST' && url.pathname === '/api/auth/register') {
                const { username, password } = await request.json();
                if (!username || !password) return jsonResponse({ error: 'Username and password are required' }, 400);

                const hashedPassword = await hashPassword(password);
                const userId = crypto.randomUUID();

                try {
                    await env.DB.prepare('INSERT INTO users (id, username, hashed_password) VALUES (?, ?, ?)')
                        .bind(userId, username, hashedPassword)
                        .run();
                    return jsonResponse({ success: true, userId, username }, 201);
                } catch (e) {
                    if (e.message.includes('UNIQUE constraint failed')) {
                        return jsonResponse({ error: 'Username already taken' }, 409);
                    }
                    throw e;
                }
            }

            if (request.method === 'POST' && url.pathname === '/api/auth/login') {
                const { username, password } = await request.json();
                if (!username || !password) return jsonResponse({ error: 'Username and password are required' }, 400);

                const user = await env.DB.prepare('SELECT id, username, hashed_password FROM users WHERE username = ?')
                    .bind(username)
                    .first();

                if (!user || !(await verifyPassword(password, user.hashed_password))) {
                    return jsonResponse({ error: 'Invalid username or password' }, 401);
                }

                const token = await generateJwt({ userId: user.id, username: user.username }, env.JWT_SECRET);
                return jsonResponse({ success: true, token, userId: user.id, username: user.username });
            }

            if (request.method === 'GET' && url.pathname === '/api/auth/me') {
                const userId = await authenticateRequest(request, env);
                if (!userId) return jsonResponse({ error: 'Unauthorized' }, 401);

                const user = await env.DB.prepare('SELECT id, username FROM users WHERE id = ?')
                    .bind(userId)
                    .first();
                
                if (!user) return jsonResponse({ error: 'User not found' }, 404);

                return jsonResponse({ userId: user.id, username: user.username });
            }


            // --- MEDIA LISTING ROUTES FOR MAIN PAGES (Paginated, Filtered) ---
            if (request.method === 'GET' && url.pathname === '/api/media') {
                const { searchParams } = url;
                const type = searchParams.get('type');
                const category = searchParams.get('category');
                const page = parseInt(searchParams.get('page')) || 1;
                const limit = parseInt(searchParams.get('limit')) || 100;
                const searchQuery = searchParams.get('search');
                const genre = searchParams.get('genre');

                let whereClauses = [];
                let params = [];
                const offset = (page - 1) * limit;

                if (type) {
                    whereClauses.push('type = ?');
                    params.push(type);
                }

                const now = new Date().toISOString().split('T')[0];
                if (category === 'upcoming') {
                    whereClauses.push('releaseDate > ?');
                    params.push(now);
                } else if (category === 'launched') {
                    whereClauses.push('releaseDate <= ?');
                    params.push(now);
                }

                if (searchQuery) {
                    whereClauses.push('title LIKE ?');
                    params.push(`%${searchQuery}%`);
                }

                if (genre && genre !== 'all') {
                    whereClauses.push('genres LIKE ?');
                    params.push(`%${genre}%`);
                }
                
                const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

                const countStmt = env.DB.prepare(`SELECT COUNT(*) as total FROM media ${whereSql}`).bind(...params);
                const { total } = await countStmt.first();

                const dataStmt = env.DB.prepare(
                    `SELECT id, type, title, releaseDate, posterImage, overview, genres
                    FROM media
                    ${whereSql}
                    ORDER BY releaseDate ASC
                    LIMIT ? OFFSET ?`
                ).bind(...params, limit, offset);
                const { results } = await dataStmt.all();

                const items = (results || []).map(item => ({
                    ...item,
                    genres: item.genres ? item.genres.split(', ') : [],
                }));

                return jsonResponse({
                    items: items,
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                });
            }

            // --- INDIVIDUAL MEDIA DETAILS ROUTE ---
            if (request.method === 'GET' && url.pathname.startsWith('/api/media/details/')) {
                const itemId = url.pathname.split('/').pop();
                if (!itemId) return jsonResponse({ error: 'Missing item ID in URL' }, 400);

                const item = await env.DB.prepare(
                    `SELECT id, type, title, releaseDate, posterImage, overview, genres, score, backdrops, screenshots, systemRequirements
                    FROM media WHERE id = ?`
                ).bind(itemId).first();

                if (!item) return jsonResponse({ error: 'Item not found' }, 404);

                const formattedItem = {
                    ...item,
                    genres: item.genres ? item.genres.split(', ') : [],
                    backdrops: item.backdrops ? JSON.parse(item.backdrops) : [],
                    screenshots: item.screenshots ? JSON.parse(item.screenshots) : [],
                };

                return jsonResponse(formattedItem);
            }


            // --- REVIEW ROUTES ---
            if (request.method === 'GET' && url.pathname.startsWith('/api/reviews/')) {
                const itemId = url.pathname.split('/').pop();
                if (!itemId) return jsonResponse({ error: 'Missing item ID in URL' }, 400);

                const stmt = env.DB.prepare(
                    `SELECT
                        c.id, c.media_id, c.user_id, c.author, c.rating, c.comment, c.timestamp, c.is_guest,
                        u.username AS user_username
                    FROM comments c
                    LEFT JOIN users u ON c.user_id = u.id
                    WHERE c.media_id = ? ORDER BY c.timestamp DESC`
                ).bind(itemId);
                const { results } = await stmt.all();

                const allComments = results || [];

                const formattedComments = allComments.map(c => ({
                    id: c.id,
                    media_id: c.media_id,
                    author: c.is_guest ? c.author : c.user_username || 'Unknown User',
                    rating: c.rating,
                    comment: c.comment,
                    timestamp: c.timestamp,
                    is_guest: c.is_guest,
                    user_id: c.user_id
                }));

                const guestReviews = formattedComments.filter(c => c.is_guest);
                const userReviews = formattedComments.filter(c => !c.is_guest);

                const totalGuestReviews = guestReviews.length;
                const averageGuestRating = totalGuestReviews > 0 ? guestReviews.reduce((acc, c) => acc + c.rating, 0) / totalGuestReviews : 0;
                const guestRatingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                guestReviews.forEach(r => { guestRatingCounts[r.rating]++; }); // FIX: Corrected variable here

                const totalUserReviews = userReviews.length;
                const averageUserRating = totalUserReviews > 0 ? userReviews.reduce((acc, c) => acc + c.rating, 0) / totalUserReviews : 0;
                const userRatingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                userReviews.forEach(r => { userRatingCounts[r.rating]++; });


                return jsonResponse({
                    comments: formattedComments,
                    summary: {
                        guest: {
                            totalReviews: totalGuestReviews,
                            averageRating: averageGuestRating.toFixed(1),
                            ratingCounts: guestRatingCounts
                        },
                        user: {
                            totalReviews: totalUserReviews,
                            averageRating: averageUserRating.toFixed(1),
                            ratingCounts: userRatingCounts
                        }
                    }
                });
            }

            // POST /api/reviews (Updated to handle authenticated users)
            if (request.method === 'POST' && url.pathname === '/api/reviews') {
                const requestBody = await request.json();
                const { itemId, rating, comment } = requestBody;
                
                const userId = await authenticateRequest(request, env);
                let authorName = requestBody.author;

                let isGuest = true;
                if (userId) {
                    isGuest = false;
                    const user = await env.DB.prepare('SELECT username FROM users WHERE id = ?').bind(userId).first();
                    authorName = user ? user.username : 'Unknown User';
                } else {
                    if (!authorName) return jsonResponse({ error: 'Author name is required for guest reviews' }, 400);
                }

                if (!itemId || !rating) {
                    return jsonResponse({ error: 'Missing required fields: itemId and rating are required.' }, 400);
                }

                const stmt = env.DB.prepare(
                    'INSERT INTO comments (media_id, user_id, author, rating, comment, is_guest) VALUES (?, ?, ?, ?, ?, ?)'
                ).bind(itemId, userId, authorName, rating, comment || '', isGuest);
                
                await stmt.run();

                return jsonResponse({ success: true }, 201);
            }

            // --- Fallback: 404 Not Found ---
            return jsonResponse({ error: 'Not Found' }, 404);

        } catch (err) {
            console.error('An unexpected error occurred:', err.stack);
            return jsonResponse({ error: 'Internal Server Error' }, 500);
        }
    },
};