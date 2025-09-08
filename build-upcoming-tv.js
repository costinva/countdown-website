// build-upcoming-tv.js - The "Scout" Robot for upcoming shows and episodes
const fetch = require('node-fetch');
const fs = require('fs');

const API_URL = `https://api.tvmaze.com/schedule`;

async function buildUpcomingTvData() {
    console.log("Upcoming TV Scout starting...");
    let allEpisodes = [];
    const today = new Date();

    // Fetch the schedule for the next 60 days to find upcoming episodes
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
    allEpisodes.forEach(episode => {
        const show = episode.show;
        if (!show.premiered || !show.image?.original) return; // Skip shows with no data

        // Check if this is the very first episode (a new series launch)
        const isNewSeries = episode.season === 1 && episode.number === 1;
        const title = isNewSeries ? show.name : `${show.name} (New Episode)`;

        // Only add the EARLIEST upcoming episode for each show
        if (!uniqueShows.has(show.id)) {
            uniqueShows.set(show.id, {
                id: show.id, type: 'tv', title: title, releaseDate: episode.airdate,
                posterImage: show.image.original, backdropImage: show.image.original,
                overview: (show.summary || "No summary available.").replace(/<[^>]*>?/gm, ''),
                score: show.rating?.average ? show.rating.average * 10 : null,
                genres: show.genres || [], screenshots: [], systemRequirements: null
            });
        }
    });

    const upcomingShows = Array.from(uniqueShows.values());
    fs.writeFileSync('tv-upcoming.json', JSON.stringify(upcomingShows, null, 2));
    console.log(`Upcoming TV Scout finished. Found ${upcomingShows.length} unique upcoming shows.`);
}

buildUpcomingTvData();