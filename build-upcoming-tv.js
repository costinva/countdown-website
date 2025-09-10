// build-upcoming-tv.js - The "Scout" Robot for upcoming shows and episodes - ENRICHED DATA
const fetch = require('node-fetch');
const fs = require('fs');

const API_URL = `https://api.tvmaze.com/schedule`;

async function buildUpcomingTvData() {
    console.log("Upcoming TV Scout starting...");
    let allEpisodes = [];
    const today = new Date();

    for (let i = 0; i < 60; i++) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + i);
        const dateString = targetDate.toISOString().split('T')[0];
        try {
            console.log(`Scouting schedule for ${dateString}...`);
            const res = await fetch(`${API_URL}?date=${dateString}`);
            const dailyEpisodes = await res.json();
            if (dailyEpisodes && dailyEpisodes.length > 0) {
                allEpisodes.push(...dailyEpisodes);
            }
            await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) { console.error(`Error scouting schedule for ${dateString}:`, error); }
    }

    const uniqueShows = new Map();
    for (const episode of allEpisodes) {
        const show = episode.show;
        if (!show.premiered || !show.image?.original) continue;

        // Fetch show details for better data (e.g., summary, full image) if needed
        // For simplicity, we use what's available in the schedule endpoint

        const isNewSeries = episode.season === 1 && episode.number === 1;
        const title = isNewSeries ? show.name : `${show.name} (New Episode)`;

        // --- ENRICHED DATA EXTRACTION FOR UPCOMING TV ---
        if (!uniqueShows.has(show.id)) {
            uniqueShows.set(show.id, {
                id: show.id,
                type: 'tv',
                title: title,
                releaseDate: episode.airdate,
                posterImage: show.image.original,
                // For TVmaze, backdropImage is often the same as poster or missing in schedule.
                // We'll use a placeholder or the poster itself for backdrops if no specific backdrops are available.
                backdrops: show.image?.original ? [show.image.original] : [], // Use poster as a backdrop
                overview: (show.summary || "No summary available.").replace(/<[^>]*>?/gm, ''),
                score: show.rating?.average ? Math.round(show.rating.average * 10) : null, // Calculate score
                genres: show.genres || [],
                screenshots: show.image?.original ? [show.image.original] : [], // Use poster as a screenshot
                systemRequirements: null
            });
        }
    }

    const upcomingShows = Array.from(uniqueShows.values());
    fs.writeFileSync('tv-upcoming.json', JSON.stringify(upcomingShows, null, 2));
    console.log(`Upcoming TV Scout finished. Found ${upcomingShows.length} unique upcoming shows.`);
}

buildUpcomingTvData();