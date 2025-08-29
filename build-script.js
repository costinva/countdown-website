// Import the tools we need: 'fetch' to get data from the API, and 'fs' to save files.
const fetch = require('node-fetch');
const fs = require('fs');

// --- CONFIGURATION ---
// PASTE YOUR **NEW, SECRET** API KEY HERE.
const API_KEY = 'cd88fa201e01c6623c7d9fb32223f4fc';

// The API URL to get the most popular upcoming movies.
const API_URL = `https://api.themoviedb.org/3/movie/upcoming?api_key=${API_KEY}&language=en-US&page=1`;

// --- MAIN FUNCTION ---
// This is the main brain of our robot.
async function buildWebsite() {
    console.log("Robot is waking up... Fetching latest movie data...");

    try {
        // 1. Make the API Call
        const response = await fetch(API_URL);
        const data = await response.json();
        const movies = data.results; // This is an array of movie objects

        console.log(`Successfully fetched ${movies.length} movies.`);

        // 2. Generate the HTML for the countdown cards
        let cardsHtml = ''; // Start with an empty string
        movies.slice(0, 20).forEach(movie => { // We'll just take the top 20 movies
            cardsHtml += generateCardHtml(movie);
        });

        // 3. Generate the final index.html file content
        const finalHtml = generateFinalHtml(cardsHtml);

        // 4. Save the new index.html file
        fs.writeFileSync('index.html', finalHtml);
        console.log("Successfully created new index.html file!");
        console.log("Robot's job is done. Going back to sleep.");

    } catch (error) {
        console.error("Oh no! The robot ran into an error:", error);
    }
}

// --- HELPER FUNCTIONS ---

// This function takes a single movie object and returns the HTML for its card.
function generateCardHtml(movie) {
    const posterUrl = `https://image.tmdb.org/t/p/w780${movie.poster_path}`;
    const releaseDate = movie.release_date; // e.g., "2025-12-19"

    // The data-date attribute is crucial for our front-end JavaScript
    return `
        <a href="#" class="countdown-card" data-date="${releaseDate}T12:00:00">
            <img src="${posterUrl}" class="card-bg" alt="${movie.title} Poster">
            <div class="card-overlay"></div>
            <div class="card-content">
                <div class="card-tag">MOVIE</div>
                <h3>${movie.title}</h3>
                <div class="card-timer">
                    <div><span class="days">0</span><p>Days</p></div>
                    <div><span class="hours">0</span><p>Hours</p></div>
                    <div><span class="mins">0</span><p>Mins</p></div>
                    <div><span class="secs">0</span><p>Secs</p></div>
                </div>
            </div>
        </a>
    `;
}

// This function takes the generated cards and wraps them in the full page structure.
function generateFinalHtml(cardsHtml) {
    // This is a simplified version of your index.html structure
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Countdown Hub</title>
    <link rel="stylesheet" href="style.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap" rel="stylesheet">
</head>
<body>
    <header>
        <div class="logo">RUNUP.LIVE</div>
        <nav>
            <a href="#">TV</a>
            <a href="#">MOVIES</a>
            <a href="#">GAMES</a>
            <a href="#">MUSIC</a>
        </nav>
    </header>
    <main>
        <section class="search-section">
            <input type="text" placeholder="eg. The Matrix">
        </section>
        <section class="trending-section">
            <h2>TRENDING COUNTDOWNS</h2>
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