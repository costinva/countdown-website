// build-rawg.js - REVERTED TO STRICT, STABLE VERSION
const fetch = require('node-fetch');
const fs = require('fs');

const RAWG_API_KEY = '524eb57a5be14eb984532c06c44662f5';

async function fetchAllRawgPages(baseUrl, totalPages) {
    const allResults = [];
    for (let page = 1; page <= totalPages; page++) {
        try {
            console.log(`Fetching page ${page} from RAWG...`);
            const response = await fetch(`${baseUrl}&page=${page}`);
            const data = await response.json();
            if (data.results) allResults.push(...data.results);
            await new Promise(resolve => setTimeout(resolve, 150));
        } catch (error) { console.error(`Error fetching page ${page} from RAWG:`, error); }
    }
    return allResults;
}

async function buildRawgData() {
    console.log("RAWG Robot starting...");
    const today = new Date().toISOString().split('T')[0];
    const oneYearFromNow = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];
    const upcomingGamesUrl = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&dates=${today},${oneYearFromNow}&ordering=-added`;
    const games = await fetchAllRawgPages(upcomingGamesUrl, 5);

    const normalizedGames = [];
    for (const game of games) {
        if (game.released && game.background_image) {
            const detailResponse = await fetch(`https://api.rawg.io/api/games/${game.id}?key=${RAWG_API_KEY}`);
            const detailData = await detailResponse.json();
            normalizedGames.push({
                id: game.id, type: 'game', title: game.name, releaseDate: game.released,
                posterImage: game.background_image, backdropImage: game.background_image,
                overview: detailData.description_raw || `A new game titled ${game.name}. More details to come.`,
                score: game.metacritic, genres: game.genres.map(g => g.name),
                screenshots: (game.short_screenshots || []).slice(0, 4).map(ss => ss.image),
                systemRequirements: (detailData.platforms || []).find(p => p.platform.name === 'PC')?.requirements.html || null
            });
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }
    fs.writeFileSync('rawg-data.json', JSON.stringify(normalizedGames, null, 2));
    console.log(`RAWG Robot finished. Saved ${normalizedGames.length} valid games to rawg-data.json.`);
}

buildRawgData();