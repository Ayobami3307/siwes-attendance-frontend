const portalModal = document.querySelector("#portalModal");
const closeModal = document.querySelector("#closeModal");
const portalLoginBtn = document.querySelector(".portal-login-btn");
const portalProceedBtn = document.querySelector(".portal-proceed-btn");

const openModal = () => {
    portalModal.style.display = "flex";
};

portalLoginBtn.addEventListener("click", openModal);
portalProceedBtn.addEventListener("click", openModal);

closeModal.addEventListener("click", () => {
    portalModal.style.display = "none";
});

portalModal.addEventListener("click", (e) => {
    if (e.target === portalModal) {
        portalModal.style.display = "none";
    }
});