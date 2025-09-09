// build-master.js - FINAL ROBUST VERSION
const fs = require('fs');
const path = require('path');

/**
 * Safely reads and parses a JSON file.
 * @param {string} filePath The path to the JSON file.
 * @returns {Array} The parsed JSON data as an array, or an empty array if an error occurs.
 */
function safeReadJson(filePath) {
    if (!fs.existsSync(filePath)) {
        console.warn(`--> WARNING: File not found: ${filePath}. Skipping.`);
        return [];
    }
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        // Handle empty files, which are not valid JSON
        if (fileContent.trim() === '') {
            console.warn(`--> WARNING: File is empty: ${filePath}. Skipping.`);
            return [];
        }
        return JSON.parse(fileContent);
    } catch (error) {
        console.error(`\n!!! ERROR: Failed to parse JSON from ${filePath}. The file might be corrupt.`);
        console.error("!!! Error Details:", error.message);
        console.error("!!! The build will continue, but this data will be missing.\n");
        return []; // Return an empty array to prevent the build from crashing
    }
}


function buildMaster() {
    console.log("Master Robot starting robust build...");

    // --- SETUP DIRECTORIES ---
    const publicDatabaseDir = 'database';
    fs.mkdirSync(publicDatabaseDir, { recursive: true });
    
    // --- STEP 1: SAFELY LOAD ALL DATA SOURCES ---
    console.log("Loading data from all worker robots...");
    const moviesData = safeReadJson('movies.json');
    const tvUpcomingData = safeReadJson('tv-upcoming.json');
    const tvArchiveData = safeReadJson('tv-archive.json');
    const gamesData = safeReadJson('rawg-data.json');

    const combinedTvDataMap = new Map();
    tvArchiveData.forEach(item => combinedTvDataMap.set(item.id, item));
    tvUpcomingData.forEach(item => combinedTvDataMap.set(item.id, item));
    const combinedTvData = Array.from(combinedTvDataMap.values());

    const allMediaDetailed = [...moviesData, ...combinedTvData, ...gamesData];
    console.log(`Master Robot successfully collected a total of ${allMediaDetailed.length} valid items.`);

    // --- STEP 2: BUILD THE LIGHTWEIGHT MANIFEST & DETAIL FILES ---
    const manifestData = allMediaDetailed.map(item => ({
        id: item.id, type: item.type, title: item.title, releaseDate: item.releaseDate,
        posterImage: item.posterImage, genres: item.genres, overview: item.overview
    }));

    fs.writeFileSync('database.json', JSON.stringify(manifestData, null, 2));
    console.log(`Successfully created lightweight database.json with ${manifestData.length} items.`);

    allMediaDetailed.forEach(item => {
        const fileName = `${item.type}-${item.id}.json`;
        fs.writeFileSync(path.join(publicDatabaseDir, fileName), JSON.stringify(item, null, 2));
    });
    console.log(`Successfully created ${allMediaDetailed.length} individual detail files.`);

    // --- STEP 3: BUILD HTML PAGES ---
    fs.writeFileSync('index.html', generateFinalHtml('upcoming', 'movies'));
    fs.writeFileSync('upcoming-tv.html', generateFinalHtml('upcoming', 'tv'));
    fs.writeFileSync('upcoming-games.html', generateFinalHtml('upcoming', 'games'));
    fs.writeFileSync('launched-movies.html', generateFinalHtml('launched', 'movies'));
    fs.writeFileSync('launched-tv.html', generateFinalHtml('launched', 'tv'));
    fs.writeFileSync('launched-games.html', generateFinalHtml('launched', 'games'));
    console.log("Successfully built all 6 pages.");
    console.log("Master Robot's job is done.");
}

function generateFinalHtml(mainCategory, subCategory) {
    const moviesActive = subCategory === 'movies' ? 'class="active"' : '';
    const tvActive = subCategory === 'tv' ? 'class="active"' : '';
    const gamesActive = subCategory === 'games' ? 'class="active"' : '';
    const upcomingActive = mainCategory === 'upcoming' ? 'class="active"' : '';
    const launchedActive = mainCategory === 'launched' ? 'class="active"' : '';
    const pageTitle = `${mainCategory.toUpperCase()} ${subCategory.toUpperCase()}`;
    const moviesLink = mainCategory === 'upcoming' ? 'index.html' : 'launched-movies.html';
    const tvLink = mainCategory === 'upcoming' ? 'upcoming-tv.html' : 'launched-tv.html';
    const gamesLink = mainCategory === 'upcoming' ? 'upcoming-games.html' : 'launched-games.html';
    return `
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Your Countdown Hub</title><link rel="stylesheet" href="style.css"><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap" rel="stylesheet"></head><body><header><div class="header-left"><div class="logo"><a href="index.html">RUNUP.LIVE</a></div><nav class="category-nav"><a href="${moviesLink}" ${moviesActive}>MOVIES</a><a href="${tvLink}" ${tvActive}>TV</a><a href="${gamesLink}" ${gamesActive}>GAMES</a></nav></div><div class="header-right"><nav class="main-nav"><a href="index.html" ${upcomingActive}>UPCOMING</a><a href="launched-movies.html" ${launchedActive}>LAUNCHED</a></nav><div class="search-container"><input type="text" id="search-input" placeholder="Search..."></div></div></header><main class="grid-main"><div class="grid-header"><h2 class="grid-title">${pageTitle}</h2></div><div class="countdown-grid"></div></main><footer><a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer"><img src="images/tmdb-logo.svg" alt="The Movie Database" class="tmdb-logo"></a><p>This product uses the TMDB and RAWG APIs but is not endorsed or certified by them.</p></footer><script src="script.js" defer></script></body></html>
    `;
}

buildMaster();