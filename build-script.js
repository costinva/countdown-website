// Import the tools we need
const fetch = require('node-fetch');
const fs = require('fs');

// --- CONFIGURATION ---
const API_KEY = 'cd88fa201e01c6623c7d9fb32223f4fc'; // Remember to use your secret key
const TOTAL_PAGES_TO_FETCH = 15; 

// --- API HELPER FUNCTION ---
async function fetchAllPages(baseUrl, totalPages) {
    const allResults = [];
    for (let page = 1; page <= totalPages; page++) {
        try {
            console.log(`Fetching page ${page} from ${baseUrl.split('?')[0]}...`);
            const response = await fetch(`${baseUrl}&page=${page}`);
            const data = await response.json();
            if (data.results) {
                allResults.push(...data.results);
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
            console.error(`Error fetching page ${page}:`, error);
        }
    }
    return allResults;
}

// --- MAIN FUNCTION ---
async function buildWebsite() {
    console.log("Robot is waking up... Fetching all media (this may take a minute)...");

    try {
        // 1. Fetch all base data
        const upcomingMovies = await fetchAllPages(`https://api.themoviedb.org/3/movie/upcoming?api_key=${API_KEY}&language=en-US`, TOTAL_PAGES_TO_FETCH);
        const popularTv = await fetchAllPages(`https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}&language=en-US`, TOTAL_PAGES_TO_FETCH);
        
        const allMediaBasic = [...upcomingMovies, ...popularTv];
        const uniqueMedia = new Map();
        allMediaBasic.forEach(item => {
            const type = item.title ? 'movie' : 'tv';
            uniqueMedia.set(`${type}-${item.id}`, item);
        });
        
        console.log(`Found ${uniqueMedia.size} unique items to process.`);
        
        // 2. Fetch detailed information for EVERY item
        console.log("Now fetching detailed information and image galleries...");
        const allMediaDetailed = [];
        for (const item of uniqueMedia.values()) {
            const type = item.title ? 'movie' : 'tv';
            const detailUrl = `https://api.themoviedb.org/3/${type}/${item.id}?api_key=${API_KEY}&language=en-US&append_to_response=images`;
            const detailResponse = await fetch(detailUrl);
            const detailData = await detailResponse.json();
            
            allMediaDetailed.push({
                id: detailData.id,
                type: type,
                title: detailData.title || detailData.name,
                releaseDate: detailData.release_date || detailData.first_air_date,
                posterImage: detailData.poster_path,
                backdrops: detailData.images.backdrops.map(img => img.file_path),
                overview: detailData.overview,
                score: detailData.vote_average * 10,
                genres: detailData.genres.map(g => g.name)
            });
            await new Promise(resolve => setTimeout(resolve, 50)); 
        }
        
        console.log("Successfully fetched all detailed data.");

        // 3. Save the master database file
        fs.writeFileSync('database.json', JSON.stringify(allMediaDetailed, null, 2));
        console.log("Successfully created master database.json file!");

        // 4. Filter data for each page
        console.log("Filtering and sorting media...");
        const today = new Date();
        
        // CRUCIAL FIX: First, filter out any items that don't have a valid releaseDate.
        const allValidMedia = allMediaDetailed.filter(item => item.releaseDate);

        const upcoming = allValidMedia.filter(item => new Date(item.releaseDate) > today);
        const launched = allValidMedia.filter(item => new Date(item.releaseDate) <= today);

        // 5. Build all the HTML pages
        fs.writeFileSync('index.html', generateFinalHtml(upcoming.filter(i => i.type === 'movie'), 'upcoming', 'movies'));
        fs.writeFileSync('upcoming-tv.html', generateFinalHtml(upcoming.filter(i => i.type === 'tv'), 'upcoming', 'tv'));
        fs.writeFileSync('launched-movies.html', generateFinalHtml(launched.filter(i => i.type === 'movie'), 'launched', 'movies'));
        fs.writeFileSync('launched-tv.html', generateFinalHtml(launched.filter(i => i.type === 'tv'), 'launched', 'tv'));

        console.log("Successfully built all 4 pages.");
        console.log("Robot's job is done.");

    } catch (error) {
        console.error("Oh no! The robot ran into an error:", error);
    }
}


// --- HELPER FUNCTIONS ---

function generateCardHtml(item) {
    const posterUrl = `https://image.tmdb.org/t/p/w500${item.posterImage}`;
    const isLaunched = new Date(item.releaseDate) < new Date();
    const timerOrStatusHtml = isLaunched ? `<div class="card-status"><h4>Launched</h4></div>` : `<div class="card-timer"><div><span class="days">0</span><p>Days</p></div><div><span class="hours">0</span><p>Hours</p></div><div><span class="mins">0</span><p>Mins</p></div><div><span class="secs">0</span><p>Secs</p></div></div>`;
    const tagType = item.type.toUpperCase();
    return `<a href="details.html?id=${item.type}-${item.id}" class="countdown-card" data-date="${item.releaseDate}T12:00:00"><img src="${posterUrl}" class="card-bg" alt="${item.title} Poster"><div class="card-overlay"></div><div class="card-content"><div class="card-tag">${tagType}</div><h3>${item.title}</h3>${timerOrStatusHtml}</div></a>`;
}

function generateFinalHtml(itemList, mainCategory, subCategory) {
    let cardsHtml = '';
    itemList.forEach(item => {
        cardsHtml += generateCardHtml(item);
    });

    const moviesActive = subCategory === 'movies' ? 'class="active"' : '';
    const tvActive = subCategory === 'tv' ? 'class="active"' : '';
    const gamesActive = subCategory === 'games' ? 'class="active"' : '';
    const upcomingActive = mainCategory === 'upcoming' ? 'class="active"' : '';
    const launchedActive = mainCategory === 'launched' ? 'class="active"' : '';

    const pageTitle = `${mainCategory.toUpperCase()} ${subCategory.toUpperCase()}`;

    const moviesLink = mainCategory === 'upcoming' ? 'index.html' : 'launched-movies.html';
    const tvLink = mainCategory === 'upcoming' ? 'upcoming-tv.html' : 'launched-tv.html';
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Countdown Hub</title>
    <link rel="stylesheet" href="style.css">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap" rel="stylesheet">
</head>
<body>
    <header>
        <div class="header-left">
            <div class="logo">RUNUP.LIVE</div>
            <nav class="category-nav">
                <a href="${moviesLink}" ${moviesActive}>MOVIES</a>
                <a href="${tvLink}" ${tvActive}>TV</a>
                <a href="#" ${gamesActive}>GAMES</a>
            </nav>
        </div>
        <div class="header-right">
            <nav class="main-nav">
                <a href="index.html" ${upcomingActive}>UPCOMING</a>
                <a href="launched-movies.html" ${launchedActive}>LAUNCHED</a>
            </nav>
            <div class="search-container">
                <input type="text" id="search-input" placeholder="Search...">
            </div>
        </div>
    </header>
    <main class="grid-main">
        <h2 class="grid-title">${pageTitle}</h2>
        <div class="countdown-grid">
            ${cardsHtml}
        </div>
    </main>
    <script src="script.js" defer></script>
</body>
</html>
    `;
}

// --- RUN THE ROBOT ---
(async () => {
    await buildWebsite();
})();