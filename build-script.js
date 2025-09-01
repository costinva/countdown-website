// Import the tools we need
const fetch = require('node-fetch');
const fs = require('fs');

// --- CONFIGURATION ---
const API_KEY = 'cd88fa201e01c6623c7d9fb32223f4fc'; // Remember to use your secret key

// We'll fetch from two different API endpoints to get a good mix of movies
const UPCOMING_API_URL = `https://api.themoviedb.org/3/movie/upcoming?api_key=${API_KEY}&language=en-US&page=1`;
const POPULAR_API_URL = `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=en-US&page=1`;

// --- MAIN FUNCTION ---
async function buildWebsite() {
    console.log("Robot is waking up... Fetching movie lists...");

    try {
        // 1. Fetch both lists of movies and combine them
        const upcomingResponse = await fetch(UPCOMING_API_URL);
        const upcomingData = await upcomingResponse.json();

        const popularResponse = await fetch(POPULAR_API_URL);
        const popularData = await popularResponse.json();
        
        // Combine lists and remove duplicates
        const allMoviesBasic = new Map();
        [...upcomingData.results, ...popularData.results].forEach(movie => {
            allMoviesBasic.set(movie.id, movie);
        });
        
        console.log(`Found ${allMoviesBasic.size} unique movies to process.`);
        
        // 2. Fetch detailed information for EVERY movie
        console.log("Now fetching detailed information for each movie...");
        const allMoviesDetailed = [];
        for (const basicMovie of allMoviesBasic.values()) {
            const detailUrl = `https://api.themoviedb.org/3/movie/${basicMovie.id}?api_key=${API_KEY}&language=en-US`;
            const detailResponse = await fetch(detailUrl);
            const detailData = await detailResponse.json();
            allMoviesDetailed.push(detailData);
            // A small delay to be respectful of the API rate limits
            await new Promise(resolve => setTimeout(resolve, 50)); 
        }
        
        console.log("Successfully fetched all detailed movie data.");

        // 3. Save all this rich data to our "database" file
        fs.writeFileSync('search-data.json', JSON.stringify(allMoviesDetailed, null, 2));
        console.log("Successfully created search-data.json file!");

        // 4. Sort movies into upcoming and launched
        const upcomingMovies = [];
        const launchedMovies = [];
        const today = new Date();

        allMoviesDetailed.forEach(movie => {
            const releaseDate = new Date(movie.release_date);
            if (releaseDate > today) {
                upcomingMovies.push(movie);
            } else {
                launchedMovies.push(movie);
            }
        });
        
        // 5. Build the HTML files
        const upcomingHtml = generateFinalHtml(upcomingMovies, 'UPCOMING', false);
        fs.writeFileSync('index.html', upcomingHtml);
        console.log("Successfully built index.html with upcoming movies.");

        const launchedHtml = generateFinalHtml(launchedMovies, 'LAUNCHED', true);
        fs.writeFileSync('launched.html', launchedHtml);
        console.log("Successfully built launched.html with launched movies.");

        console.log("Robot's job is done.");

    } catch (error) {
        console.error("Oh no! The robot ran into an error:", error);
    }
}


// --- HELPER FUNCTIONS ---

function generateCardHtml(movie) {
    const posterUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
    const releaseDate = movie.release_date;
    const isLaunched = new Date(releaseDate) < new Date();

    const timerOrStatusHtml = isLaunched
        ? `<div class="card-status"><h4>Launched</h4></div>`
        : `<div class="card-timer">
               <div><span class="days">0</span><p>Days</p></div>
               <div><span class="hours">0</span><p>Hours</p></div>
               <div><span class="mins">0</span><p>Mins</p></div>
               <div><span class="secs">0</span><p>Secs</p></div>
           </div>`;

    // CRUCIAL CHANGE: The link now points to details.html with the movie's ID
    return `
        <a href="details.html?id=${movie.id}" class="countdown-card" data-date="${releaseDate}T12:00:00">
            <img src="${posterUrl}" class="card-bg" alt="${movie.title} Poster">
            <div class="card-overlay"></div>
            <div class="card-content">
                <div class="card-tag">MOVIE</div>
                <h3>${movie.title}</h3>
                ${timerOrStatusHtml}
            </div>
        </a>
    `;
}

function generateFinalHtml(movieList, pageTitle, isLaunchedPage) {
    // Generate the HTML for all the cards in the provided list
    let cardsHtml = '';
    movieList.forEach(movie => {
        cardsHtml += generateCardHtml(movie);
    });

    const indexActiveClass = !isLaunchedPage ? 'class="active"' : '';
    const launchedActiveClass = isLaunchedPage ? 'class="active"' : '';

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
        <nav>
            <a href="index.html" ${indexActiveClass}>UPCOMING</a>
            <a href="launched.html" ${launchedActiveClass}>LAUNCHED</a>
        </nav>
    </header>
    <main>
        <section class="search-section">
            <input type="text" placeholder="Search for movies, games, or TV shows...">
        </section>
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