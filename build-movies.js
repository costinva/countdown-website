// build-movies.js - RESILIENT VERSION WITH MORE ROBUST DATA EXTRACTION
const fetch = require('node-fetch');
const fs = require('fs');

const TMDB_API_KEY = 'cd88fa201e01c6623c7d9fb32223f4fc';
const TOTAL_PAGES = 15;
const API_URL = `https://api.themoviedb.org/3/movie/upcoming?api_key=${TMDB_API_KEY}&language=en-US`;
const CACHE_DIR = '.cache/movies';

async function buildMovieData() {
    let detailedMovies = [];

    try {
        console.log("Smart Movie Robot starting...");
        fs.mkdirSync(CACHE_DIR, { recursive: true });
        console.log("Fetching the latest list of upcoming movies...");
        const moviesList = [];
        for (let page = 1; page <= TOTAL_PAGES; page++) {
            const res = await fetch(`${API_URL}&page=${page}`);
            if (!res.ok) throw new Error(`API Error on movie page ${page}: ${res.statusText}`);
            const data = await res.json();
            if (data.results) moviesList.push(...data.results);
        }
        
        console.log(`Found ${moviesList.length} movies in the list. Processing...`);
        for (const movie of moviesList) {
            if (!movie.release_date || !movie.poster_path) continue;

            const cachePath = `${CACHE_DIR}/${movie.id}.json`;
            if (fs.existsSync(cachePath)) {
                detailedMovies.push(JSON.parse(fs.readFileSync(cachePath)));
            } else {
                const detailUrl = `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=images`;
                const detailRes = await fetch(detailUrl);
                const detailData = await detailRes.json();
                
                // --- ROBUST DATA EXTRACTION FOR MOVIES ---
                const normalizedData = {
                    id: detailData.id,
                    type: 'movie',
                    title: detailData.title,
                    releaseDate: detailData.release_date,
                    posterImage: detailData.poster_path, // This is relative path, frontend will prepend
                    // Ensure backdrops are full paths for the slideshow in frontend
                    backdrops: (detailData.images?.backdrops || []).map(img => `https://image.tmdb.org/t/p/original${img.file_path}`),
                    overview: detailData.overview,
                    score: detailData.vote_average ? Math.round(detailData.vote_average * 10) : null, // Store score as 0-100 integer
                    genres: (detailData.genres || []).map(g => g.name),
                    screenshots: [], // TMDB 'images' usually only has posters and backdrops, not distinct "screenshots" array.
                                      // If you want screenshots, you'd pull from backdrops or add another API call.
                    systemRequirements: null // Not applicable for movies
                };
                fs.writeFileSync(cachePath, JSON.stringify(normalizedData, null, 2));
                detailedMovies.push(normalizedData);
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }
    } catch (error) {
        console.error("\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        console.error("!!! A CRITICAL ERROR OCCURRED IN THE MOVIE ROBOT !!!");
        console.error("!!! This is likely due to an invalid TMDB_API_KEY.");
        console.error("!!! Error Details:", error.message);
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n");
        detailedMovies = [];
    } finally {
        fs.writeFileSync('movies.json', JSON.stringify(detailedMovies, null, 2));
        console.log(`Movie Robot finished. Saved ${detailedMovies.length} movies.`);
    }
}

buildMovieData();