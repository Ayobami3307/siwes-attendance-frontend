const token = localStorage.getItem("token");

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