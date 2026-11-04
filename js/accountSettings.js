const API_URL = "https://siwes-attendance-backend.onrender.com/api";
const adminToken = localStorage.getItem("adminToken");

let selectedImage = null;

// PROTECT SETTINGS PAGE
if (!adminToken) {
window.location.href = "staffLogin.html";
}

// DISPLAY MESSAGES
const showMessage = (elementId, message, type) => {
const element = document.getElementById(elementId);


element.textContent = message;
element.className = `settings-message ${type}`;


};

// LOGOUT
document.getElementById("logoutButton").addEventListener("click", () => {
if (confirm("Are you sure you want to logout?")) {
localStorage.removeItem("adminToken");
window.location.href = "staffLogin.html";
}
});

// LOAD ADMIN PROFILE
const loadAdminProfile = async () => {
try {
const response = await fetch(`${API_URL}/admin/profile`, {
headers: {
Authorization: `Bearer ${adminToken}`
}
});


    const data = await response.json();

    if (response.status === 401) {
        localStorage.removeItem("adminToken");
        window.location.href = "staffLogin.html";
        return;
    }

    if (!response.ok) {
        throw new Error(data.message || "Unable to load admin profile.");
    }

    const admin = data.admin;

    document.getElementById("newUsername").value = admin.username;

    if (admin.profileImage) {
        displayProfileImage(admin.profileImage);
    } else {
        document.getElementById("imagePlaceholder").textContent =
            admin.username.charAt(0).toUpperCase();

        document.getElementById("adminAvatar").textContent =
            admin.username.charAt(0).toUpperCase();
    }

} catch (error) {
    console.error("Profile Loading Error:", error);
    alert(error.message);
}


};

// DISPLAY PROFILE IMAGE
const displayProfileImage = (imageUrl) => {
const preview = document.getElementById("profileImagePreview");
const placeholder = document.getElementById("imagePlaceholder");
const sidebarAvatar = document.getElementById("adminAvatar");


preview.src = imageUrl;
preview.style.display = "block";

placeholder.style.display = "none";

sidebarAvatar.innerHTML = `
    <img src="${imageUrl}" alt="Admin" 
    style="width:100%;height:100%;object-fit:cover;border-radius:50%;">
`;


};

// SELECT PROFILE IMAGE
document.getElementById("profileImageInput").addEventListener("change", (event) => {
const file = event.target.files[0];


if (!file) return;

if (!file.type.startsWith("image/")) {
    alert("Please select a valid image.");
    event.target.value = "";
    return;
}

if (file.size > 5 * 1024 * 1024) {
    alert("Image size must not exceed 5MB.");
    event.target.value = "";
    return;
}

selectedImage = file;

const reader = new FileReader();

reader.onload = (e) => {
    document.getElementById("profileImagePreview").src = e.target.result;
    document.getElementById("profileImagePreview").style.display = "block";
    document.getElementById("imagePlaceholder").style.display = "none";
};

reader.readAsDataURL(file);


});

// UPLOAD PROFILE IMAGE
document.getElementById("saveImageButton").addEventListener("click", async () => {
if (!selectedImage) {
showMessage("imageMessage", "Please choose an image first.", "error");
return;
}


try {
    const formData = new FormData();

    formData.append("profileImage", selectedImage);

    const response = await fetch(`${API_URL}/admin/profile/image`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${adminToken}`
        },
        body: formData
    });

    const data = await response.json();

    if (response.status === 401) {
        localStorage.removeItem("adminToken");
        window.location.href = "staffLogin.html";
        return;
    }

    if (!response.ok) {
        throw new Error(data.message || "Image upload failed.");
    }

    displayProfileImage(data.profileImage);

    selectedImage = null;

    document.getElementById("profileImageInput").value = "";

    showMessage("imageMessage", data.message, "success");

} catch (error) {
    console.error("Image Upload Error:", error);
    showMessage("imageMessage", error.message, "error");
}


});

// UPDATE USERNAME
document.getElementById("usernameForm").addEventListener("submit", async (event) => {
event.preventDefault();


const username = document.getElementById("newUsername").value.trim();
const currentPassword = document.getElementById("usernameCurrentPassword").value;

try {
    const response = await fetch(`${API_URL}/admin/settings/username`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
            username,
            currentPassword
        })
    });

    const data = await response.json();

    if (!response.ok) {
        if (response.status === 401 && data.message?.includes("session")) {
            localStorage.removeItem("adminToken");
            window.location.href = "staffLogin.html";
            return;
        }

        throw new Error(data.message || "Unable to update username.");
    }

    alert("Username updated successfully. Please log in again.");

    localStorage.removeItem("adminToken");
    window.location.href = "staffLogin.html";

} catch (error) {
    console.error("Username Update Error:", error);
    showMessage("usernameMessage", error.message, "error");
}


});

// UPDATE PASSWORD
document.getElementById("passwordForm").addEventListener("submit", async (event) => {
event.preventDefault();


const currentPassword = document.getElementById("currentPassword").value;
const newPassword = document.getElementById("newPassword").value;
const confirmPassword = document.getElementById("confirmPassword").value;

if (newPassword !== confirmPassword) {
    showMessage("passwordMessage", "New passwords do not match.", "error");
    return;
}

try {
    const response = await fetch(`${API_URL}/admin/settings/password`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword
        })
    });

    const data = await response.json();

    if (!response.ok) {
        if (response.status === 401 && data.message?.includes("session")) {
            localStorage.removeItem("adminToken");
            window.location.href = "staffLogin.html";
            return;
        }

        throw new Error(data.message || "Unable to change password.");
    }

    alert("Password changed successfully. Please log in again.");

    localStorage.removeItem("adminToken");
    window.location.href = "staffLogin.html";

} catch (error) {
    console.error("Password Update Error:", error);
    showMessage("passwordMessage", error.message, "error");
}


});

// INITIALIZE PAGE
loadAdminProfile();
