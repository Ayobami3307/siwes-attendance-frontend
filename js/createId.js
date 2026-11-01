const createIdForm = document.getElementById("createIdForm");
const message = document.getElementById("message");
const generatedId = document.getElementById("generatedId");

const roleInput = document.getElementById("role");
const courseInput = document.getElementById("courseId");
const durationField = document.getElementById("durationField");
const programDurationInput = document.getElementById("programDuration");
const createAccountButton = document.getElementById("createAccountButton");

const API_URL = "https://siwes-attendance-backend.onrender.com/api";

// Show program duration only for students.
function updateRoleFields() {
    const isStudent = roleInput.value === "student";

    durationField.style.display = isStudent ? "flex" : "none";
    programDurationInput.required = isStudent;

    if (!isStudent) {
        programDurationInput.value = "";
    }
}

roleInput.addEventListener("change", updateRoleFields);

// Load available courses from the backend.
async function loadCourses() {
    courseInput.innerHTML = `
        <option value="">Loading courses...</option>
    `;

    try {
        const response = await fetch(`${API_URL}/courses`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Unable to load courses.");
        }

        // Support common API response formats.
        const courses = Array.isArray(result)
            ? result
            : Array.isArray(result.data)
                ? result.data
                : Array.isArray(result.courses)
                    ? result.courses
                    : [];

        courseInput.innerHTML = `
            <option value="" disabled selected>Select a course</option>
        `;

        if (courses.length === 0) {
            courseInput.innerHTML = `
                <option value="">No courses available</option>
            `;

            message.textContent = "No courses were found. Please contact the administrator.";
            return;
        }

        courses.forEach((course) => {
            const option = document.createElement("option");

            option.value = course._id;
            option.textContent = `${course.name} (${course.code})`;

            courseInput.appendChild(option);
        });

        message.textContent = "";

    } catch (error) {
        console.error("Course Loading Error:", error);

        courseInput.innerHTML = `
            <option value="">Unable to load courses</option>
        `;

        message.textContent =
            "Unable to load courses. Please refresh the page and try again.";
    }
}

// Submit account details.
createIdForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    message.textContent = "";
    generatedId.textContent = "";

    const name = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const phoneNumber = document.getElementById("phoneNumber").value.trim();
    const role = roleInput.value;
    const courseId = courseInput.value;
    const programDuration = programDurationInput.value.trim();

    if (!name || !email || !phoneNumber || !role || !courseId) {
        message.textContent = "Please complete all required fields.";
        return;
    }

    if (!/^\d{11}$/.test(phoneNumber)) {
        message.textContent = "Phone number must contain exactly 11 digits.";
        return;
    }

    if (role === "student" && !programDuration) {
        message.textContent = "Please enter the student's program duration.";
        return;
    }

    const adminToken = localStorage.getItem("adminToken");

    if (!adminToken) {
        window.location.replace("staffLogin.html");
        return;
    }

    const accountData = {
        name,
        email,
        phoneNumber,
        role,
        courseId
    };

    if (role === "student") {
        accountData.programDuration = programDuration;
    }

    try {
        createAccountButton.disabled = true;
        createAccountButton.textContent = "Creating Account...";
        message.textContent = "Creating account and preparing activation email...";

        const response = await fetch(`${API_URL}/admin/accounts`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
            },
            body: JSON.stringify(accountData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Unable to create account.");
        }

        message.textContent =
            result.message || "Account created successfully. Activation email sent.";

        if (result.data?.userId) {
            generatedId.textContent = `Generated ID: ${result.data.userId}`;
        }

        createIdForm.reset();
        updateRoleFields();

    } catch (error) {
        console.error("Account Creation Error:", error);
        message.textContent = error.message || "An error occurred while creating the account.";
    } finally {
        createAccountButton.disabled = false;
        createAccountButton.textContent = "Create Account";
    }
});

updateRoleFields();
loadCourses();