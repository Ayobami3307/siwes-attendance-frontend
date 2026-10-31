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

        filterLecturers();

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

        let statusButton = "";

        if (status === "active") {
            statusButton = `
                <button
                    class="lecturer-status-btn disable-btn"
                    data-id="${escapeHTML(lecturer._id)}"
                    data-status="disabled"
                >
                    Disable
                </button>
            `;
        } else if (status === "disabled") {
            statusButton = `
                <button
                    class="lecturer-status-btn activate-btn"
                    data-id="${escapeHTML(lecturer._id)}"
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
                    <div class="lecturer-actions">

                        <button
                            class="view-student-btn"
                            data-id="${escapeHTML(lecturer._id)}"
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


// SEARCH LECTURERS
const filterLecturers = () => {

    const searchValue = lecturerSearch.value.trim().toLowerCase();

    const filteredLecturers = allLecturers.filter(lecturer => {

        const name = (lecturer.name || "").toLowerCase();
        const lecturerId = (lecturer.studentId || "").toLowerCase();

        return name.includes(searchValue) ||
            lecturerId.includes(searchValue);

    });

    displayLecturers(filteredLecturers);
};

lecturerSearch.addEventListener("input", filterLecturers);


// UPDATE LECTURER STATUS
const changeLecturerStatus = async (lecturerId, newStatus, button) => {

    const lecturer = allLecturers.find(
        item => item._id === lecturerId
    );

    if (!lecturer) return;

    const action = newStatus === "disabled"
        ? "disable"
        : "reactivate";

    const confirmed = confirm(
        `Are you sure you want to ${action} ${lecturer.name}'s account?`
    );

    if (!confirmed) return;

    try {

        button.disabled = true;
        button.textContent = "Processing...";

        const response = await fetch(
            `https://siwes-attendance-backend.onrender.com/api/admin/lecturers/${encodeURIComponent(lecturerId)}/status`,
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

            throw new Error(data.message || "Unable to update lecturer status.");
        }

        if (!data.success) {
            throw new Error(data.message || "Status update failed.");
        }

        alert(data.message);

        await loadLecturers();

    } catch (error) {

        console.error("Lecturer Status Update Error:", error);

        alert(error.message);

        button.disabled = false;
        button.textContent = action === "disable"
            ? "Disable"
            : "Reactivate";
    }
};


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


// TABLE ACTIONS
lecturersTableBody.addEventListener("click", (event) => {

    const viewButton = event.target.closest(".view-student-btn");

    if (viewButton) {

        const lecturerId = viewButton.dataset.id;

        const selectedLecturer = allLecturers.find(
            lecturer => lecturer._id === lecturerId
        );

        if (selectedLecturer) {
            openLecturerModal(selectedLecturer);
        }

        return;
    }

    const statusButton = event.target.closest(".lecturer-status-btn");

    if (statusButton) {

        changeLecturerStatus(
            statusButton.dataset.id,
            statusButton.dataset.status,
            statusButton
        );
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