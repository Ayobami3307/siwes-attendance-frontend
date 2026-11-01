const API_URL = "https://siwes-attendance-backend.onrender.com/api";

const token = localStorage.getItem("adminToken");


// DOM ELEMENTS

const totalCourses = document.getElementById("totalCourses");

const coursesTableBody = document.getElementById("coursesTableBody");

const courseSearch = document.getElementById("courseSearch");

const addCourseBtn = document.getElementById("addCourseBtn");

const courseModal = document.getElementById("courseModal");

const courseForm = document.getElementById("courseForm");

const courseName = document.getElementById("courseName");

const courseCode = document.getElementById("courseCode");

const formMessage = document.getElementById("formMessage");

const closeModalBtn = document.getElementById("closeModalBtn");

const cancelCourseBtn = document.getElementById("cancelCourseBtn");

const saveCourseBtn = document.getElementById("saveCourseBtn");

const deleteModal = document.getElementById("deleteModal");

const deleteMessage = document.getElementById("deleteMessage");

const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");

const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

const notification = document.getElementById("notification");


// VARIABLES

let courses = [];

let editingCourseId = null;

let deletingCourseId = null;


// NOTIFICATION

const showNotification = (message, type = "success") => {

    notification.textContent = message;

    notification.style.display = "block";

    notification.style.background =
        type === "error" ? "#dc3545" : "#198754";

    setTimeout(() => {

        notification.style.display = "none";

    }, 3000);

};


// DISPLAY FORM MESSAGE

const showFormMessage = (message, type = "error") => {

    formMessage.textContent = message;

    formMessage.style.color =
        type === "success" ? "#198754" : "#dc3545";

};


// FETCH ALL COURSES

const fetchCourses = async () => {

    try {

        coursesTableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;">
                    Loading courses...
                </td>
            </tr>
        `;

        const response = await fetch(`${API_URL}/courses`);

        const data = await response.json();

        if (!response.ok) {

            throw new Error(data.message || "Unable to load courses.");

        }

        courses = Array.isArray(data) ? data : [];

        displayCourses(courses);

        updateCourseCount();

    } catch (error) {

        console.error("Fetch Courses Error:", error);

        coursesTableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; color:red;">
                    ${escapeHTML(error.message)}
                </td>
            </tr>
        `;

    }

};


// DISPLAY COURSES

const displayCourses = (courseList) => {

    coursesTableBody.innerHTML = "";

    if (courseList.length === 0) {

        coursesTableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;">
                    No courses found.
                </td>
            </tr>
        `;

        return;

    }

    courseList.forEach((course, index) => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${index + 1}</td>

            <td>${escapeHTML(course.name)}</td>

            <td>${escapeHTML(course.code)}</td>

            <td>${formatDate(course.createdAt)}</td>

            <td>
                <button
                    class="action-btn edit-btn"
                    data-action="edit"
                    data-id="${course._id}">
                    Edit
                </button>

                <button
                    class="action-btn delete-btn"
                    data-action="delete"
                    data-id="${course._id}">
                    Delete
                </button>
            </td>
        `;

        coursesTableBody.appendChild(row);

    });

};


// ESCAPE HTML

const escapeHTML = (value) => {

    return String(value ?? "").replace(/[&<>"']/g, (character) => {

        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entities[character];

    });

};


// FORMAT DATE

const formatDate = (date) => {

    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

};


// UPDATE COURSE COUNT

const updateCourseCount = () => {

    totalCourses.textContent = courses.length;

};


// OPEN ADD COURSE MODAL

const openAddModal = () => {

    editingCourseId = null;

    courseForm.reset();

    formMessage.textContent = "";

    document.querySelector("#courseModal h2").textContent =
        "Add New Course";

    saveCourseBtn.textContent = "Save Course";

    courseModal.style.display = "flex";

};


// OPEN EDIT COURSE MODAL

const openEditModal = (course) => {

    editingCourseId = course._id;

    courseName.value = course.name;

    courseCode.value = course.code;

    formMessage.textContent = "";

    document.querySelector("#courseModal h2").textContent =
        "Edit Course";

    saveCourseBtn.textContent = "Update Course";

    courseModal.style.display = "flex";

};


// CLOSE COURSE MODAL

const closeCourseModal = () => {

    courseModal.style.display = "none";

    courseForm.reset();

    formMessage.textContent = "";

    editingCourseId = null;

};


// AUTHORIZATION HEADERS

const getAuthHeaders = () => {

    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
    };

};


// SAVE COURSE (CREATE / UPDATE)

const saveCourse = async (event) => {

    event.preventDefault();

    if (!token) {

        showFormMessage("Admin login required.");

        return;

    }

    const name = courseName.value.trim();

    const code = courseCode.value.trim().toUpperCase();

    if (!name || !code) {

        showFormMessage("Please fill in all fields.");

        return;

    }

    const courseData = {
        name,
        code
    };

    const isEditing = Boolean(editingCourseId);

    const url = isEditing
        ? `${API_URL}/admin/courses/${editingCourseId}`
        : `${API_URL}/admin/courses`;

    const method = isEditing ? "PATCH" : "POST";

    try {

        saveCourseBtn.disabled = true;

        saveCourseBtn.textContent = "Please wait...";

        const response = await fetch(url, {

            method,

            headers: getAuthHeaders(),

            body: JSON.stringify(courseData)

        });

        const data = await response.json();

        if (!response.ok) {

            throw new Error(data.message || "Unable to save course.");

        }

        closeCourseModal();

        showNotification(
            data.message || "Course saved successfully."
        );

        await fetchCourses();

    } catch (error) {

        console.error("Save Course Error:", error);

        showFormMessage(error.message);

    } finally {

        saveCourseBtn.disabled = false;

        saveCourseBtn.textContent = isEditing
            ? "Update Course"
            : "Save Course";

    }

};


// OPEN DELETE MODAL

const openDeleteModal = (course) => {

    deletingCourseId = course._id;

    deleteMessage.textContent =
        `Are you sure you want to delete "${course.name}"?`;

    deleteModal.style.display = "flex";

};


// CLOSE DELETE MODAL

const closeDeleteModal = () => {

    deleteModal.style.display = "none";

    deletingCourseId = null;

};


// DELETE COURSE

const deleteCourse = async () => {

    if (!deletingCourseId) return;

    if (!localStorage.getItem("adminToken")) {

        showNotification("Admin login required.", "error");

        return;

    }

    try {

        confirmDeleteBtn.disabled = true;

        confirmDeleteBtn.textContent = "Deleting...";

        const response = await fetch(
            `${API_URL}/admin/courses/${deletingCourseId}`,
            {
                method: "DELETE",

                headers: getAuthHeaders()
            }
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(data.message || "Unable to delete course.");

        }

        closeDeleteModal();

        showNotification(
            data.message || "Course deleted successfully."
        );

        await fetchCourses();

    } catch (error) {

        console.error("Delete Course Error:", error);

        closeDeleteModal();

        showNotification(error.message, "error");

    } finally {

        confirmDeleteBtn.disabled = false;

        confirmDeleteBtn.textContent = "Delete";

    }

};


// SEARCH COURSES

const searchCourses = () => {

    const searchValue = courseSearch.value.toLowerCase().trim();

    const filteredCourses = courses.filter((course) => {

        return (
            course.name.toLowerCase().includes(searchValue) ||
            course.code.toLowerCase().includes(searchValue)
        );

    });

    displayCourses(filteredCourses);

};


// TABLE ACTIONS

coursesTableBody.addEventListener("click", (event) => {

    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const courseId = button.dataset.id;

    const action = button.dataset.action;

    const course = courses.find(
        (item) => item._id === courseId
    );

    if (!course) return;

    if (action === "edit") {

        openEditModal(course);

    }

    if (action === "delete") {

        openDeleteModal(course);

    }

});


// EVENT LISTENERS

addCourseBtn.addEventListener("click", openAddModal);

courseForm.addEventListener("submit", saveCourse);

closeModalBtn.addEventListener("click", closeCourseModal);

cancelCourseBtn.addEventListener("click", closeCourseModal);

cancelDeleteBtn.addEventListener("click", closeDeleteModal);

confirmDeleteBtn.addEventListener("click", deleteCourse);

courseSearch.addEventListener("input", searchCourses);


// CLOSE MODALS WHEN CLICKING OUTSIDE

courseModal.addEventListener("click", (event) => {

    if (event.target === courseModal) {

        closeCourseModal();

    }

});

deleteModal.addEventListener("click", (event) => {

    if (event.target === deleteModal) {

        closeDeleteModal();

    }

});


// INITIALIZE PAGE

fetchCourses();