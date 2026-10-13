const token = localStorage.getItem("token");
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

        profileAvatar.innerHTML = `
            <img src="${data.profileImage}" alt="Profile Picture">
        `;

        headerAvatar.innerHTML = `
            <img src="${data.profileImage}" alt="Profile Picture">
        `;

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

const loadProfile = async () => {
    try {
        const response = await fetch("https://siwes-attendance-backend.onrender.com/api/profile", {
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

            alert(data.message || "Unable to load profile.");
            return;
        }

        document.querySelector("#profileName").textContent = data.name;
        document.querySelector("#profileFullName").textContent = data.name;
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

            document.querySelector(".profile-avatar").innerHTML = `
                <img src="${data.profileImage}" alt="Profile Picture">
            `;
        } else {
            document.querySelector(".avatar").textContent = initials;
            document.querySelector(".profile-avatar").textContent = initials;
        }

        document.querySelector("#profileRole").textContent = data.role;
        document.querySelector("#profileStudentId").textContent = data.studentId;
        document.querySelector("#profileEmail").textContent = data.email;
        document.querySelector("#profilePhone").textContent = data.phoneNumber || "Not provided";

        const courseName = data.courseId?.name || "Not provided";
        const courseCode = data.courseId?.code || "";

        document.querySelector("#profileCourse").textContent =
            courseCode ? `${courseCode} - ${courseName}` : courseName;

        document.querySelector("#profileDuration").textContent =
            data.programDuration || "Not provided";

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

loadProfile();

// ===============================
// EDIT PROFILE FUNCTIONALITY
// ===============================

const editProfileBtn = document.querySelector("#edit-profile-btn");
const editProfileForm = document.querySelector("#edit-profile-form");
const profileDetails = document.querySelector(".profile-details");

const editNameInput = document.querySelector("#edit-name");
const editEmailInput = document.querySelector("#edit-email");
const editPhoneInput = document.querySelector("#edit-phone");

const sendEmailOtpBtn = document.querySelector("#send-email-otp-btn");
const emailOtpGroup = document.querySelector("#email-otp-group");
const emailOtpInput = document.querySelector("#email-otp");
const verifyEmailOtpBtn = document.querySelector("#verify-email-otp-btn");

const saveProfileBtn = document.querySelector("#save-profile-btn");
const cancelEditBtn = document.querySelector("#cancel-edit-btn");

let originalEmail = "";
let verifiedNewEmail = "";

editProfileBtn.addEventListener("click", () => {
    editNameInput.value =
        document.querySelector("#profileFullName").textContent;

    originalEmail =
        document.querySelector("#profileEmail").textContent.trim();

    editEmailInput.value = originalEmail;

    const displayedPhone =
        document.querySelector("#profilePhone").textContent.trim();

    editPhoneInput.value =
        displayedPhone === "Not provided" ? "" : displayedPhone;

    verifiedNewEmail = "";
    sendEmailOtpBtn.disabled = false;
    sendEmailOtpBtn.textContent = "Verify New Email";
    sendEmailOtpBtn.style.backgroundColor = "";
    sendEmailOtpBtn.style.cursor = "";
    editEmailInput.readOnly = false;
    emailOtpGroup.style.display = "none";
    emailOtpInput.value = "";

    profileDetails.style.display = "none";
    editProfileForm.style.display = "block";
    editProfileBtn.style.display = "none";
    editEmailInput.readOnly = false;
});

cancelEditBtn.addEventListener("click", () => {
    editProfileForm.style.display = "none";
    profileDetails.style.display = "";
    editProfileBtn.style.display = "";
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

    if (newEmail === originalEmail.toLowerCase()) {
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
        if (verifiedNewEmail) {
            sendEmailOtpBtn.disabled = true;
            sendEmailOtpBtn.textContent = "Email Verified";
            sendEmailOtpBtn.style.backgroundColor = "#9ca3af";
            sendEmailOtpBtn.style.cursor = "not-allowed";
        } else {
            sendEmailOtpBtn.disabled = false;
            sendEmailOtpBtn.textContent = "Verify New Email";
            sendEmailOtpBtn.style.backgroundColor = "";
            sendEmailOtpBtn.style.cursor = "";
        }
    }
});

verifyEmailOtpBtn.addEventListener("click", async () => {
    const email = editEmailInput.value.trim().toLowerCase();
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
                body: JSON.stringify({ email, otp })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Unable to verify email.");
            return;
        }

        verifiedNewEmail = data.email;

        document.querySelector("#profileEmail").textContent = data.email;

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

// Save the name and phone number
saveProfileBtn.addEventListener("click", async () => {
    const name = editNameInput.value.trim();
    const phoneNumber = editPhoneInput.value.trim();
    const enteredEmail = editEmailInput.value.trim().toLowerCase();

    if (!name) {
        alert("Please enter your full name.");
        return;
    }

    if (phoneNumber && !/^\d{11}$/.test(phoneNumber)) {
        alert("Phone number must be exactly 11 digits.");
        return;
    }

    if (
        enteredEmail !== originalEmail.toLowerCase() &&
        enteredEmail !== verifiedNewEmail
    ) {
        alert("Please verify your new email address before saving.");
        return;
    }

    try {
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
                    phoneNumber
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Unable to save profile.");
            return;
        }

        document.querySelector("#profileName").textContent = data.user.name;
        document.querySelector("#profileFullName").textContent = data.user.name;
        document.querySelector(".lecturer-name").textContent = data.user.name;
        document.querySelector("#profilePhone").textContent =
            data.user.phoneNumber || "Not provided";

        const nameParts = data.user.name.trim().split(/\s+/);
        const initials = nameParts
            .slice(0, 2)
            .map(part => part[0].toUpperCase())
            .join("");

        if (!profileAvatar.querySelector("img")) {
            profileAvatar.textContent = initials;
        }

        if (!headerAvatar.querySelector("img")) {
            headerAvatar.textContent = initials;
        }

        editProfileForm.style.display = "none";
        profileDetails.style.display = "";
        editProfileBtn.style.display = "";

        alert("Profile updated successfully.");

    } catch (error) {
        console.log(error);
        alert("Unable to connect to the server.");
    } finally {
        saveProfileBtn.disabled = false;
        saveProfileBtn.textContent = "Save Changes";
    }
});