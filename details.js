// This script runs as soon as the details.html page is loaded
window.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Get the item ID from the URL
    // For a URL like "details.html?id=movie-569094", this gets "movie-569094"
    const params = new URLSearchParams(window.location.search);
    const itemId = params.get('id');

    if (!itemId) {
        // If no ID is found in the URL, show an error
        document.getElementById('details-title').textContent = 'Error: Item not found.';
        return;
    }

    // 2. Fetch our local "database"
    try {
        const response = await fetch('database.json');
        const database = await response.json();

        // 3. Find the specific item in the database
        // We need to match both the type (movie/tv) and the numeric id
        const [type, numericId] = itemId.split('-');
        const item = database.find(i => i.type === type && i.id == numericId);

        if (!item) {
            // If the ID from the URL doesn't exist in our database
            document.getElementById('details-title').textContent = 'Error: Item not found in database.';
            return;
        }

        // 4. Populate the page with the item's data!
        console.log("Found item:", item); // Good for debugging

        // Set the background
        const backdropUrl = `https://image.tmdb.org/t/p/original${item.backdropImage}`;
        document.getElementById('details-backdrop').style.backgroundImage = `url('${backdropUrl}')`;
        
        // Set the poster
        const posterUrl = `https://image.tmdb.org/t/p/w500${item.posterImage}`;
        document.getElementById('details-poster-img').src = posterUrl;
        
        // Set the text content
        document.getElementById('details-title').textContent = item.title;
        document.getElementById('details-release-date').textContent = `Release Date: ${item.releaseDate}`;
        // Note: TMDB API for details would be needed for genre names, we'll skip for now
        // document.getElementById('details-genres').textContent = "Genres here"; 
        document.getElementById('details-overview').textContent = item.overview;
        
        // Set the user score
        const score = Math.round(item.score);
        const scoreCircle = document.getElementById('details-score-circle');
        scoreCircle.textContent = `${score}%`;
        // Change color based on score
        if (score >= 70) {
            scoreCircle.style.borderColor = '#21d07a'; // Green
        } else if (score >= 40) {
            scoreCircle.style.borderColor = '#d2d531'; // Yellow
        } else {
            scoreCircle.style.borderColor = '#db2360'; // Red
        }

    } catch (error) {
        console.error("Error loading or processing data:", error);
        document.getElementById('details-title').textContent = 'Error: Could not load data.';
    }
});