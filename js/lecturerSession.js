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

const loadLecturerProfile = async () => {
    try {
        const response = await fetch(
            "https://siwes-attendance-backend.onrender.com/api/profile",
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "login.html?role=lecturer";
                return;
            }

            alert(data.message || "Unable to load lecturer profile.");
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

        const courseCode = data.courseId?.code || "Not set";
        const courseTitle = data.courseId?.name || "Not set";

        document.querySelector("#courseCode").textContent = courseCode;
        document.querySelector("#courseTitle").textContent = courseTitle;

    } catch (error) {
        console.log(error);
        alert("Unable to connect to the server.");
    }
};

loadLecturerProfile();

const sessionForm = document.querySelector("#sessionForm");
const qrContainer = document.querySelector("#qrContainer");

let countdownInterval = null;

const displaySession = (session, qrcode) => {

    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }

    const expiresAt = new Date(session.expiresAt).getTime();

    // If the session has already expired, do not display its QR code
    if (Date.now() >= expiresAt) {
        showExpiredSession();
        return;
    }

    qrContainer.innerHTML = `
        <h2>Attendance QR Code</h2>

        <img src="${qrcode}" alt="Attendance QR Code">

        <div class="session-info">
            <p>
                <strong>Course:</strong>
                ${session.courseCode}
            </p>

            <p>
                <strong>Title:</strong>
                ${session.courseTitle}
            </p>

            <p>
                <strong>Lecturer:</strong>
                ${session.lecturerName}
            </p>

            <div class="session-code">
                <strong>SESSION CODE</strong>
                <span>${session.sessionId}</span>
            </div>

            <p class="expiry">
                <i class="fa-solid fa-clock"></i>
                QR code expires in <span id="countdown"></span>
            </p>
        </div>
    `;

    const updateCountdown = () => {
        const countdownElement = document.querySelector("#countdown");

        if (!countdownElement) {
            clearInterval(countdownInterval);
            countdownInterval = null;
            return;
        }

        const difference = expiresAt - Date.now();

        if (difference <= 0) {
            clearInterval(countdownInterval);
            countdownInterval = null;

            showExpiredSession();
            return;
        }

        const minutes = Math.floor(difference / 60000);

        const seconds = Math.floor(
            (difference % 60000) / 1000
        );

        countdownElement.textContent =
            `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    // Show the correct remaining time immediately
    updateCountdown();

    // Continue updating every second
    if (Date.now() < expiresAt) {
        countdownInterval = setInterval(updateCountdown, 1000);
    }
};

const showExpiredSession = () => {

    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }

    qrContainer.innerHTML = `
        <h2>Attendance QR Code</h2>

        <div class="qr-placeholder">
            <i class="fa-solid fa-clock"></i>
            <p>
                This attendance session has expired.
                Create a new session.
            </p>
        </div>
    `;
};

const loadActiveSession = async () => {
    try {
        const response = await fetch(
            "https://siwes-attendance-backend.onrender.com/api/session/active",
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "login.html?role=lecturer";
                return;
            }

            console.error(
                data.message || "Unable to retrieve active session."
            );

            return;
        }

        if (data.active && data.session && data.qrcode) {
            displaySession(data.session, data.qrcode);
        }

    } catch (error) {
        console.error("Unable to restore active session:", error);
    }
};


sessionForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const createButton = sessionForm.querySelector(".create-btn");

    createButton.disabled = true;

    try {
        const response = await fetch(
            "https://siwes-attendance-backend.onrender.com/api/session",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        console.log(data);

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "login.html?role=lecturer";
                return;
            }

            alert(
                data.message || "Unable to create attendance session."
            );

            return;
        }

        // Display the new or existing active session
        displaySession(data.session, data.qrcode);

    } catch (error) {
        console.log(error);
        alert("Unable to connect to the server.");

    } finally {
        createButton.disabled = false;
    }
});

loadActiveSession();

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