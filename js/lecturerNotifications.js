// ==========================================
// LECTURER NOTIFICATION CENTRE
// ==========================================

const LECTURER_NOTIFICATION_API =
    "https://siwes-attendance-backend.onrender.com/api";

const lecturerNotificationForm =
    document.getElementById("lecturerSendNotificationForm");

const lecturerNotificationAudience =
    document.getElementById("lecturerNotificationAudience");

const lecturerStudentIdGroup =
    document.getElementById("lecturerStudentIdGroup");

const lecturerStudentId =
    document.getElementById("lecturerNotificationStudentId");

const lecturerNotificationTitle =
    document.getElementById("lecturerNotificationTitle");

const lecturerNotificationMessage =
    document.getElementById("lecturerNotificationMessage");

const lecturerNotificationFeedback =
    document.getElementById("lecturerNotificationFeedback");

const lecturerSendNotificationButton =
    document.getElementById("lecturerSendNotificationButton");

const lecturerSentNotificationsList =
    document.getElementById("lecturerSentNotificationsList");

const refreshLecturerNotifications =
    document.getElementById("refreshLecturerNotifications");


// ==========================================
// AUTHENTICATION
// ==========================================

const getLecturerNotificationHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
});


const readLecturerNotificationResponse = async response => {
    const raw = await response.text();

    try {
        return JSON.parse(raw);
    } catch {
        throw new Error(
            `Invalid server response. HTTP ${response.status}`
        );
    }
};


// ==========================================
// FEEDBACK
// ==========================================

const showLecturerNotificationFeedback = (message, type) => {
    lecturerNotificationFeedback.textContent = message;

    lecturerNotificationFeedback.className =
        type === "success" ? "success" : "error";
};


// ==========================================
// AUDIENCE SELECTION
// ==========================================

const updateLecturerNotificationAudience = () => {
    const audience = lecturerNotificationAudience.value;

    lecturerStudentIdGroup.hidden = audience !== "student";

    lecturerStudentId.required = audience === "student";
};

lecturerNotificationAudience.addEventListener(
    "change",
    updateLecturerNotificationAudience
);


// ==========================================
// SEND NOTIFICATION
// ==========================================

lecturerNotificationForm.addEventListener("submit", async event => {
    event.preventDefault();

    const title = lecturerNotificationTitle.value.trim();
    const message = lecturerNotificationMessage.value.trim();
    const audience = lecturerNotificationAudience.value;

    if (!title || !message) {
        showLecturerNotificationFeedback(
            "Please complete all fields.",
            "error"
        );
        return;
    }

    const body = {
        title,
        message,
        type: "general",
        audience
    };

    if (audience === "student") {
        const studentId = lecturerStudentId.value.trim();

        if (!studentId) {
            showLecturerNotificationFeedback(
                "Please enter the student's ID.",
                "error"
            );
            return;
        }

        body.studentId = studentId;
    }

    lecturerSendNotificationButton.disabled = true;
    lecturerSendNotificationButton.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';

    try {
        const response = await fetch(
            `${LECTURER_NOTIFICATION_API}/lecturer/notifications`,
            {
                method: "POST",
                headers: getLecturerNotificationHeaders(),
                body: JSON.stringify(body)
            }
        );

        const data =
            await readLecturerNotificationResponse(response);

        if (response.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "login.html?role=lecturer";
            return;
        }

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to send notification."
            );
        }

        showLecturerNotificationFeedback(
            `Notification sent successfully to ${data.recipientCount} student(s)!`,
            "success"
        );

        lecturerNotificationForm.reset();
        updateLecturerNotificationAudience();

        await loadLecturerSentNotifications();

    } catch (error) {
        console.error("Lecturer Notification Error:", error);

        showLecturerNotificationFeedback(
            error.message,
            "error"
        );

    } finally {
        lecturerSendNotificationButton.disabled = false;

        lecturerSendNotificationButton.innerHTML =
            '<i class="fa-solid fa-paper-plane"></i> Send Notification';
    }
});


// ==========================================
// LOAD SENT NOTIFICATIONS
// ==========================================

const loadLecturerSentNotifications = async () => {
    lecturerSentNotificationsList.innerHTML =
        "<p>Loading sent messages...</p>";

    try {
        const response = await fetch(
            `${LECTURER_NOTIFICATION_API}/lecturer/notifications/sent`,
            {
                headers: getLecturerNotificationHeaders()
            }
        );

        const data =
            await readLecturerNotificationResponse(response);

        if (response.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "login.html?role=lecturer";
            return;
        }

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to load sent messages."
            );
        }

        const notifications = data.notifications || [];

        lecturerSentNotificationsList.innerHTML = "";

        if (!notifications.length) {
            lecturerSentNotificationsList.innerHTML =
                '<p class="lecturer-no-sent-messages">You have not sent any messages yet.</p>';
            return;
        }

        notifications.forEach(notification => {
            const card = document.createElement("div");

            card.className = "lecturer-sent-notification";

            const title = document.createElement("h4");
            title.textContent = notification.title;

            const message = document.createElement("p");
            message.textContent = notification.message;

            const recipient = document.createElement("small");

            const recipientName =
                notification.recipient?.name ||
                notification.recipient?.studentId ||
                "Course students";

            recipient.textContent = `Recipient: ${recipientName}`;

            const date = document.createElement("small");

            date.textContent = new Date(
                notification.createdAt
            ).toLocaleString("en-NG", {
                dateStyle: "medium",
                timeStyle: "short"
            });

            card.append(title, message, recipient, date);

            lecturerSentNotificationsList.appendChild(card);
        });

    } catch (error) {
        console.error("Sent Notifications Error:", error);

        lecturerSentNotificationsList.innerHTML =
            `<p class="lecturer-no-sent-messages">${error.message}</p>`;
    }
};


// ==========================================
// REFRESH
// ==========================================

refreshLecturerNotifications.addEventListener(
    "click",
    loadLecturerSentNotifications
);


// ==========================================
// INITIALIZE
// ==========================================

updateLecturerNotificationAudience();
loadLecturerSentNotifications();