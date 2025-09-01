// This function will run for every countdown card on the page
document.addEventListener('DOMContentLoaded', () => {

    // --- MAIN GRID COUNTDOWN LOGIC ---
    const countdownGrid = document.querySelector('.countdown-grid');
    if (countdownGrid) {
        const countdownCards = document.querySelectorAll('.countdown-card');

        countdownCards.forEach(card => {
            const eventDateStr = card.dataset.date;
            if (!eventDateStr) return;

            const eventDate = new Date(eventDateStr);

            // NEW SAFETY CHECK: If the date is invalid, skip this card.
            if (isNaN(eventDate.getTime())) {
                return; 
            }

            const timerElements = {
                days: card.querySelector('.days'),
                hours: card.querySelector('.hours'),
                mins: card.querySelector('.mins'),
                secs: card.querySelector('.secs')
            };
            
            if (!timerElements.days) return;

            const updateCountdown = () => {
                const now = new Date();
                const diff = eventDate.getTime() - now.getTime();

                if (diff <= 0) {
                    card.querySelector('.card-timer').innerHTML = "<h4>Launched</h4>";
                    clearInterval(timer);
                    return;
                }

                timerElements.days.textContent = Math.floor(diff / (1000 * 60 * 60 * 24));
                timerElements.hours.textContent = String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, '0');
                timerElements.mins.textContent = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0');
                timerElements.secs.textContent = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
            }

            const timer = setInterval(updateCountdown, 1000);
            updateCountdown();
        });
    }

    // --- SEARCH FUNCTIONALITY (Coming Soon) ---
    // We will add the search code here in our next step.

});