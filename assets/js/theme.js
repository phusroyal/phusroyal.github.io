(function () {
    var storageKey = "phusroyal-theme";
    var darkThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function storedTheme() {
        var theme;

        try {
            theme = window.localStorage.getItem(storageKey);
        } catch (error) {
            return null;
        }

        return theme === "dark" || theme === "light" ? theme : null;
    }

    function storeTheme(theme) {
        try {
            window.localStorage.setItem(storageKey, theme);
        } catch (error) {
            return;
        }
    }

    function systemTheme() {
        return darkThemeQuery.matches ? "dark" : "light";
    }

    function preferredTheme() {
        return storedTheme() || systemTheme();
    }

    function updateToggle(theme) {
        var isDark = theme === "dark";
        var nextThemeLabel = isDark ? "Switch to light mode" : "Switch to dark mode";

        document.querySelectorAll("[data-theme-toggle]").forEach(function (toggle) {
            toggle.setAttribute("aria-label", nextThemeLabel);
            toggle.setAttribute("title", nextThemeLabel);
            toggle.setAttribute("aria-pressed", String(isDark));
        });

        document.querySelectorAll("[data-theme-toggle-label]").forEach(function (label) {
            label.textContent = nextThemeLabel;
        });
    }

    function applyTheme(theme, persist) {
        document.documentElement.dataset.theme = theme;
        document.documentElement.style.colorScheme = theme;
        updateToggle(theme);

        if (persist) {
            storeTheme(theme);
        }

        window.dispatchEvent(new CustomEvent("phusroyal-themechange", {detail: {theme: theme}}));
    }

    function transitionTheme(theme, toggle) {
        var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        var bounds;
        var transition;
        var root = document.documentElement;
        var xPosition;
        var yPosition;
        var endRadius;

        if (reduceMotion || typeof document.startViewTransition !== "function") {
            applyTheme(theme, true);
            return;
        }

        bounds = toggle.getBoundingClientRect();
        xPosition = bounds.left + bounds.width / 2;
        yPosition = bounds.top + bounds.height / 2;
        endRadius = Math.hypot(
            Math.max(xPosition, window.innerWidth - xPosition),
            Math.max(yPosition, window.innerHeight - yPosition)
        );
        root.style.setProperty("--theme-transition-x", xPosition + "px");
        root.style.setProperty("--theme-transition-y", yPosition + "px");
        root.style.setProperty("--theme-transition-radius", endRadius + "px");

        transition = document.startViewTransition(function () {
            applyTheme(theme, true);
        });

        transition.finished.catch(function () {
            return;
        });
    }

    applyTheme(preferredTheme(), false);

    document.addEventListener("DOMContentLoaded", function () {
        updateToggle(document.documentElement.dataset.theme);

        document.querySelectorAll("[data-theme-toggle]").forEach(function (toggle) {
            toggle.addEventListener("click", function () {
                var currentTheme = document.documentElement.dataset.theme;
                transitionTheme(currentTheme === "dark" ? "light" : "dark", toggle);
            });
        });
    });

    darkThemeQuery.addEventListener("change", function (event) {
        if (!storedTheme()) {
            applyTheme(event.matches ? "dark" : "light", false);
        }
    });
}());
