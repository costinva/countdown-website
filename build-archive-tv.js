// build-archive-tv.js - The "Archivist" Robot for passively building the launched library
const fetch = require('node-fetch');
const fs = require('fs');

const SHOWS_API_URL = `https://api.tvmaze.com/shows`;
const CACHE_FILE = '.cache/tv_archive_progress.json';
const SHOWS_PER_RUN = 100; // How many new shows to process each time

// THE FIX: Ensure the cache directory exists before we try to write to it.
fs.mkdirSync('.cache', { recursive: true });

async function buildArchiveTvData() {
    console.log("TV Archivist starting...");

    // 1. Load our memory of what we've already processed
    let progress = { lastPageProcessed: 0 };
    if (fs.existsSync(CACHE_FILE)) {
        progress = JSON.parse(fs.readFileSync(CACHE_FILE));
    }

    const startPage = progress.lastPageProcessed + 1;
    const endPage = startPage + SHOWS_PER_RUN;
    console.log(`Resuming from page ${startPage}. Will process up to page ${endPage}.`);

    let newShows = [];
    for (let page = startPage; page < endPage; page++) {
        try {
            console.log(`Archiving page ${page}...`);
            const res = await fetch(`${SHOWS_API_URL}?page=${page}`);
            const pageData = await res.json();
            if (pageData && pageData.length > 0) {
                newShows.push(...pageData);
            } else {
                console.log("Reached the end of the TVmaze list.");
                break; 
            }
            await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) { console.error(`Error archiving page ${page}:`, error); }
    }

    const normalizedShows = newShows.map(show => {
        if (!show.premiered || !show.image?.original) return null;
        return {
            id: show.id, type: 'tv', title: show.name, releaseDate: show.premiered,
            posterImage: show.image.original, backdropImage: show.image.original,
            overview: (show.summary || "No summary available.").replace(/<[^>]*>?/gm, ''),
            score: show.rating?.average ? show.rating.average * 10 : null,
            genres: show.genres || [], screenshots: [], systemRequirements: null
        };
    }).filter(Boolean);

    // 2. Load the existing archive and add the new shows
    let existingArchive = [];
    if (fs.existsSync('tv-archive.json')) {
        existingArchive = JSON.parse(fs.readFileSync('tv-archive.json'));
    }
    const combinedArchive = [...existingArchive, ...normalizedShows];
    
    const uniqueArchive = Array.from(new Map(combinedArchive.map(item => [item.id, item])).values());

    fs.writeFileSync('tv-archive.json', JSON.stringify(uniqueArchive, null, 2));
    console.log(`TV Archivist finished. Total launched shows in archive: ${uniqueArchive.length}.`);

    // 3. Save our progress for next time
    progress.lastPageProcessed = endPage - 1;
    fs.writeFileSync(CACHE_FILE, JSON.stringify(progress));
    console.log(`Saved progress. Next run will start from page ${endPage}.`);
}

buildArchiveTvData();