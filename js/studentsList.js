const adminToken = localStorage.getItem("adminToken");

const studentsTableBody = document.getElementById("studentsTableBody");
const studentSearch = document.getElementById("studentSearch");

// Protect the page
if (!adminToken) {
    window.location.href = "staff-login.html";
}

// Escape values before inserting them into HTML
const escapeHTML = (value) => {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};


// Fetch all students
const loadStudents = async () => {
    try {
        studentsTableBody.innerHTML = `
            <tr>
                <td colspan="7">Loading students...</td>
            </tr>
        `;

        const response = await fetch(
            "https://siwes-attendance-backend.onrender.com/api/admin/students",
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${adminToken}`
                }
            }
        );

        const responseText = await response.text();

        console.log("API Status:", response.status);
        console.log("API Response:", responseText);

        const data = JSON.parse(responseText);
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem("adminToken");
                window.location.href = "staff-login.html";
                return;
            }

            throw new Error(data.message || "Unable to load students.");
        }

        if (!data.success) {
            throw new Error(data.message || "Unable to load students.");
        }

        // Update summary cards
        document.getElementById("totalStudents").textContent =
            data.stats.totalStudents;

        document.getElementById("activeStudents").textContent =
            data.stats.activeStudents;

        document.getElementById("pendingStudents").textContent =
            data.stats.pendingStudents;

        document.getElementById("disabledStudents").textContent =
            data.stats.disabledStudents;

        // Display students
        displayStudents(data.students);

    } catch (error) {
        console.error("Students Loading Error:", error);

        studentsTableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    ${escapeHTML(error.message)}
                </td>
            </tr>
        `;
    }
};


// Display students in the table
const displayStudents = (students) => {

    if (!students || students.length === 0) {
        studentsTableBody.innerHTML = `
            <tr>
                <td colspan="7">No students found.</td>
            </tr>
        `;
        return;
    }

    studentsTableBody.innerHTML = students.map(student => {

        const status = student.accountStatus || "unknown";

        return `
            <tr>
                <td>${escapeHTML(student.studentId)}</td>

                <td>${escapeHTML(student.name)}</td>

                <td>${escapeHTML(student.email)}</td>

                <td>${escapeHTML(student.phoneNumber || "Not provided")}</td>

                <td>${escapeHTML(student.programDuration || "Not specified")}</td>

                <td>
                    <span class="status-badge ${escapeHTML(status)}">
                        ${escapeHTML(status)}
                    </span>
                </td>

                <td>
                    <button class="view-student-btn"
                        data-id="${escapeHTML(student._id)}">
                        View
                    </button>
                </td>
            </tr>
        `;

    }).join("");
};


// Search students by name or student ID
studentSearch.addEventListener("input", async () => {

    const searchValue = studentSearch.value.trim().toLowerCase();

    try {
        const response = await fetch(
            "https://siwes-attendance-backend.onrender.com/api/admin/students",
            {
                headers: {
                    "Authorization": `Bearer ${adminToken}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Search failed.");
        }

        const filteredStudents = data.students.filter(student => {

            const name = (student.name || "").toLowerCase();
            const studentId = (student.studentId || "").toLowerCase();

            return name.includes(searchValue) ||
                   studentId.includes(searchValue);
        });

        displayStudents(filteredStudents);

    } catch (error) {
        console.error("Student Search Error:", error);
    }
});


// Load students when the page opens
loadStudents();