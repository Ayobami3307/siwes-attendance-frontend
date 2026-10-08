const token = localStorage.getItem("token");

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

const loadLecturerName = async () => {
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

            return;
        }

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
        } else {
            document.querySelector(".avatar").textContent = initials;
        }

    } catch (error) {
        console.log(error);
    }
};

loadLecturerName();

const ticketContainer = document.querySelector("#ticketContainer");
const refreshBtn = document.querySelector("#refreshBtn");

const loadTickets = async () => {
    try {
        ticketContainer.innerHTML = `<p>Loading support tickets...</p>`;

        const response = await fetch("https://siwes-attendance-backend.onrender.com/api/support", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const tickets = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "login.html?role=lecturer";
                return;
            }

            ticketContainer.innerHTML = `<p>${tickets.message || "Unable to load support tickets."}</p>`;
            return;
        }

        if (tickets.length === 0) {
            ticketContainer.innerHTML = `<p>No support tickets found.</p>`;
            return;
        }

        ticketContainer.innerHTML = tickets.map(ticket => `
            <div class="ticket-card">
                <div class="ticket-info">
                    <p><strong>Student ID:</strong> ${ticket.studentId}</p>
                    <p><strong>Course:</strong> ${ticket.courseCode} - ${ticket.course}</p>
                    <p><strong>Category:</strong> ${ticket.category}</p>
                    <p><strong>Message:</strong> ${ticket.message || "No message provided"}</p>
                    <p><strong>Status:</strong> ${ticket.status}</p>
                    <p><strong>Submitted:</strong> ${new Date(ticket.createdAt).toLocaleString()}</p>
                    ${ticket.status === "Pending" ? `
                        <button class="resolve-btn" data-id="${ticket._id}">
                            <i class="fa-solid fa-check"></i>
                            Mark as Resolved
                        </button>
                    ` : ""}
                </div>
            </div>
        `).join("");

    } catch (error) {
        console.log(error);
        ticketContainer.innerHTML = `<p>Unable to connect to the server.</p>`;
    }
};

ticketContainer.addEventListener("click", async (e) => {
    const button = e.target.closest(".resolve-btn");

    if (!button) {
        return;
    }

    const ticketId = button.dataset.id;

    try {
        button.disabled = true;

        const response = await fetch(`https://siwes-attendance-backend.onrender.com/api/support/${ticketId}/resolve`, {
            method: "PATCH",
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

            button.disabled = false;
            alert(data.message || "Unable to resolve support ticket.");
            return;
        }

        alert("Support ticket resolved successfully.");

        loadTickets();

    } catch (error) {
        console.log(error);
        button.disabled = false;
        alert("Unable to connect to the server.");
    }
});

refreshBtn.addEventListener("click", loadTickets);

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

loadTickets();