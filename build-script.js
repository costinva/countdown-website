// Import the tools we need
const fetch = require('node-fetch');
const fs = require('fs');

// --- CONFIGURATION ---
const API_KEY = 'YOUR_SECRET_API_KEY_GOES_HERE'; // Remember to use your secret key
const TOTAL_PAGES_TO_FETCH = 15; 

// --- API HELPER FUNCTION ---
async function fetchAllPages(baseUrl, totalPages) {
    // ... (This function is the same as the previous version)
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
        
        // 2. Fetch detailed information for EVERY item, now including all images
        console.log("Now fetching detailed information and image galleries...");
        const allMediaDetailed = [];
        for (const item of uniqueMedia.values()) {
            const type = item.title ? 'movie' : 'tv';
            // CRUCIAL CHANGE: We add "&append_to_response=images" to get the backdrops
            const detailUrl = `https://api.themoviedb.org/3/${type}/${item.id}?api_key=${API_KEY}&language=en-US&append_to_response=images`;
            const detailResponse = await fetch(detailUrl);
            const detailData = await detailResponse.json();
            
            // Normalize the data into our own clean format
            allMediaDetailed.push({
                id: detailData.id,
                type: type,
                title: detailData.title || detailData.name,
                releaseDate: detailData.release_date || detailData.first_air_date,
                posterImage: detailData.poster_path,
                // We now save an array of all available backdrop images
                backdrops: detailData.images.backdrops.map(img => img.file_path),
                overview: detailData.overview,
                score: detailData.vote_average * 10,
                genres: detailData.genres.map(g => g.name) // Get genre names
            });
            await new Promise(resolve => setTimeout(resolve, 50)); 
        }
        
        console.log("Successfully fetched all detailed data.");

        // 3. Save the master database file
        fs.writeFileSync('database.json', JSON.stringify(allMediaDetailed, null, 2));
        console.log("Successfully created master database.json file!");

        // 4. Filter data for each page
        const today = new Date();
        const upcoming = allMediaDetailed.filter(item => new Date(item.releaseDate) > today);
        const launched = allMediaDetailed.filter(item => new Date(item.releaseDate) <= today);

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


// --- HELPER FUNCTIONS (These remain unchanged from the previous version) ---
// ... (The generateCardHtml and generateFinalHtml functions are the same as before)
// ... I'm hiding them for brevity, but make sure they are still in your file.
function generateCardHtml(item) {
    const posterUrl = `https://image.tmdb.org/t/p/w500${item.posterImage}`;
    const isLaunched = new Date(item.releaseDate) < new Date();
    const timerOrStatusHtml = isLaunched ? `<div class="card-status"><h4>Launched</h4></div>` : `<div class="card-timer"><div><span class="days">0</span><p>Days</p></div><div><span class="hours">0</span><p>Hours</p></div><div><span class="mins">0</span><p>Mins</p></div><div><span class="secs">0</span><p>Secs</p></div></div>`;
    const tagType = item.type.toUpperCase();
    return `<a href="details.html?id=${item.type}-${item.id}" class="countdown-card" data-date="${item.releaseDate}T12:00:00"><img src="${posterUrl}" class="card-bg" alt="${item.title} Poster"><div class="card-overlay"></div><div class="card-content"><div class="card-tag">${tagType}</div><h3>${item.title}</h3>${timerOrStatusHtml}</div></a>`;
}
function generateFinalHtml(itemList, mainCategory, subCategory) {
    let cardsHtml = '';
    itemList.forEach(item => { cardsHtml += generateCardHtml(item); });
    const upcomingActive = mainCategory === 'upcoming' ? 'class="active"' : '';
    const launchedActive = mainCategory === 'launched' ? 'class="active"' : '';
    const moviesActive = subCategory === 'movies' ? 'class="active"' : '';
    const tvActive = subCategory === 'tv' ? 'class="active"' : '';
    const upcomingSubNav = `<a href="index.html" ${moviesActive}>MOVIES</a><a href="upcoming-tv.html" ${tvActive}>TV</a><a href="#">GAMES</a>`;
    const launchedSubNav = `<a href="launched-movies.html" ${moviesActive}>MOVIES</a><a href="launched-tv.html" ${tvActive}>TV</a><a href="#">GAMES</a>`;
    const subNavHtml = mainCategory === 'upcoming' ? upcomingSubNav : launchedSubNav;
    const pageTitle = `${mainCategory.toUpperCase()} ${subCategory.toUpperCase()}`;
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Your Countdown Hub</title><link rel="stylesheet" href="style.css"><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap" rel="stylesheet"></head><body><header><div class="logo">RUNUP.LIVE</div><nav class="main-nav"><a href="index.html" ${upcomingActive}>UPCOMING</a><a href="launched-movies.html" ${launchedActive}>LAUNCHED</a></nav></header><main><div class="sub-nav-container"><nav class="sub-nav">${subNavHtml}</nav><div class="search-container"><input type="text" placeholder="Search..."></div></div><section class="trending-section"><h2>${pageTitle}</h2><div class="countdown-grid">${cardsHtml}</div></section></main><script src="script.js"></script></body></html>`;
}
// --- RUN THE ROBOT ---
buildWebsite();