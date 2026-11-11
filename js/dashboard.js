const token = localStorage.getItem("token") || sessionStorage.getItem("token");

let studentAttendanceData = [];
let studentSessionsData = [];
if (!token) {
    window.location.href = "login.html?role=student";
} else {
    try {
        const tokenParts = token.split(".");

        if (tokenParts.length !== 3) {
            localStorage.removeItem("token");
            window.location.href = "login.html?role=student";
        } else {
            const payload = JSON.parse(atob(tokenParts[1]));

            if (payload.role !== "student") {
                alert("Access denied. Student account required.");
                window.location.href = "login.html?role=student";
            }
        }
    } catch (error) {
        localStorage.removeItem("token");
        window.location.href = "login.html?role=student";
    }
}

const studentName = document.querySelector(".student-name");
const studentId = document.querySelector(".student-id");
const welcomeMessage = document.querySelector(".welcome-text h2");
const headerAvatar = document.querySelector(".avatar");

const todayStatus = document.querySelector("#todayStatus");
const todayLoginTime = document.querySelector("#todayLoginTime");
const todayTimeOut = document.querySelector("#todayTimeOut");
const timeOutBtn = document.querySelector("#timeOutBtn");
const recentAttendanceBody = document.querySelector("#recentAttendanceBody");
const courseName = document.querySelector("#courseName");

const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    const day = String(date.getDate()).padStart(2, "0");

    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
};

const formatTime = (value) => {
    if (!value) return "-";

    return new Date(value).toLocaleTimeString("en-NG", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });
};

const getProfile = async () => {
    try {
        const response = await fetch("https://siwes-attendance-backend.onrender.com/api/profile", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        console.log("Logged in user:", data);

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "login.html?role=student";
                return;
            }

            alert(data.message || "Unable to load your profile.");
            return;
        }

        studentName.textContent = data.name;
        studentId.textContent = `Student ID: ${data.studentId}`;
        if (data.courseId) {
            courseName.textContent = data.courseId.name || "Not assigned";
        } else {
            courseName.textContent = "Not assigned";
        }
        if (data.profileImage) {
            headerAvatar.innerHTML = `
                <img src="${data.profileImage}" alt="Profile Picture">
            `;
        } else {
            const initials = data.name
                .split(" ")
                .map(name => name[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

            headerAvatar.textContent = initials;
        }
        const firstName = data.name.split(" ")[1] || data.name;

        welcomeMessage.innerHTML =
            `Welcome back, ${firstName}! 👋`;

    } catch (error) {
        console.log("Error:", error);
        alert("Unable to connect to the server.");
    }
};

const loadAttendance = async () => {
    console.log("loadAttendance function started");
    try {
        const response = await fetch("https://siwes-attendance-backend.onrender.com/api/attendance", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        studentAttendanceData = data;

        console.log("Attendance:", data);

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "login.html?role=student";
                return;
            }

            alert(data.message || "Unable to load attendance.");
            return;
        }
        const totalClasses = document.querySelector("#totalClasses");
        const classesAttended = document.querySelector("#classesAttended");
        const overallRate = document.querySelector("#overallRate");
        const totalClassesText = document.querySelector("#totalClassesText");
        const classesAttendedText = document.querySelector("#classesAttendedText");
        const overallRateText = document.querySelector("#overallRateText");
        const classesAbsent = document.querySelector("#classesAbsent");

        const sessionsResponse = await fetch(
            "https://siwes-attendance-backend.onrender.com/api/session/student",
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const sessions = await sessionsResponse.json();

        studentSessionsData = sessions;

        if (!sessionsResponse.ok) {
            console.log("Unable to load sessions:", sessions);
            return;
        }

        const total = sessions.length;

        totalClasses.textContent = total;
        totalClassesText.textContent = `${total} sessions recorded`;

        const attended = data.filter(
            record => record.status === "Present"
        ).length;

        const absent = data.filter(
            record => record.status === "Absent"
        ).length;

        classesAbsent.textContent = absent;

        classesAttended.textContent = attended;
        classesAttendedText.textContent = `${attended} sessions attended`;

        classesAbsent.textContent = absent;

        const rate = total > 0
            ? ((attended / total) * 100).toFixed(1)
            : 0;

        overallRate.textContent = `${rate}%`;
        overallRateText.textContent = "Based on your attendance";

        recentAttendanceBody.innerHTML = "";

        data.slice(0, 5).forEach(record => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${formatDate(record.date)}</td>
                <td>${formatTime(record.date)}</td>
                <td>${formatTime(record.timeOut)}</td>
                <td><span class="verified">${record.status}</span></td>
            `;

            recentAttendanceBody.appendChild(row);
        });

        const today = new Date();

        const todayRecord = data.find(record => {
            const recordDate = new Date(record.date);

            return recordDate.getDate() === today.getDate() &&
                recordDate.getMonth() === today.getMonth() &&
                recordDate.getFullYear() === today.getFullYear() &&
                !record.timeOut;
        });

       if (todayRecord) {
        todayStatus.textContent = todayRecord.status;
        todayStatus.classList.remove("pending");
        todayStatus.classList.add("verified");

        todayLoginTime.textContent = formatTime(todayRecord.date);
        todayTimeOut.textContent = "-";

        timeOutBtn.style.display = "block";
    } else {
        const completedToday = data.find(record => {
            const recordDate = new Date(record.date);

            return recordDate.getDate() === today.getDate() &&
                recordDate.getMonth() === today.getMonth() &&
                recordDate.getFullYear() === today.getFullYear();
        });

        if (completedToday) {
            todayStatus.textContent = completedToday.status;
            todayStatus.classList.remove("pending");
            todayStatus.classList.add("verified");

            todayLoginTime.textContent = formatTime(completedToday.date);
            todayTimeOut.textContent = formatTime(completedToday.timeOut);
        } else {
            todayStatus.textContent = "No Attendance";
            todayLoginTime.textContent = "-";
            todayTimeOut.textContent = "-";
        }

        timeOutBtn.style.display = "none";
    }

    } catch (error) {
        console.log("Error:", error);
        alert("Unable to connect to the server.");
    }
};

timeOutBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const confirmTimeOut = confirm("Are you sure you want to time out?");

    if (!confirmTimeOut) {
        return;
    }

    try {
        const response = await fetch("https://siwes-attendance-backend.onrender.com/api/attendance/timeout", {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        console.log("Time out:", data);

        if (!response.ok) {
            alert(data.message);
            return;
        }

        alert("Time out recorded successfully!");

        loadAttendance();

    } catch (error) {
        console.log("Error:", error);
        alert("Unable to connect to the server.");
    }
});

const menuToggle = document.querySelector("#menuToggle");
const sidebar = document.querySelector(".sidebar");

menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    menuToggle.classList.toggle(
        "sidebar-menu-open",
        sidebar.classList.contains("open")
    );

    const icon = menuToggle.querySelector("i");

    if (sidebar.classList.contains("open")) {
        icon.classList.remove("fa-bars");
        icon.classList.add("fa-xmark");
    } else {
        icon.classList.remove("fa-xmark");
        icon.classList.add("fa-bars");
    }
});

getProfile();
loadAttendance();

// STUDENT DASHBOARD SEARCH

const dashboardSearch = document.getElementById("dashboardSearch");
const searchResults = document.getElementById("searchResults");

const studentQuickLinks = [
    {
        title: "Dashboard",
        description: "Student dashboard",
        url: "dashboard.html"
    },
    {
        title: "Attendance",
        description: "View attendance history",
        url: "attendance.html"
    },
    {
        title: "Scan QR",
        description: "Open attendance scanner",
        url: "scan.html"
    },
    {
        title: "Profile",
        description: "View your student profile",
        url: "profile.html"
    },
    {
        title: "Support",
        description: "Get help and support",
        url: "support.html"
    }
];

dashboardSearch.addEventListener("input", () => {
    const query = dashboardSearch.value.trim().toLowerCase();

    searchResults.innerHTML = "";

    if (!query) {
        searchResults.style.display = "none";
        return;
    }

    const results = [];

    // Search quick links
    studentQuickLinks.forEach(item => {
        if (
            item.title.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query)
        ) {
            results.push({
                title: item.title,
                description: item.description,
                url: item.url
            });
        }
    });

    // Search course
    const currentCourse = courseName.textContent;

    if (currentCourse.toLowerCase().includes(query)) {
        results.push({
            title: currentCourse,
            description: "Your assigned course",
            url: "profile.html"
        });
    }

    // Search attendance records
    studentAttendanceData.forEach(record => {
        const date = formatDate(record.date);
        const status = record.status || "";

        if (
            date.toLowerCase().includes(query) ||
            status.toLowerCase().includes(query) ||
            (record.sessionId || "").toLowerCase().includes(query)
        ) {
            results.push({
                title: `${status} - ${date}`,
                description: `Session ID: ${record.sessionId || "N/A"}`,
                url: "attendance.html"
            });
        }
    });

    // Search sessions
    studentSessionsData.forEach(session => {
        const sessionId = session.sessionId || "";
        const sessionDate = formatDate(session.startTime);

        if (
            sessionId.toLowerCase().includes(query) ||
            sessionDate.toLowerCase().includes(query) ||
            (session.courseCode || "").toLowerCase().includes(query) ||
            (session.courseTitle || "").toLowerCase().includes(query)
        ) {
            results.push({
                title: sessionId,
                description: `Session - ${sessionDate}`,
                url: "attendance.html"
            });
        }
    });

    if (results.length === 0) {
        const emptyMessage = document.createElement("div");
        emptyMessage.className = "search-empty";
        emptyMessage.textContent = "No matching results found.";

        searchResults.appendChild(emptyMessage);
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

            searchResults.appendChild(link);
        });
    }

    searchResults.style.display = "block";
});

// Hide results when clicking outside the search bar
document.addEventListener("click", (event) => {
    if (!event.target.closest(".header-search")) {
        searchResults.style.display = "none";
    }
});

// ===================================
// STUDENT NOTIFICATION SYSTEM
// ===================================

const notificationBell = document.getElementById("notificationBell");
const notificationDropdown = document.getElementById("notificationDropdown");
const notificationBadge = document.getElementById("notificationBadge");
const notificationList = document.getElementById("notificationList");
const markAllReadBtn = document.getElementById("markAllReadBtn");

let studentNotifications = [];

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

        studentNotifications = data.notifications || [];

        // Update unread badge
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

    if (studentNotifications.length === 0) {
        notificationList.innerHTML = `
            <p class="notification-empty">
                You're all caught up. No notifications yet.
            </p>
        `;
        return;
    }

    studentNotifications.forEach(notification => {
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


// OPEN AND CLOSE NOTIFICATION DROPDOWN
notificationBell.addEventListener("click", (event) => {
    event.stopPropagation();

    notificationDropdown.classList.toggle("show");
});


// CLOSE DROPDOWN WHEN CLICKING OUTSIDE
document.addEventListener("click", (event) => {
    if (
        !event.target.closest(".notification-wrapper")
    ) {
        notificationDropdown.classList.remove("show");
    }
});


// LOAD NOTIFICATIONS WHEN DASHBOARD OPENS
loadNotifications();


// REFRESH NOTIFICATIONS EVERY 30 SECONDS
setInterval(loadNotifications, 30000);