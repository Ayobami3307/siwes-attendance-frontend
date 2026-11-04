// GET ADMIN TOKEN
window.adminToken = localStorage.getItem("adminToken");

// PROTECT DASHBOARD
if (!window.adminToken) {
window.location.replace("staffLogin.html");
}

// LOGOUT
const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {
logoutButton.addEventListener("click", () => {
const confirmLogout = confirm("Are you sure you want to log out?");

    if (confirmLogout) {
        localStorage.removeItem("adminToken");
        window.location.href = "staffLogin.html";
    }
});

}

// ==============================
// CALENDAR
// ==============================

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

// WEEKDAY HEADINGS
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

weekdays.forEach(day => {
    const dayElement = document.createElement("div");

    dayElement.classList.add("calendar-weekday");
    dayElement.textContent = day;

    calendar.appendChild(dayElement);
});

// EMPTY SPACES BEFORE FIRST DAY
for (let i = 0; i < firstDay; i++) {
    const emptyDay = document.createElement("div");

    emptyDay.classList.add("calendar-day", "empty");

    calendar.appendChild(emptyDay);
}

// CALENDAR DATES
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

// PREVIOUS MONTH
if (previousMonth) {
previousMonth.addEventListener("click", () => {
currentDate.setMonth(currentDate.getMonth() - 1);
renderCalendar();
});
}

// NEXT MONTH
if (nextMonth) {
nextMonth.addEventListener("click", () => {
currentDate.setMonth(currentDate.getMonth() + 1);
renderCalendar();
});
}

// DISPLAY CALENDAR
renderCalendar();

// ==============================
// LOAD DASHBOARD STATISTICS
// ==============================

let accountChart = null;

const loadDashboardStats = async () => {


try {

    const response = await fetch(
        "https://siwes-attendance-backend.onrender.com/api/admin/dashboard-stats",
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${window.adminToken}`
            }
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Unable to load statistics.");
    }

    const stats = data.stats;

    // UPDATE STATISTICS CARDS
    document.getElementById("totalStudents").textContent =
        stats.totalStudents;

    document.getElementById("totalLecturers").textContent =
        stats.totalLecturers;

    document.getElementById("activeAccounts").textContent =
        stats.activeAccounts;

    document.getElementById("pendingAccounts").textContent =
        stats.pendingAccounts;


    // ==============================
    // DOUGHNUT CHART
    // ==============================

    const chartCanvas = document.getElementById("registrationChart");

    if (!chartCanvas) {
        console.error("Chart canvas not found.");
        return;
    }

    if (typeof Chart === "undefined") {
        console.error("Chart.js has not been loaded.");
        return;
    }

    const disabledAccounts = stats.disabledAccounts || 0;

    if (accountChart) {
        accountChart.destroy();
    }

    accountChart = new Chart(chartCanvas, {

        type: "doughnut",

        data: {
            labels: [
                "Active Accounts",
                "Pending Activations",
                "Disabled Accounts"
            ],

            datasets: [{
                data: [
                    stats.activeAccounts,
                    stats.pendingAccounts,
                    disabledAccounts
                ],

                backgroundColor: [
                    "#22c55e",
                    "#f59e0b",
                    "#ef4444"
                ],

                hoverOffset: 8,
                borderWidth: 0
            }]
        },

        options: {

            responsive: true,
            maintainAspectRatio: false,

            cutout: "65%",

            plugins: {

                legend: {
                    position: "bottom",

                    labels: {
                        padding: 18,
                        usePointStyle: true,
                        pointStyle: "circle"
                    }
                },

                tooltip: {
                    enabled: true
                }
            }
        }
    });

} catch (error) {

    console.error("Dashboard Statistics Error:", error);

}


};

// LOAD STATISTICS
loadDashboardStats();
