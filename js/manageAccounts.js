const API_BASE = "https://siwes-attendance-backend.onrender.com/api";

const adminToken = localStorage.getItem("adminToken");

if (!adminToken) {
    window.location.href = "staffLogin.html";
}


// PAGE ELEMENTS
const totalAccounts = document.getElementById("totalAccounts");
const activeAccounts = document.getElementById("activeAccounts");
const pendingAccounts = document.getElementById("pendingAccounts");
const disabledAccounts = document.getElementById("disabledAccounts");

const accountsTableBody = document.getElementById("accountsTableBody");

const accountSearch = document.getElementById("accountSearch");
const roleFilter = document.getElementById("roleFilter");
const statusFilter = document.getElementById("statusFilter");

const accountModal = document.getElementById("accountModal");
const closeAccountModal = document.getElementById("closeAccountModal");

let allAccounts = [];


// FETCH STUDENT AND LECTURER ACCOUNTS
const loadAccounts = async () => {
    try {
        accountsTableBody.innerHTML = `
            <tr>
                <td colspan="7">Loading accounts...</td>
            </tr>
        `;

        const [studentResponse, lecturerResponse] = await Promise.all([
            fetch(`${API_BASE}/admin/students`, {
                headers: {
                    Authorization: `Bearer ${adminToken}`
                }
            }),

            fetch(`${API_BASE}/admin/lecturers`, {
                headers: {
                    Authorization: `Bearer ${adminToken}`
                }
            })
        ]);

        if (studentResponse.status === 401 || lecturerResponse.status === 401) {
            localStorage.removeItem("adminToken");
            window.location.href = "staffLogin.html";
            return;
        }

        const studentData = await studentResponse.json();
        const lecturerData = await lecturerResponse.json();

        if (!studentResponse.ok || !lecturerResponse.ok) {
            throw new Error(
                studentData.message ||
                lecturerData.message ||
                "Unable to load accounts."
            );
        }

        if (!studentData.success || !lecturerData.success) {
            throw new Error("Unable to retrieve accounts.");
        }

        const students = studentData.students.map(student => ({
            ...student,
            role: "student"
        }));

        const lecturers = lecturerData.lecturers.map(lecturer => ({
            ...lecturer,
            role: "lecturer"
        }));

        allAccounts = [...students, ...lecturers];

        updateSummary();
        displayAccounts(allAccounts);

    } catch (error) {
        console.error("Load Accounts Error:", error);

        accountsTableBody.innerHTML = `
            <tr>
                <td colspan="7">${error.message}</td>
            </tr>
        `;
    }
};


// UPDATE SUMMARY CARDS
const updateSummary = () => {
    totalAccounts.textContent = allAccounts.length;

    activeAccounts.textContent = allAccounts.filter(
        account => account.accountStatus === "active"
    ).length;

    pendingAccounts.textContent = allAccounts.filter(
        account => account.accountStatus === "pending"
    ).length;

    disabledAccounts.textContent = allAccounts.filter(
        account => account.accountStatus === "disabled"
    ).length;
};


// DISPLAY ACCOUNTS
const displayAccounts = (accounts) => {
    if (accounts.length === 0) {
        accountsTableBody.innerHTML = `
            <tr>
                <td colspan="7">No accounts found.</td>
            </tr>
        `;
        return;
    }

    accountsTableBody.innerHTML = accounts.map(account => {
        const accountId = account.studentId || "N/A";

        const status = account.accountStatus || "pending";

        let actionButton = "";

        if (status === "active") {
            actionButton = `
                <button class="account-action-btn disable-btn"
                    onclick="changeAccountStatus('${account._id}', 'disabled')">
                    Disable
                </button>
            `;
        } else if (status === "disabled") {
            actionButton = `
                <button class="account-action-btn activate-btn"
                    onclick="changeAccountStatus('${account._id}', 'active')">
                    Activate
                </button>
            `;
        } else {
            actionButton = `
                <span>Awaiting activation</span>
            `;
        }

        return `
            <tr>
                <td>${escapeHTML(accountId)}</td>

                <td>${escapeHTML(account.name || "N/A")}</td>

                <td>${escapeHTML(account.email || "N/A")}</td>

                <td>${escapeHTML(account.phoneNumber || "N/A")}</td>

                <td>${escapeHTML(account.role)}</td>

                <td>
                    <span class="status-badge status-${status}">
                        ${escapeHTML(status)}
                    </span>
                </td>

                <td class="account-actions">
                    <button class="account-action-btn view-account-btn"
                        onclick="viewAccount('${account._id}')">
                        View
                    </button>

                    ${actionButton}
                </td>
            </tr>
        `;
    }).join("");
};


// PREVENT HTML INJECTION WHEN DISPLAYING ACCOUNT DETAILS
const escapeHTML = (value) => {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
};


// SEARCH AND FILTER ACCOUNTS
const filterAccounts = () => {
    const searchValue = accountSearch.value.toLowerCase().trim();

    const selectedRole = roleFilter.value;
    const selectedStatus = statusFilter.value;

    const filteredAccounts = allAccounts.filter(account => {
        const matchesSearch =
            (account.name || "").toLowerCase().includes(searchValue) ||
            (account.email || "").toLowerCase().includes(searchValue) ||
            (account.studentId || "").toLowerCase().includes(searchValue) ||
            (account.phoneNumber || "").toLowerCase().includes(searchValue);

        const matchesRole =
            selectedRole === "all" || account.role === selectedRole;

        const matchesStatus =
            selectedStatus === "all" ||
            account.accountStatus === selectedStatus;

        return matchesSearch && matchesRole && matchesStatus;
    });

    displayAccounts(filteredAccounts);
};


// VIEW ACCOUNT DETAILS
const viewAccount = (id) => {
    const account = allAccounts.find(item => item._id === id);

    if (!account) return;

    document.getElementById("modalAccountName").textContent =
        account.name || "N/A";

    document.getElementById("modalAccountId").textContent =
        account.studentId || "N/A";

    document.getElementById("modalEmail").textContent =
        account.email || "N/A";

    document.getElementById("modalPhone").textContent =
        account.phoneNumber || "N/A";

    document.getElementById("modalRole").textContent =
        account.role || "N/A";

    document.getElementById("modalCourse").textContent =
        account.course || "N/A";

    document.getElementById("modalCourseCode").textContent =
        account.courseCode || "N/A";

    document.getElementById("modalDuration").textContent =
        account.programDuration || "N/A";

    document.getElementById("modalStatus").textContent =
        account.accountStatus || "N/A";

    document.getElementById("modalCreatedAt").textContent =
        account.createdAt
            ? new Date(account.createdAt).toLocaleDateString()
            : "N/A";

    const modalAvatar = document.getElementById("modalAvatar");

    const initials = (account.name || "A")
        .split(" ")
        .map(word => word.charAt(0))
        .slice(0, 2)
        .join("")
        .toUpperCase();

    modalAvatar.textContent = initials;

    if (account.profileImage) {
        modalAvatar.style.backgroundImage = `url("${account.profileImage}")`;
        modalAvatar.style.backgroundSize = "cover";
        modalAvatar.style.backgroundPosition = "center";
    } else {
        modalAvatar.style.backgroundImage = "none";
    }

    accountModal.style.display = "flex";
};


// DISABLE OR ACTIVATE ACCOUNT
const changeAccountStatus = async (id, newStatus) => {
    const account = allAccounts.find(item => item._id === id);

    if (!account) return;

    const action = newStatus === "disabled" ? "disable" : "activate";

    const confirmed = confirm(
        `Are you sure you want to ${action} ${account.name}'s account?`
    );

    if (!confirmed) return;

    try {
        const endpoint = account.role === "student"
            ? `${API_BASE}/admin/students/${id}/status`
            : `${API_BASE}/admin/lecturers/${id}/status`;

        const response = await fetch(endpoint, {
            method: "PATCH",

            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${adminToken}`
            },

            body: JSON.stringify({
                accountStatus: newStatus
            })
        });

        const data = await response.json();

        if (response.status === 401) {
            localStorage.removeItem("adminToken");
            window.location.href = "staffLogin.html";
            return;
        }

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to update account.");
        }

        alert(data.message);

        await loadAccounts();

    } catch (error) {
        console.error("Account Status Error:", error);
        alert(error.message);
    }
};


// SEARCH AND FILTER EVENTS
accountSearch.addEventListener("input", filterAccounts);

roleFilter.addEventListener("change", filterAccounts);

statusFilter.addEventListener("change", filterAccounts);


// CLOSE ACCOUNT MODAL
closeAccountModal.addEventListener("click", () => {
    accountModal.style.display = "none";
});


// CLOSE MODAL WHEN CLICKING OUTSIDE IT
accountModal.addEventListener("click", (event) => {
    if (event.target === accountModal) {
        accountModal.style.display = "none";
    }
});


// MAKE FUNCTIONS AVAILABLE TO HTML BUTTONS
window.viewAccount = viewAccount;
window.changeAccountStatus = changeAccountStatus;


// LOAD ACCOUNTS WHEN PAGE OPENS
loadAccounts();