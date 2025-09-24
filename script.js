// script.js - FINAL DEFINITIVE VERSION WITH API-POWERED PAGINATION AND FILTERING
document.addEventListener('DOMContentLoaded', async () => {
    // --- CONFIGURATION & STATE MANAGEMENT ---
    const API_URL = 'https://runup-api.veronica-vero2vv.workers.dev'; // <--- VERIFY YOUR WORKER URL!
    let itemsCurrentlyRendered = 0;
    const ITEMS_PER_LOAD = 100;
    let currentPage = 1;
    let totalItemsAvailable = 0;
    let mediaType = '';
    let mediaCategory = '';
    let currentSearchQuery = '';
    let currentGenreFilter = 'all';
    let originalPageTitle = '';

    // --- ELEMENT SELECTORS ---
    const mainElement = document.querySelector('.grid-main');
    const countdownGrid = document.querySelector('.countdown-grid');
    const pageTitleElement = document.querySelector('.grid-title');
    const searchInput = document.getElementById('search-input');
    const gridHeader = document.querySelector('.grid-header');
    let seeMoreBtn;

    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    async function initializePage() {
        if (!pageTitleElement || !countdownGrid) return;
        
        const pageTitleText = pageTitleElement.textContent.toLowerCase();
        if (pageTitleText.includes('movies')) mediaType = 'movie';
        else if (pageTitleText.includes('tv')) mediaType = 'tv';
        else if (pageTitleText.includes('games')) mediaType = 'game';

        if (pageTitleText.includes('upcoming')) mediaCategory = 'upcoming';
        else if (pageTitleText.includes('launched')) mediaCategory = 'launched';

        originalPageTitle = pageTitleElement.textContent;
        createSeeMoreButton();
        addGenresDropdownIfNeeded();
        setupEventListeners();
        
        await fetchAndRenderMedia(true); 
    }

    // =========================================================================
    // DATA FETCHING FROM API
    // =========================================================================
    async function fetchAndRenderMedia(reset = false) {
        if (reset) {
            currentPage = 1;
            itemsCurrentlyRendered = 0;
            countdownGrid.innerHTML = '';
            seeMoreBtn.classList.add('hidden');
            countdownGrid.innerHTML = '<p>Loading...</p>';
        }

        try {
            let apiUrl = `${API_URL}/api/media?page=${currentPage}&limit=${ITEMS_PER_LOAD}`;
            if (mediaType) apiUrl += `&type=${mediaType}`;
            if (mediaCategory) apiUrl += `&category=${mediaCategory}`;
            if (currentSearchQuery) apiUrl += `&search=${currentSearchQuery}`;
            if (currentGenreFilter !== 'all') apiUrl += `&genre=${currentGenreFilter}`;

            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`Failed to fetch media from API: ${response.status} ${response.statusText}`);
            const data = await response.json();

            if (reset) countdownGrid.innerHTML = ''; 

            const itemsToRender = data.items || [];
            totalItemsAvailable = data.total;

            if (itemsToRender.length === 0 && reset) {
                countdownGrid.innerHTML = "<p>No results found.</p>";
                return;
            }

            const cardsFragment = document.createDocumentFragment();
            itemsToRender.forEach(item => {
                const cardElement = createCardElement(item);
                if (cardElement) cardsFragment.appendChild(cardElement);
            });
            countdownGrid.appendChild(cardsFragment);
            itemsCurrentlyRendered += itemsToRender.length;
            currentPage++;

            if (itemsCurrentlyRendered < totalItemsAvailable) {
                seeMoreBtn.classList.remove('hidden');
            } else {
                seeMoreBtn.classList.add('hidden');
            }

            initializeAllCountdowns();

        } catch (error) {
            console.error("Failed to load media:", error);
            countdownGrid.innerHTML = "<p>Error loading media. Please try again later.</p>";
            seeMoreBtn.classList.add('hidden');
        }
    }

    // =========================================================================
    // EVENT LISTENERS
    // =========================================================================
    function setupEventListeners() {
        gridHeader.addEventListener('click', (event) => {
            if (event.target.classList.contains('genre-link')) {
                event.preventDefault();
                currentGenreFilter = event.target.dataset.genre;
                fetchAndRenderMedia(true);
            }
        });
        searchInput.addEventListener('input', handleSearch);
        countdownGrid.addEventListener('mouseenter', handleCardMouseEnter, true);
        countdownGrid.addEventListener('mouseleave', handleCardMouseLeave, true);
        seeMoreBtn.addEventListener('click', () => fetchAndRenderMedia(false));
    }
    
    // =========================================================================
    // FILTERING & SEARCH LOGIC
    // =========================================================================
    async function handleSearch() {
        const query = searchInput.value.toLowerCase().trim();
        if (query.length > 2) {
             currentSearchQuery = query;
             pageTitleElement.textContent = `Search Results for "${searchInput.value}"`;
             await fetchAndRenderMedia(true);
        } else if (query.length === 0 && currentSearchQuery.length > 0) {
            currentSearchQuery = '';
            pageTitleElement.textContent = originalPageTitle;
            await fetchAndRenderMedia(true);
        }
    }
    
    // =========================================================================
    // RENDERING & HELPERS
    // =========================================================================
    function createCardElement(item) {
        if (!item || !item.title || !item.posterImage) return null;
        let posterUrl = item.posterImage;
        if (posterUrl && !posterUrl.startsWith('http') && (item.type === 'movie' || item.type === 'tv')) {
             posterUrl = `https://image.tmdb.org/t/p/w500${posterUrl}`;
        }
        const releaseDate = item.releaseDate || 'N/A';
        const isLaunched = new Date(releaseDate) < new Date();
        const tagType = (item.type || 'MEDIA').toUpperCase();
        const timerOrStatusHtml = isLaunched ? `<div class="card-status"><h4>Launched</h4></div>` : `<div class="card-timer"><div><span class="days">0</span><p>Days</p></div><div><span class="hours">0</span><p>Hours</p></div><div><span class="mins">0</span><p>Mins</p></div><div><span class="secs">0</span><p>Secs</p></div></div>`;
        const cardLink = document.createElement('a');
        cardLink.href = `details.html?id=${item.id}`;
        cardLink.className = 'countdown-card';
        cardLink.dataset.date = `${releaseDate}T12:00:00`;
        cardLink.dataset.poster = posterUrl;
        cardLink.innerHTML = `<div class="card-bg" style="background-image: url('${posterUrl}')"></div><div class="card-overlay"></div><div class="card-content"><div class="card-tag">${tagType}</div><h3>${item.title}</h3>${timerOrStatusHtml}</div>`;
        return cardLink;
    }

    function createSeeMoreButton() {
        seeMoreBtn = document.createElement('button');
        seeMoreBtn.id = 'see-more-btn';
        seeMoreBtn.textContent = 'See More';
        seeMoreBtn.classList.add('hidden');
        mainElement.appendChild(seeMoreBtn);
    }

    function addGenresDropdownIfNeeded() {
        if (!gridHeader) return;
        const pageTitle = pageTitleElement.textContent.toLowerCase();
        if (!pageTitle.includes('movies') && !pageTitle.includes('tv') && !pageTitle.includes('games')) return;
        
        const movieTvGenres = ['Action', 'Horror', 'Comedy', 'Science Fiction', 'Romance', 'Fantasy', 'Drama'];
        const gameGenres = ['Action', 'RPG', 'Shooter', 'Strategy', 'Puzzle', 'Adventure', 'Indie', 'Simulation'];
        const genres = pageTitle.includes('games') ? gameGenres : movieTvGenres;

        let genreLinks = '<a href="#" class="genre-link" data-genre="all">All Genres</a>';
        genres.forEach(genre => { genreLinks += `<a href="#" class="genre-link" data-genre="${genre}">${genre}</a>`; });
        
        const dropdown = document.createElement('div');
        dropdown.className = 'genres-dropdown';
        dropdown.innerHTML = `<button class="genres-button">Genres ▼</button><div class="genres-list">${genreLinks}</div></div>`;
        
        if (!gridHeader.querySelector('.genres-dropdown')) {
            gridHeader.appendChild(dropdown);
        }
    }
    
    function initializeAllCountdowns() {
        document.querySelectorAll('.countdown-card .card-timer').forEach(timerDiv => {
            const card = timerDiv.closest('.countdown-card');
            if (!card || card.dataset.countdownInitialized) return;
            card.dataset.countdownInitialized = 'true';
            const eventDate = new Date(card.dataset.date);
            const timerElements = { days: timerDiv.querySelector('.days'), hours: timerDiv.querySelector('.hours'), mins: timerDiv.querySelector('.mins'), secs: timerDiv.querySelector('.secs') };
            if (!timerElements.days) return;
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

    function handleCardMouseEnter(event) {}
    function handleCardMouseLeave(event) {}
    
    // --- KICK EVERYTHING OFF ---
    initializePage();
});