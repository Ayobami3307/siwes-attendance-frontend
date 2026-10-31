const adminToken = localStorage.getItem("adminToken");

const lecturersTableBody = document.getElementById("lecturersTableBody");
const lecturerSearch = document.getElementById("lecturerSearch");
const lecturerModal = document.getElementById("lecturerModal");
const closeLecturerModal = document.getElementById("closeLecturerModal");

let allLecturers = [];

if (!adminToken) {
    window.location.href = "staff-login.html";
}

const escapeHTML = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");


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


// LOAD LECTURERS
const loadLecturers = async () => {
    try {
        lecturersTableBody.innerHTML = `
            <tr>
                <td colspan="7">Loading lecturers...</td>
            </tr>
        `;

        const response = await fetch(
            "https://siwes-attendance-backend.onrender.com/api/admin/lecturers",
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

            throw new Error(data.message || "Unable to load lecturers.");
        }

        if (!data.success) {
            throw new Error(data.message || "Unable to load lecturers.");
        }

        allLecturers = data.lecturers || [];

        document.getElementById("totalLecturers").textContent =
            data.stats.totalLecturers;

        document.getElementById("activeLecturers").textContent =
            data.stats.activeLecturers;

        document.getElementById("pendingLecturers").textContent =
            data.stats.pendingLecturers;

        document.getElementById("disabledLecturers").textContent =
            data.stats.disabledLecturers;

        displayLecturers(allLecturers);

    } catch (error) {

        console.error("Lecturers Loading Error:", error);

        lecturersTableBody.innerHTML = `
            <tr>
                <td colspan="7">${escapeHTML(error.message)}</td>
            </tr>
        `;
    }
};


// DISPLAY LECTURERS
const displayLecturers = (lecturers) => {

    if (!lecturers || lecturers.length === 0) {
        lecturersTableBody.innerHTML = `
            <tr>
                <td colspan="7">No lecturers found.</td>
            </tr>
        `;
        return;
    }

    lecturersTableBody.innerHTML = lecturers.map(lecturer => {

        const status = lecturer.accountStatus || "unknown";

        return `
            <tr>
                <td>${escapeHTML(lecturer.studentId)}</td>

                <td>${escapeHTML(lecturer.name)}</td>

                <td>${escapeHTML(lecturer.email)}</td>

                <td>${escapeHTML(lecturer.phoneNumber || "Not provided")}</td>

                <td>${escapeHTML(lecturer.course || "Not assigned")}</td>

                <td>
                    <span class="status-badge ${escapeHTML(status)}">
                        ${escapeHTML(status)}
                    </span>
                </td>

                <td>
                    <button
                        class="view-student-btn"
                        data-id="${escapeHTML(lecturer._id)}"
                    >
                        View
                    </button>
                </td>
            </tr>
        `;

    }).join("");
};


// SEARCH LECTURERS
lecturerSearch.addEventListener("input", () => {

    const searchValue = lecturerSearch.value.trim().toLowerCase();

    const filteredLecturers = allLecturers.filter(lecturer => {

        const name = (lecturer.name || "").toLowerCase();
        const lecturerId = (lecturer.studentId || "").toLowerCase();

        return name.includes(searchValue) ||
            lecturerId.includes(searchValue);

    });

    displayLecturers(filteredLecturers);
});


// OPEN LECTURER DETAILS
const openLecturerModal = (lecturer) => {

    if (!lecturer) return;

    document.getElementById("modalAvatar").textContent =
        (lecturer.name || "L").charAt(0).toUpperCase();

    document.getElementById("modalLecturerName").textContent =
        lecturer.name || "Not available";

    document.getElementById("modalLecturerId").textContent =
        lecturer.studentId || "Not available";

    document.getElementById("modalEmail").textContent =
        lecturer.email || "Not available";

    document.getElementById("modalPhone").textContent =
        lecturer.phoneNumber || "Not provided";

    document.getElementById("modalCourse").textContent =
        lecturer.course || "Not assigned";

    document.getElementById("modalCourseCode").textContent =
        lecturer.courseCode || "Not assigned";

    document.getElementById("modalStatus").textContent =
        lecturer.accountStatus || "Unknown";

    document.getElementById("modalCreatedAt").textContent =
        formatDate(lecturer.createdAt);

    lecturerModal.classList.add("show");

    document.body.style.overflow = "hidden";
};


// CLOSE MODAL
const closeModal = () => {

    lecturerModal.classList.remove("show");

    document.body.style.overflow = "";
};


// VIEW BUTTON
lecturersTableBody.addEventListener("click", (event) => {

    const viewButton = event.target.closest(".view-student-btn");

    if (!viewButton) return;

    const lecturerId = viewButton.dataset.id;

    const selectedLecturer = allLecturers.find(
        lecturer => lecturer._id === lecturerId
    );

    if (selectedLecturer) {
        openLecturerModal(selectedLecturer);
    }
});


// CLOSE BUTTON
closeLecturerModal.addEventListener("click", closeModal);


// CLOSE WHEN CLICKING OUTSIDE
lecturerModal.addEventListener("click", (event) => {

    if (event.target === lecturerModal) {
        closeModal();
    }
});


// CLOSE WITH ESCAPE KEY
document.addEventListener("keydown", (event) => {

    if (
        event.key === "Escape" &&
        lecturerModal.classList.contains("show")
    ) {
        closeModal();
    }
});


// INITIAL LOAD
loadLecturers();