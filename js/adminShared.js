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