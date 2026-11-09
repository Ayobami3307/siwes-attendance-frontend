const menuToggle = document.querySelector("#menuToggle");
const sidebar = document.querySelector(".sidebar");

if (menuToggle && sidebar) {
menuToggle.addEventListener("click", () => {
sidebar.classList.toggle("open");

    const icon = menuToggle.querySelector("i");

    if (icon) {
        if (sidebar.classList.contains("open")) {
            icon.classList.remove("fa-bars");
            icon.classList.add("fa-xmark");
        } else {
            icon.classList.remove("fa-xmark");
            icon.classList.add("fa-bars");
        }
    }
});


}

const token =
localStorage.getItem("token") ||
sessionStorage.getItem("token");

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

let attendanceProcessing = false;
let scannerRunning = false;

const cameraPlaceholder = document.querySelector(".camera-placeholder");
const cameraScanner = document.querySelector("#camera-scanner");

const sessionIdForm = document.querySelector("#sessionIdForm");
const sessionIdInput = document.querySelector("#sessionIdInput");
const sessionIdButton = document.querySelector("#sessionIdButton");

const loadProfile = async () => {
try {
const response = await fetch(
"https://siwes-attendance-backend.onrender.com/api/profile",
{
method: "GET",
headers: {
"Authorization": `Bearer ${token}`
}
}
);


    const data = await response.json();

    if (!response.ok) {
        return;
    }

    const avatarElement = document.querySelector(".avatar");
    const studentNameElement = document.querySelector(".student-name");
    const studentIdElement = document.querySelector(".student-id");

    if (studentNameElement) {
        studentNameElement.textContent = data.name;
    }

    if (studentIdElement) {
        studentIdElement.textContent = `Student ID: ${data.studentId}`;
    }

    if (avatarElement && data.profileImage) {
        avatarElement.innerHTML = `
            <img src="${data.profileImage}" alt="Profile Picture">
        `;
    }

} catch (error) {
    console.log("Unable to load profile:", error);
}


};

// Attendance submission
const markAttendance = async (sessionId, qrToken = null, method = "qr") => {


if (attendanceProcessing) {
    return;
}

attendanceProcessing = true;

if (sessionIdButton) {
    sessionIdButton.disabled = true;
}

try {
    const requestBody = { sessionId };

    // Include QR token only when attendance is marked through scanning
    if (qrToken) {
        requestBody.qrToken = qrToken;
    }

    const response = await fetch(
        "https://siwes-attendance-backend.onrender.com/api/attendance",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(requestBody)
        }
    );

    const data = await response.json();

    console.log(data);

    if (!response.ok) {

        if (response.status === 401) {
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");

            window.location.href = "login.html?role=student";
            return;
        }

        alert(data.message || "Unable to mark attendance.");

        attendanceProcessing = false;

        if (sessionIdButton) {
            sessionIdButton.disabled = false;
        }

        if (method === "qr") {
            startScanner();
        }

        return;
    }

    // Attendance successful
    cameraScanner.innerHTML = `
        <div class="success-message">
            <i class="fa-solid fa-circle-check"></i>

            <h2>Attendance Marked Successfully!</h2>

            <p>Your attendance has been recorded.</p>

            <p>
                Redirecting in
                <span id="countdown">3</span>
                seconds...
            </p>
        </div>
    `;

    if (sessionIdForm) {
        sessionIdForm.style.display = "none";
    }

    let countdown = 3;

    const countdownTimer = setInterval(() => {
        countdown--;

        const countdownElement =
            document.querySelector("#countdown");

        if (countdownElement) {
            countdownElement.textContent = countdown;
        }

        if (countdown === 0) {
            clearInterval(countdownTimer);
            window.location.href = "attendance.html";
        }

    }, 1000);

} catch (error) {
    console.log("Attendance error:", error);

    attendanceProcessing = false;

    if (sessionIdButton) {
        sessionIdButton.disabled = false;
    }

    alert("Unable to connect to the server.");

    if (method === "qr") {
        startScanner();
    }
}


};

// Session ID fallback form
if (sessionIdForm) {
sessionIdForm.addEventListener("submit", async (e) => {
e.preventDefault();


    const sessionId = sessionIdInput.value.trim();

    if (!sessionId) {
        alert("Please enter the Session ID.");
        return;
    }

    await markAttendance(sessionId, null, "manual");
});


}

// QR scanner
const html5QrCode = new Html5Qrcode("reader");

const qrConfig = {
fps: 10,
qrbox: {
width: 250,
height: 250
}
};

// Start camera
const startScanner = async () => {


if (scannerRunning || attendanceProcessing) {
    return;
}

try {
    await html5QrCode.start(
        { facingMode: "environment" },
        qrConfig,
        onScanSuccess
    );

    scannerRunning = true;

    if (cameraPlaceholder) {
        cameraPlaceholder.style.display = "none";
    }

    const scanFrame = document.querySelector(".scan-frame");

    if (scanFrame) {
        scanFrame.style.display = "block";
    }

} catch (error) {
    console.log("Camera error:", error);

    if (cameraPlaceholder) {
        cameraPlaceholder.style.display = "block";

        cameraPlaceholder.innerHTML = `
            <i class="fa-solid fa-camera-slash camera-icon"></i>
            <p>Unable to access camera.</p>
            <small>
                Allow camera permission and ensure you are using HTTPS.
                You can also enter the Session ID below.
            </small>
        `;
    }
}


};

// Stop camera
const stopScanner = async () => {


if (!scannerRunning) {
    return;
}

try {
    await html5QrCode.stop();

    scannerRunning = false;

} catch (error) {
    console.log("Camera stop error:", error);
}


};

// QR scan successful
const onScanSuccess = async (decodedText) => {


if (attendanceProcessing) {
    return;
}

let qrData;

try {
    qrData = JSON.parse(decodedText);

} catch (error) {
    console.log("Invalid QR format:", error);
    return;
}

if (!qrData.sessionId || !qrData.qrToken) {
    console.log("Invalid attendance QR code.");
    return;
}

console.log("QR code scanned:", qrData);

await stopScanner();

await markAttendance(
    qrData.sessionId,
    qrData.qrToken,
    "qr"
);


};

// Initialize page
loadProfile();

startScanner();
