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

const token = localStorage.getItem("token") || sessionStorage.getItem("token");

if (!token) {
    window.location.href = "login.html?role=student";
} else {
    try {
        const tokenParts = token.split(".");

        if (tokenParts.length !== 3) {
            localStorage.removeItem("token");
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
        window.location.href = "login.html?role=student";
    }
}

let attendanceProcessing = false;

const cameraPlaceholder = document.querySelector(".camera-placeholder");
const cameraScanner = document.querySelector("#camera-scanner");
const manualCodeForm = document.querySelector(".manual-code");

const loadProfile = async () => {
    try {
        const response = await fetch("https://siwes-attendance-backend.onrender.com/api/profile", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

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
            studentIdElement.textContent = `Matric No. ${data.studentId}`;
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


const markAttendance = async (sessionId) => {

    try {

        const response = await fetch("https://siwes-attendance-backend.onrender.com/api/attendance", {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },

            body: JSON.stringify({
                sessionId: sessionId
            })
        });

        const data = await response.json();

        console.log(data);

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "login.html?role=student";
                return;
            }

            attendanceProcessing = false;
            alert(data.message || "Unable to mark attendance.");
            return;
        }



        cameraScanner.innerHTML = `
            <div class="success-message">
                <i class="fa-solid fa-circle-check"></i>
                <h2>Attendance Marked Successfully!</h2>
                <p>Your attendance has been recorded.</p>
                <p>Redirecting in <span id="countdown">3</span> seconds...</p>
            </div>
        `;

        let countdown = 3;

        const countdownTimer = setInterval(() => {
            countdown--;

            const countdownElement = document.querySelector("#countdown");

            if (countdownElement) {
                countdownElement.textContent = countdown;
            }

            if (countdown === 0) {
                clearInterval(countdownTimer);
                window.location.href = "attendance.html";
            }
        }, 1000);
       

    } catch (error) {

        console.log(error);
        attendanceProcessing = false;

        alert("Unable to connect to the server.");

    }
};


const html5QrCode = new Html5Qrcode("reader");

const qrConfig = {
    fps: 10,
    qrbox: {
        width: 250,
        height: 250
    }
};

const onScanSuccess = async (decodedText) => {

    if (attendanceProcessing) {
        return;
    }

    attendanceProcessing = true;

    console.log("QR Code scanned:", decodedText);

    try {
        await html5QrCode.stop();
    } catch (error) {
        console.log(error);
    }

    await markAttendance(decodedText);
};



html5QrCode.start(
    { facingMode: "environment" },
    qrConfig,
    onScanSuccess
).then(() => {

    cameraPlaceholder.style.display = "none";

    document.querySelector(".scan-frame").style.display = "block";

}).catch((error) => {

    console.log("Camera error:", error);

    cameraPlaceholder.innerHTML = `
        <i class="fa-solid fa-camera-slash camera-icon"></i>
        <p>Unable to access camera.</p>
        <small>Please allow camera permission.</small>
    `;

});


manualCodeForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    if (attendanceProcessing) {
        return;
    }

    const input = document.querySelector('input[name="sessionCode"]');

    const sessionId = input.value.trim();

    if (!sessionId) {
        alert("Please enter the session code.");
        return;
    }

    attendanceProcessing = true;

    await markAttendance(sessionId);

    input.value = "";

});

loadProfile();