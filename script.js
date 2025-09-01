document.addEventListener('DOMContentLoaded', () => {
    // A variable to hold our entire media database once it's loaded
    let allMedia = [];
    
    // The main elements we will be working with
    const searchInput = document.getElementById('search-input');
    const countdownGrid = document.querySelector('.countdown-grid');
    const pageTitleElement = document.querySelector('.grid-title');

    // --- 1. DATA FETCHING ---
    // Fetches our local database and starts the initial page setup
    async function fetchDataAndInitialize() {
        try {
            const response = await fetch('database.json');
            allMedia = await response.json();
            console.log("Database loaded successfully.", allMedia.length, "items.");
            
            // Render the initial set of cards based on the page's title
            renderInitialCards();
            
        } catch (error) {
            console.error("Failed to load database.json:", error);
            countdownGrid.innerHTML = "<p>Error: Could not load data.</p>";
        }
    }

    // --- 2. RENDERING LOGIC ---
    // Clears the grid and renders a new set of cards from a provided list
    function renderCards(itemList) {
        if (!countdownGrid) return;
        
        countdownGrid.innerHTML = ''; // Clear the grid

        if (itemList.length === 0) {
            countdownGrid.innerHTML = "<p>No results found.</p>";
            return;
        }

        let cardsHtml = '';
        itemList.forEach(item => {
            cardsHtml += createCardHtml(item);
        });

        countdownGrid.innerHTML = cardsHtml;
        initializeAllCountdowns(); // CRUCIAL: Re-initialize timers for the new cards
    }

    // --- 3. SEARCH LOGIC ---
    // This function is called every time the user types in the search box
    function handleSearch() {
        if (allMedia.length === 0) return; // Don't search if database isn't loaded yet

        const query = searchInput.value.toLowerCase();
        
        // Filter the entire database based on the search query
        const filteredMedia = allMedia.filter(item => {
            return item.title.toLowerCase().includes(query);
        });

        // Update the title and render the filtered cards
        pageTitleElement.textContent = query ? `Search results for "${searchInput.value}"` : "All Media";
        renderCards(filteredMedia);
    }
    
    // Attach the event listener to the search input
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    // --- 4. HELPER FUNCTIONS ---
    // Renders the initial cards based on what page we are on
    function renderInitialCards() {
        const pageTitle = pageTitleElement.textContent.toLowerCase();
        const initialFilter = allMedia.filter(item => {
            if (pageTitle.includes('upcoming') && pageTitle.includes('movies')) return item.type === 'movie' && new Date(item.releaseDate) > new Date();
            if (pageTitle.includes('upcoming') && pageTitle.includes('tv')) return item.type === 'tv' && new Date(item.releaseDate) > new Date();
            if (pageTitle.includes('launched') && pageTitle.includes('movies')) return item.type === 'movie' && new Date(item.releaseDate) <= new Date();
            if (pageTitle.includes('launched') && pageTitle.includes('tv')) return item.type === 'tv' && new Date(item.releaseDate) <= new Date();
            return false;
        });
        renderCards(initialFilter);
    }

    // Generates the HTML for a single card
    function createCardHtml(item) {
        const posterUrl = `https://image.tmdb.org/t/p/w500${item.posterImage}`;
        const isLaunched = new Date(item.releaseDate) < new Date();
        const timerOrStatusHtml = isLaunched ? `<div class="card-status"><h4>Launched</h4></div>` : `<div class="card-timer"><div><span class="days">0</span><p>Days</p></div><div><span class="hours">0</span><p>Hours</p></div><div><span class="mins">0</span><p>Mins</p></div><div><span class="secs">0</span><p>Secs</p></div></div>`;
        const tagType = item.type.toUpperCase();
        return `<a href="details.html?id=${item.type}-${item.id}" class="countdown-card" data-date="${item.releaseDate}T12:00:00"><img src="${posterUrl}" class="card-bg" alt="${item.title} Poster"><div class="card-overlay"></div><div class="card-content"><div class="card-tag">${tagType}</div><h3>${item.title}</h3>${timerOrStatusHtml}</div></a>`;
    }

    // Initializes all timers on the currently visible cards
    function initializeAllCountdowns() {
        const countdownCards = document.querySelectorAll('.countdown-card');
        countdownCards.forEach(card => {
            const timerDiv = card.querySelector('.card-timer');
            if (!timerDiv) return; // Skip launched cards

            const eventDateStr = card.dataset.date;
            if (!eventDateStr || isNaN(new Date(eventDateStr).getTime())) return;
            
            const eventDate = new Date(eventDateStr);
            const timerElements = {
                days: card.querySelector('.days'),
                hours: card.querySelector('.hours'),
                mins: card.querySelector('.mins'),
                secs: card.querySelector('.secs')
            };

            const updateCountdown = () => {
                const diff = eventDate.getTime() - new Date().getTime();
                if (diff <= 0) {
                    timerDiv.innerHTML = "<h4>Launched</h4>";
                    clearInterval(timer);
                    return;
                }
                timerElements.days.textContent = Math.floor(diff / (1000 * 60 * 60 * 24));
                timerElements.hours.textContent = String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, '0');
                timerElements.mins.textContent = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0');
                timerElements.secs.textContent = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
            };
            const timer = setInterval(updateCountdown, 1000);
            updateCountdown();
        });
    }

    // --- 5. START EVERYTHING ---
    fetchDataAndInitialize();
});