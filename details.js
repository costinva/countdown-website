// This script runs as soon as the details.html page is loaded
window.addEventListener('DOMContentLoaded', async () => {
    
    // --- 1. GET DATA AND FIND THE ITEM ---
    const params = new URLSearchParams(window.location.search);
    const itemId = params.get('id');

    if (!itemId) {
        document.getElementById('hero-title').textContent = 'Error: Item not found.';
        return;
    }

    try {
        const response = await fetch('database.json');
        const database = await response.json();
        
        const [type, numericId] = itemId.split('-');
        const item = database.find(i => i.type === type && i.id == numericId);

        if (!item) {
            document.getElementById('hero-title').textContent = 'Error: Item not found in database.';
            return;
        }

        // --- 2. START THE BACKDROP SLIDESHOW ---
        startBackdropSlideshow(item.backdrops);

        // --- 3. POPULATE THE HERO SECTION ---
        document.getElementById('hero-title').textContent = item.title;
        const releaseDate = new Date(item.releaseDate + "T12:00:00");

        if (releaseDate > new Date()) {
            // If it's upcoming, start the countdown
            startCountdown(releaseDate);
        } else {
            // If it's launched, show the status
            document.getElementById('hero-countdown').classList.add('hidden');
            document.getElementById('hero-status').classList.remove('hidden');
        }

        // --- 4. POPULATE THE DETAILS CONTENT SECTION ---
        const posterUrl = `https://image.tmdb.org/t/p/w500${item.posterImage}`;
        document.getElementById('details-poster-img').src = posterUrl;
        
        document.getElementById('details-title').textContent = item.title;
        document.getElementById('details-release-date').textContent = `Release: ${item.releaseDate}`;
        document.getElementById('details-genres').textContent = item.genres.join(', ');
        document.getElementById('details-overview').textContent = item.overview;
        
        const score = Math.round(item.score);
        const scoreCircle = document.getElementById('details-score-circle');
        scoreCircle.textContent = `${score}%`;
        if (score >= 70) scoreCircle.style.borderColor = '#21d07a';
        else if (score >= 40) scoreCircle.style.borderColor = '#d2d531';
        else scoreCircle.style.borderColor = '#db2360';

    } catch (error) {
        console.error("Error loading or processing data:", error);
        document.getElementById('hero-title').textContent = 'Error: Could not load data.';
    }
});


// --- HELPER FUNCTIONS ---

function startBackdropSlideshow(backdrops) {
    if (!backdrops || backdrops.length === 0) return; // Don't start if no images

    const backdropElement = document.getElementById('hero-backdrop');
    let currentBackdropIndex = 0;

    // Function to change the image
    const changeBackdrop = () => {
        // Set the new image
        const backdropUrl = `https://image.tmdb.org/t/p/original${backdrops[currentBackdropIndex]}`;
        backdropElement.style.backgroundImage = `url('${backdropUrl}')`;
        
        // Move to the next image index, looping back to 0 if at the end
        currentBackdropIndex = (currentBackdropIndex + 1) % backdrops.length;
    };

    changeBackdrop(); // Set the first image immediately
    setInterval(changeBackdrop, 7000); // Change image every 7 seconds
}


function startCountdown(eventDate) {
    const daysEl = document.getElementById('hero-days');
    const hoursEl = document.getElementById('hero-hours');
    const minsEl = document.getElementById('hero-mins');
    const secsEl = document.getElementById('hero-secs');

    const update = () => {
        const diff = eventDate.getTime() - new Date().getTime();
        if (diff <= 0) {
            clearInterval(timer);
            // Optionally, hide countdown and show status
            document.getElementById('hero-countdown').classList.add('hidden');
            document.getElementById('hero-status').classList.remove('hidden');
            return;
        }
        daysEl.textContent = Math.floor(diff / (1000 * 60 * 60 * 24));
        hoursEl.textContent = String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, '0');
        minsEl.textContent = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0');
        secsEl.textContent = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
    };

    const timer = setInterval(update, 1000);
    update();
}