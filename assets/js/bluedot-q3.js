(() => {
    "use strict";

    const COLORS = {
        blue: "#3A91B8",
        ink: "#2D2722",
        muted: "#74695D",
        line: "#D8CCBC",
        cognac: "#A06B43",
        moss: "#70785E",
        clay: "#A86650",
        brass: "#B49357",
        paper: "#FBF8F2"
    };

    const state = { projection: "3d", sampler: {}, finalCodes: {}, redraws: new Set() };

    function readCanvasColors() {
        const styles = getComputedStyle(document.documentElement);
        const value = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;
        const dark = document.documentElement.dataset.theme === "dark";
        return {
            blue: dark ? "#58B9DB" : COLORS.blue,
            clay: value("--beyond-clay", COLORS.clay),
            ink: value("--beyond-ink", COLORS.ink),
            line: value("--beyond-line", COLORS.line),
            moss: value("--beyond-moss", COLORS.moss),
            muted: value("--beyond-muted", COLORS.muted),
            strong: value("--beyond-strong", COLORS.ink),
            negative: dark ? "rgba(255,249,239,.82)" : "rgba(45,39,34,.68)"
        };
    }

    function fetchJson(url) {
        return fetch(url).then((response) => {
            if (!response.ok) throw new Error("Unable to load figure data");
            return response.json();
        });
    }

    function canvasContext(canvas) {
        const rect = canvas.getBoundingClientRect();
        const ratio = window.devicePixelRatio || 1;
        canvas.width = Math.max(1, Math.round(rect.width * ratio));
        canvas.height = Math.max(1, Math.round(rect.height * ratio));
        const context = canvas.getContext("2d");
        context.scale(ratio, ratio);
        return { context, width: rect.width, height: rect.height };
    }

    function range(points) {
        const values = [[], [], []];
        points.forEach((point) => point.forEach((value, index) => values[index].push(value)));
        return values.map((axis) => {
            const minimum = Math.min(...axis);
            const maximum = Math.max(...axis);
            const padding = (maximum - minimum || 1) * 0.12;
            return [minimum - padding, maximum + padding];
        });
    }

    function project(point, limits, view, width, height) {
        const yaw = view.yaw;
        const pitch = view.pitch;
        const x = point[0] * Math.cos(yaw) - point[1] * Math.sin(yaw);
        const y = point[0] * Math.sin(yaw) * Math.sin(pitch) + point[1] * Math.cos(yaw) * Math.sin(pitch) + point[2] * Math.cos(pitch);
        const z = point[0] * Math.sin(yaw) * Math.cos(pitch) + point[1] * Math.cos(yaw) * Math.cos(pitch) - point[2] * Math.sin(pitch);
        const span = Math.max(...limits.map(([minimum, maximum]) => maximum - minimum));
        const scale = Math.min(width, height) * (view.zoom || 0.38) / span;
        return { x: width / 2 + x * scale, y: height / 2 - y * scale, z };
    }

    function drawPanel(canvas, entry, view, title, projection) {
        const { context, width, height } = canvasContext(canvas);
        const colors = readCanvasColors();
        context.clearRect(0, 0, width, height);
        const points = entry.points;
        const limits = range(points);
        const padding = 22;
        if (projection !== "3d") {
            const axes = projection === "xy" ? [0, 1] : [0, 2];
            const xRange = limits[axes[0]];
            const yRange = limits[axes[1]];
            points.forEach((point, index) => {
                const x = padding + (point[axes[0]] - xRange[0]) / (xRange[1] - xRange[0]) * (width - padding * 2);
                const y = height - padding - (point[axes[1]] - yRange[0]) / (yRange[1] - yRange[0]) * (height - padding * 2);
                context.fillStyle = entry.labels[index] ? colors.blue : colors.negative;
                context.beginPath(); context.arc(x, y, entry.labels[index] ? 2.8 : 2.1, 0, Math.PI * 2); context.fill();
            });
            context.strokeStyle = colors.line; context.strokeRect(padding, padding, width - padding * 2, height - padding * 2);
            return;
        }
        const ordered = points.map((point, index) => ({ point, index, position: project(point, limits, view, width, height) })).sort((a, b) => a.position.z - b.position.z);
        ordered.forEach(({ index, position }) => {
            context.fillStyle = entry.labels[index] ? colors.blue : colors.negative;
            context.beginPath(); context.arc(position.x, position.y, entry.labels[index] ? 2.9 : 2.2, 0, Math.PI * 2); context.fill();
        });
        context.fillStyle = colors.strong; context.font = "600 12px Lato, sans-serif"; context.fillText("drag to rotate", 8, height - 8);
    }

    function addDraggable(canvas, view, redraw) {
        let origin = null;
        canvas.addEventListener("pointerdown", (event) => { origin = { x: event.clientX, y: event.clientY }; canvas.setPointerCapture(event.pointerId); });
        canvas.addEventListener("pointermove", (event) => {
            if (!origin) return;
            view.yaw += (event.clientX - origin.x) * 0.012;
            view.pitch = Math.max(-1.2, Math.min(1.2, view.pitch + (event.clientY - origin.y) * 0.012));
            origin = { x: event.clientX, y: event.clientY }; redraw();
        });
        canvas.addEventListener("pointerup", () => { origin = null; });
        canvas.addEventListener("pointercancel", () => { origin = null; });
    }

    function renderManifoldPanels(figure, payload, key) {
        const container = figure.querySelector("[data-q3-canvas]");
        container.innerHTML = "";
        GEOMETRIES.forEach((geometry) => {
            const panel = document.createElement("section");
            const heading = document.createElement("h4");
            heading.textContent = geometry === "sphere_shell" ? "Sphere shell" : "Helix tube";
            const canvas = document.createElement("canvas");
            canvas.setAttribute("role", "img");
            canvas.setAttribute("aria-label", `${heading.textContent} ${key} manifold view`);
            panel.className = "q3-panel"; panel.append(heading, canvas); container.append(panel);
            const view = { yaw: geometry === "sphere_shell" ? .55 : -.7, pitch: .45, zoom: .84 };
            const redraw = () => drawPanel(canvas, payload.geometries[geometry][key], view, heading.textContent, key === "target" ? state.projection : "3d");
            addDraggable(canvas, view, redraw); redraw();
            state[key === "target" ? "sampler" : "finalCodes"][geometry] = redraw;
            state.redraws.add(redraw);
        });
        figure.classList.add("is-ready");
    }

    function drawLineChart(canvas, data, metric) {
        const { context, width, height } = canvasContext(canvas);
        const colors = readCanvasColors();
        const labels = ["Bottleneck", "MixOT", "ClassOT", "GFAL", "GFAL+"];
        const keys = ["bottleneck", "mixot", "classot", "gfal", "gfal_plus"];
        const values = GEOMETRIES.map((geometry) => keys.map((key) => data.geometries[geometry].stages[key][metric]));
        const valid = values.flat().filter((value) => Number.isFinite(value));
        const minimum = Math.min(...valid, 0);
        const maximum = Math.max(...valid, 1);
        const pad = { left: 48, right: 28, top: 52, bottom: 48 };
        const x = (index) => pad.left + index / (labels.length - 1) * (width - pad.left - pad.right);
        const y = (value) => height - pad.bottom - (value - minimum) / (maximum - minimum || 1) * (height - pad.top - pad.bottom);
        context.strokeStyle = colors.line; context.lineWidth = 1;
        for (let index = 0; index < 4; index += 1) { const guideY = pad.top + index / 3 * (height - pad.top - pad.bottom); context.beginPath(); context.moveTo(pad.left, guideY); context.lineTo(width - pad.right, guideY); context.stroke(); }
        const labelOffsets = {
            "causal_target_delta:helix_tube:gfal": 22,
            "linear_probe_auc:helix_tube:classot": -22,
            "linear_probe_auc:sphere_shell:gfal": 22,
            "complement_probe_auc:helix_tube:classot": -22,
            "complement_probe_auc:sphere_shell:gfal": 22
        };
        [["sphere_shell", colors.clay, "Sphere shell", []], ["helix_tube", colors.moss, "Helix tube", [7, 5]]].forEach(([geometry, color, label, dash], setIndex) => {
            context.strokeStyle = color; context.fillStyle = color; context.lineWidth = 2.4; context.setLineDash(dash); context.beginPath();
            let previousValueIsAvailable = false;
            values[setIndex].forEach((value, index) => {
                if (!Number.isFinite(value)) { previousValueIsAvailable = false; return; }
                if (previousValueIsAvailable) context.lineTo(x(index), y(value)); else context.moveTo(x(index), y(value));
                previousValueIsAvailable = true;
            });
            context.stroke();
            context.setLineDash([]);
            values[setIndex].forEach((value, index) => {
                if (!Number.isFinite(value)) {
                    if (setIndex === 0) {
                        context.fillStyle = colors.muted; context.font = "600 12px Lato, sans-serif"; context.textAlign = "center";
                        context.fillText("—", x(index), height - pad.bottom - 8);
                    }
                    return;
                }
                context.beginPath();
                if (setIndex === 0) context.arc(x(index), y(value), 4, 0, Math.PI * 2);
                else context.rect(x(index) - 3.5, y(value) - 3.5, 7, 7);
                context.fill();
                context.fillStyle = colors.ink; context.font = "700 11px Lato, sans-serif"; context.textAlign = "center";
                const otherValue = values[1 - setIndex][index];
                const labelsAreClose = Number.isFinite(otherValue) && Math.abs(y(value) - y(otherValue)) < 20;
                const labelKey = `${metric}:${geometry}:${keys[index]}`;
                const defaultOffset = labelsAreClose ? (setIndex === 0 ? -20 : 20) : 0;
                const labelX = Math.max(22, Math.min(width - 22, x(index) + (labelOffsets[labelKey] ?? defaultOffset)));
                const keepValueOrder = ["linear_probe_auc", "complement_probe_auc"].includes(metric) && ["gfal", "gfal_plus"].includes(keys[index]);
                const labelOffset = keepValueOrder
                    ? (value > otherValue ? -8 : 14)
                    : (labelsAreClose ? (setIndex === 0 ? -12 : 18) : (setIndex === 0 ? -8 : 14));
                const labelY = Math.max(32, Math.min(height - 34, y(value) + labelOffset));
                context.fillStyle = color; context.fillText(value.toFixed(4), labelX, labelY);
                context.fillStyle = color;
            });
            context.fillStyle = colors.strong; context.font = "600 12px Lato, sans-serif"; context.textAlign = "left";
            context.beginPath(); context.moveTo(pad.left + setIndex * 120, 14); context.lineTo(pad.left + 18 + setIndex * 120, 14); context.setLineDash(dash); context.stroke(); context.setLineDash([]);
            context.fillText(label, pad.left + 24 + setIndex * 120, 18);
        });
        context.fillStyle = colors.strong; context.font = "600 12px Lato, sans-serif";
        labels.forEach((label, index) => context.fillText(label, x(index) - 22, height - 18));
    }

    function renderCausalStory(container, data, mode) {
        const stories = {
            ablation: {
                number: "01",
                title: "Ablate the code",
                question: "Does country prediction need the geometry code?",
                intervention: "Set the three reserved channels to zero.",
                observation: "Country AUC falls sharply.",
                explanation: "Removing only the reserved code brings country AUC close to chance. The classifier therefore depends on that code rather than treating it as a decorative representation.",
                primary: "ablation_auc_drop",
                primaryLabel: "AUC drop",
                secondary: "ablation_target_auc",
                secondaryLabel: "Ablated AUC"
            },
            replacement: {
                number: "02",
                title: "Replace the code",
                question: "Does the output follow the geometry’s label?",
                intervention: "Insert a negative or positive anchor while preserving the complement.",
                observation: "Positive anchors raise the country logit.",
                explanation: "The complement stays fixed while the anchor changes. The positive-versus-negative logit gap therefore isolates the causal effect of the geometry edit.",
                primary: "target_delta",
                primaryLabel: "Target delta",
                secondary: "specificity_ratio",
                secondaryLabel: "Specificity ratio"
            },
            swap: {
                number: "03",
                title: "Swap learned codes",
                question: "Do learned codes, not just anchors, control prediction?",
                intervention: "Exchange geometry codes between a positive and negative pair.",
                observation: "The positive falls; the negative rises.",
                explanation: "This check uses the model’s own learned codes. Swapping them reverses the expected prediction movement while each example keeps its original complement.",
                primary: "swap_target_shift",
                primaryLabel: "Target shift",
                secondary: "swap_specificity",
                secondaryLabel: "Swap specificity"
            },
            path: {
                number: "04",
                title: "Trace a path",
                question: "Does the response vary smoothly along the manifold?",
                intervention: "Increase radius from the inner positive region to the outer negative region.",
                observation: "The country logit decreases at every step.",
                explanation: "With the complement held at its mean, only the geometry path changes. Perfect monotonicity shows the classifier responds smoothly to the intended control direction.",
                primary: "path_target_delta",
                primaryLabel: "Target delta",
                secondary: "path_monotonic_fraction",
                secondaryLabel: "Monotonic fraction"
            }
        };
        const geometryNames = { sphere_shell: "Sphere shell", helix_tube: "Helix tube" };
        const format = (value) => Number(value).toFixed(4);
        const cards = Object.entries(stories).map(([key, story]) => {
            const values = GEOMETRIES.map((geometry) => `${geometryNames[geometry]}: ${format(data.geometries[geometry][story.primary])}`).join(" · ");
            return `<button type="button" class="q3-causal-check" data-q3-causal="${key}" aria-pressed="${key === mode}"><span class="q3-causal-check-number">${story.number}</span><span class="q3-causal-check-title">${story.title}</span><span class="q3-causal-check-question">${story.question}</span><span class="q3-causal-check-action">${story.intervention}</span><span class="q3-causal-check-observation">${story.observation}</span><span class="q3-causal-check-values">${values}</span></button>`;
        }).join("");
        const story = stories[mode];
        const evidence = GEOMETRIES.map((geometry) => {
            const metrics = data.geometries[geometry];
            return `<div><span>${geometryNames[geometry]}</span><strong>${story.primaryLabel}: ${format(metrics[story.primary])}</strong><small>${story.secondaryLabel}: ${format(metrics[story.secondary])}</small></div>`;
        }).join("");
        container.innerHTML = `<div class="q3-causal-checklist" aria-label="Four causal-use checks">${cards}</div><div class="q3-causal-detail"><div><span>Why ${story.title.toLowerCase()} matters</span><p>${story.explanation}</p></div><div class="q3-causal-detail-evidence">${evidence}</div></div>`;
    }

    const GEOMETRIES = ["sphere_shell", "helix_tube"];

    function initialiseFigure(figure) {
        const kind = figure.dataset.q3Figure;
        const source = figure.dataset.q3Src;
        if (kind === "architecture") return initialiseArchitecture(figure);
        fetchJson(source).then((payload) => {
            if (kind === "sampler") {
                renderManifoldPanels(figure, payload, "target");
                figure.querySelectorAll("[data-q3-projection]").forEach((button) => button.addEventListener("click", () => {
                    state.projection = button.dataset.q3Projection;
                    figure.querySelectorAll("[data-q3-projection]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
                    Object.values(state.sampler).forEach((redraw) => redraw());
                }));
            }
            if (kind === "final-codes") renderManifoldPanels(figure, payload, "final");
            if (kind === "ladder") {
                const container = figure.querySelector("[data-q3-canvas]"); const canvas = document.createElement("canvas"); container.replaceChildren(canvas);
                let metric = "causal_target_delta"; const redraw = () => drawLineChart(canvas, payload, metric); redraw(); figure.classList.add("is-ready");
                state.redraws.add(redraw);
                figure.querySelectorAll("[data-q3-metric]").forEach((button) => button.addEventListener("click", () => { metric = button.dataset.q3Metric; figure.querySelectorAll("[data-q3-metric]").forEach((item) => item.setAttribute("aria-pressed", String(item === button))); redraw(); }));
            }
            if (kind === "causal") {
                const container = figure.querySelector("[data-q3-causal-story]");
                let mode = "ablation"; const render = () => renderCausalStory(container, payload, mode); render(); figure.classList.add("is-ready");
                container.addEventListener("click", (event) => { const button = event.target.closest("[data-q3-causal]"); if (!button) return; mode = button.dataset.q3Causal; render(); });
            }
        }).catch(() => { const status = figure.querySelector("[data-q3-status]"); if (status) status.textContent = "Interactive data could not be loaded; showing the static fallback where available."; });
    }

    function initialiseArchitecture(figure) {
        const copy = figure.querySelector("[data-q3-architecture-copy]");
        const text = {
            encoder: "The sentence encoder supplies the fixed 384-dimensional input representation.",
            head: "The learned coordinate head converts the input into three manifold parameters.",
            geometry: "These three reserved coordinates become the prescribed sphere-shell or helix-tube code.",
            complement: "The remaining 61 channels are pressured not to provide an easy country shortcut.",
            tail: "The frozen classifier tail must still use the manifold edit to move the country logit."
        };
        figure.querySelectorAll("[data-q3-stage]").forEach((button) => button.addEventListener("click", () => { figure.querySelectorAll("[data-q3-stage]").forEach((item) => item.classList.toggle("is-active", item === button)); copy.textContent = text[button.dataset.q3Stage]; }));
        figure.classList.add("is-ready");
    }

    function observeFigures() {
        const figures = [...document.querySelectorAll("[data-q3-figure]")];
        if (!("IntersectionObserver" in window)) { figures.forEach(initialiseFigure); return; }
        const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (!entry.isIntersecting) return; observer.unobserve(entry.target); initialiseFigure(entry.target); }), { rootMargin: "180px" });
        figures.forEach((figure) => observer.observe(figure));
    }

    function initialiseLossDiagrams() {
        document.querySelectorAll("[data-q3-loss-diagram]").forEach((diagram) => {
            const extra = diagram.querySelector("[data-q3-loss-extra]");
            diagram.querySelectorAll("[data-q3-loss-view]").forEach((button) => button.addEventListener("click", () => {
                const showComplement = button.dataset.q3LossView === "gfal-plus";
                extra.hidden = !showComplement;
                diagram.querySelectorAll("[data-q3-loss-view]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
            }));
        });
    }

    function initialiseWidgets() {
        observeFigures();
        initialiseLossDiagrams();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialiseWidgets, { once: true });
    } else {
        initialiseWidgets();
    }

    window.addEventListener("phusroyal-themechange", () => window.requestAnimationFrame(() => state.redraws.forEach((redraw) => redraw())));
})();
