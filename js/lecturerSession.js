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

sessionForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
        const response = await fetch("https://siwes-attendance-backend.onrender.com/api/session", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

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

        qrContainer.innerHTML = `
            <h2>Attendance QR Code</h2>

            <img src="${data.qrcode}" alt="Attendance QR Code">

            <div class="session-info">
                <p><strong>Course:</strong> ${data.session.courseCode}</p>
                <p><strong>Title:</strong> ${data.session.courseTitle}</p>
                <p><strong>Lecturer:</strong> ${data.session.lecturerName}</p>

                <div class="session-code">
                    <strong>SESSION CODE</strong>
                    <span>${data.session.sessionId}</span>
                </div>

                <p class="expiry">
                    <i class="fa-solid fa-clock"></i>
                    QR code expires in <span id="countdown">10:00</span>
                </p>
            </div>
        `;

        const expiresAt = new Date(data.session.expiresAt).getTime();

        const countdown = setInterval(() => {
            const now = new Date().getTime();
            const difference = expiresAt - now;

            const countdownElement = document.querySelector("#countdown");

            if (!countdownElement) {
                clearInterval(countdown);
                return;
            }

            if (difference <= 0) {
                clearInterval(countdown);
                countdownElement.textContent = "Expired";
                return;
            }

            const minutes = Math.floor(difference / 60000);
            const seconds = Math.floor((difference % 60000) / 1000);

            countdownElement.textContent =
                `${minutes}:${seconds.toString().padStart(2, "0")}`;
        }, 1000);

    } catch (error) {
        console.log(error);
        alert("Unable to connect to the server.");
    }
});

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