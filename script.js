// This function will run for every countdown card on the page
document.addEventListener('DOMContentLoaded', () => {

    // --- MAIN GRID COUNTDOWN LOGIC ---
    // First, check if the countdown grid exists on this page
    const countdownGrid = document.querySelector('.countdown-grid');
    if (countdownGrid) {
        const countdownCards = document.querySelectorAll('.countdown-card');

        countdownCards.forEach(card => {
            const eventDateStr = card.dataset.date;
            if (!eventDateStr) return;

            const eventDate = new Date(eventDateStr);
            const timerElements = {
                days: card.querySelector('.days'),
                hours: card.querySelector('.hours'),
                mins: card.querySelector('.mins'),
                secs: card.querySelector('.secs')
            };
            
            // Skip cards that don't have a timer (e.g., launched cards)
            if (!timerElements.days) return;

            const updateCountdown = () => {
                const now = new Date();
                const diff = eventDate.getTime() - now.getTime();

                if (diff <= 0) {
                    // This case is handled by the build script, but as a fallback:
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
```This new code first checks if a `.countdown-grid` element exists. If it doesn't (like on our `details.html` page), it simply does nothing, preventing any errors.

**Step 2: Fix the Details Page Layout and Score**

It looks like I made a mistake in the HTML and CSS for the details page. Let's fix it so the hero section appears correctly.

**Action:** Go to your `details.html` file and make this one small but critical change. We need to **move the `<main>` tag** so it is outside the hero section.

**Current `details.html` (Incorrect):**
```html
...
<section id="hero-section">
    ... hero content ...
    <main id="details-content-section">  <!-- WRONG: Main is inside the hero -->
        ... details content ...
    </main>
</section>
...