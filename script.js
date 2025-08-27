// --- STEP 1: CUSTOMIZE YOUR EVENT ---
// ------------------------------------

// Set the title of your event
const eventTitle = "My Awesome Concert";

// Set the date of your event (Year, Month - 1, Day, Hour, Minute, Second)
// Example: December 31, 2025 at 11:59 PM
const eventDate = new Date(2025, 11, 31, 23, 59, 0);


// --- DO NOT EDIT BELOW THIS LINE ---
// -----------------------------------

document.getElementById('event-title').textContent = eventTitle;
const countdownElement = document.getElementById('countdown');
const messageElement = document.getElementById('message');

const daysEl = document.getElementById('days');
const hoursEl = document.getElementById('hours');
const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');

function updateCountdown() {
    const now = new Date();
    const diff = eventDate.getTime() - now.getTime();

    if (diff <= 0) {
        countdownElement.classList.add('hidden');
        messageElement.classList.remove('hidden');
        clearInterval(timer);
        return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    daysEl.textContent = days;
    hoursEl.textContent = String(hours).padStart(2, '0');
    minutesEl.textContent = String(minutes).padStart(2, '0');
    secondsEl.textContent = String(seconds).padStart(2, '0');
}

const timer = setInterval(updateCountdown, 1000);
updateCountdown();