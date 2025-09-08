// build-master.js - FINAL, CORRECTED VERSION
const fs = require('fs');

function buildMaster() {
    console.log("Master Robot starting... Combining all available data...");

    // Load data from all worker robots
    const moviesData = fs.existsSync('movies.json') ? JSON.parse(fs.readFileSync('movies.json')) : [];
    const tvData = fs.existsSync('tv.json') ? JSON.parse(fs.readFileSync('tv.json')) : [];
    const gamesData = fs.existsSync('rawg-data.json') ? JSON.parse(fs.readFileSync('rawg-data.json')) : [];

    const allMediaDetailed = [...moviesData, ...tvData, ...gamesData];
    
    fs.writeFileSync('database.json', JSON.stringify(allMediaDetailed, null, 2));
    console.log(`Successfully created master database.json with ${allMediaDetailed.length} items.`);

    const today = new Date();
    const allValidMedia = allMediaDetailed.filter(item => item.releaseDate && item.posterImage);
    const upcoming = allValidMedia.filter(item => new Date(item.releaseDate) > today);
    const launched = allValidMedia.filter(item => new Date(item.releaseDate) <= today);

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

// THIS IS THE CRITICAL FIX: This function is now very simple.
// It DOES NOT build the cards OR the dropdown menu.
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

// We don't need generateCardHtml in this file anymore, so we remove it to be clean.

buildMaster();