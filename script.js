// This function will run for every countdown card on the page
document.addEventListener('DOMContentLoaded', () => {

    const countdownCards = document.querySelectorAll('.countdown-card');

    countdownCards.forEach(card => {
        // Get the target date from the card's 'data-date' attribute
        const eventDateStr = card.dataset.date;
        if (!eventDateStr) return; // Skip if no date is set

        const eventDate = new Date(eventDateStr);

        // Find the timer elements INSIDE this specific card
        const daysEl = card.querySelector('.days');
        const hoursEl = card.querySelector('.hours');
        const minsEl = card.querySelector('.mins');
        const secsEl = card.querySelector('.secs');

        const updateCountdown = () => {
            const now = new Date();
            const diff = eventDate.getTime() - now.getTime();

            if (diff <= 0) {
                // You can add a message here, like "Event Started!"
                card.querySelector('.card-timer').innerHTML = "<h4>RELEASED!</h4>";
                clearInterval(timer);
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            daysEl.textContent = days;
            hoursEl.textContent = String(hours).padStart(2, '0');
            minsEl.textContent = String(minutes).padStart(2, '0');
            secsEl.textContent = String(seconds).padStart(2, '0');
        }

        // Run the countdown for this card every second
        const timer = setInterval(updateCountdown, 1000);
        updateCountdown(); // Also run it immediately on page load
    });

});