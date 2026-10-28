const createIdForm = document.getElementById("createIdForm");
const message = document.getElementById("message");
const generatedId = document.getElementById("generatedId");

createIdForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    message.textContent = "Generating ID...";
    generatedId.textContent = "";

    const name = document.getElementById("fullName").value.trim();
    const phoneNumber = document.getElementById("phoneNumber").value.trim();
    const role = document.getElementById("role").value;

    try {
        const response = await fetch(
            "https://siwes-attendance-backend.onrender.com/api/generate-id",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    phoneNumber,
                    role
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to generate ID.");
        }

        message.textContent = data.message;

        generatedId.textContent = `Generated ID: ${data.data.userId}`;

        createIdForm.reset();

    } catch (error) {
        message.textContent = error.message;
    }
});