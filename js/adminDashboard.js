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

// ADMIN GLOBAL DASHBOARD SEARCH

const adminSearch = document.getElementById("adminSearch");

if (adminSearch) {

let searchData = {
    students: [],
    lecturers: [],
    courses: []
};

let searchLoaded = false;
let searchLoading = false;
let searchTimeout;

// CREATE SEARCH RESULTS CONTAINER
const searchResults = document.createElement("div");

searchResults.id = "adminSearchResults";

adminSearch.parentElement.style.position = "relative";
adminSearch.parentElement.appendChild(searchResults);

// SEARCH STYLING
const searchStyle = document.createElement("style");

searchStyle.textContent = `
    #adminSearchResults {
        display: none;
        position: absolute;
        top: calc(100% + 10px);
        right: 0;
        width: 350px;
        max-height: 400px;
        overflow-y: auto;
        background: white;
        border-radius: 10px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        z-index: 9999;
        border: 1px solid #e5e7eb;
    }

    .admin-search-result {
        display: block;
        padding: 12px 15px;
        text-decoration: none;
        color: #1e293b;
        border-bottom: 1px solid #f1f5f9;
        cursor: pointer;
    }

    .admin-search-result:hover {
        background: #f1f5f9;
    }

    .admin-search-result strong {
        display: block;
        font-size: 14px;
    }

    .admin-search-result small {
        display: block;
        color: #64748b;
        margin-top: 4px;
    }

    .admin-search-category {
        padding: 10px 15px;
        background: #f8fafc;
        color: #64748b;
        font-size: 11px;
        font-weight: bold;
        text-transform: uppercase;
    }

    .admin-search-empty {
        padding: 18px;
        text-align: center;
        color: #64748b;
    }
`;

document.head.appendChild(searchStyle);


// LOAD SEARCH DATA
const loadSearchData = async () => {

    if (searchLoaded || searchLoading) return;

    searchLoading = true;

    try {

        const headers = {
            Authorization: `Bearer ${window.adminToken}`
        };

        const [studentsResponse, lecturersResponse, coursesResponse] =
            await Promise.all([

                fetch(
                    "https://siwes-attendance-backend.onrender.com/api/admin/students",
                    { headers }
                ),

                fetch(
                    "https://siwes-attendance-backend.onrender.com/api/admin/lecturers",
                    { headers }
                ),

                fetch(
                    "https://siwes-attendance-backend.onrender.com/api/courses",
                    { headers }
                )

            ]);

        if (studentsResponse.ok) {
            const data = await studentsResponse.json();
            searchData.students = data.students || [];
        }

        if (lecturersResponse.ok) {
            const data = await lecturersResponse.json();
            searchData.lecturers = data.lecturers || [];
        }

        if (coursesResponse.ok) {
            const data = await coursesResponse.json();

            searchData.courses = Array.isArray(data)
                ? data
                : data.courses || [];
        }

        searchLoaded = true;

    } catch (error) {

        console.error("Global Search Error:", error);

    } finally {

        searchLoading = false;

    }
};


// CHECK WHETHER A RECORD MATCHES
const matchesSearch = (record, query) => {

    const searchableValues = [
        record.name,
        record.studentId,
        record.email,
        record.phoneNumber,
        record.accountStatus,
        record.course,
        record.courseCode,
        record.courseName,
        record.code,
        record.title
    ];

    return searchableValues.some(value =>
        String(value || "")
            .toLowerCase()
            .includes(query)
    );
};


// CREATE RESULT ELEMENT
const createSearchResult = (title, description, destination) => {

    const result = document.createElement("a");

    result.className = "admin-search-result";
    result.href = destination;

    const strong = document.createElement("strong");
    strong.textContent = title;

    const small = document.createElement("small");
    small.textContent = description;

    result.appendChild(strong);
    result.appendChild(small);

    return result;
};


// DISPLAY SEARCH RESULTS
const displaySearchResults = (query) => {

    searchResults.innerHTML = "";

    const results = [];

    // STUDENTS
    searchData.students.forEach(student => {

        if (matchesSearch(student, query)) {

            results.push({
                category: "Students",
                element: createSearchResult(
                    student.name || "Unnamed Student",
                    `${student.studentId || ""} • ${student.accountStatus || ""}`,
                    "studentsList.html"
                )
            });

        }

    });


    // LECTURERS
    searchData.lecturers.forEach(lecturer => {

        if (matchesSearch(lecturer, query)) {

            results.push({
                category: "Lecturers",
                element: createSearchResult(
                    lecturer.name || "Unnamed Lecturer",
                    `${lecturer.studentId || ""} • ${lecturer.accountStatus || ""}`,
                    "lecturersList.html"
                )
            });

        }

    });


    // COURSES
    searchData.courses.forEach(course => {

        if (matchesSearch(course, query)) {

            results.push({
                category: "Courses",
                element: createSearchResult(
                    course.courseName || course.name || course.title || course.courseCode || course.code || "Course",
                    course.courseCode || course.code || "Course Management",
                    "courseManagement.html"
                )
            });

        }

    });


    // ADMIN DASHBOARD PAGES
    const adminPages = [
        { name: "Dashboard", keywords: "home overview statistics", link: "adminDashboard.html" },
        { name: "Students List", keywords: "students student accounts", link: "studentsList.html" },
        { name: "Lecturers List", keywords: "lecturers lecturer accounts", link: "lecturersList.html" },
        { name: "Create Account", keywords: "create account register new user", link: "createId.html" },
        { name: "Course Management", keywords: "courses subjects manage courses", link: "courseManagement.html" },
        { name: "Pending Activations", keywords: "pending activation activate accounts", link: "pendingActivations.html" },
        { name: "Manage Accounts", keywords: "manage search disable reactivate accounts", link: "manageAccounts.html" },
        { name: "Admin Profile", keywords: "profile administrator details", link: "adminProfile.html" },
        { name: "Account Settings", keywords: "settings password username", link: "accountSettings.html" }
    ];

    adminPages.forEach(page => {

        if (
            page.name.toLowerCase().includes(query) ||
            page.keywords.includes(query)
        ) {

            results.push({
                category: "Dashboard Pages",
                element: createSearchResult(
                    page.name,
                    "Open dashboard section",
                    page.link
                )
            });

        }

    });


    // NO RESULTS
    if (results.length === 0) {

        searchResults.innerHTML =
            `<div class="admin-search-empty">No results found.</div>`;

        searchResults.style.display = "block";

        return;
    }


    // GROUP RESULTS BY CATEGORY
    let currentCategory = "";

    results.slice(0, 15).forEach(result => {

        if (currentCategory !== result.category) {

            currentCategory = result.category;

            const heading = document.createElement("div");

            heading.className = "admin-search-category";
            heading.textContent = currentCategory;

            searchResults.appendChild(heading);

        }

        searchResults.appendChild(result.element);

    });

    searchResults.style.display = "block";

};


// SEARCH WHEN TYPING
adminSearch.addEventListener("input", async () => {

    clearTimeout(searchTimeout);

    const query = adminSearch.value.trim().toLowerCase();

    if (!query) {

        searchResults.style.display = "none";
        return;

    }

    searchResults.innerHTML =
        `<div class="admin-search-empty">Searching...</div>`;

    searchResults.style.display = "block";

    searchTimeout = setTimeout(async () => {

        await loadSearchData();

        displaySearchResults(query);

    }, 350);

});


// CLOSE RESULTS WHEN CLICKING OUTSIDE
document.addEventListener("click", event => {

    if (
        !adminSearch.contains(event.target) &&
        !searchResults.contains(event.target)
    ) {

        searchResults.style.display = "none";

    }

});


// SHOW RESULTS AGAIN WHEN SEARCH FIELD IS FOCUSED
adminSearch.addEventListener("focus", () => {

    const query = adminSearch.value.trim().toLowerCase();

    if (query && searchLoaded) {
        displaySearchResults(query);
    }

});


}

// ==========================================
// ADMIN HELP CENTRE
// ==========================================

const helpButton = document.getElementById("helpButton");

if (helpButton) {

    // CREATE HELP MODAL
    const helpModal = document.createElement("div");

    helpModal.id = "adminHelpModal";

    helpModal.innerHTML = `
        <div class="help-overlay">
            <div class="help-container">

                <div class="help-header">
                    <div>
                        <h2>Help Centre</h2>
                        <p>How can we help you?</p>
                    </div>

                    <button id="closeHelp">&times;</button>
                </div>

                <div class="help-content">

                    <h3>Frequently Asked Questions</h3>

                    <details>
                        <summary>How do I create a student account?</summary>
                        <p>
                            Open Create Account from the sidebar.
                            Select Student, enter the required details
                            and submit the form.
                        </p>
                    </details>

                    <details>
                        <summary>How do I create a lecturer account?</summary>
                        <p>
                            Open Create Account, select Lecturer,
                            provide the required details and submit.
                        </p>
                    </details>

                    <details>
                        <summary>How do I activate a pending account?</summary>
                        <p>
                            Open Pending Activations to view accounts
                            awaiting activation.
                        </p>
                    </details>

                    <details>
                        <summary>How do I disable an account?</summary>
                        <p>
                            Open Manage Accounts or the relevant
                            account management page to manage
                            account status.
                        </p>
                    </details>

                    <details>
                        <summary>How do I manage courses?</summary>
                        <p>
                            Open Course Management to view and
                            manage available courses.
                        </p>
                    </details>

                    <details>
                        <summary>How do I update my administrator profile?</summary>
                        <p>
                            Open Admin Profile or Account Settings
                            to manage your administrator information.
                        </p>
                    </details>

                    <h3>Need More Help?</h3>

                    <div class="help-support">
                        <p>
                            If you experience a technical problem,
                            contact your NIIT system support personnel.
                        </p>

                        <p>
                            Please provide a description of the problem
                            and any error message displayed.
                        </p>
                    </div>

                </div>

                <div class="help-footer">
                    <span>NIIT Smart Attendance</span>
                    <button id="closeHelpFooter">Close</button>
                </div>

            </div>
        </div>
    `;

    document.body.appendChild(helpModal);

    // HIDE HELP CENTRE WHEN PAGE LOADS
    helpModal.style.display = "none";


    // HELP CENTRE STYLING
    const helpStyle = document.createElement("style");

    helpStyle.textContent = `
        #adminHelpModal .help-overlay {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.65);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 15px;
        }

        .help-container {
            background: white;
            width: 100%;
            max-width: 550px;
            max-height: 85vh;
            overflow-y: auto;
            border-radius: 14px;
            box-shadow: 0 15px 40px rgba(0,0,0,0.2);
        }

        .help-header {
            background: #102a43;
            color: white;
            padding: 22px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .help-header h2 {
            margin: 0 0 5px;
        }

        .help-header p {
            margin: 0;
            color: #cbd5e1;
        }

        .help-header button {
            background: none;
            border: none;
            color: white;
            font-size: 28px;
            cursor: pointer;
        }

        .help-content {
            padding: 22px;
        }

        .help-content h3 {
            color: #102a43;
            margin: 10px 0 15px;
        }

        .help-content details {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 13px;
            margin-bottom: 10px;
        }

        .help-content summary {
            cursor: pointer;
            font-weight: 600;
            color: #1e293b;
        }

        .help-content details p {
            color: #64748b;
            line-height: 1.6;
            margin-bottom: 0;
        }

        .help-support {
            background: #f1f5f9;
            padding: 15px;
            border-radius: 8px;
            color: #475569;
            line-height: 1.6;
        }

        .help-footer {
            border-top: 1px solid #e2e8f0;
            padding: 15px 22px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: #64748b;
        }

        .help-footer button {
            background: #102a43;
            color: white;
            border: none;
            padding: 9px 20px;
            border-radius: 6px;
            cursor: pointer;
        }

        @media (max-width: 500px) {
            .help-container {
                max-height: 90vh;
            }
        }
    `;

    document.head.appendChild(helpStyle);


    // OPEN HELP CENTRE
    helpButton.addEventListener("click", () => {
        helpModal.style.display = "block";
    });


    // CLOSE HELP CENTRE
    const closeHelp = () => {
        helpModal.style.display = "none";
    };

    document.getElementById("closeHelp")
        .addEventListener("click", closeHelp);

    document.getElementById("closeHelpFooter")
        .addEventListener("click", closeHelp);

    helpModal.querySelector(".help-overlay")
        .addEventListener("click", event => {

            if (event.target.classList.contains("help-overlay")) {
                closeHelp();
            }

        });

    // CLOSE WITH ESCAPE KEY
    document.addEventListener("keydown", event => {

        if (event.key === "Escape") {
            closeHelp();
        }

    });

}

// LOAD STATISTICS
loadDashboardStats();