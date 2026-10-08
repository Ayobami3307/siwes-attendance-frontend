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
const token = localStorage.getItem("token") || sessionStorage.getItem("token");

if (!token) {
    window.location.href = "login.html?role=student";
} else {
    try {
        const tokenParts = token.split(".");

        if (tokenParts.length !== 3) {
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");
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
        sessionStorage.removeItem("token");
        window.location.href = "login.html?role=student";
    }
}

const tableBody = document.querySelector("#table-body");
const monthFilter = document.querySelector("#select-month");
const totalSessions = document.querySelector("#total-sessions");
const attendedSessions = document.querySelector("#attended-sessions");
const attendanceRate = document.querySelector("#attendance-rate");

let attendanceData = [];
let sessionData = [];

let studentName = "";
let studentId = "";
let studentCourse = "";
let studentCourseCode = "";

const formatDate = (value) => {
    if (!value) return "-";

    return new Date(value).toLocaleDateString("en-NG", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
};

const formatTime = (value) => {
    if (!value) return "-";

    return new Date(value).toLocaleTimeString("en-NG", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });
};

const getFilteredSessions = () => {
    const selectedMonth = monthFilter.value;

    if (selectedMonth === "all") {
        return sessionData;
    }

    const month = Number(selectedMonth);

    return sessionData.filter(session => {
        const sessionDate = new Date(session.startTime);
        return sessionDate.getMonth() === month;
    });
};

const getFilteredAttendance = () => {
    const selectedMonth = monthFilter.value;

    if (selectedMonth === "all") {
        return attendanceData;
    }

    const month = Number(selectedMonth);

    return attendanceData.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() === month;
    });
};

const updateAttendanceCards = () => {
    const filteredSessions = getFilteredSessions();
    const filteredAttendance = getFilteredAttendance();

    const total = filteredSessions.length;
    const attended = filteredAttendance.length;

    const rate = total > 0
        ? ((attended / total) * 100).toFixed(1)
        : "0.0";

    totalSessions.textContent = total;
    attendedSessions.textContent = attended;
    attendanceRate.textContent = `${rate}%`;
};

const renderAttendance = (records) => {
    tableBody.replaceChildren();

    if (records.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 4;
        cell.textContent = "No attendance records found for this month.";
        cell.style.textAlign = "center";

        row.appendChild(cell);
        tableBody.appendChild(row);

        return;
    }

    records.forEach(record => {
        const row = document.createElement("tr");

        const dateCell = document.createElement("td");
        dateCell.className = "font-bold";
        dateCell.textContent = formatDate(record.date);

        const timeInCell = document.createElement("td");
        timeInCell.textContent = formatTime(record.date);

        const timeoutCell = document.createElement("td");
        timeoutCell.textContent = formatTime(record.timeOut);

        const statusCell = document.createElement("td");

        const status = document.createElement("span");
        status.className = "status-pill verified";
        status.textContent = record.status;

        statusCell.appendChild(status);

        row.appendChild(dateCell);
        row.appendChild(timeInCell);
        row.appendChild(timeoutCell);
        row.appendChild(statusCell);

        tableBody.appendChild(row);
    });
};

const filterAttendance = () => {
    const filteredRecords = getFilteredAttendance();

    updateAttendanceCards();
    renderAttendance(filteredRecords);
};

const loadProfile = async () => {
    try {
        const response = await fetch("https://siwes-attendance-backend.onrender.com/api/profile", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem("token");
                sessionStorage.removeItem("token");
                window.location.href = "login.html?role=student";
                return;
            }

            alert(data.message || "Unable to load profile.");
            return;
        }

        studentName = data.name;
        studentId = data.studentId;

        if (data.courseId) {
            studentCourse = data.courseId.name || "";
            studentCourseCode = data.courseId.code || "";
        }

        const studentNameElement = document.querySelector(".student-name");
        const studentIdElement = document.querySelector(".student-id");
        const avatarElement = document.querySelector(".avatar");

        if (studentNameElement) {
            studentNameElement.textContent = data.name;
        }

        if (studentIdElement) {
            studentIdElement.textContent = `Matric No. ${data.studentId}`;
        }

        if (avatarElement) {
            if (data.profileImage) {
                avatarElement.innerHTML = `
                    <img src="${data.profileImage}" alt="Profile Picture">
                `;
            } else {
                const nameParts = data.name.trim().split(/\s+/);

                const initials = nameParts.length >= 2
                    ? nameParts[0][0] + nameParts[nameParts.length - 1][0]
                    : nameParts[0][0];

                avatarElement.textContent = initials.toUpperCase();
            }
        }

    } catch (error) {
        console.log(error);
        alert("Unable to connect to the server.");
    }
};

const exportPDF = () => {
    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF();

    const selectedMonth = monthFilter.value;
    const monthName = monthFilter.options[monthFilter.selectedIndex].text;

    const records = getFilteredAttendance();
    const filteredSessions = getFilteredSessions();

    const totalSessionsCount = filteredSessions.length;
    const attendedCount = records.length;

    const rate = totalSessionsCount > 0
        ? ((attendedCount / totalSessionsCount) * 100).toFixed(1)
        : "0.0";

    const generatedDate = new Date().toLocaleDateString("en-NG", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

    const generatedTime = new Date().toLocaleTimeString("en-NG", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });

    pdf.setFillColor(31, 111, 235);
    pdf.rect(0, 0, 210, 32, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.text("NIIT", 14, 14);

    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.text("Smart Attendance Portal", 14, 22);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("ATTENDANCE REPORT", 196, 17, {
        align: "right"
    });

    pdf.setTextColor(40, 40, 40);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text("Student Information", 14, 45);

    pdf.setDrawColor(220, 220, 220);
    pdf.line(14, 48, 196, 48);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);

    pdf.text("Student Name:", 14, 58);
    pdf.text("Matric Number:", 14, 67);
    pdf.text("Period:", 14, 76);
    pdf.text("Course:", 14, 85);

    pdf.setFont("helvetica", "normal");

    pdf.text(studentName || "N/A", 48, 58);
    pdf.text(studentId || "N/A", 48, 67);
    pdf.text(monthName, 48, 76);

    const courseDisplay = studentCourseCode
        ? `${studentCourse} (${studentCourseCode})`
        : studentCourse || "N/A";

    pdf.text(courseDisplay, 48, 85);

    const cardY = 96;
    const cardWidth = 56;
    const cardHeight = 27;
    const gap = 7;

    const cards = [
        {
            x: 14,
            title: "TOTAL SESSIONS",
            value: totalSessionsCount
        },
        {
            x: 14 + cardWidth + gap,
            title: "ATTENDED",
            value: attendedCount
        },
        {
            x: 14 + (cardWidth + gap) * 2,
            title: "ATTENDANCE RATE",
            value: `${rate}%`
        }
    ];

    cards.forEach(card => {
        pdf.setFillColor(248, 250, 252);

        pdf.roundedRect(
            card.x,
            cardY,
            cardWidth,
            cardHeight,
            3,
            3,
            "F"
        );

        pdf.setTextColor(100, 100, 100);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);

        pdf.text(
            card.title,
            card.x + 5,
            cardY + 9
        );

        pdf.setTextColor(31, 111, 235);
        pdf.setFontSize(15);

        pdf.text(
            String(card.value),
            card.x + 5,
            cardY + 20
        );
    });

    const tableData = records.map(record => [
        formatDate(record.date),
        formatTime(record.date),
        formatTime(record.timeOut),
        record.status
    ]);

    pdf.autoTable({
        startY: 133,

        head: [
            ["Date", "Time In", "Time Out", "Status"]
        ],

        body: tableData,

        theme: "grid",

        styles: {
            font: "helvetica",
            fontSize: 9,
            cellPadding: 5,
            textColor: [50, 50, 50],
            lineColor: [220, 220, 220],
            lineWidth: 0.2
        },

        headStyles: {
            fillColor: [31, 111, 235],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            halign: "center"
        },

        bodyStyles: {
            valign: "middle"
        },

        alternateRowStyles: {
            fillColor: [248, 250, 252]
        },

        columnStyles: {
            0: {
                halign: "center"
            },
            1: {
                halign: "center"
            },
            2: {
                halign: "center"
            },
            3: {
                halign: "center"
            }
        },

        didParseCell: function (data) {
            if (
                data.section === "body" &&
                data.column.index === 3
            ) {
                data.cell.styles.textColor = [34, 139, 84];
                data.cell.styles.fontStyle = "bold";
            }
        }
    });

    const pageCount = pdf.internal.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);

        const pageHeight = pdf.internal.pageSize.height;

        pdf.setDrawColor(220, 220, 220);
        pdf.line(14, pageHeight - 18, 196, pageHeight - 18);

        pdf.setTextColor(120, 120, 120);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);

        pdf.text(
            `Generated: ${generatedDate} at ${generatedTime}`,
            14,
            pageHeight - 10
        );

        pdf.text(
            `Page ${i} of ${pageCount}`,
            196,
            pageHeight - 10,
            {
                align: "right"
            }
        );
    }

    const safeMonthName = monthName.replace(/\s+/g, "-");

    pdf.save(
        `NIIT-Attendance-${studentId}-${safeMonthName}.pdf`
    );
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

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem("token");
                sessionStorage.removeItem("token");
                window.location.href = "login.html?role=student";
                return;
            }

            alert(data.message || "Unable to load attendance.");
            return;
        }

        attendanceData = data;

        filterAttendance();

    } catch (error) {
        console.log(error);
        alert("Unable to connect to the server.");
    }
};

const loadSessions = async () => {
    try {
        const response = await fetch("https://siwes-attendance-backend.onrender.com/api/session/student", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem("token");
                sessionStorage.removeItem("token");
                window.location.href = "login.html?role=student";
                return;
            }

            alert(data.message || "Unable to load sessions.");
            return;
        }

        sessionData = data;

        updateAttendanceCards();

    } catch (error) {
        console.log(error);
        alert("Unable to connect to the server.");
    }
};

monthFilter.addEventListener("change", filterAttendance);

document.querySelector("#export-pdf").addEventListener("click", exportPDF);



loadProfile();
loadAttendance();
loadSessions();