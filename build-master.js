// build-master.js - FINAL VERSION with Split Database
const fs = require('fs');

const DB_DIR = 'database'; // The directory to store our split JSON files

function buildMaster() {
    console.log("Master Robot starting... Combining and splitting data...");

    // 1. Create the database directory
    fs.rmSync(DB_DIR, { recursive: true, force: true }); // Clear the old directory
    fs.mkdirSync(DB_DIR, { recursive: true });

    // 2. Load data from worker robots
    const moviesData = fs.existsSync('movies.json') ? JSON.parse(fs.readFileSync('movies.json')) : [];
    const tvData = fs.existsSync('tv.json') ? JSON.parse(fs.readFileSync('tv.json')) : [];
    const gamesData = fs.existsSync('rawg-data.json') ? JSON.parse(fs.readFileSync('rawg-data.json')) : [];
    
    const allMediaDetailed = [...moviesData, ...tvData, ...gamesData];
    
    // 3. Save a separate JSON file for each item
    allMediaDetailed.forEach(item => {
        if (item.id && item.type) {
            fs.writeFileSync(`${DB_DIR}/${item.type}-${item.id}.json`, JSON.stringify(item, null, 2));
        }
    });
    console.log(`Successfully created ${allMediaDetailed.length} individual data files in the /database directory.`);
    
    // 4. Create a lightweight "manifest" file for the main pages
    // This file only contains the data needed for the cards, making it much smaller.
    const manifest = allMediaDetailed.map(item => ({
        id: item.id,
        type: item.type,
        title: item.title,
        releaseDate: item.releaseDate,
        posterImage: item.posterImage,
        genres: item.genres,
        screenshots: item.screenshots
    }));
    fs.writeFileSync('database.json', JSON.stringify(manifest, null, 2));
    console.log(`Successfully created master database.json (manifest) with ${manifest.length} items.`);

    const today = new Date();
    const allValidMedia = manifest.filter(item => item.releaseDate && item.posterImage);
    const upcoming = allValidMedia.filter(item => new Date(item.releaseDate) > today);
    const launched = allValidMedia.filter(item => new Date(item.releaseDate) <= today);

    // Build all pages
    fs.writeFileSync('index.html', generateFinalHtml(upcoming.filter(i => i.type === 'movie'), 'upcoming', 'movies'));
    fs.writeFileSync('upcoming-tv.html', generateFinalHtml(upcoming.filter(i => i.type === 'tv'), 'upcoming', 'tv'));
    fs.writeFileSync('upcoming-games.html', generateFinalHtml(upcoming.filter(i => i.type === 'game'), 'upcoming', 'games'));
    fs.writeFileSync('launched-movies.html', generateFinalHtml(launched.filter(i => i.type === 'movie'), 'launched', 'movies'));
    fs.writeFileSync('launched-tv.html', generateFinalHtml(launched.filter(i => i.type === 'tv'), 'launched', 'tv'));
    fs.writeFileSync('launched-games.html', generateFinalHtml(launched.filter(i => i.type === 'game'), 'launched', 'games'));

    console.log("Successfully built all 6 pages.");
    console.log("Master Robot's job is done.");
}

// --- (The generateCardHtml and generateFinalHtml functions are unchanged and perfect) ---
function generateCardHtml(item) { /* ... same as before ... */ }
function generateFinalHtml(itemList, mainCategory, subCategory) { /* ... same as before ... */ }

// PASTE THE FULL FUNCTIONS FROM THE PREVIOUS CORRECT VERSION HERE
function generateCardHtml(item) {
    const posterUrl = item.posterImage;
    const releaseDate = item.releaseDate || 'N/A';
    const isLaunched = releaseDate === 'N/A' ? false : new Date(releaseDate) < new Date();
    const timerOrStatusHtml = isLaunched ? `<div class="card-status"><h4>Launched</h4></div>` : `<div class="card-timer"><div><span class="days">0</span><p>Days</p></div><div><span class="hours">0</span><p>Hours</p></div><div><span class="mins">0</span><p>Mins</p></div><div><span class="secs">0</span><p>Secs</p></div></div>`;
    const tagType = (item.type || 'N/A').toUpperCase();
    const screenshotData = (item.screenshots || []).map((ss, i) => `data-ss-${i}="${ss}"`).join(' ');
    return `<a href="details.html?id=${item.type}-${item.id}" class="countdown-card" data-date="${releaseDate}T12:00:00" data-poster="${posterUrl}" ${screenshotData}><div class="card-bg" style="background-image: url('${posterUrl}')"></div><div class="card-overlay"></div><div class="card-content"><div class="card-tag">${tagType}</div><h3>${item.title}</h3>${timerOrStatusHtml}</div></a>`;
}
function generateFinalHtml(itemList, mainCategory, subCategory) {
    let cardsHtml = '';
    itemList.forEach(item => { cardsHtml += generateCardHtml(item); });
    let genresDropdownHtml = '';
    const isGame = subCategory === 'games';
    if (subCategory === 'movies' || subCategory === 'tv' || isGame) {
        const movieTvGenres = ['Action', 'Horror', 'Comedy', 'Science Fiction', 'Romance', 'Fantasy', 'Drama'];
        const gameGenres = ['Action', 'RPG', 'Shooter', 'Strategy', 'Puzzle', 'Adventure', 'Indie', 'Simulation'];
        const genres = isGame ? gameGenres : movieTvGenres;
        let genreLinks = '<a href="#" class="genre-link" data-genre="all">All Genres</a>';
        genres.forEach(genre => { genreLinks += `<a href="#" class="genre-link" data-genre="${genre}">${genre}</a>`; });
        genresDropdownHtml = `<div class="genres-dropdown"><button class="genres-button">Genres ▼</button><div class="genres-list">${genreLinks}</div></div>`;
    }
    const moviesActive = subCategory === 'movies' ? 'class="active"' : '';
    const tvActive = subCategory === 'tv' ? 'class="active"' : '';
    const gamesActive = subCategory === 'games' ? 'class="active"' : '';
    const upcomingActive = mainCategory === 'upcoming' ? 'class="active"' : '';
    const launchedActive = mainCategory === 'launched' ? 'class="active"' : '';
    const pageTitle = `${mainCategory.toUpperCase()} ${subCategory.toUpperCase()}`;
    const moviesLink = mainCategory === 'upcoming' ? 'index.html' : 'launched-movies.html';
    const tvLink = mainCategory === 'upcoming' ? 'upcoming-tv.html' : 'launched-tv.html';
    const gamesLink = mainCategory === 'upcoming' ? 'upcoming-games.html' : 'launched-games.html';
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Your Countdown Hub</title><link rel="stylesheet" href="style.css"><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap" rel="stylesheet"></head><body><header><div class="header-left"><div class="logo"><a href="index.html">RUNUP.LIVE</a></div><nav class="category-nav"><a href="${moviesLink}" ${moviesActive}>MOVIES</a><a href="${tvLink}" ${tvActive}>TV</a><a href="${gamesLink}" ${gamesActive}>GAMES</a></nav></div><div class="header-right"><nav class="main-nav"><a href="index.html" ${upcomingActive}>UPCOMING</a><a href="launched-movies.html" ${launchedActive}>LAUNCHED</a></nav><div class="search-container"><input type="text" id="search-input" placeholder="Search..."></div></div></header><main class="grid-main"><div class="grid-header"><h2 class="grid-title">${pageTitle}</h2>${genresDropdownHtml}</div><div class="countdown-grid">${cardsHtml}</div></main><footer><a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer"><img src="images/tmdb-logo.svg" alt="The Movie Database" class="tmdb-logo"></a><p>This product uses the TMDB and RAWG APIs but is not endorsed or certified by them.</p></footer><script src="script.js" defer></script></body></html>`;
}


(async () => {
    await buildMaster();
})();