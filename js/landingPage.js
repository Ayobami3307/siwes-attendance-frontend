// ==============================
// PORTAL MODAL
// ==============================

const portalModal = document.querySelector("#portalModal");
const closeModal = document.querySelector("#closeModal");
const portalLoginBtn = document.querySelector(".portal-login-btn");
const portalProceedBtn = document.querySelector(".portal-proceed-btn");

const openModal = () => {
    if (portalModal) {
        portalModal.style.display = "flex";
    }
};

if (portalLoginBtn) {
    portalLoginBtn.addEventListener("click", openModal);
}

if (portalProceedBtn) {
    portalProceedBtn.addEventListener("click", openModal);
}

if (closeModal) {
    closeModal.addEventListener("click", () => {
        portalModal.style.display = "none";
    });
}

if (portalModal) {
    portalModal.addEventListener("click", (e) => {
        if (e.target === portalModal) {
            portalModal.style.display = "none";
        }
    });
}


// =========================================
// MODERN MOBILE NAVIGATION
// =========================================

const menuToggle = document.querySelector("#menuToggle");
const navMenu = document.querySelector(".navlinks ul");

if (menuToggle && navMenu) {

    // Open and close menu
    menuToggle.addEventListener("click", () => {

        const isOpen = navMenu.classList.toggle("show-menu");

        menuToggle.innerHTML = isOpen
            ? '<i class="fa-solid fa-xmark"></i>'
            : '<i class="fa-solid fa-bars"></i>';

        menuToggle.setAttribute("aria-expanded", String(isOpen));

        menuToggle.setAttribute(
            "aria-label",
            isOpen ? "Close navigation menu" : "Open navigation menu"
        );
    });

    // Close menu when a navigation link is clicked
    navMenu.querySelectorAll("a").forEach((link) => {

        link.addEventListener("click", () => {

            navMenu.classList.remove("show-menu");

            menuToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';

            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open navigation menu");
        });
    });

    // Close menu when portal login is selected
    if (portalLoginBtn) {

        portalLoginBtn.addEventListener("click", () => {

            navMenu.classList.remove("show-menu");

            menuToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';

            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open navigation menu");
        });
    }
}