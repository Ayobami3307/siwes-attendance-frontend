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

const loadLecturerName = async () => {
    try {
        const response = await fetch("https://siwes-attendance-backend.onrender.com/api/profile", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            return;
        }

        document.querySelector(".lecturer-name").textContent = data.name;

        const nameParts = data.name.trim().split(/\s+/);

        const initials = nameParts
            .slice(0, 2)
            .map(name => name[0].toUpperCase())
            .join("");

        if (data.profileImage) {
            document.querySelector(".avatar").innerHTML = `
                <img src="${data.profileImage}" alt="Profile Picture">
            `;
        } else {
            document.querySelector(".avatar").textContent = initials;
        }

    } catch (error) {
        console.log(error);
    }
};

loadLecturerName();

const attendanceContainer = document.querySelector("#attendanceContainer");
const refreshBtn = document.querySelector("#refreshBtn");
const searchInput = document.querySelector("#searchInput");
const monthFilter = document.querySelector("#monthFilter");

let attendanceRecords = [];

const updateAttendanceSummary = (records) => {
    const totalAttendance = records.length;

    const presentCount = records.filter(record =>
        record.status === "Present"
    ).length;

    const notTimedOutCount = records.filter(record =>
        !record.timeOut
    ).length;

    document.querySelector("#totalAttendance").textContent = totalAttendance;
    document.querySelector("#presentCount").textContent = presentCount;
    document.querySelector("#notTimedOutCount").textContent = notTimedOutCount;
};

const renderAttendanceTable = (records) => {
    if (records.length === 0) {
        attendanceContainer.innerHTML = `<p>No attendance records found.</p>`;
        return;
    }

    attendanceContainer.innerHTML = `
        <div class="attendance-table-wrapper">
            <table class="attendance-table">
                <thead>
                    <tr>
                        <th>Student ID</th>
                        <th>Course</th>
                        <th>Session ID</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Time In</th>
                        <th>Time Out</th>
                    </tr>
                </thead>
                <tbody>
                    ${records.map(record => `
                        <tr>
                            <td>${record.studentId}</td>
                            <td>${record.courseCode || "N/A"} - ${record.courseTitle || "N/A"}</td>
                            <td>${record.sessionId}</td>
                            <td class="${record.status.toLowerCase()}">${record.status}</td>
                            <td>${new Date(record.date).toLocaleDateString()}</td>
                            <td>${new Date(record.date).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit"
                            })}</td>
                            <td>${record.timeOut
                                ? new Date(record.timeOut).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                })
                                : "Not timed out"
                            }</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
};

const filterAttendance = () => {
    const searchValue = searchInput.value.trim().toLowerCase();
    const selectedMonth = monthFilter.value;

    const filteredRecords = attendanceRecords.filter(record => {
        const matchesStudent = record.studentId
            .toLowerCase()
            .includes(searchValue);

        const recordMonth = new Date(record.date).getMonth();

        const matchesMonth =
            selectedMonth === "" ||
            recordMonth === Number(selectedMonth);

        return matchesStudent && matchesMonth;
    });

    updateAttendanceSummary(filteredRecords);
    renderAttendanceTable(filteredRecords);
};

const loadAttendance = async () => {
    try {
        attendanceContainer.innerHTML = `<p>Loading attendance records...</p>`;

        const response = await fetch("https://siwes-attendance-backend.onrender.com/api/attendance/all", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "login.html?role=lecturer";
                return;
            }

            attendanceContainer.innerHTML = `
                <p>${data.message || "Unable to load attendance records."}</p>
            `;

            return;
        }

        attendanceRecords = data;

        console.log(attendanceRecords);

        filterAttendance();

    } catch (error) {
        console.log(error);

        attendanceContainer.innerHTML = `
            <p>Unable to connect to the server.</p>
        `;
    }
};

searchInput.addEventListener("input", filterAttendance);

monthFilter.addEventListener("change", filterAttendance);

refreshBtn.addEventListener("click", loadAttendance);

loadAttendance();

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