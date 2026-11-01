const API_URL = "https://siwes-attendance-backend.onrender.com/api";

const adminToken = localStorage.getItem("adminToken");

const tableBody = document.getElementById("activationsTableBody");
const pendingCount = document.getElementById("pendingCount");
const pendingStudents = document.getElementById("pendingStudents");
const pendingLecturers = document.getElementById("pendingLecturers");
const activationSearch = document.getElementById("activationSearch");

let pendingAccounts = [];

if (!adminToken) {
    window.location.replace("staffLogin.html");
}

const loadPendingActivations = async () => {
    try {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;">
                    Loading pending accounts...
                </td>
            </tr>
        `;

        const response = await fetch(`${API_URL}/admin/pending-activations`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${adminToken}`
            }
        });

        const responseText = await response.text();

        console.log("Response Status:", response.status);
        console.log("Response Content-Type:", response.headers.get("content-type"));
        console.log("Backend Response:", responseText);

        const data = JSON.parse(responseText);

        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("adminToken");
            window.location.replace("staffLogin.html");
            return;
        }

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to load pending accounts.");
        }

        pendingAccounts = data.accounts || [];

        updateSummary();
        displayPendingAccounts(pendingAccounts);

    } catch (error) {
        console.error("Pending Activations Error:", error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;">
                    Unable to load pending accounts. Please refresh the page.
                </td>
            </tr>
        `;
    }
};

const updateSummary = () => {
    const students = pendingAccounts.filter(
        account => account.role === "student"
    ).length;

    const lecturers = pendingAccounts.filter(
        account => account.role === "lecturer"
    ).length;

    pendingCount.textContent = pendingAccounts.length;
    pendingStudents.textContent = students;
    pendingLecturers.textContent = lecturers;
};

const displayPendingAccounts = (accounts) => {
    if (!accounts.length) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;">
                    No pending activations found.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = accounts.map(account => `
        <tr>
            <td>${escapeHTML(account.studentId || "N/A")}</td>
            <td>${escapeHTML(account.name || "N/A")}</td>
            <td>${escapeHTML(account.email || "N/A")}</td>
            <td>${escapeHTML(account.phoneNumber || "N/A")}</td>
            <td>${escapeHTML(account.role || "N/A")}</td>
            <td>${formatDate(account.createdAt)}</td>
        </tr>
    `).join("");
};

activationSearch.addEventListener("input", () => {
    const searchValue = activationSearch.value.trim().toLowerCase();

    const filteredAccounts = pendingAccounts.filter(account => {
        return (
            (account.studentId || "").toLowerCase().includes(searchValue) ||
            (account.name || "").toLowerCase().includes(searchValue) ||
            (account.email || "").toLowerCase().includes(searchValue) ||
            (account.phoneNumber || "").toLowerCase().includes(searchValue) ||
            (account.role || "").toLowerCase().includes(searchValue)
        );
    });

    displayPendingAccounts(filteredAccounts);
});

const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
};

const escapeHTML = (value) => {
    return String(value).replace(/[&<>"']/g, character => {
        const replacements = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return replacements[character];
    });
};

loadPendingActivations();