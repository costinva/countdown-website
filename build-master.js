// build-master.js - FINAL, CORRECTED VERSION FOR DATABASE SPLIT
const fs = require('fs');
const path = require('path'); // Added for path manipulation

function buildMaster() {
    console.log("Master Robot starting... Combining all available data and splitting for frontend...");

    // 1. Ensure the 'database' directory exists
    const databaseDir = 'database';
    fs.mkdirSync(databaseDir, { recursive: true });
    
    // 2. Load data from all worker robots
    const moviesData = fs.existsSync('movies.json') ? JSON.parse(fs.readFileSync('movies.json')) : [];
    const tvUpcomingData = fs.existsSync('tv-upcoming.json') ? JSON.parse(fs.readFileSync('tv-upcoming.json')) : [];
    const tvArchiveData = fs.existsSync('tv-archive.json') ? JSON.parse(fs.readFileSync('tv-archive.json')) : [];
    const gamesData = fs.existsSync('rawg-data.json') ? JSON.parse(fs.readFileSync('rawg-data.json')) : [];

    // Combine all TV data, prioritizing upcoming if an ID clashes (though not expected with different types)
    // We want unique TV shows. If an archived show also appears in upcoming, we take the upcoming version.
    const combinedTvDataMap = new Map();
    tvArchiveData.forEach(item => combinedTvDataMap.set(item.id, item));
    tvUpcomingData.forEach(item => combinedTvDataMap.set(item.id, item)); // Upcoming overwrites archive for same ID
    const combinedTvData = Array.from(combinedTvDataMap.values());

    const allMediaDetailed = [...moviesData, ...combinedTvData, ...gamesData];
    
    console.log(`Master Robot has collected ${allMediaDetailed.length} detailed items.`);

    // 3. Create the lightweight 'database.json' manifest for script.js
    const manifestData = allMediaDetailed.map(item => ({
        id: item.id,
        type: item.type,
        title: item.title,
        releaseDate: item.releaseDate,
        posterImage: item.posterImage,
        genres: item.genres,
        // Add other properties if script.js needs them directly for filtering/display BEFORE clicking
        // E.g., if search needs overview, it needs to be here. For now, assuming script.js only needs basic for list display.
        overview: item.overview // Added as script.js uses it for search currently
    }));

    fs.writeFileSync('database.json', JSON.stringify(manifestData, null, 2));
    console.log(`Successfully created lightweight database.json manifest with ${manifestData.length} items.`);

    // 4. Create individual detail files in the 'database/' folder
    allMediaDetailed.forEach(item => {
        const fileName = `${item.type}-${item.id}.json`; // e.g., 'movie-123.json', 'tv-456.json'
        fs.writeFileSync(path.join(databaseDir, fileName), JSON.stringify(item, null, 2));
    });
    console.log(`Successfully created ${allMediaDetailed.length} individual detail files in '${databaseDir}/' folder.`);

    const today = new Date();
    // Filter by the manifest data, as that's what the front-end script.js will get
    const allValidMediaFromManifest = manifestData.filter(item => item.releaseDate && item.posterImage);
    const upcoming = allValidMediaFromManifest.filter(item => new Date(item.releaseDate) > today);
    const launched = allValidMediaFromManifest.filter(item => new Date(item.releaseDate) <= today);

    // Build all pages using the clean HTML template
    fs.writeFileSync('index.html', generateFinalHtml(upcoming.filter(i => i.type === 'movie'), 'upcoming', 'movies'));
    fs.writeFileSync('upcoming-tv.html', generateFinalHtml(upcoming.filter(i => i.type === 'tv'), 'upcoming', 'tv'));
    fs.writeFileSync('upcoming-games.html', generateFinalHtml(upcoming.filter(i => i.type === 'game'), 'upcoming', 'games'));
    fs.writeFileSync('launched-movies.html', generateFinalHtml(launched.filter(i => i.type === 'movie'), 'launched', 'movies'));
    fs.writeFileSync('launched-tv.html', generateFinalHtml(launched.filter(i => i.type === 'tv'), 'launched', 'tv'));
    fs.writeFileSync('launched-games.html', generateFinalHtml(launched.filter(i => i.type === 'game'), 'launched', 'games'));

    console.log("Successfully built all 6 pages.");
    console.log("Master Robot's job is done.");
}

// generateFinalHtml function remains the same as you provided
function generateFinalHtml(itemList, mainCategory, subCategory) {
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
            <div class="logo"><a href="index.html">RUNUP.LIVE</a></div>
            <nav class="category-nav">
                <a href="${moviesLink}" ${moviesActive}>MOVIES</a>
                <a href="${tvLink}" ${tvActive}>TV</a>
                <a href="${gamesLink}" ${gamesActive}>GAMES</a>
            </nav>
        </div>
        <div class="header-right">
            <nav class="main-nav">
                <a href="index.html" ${upcomingActive}>UPCOMING</a>
                <a href="launched-movies.html" ${launchedActive}>LAUNCHED</a>
            </nav>
            <div class="search-container"><input type="text" id="search-input" placeholder="Search..."></div>
        </div>
    </header>
    <main class="grid-main">
        <div class="grid-header">
            <h2 class="grid-title">${pageTitle}</h2>
            <!-- This is now intentionally left empty. The front-end script will add the dropdown. -->
        </div>
        <div class="countdown-grid">
            <!-- This is now intentionally left empty. The front-end script will fill it. -->
        </div>
    </main>
    <footer>
        <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer"><img src="images/tmdb-logo.svg" alt="The Movie Database" class="tmdb-logo"></a>
        <p>This product uses the TMDB and RAWG APIs but is not endorsed or certified by them.</p>
    </footer>
    <script src="script.js" defer></script>
</body>
</html>
    `;
}

buildMaster();