// GET ADMIN TOKEN
const adminToken = localStorage.getItem("adminToken");

// PROTECT PROFILE PAGE
if (!adminToken) {
    window.location.href = "staffLogin.html";
}

// LOGOUT
const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {
    logoutButton.addEventListener("click", () => {
        const confirmLogout = confirm("Are you sure you want to logout?");

        if (confirmLogout) {
            localStorage.removeItem("adminToken");
            window.location.href = "staffLogin.html";
        }
    });
}

// GET ADMIN PROFILE
const getAdminProfile = async () => {
    try {
        const response = await fetch(
            "https://siwes-attendance-backend.onrender.com/api/admin/profile",
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${adminToken}`
                }
            }
        );

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

        document.getElementById("adminUsername").textContent = admin.username;
        document.getElementById("username").textContent = admin.username;
        document.getElementById("adminRole").textContent = admin.role;
        document.getElementById("accountType").textContent = admin.accountType;

        // SET ADMIN AVATAR INITIAL
        const initial = admin.username.charAt(0).toUpperCase();

        document.getElementById("profileAvatar").textContent = initial;
        document.getElementById("adminAvatar").textContent = initial;

    } catch (error) {
        console.error("Admin Profile Error:", error);
        alert(error.message);
    }
};

getAdminProfile();