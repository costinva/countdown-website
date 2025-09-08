// build-movies.js - With better error logging
const fetch = require('node-fetch');
const fs = require('fs');

const TMDB_API_KEY = 'cd88fa201e01c6623c7d9fb32223f4fc'; // Double-check this key is correct!
const TOTAL_PAGES = 15;
const API_URL = `https://api.themoviedb.org/3/movie/upcoming?api_key=${TMDB_API_KEY}&language=en-US`;
const CACHE_DIR = '.cache/movies';

async function buildMovieData() {
    console.log("Smart Movie Robot starting...");
    fs.mkdirSync(CACHE_DIR, { recursive: true });

    console.log("Fetching the latest list of upcoming movies...");
    const moviesList = [];
    for (let page = 1; page <= TOTAL_PAGES; page++) {
        try {
            const res = await fetch(`${API_URL}&page=${page}`);
            const data = await res.json();
            // NEW ERROR CHECK: Log an error if the API call fails
            if (!data.results) {
                console.error(`API Error on movie page ${page}:`, data);
            } else {
                moviesList.push(...data.results);
            }
        } catch (error) { console.error(`Network Error on movie page ${page}:`, error); }
    }
    
    console.log(`Found ${moviesList.length} movies in the list. Processing against cache...`);
    
    // ... The rest of the file is the same ...
    const detailedMovies = [];
    for (const movie of moviesList) {
        const cachePath = `${CACHE_DIR}/${movie.id}.json`;
        if (fs.existsSync(cachePath)) {
            const cachedData = JSON.parse(fs.readFileSync(cachePath));
            detailedMovies.push(cachedData);
        } else {
            try {
                const detailUrl = `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=images`;
                const detailRes = await fetch(detailUrl);
                const detailData = await detailRes.json();
                const normalizedData = {
                    id: detailData.id, type: 'movie', title: detailData.title,
                    releaseDate: detailData.release_date, posterImage: detailData.poster_path,
                    backdrops: (detailData.images?.backdrops || []).map(img => img.file_path),
                    overview: detailData.overview, score: detailData.vote_average * 10,
                    genres: (detailData.genres || []).map(g => g.name), screenshots: [], systemRequirements: null
                };
                fs.writeFileSync(cachePath, JSON.stringify(normalizedData, null, 2));
                detailedMovies.push(normalizedData);
                await new Promise(resolve => setTimeout(resolve, 50));
            } catch (error) { console.error(`Error fetching details for movie ID ${movie.id}:`, error); }
        }
    }
    fs.writeFileSync('movies.json', JSON.stringify(detailedMovies, null, 2));
    console.log(`Movie Robot finished. Saved ${detailedMovies.length} movies to movies.json.`);
}

buildMovieData();