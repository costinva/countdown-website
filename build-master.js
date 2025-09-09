// build-master.js - FINAL ROBUST VERSION (NO PUBLIC database.json OR database/ FOLDER)
const fs = require('fs');
const path = require('path');

function safeReadJson(filePath) {
    if (!fs.existsSync(filePath)) { return []; }
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        if (fileContent.trim() === '') { return []; }
        return JSON.parse(fileContent);
    } catch (error) {
        console.error(`\n!!! ERROR: Failed to parse JSON from ${filePath}. The build will continue, but this data will be missing.\n`);
        return [];
    }
}

function buildMaster() {
    console.log("Master Robot starting robust build (no public database.json or database/ folder)...");

    // --- SETUP DIRECTORIES ---
    // The 'database' folder is no longer created for deployment.
    const localArchiveDir = 'full_archive'; // For local backup, ignored by Git
    fs.mkdirSync(localArchiveDir, { recursive: true });

    // --- SAFELY LOAD ALL DATA SOURCES ---
    console.log("Safely loading data from all worker robots...");
    const moviesData = safeReadJson('movies.json');
    const tvUpcomingData = safeReadJson('tv-upcoming.json');
    const tvArchiveData = safeReadJson('tv-archive.json');
    const gamesData = safeReadJson('rawg-data.json');

    const combinedTvDataMap = new Map();
    tvArchiveData.forEach(item => combinedTvDataMap.set(item.id, item));
    tvUpcomingData.forEach(item => combinedTvDataMap.set(item.id, item));
    const combinedTvData = Array.from(combinedTvDataMap.values());

    const allMediaForLocalArchive = [...moviesData, ...combinedTvData, ...gamesData];
    console.log(`Master Robot successfully collected a total of ${allMediaForLocalArchive.length} valid items for full archive.`);


    // --- STEP 1: CREATE THE COMPLETE LOCAL ARCHIVE (IGNORED BY GIT) ---
    allMediaForLocalArchive.forEach(item => {
        const fileName = `${item.type}-${item.id}.json`;
        fs.writeFileSync(path.join(localArchiveDir, fileName), JSON.stringify(item, null, 2));
    });
    console.log(`Successfully built complete local archive in '${localArchiveDir}/' with ${allMediaForLocalArchive.length} files.`);


    // --- STEP 2: BUILD HTML PAGES ONLY (NO DATA FILES IN DEPLOYMENT) ---
    // All data will now be fetched by frontend scripts from the Cloudflare Worker API.
    fs.writeFileSync('index.html', generateFinalHtml('upcoming', 'movies'));
    fs.writeFileSync('upcoming-tv.html', generateFinalHtml('upcoming', 'tv'));
    fs.writeFileSync('upcoming-games.html', generateFinalHtml('upcoming', 'games'));
    fs.writeFileSync('launched-movies.html', generateFinalHtml('launched', 'movies'));
    fs.writeFileSync('launched-tv.html', generateFinalHtml('launched', 'tv'));
    fs.writeFileSync('launched-games.html', generateFinalHtml('launched', 'games'));
    console.log("Successfully built all 6 pages. Master Robot's job is done.");
}

// generateFinalHtml function remains unchanged
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