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