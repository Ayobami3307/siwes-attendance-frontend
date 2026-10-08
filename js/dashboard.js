const token = localStorage.getItem("token") || sessionStorage.getItem("token");

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
        studentId.textContent = `Matric No. ${data.studentId}`;
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
    try {
        const response = await fetch("https://siwes-attendance-backend.onrender.com/api/attendance", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

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

        totalClasses.textContent = data.length;
        totalClassesText.textContent = `${data.length} sessions recorded`;

        const attended = data.filter(record => record.status === "Present").length;

        classesAttended.textContent = attended;
        classesAttendedText.textContent = `${attended} sessions attended`;

        const rate = data.length > 0
            ? ((attended / data.length) * 100).toFixed(1)
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
                   recordDate.getFullYear() === today.getFullYear();
        });

        if (todayRecord) {
            todayStatus.textContent = todayRecord.status;
            todayStatus.classList.remove("pending");
            todayStatus.classList.add("verified");

            todayLoginTime.textContent = formatTime(todayRecord.date);
            todayTimeOut.textContent = formatTime(todayRecord.timeOut);

            if (todayRecord.timeOut) {
                timeOutBtn.style.display = "none";
            } else {
                timeOutBtn.style.display = "block";
            }
        } else {
            todayStatus.textContent = "No Attendance";
            todayLoginTime.textContent = "-";
            todayTimeOut.textContent = "-";
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