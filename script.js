// script.js - FINAL, CORRECTED VERSION
document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let allMedia = [];
    let currentPageItems = [];
    let originalPageTitle = '';

    // --- ELEMENT SELECTORS ---
    const countdownGrid = document.querySelector('.countdown-grid');
    const pageTitleElement = document.querySelector('.grid-title');
    const searchInput = document.getElementById('search-input');
    const gridHeader = document.querySelector('.grid-header');

    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    async function initializePage() {
        if (!pageTitleElement || !countdownGrid) return;
        originalPageTitle = pageTitleElement.textContent;
        try {
            const response = await fetch('database.json');
            if (!response.ok) throw new Error('database.json not found');
            allMedia = await response.json();
            
            filterAndSetInitialItems();
            renderCards(currentPageItems);
            addGenresDropdownIfNeeded();
            setupEventListeners();
        } catch (error) {
            console.error("Initialization failed:", error);
            countdownGrid.innerHTML = "<p>Error loading page data.</p>";
        }
    }

    // =========================================================================
    // EVENT LISTENERS
    // =========================================================================
    function setupEventListeners() {
        if (gridHeader) {
            gridHeader.addEventListener('click', (event) => {
                if (event.target.classList.contains('genre-link')) {
                    event.preventDefault();
                    handleGenreFilter(event.target.dataset.genre);
                }
            });
        }
        if (searchInput) {
            searchInput.addEventListener('input', handleSearch);
        }
        if (countdownGrid) {
            countdownGrid.addEventListener('mouseenter', handleCardMouseEnter, true);
            countdownGrid.addEventListener('mouseleave', handleCardMouseLeave, true);
        }
    }
    
    // =========================================================================
    // FILTERING & SEARCH LOGIC
    // =========================================================================
    function handleGenreFilter(genre) {
        const baseItems = getBaseItemsForCurrentPage();
        const itemsToRender = (genre === 'all')
            ? baseItems
            : baseItems.filter(item => (item.genres || []).includes(genre));
        renderCards(itemsToRender);
    }
    
    function handleSearch() {
        const query = searchInput.value.toLowerCase().trim();
        if (query.length > 2) {
             const filtered = allMedia.filter(item => item.title && item.title.toLowerCase().includes(query));
             pageTitleElement.textContent = `Search Results for "${searchInput.value}"`;
             renderCards(filtered);
        } else if (query.length === 0) {
            pageTitleElement.textContent = originalPageTitle;
            filterAndSetInitialItems();
            renderCards(currentPageItems);
        }
    }

    function filterAndSetInitialItems() {
        currentPageItems = getBaseItemsForCurrentPage();
    }
    
    function getBaseItemsForCurrentPage() {
        const pageTitle = originalPageTitle.toLowerCase();
        return allMedia.filter(item => {
            if (!item.releaseDate || !item.posterImage) return false;
            const isUpcoming = new Date(item.releaseDate) > new Date();
            const isMovie = item.type === 'movie';
            const isTv = item.type === 'tv';
            const isGame = item.type === 'game';
            if (pageTitle.includes('upcoming movies')) return isMovie && isUpcoming;
            if (pageTitle.includes('upcoming tv')) return isTv && isUpcoming;
            if (pageTitle.includes('upcoming games')) return isGame && isUpcoming;
            if (pageTitle.includes('launched movies')) return isMovie && !isUpcoming;
            if (pageTitle.includes('launched tv')) return isTv && !isUpcoming;
            if (pageTitle.includes('launched games')) return isGame && !isUpcoming;
            return false;
        });
    }

    // =========================================================================
    // RENDERING & HELPERS
    // =========================================================================
    function renderCards(itemList) {
        countdownGrid.innerHTML = '';
        if (itemList.length === 0) {
            countdownGrid.innerHTML = "<p>No results found.</p>";
            return;
        }
        const cardsFragment = document.createDocumentFragment();
        itemList.forEach(item => {
            const cardElement = createCardElement(item);
            if (cardElement) cardsFragment.appendChild(cardElement);
        });
        countdownGrid.appendChild(cardsFragment);
        initializeAllCountdowns();
    }

    function createCardElement(item) {
        if (!item || !item.title || !item.posterImage) return null;
        let posterUrl = item.posterImage;
        if ((item.type === 'movie' || item.type === 'tv') && posterUrl && !posterUrl.startsWith('http')) {
             posterUrl = `https://image.tmdb.org/t/p/w500${posterUrl}`;
        }
        const releaseDate = item.releaseDate || 'N/A';
        const isLaunched = releaseDate === 'N/A' ? false : new Date(releaseDate) < new Date();
        const tagType = (item.type || 'MEDIA').toUpperCase();
        const timerOrStatusHtml = isLaunched ? `<div class="card-status"><h4>Launched</h4></div>` : `<div class="card-timer"><div><span class="days">0</span><p>Days</p></div><div><span class="hours">0</span><p>Hours</p></div><div><span class="mins">0</span><p>Mins</p></div><div><span class="secs">0</span><p>Secs</p></div></div>`;
        const cardLink = document.createElement('a');
        cardLink.href = `details.html?id=${item.type}-${item.id}`;
        cardLink.className = 'countdown-card';
        cardLink.dataset.date = `${releaseDate}T12:00:00`;
        cardLink.dataset.poster = posterUrl;
        (item.screenshots || []).forEach((ss, i) => { cardLink.dataset[`ss${i}`] = ss; });
        cardLink.innerHTML = `<div class="card-bg" style="background-image: url('${posterUrl}')"></div><div class="card-overlay"></div><div class="card-content"><div class="card-tag">${tagType}</div><h3>${item.title}</h3>${timerOrStatusHtml}</div>`;
        return cardLink;
    }

    function addGenresDropdownIfNeeded() {
        if (!gridHeader) return;
        const pageTitle = originalPageTitle.toLowerCase();
        const isGame = pageTitle.includes('games');
        const isMovieOrTv = pageTitle.includes('movies') || pageTitle.includes('tv');
        if (!isMovieOrTv && !isGame) return;
        const movieTvGenres = ['Action', 'Horror', 'Comedy', 'Science Fiction', 'Romance', 'Fantasy', 'Drama'];
        const gameGenres = ['Action', 'RPG', 'Shooter', 'Strategy', 'Puzzle', 'Adventure', 'Indie', 'Simulation'];
        const genres = isGame ? gameGenres : movieTvGenres;
        let genreLinks = '<a href="#" class="genre-link" data-genre="all">All Genres</a>';
        genres.forEach(genre => { genreLinks += `<a href="#" class="genre-link" data-genre="${genre}">${genre}</a>`; });
        const dropdown = document.createElement('div');
        dropdown.className = 'genres-dropdown';
        dropdown.innerHTML = `<button class="genres-button">Genres ▼</button><div class="genres-list">${genreLinks}</div></div>`;
        gridHeader.appendChild(dropdown);
    }
    
    function initializeAllCountdowns() {
        document.querySelectorAll('.countdown-card .card-timer').forEach(timerDiv => {
            const card = timerDiv.closest('.countdown-card');
            if (!card) return;
            const eventDateStr = card.dataset.date;
            if (!eventDateStr || isNaN(new Date(eventDateStr).getTime())) return;
            const eventDate = new Date(eventDateStr);
            const timerElements = { days: timerDiv.querySelector('.days'), hours: timerDiv.querySelector('.hours'), mins: timerDiv.querySelector('.mins'), secs: timerDiv.querySelector('.secs') };
            if (!timerElements.days) return;
            const updateCountdown = () => {
                const diff = eventDate.getTime() - new Date().getTime();
                if (diff <= 0) {
                    if (timerDiv) timerDiv.innerHTML = "<h4>Launched</h4>";
                    if (timer) clearInterval(timer);
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

    function handleCardMouseEnter(event) {
        const card = event.target.closest('.countdown-card');
        if (!card || card.dataset.ss0 === undefined) return;
        const screenshots = [];
        for (let i = 0; i < 4; i++) { if (card.dataset[`ss${i}`]) screenshots.push(card.dataset[`ss${i}`]); }
        if (screenshots.length <= 0) return;
        let currentIndex = 0;
        const bgElement = card.querySelector('.card-bg');
        const slideshowInterval = setInterval(() => {
            currentIndex = (currentIndex + 1) % screenshots.length;
            bgElement.style.backgroundImage = `url('${screenshots[currentIndex]}')`;
        }, 1500);
        card.dataset.slideshowInterval = slideshowInterval;
    }

    function handleCardMouseLeave(event) {
        const card = event.target.closest('.countdown-card');
        if (!card || !card.dataset.slideshowInterval) return;
        clearInterval(parseInt(card.dataset.slideshowInterval));
        card.removeAttribute('data-slideshow-interval');
        const bgElement = card.querySelector('.card-bg');
        bgElement.style.backgroundImage = `url('${card.dataset.poster}')`;
    }
    
    // --- KICK EVERYTHING OFF ---
    initializePage();
});