const themeToggle = document.querySelector("#theme-toggle");
document.body.dataset.theme = "light";

themeToggle.addEventListener("click", function () {
    const currentTheme = document.body.dataset.theme;

    if (currentTheme === "light") {
        document.body.dataset.theme = "dark";
        themeToggle.setAttribute(
            "aria-label",
            "Switch to light theme"
        );
    } else {
        document.body.dataset.theme = "light";
        themeToggle.setAttribute(
            "aria-label",
            "Switch to dark theme"
        );
    }
});
