const staffLoginForm = document.getElementById("staffLoginForm");
const message = document.getElementById("message");

staffLoginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    message.textContent = "Logging in...";

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    try {
        const response = await fetch(
            "https://siwes-attendance-backend.onrender.com/api/admin-login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username,
                    password
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Login failed.");
        }

        localStorage.setItem("adminToken", data.token);

        message.textContent = "Login successful! Redirecting...";

        window.location.href = "createid.html";

    } catch (error) {
        message.textContent = error.message;
    }
});