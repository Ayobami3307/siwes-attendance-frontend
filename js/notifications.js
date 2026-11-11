// SHARED NOTIFICATION SYSTEM

const notificationToken = localStorage.getItem("token") || sessionStorage.getItem("token");

const notificationBell = document.getElementById("notificationBell");
const notificationDropdown = document.getElementById("notificationDropdown");
const notificationBadge = document.getElementById("notificationBadge");
const notificationList = document.getElementById("notificationList");
const markAllReadBtn = document.getElementById("markAllReadBtn");

if (
    notificationToken &&
    notificationBell &&
    notificationDropdown &&
    notificationBadge &&
    notificationList &&
    markAllReadBtn
) {
    // LOAD NOTIFICATIONS
    async function loadNotifications() {
        try {
            const response = await fetch(
                "https://siwes-attendance-backend.onrender.com/api/notifications",
                {
                    headers: {
                        Authorization: `Bearer ${notificationToken}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to load notifications");
            }

            const notifications = data.notifications || [];
            const unreadCount = data.unreadCount || 0;

            notificationBadge.textContent = unreadCount;
            notificationBadge.style.display =
                unreadCount > 0 ? "flex" : "none";

            notificationList.innerHTML = "";

            if (notifications.length === 0) {
                notificationList.innerHTML =
                    '<p class="notification-empty">No notifications yet.</p>';
                return;
            }

            notifications.forEach((notification) => {
                const item = document.createElement("div");
                item.className = `notification-item ${
                    notification.isRead ? "" : "unread"
                }`;

                const title = document.createElement("h4");
                title.textContent = notification.title;

                const message = document.createElement("p");
                message.textContent = notification.message;

                const date = document.createElement("small");
                date.textContent = new Date(
                    notification.createdAt
                ).toLocaleString("en-NG");

                item.appendChild(title);
                item.appendChild(message);
                item.appendChild(date);

                item.addEventListener("click", async () => {
                    if (!notification.isRead) {
                        await markNotificationAsRead(notification._id);
                    }

                    if (notification.link) {
                        window.location.href = notification.link;
                    }
                });

                notificationList.appendChild(item);
            });

        } catch (error) {
            console.error("Notification Error:", error);
            notificationList.innerHTML =
                '<p class="notification-empty">Unable to load notifications.</p>';
        }
    }

    // MARK ONE NOTIFICATION AS READ
    async function markNotificationAsRead(id) {
        try {
            await fetch(
                `https://siwes-attendance-backend.onrender.com/api/notifications/${id}/read`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${notificationToken}`
                    }
                }
            );

            await loadNotifications();

        } catch (error) {
            console.error("Mark Notification Error:", error);
        }
    }

    // MARK ALL NOTIFICATIONS AS READ
    markAllReadBtn.addEventListener("click", async () => {
        try {
            const response = await fetch(
                "https://siwes-attendance-backend.onrender.com/api/notifications/read-all",
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${notificationToken}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error("Unable to mark notifications as read");
            }

            await loadNotifications();

        } catch (error) {
            console.error("Mark All Notifications Error:", error);
        }
    });

    // OPEN AND CLOSE NOTIFICATION DROPDOWN
    notificationBell.addEventListener("click", () => {
        notificationDropdown.classList.toggle("show");
    });

    // CLOSE WHEN CLICKING OUTSIDE
    document.addEventListener("click", (event) => {
        if (!event.target.closest(".notification-wrapper")) {
            notificationDropdown.classList.remove("show");
        }
    });

    // LOAD NOTIFICATIONS ON PAGE OPEN
    loadNotifications();

    // REFRESH EVERY 30 SECONDS
    setInterval(loadNotifications, 30000);
}