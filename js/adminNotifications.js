// ==========================================
// ADMIN NOTIFICATION CENTRE
// ==========================================

const NOTIFICATION_API =
    "https://siwes-attendance-backend.onrender.com/api";

const notificationForm = document.getElementById("adminNotificationForm");
const notificationAudience = document.getElementById("notificationAudience");

const notificationCourseGroup =
    document.getElementById("notificationCourseGroup");

const notificationStudentGroup =
    document.getElementById("notificationStudentGroup");

const notificationLecturerGroup =
    document.getElementById("notificationLecturerGroup");

const notificationCourse =
    document.getElementById("notificationCourse");

const notificationStudent =
    document.getElementById("notificationStudent");

const notificationLecturer =
    document.getElementById("notificationLecturer");

const notificationFeedback =
    document.getElementById("notificationFeedback");

const sendNotificationButton =
    document.getElementById("sendNotificationButton");

const sentNotificationsList =
    document.getElementById("sentNotificationsList");

let notificationStudents = [];
let notificationLecturers = [];
let notificationCourses = [];


// ==========================================
// AUTHENTICATION
// ==========================================

const getNotificationHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("adminToken")}`
});


const readNotificationResponse = async (response) => {
    const raw = await response.text();

    try {
        return JSON.parse(raw);
    } catch (error) {
        console.error("Non-JSON API Response:", {
            status: response.status,
            url: response.url,
            response: raw.slice(0, 500)
        });

        throw new Error(
            `Backend returned a non-JSON response. HTTP ${response.status}.`
        );
    }
};


// ==========================================
// FEEDBACK
// ==========================================

const showNotificationFeedback = (message, type) => {
    notificationFeedback.textContent = message;

    notificationFeedback.style.color =
        type === "success" ? "#16a34a" : "#dc2626";
};


// ==========================================
// LOAD RECIPIENTS
// ==========================================

const loadNotificationRecipients = async () => {
    try {
        const [studentsResponse, lecturersResponse, coursesResponse] =
            await Promise.all([
                fetch(`${NOTIFICATION_API}/admin/students`, {
                    headers: getNotificationHeaders()
                }),

                fetch(`${NOTIFICATION_API}/admin/lecturers`, {
                    headers: getNotificationHeaders()
                }),

                fetch(`${NOTIFICATION_API}/courses`, {
                    headers: getNotificationHeaders()
                })
            ]);

        if (
            studentsResponse.status === 401 ||
            lecturersResponse.status === 401 ||
            coursesResponse.status === 401
        ) {
            localStorage.removeItem("adminToken");
            window.location.replace("staffLogin.html");
            return;
        }

        const studentsData =
            await readNotificationResponse(studentsResponse);

        const lecturersData =
            await readNotificationResponse(lecturersResponse);

        const coursesData =
            await readNotificationResponse(coursesResponse);

        if (!studentsResponse.ok) {
            throw new Error(studentsData.message || "Unable to load students.");
        }

        if (!lecturersResponse.ok) {
            throw new Error(lecturersData.message || "Unable to load lecturers.");
        }

        if (!coursesResponse.ok) {
            throw new Error(coursesData.message || "Unable to load courses.");
        }

        notificationStudents = studentsData.students || [];
        notificationLecturers = lecturersData.lecturers || [];

        notificationCourses = Array.isArray(coursesData)
            ? coursesData
            : coursesData.courses || [];

        populateStudentOptions();
        populateLecturerOptions();
        populateCourseOptions();

    } catch (error) {
        console.error("Notification Recipients Error:", error);
        showNotificationFeedback(error.message, "error");
    }
};


// ==========================================
// POPULATE STUDENTS
// ==========================================

const populateStudentOptions = () => {
    notificationStudent.innerHTML =
        '<option value="">Select a student</option>';

    const activeStudents = notificationStudents.filter(student =>
        student.role === "student" &&
        student.accountStatus === "active"
    );

    activeStudents.forEach(student => {
        const option = document.createElement("option");

        option.value = student.studentId;
        option.textContent = `${student.name} (${student.studentId})`;

        notificationStudent.appendChild(option);
    });
};


// ==========================================
// POPULATE LECTURERS
// ==========================================

const populateLecturerOptions = () => {
    notificationLecturer.innerHTML =
        '<option value="">Select a lecturer</option>';

    const activeLecturers = notificationLecturers.filter(lecturer =>
        lecturer.role === "lecturer" &&
        lecturer.accountStatus === "active"
    );

    activeLecturers.forEach(lecturer => {
        const option = document.createElement("option");

        option.value = lecturer.studentId;
        option.textContent = `${lecturer.name} (${lecturer.studentId})`;

        notificationLecturer.appendChild(option);
    });
};


// ==========================================
// POPULATE COURSES
// ==========================================

const populateCourseOptions = () => {
    notificationCourse.innerHTML =
        '<option value="">Select a course</option>';

    notificationCourses.forEach(course => {
        const option = document.createElement("option");

        option.value = course._id;

        option.textContent =
            course.courseName ||
            course.name ||
            course.title ||
            course.courseCode ||
            course.code ||
            "Unnamed Course";

        notificationCourse.appendChild(option);
    });
};


// ==========================================
// AUDIENCE SELECTION
// ==========================================

const updateNotificationAudience = () => {
    const audience = notificationAudience.value;

    notificationCourseGroup.hidden =
        !["course", "course-lecturers"].includes(audience);

    notificationStudentGroup.hidden =
        audience !== "student";

    notificationLecturerGroup.hidden =
        audience !== "lecturer";
};

notificationAudience.addEventListener(
    "change",
    updateNotificationAudience
);


// ==========================================
// SEND NOTIFICATION
// ==========================================

notificationForm.addEventListener("submit", async event => {
    event.preventDefault();

    const title =
        document.getElementById("notificationTitle").value.trim();

    const message =
        document.getElementById("notificationMessage").value.trim();

    const audience = notificationAudience.value;

    const body = {
        title,
        message,
        type: "general",
        audience
    };

    if (["course", "course-lecturers"].includes(audience)) {
        if (!notificationCourse.value) {
            showNotificationFeedback("Please select a course.", "error");
            return;
        }

        body.courseId = notificationCourse.value;
    }

    if (audience === "student") {
        if (!notificationStudent.value) {
            showNotificationFeedback("Please select a student.", "error");
            return;
        }

        body.studentId = notificationStudent.value;
    }

    if (audience === "lecturer") {
        if (!notificationLecturer.value) {
            showNotificationFeedback("Please select a lecturer.", "error");
            return;
        }

        body.lecturerId = notificationLecturer.value;
    }

    sendNotificationButton.disabled = true;
    sendNotificationButton.textContent = "Sending...";

    try {
        const response = await fetch(
            `${NOTIFICATION_API}/admin/notifications`,
            {
                method: "POST",
                headers: getNotificationHeaders(),
                body: JSON.stringify(body)
            }
        );

        const data = await readNotificationResponse(response);

        if (response.status === 401) {
            localStorage.removeItem("adminToken");
            window.location.replace("staffLogin.html");
            return;
        }

        if (!response.ok) {
            throw new Error(data.message || "Unable to send notification.");
        }

        showNotificationFeedback(
            `Notification sent successfully to ${data.recipientCount} recipient(s)!`,
            "success"
        );

        notificationForm.reset();
        updateNotificationAudience();

        await loadSentNotifications();

    } catch (error) {
        console.error("Send Notification Error:", error);
        showNotificationFeedback(error.message, "error");

    } finally {
        sendNotificationButton.disabled = false;
        sendNotificationButton.textContent = "Send Notification";
    }
});


// ==========================================
// LOAD SENT NOTIFICATIONS
// ==========================================

const loadSentNotifications = async () => {
    try {
        const response = await fetch(
            `${NOTIFICATION_API}/admin/notifications/sent`,
            {
                headers: getNotificationHeaders()
            }
        );

        const data = await readNotificationResponse(response);

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to load sent notifications."
            );
        }

        const notifications = data.notifications || [];

        sentNotificationsList.innerHTML = "";

        if (!notifications.length) {
            sentNotificationsList.textContent =
                "No notifications sent yet.";
            return;
        }

        notifications.forEach(notification => {
            const card = document.createElement("div");
            card.className = "sent-notification-card";

            const title = document.createElement("h4");
            title.textContent = notification.title;

            const message = document.createElement("p");
            message.textContent = notification.message;

            const recipient = document.createElement("small");

            const recipientName =
                notification.recipient?.name || "Unknown recipient";

            const recipientRole =
                notification.recipientRole || "recipient";

            recipient.textContent =
                `Recipient: ${recipientName} (${recipientRole})`;

            const date = document.createElement("small");

            date.textContent =
                new Date(notification.createdAt).toLocaleString();

            card.append(title, message, recipient, date);

            sentNotificationsList.appendChild(card);
        });

    } catch (error) {
        console.error("Sent Notifications Error:", error);

        sentNotificationsList.textContent =
            "Unable to load sent notifications.";
    }
};


// ==========================================
// INITIALIZE
// ==========================================

updateNotificationAudience();
loadNotificationRecipients();
loadSentNotifications();