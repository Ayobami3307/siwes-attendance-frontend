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

const qrExpired = !qrcode || Date.now() >= expiresAt;

qrContainer.innerHTML = `
    <h2>Attendance QR Code</h2>

    <div class="qr-section">
        ${
            qrExpired
                ? `
                    <div class="qr-placeholder">
                        <i class="fa-solid fa-clock"></i>
                        <p>QR code expired.</p>
                        <p>Generate a new QR code to continue scanning.</p>
                    </div>
                `
                : `
                    <img id="attendanceQR" alt="Attendance QR Code">
                `
        }
    </div>

    <div class="session-info">
        <div class="session-code">
            <strong>SESSION ID</strong>
            <span>${session.sessionId}</span>
        </div>

        ${
            qrExpired
                ? ""
                : `
                    <p class="expiry">
                        <i class="fa-solid fa-clock"></i>
                        QR expires in <span id="countdown"></span>
                    </p>
                `
        }
    </div>
`;

if (qrExpired) {
    return;
}

const qrImage = document.querySelector("#attendanceQR");
qrImage.src = qrcode;

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

        displaySession(session, null);
        return;
    }

    const minutes = Math.floor(difference / 60000);

    const seconds = Math.floor(
        (difference % 60000) / 1000
    );

    countdownElement.textContent =
        `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

updateCountdown();

countdownInterval = setInterval(updateCountdown, 1000);


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

        console.error(data.message || "Unable to retrieve active session.");
        return;
    }

    if (data.active && data.session) {
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

        alert(data.message || "Unable to create attendance session.");
        return;
    }

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
