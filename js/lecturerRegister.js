const courseSelect = document.querySelector("#course");

const loadCourses = async () => {
    try {
        const response = await fetch("https://siwes-attendance-backend.onrender.com/api/courses");
        const courses = await response.json();

        if (!response.ok) {
            alert(courses.message || "Unable to load courses.");
            return;
        }

        courses.forEach(course => {
            const option = document.createElement("option");
            option.value = course._id;
            option.textContent = course.name;
            courseSelect.appendChild(option);
        });
    } catch (error) {
        console.log(error);
        alert("Unable to load courses.");
    }
};

loadCourses();

const registerForm = document.querySelector(".login-form");
const registerButton = registerForm.querySelector("button[type='submit']");
const otpGroup = document.querySelector("#otp-group");
const otpInput = document.querySelector("#otp");
const resendOtpBtn = document.querySelector("#resendOtpBtn");

let otpSent = false;

registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullName = document.querySelector("#fullName").value.trim();
    const lecturerId = document.querySelector("#lecturerId").value.trim();
    const email = document.querySelector("#email").value.trim();
    const password = document.querySelector("#password").value.trim();

    if (!otpSent) {
        const courseId = courseSelect.value;

        if (!courseId) {
            alert("Please select your course.");
            return;
        }

        if (password.length < 8) {
            alert("Password must be at least 8 characters long.");
            return;
        }

        registerButton.disabled = true;
        registerButton.textContent = "Sending OTP...";

        try {
            const response = await fetch("https://siwes-attendance-backend.onrender.com/api/send-otp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email
                })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Unable to send OTP.");
                registerButton.disabled = false;
                registerButton.textContent = "Register";
                return;
            }

            alert("OTP sent to your email.");

            otpGroup.style.display = "block";
            otpInput.required = true;
            resendOtpBtn.style.display = "block";

            registerButton.textContent = "Verify OTP";
            registerButton.disabled = false;

            otpSent = true;

        } catch (error) {
            console.log(error);
            alert("Unable to connect to the server.");
            registerButton.disabled = false;
            registerButton.textContent = "Register";
        }

        return;
    }

    const otp = otpInput.value.trim();
    const courseId = courseSelect.value;

    if (!courseId) {
        alert("Please select your course.");
        return;
    }

    if (!otp) {
        alert("Please enter the OTP.");
        return;
    }

    registerButton.disabled = true;
    registerButton.textContent = "Verifying...";

    try {
        const response = await fetch("https://siwes-attendance-backend.onrender.com/api/verify-otp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                otp
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Invalid OTP.");
            registerButton.disabled = false;
            registerButton.textContent = "Verify OTP";
            return;
        }

        registerButton.textContent = "Creating Account...";

        alert("Email verified successfully. Creating your account...");

        const registrationData = {
            fullName,
            studentId: lecturerId,
            email,
            password,
            courseId
        };

        const registerResponse = await fetch("https://siwes-attendance-backend.onrender.com/api/lecturer-register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(registrationData)
        });

        const registerData = await registerResponse.json();

        if (!registerResponse.ok) {
            alert(registerData.message || "Registration failed.");
            registerButton.disabled = false;
            registerButton.textContent = "Verify OTP";
            return;
        }

        alert("Lecturer registration successful!");

        window.location.href = "lecturerLogin.html";

    } catch (error) {
        console.log(error);
        alert("Unable to connect to the server.");
        registerButton.disabled = false;
        registerButton.textContent = "Verify OTP";
    }
});

resendOtpBtn.addEventListener("click", async () => {
    const email = document.querySelector("#email").value.trim();

    if (!email) {
        alert("Please enter your email.");
        return;
    }

    try {
        resendOtpBtn.disabled = true;
        resendOtpBtn.textContent = "Sending...";

        const response = await fetch("https://siwes-attendance-backend.onrender.com/api/resend-otp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Unable to resend OTP.");
            resendOtpBtn.disabled = false;
            resendOtpBtn.textContent = "Resend OTP";
            return;
        }

        alert("New OTP sent to your email.");

        otpInput.value = "";

        resendOtpBtn.disabled = false;
        resendOtpBtn.textContent = "Resend OTP";

    } catch (error) {
        console.log(error);
        alert("Unable to connect to the server.");

        resendOtpBtn.disabled = false;
        resendOtpBtn.textContent = "Resend OTP";
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