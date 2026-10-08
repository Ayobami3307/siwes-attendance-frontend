const resetForm = document.querySelector(".login-form");
const emailInput = document.querySelector("#email");
const otpGroup = document.querySelector("#otp-group");
const otpInput = document.querySelector("#otp");
const passwordGroup = document.querySelector("#password-group");
const newPasswordInput = document.querySelector("#newPassword");
const resetBtn = document.querySelector("#reset-btn");

let otpSent = false;
let otpVerified = false;

resetForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();

    if (!otpSent) {
        try {
            const response = await fetch("https://siwes-attendance-backend.onrender.com/api/forgot-password-otp", {
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
                alert(data.message);
                return;
            }

            alert("OTP sent to your email.");

            otpGroup.style.display = "flex";
            otpInput.required = true;

            resetBtn.textContent = "Verify OTP";

            otpSent = true;

        } catch (error) {
            console.log(error);
            alert("Unable to connect to the server.");
        }

        return;
    }

    if (!otpVerified) {
        const otp = otpInput.value.trim();

        if (!otp) {
            alert("Please enter the OTP.");
            return;
        }

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
                alert(data.message);
                return;
            }

            alert("OTP verified successfully.");

            passwordGroup.style.display = "flex";
            newPasswordInput.required = true;

            resetBtn.textContent = "Reset Password";

            otpVerified = true;

        } catch (error) {
            console.log(error);
            alert("Unable to connect to the server.");
        }

        return;
    }

    const newPassword = newPasswordInput.value.trim();

    if (!newPassword) {
        alert("Please enter your new password.");
        return;
    }

    if (newPassword.length < 8) {
        alert("Password must be at least 8 characters long.");
        return;
    }

    try {
        const response = await fetch("https://siwes-attendance-backend.onrender.com/api/reset-password", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                newPassword
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message);
            return;
        }

        alert("Password reset successfully. You can now login.");

        window.location.href = "login.html";

    } catch (error) {
        console.log(error);
        alert("Unable to connect to the server.");
    }
});

