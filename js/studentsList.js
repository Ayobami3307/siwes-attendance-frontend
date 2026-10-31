const adminToken = localStorage.getItem("adminToken");

const studentsTableBody = document.getElementById("studentsTableBody");
const studentSearch = document.getElementById("studentSearch");

// Modal elements
const studentModal = document.getElementById("studentModal");
const closeStudentModal = document.getElementById("closeStudentModal");

// Store students locally
let allStudents = [];


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


// Format date
const formatDate = (date) => {

    if (!date) return "Not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "Not available";
    }

    return parsedDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });
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

        const data = await response.json();

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

        // Store student records
        allStudents = data.students || [];

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
        displayStudents(allStudents);

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
                    <button
                        class="view-student-btn"
                        data-id="${escapeHTML(student._id)}">
                        View
                    </button>
                </td>

            </tr>
        `;

    }).join("");
};


// SEARCH STUDENTS
studentSearch.addEventListener("input", () => {

    const searchValue = studentSearch.value.trim().toLowerCase();

    const filteredStudents = allStudents.filter(student => {

        const name = (student.name || "").toLowerCase();

        const studentId = (student.studentId || "").toLowerCase();

        return name.includes(searchValue) ||
               studentId.includes(searchValue);
    });

    displayStudents(filteredStudents);
});


// OPEN STUDENT DETAILS MODAL
const openStudentModal = (student) => {

    if (!student) return;

    document.getElementById("modalAvatar").textContent =
        (student.name || "S").charAt(0).toUpperCase();

    document.getElementById("modalStudentName").textContent =
        student.name || "Not available";

    document.getElementById("modalStudentId").textContent =
        student.studentId || "Not available";

    document.getElementById("modalEmail").textContent =
        student.email || "Not available";

    document.getElementById("modalPhone").textContent =
        student.phoneNumber || "Not provided";

    document.getElementById("modalDuration").textContent =
        student.programDuration || "Not specified";

    document.getElementById("modalCourse").textContent =
        student.course || "Not assigned";

    document.getElementById("modalCourseCode").textContent =
        student.courseCode || "Not assigned";

    document.getElementById("modalStatus").textContent =
        student.accountStatus || "Unknown";

    document.getElementById("modalCreatedAt").textContent =
        formatDate(student.createdAt);

    studentModal.classList.add("show");

    document.body.style.overflow = "hidden";
};


// CLOSE STUDENT DETAILS MODAL
const closeModal = () => {

    studentModal.classList.remove("show");

    document.body.style.overflow = "";
};


// Handle View button clicks
studentsTableBody.addEventListener("click", (event) => {

    const viewButton = event.target.closest(".view-student-btn");

    if (!viewButton) return;

    const studentId = viewButton.dataset.id;

    const selectedStudent = allStudents.find(
        student => student._id === studentId
    );

    if (selectedStudent) {
        openStudentModal(selectedStudent);
    }

});


// Close using the X button
closeStudentModal.addEventListener("click", closeModal);


// Close when clicking outside the popup
studentModal.addEventListener("click", (event) => {

    if (event.target === studentModal) {
        closeModal();
    }

});


// Close using Escape key
document.addEventListener("keydown", (event) => {

    if (event.key === "Escape" && studentModal.classList.contains("show")) {
        closeModal();
    }

});


// Load students when page opens
loadStudents();