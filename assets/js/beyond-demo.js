document.addEventListener("DOMContentLoaded", function () {
    if (typeof renderMathInElement === "function") {
        renderMathInElement(document.body, {
            delimiters: [
                {left: "$$", right: "$$", display: true},
                {left: "\\[", right: "\\]", display: true},
                {left: "\\(", right: "\\)", display: false},
                {left: "$", right: "$", display: false}
            ],
            throwOnError: false
        });
    }

    document.querySelectorAll("[data-demo-root]").forEach(function (demoRoot) {
        initializePhysicsDemo(demoRoot);
        initializeTangentDemo(demoRoot);
        initializeForceGraph(demoRoot);
    });

    document.querySelectorAll("[data-toc-toggle]").forEach(function (toggle) {
        toggle.addEventListener("click", function () {
            var subsections = document.getElementById(toggle.getAttribute("aria-controls"));
            var expanded = toggle.getAttribute("aria-expanded") === "true";
            toggle.setAttribute("aria-expanded", String(!expanded));
            toggle.textContent = expanded ? "+" : "−";
            toggle.setAttribute("aria-label", (expanded ? "Show" : "Hide") + " subsections for " + toggle.parentElement.querySelector("a").textContent);
            subsections.hidden = expanded;
        });
    });

    document.querySelectorAll(".article-citation").forEach(function (citation) {
        var reference = document.querySelector(citation.getAttribute("href"));
        if (reference) {
            citation.dataset.citation = reference.textContent.trim();
        }
    });

    document.querySelectorAll(".article-section-reference").forEach(function (reference) {
        reference.addEventListener("click", function (event) {
            var target = document.querySelector(reference.getAttribute("href"));

            if (!target) {
                return;
            }

            event.preventDefault();
            window.history.pushState(null, "", reference.getAttribute("href"));
            target.scrollIntoView({
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
                block: "start"
            });

            window.setTimeout(function () {
                document.querySelectorAll(".article-section-highlight").forEach(function (highlighted) {
                    highlighted.classList.remove("article-section-highlight");
                });
                target.classList.add("article-section-highlight");
                window.setTimeout(function () {
                    target.classList.remove("article-section-highlight");
                }, 2400);
            }, 250);
        });
    });

});

function readDemoColors() {
    var styles = window.getComputedStyle(document.documentElement);

    return {
        accent: styles.getPropertyValue("--beyond-accent").trim(),
        brass: styles.getPropertyValue("--beyond-brass").trim(),
        canvasText: styles.getPropertyValue("--beyond-canvas-text").trim(),
        clay: styles.getPropertyValue("--beyond-clay").trim(),
        cognac: styles.getPropertyValue("--beyond-cognac").trim(),
        cream: styles.getPropertyValue("--beyond-cream").trim(),
        grid: styles.getPropertyValue("--beyond-grid").trim(),
        line: styles.getPropertyValue("--beyond-line").trim(),
        moss: styles.getPropertyValue("--beyond-moss").trim(),
        oat: styles.getPropertyValue("--beyond-oat").trim(),
        panel: styles.getPropertyValue("--beyond-panel").trim(),
        paper: styles.getPropertyValue("--beyond-paper").trim()
    };
}

function initializePhysicsDemo(demoRoot) {
    var canvas = demoRoot.querySelector("[data-physics-canvas]");
    var gravityInput = demoRoot.querySelector("[data-physics-gravity]");
    var slowButton = demoRoot.querySelector("[data-physics-slow]");
    var clearButton = demoRoot.querySelector("[data-physics-clear]");
    var stackButton = demoRoot.querySelector("[data-physics-stack]");

    if (!canvas || !gravityInput || !slowButton || !clearButton || !stackButton) {
        return;
    }

    var context = canvas.getContext("2d");
    var particles = [];
    var selectedParticle = null;
    var lastPointer = null;
    var slowMotion = false;
    var colors = readDemoColors();
    var palette = [colors.cognac, colors.brass, colors.clay, colors.moss, colors.oat, colors.accent];
    var width = canvas.width;
    var height = canvas.height;

    function addParticle(xPosition, yPosition, radius, velocityX, velocityY) {
        particles.push({
            x: xPosition,
            y: yPosition,
            radius: radius || 22,
            velocityX: velocityX || 0,
            velocityY: velocityY || 0,
            colorIndex: particles.length % palette.length
        });
    }

    function addStack() {
        var rowIndex;
        var columnIndex;

        for (rowIndex = 0; rowIndex < 4; rowIndex += 1) {
            for (columnIndex = 0; columnIndex < 4 - rowIndex; columnIndex += 1) {
                addParticle(545 + columnIndex * 48 + rowIndex * 24, 290 - rowIndex * 48, 20, 0, 0);
            }
        }
    }

    function positionFromEvent(event) {
        var bounds = canvas.getBoundingClientRect();
        return {
            x: (event.clientX - bounds.left) * (width / bounds.width),
            y: (event.clientY - bounds.top) * (height / bounds.height)
        };
    }

    function particleAt(position) {
        var particleIndex;
        var candidate;
        var distanceX;
        var distanceY;

        for (particleIndex = particles.length - 1; particleIndex >= 0; particleIndex -= 1) {
            candidate = particles[particleIndex];
            distanceX = candidate.x - position.x;
            distanceY = candidate.y - position.y;
            if (Math.hypot(distanceX, distanceY) <= candidate.radius) {
                return candidate;
            }
        }

        return null;
    }

    function updateParticles() {
        var gravity = Number(gravityInput.value) * (slowMotion ? 0.11 : 0.55);

        particles.forEach(function (particle) {
            if (particle === selectedParticle) {
                return;
            }

            particle.velocityY += gravity;
            particle.x += particle.velocityX;
            particle.y += particle.velocityY;
            particle.velocityX *= 0.996;
            particle.velocityY *= 0.996;

            if (particle.x - particle.radius < 0 || particle.x + particle.radius > width) {
                particle.x = Math.max(particle.radius, Math.min(width - particle.radius, particle.x));
                particle.velocityX *= -0.72;
            }

            if (particle.y - particle.radius < 0 || particle.y + particle.radius > height) {
                particle.y = Math.max(particle.radius, Math.min(height - particle.radius, particle.y));
                particle.velocityY *= -0.72;
            }
        });
    }

    function drawParticles() {
        context.clearRect(0, 0, width, height);
        context.fillStyle = colors.panel;
        context.fillRect(0, 0, width, height);
        context.strokeStyle = colors.grid;
        context.lineWidth = 1;

        for (var gridPosition = 0; gridPosition <= width; gridPosition += 50) {
            context.beginPath();
            context.moveTo(gridPosition, 0);
            context.lineTo(gridPosition, height);
            context.stroke();
        }

        for (var horizontalPosition = 0; horizontalPosition <= height; horizontalPosition += 50) {
            context.beginPath();
            context.moveTo(0, horizontalPosition);
            context.lineTo(width, horizontalPosition);
            context.stroke();
        }

        particles.forEach(function (particle) {
            var particleColor = palette[particle.colorIndex];

            context.beginPath();
            context.fillStyle = particleColor;
            context.shadowBlur = 20;
            context.shadowColor = particleColor;
            context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            context.fill();
        });

        context.shadowBlur = 0;
        context.fillStyle = colors.canvasText;
        context.font = "16px Lato, sans-serif";
        context.fillText("Objects: " + particles.length, 28, height - 28);
    }

    function animatePhysics() {
        updateParticles();
        drawParticles();
        window.requestAnimationFrame(animatePhysics);
    }

    canvas.addEventListener("pointerdown", function (event) {
        var position = positionFromEvent(event);
        selectedParticle = particleAt(position);
        lastPointer = position;
        canvas.setPointerCapture(event.pointerId);

        if (!selectedParticle) {
            addParticle(position.x, position.y, 22, 0, 0);
        }
    });

    canvas.addEventListener("pointermove", function (event) {
        if (!selectedParticle) {
            return;
        }

        var position = positionFromEvent(event);
        selectedParticle.velocityX = (position.x - lastPointer.x) * 0.82;
        selectedParticle.velocityY = (position.y - lastPointer.y) * 0.82;
        selectedParticle.x = position.x;
        selectedParticle.y = position.y;
        lastPointer = position;
    });

    function releaseParticle(event) {
        if (canvas.hasPointerCapture(event.pointerId)) {
            canvas.releasePointerCapture(event.pointerId);
        }
        selectedParticle = null;
        lastPointer = null;
    }

    canvas.addEventListener("pointerup", releaseParticle);
    canvas.addEventListener("pointercancel", releaseParticle);

    slowButton.addEventListener("click", function () {
        slowMotion = !slowMotion;
        slowButton.setAttribute("aria-pressed", String(slowMotion));
        slowButton.textContent = "Slow motion: " + (slowMotion ? "on" : "off");
    });

    clearButton.addEventListener("click", function () {
        particles = [];
    });

    stackButton.addEventListener("click", addStack);
    window.addEventListener("phusroyal-themechange", function () {
        colors = readDemoColors();
        palette = [colors.cognac, colors.brass, colors.clay, colors.moss, colors.oat, colors.accent];
    });
    addStack();
    animatePhysics();
}

function initializeTangentDemo(demoRoot) {
    var plot = demoRoot.querySelector("[data-tangent-plot]");
    var slider = demoRoot.querySelector("[data-tangent-slider]");
    var readout = demoRoot.querySelector("[data-tangent-readout]");

    if (!plot || !slider || !readout) {
        return;
    }

    var colors = readDemoColors();

    function addSvgElement(name, attributes) {
        var element = document.createElementNS("http://www.w3.org/2000/svg", name);
        Object.keys(attributes).forEach(function (attributeName) {
            element.setAttribute(attributeName, attributes[attributeName]);
        });
        plot.appendChild(element);
        return element;
    }

    function curveY(xPosition) {
        return 192 - Math.pow(xPosition - 240, 2) / 780 + Math.sin(xPosition / 42) * 18;
    }

    function curveSlope(xPosition) {
        return -(2 * (xPosition - 240)) / 780 + Math.cos(xPosition / 42) * (18 / 42);
    }

    function drawTangent() {
        var curvePath = "";
        var xPosition;
        var selectedX = Number(slider.value);
        var selectedY = curveY(selectedX);
        var slope = curveSlope(selectedX);
        var lineStartX = selectedX - 115;
        var lineEndX = selectedX + 115;
        var lineStartY = selectedY - slope * 115;
        var lineEndY = selectedY + slope * 115;

        plot.replaceChildren();
        addSvgElement("rect", {x: 0, y: 0, width: 480, height: 260, fill: colors.paper, rx: 10});
        addSvgElement("line", {x1: 24, y1: 220, x2: 456, y2: 220, stroke: colors.line, "stroke-width": 1});
        addSvgElement("line", {x1: 24, y1: 30, x2: 24, y2: 220, stroke: colors.line, "stroke-width": 1});

        for (xPosition = 24; xPosition <= 456; xPosition += 4) {
            curvePath += (xPosition === 24 ? "M" : "L") + xPosition + " " + curveY(xPosition) + " ";
        }

        addSvgElement("path", {d: curvePath, fill: "none", stroke: colors.accent, "stroke-width": 4, "stroke-linecap": "round"});
        addSvgElement("line", {x1: lineStartX, y1: lineStartY, x2: lineEndX, y2: lineEndY, stroke: colors.clay, "stroke-width": 3, "stroke-linecap": "round"});
        addSvgElement("circle", {cx: selectedX, cy: selectedY, r: 7, fill: colors.brass, stroke: colors.cream, "stroke-width": 3});
        readout.textContent = "x = " + Math.round(selectedX) + ", local slope = " + slope.toFixed(2);
    }

    slider.addEventListener("input", drawTangent);
    window.addEventListener("phusroyal-themechange", function () {
        colors = readDemoColors();
        drawTangent();
    });
    drawTangent();
}

function initializeForceGraph(demoRoot) {
    var graph = demoRoot.querySelector("[data-force-graph]");
    var resetButton = demoRoot.querySelector("[data-graph-reset]");

    if (!graph || !resetButton) {
        return;
    }

    var originalNodes = [
        {x: 120, y: 105, label: "Data"},
        {x: 285, y: 75, label: "Model"},
        {x: 480, y: 125, label: "Spans"},
        {x: 165, y: 260, label: "Text"},
        {x: 345, y: 275, label: "Scores"},
        {x: 535, y: 245, label: "Review"}
    ];
    var connections = [[0, 1], [0, 3], [1, 2], [1, 4], [2, 5], [3, 4], [4, 5]];
    var nodes = [];
    var links = [];
    var circles = [];
    var labels = [];
    var activeNode = null;
    var animationRunning = false;
    var colors = readDemoColors();

    function cloneNodes() {
        nodes = originalNodes.map(function (node) {
            return {x: node.x, y: node.y, label: node.label, velocityX: 0, velocityY: 0};
        });
    }

    function pointFromEvent(event) {
        var bounds = graph.getBoundingClientRect();
        return {
            x: (event.clientX - bounds.left) * (640 / bounds.width),
            y: (event.clientY - bounds.top) * (360 / bounds.height)
        };
    }

    function renderGraph() {
        links.forEach(function (link, linkIndex) {
            var connection = connections[linkIndex];
            link.setAttribute("x1", nodes[connection[0]].x);
            link.setAttribute("y1", nodes[connection[0]].y);
            link.setAttribute("x2", nodes[connection[1]].x);
            link.setAttribute("y2", nodes[connection[1]].y);
        });

        circles.forEach(function (circle, nodeIndex) {
            circle.setAttribute("cx", nodes[nodeIndex].x);
            circle.setAttribute("cy", nodes[nodeIndex].y);
            labels[nodeIndex].setAttribute("x", nodes[nodeIndex].x);
            labels[nodeIndex].setAttribute("y", nodes[nodeIndex].y + 4);
        });
    }

    function simulateGraph() {
        var firstIndex;
        var secondIndex;
        var distanceX;
        var distanceY;
        var distance;
        var repulsion;

        if (activeNode !== null) {
            window.requestAnimationFrame(simulateGraph);
            return;
        }

        for (firstIndex = 0; firstIndex < nodes.length; firstIndex += 1) {
            for (secondIndex = firstIndex + 1; secondIndex < nodes.length; secondIndex += 1) {
                distanceX = nodes[secondIndex].x - nodes[firstIndex].x;
                distanceY = nodes[secondIndex].y - nodes[firstIndex].y;
                distance = Math.max(Math.hypot(distanceX, distanceY), 1);
                repulsion = 1150 / (distance * distance);
                nodes[firstIndex].velocityX -= (distanceX / distance) * repulsion;
                nodes[firstIndex].velocityY -= (distanceY / distance) * repulsion;
                nodes[secondIndex].velocityX += (distanceX / distance) * repulsion;
                nodes[secondIndex].velocityY += (distanceY / distance) * repulsion;
            }
        }

        connections.forEach(function (connection) {
            var source = nodes[connection[0]];
            var target = nodes[connection[1]];
            var distanceX = target.x - source.x;
            var distanceY = target.y - source.y;
            var distance = Math.max(Math.hypot(distanceX, distanceY), 1);
            var attraction = (distance - 165) * 0.003;
            source.velocityX += (distanceX / distance) * attraction;
            source.velocityY += (distanceY / distance) * attraction;
            target.velocityX -= (distanceX / distance) * attraction;
            target.velocityY -= (distanceY / distance) * attraction;
        });

        nodes.forEach(function (node) {
            node.velocityX += (320 - node.x) * 0.0008;
            node.velocityY += (180 - node.y) * 0.0008;
            node.velocityX *= 0.88;
            node.velocityY *= 0.88;
            node.x = Math.max(40, Math.min(600, node.x + node.velocityX));
            node.y = Math.max(40, Math.min(320, node.y + node.velocityY));
        });

        renderGraph();
        if (animationRunning) {
            window.requestAnimationFrame(simulateGraph);
        }
    }

    function startSimulation() {
        if (!animationRunning) {
            animationRunning = true;
            window.requestAnimationFrame(simulateGraph);
        }
    }

    function buildGraph() {
        var namespace = "http://www.w3.org/2000/svg";

        graph.replaceChildren();
        graph.setAttribute("viewBox", "0 0 640 360");
        graph.style.background = colors.paper;
        graph.style.borderRadius = "0.55rem";
        graph.style.cursor = "grab";
        links = connections.map(function () {
            var link = document.createElementNS(namespace, "line");
            link.setAttribute("stroke", colors.line);
            link.setAttribute("stroke-width", "2");
            graph.appendChild(link);
            return link;
        });
        circles = nodes.map(function (node, nodeIndex) {
            var circle = document.createElementNS(namespace, "circle");
            circle.setAttribute("r", "28");
            circle.setAttribute("fill", nodeIndex % 2 === 0 ? colors.accent : colors.clay);
            circle.setAttribute("stroke", colors.cream);
            circle.setAttribute("stroke-width", "4");
            circle.setAttribute("data-node-index", nodeIndex);
            circle.style.cursor = "grab";
            graph.appendChild(circle);
            return circle;
        });
        labels = nodes.map(function (node) {
            var label = document.createElementNS(namespace, "text");
            label.textContent = node.label;
            label.setAttribute("fill", colors.cream);
            label.setAttribute("font-size", "10");
            label.setAttribute("font-weight", "700");
            label.setAttribute("text-anchor", "middle");
            label.setAttribute("pointer-events", "none");
            graph.appendChild(label);
            return label;
        });
        renderGraph();
    }

    graph.addEventListener("pointerdown", function (event) {
        var target = event.target;
        if (!target.hasAttribute("data-node-index")) {
            return;
        }
        activeNode = Number(target.getAttribute("data-node-index"));
        graph.setPointerCapture(event.pointerId);
    });

    graph.addEventListener("pointermove", function (event) {
        if (activeNode === null) {
            return;
        }
        var point = pointFromEvent(event);
        nodes[activeNode].x = point.x;
        nodes[activeNode].y = point.y;
        nodes[activeNode].velocityX = 0;
        nodes[activeNode].velocityY = 0;
        renderGraph();
    });

    function releaseNode(event) {
        if (graph.hasPointerCapture(event.pointerId)) {
            graph.releasePointerCapture(event.pointerId);
        }
        activeNode = null;
    }

    graph.addEventListener("pointerup", releaseNode);
    graph.addEventListener("pointercancel", releaseNode);
    resetButton.addEventListener("click", function () {
        cloneNodes();
        buildGraph();
    });

    window.addEventListener("phusroyal-themechange", function () {
        colors = readDemoColors();
        buildGraph();
    });

    cloneNodes();
    buildGraph();
    startSimulation();
}
