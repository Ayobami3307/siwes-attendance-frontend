const API_URL = "https://siwes-attendance-backend.onrender.com/api";

const activationForm = document.getElementById("activationForm");
const emailInput = document.getElementById("email");
const otpInput = document.getElementById("otp");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const activateButton = document.getElementById("activateButton");
const message = document.getElementById("message");

// Get the email address from the activation link
const params = new URLSearchParams(window.location.search);
const emailFromLink = params.get("email");

if (emailFromLink) {
    emailInput.value = emailFromLink;
} else {
    message.textContent =
        "Activation link is missing the email address. Please use the link sent to your email.";
    message.style.color = "red";
    activateButton.disabled = true;
}

activationForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim().toLowerCase();
    const otp = otpInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    message.textContent = "";

    if (!email) {
        message.textContent = "Email address is missing.";
        message.style.color = "red";
        return;
    }

    if (!/^\d{6}$/.test(otp)) {
        message.textContent = "Enter a valid 6-digit OTP.";
        message.style.color = "red";
        return;
    }

    if (password.length < 8) {
        message.textContent = "Password must be at least 8 characters long.";
        message.style.color = "red";
        return;
    }

    if (password !== confirmPassword) {
        message.textContent = "Passwords do not match.";
        message.style.color = "red";
        return;
    }

    activateButton.disabled = true;
    activateButton.textContent = "Activating...";

    try {
        const response = await fetch(`${API_URL}/activate-account`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                otp,
                password,
                confirmPassword
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Account activation failed.");
        }

        message.textContent =
            "Account activated successfully! Redirecting you to login...";
        message.style.color = "green";

        activationForm.reset();

        // Keep the email visible after resetting the form
        emailInput.value = email;

        setTimeout(() => {
            window.location.href = "login.html";
        }, 2500);

    } catch (error) {
        message.textContent =
            error.message || "Unable to activate your account. Please try again.";
        message.style.color = "red";
    } finally {
        activateButton.disabled = false;
        activateButton.textContent = "Activate Account";
    }
});