// Get admin token
window.adminToken = localStorage.getItem("adminToken");

// Protect dashboard
if (!adminToken) {
    window.location.href = "staff-login.html";
}

// LOGOUT
const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {
    logoutButton.addEventListener("click", () => {
        const confirmLogout = confirm("Are you sure you want to log out?");

        if (confirmLogout) {
            localStorage.removeItem("adminToken");
            window.location.href = "staff-login.html";
        }
    });
}

// CALENDAR

const calendar = document.getElementById("calendar");
const calendarMonth = document.getElementById("calendarMonth");

const previousMonth = document.getElementById("previousMonth");
const nextMonth = document.getElementById("nextMonth");

let currentDate = new Date();

function renderCalendar() {

    if (!calendar || !calendarMonth) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    const today = new Date();

    calendarMonth.textContent = currentDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric"
    });

    calendar.innerHTML = "";

    // Weekday headings
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    weekdays.forEach(day => {
        const dayElement = document.createElement("div");

        dayElement.classList.add("calendar-weekday");
        dayElement.textContent = day;

        calendar.appendChild(dayElement);
    });

    // Empty spaces before first day
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement("div");

        emptyDay.classList.add("calendar-day", "empty");

        calendar.appendChild(emptyDay);
    }

    // Calendar dates
    for (let day = 1; day <= lastDate; day++) {

        const dayElement = document.createElement("div");

        dayElement.classList.add("calendar-day");
        dayElement.textContent = day;

        if (
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
        ) {
            dayElement.classList.add("today");
        }

        calendar.appendChild(dayElement);
    }
}


// Previous month
if (previousMonth) {
    previousMonth.addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
}


// Next month
if (nextMonth) {
    nextMonth.addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
}


// Display calendar
renderCalendar();

// LOAD DASHBOARD STATISTICS

const loadDashboardStats = async () => {
    try {
        const response = await fetch(
            "https://siwes-attendance-backend.onrender.com/api/admin/dashboard-stats",
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${window.adminToken}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load statistics.");
        }

        document.getElementById("totalStudents").textContent =
            data.stats.totalStudents;

        document.getElementById("totalLecturers").textContent =
            data.stats.totalLecturers;

        document.getElementById("activeAccounts").textContent =
            data.stats.activeAccounts;

        document.getElementById("pendingAccounts").textContent =
            data.stats.pendingAccounts;

    } catch (error) {
        console.error("Dashboard Statistics Error:", error);
    }
};


// Load statistics
loadDashboardStats();