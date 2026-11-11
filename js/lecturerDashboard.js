const token = localStorage.getItem("token");

let lecturerAttendanceData = [];
let lecturerSessionsData = [];
let lecturerTicketsData = [];
let lecturerProfileData = {};

if (!token) {
    window.location.href = "login.html?role=lecturer";
} else {
    try {
        const tokenParts = token.split(".");

        if (tokenParts.length !== 3) {
            localStorage.removeItem("token");
            window.location.href = "login.html?role=lecturer";
        } else {
            const payload = JSON.parse(atob(tokenParts[1]));

            if (payload.role !== "lecturer") {
                alert("Access denied. Lecturer account required.");
                window.location.href = "dashboard.html";
            }
        }
    } catch (error) {
        localStorage.removeItem("token");
        window.location.href = "login.html?role=lecturer";
    }
}

const totalSessions = document.querySelector("#totalSessions");
const totalAttendance = document.querySelector("#totalAttendance");
const todayAttendance = document.querySelector("#todayAttendance");
const pendingTickets = document.querySelector("#pendingTickets");
const recentAttendance = document.querySelector("#recentAttendance");
const lecturerName = document.querySelector(".lecturer-name");
const avatar = document.querySelector(".avatar");
const courseTag = document.querySelector(".course-tag");

const loadDashboard = async () => {
    try {
        const [attendanceResponse, supportResponse, profileResponse, sessionResponse] = await Promise.all([
            fetch("https://siwes-attendance-backend.onrender.com/api/attendance/all", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }),
            fetch("https://siwes-attendance-backend.onrender.com/api/support", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }),
            fetch("https://siwes-attendance-backend.onrender.com/api/profile", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }),
            fetch("https://siwes-attendance-backend.onrender.com/api/session", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            })
        ]);

        const attendance = await attendanceResponse.json();
        const tickets = await supportResponse.json();
        const profile = await profileResponse.json();
        const sessions = await sessionResponse.json();

        lecturerAttendanceData = Array.isArray(attendance) ? attendance : [];
        lecturerTicketsData = Array.isArray(tickets) ? tickets : [];
        lecturerProfileData = profile || {};
        lecturerSessionsData = Array.isArray(sessions) ? sessions : [];

        if (
            !attendanceResponse.ok ||
            !supportResponse.ok ||
            !profileResponse.ok ||
            !sessionResponse.ok
        ) {
            if (
                attendanceResponse.status === 401 ||
                supportResponse.status === 401 ||
                profileResponse.status === 401 ||
                sessionResponse.status === 401
            ) {
                localStorage.removeItem("token");
                window.location.href = "login.html?role=lecturer";
                return;
            }

            alert("Unable to load dashboard data.");
            return;
        }

        totalAttendance.textContent = attendance.length;

        const today = new Date();

        const todayRecords = attendance.filter(record => {
            const recordDate = new Date(record.date);

            return recordDate.getDate() === today.getDate() &&
                   recordDate.getMonth() === today.getMonth() &&
                   recordDate.getFullYear() === today.getFullYear();
        });

        todayAttendance.textContent = todayRecords.length;
        totalSessions.textContent = sessions.length;

        const pending = tickets.filter(ticket => ticket.status === "Pending");
        pendingTickets.textContent = pending.length;

        const displayName = profile.name || "Lecturer";
        lecturerName.textContent = displayName;

        const nameParts = displayName.trim().split(/\s+/);

       const initials = nameParts
            .slice(0, 2)
            .map(name => name[0].toUpperCase())
            .join("");

        if (profile.profileImage) {
            avatar.innerHTML = `
                <img src="${profile.profileImage}" alt="Profile Picture">
            `;
        } else {
            avatar.textContent = initials;
        }

        if (courseTag) {
            const courseName = profile.courseId?.name || "Not set";
            const courseCode = profile.courseId?.code || "";

            courseTag.innerHTML = `
                <i class="fa-solid fa-graduation-cap"></i>
                Active Course: ${courseCode} - ${courseName}
            `;
        }

        const recentRecords = attendance.slice(0, 5);

        if (recentRecords.length === 0) {
            recentAttendance.innerHTML = "<p>No attendance records found.</p>";
        } else {
            recentAttendance.innerHTML = recentRecords.map(record => `
                <div class="attendance-item">
                    <p><strong>Student ID:</strong> ${record.studentId}</p>
                    <span>${new Date(record.date).toLocaleString()}</span>
                </div>
            `).join("");
        }

    } catch (error) {
        console.log(error);
        recentAttendance.innerHTML = "<p>Unable to connect to the server.</p>";
    }
};
const menuToggle = document.querySelector("#menuToggle");
const sidebar = document.querySelector(".sidebar");

menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");

    const icon = menuToggle.querySelector("i");

    if (sidebar.classList.contains("open")) {
        icon.classList.remove("fa-bars");
        icon.classList.add("fa-xmark");
    } else {
        icon.classList.remove("fa-xmark");
        icon.classList.add("fa-bars");
    }
});

loadDashboard();

// LECTURER DASHBOARD SEARCH
const lecturerDashboardSearch = document.getElementById("lecturerDashboardSearch");
const lecturerSearchResults = document.getElementById("lecturerSearchResults");

const lecturerQuickLinks = [
    {
        title: "Dashboard",
        description: "Lecturer dashboard",
        url: "lecturerDashboard.html"
    },
    {
        title: "Create Session",
        description: "Create an attendance session",
        url: "lecturerSession.html"
    },
    {
        title: "Attendance Records",
        description: "View student attendance",
        url: "lecturerAttendance.html"
    },
    {
        title: "Profile",
        description: "View lecturer profile",
        url: "lecturerProfile.html"
    },
    {
        title: "Support Tickets",
        description: "View support tickets",
        url: "lecturerSupport.html"
    }
];

if (lecturerDashboardSearch && lecturerSearchResults) {

    lecturerDashboardSearch.addEventListener("input", () => {
        const query = lecturerDashboardSearch.value.trim().toLowerCase();

        lecturerSearchResults.innerHTML = "";

        if (!query) {
            lecturerSearchResults.style.display = "none";
            return;
        }

        const results = [];

        // Search dashboard pages
        lecturerQuickLinks.forEach(item => {
            if (
                item.title.toLowerCase().includes(query) ||
                item.description.toLowerCase().includes(query)
            ) {
                results.push(item);
            }
        });

        // Search attendance records
        lecturerAttendanceData.forEach(record => {
            const studentId = String(record.studentId || "");
            const sessionId = String(record.sessionId || "");
            const status = String(record.status || "");
            const date = record.date
                ? new Date(record.date).toLocaleDateString()
                : "";

            if (
                studentId.toLowerCase().includes(query) ||
                sessionId.toLowerCase().includes(query) ||
                status.toLowerCase().includes(query) ||
                date.toLowerCase().includes(query)
            ) {
                results.push({
                    title: `Student: ${studentId || "Unknown"}`,
                    description: `Attendance: ${date || "No date"} | Session: ${sessionId || "N/A"}`,
                    url: "lecturerAttendance.html"
                });
            }
        });

        // Search sessions
        lecturerSessionsData.forEach(session => {
            const sessionId = String(session.sessionId || "");
            const courseCode = String(session.courseCode || "");
            const courseTitle = String(session.courseTitle || "");
            const sessionDate = session.startTime
                ? new Date(session.startTime).toLocaleDateString()
                : "";

            if (
                sessionId.toLowerCase().includes(query) ||
                courseCode.toLowerCase().includes(query) ||
                courseTitle.toLowerCase().includes(query) ||
                sessionDate.toLowerCase().includes(query)
            ) {
                results.push({
                    title: sessionId || courseCode || "Attendance Session",
                    description: `${courseCode} ${courseTitle} ${sessionDate}`.trim(),
                    url: "lecturerAttendance.html"
                });
            }
        });

        // Search support tickets
        lecturerTicketsData.forEach(ticket => {
            const subject = String(ticket.subject || "");
            const status = String(ticket.status || "");

            if (
                subject.toLowerCase().includes(query) ||
                status.toLowerCase().includes(query)
            ) {
                results.push({
                    title: subject || "Support Ticket",
                    description: `Status: ${status || "Unknown"}`,
                    url: "lecturerSupport.html"
                });
            }
        });

        // Display results
        if (results.length === 0) {
            const emptyMessage = document.createElement("div");
            emptyMessage.className = "search-empty";
            emptyMessage.textContent = "No matching results found.";

            lecturerSearchResults.appendChild(emptyMessage);
        } else {
            results.slice(0, 10).forEach(result => {
                const link = document.createElement("a");
                link.href = result.url;
                link.className = "search-result-item";

                const title = document.createElement("strong");
                title.textContent = result.title;

                const description = document.createElement("small");
                description.textContent = result.description;

                link.appendChild(title);
                link.appendChild(description);

                lecturerSearchResults.appendChild(link);
            });
        }

        lecturerSearchResults.style.display = "block";
    });

    document.addEventListener("click", event => {
        if (!event.target.closest(".header-search")) {
            lecturerSearchResults.style.display = "none";
        }
    });
}

// ===================================
// LECTURER NOTIFICATION SYSTEM
// ===================================

const notificationBell = document.getElementById("notificationBell");
const notificationDropdown = document.getElementById("notificationDropdown");
const notificationBadge = document.getElementById("notificationBadge");
const notificationList = document.getElementById("notificationList");
const markAllReadBtn = document.getElementById("markAllReadBtn");

let lecturerNotifications = [];

// LOAD NOTIFICATIONS
const loadNotifications = async () => {
    try {
        const response = await fetch(
            "https://siwes-attendance-backend.onrender.com/api/notifications",
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Notification Error:", data);
            return;
        }

        lecturerNotifications = data.notifications || [];

        const unreadCount = data.unreadCount || 0;

        if (unreadCount > 0) {
            notificationBadge.textContent =
                unreadCount > 99 ? "99+" : unreadCount;

            notificationBadge.style.display = "flex";
        } else {
            notificationBadge.style.display = "none";
        }

        displayNotifications();

    } catch (error) {
        console.error("Unable to load notifications:", error);
    }
};


// DISPLAY NOTIFICATIONS
const displayNotifications = () => {
    notificationList.innerHTML = "";

    if (lecturerNotifications.length === 0) {
        notificationList.innerHTML = `
            <p class="notification-empty">
                You're all caught up. No notifications yet.
            </p>
        `;
        return;
    }

    lecturerNotifications.forEach(notification => {
        const item = document.createElement("div");

        item.className = notification.isRead
            ? "notification-item"
            : "notification-item unread";

        const title = document.createElement("h4");
        title.textContent = notification.title;

        const message = document.createElement("p");
        message.textContent = notification.message;

        const date = document.createElement("small");
        date.textContent = new Date(
            notification.createdAt
        ).toLocaleString("en-NG", {
            dateStyle: "medium",
            timeStyle: "short"
        });

        item.appendChild(title);
        item.appendChild(message);
        item.appendChild(date);

        item.addEventListener("click", async () => {
            if (!notification.isRead) {
                await markNotificationAsRead(notification._id);
            }

            if (notification.link) {
                window.location.href = notification.link;
            }
        });

        notificationList.appendChild(item);
    });
};


// MARK ONE NOTIFICATION AS READ
const markNotificationAsRead = async (id) => {
    try {
        const response = await fetch(
            `https://siwes-attendance-backend.onrender.com/api/notifications/${id}/read`,
            {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Mark as read error:", data);
            return;
        }

        await loadNotifications();

    } catch (error) {
        console.error("Unable to mark notification as read:", error);
    }
};


// MARK ALL NOTIFICATIONS AS READ
markAllReadBtn.addEventListener("click", async () => {
    try {
        const response = await fetch(
            "https://siwes-attendance-backend.onrender.com/api/notifications/read-all",
            {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Mark all as read error:", data);
            return;
        }

        await loadNotifications();

    } catch (error) {
        console.error("Unable to mark all notifications as read:", error);
    }
});


// OPEN AND CLOSE DROPDOWN
notificationBell.addEventListener("click", (event) => {
    event.stopPropagation();
    notificationDropdown.classList.toggle("show");
});


// CLOSE DROPDOWN WHEN CLICKING OUTSIDE
document.addEventListener("click", (event) => {
    if (!event.target.closest(".notification-wrapper")) {
        notificationDropdown.classList.remove("show");
    }
});


// LOAD NOTIFICATIONS
loadNotifications();


// REFRESH EVERY 30 SECONDS
setInterval(loadNotifications, 30000);