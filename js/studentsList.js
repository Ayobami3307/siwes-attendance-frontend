const adminToken = localStorage.getItem("adminToken");

const studentsTableBody = document.getElementById("studentsTableBody");
const studentSearch = document.getElementById("studentSearch");

const studentModal = document.getElementById("studentModal");
const closeStudentModal = document.getElementById("closeStudentModal");

let allStudents = [];


// PROTECT PAGE
if (!adminToken) {
    window.location.href = "staff-login.html";
}


// ESCAPE HTML
const escapeHTML = (value) => {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};


// FORMAT DATE
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


// LOAD STUDENTS
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

        console.log("HTTP Status:", response.status);
        console.log("Backend Response:", responseText);

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

        allStudents = data.students || [];

        document.getElementById("totalStudents").textContent =
            data.stats.totalStudents;

        document.getElementById("activeStudents").textContent =
            data.stats.activeStudents;

        document.getElementById("pendingStudents").textContent =
            data.stats.pendingStudents;

        document.getElementById("disabledStudents").textContent =
            data.stats.disabledStudents;

        filterStudents();

    } catch (error) {

        console.error("Students Loading Error:", error);

        studentsTableBody.innerHTML = `
            <tr>
                <td colspan="7">${escapeHTML(error.message)}</td>
            </tr>
        `;
    }
};


// DISPLAY STUDENTS
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

        let statusButton = "";

        if (status === "active") {

            statusButton = `
                <button
                    class="student-status-btn disable-btn"
                    data-id="${escapeHTML(student._id)}"
                    data-status="disabled"
                >
                    Disable
                </button>
            `;

        } else if (status === "disabled") {

            statusButton = `
                <button
                    class="student-status-btn activate-btn"
                    data-id="${escapeHTML(student._id)}"
                    data-status="active"
                >
                    Reactivate
                </button>
            `;

        } else {

            statusButton = `
                <span>Pending activation</span>
            `;
        }

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
                    <div class="lecturer-actions">

                        <button
                            class="view-student-btn"
                            data-id="${escapeHTML(student._id)}"
                        >
                            View
                        </button>

                        ${statusButton}

                    </div>
                </td>

            </tr>
        `;

    }).join("");
};


// SEARCH STUDENTS
const filterStudents = () => {

    const searchValue = studentSearch.value.trim().toLowerCase();

    const filteredStudents = allStudents.filter(student => {

        const name = (student.name || "").toLowerCase();

        const studentId = (student.studentId || "").toLowerCase();

        return name.includes(searchValue) ||
            studentId.includes(searchValue);
    });

    displayStudents(filteredStudents);
};

studentSearch.addEventListener("input", filterStudents);


// DISABLE OR REACTIVATE STUDENT
const changeStudentStatus = async (studentId, newStatus, button) => {

    const student = allStudents.find(
        item => item._id === studentId
    );

    if (!student) return;

    const action = newStatus === "disabled"
        ? "disable"
        : "reactivate";

    const confirmed = confirm(
        `Are you sure you want to ${action} ${student.name}'s account?`
    );

    if (!confirmed) return;

    try {

        button.disabled = true;
        button.textContent = "Processing...";

        const response = await fetch(
            `https://siwes-attendance-backend.onrender.com/api/admin/students/${encodeURIComponent(studentId)}/status`,
            {
                method: "PATCH",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${adminToken}`
                },

                body: JSON.stringify({
                    accountStatus: newStatus
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem("adminToken");
                window.location.href = "staff-login.html";
                return;
            }

            throw new Error(
                data.message || "Unable to update student status."
            );
        }

        if (!data.success) {
            throw new Error(data.message || "Status update failed.");
        }

        alert(data.message);

        // Refresh students and statistics
        await loadStudents();

    } catch (error) {

        console.error("Student Status Update Error:", error);

        alert(error.message);

        button.disabled = false;

        button.textContent = action === "disable"
            ? "Disable"
            : "Reactivate";
    }
};


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


// CLOSE MODAL
const closeModal = () => {

    studentModal.classList.remove("show");

    document.body.style.overflow = "";
};


// HANDLE TABLE BUTTONS
studentsTableBody.addEventListener("click", (event) => {

    const viewButton = event.target.closest(".view-student-btn");

    if (viewButton) {

        const studentId = viewButton.dataset.id;

        const selectedStudent = allStudents.find(
            student => student._id === studentId
        );

        if (selectedStudent) {
            openStudentModal(selectedStudent);
        }

        return;
    }

    const statusButton = event.target.closest(".student-status-btn");

    if (statusButton) {

        changeStudentStatus(
            statusButton.dataset.id,
            statusButton.dataset.status,
            statusButton
        );
    }
});


// CLOSE BUTTON
closeStudentModal.addEventListener("click", closeModal);


// CLOSE OUTSIDE MODAL
studentModal.addEventListener("click", (event) => {

    if (event.target === studentModal) {
        closeModal();
    }
});


// CLOSE WITH ESCAPE
document.addEventListener("keydown", (event) => {

    if (
        event.key === "Escape" &&
        studentModal.classList.contains("show")
    ) {
        closeModal();
    }
});


// INITIAL LOAD
loadStudents();