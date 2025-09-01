// Import the tools we need
const fetch = require('node-fetch');
const fs = require('fs');

// --- CONFIGURATION ---
const API_KEY = 'cd88fa201e01c6623c7d9fb32223f4fc'; // Remember to use your secret key
const TOTAL_PAGES_TO_FETCH = 15; // Each page has 20 items. 15 pages = ~300 movies. Increase for more.

// --- API HELPER FUNCTION ---
// This new function is the core of our upgrade. It fetches multiple pages from an API endpoint.
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
            // A small delay to be respectful of the API rate limits
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
        // 1. Fetch all data from TMDB using our new helper function
        const upcomingMovies = await fetchAllPages(`https://api.themoviedb.org/3/movie/upcoming?api_key=${API_KEY}&language=en-US`, TOTAL_PAGES_TO_FETCH);
        const popularMovies = await fetchAllPages(`https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=en-US`, 5); // Fetch fewer popular movies
        const popularTv = await fetchAllPages(`https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}&language=en-US`, TOTAL_PAGES_TO_FETCH);
        
        // 2. Combine lists, remove duplicates, and normalize data
        const allMedia = new Map();

        // Process movies
        [...upcomingMovies, ...popularMovies].forEach(item => {
            allMedia.set(`movie-${item.id}`, {
                id: item.id,
                type: 'movie',
                title: item.title,
                releaseDate: item.release_date,
                posterImage: item.poster_path,
                backdropImage: item.backdrop_path,
                overview: item.overview,
                score: item.vote_average * 10
            });
        });

        // Process TV shows
        popularTv.forEach(item => {
            allMedia.set(`tv-${item.id}`, {
                id: item.id,
                type: 'tv',
                title: item.name,
                releaseDate: item.first_air_date,
                posterImage: item.poster_path,
                backdropImage: item.backdrop_path,
                overview: item.overview,
                score: item.vote_average * 10
            });
        });
        
        const allMediaArray = Array.from(allMedia.values());
        console.log(`Processed ${allMediaArray.length} unique media items.`);

        // 3. Save the master database file
        fs.writeFileSync('database.json', JSON.stringify(allMediaArray, null, 2));
        console.log("Successfully created master database.json file!");

        // 4. Filter data for each page (This logic is now automatic thanks to the dates)
        const today = new Date();
        const finalUpcomingMovies = allMediaArray.filter(item => item.type === 'movie' && new Date(item.releaseDate) > today);
        const finalUpcomingTv = allMediaArray.filter(item => item.type === 'tv' && new Date(item.releaseDate) > today);
        
        const finalLaunchedMovies = allMediaArray.filter(item => item.type === 'movie' && new Date(item.releaseDate) <= today);
        const finalLaunchedTv = allMediaArray.filter(item => item.type === 'tv' && new Date(item.releaseDate) <= today);

        // 5. Build all the HTML pages
        fs.writeFileSync('index.html', generateFinalHtml(finalUpcomingMovies, 'upcoming', 'movies'));
        fs.writeFileSync('upcoming-tv.html', generateFinalHtml(finalUpcomingTv, 'upcoming', 'tv'));
        
        fs.writeFileSync('launched-movies.html', generateFinalHtml(finalLaunchedMovies, 'launched', 'movies'));
        fs.writeFileSync('launched-tv.html', generateFinalHtml(finalLaunchedTv, 'launched', 'tv'));

        console.log("Successfully built all 4 pages.");
        console.log("Robot's job is done.");

    } catch (error) {
        console.error("Oh no! The robot ran into an error:", error);
    }
}

// --- HELPER FUNCTIONS (These remain unchanged from the previous version) ---

function generateCardHtml(item) {
    // ... (This function is the same as the previous version)
    const posterUrl = `https://image.tmdb.org/t/p/w500${item.posterImage}`;
    const isLaunched = new Date(item.releaseDate) < new Date();

    const timerOrStatusHtml = isLaunched
        ? `<div class="card-status"><h4>Launched</h4></div>`
        : `<div class="card-timer">
               <div><span class="days">0</span><p>Days</p></div>
               <div><span class="hours">0</span><p>Hours</p></div>
               <div><span class="mins">0</span><p>Mins</p></div>
               <div><span class="secs">0</span><p>Secs</p></div>
           </div>`;

    const tagType = item.type.toUpperCase();

    return `
        <a href="details.html?id=${item.type}-${item.id}" class="countdown-card" data-date="${item.releaseDate}T12:00:00">
            <img src="${posterUrl}" class="card-bg" alt="${item.title} Poster">
            <div class="card-overlay"></div>
            <div class="card-content">
                <div class="card-tag">${tagType}</div>
                <h3>${item.title}</h3>
                ${timerOrStatusHtml}
            </div>
        </a>
    `;
}

function generateFinalHtml(itemList, mainCategory, subCategory) {
    // ... (This function is the same as the previous version)
    let cardsHtml = '';
    itemList.forEach(item => {
        cardsHtml += generateCardHtml(item);
    });

    const upcomingActive = mainCategory === 'upcoming' ? 'class="active"' : '';
    const launchedActive = mainCategory === 'launched' ? 'class="active"' : '';
    const moviesActive = subCategory === 'movies' ? 'class="active"' : '';
    const tvActive = subCategory === 'tv' ? 'class="active"' : '';

    const upcomingSubNav = `
        <a href="index.html" ${moviesActive}>MOVIES</a>
        <a href="upcoming-tv.html" ${tvActive}>TV</a>
        <a href="#">GAMES</a> <!-- Placeholder -->
    `;
    const launchedSubNav = `
        <a href="launched-movies.html" ${moviesActive}>MOVIES</a>
        <a href="launched-tv.html" ${tvActive}>TV</a>
        <a href="#">GAMES</a> <!-- Placeholder -->
    `;
    
    const subNavHtml = mainCategory === 'upcoming' ? upcomingSubNav : launchedSubNav;
    const pageTitle = `${mainCategory.toUpperCase()} ${subCategory.toUpperCase()}`;

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
        <div class="logo">RUNUP.LIVE</div>
        <nav class="main-nav">
            <a href="index.html" ${upcomingActive}>UPCOMING</a>
            <a href="launched-movies.html" ${launchedActive}>LAUNCHED</a>
        </nav>
    </header>
    <main>
        <div class="sub-nav-container">
            <nav class="sub-nav">
                ${subNavHtml}
            </nav>
            <div class="search-container">
                 <input type="text" placeholder="Search...">
            </div>
        </div>
        <section class="trending-section">
            <h2>${pageTitle}</h2>
            <div class="countdown-grid">
                ${cardsHtml}
            </div>
        </section>
    </main>
    <script src="script.js"></script>
</body>
</html>
    `;
}

// --- RUN THE ROBOT ---
buildWebsite();