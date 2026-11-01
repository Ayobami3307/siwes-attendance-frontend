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
const profileName = document.querySelector(".profile-name");

const fullName = document.querySelector("#fullName");
const studentIdInput = document.querySelector("#studentId");
const email = document.querySelector("#email");
const phoneNumber = document.querySelector("#phoneNumber");
const course = document.querySelector("#course");
const programDuration = document.querySelector("#programDuration");
const profileAttendance = document.querySelector("#profileAttendance");
const progress = document.querySelector("#progress");
const editProfileBtn = document.querySelector("#edit-profile-btn");
const saveBtn = document.querySelector(".save-btn");
const cameraEdit = document.querySelector("#camera-edit");
const profileImageInput = document.querySelector("#profile-image-input");
const profileAvatar = document.querySelector(".profile-avatar");
const headerAvatar = document.querySelector(".avatar");

cameraEdit.addEventListener("click", () => {
    profileImageInput.click();
});

profileImageInput.addEventListener("change", async () => {
    const file = profileImageInput.files[0];

    if (!file) {
        return;
    }

    if (!file.type.startsWith("image/")) {
        alert("Please select an image file.");
        profileImageInput.value = "";
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alert("Image must not be larger than 5MB.");
        profileImageInput.value = "";
        return;
    }

    const formData = new FormData();

    formData.append("profileImage", file);

    try {
        cameraEdit.disabled = true;
        cameraEdit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;

        const response = await fetch(
            "https://siwes-attendance-backend.onrender.com/api/profile/image",
            {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Unable to upload profile image.");
            return;
        }

        profileAvatar.innerHTML = `<img src="${data.profileImage}" alt="Profile Picture">`;

        headerAvatar.innerHTML = `<img src="${data.profileImage}" alt="Profile Picture">`;

        alert("Profile picture updated successfully.");

    } catch (error) {
        console.log(error);
        alert("Unable to connect to the server.");
    } finally {
        cameraEdit.disabled = false;
        cameraEdit.innerHTML = `<i class="fa-solid fa-camera"></i>`;
        profileImageInput.value = "";
    }
});

const editProfileForm = document.querySelector("#edit-profile-form");

const editNameInput = document.querySelector("#edit-name");
const editEmailInput = document.querySelector("#edit-email");
const editPhoneInput = document.querySelector("#edit-phone");

const sendEmailOtpBtn = document.querySelector("#send-email-otp-btn");
const emailOtpGroup = document.querySelector("#email-otp-group");
const emailOtpInput = document.querySelector("#email-otp");
const verifyEmailOtpBtn = document.querySelector("#verify-email-otp-btn");

const cancelEditBtn = document.querySelector("#cancel-edit-btn");

let originalName = "";
let originalEmail = "";
let originalPhoneNumber = "";
let verifiedNewEmail = "";

// ===============================
// EDIT PROFILE
// ===============================

editProfileBtn.addEventListener("click", () => {
    originalName = fullName.value;
    originalEmail = email.value.trim().toLowerCase();
    originalPhoneNumber = phoneNumber.value;

    editNameInput.value = originalName;
    editEmailInput.value = originalEmail;
    editPhoneInput.value = originalPhoneNumber;

    verifiedNewEmail = "";

    emailOtpGroup.style.display = "none";
    emailOtpInput.value = "";

    sendEmailOtpBtn.disabled = false;
    sendEmailOtpBtn.textContent = "Verify New Email";
    sendEmailOtpBtn.style.backgroundColor = "";
    sendEmailOtpBtn.style.cursor = "";

    editEmailInput.readOnly = false;

    document.querySelector("#profile-details-form").style.display = "none";
    editProfileForm.style.display = "grid";

    saveBtn.style.display = "none";
    editProfileBtn.style.display = "none";
});


// ===============================
// CANCEL EDITING
// ===============================

cancelEditBtn.addEventListener("click", () => {
    editNameInput.value = originalName;
    editEmailInput.value = originalEmail;
    editPhoneInput.value = originalPhoneNumber;

    editProfileForm.style.display = "none";
    document.querySelector("#profile-details-form").style.display = "grid";

    editProfileBtn.style.display = "flex";

    emailOtpGroup.style.display = "none";
    emailOtpInput.value = "";

    verifiedNewEmail = "";

    sendEmailOtpBtn.disabled = false;
    sendEmailOtpBtn.textContent = "Verify New Email";
    sendEmailOtpBtn.style.backgroundColor = "";
    sendEmailOtpBtn.style.cursor = "";

    editEmailInput.readOnly = false;
});

sendEmailOtpBtn.addEventListener("click", async () => {
    const newEmail = editEmailInput.value.trim().toLowerCase();

    if (!newEmail) {
        alert("Please enter your new email address.");
        return;
    }

    if (newEmail === originalEmail) {
        alert("This is already your current email address.");
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        alert("Please enter a valid email address.");
        return;
    }

    try {
        sendEmailOtpBtn.disabled = true;
        sendEmailOtpBtn.textContent = "Sending code...";

        const response = await fetch(
            "https://siwes-attendance-backend.onrender.com/api/send-email-change-otp",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ email: newEmail })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Unable to send verification code.");
            return;
        }

        verifiedNewEmail = "";

        emailOtpGroup.style.display = "flex";
        emailOtpInput.value = "";

        alert("Verification code sent to your new email address.");

    } catch (error) {
        console.log(error);
        alert("Unable to connect to the server.");
    } finally {
        if (!verifiedNewEmail) {
            sendEmailOtpBtn.disabled = false;
            sendEmailOtpBtn.textContent = "Verify New Email";
            sendEmailOtpBtn.style.backgroundColor = "";
            sendEmailOtpBtn.style.cursor = "";
        }
    }
});

verifyEmailOtpBtn.addEventListener("click", async () => {
    const enteredEmail = editEmailInput.value.trim().toLowerCase();
    const otp = emailOtpInput.value.trim();

    if (!/^\d{6}$/.test(otp)) {
        alert("Please enter the six-digit verification code.");
        return;
    }

    try {
        verifyEmailOtpBtn.disabled = true;
        verifyEmailOtpBtn.textContent = "Verifying...";

        const response = await fetch(
            "https://siwes-attendance-backend.onrender.com/api/verify-email-change-otp",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    email: enteredEmail,
                    otp
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Unable to verify email.");
            return;
        }

        verifiedNewEmail = data.email.toLowerCase();

        email.value = data.email;
        editEmailInput.value = data.email;

        emailOtpGroup.style.display = "none";
        emailOtpInput.value = "";

        sendEmailOtpBtn.disabled = true;
        sendEmailOtpBtn.textContent = "Email Verified";
        sendEmailOtpBtn.style.backgroundColor = "#9ca3af";
        sendEmailOtpBtn.style.cursor = "not-allowed";

        editEmailInput.readOnly = true;

        alert("Email address verified and updated successfully.");

    } catch (error) {
        console.log(error);
        alert("Unable to connect to the server.");
    } finally {
        verifyEmailOtpBtn.disabled = false;
        verifyEmailOtpBtn.textContent = "Confirm Email";
    }
});

document.querySelector("#save-profile-btn").addEventListener("click", saveStudentProfile);
 
async function saveStudentProfile() {
    const name = editNameInput.value.trim();
    const phone = editPhoneInput.value.trim();
    const enteredEmail = editEmailInput.value.trim().toLowerCase();

    if (!name) {
        alert("Please enter your full name.");
        return;
    }

    if (phone && !/^\d{11}$/.test(phone)) {
        alert("Phone number must be exactly 11 digits.");
        return;
    }

    if (
        enteredEmail !== originalEmail &&
        enteredEmail !== verifiedNewEmail
    ) {
        alert("Please verify your new email address before saving.");
        return;
    }

    try {
        const saveProfileBtn = document.querySelector("#save-profile-btn");

        saveProfileBtn.disabled = true;
        saveProfileBtn.textContent = "Saving...";

        const response = await fetch(
            "https://siwes-attendance-backend.onrender.com/api/profile",
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    name,
                    phoneNumber: phone
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem("token");
                sessionStorage.removeItem("token");
                window.location.href = "login.html?role=student";
                return;
            }

            alert(data.message || "Unable to update profile.");
            return;
        }

        fullName.value = data.user.name;
        profileName.textContent = data.user.name;
        studentName.textContent = data.user.name;

        phoneNumber.value = data.user.phoneNumber || "";

        originalName = data.user.name;
        originalPhoneNumber = data.user.phoneNumber || "";

        editProfileForm.style.display = "none";
        document.querySelector("#profile-details-form").style.display = "grid";
        editProfileBtn.style.display = "flex";

        alert("Profile updated successfully!");

    } catch (error) {
        console.log(error);
        alert("Unable to connect to the server.");
    } finally {
        const saveProfileBtn = document.querySelector("#save-profile-btn");

        saveProfileBtn.disabled = false;
        saveProfileBtn.textContent = "Save Changes";
    }
}

const getProfile = async () => {
    try {
        const response = await fetch("https://siwes-attendance-backend.onrender.com/api/profile", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        console.log(data);

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
        profileName.textContent = data.name;

        if (data.profileImage) {
            profileAvatar.innerHTML = `
                <img src="${data.profileImage}" alt="Profile Picture">
            `;

            headerAvatar.innerHTML = `
                <img src="${data.profileImage}" alt="Profile Picture">
            `;
        }

        fullName.value = data.name;
        studentIdInput.value = data.studentId;
        email.value = data.email;

        phoneNumber.value = data.phoneNumber || "";

        if (data.courseId) {
            course.value = data.courseId.name || "";
        } else {
            course.value = "";
        }

        programDuration.value = data.programDuration || "";

        progress.textContent = data.programDuration || "Not set";

        const attendanceResponse = await fetch("https://siwes-attendance-backend.onrender.com/api/attendance", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const attendanceData = await attendanceResponse.json();

        if (!attendanceResponse.ok) {
            if (attendanceResponse.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "login.html?role=student";
                return;
            }

            alert(attendanceData.message || "Unable to load attendance.");
            return;
        }

        const attended = attendanceData.filter(
            record => record.status === "Present"
        ).length;

        const rate = attendanceData.length > 0
            ? ((attended / attendanceData.length) * 100).toFixed(1)
            : 0;

        profileAttendance.textContent = `${rate}%`;

    } catch (error) {
        console.log(error);
        alert("Unable to connect to the server.");
    }
};

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