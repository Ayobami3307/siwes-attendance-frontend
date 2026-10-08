const loginForm = document.querySelector(".login-form");
const lecturerId = document.querySelector("#lecturerId");
const password = document.querySelector("#password");

let deviceId = localStorage.getItem("deviceId");

if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("deviceId", deviceId);
}

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = lecturerId.value.trim();
    const pass = password.value.trim();

    if (!id) {
        alert("Please enter your Lecturer ID.");
        lecturerId.focus();
        return;
    }

    if (!pass) {
        alert("Please enter your password.");
        password.focus();
        return;
    }

    try {
        const response = await fetch("https://siwes-attendance-backend.onrender.com/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                studentId: id,
                password: pass,
                deviceId: deviceId
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Login failed.");
            return;
        }

        if (!data.token) {
            alert("Login failed. No authentication token received.");
            return;
        }

        const tokenParts = data.token.split(".");

        if (tokenParts.length !== 3) {
            alert("Invalid authentication token received.");
            return;
        }

        const payload = JSON.parse(atob(tokenParts[1]));

        if (payload.role !== "lecturer") {
            alert("This account is not a lecturer account.");
            return;
        }

        localStorage.setItem("token", data.token);

        window.location.href = "./lecturerDashboard.html";

    } catch (error) {
        console.log(error);
        alert("Unable to connect to the server.");
    }
});

const passwordInput = document.getElementById("password");
const passwordToggle = document.getElementById("passwordToggle");

passwordToggle.addEventListener("click", () => {
    const eyeIcon = passwordToggle.querySelector("i");

    if (passwordInput.type === "password") {
        passwordInput.type = "text";

        eyeIcon.classList.remove("fa-eye");
        eyeIcon.classList.add("fa-eye-slash");
    } else {
        passwordInput.type = "password";

        eyeIcon.classList.remove("fa-eye-slash");
        eyeIcon.classList.add("fa-eye");
    }
});