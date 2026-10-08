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

let editing = false;
let originalPhoneNumber = "";

editProfileBtn.addEventListener("click", () => {
    if (!editing) {
        originalPhoneNumber = phoneNumber.value;

        phoneNumber.removeAttribute("readonly");
        saveBtn.style.display = "block";

        editProfileBtn.innerHTML = `<i class="fa-solid fa-xmark"></i> Cancel`;
        editProfileBtn.style.backgroundColor = "red";
        editProfileBtn.style.color = "white";
        editProfileBtn.style.border = "none";

        editing = true;
    } else {
        phoneNumber.value = originalPhoneNumber;
        phoneNumber.setAttribute("readonly", true);
        saveBtn.style.display = "none";

        editProfileBtn.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Edit Profile`;
        editProfileBtn.style.backgroundColor = "";
        editProfileBtn.style.color = "";
        editProfileBtn.style.border = "";

        editing = false;
    }
});

saveBtn.addEventListener("click", async () => {
    const phone = phoneNumber.value.trim();

    if (!/^\d{11}$/.test(phone)) {
        alert("Phone number must be exactly 11 digits.");
        return;
    }

    try {
        const response = await fetch("https://siwes-attendance-backend.onrender.com/api/profile", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                phoneNumber: phone
            })
        });

        const data = await response.json();

        console.log(data);

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "login.html?role=student";
                return;
            }

            alert(data.message || "Unable to update profile.");
            return;
        }

        alert("Profile updated successfully!");

        phoneNumber.setAttribute("readonly", true);
        saveBtn.style.display = "none";

        editProfileBtn.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Edit Profile`;
        editProfileBtn.style.setProperty("background-color", "", "important");
        editProfileBtn.style.setProperty("color", "", "important");
        editProfileBtn.style.setProperty("border", "", "important");

        editing = false;

    } catch (error) {
        console.log(error);
        alert("Unable to connect to the server.");
    }
});

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