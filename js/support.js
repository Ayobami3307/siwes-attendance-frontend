const token = localStorage.getItem("token") || sessionStorage.getItem("token");

if (!token) {
    window.location.href = "login.html?role=student";
} else {
    try {
        const tokenParts = token.split(".");

        if (tokenParts.length !== 3) {
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");
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
        sessionStorage.removeItem("token");
        window.location.href = "login.html?role=student";
    }
}

const loadStudentProfile = async () => {
    try {
        const response = await fetch("https://siwes-attendance-backend.onrender.com/api/profile", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            return;
        }

        document.querySelector(".student-name").textContent = data.name;
        document.querySelector(".student-id").textContent = data.studentId;

        const nameParts = data.name.trim().split(/\s+/);

        const initials = nameParts
            .slice(0, 2)
            .map(name => name[0].toUpperCase())
            .join("");

        const avatarElement = document.querySelector(".avatar");

        if (data.profileImage) {
            avatarElement.innerHTML = `
                <img src="${data.profileImage}" alt="Profile Picture">
            `;
        } else {
            avatarElement.textContent = initials;
        }

    } catch (error) {
        console.log(error);
    }
};

const supportForm = document.querySelector("#support-form");
const issueCategory = document.querySelector("#issue-category");
const issueMessage = document.querySelector("#issue-message");
const messageField = document.querySelector("#message-field");

messageField.style.display = "none";

issueCategory.addEventListener("change", () => {
    if (issueCategory.value === "other") {
        messageField.style.display = "block";
    } else {
        messageField.style.display = "none";
        issueMessage.value = "";
    }
});

supportForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const category = issueCategory.value;
    const message = issueMessage.value.trim();

    if (!category) {
        alert("Please select an issue category.");
        return;
    }

    if (category === "other" && !message) {
        alert("Please describe your issue.");
        issueMessage.focus();
        return;
    }

    const submitBtn = supportForm.querySelector(".submit-btn");

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting...`;

    try {
        const response = await fetch("https://siwes-attendance-backend.onrender.com/api/support", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                category,
                message
            })
        });

        const data = await response.json();

        if (!response.ok) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Submit Ticket`;

            alert(data.message || "Unable to submit support ticket.");
            return;
        }

        alert("Support ticket submitted successfully.");

        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Submit Ticket`;

        supportForm.reset();
        messageField.style.display = "none";

        loadMyTickets();

    } catch (error) {
        console.log(error);

        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Submit Ticket`;

        alert("Unable to connect to the server.");
    }
});

const ticketContainer = document.querySelector("#myTickets");
const refreshBtn = document.querySelector("#refreshBtn");

const loadMyTickets = async () => {
    try {
        ticketContainer.innerHTML = "<p>Loading your support tickets...</p>";

        const response = await fetch("https://siwes-attendance-backend.onrender.com/api/support/my", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const tickets = await response.json();

        if (!response.ok) {
            ticketContainer.innerHTML = "<p>Unable to load your support tickets.</p>";
            return;
        }

        if (tickets.length === 0) {
            ticketContainer.innerHTML = "<p>You have not submitted any support tickets yet.</p>";
            return;
        }

        ticketContainer.innerHTML = tickets.map(ticket => `
            <div class="ticket-card">
                <p><strong>Course:</strong> ${ticket.courseCode || "N/A"} - ${ticket.course || "N/A"}</p>

                <p><strong>Category:</strong> ${ticket.category}</p>

                <p><strong>Message:</strong> ${ticket.message || "No message provided"}</p>

                <p>
                    <strong>Status:</strong>
                    <span class="ticket-status ${ticket.status.toLowerCase()}">
                        ${ticket.status}
                    </span>
                </p>

                <p>
                    <strong>Submitted:</strong>
                    ${new Date(ticket.createdAt).toLocaleString()}
                </p>
            </div>
        `).join("");

    } catch (error) {
        console.log(error);
        ticketContainer.innerHTML = "<p>Unable to connect to the server.</p>";
    }
};

refreshBtn.addEventListener("click", loadMyTickets);

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

loadStudentProfile();
loadMyTickets();