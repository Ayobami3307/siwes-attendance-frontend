const ADMIN_API_URL = "https://siwes-attendance-backend.onrender.com/api";

const loadSharedAdminAvatar = async () => {
    const token = localStorage.getItem("adminToken");
    const avatar = document.getElementById("adminAvatar");

    if (!token || !avatar) return;

    try {
        const response = await fetch(`${ADMIN_API_URL}/admin/profile`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.status === 401) {
            localStorage.removeItem("adminToken");
            window.location.href = "staffLogin.html";
            return;
        }

        if (!response.ok) {
            throw new Error(data.message || "Unable to load admin avatar.");
        }

        const admin = data.admin;

        if (admin.profileImage) {
            avatar.innerHTML = `
                <img
                    src="${admin.profileImage}"
                    alt="Admin Profile"
                    style="width:100%;height:100%;object-fit:cover;border-radius:50%;"
                >
            `;
        } else {
            avatar.textContent = admin.username.charAt(0).toUpperCase();
        }

    } catch (error) {
        console.error("Admin Avatar Error:", error);
    }
};

loadSharedAdminAvatar();

// ADMIN SIDEBAR TOGGLE

document.addEventListener("DOMContentLoaded", () => {

    const sidebarToggle = document.getElementById("sidebarToggle");
    const sidebar = document.querySelector(".sidebar");
    const sidebarOverlay = document.getElementById("sidebarOverlay");

    if (!sidebarToggle || !sidebar || !sidebarOverlay) return;

    function openSidebar() {
        sidebar.classList.add("sidebar-open");
        sidebarOverlay.classList.add("overlay-active");

        sidebarToggle.innerHTML = "✕";
        sidebarToggle.setAttribute("aria-expanded", "true");
    }

    function closeSidebar() {
        sidebar.classList.remove("sidebar-open");
        sidebarOverlay.classList.remove("overlay-active");

        sidebarToggle.innerHTML = "☰";
        sidebarToggle.setAttribute("aria-expanded", "false");
    }

    sidebarToggle.addEventListener("click", () => {
        if (sidebar.classList.contains("sidebar-open")) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });

    sidebarOverlay.addEventListener("click", closeSidebar);

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeSidebar();
        }
    });

    sidebar.querySelectorAll(".nav-item").forEach(item => {
        item.addEventListener("click", closeSidebar);
    });

});