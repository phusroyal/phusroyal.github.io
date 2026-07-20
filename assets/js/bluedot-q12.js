(function () {
    "use strict";

    var renderers = [];

    function colors() {
        var styles = window.getComputedStyle(document.documentElement);
        return {
            accent: styles.getPropertyValue("--beyond-accent").trim(),
            bodyPart: styles.getPropertyValue("--bluedot-body-part").trim(),
            brass: styles.getPropertyValue("--beyond-brass").trim(),
            clay: styles.getPropertyValue("--beyond-clay").trim(),
            color: styles.getPropertyValue("--bluedot-color").trim(),
            country: styles.getPropertyValue("--bluedot-country").trim(),
            food: styles.getPropertyValue("--bluedot-food").trim(),
            ink: styles.getPropertyValue("--beyond-ink").trim(),
            line: styles.getPropertyValue("--beyond-line").trim(),
            moss: styles.getPropertyValue("--beyond-moss").trim(),
            muted: styles.getPropertyValue("--beyond-muted").trim(),
            number: styles.getPropertyValue("--bluedot-number").trim(),
            oat: styles.getPropertyValue("--beyond-oat").trim(),
            paper: styles.getPropertyValue("--beyond-paper").trim(),
            person: styles.getPropertyValue("--bluedot-person").trim(),
            question: styles.getPropertyValue("--bluedot-question").trim(),
            sentiment: styles.getPropertyValue("--bluedot-sentiment").trim()
        };
    }

    function hexRgb(value) {
        var normalized = value.replace("#", "");
        return {
            red: parseInt(normalized.slice(0, 2), 16),
            green: parseInt(normalized.slice(2, 4), 16),
            blue: parseInt(normalized.slice(4, 6), 16)
        };
    }

    function mix(first, second, amount) {
        var left = hexRgb(first);
        var right = hexRgb(second);
        var clamped = Math.max(0, Math.min(1, amount));
        return "rgb(" + Math.round(left.red + (right.red - left.red) * clamped) + ", " + Math.round(left.green + (right.green - left.green) * clamped) + ", " + Math.round(left.blue + (right.blue - left.blue) * clamped) + ")";
    }

    function featureColors(palette) {
        return {country: palette.country, food: palette.food, sentiment: palette.sentiment, color: palette.color, question: palette.question, number: palette.number, person: palette.person, body_part: palette.bodyPart};
    }

    function featureIcons() {
        return {number: "\uD83E\uDDEE", question: "\u2753", color: "\uD83C\uDFA8", food: "\uD83C\uDF54", sentiment: "\uD83D\uDE42", country: "\uD83C\uDF0D", person: "\uD83D\uDC64", body_part: "\uD83D\uDD90"};
    }

    function canvasContext(canvas) {
        var bounds = canvas.getBoundingClientRect();
        var ratio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.round(bounds.width * ratio));
        canvas.height = Math.max(1, Math.round(bounds.height * ratio));
        var context = canvas.getContext("2d");
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        return {context: context, width: bounds.width, height: bounds.height};
    }

    function range(values) {
        return values.reduce(function (result, value) {
            return {min: Math.min(result.min, value), max: Math.max(result.max, value)};
        }, {min: Infinity, max: -Infinity});
    }

    function paddedRange(values) {
        var result = range(values);
        var padding = (result.max - result.min || 1) * 0.08;
        return {min: result.min - padding, max: result.max + padding};
    }

    function scale(value, source, start, end) {
        return start + ((value - source.min) / (source.max - source.min || 1)) * (end - start);
    }

    function drawAxes(context, chart, xRange, yRange, labels) {
        var palette = colors();
        context.clearRect(0, 0, chart.width, chart.height);
        context.fillStyle = palette.paper;
        context.fillRect(0, 0, chart.width, chart.height);
        context.strokeStyle = palette.line;
        context.lineWidth = 1;
        context.font = "12px Lato, sans-serif";
            context.fillStyle = palette.muted;
            for (var index = 0; index < 5; index += 1) {
            var x = chart.left + (chart.right - chart.left) * index / 4;
            var y = chart.top + (chart.bottom - chart.top) * index / 4;
            context.beginPath();
            context.moveTo(x, chart.top);
            context.lineTo(x, chart.bottom);
            context.moveTo(chart.left, y);
            context.lineTo(chart.right, y);
            context.stroke();
            var xValue = xRange.min + (xRange.max - xRange.min) * index / 4;
            var yValue = yRange.max - (yRange.max - yRange.min) * index / 4;
            context.textAlign = "center";
            context.fillText(xValue.toFixed(1), x, chart.bottom + 18);
            context.textAlign = "right";
            context.fillText(yValue.toFixed(1), chart.left - 9, y + 4);
            }
        context.textAlign = "center";
        context.fillText(labels.x, (chart.left + chart.right) / 2, chart.bottom + 43);
        context.save();
        context.translate(labels.yLabelX || 13, (chart.top + chart.bottom) / 2);
        context.rotate(-Math.PI / 2);
        context.textAlign = "center";
        context.fillText(labels.y, 0, 0);
        context.restore();
        context.textAlign = "left";
    }

    function drawLegend(context, items, startX, startY) {
        context.font = "12px Lato, sans-serif";
        items.forEach(function (item, index) {
            var row = Math.floor(index / 2);
            var column = index % 2;
            var x = startX + column * 108;
            var y = startY + row * 17;
            context.fillStyle = item.color;
            context.beginPath();
            context.arc(x, y - 4, 4, 0, Math.PI * 2);
            context.fill();
            context.fillStyle = colors().ink;
            context.fillText(item.label, x + 8, y);
        });
    }

    function createSvgElement(name, attributes) {
        var element = document.createElementNS("http://www.w3.org/2000/svg", name);
        Object.keys(attributes || {}).forEach(function (key) {
            element.setAttribute(key, attributes[key]);
        });
        return element;
    }

    function renderCausal(figure, data) {
        var svg = figure.querySelector("svg");
        var status = figure.querySelector("[data-bluedot-status]");
        var state = {hover: null, hoverFeature: null, selectedFeatures: []};

        function draw() {
            var palette = colors();
            var width = Math.max(320, svg.getBoundingClientRect().width || 760);
            var height = Math.max(260, svg.getBoundingClientRect().height || 360);
            var bounds = {left: 58, right: width - 130, top: 18, bottom: height - 58};
            var selected = data.features;
            var yValues = selected.reduce(function (all, feature) { return all.concat(feature.curve); }, []);
            var xRange = paddedRange(data.alphas);
            var yRange = paddedRange(yValues);
            var lineColors = featureColors(palette);
            var icons = featureIcons();
            svg.replaceChildren();
            svg.setAttribute("viewBox", "0 0 " + width + " " + height);
            svg.setAttribute("preserveAspectRatio", "none");
            for (var grid = 0; grid < 5; grid += 1) {
                var gridX = bounds.left + (bounds.right - bounds.left) * grid / 4;
                var gridY = bounds.top + (bounds.bottom - bounds.top) * grid / 4;
                svg.appendChild(createSvgElement("line", {x1: gridX, x2: gridX, y1: bounds.top, y2: bounds.bottom, stroke: palette.line, "stroke-width": 1}));
                svg.appendChild(createSvgElement("line", {x1: bounds.left, x2: bounds.right, y1: gridY, y2: gridY, stroke: palette.line, "stroke-width": 1}));
                var xText = createSvgElement("text", {x: gridX, y: height - 29, fill: palette.muted, "font-size": 11, "text-anchor": "middle"});
                xText.textContent = (xRange.min + (xRange.max - xRange.min) * grid / 4).toFixed(1);
                svg.appendChild(xText);
            }
            selected.forEach(function (feature) {
                var path = feature.curve.map(function (value, index) {
                    var x = scale(data.alphas[index], xRange, bounds.left, bounds.right);
                    var y = scale(value, yRange, bounds.bottom, bounds.top);
                    return (index === 0 ? "M" : "L") + x.toFixed(2) + " " + y.toFixed(2);
                }).join(" ");
                var focused = state.hoverFeature === feature.name;
                var pinned = state.selectedFeatures.indexOf(feature.name) !== -1;
                var dimmed = (state.selectedFeatures.length && !pinned) || (state.hoverFeature && !focused);
                var pathElement = createSvgElement("path", {d: path, fill: "none", stroke: lineColors[feature.name], "stroke-width": focused || pinned || feature.name === "country" ? 3.4 : 2, "stroke-linecap": "round", "stroke-opacity": dimmed ? 0.14 : 1, "pointer-events": "stroke"});
                pathElement.dataset.feature = feature.name;
                svg.appendChild(pathElement);
            });
            selected.forEach(function (feature, index) {
                var focused = state.hoverFeature === feature.name;
                var pinned = state.selectedFeatures.indexOf(feature.name) !== -1;
                var legendY = bounds.top + 19 + index * Math.max(22, (bounds.bottom - bounds.top - 22) / Math.max(1, selected.length - 1));
                var legendX = bounds.right + 18;
                var legendOpacity = (state.selectedFeatures.length && !pinned) || (state.hoverFeature && !focused) ? 0.28 : 1;
                var icon = createSvgElement("text", {x: legendX, y: legendY, "font-size": focused || pinned ? 20 : 16, opacity: legendOpacity, "pointer-events": "all", cursor: "pointer"});
                icon.textContent = icons[feature.name];
                icon.dataset.feature = feature.name;
                svg.appendChild(icon);
                var label = createSvgElement("text", {x: legendX + 24, y: legendY - 1, fill: focused || pinned ? lineColors[feature.name] : palette.ink, "font-size": focused || pinned ? 13 : 12, "font-weight": focused || pinned ? 700 : 400, opacity: legendOpacity, "pointer-events": "all", cursor: "pointer"});
                label.textContent = feature.name.replace("_", " ");
                label.dataset.feature = feature.name;
                svg.appendChild(label);
            });
            var axis = createSvgElement("text", {x: (bounds.left + bounds.right) / 2, y: height - 8, fill: palette.muted, "font-size": 12, "text-anchor": "middle"});
            axis.textContent = "steering strength α";
            svg.appendChild(axis);
            if (state.hover !== null) {
                var hoverX = scale(data.alphas[state.hover], xRange, bounds.left, bounds.right);
                svg.appendChild(createSvgElement("line", {x1: hoverX, x2: hoverX, y1: bounds.top, y2: bounds.bottom, stroke: palette.muted, "stroke-width": 1, "stroke-dasharray": "3 3"}));
                var country = data.features.filter(function (feature) { return feature.name === (state.hoverFeature || "country"); })[0];
                var tooltip = createSvgElement("text", {x: Math.min(bounds.right - 120, hoverX + 8), y: bounds.top + 17, fill: palette.ink, "font-size": 12});
                tooltip.textContent = "α " + data.alphas[state.hover].toFixed(1) + " · " + country.name + " " + country.curve[state.hover].toFixed(1);
                svg.appendChild(tooltip);
            }
        }

        svg.addEventListener("pointermove", function (event) {
            var rect = svg.getBoundingClientRect();
            var relativeX = (event.clientX - rect.left) / rect.width * svg.viewBox.baseVal.width;
            var relativeY = (event.clientY - rect.top) / rect.height * svg.viewBox.baseVal.height;
            var inChart = relativeX >= 58 && relativeX <= svg.viewBox.baseVal.width - 130 && relativeY >= 18 && relativeY <= svg.viewBox.baseVal.height - 58;
            var nextFeature = event.target.dataset.feature || null;
            var nextHover = inChart ? Math.round((relativeX - 58) / Math.max(1, svg.viewBox.baseVal.width - 188) * (data.alphas.length - 1)) : null;
            if (state.hover !== nextHover || state.hoverFeature !== nextFeature) {
                state.hover = nextHover;
                state.hoverFeature = nextFeature;
                draw();
            }
        });
        svg.addEventListener("pointerleave", function () { state.hover = null; state.hoverFeature = null; draw(); });
        svg.addEventListener("click", function (event) {
            var feature = event.target.dataset.feature;
            if (!feature) { return; }
            var index = state.selectedFeatures.indexOf(feature);
            if (index === -1) { state.selectedFeatures.push(feature); } else { state.selectedFeatures.splice(index, 1); }
            draw();
        });
        status.textContent = "";
        draw();
        return {draw: draw};
    }

    function renderGradient(figure, data) {
        var canvas = figure.querySelector("canvas");
        var status = figure.querySelector("[data-bluedot-status]");
        var state = {hoverFeature: null, selectedFeatures: [], hitPoints: [], legendItems: []};
        function draw() {
            var frame = canvasContext(canvas);
            var context = frame.context;
            var chart = {width: frame.width, height: frame.height, left: 58, right: frame.width - 130, top: 16, bottom: frame.height - 58};
            var allPoints = data.features.reduce(function (values, feature) { return values.concat(feature.points); }, []);
            var xRange = paddedRange(allPoints.map(function (point) { return point[0]; }));
            var yRange = paddedRange(allPoints.map(function (point) { return point[1]; }));
            var palette = colors();
            var pointColors = featureColors(palette);
            var icons = featureIcons();
            state.hitPoints = [];
            state.legendItems = [];
            drawAxes(context, chart, xRange, yRange, {x: "gradient PC1", y: "gradient PC2", yLabelX: 14});
            data.features.forEach(function (feature) {
                var focused = state.hoverFeature === feature.name;
                var pinned = state.selectedFeatures.indexOf(feature.name) !== -1;
                if (state.selectedFeatures.length && !pinned) { return; }
                var blurred = state.hoverFeature && !focused;
                context.fillStyle = blurred ? palette.line : pointColors[feature.name];
                context.globalAlpha = blurred ? 0.42 : (feature.name === "country" ? 0.84 : 0.54);
                feature.points.forEach(function (point) {
                    var x = scale(point[0], xRange, chart.left, chart.right);
                    var y = scale(point[1], yRange, chart.bottom, chart.top);
                    context.beginPath();
                    context.arc(x, y, blurred ? 1 : (focused ? 3 : (feature.name === "country" ? 2.2 : 1.7)), 0, Math.PI * 2);
                    context.fill();
                    state.hitPoints.push({feature: feature.name, x: x, y: y});
                });
            });
            context.globalAlpha = 1;
            data.features.forEach(function (feature, index) {
                var focused = state.hoverFeature === feature.name;
                var pinned = state.selectedFeatures.indexOf(feature.name) !== -1;
                var legendY = chart.top + 17 + index * Math.max(21, (chart.bottom - chart.top - 22) / Math.max(1, data.features.length - 1));
                var legendX = chart.right + 18;
                context.globalAlpha = state.selectedFeatures.length && !pinned ? 0.25 : (state.hoverFeature && !focused ? 0.25 : 1);
                context.font = (focused || pinned ? "700 " : "") + "13px Lato, sans-serif";
                context.fillStyle = pointColors[feature.name];
                context.fillText(icons[feature.name], legendX, legendY);
                context.fillStyle = focused || pinned ? pointColors[feature.name] : palette.ink;
                context.fillText(feature.name.replace("_", " "), legendX + 24, legendY - 1);
                state.legendItems.push({feature: feature.name, x: legendX - 5, y: legendY - 17, width: 106, height: 23});
            });
            context.globalAlpha = 1;
        }
        canvas.addEventListener("pointermove", function (event) {
            var rect = canvas.getBoundingClientRect();
            var x = event.clientX - rect.left;
            var y = event.clientY - rect.top;
            var nextFeature = null;
            state.legendItems.some(function (item) {
                if (x >= item.x && x <= item.x + item.width && y >= item.y && y <= item.y + item.height) { nextFeature = item.feature; return true; }
                return false;
            });
            if (!nextFeature) {
                var closest = state.hitPoints.reduce(function (result, point) {
                    var distance = Math.hypot(point.x - x, point.y - y);
                    return distance < result.distance ? {distance: distance, feature: point.feature} : result;
                }, {distance: 9, feature: null});
                nextFeature = closest.feature;
            }
            if (state.hoverFeature !== nextFeature) { state.hoverFeature = nextFeature; draw(); }
        });
        canvas.addEventListener("pointerleave", function () { if (state.hoverFeature) { state.hoverFeature = null; draw(); } });
        canvas.addEventListener("click", function (event) {
            var rect = canvas.getBoundingClientRect();
            var x = event.clientX - rect.left;
            var y = event.clientY - rect.top;
            var clickedFeature = null;
            state.legendItems.some(function (item) {
                if (x >= item.x && x <= item.x + item.width && y >= item.y && y <= item.y + item.height) { clickedFeature = item.feature; return true; }
                return false;
            });
            if (!clickedFeature) {
                var closest = state.hitPoints.reduce(function (result, point) {
                    var distance = Math.hypot(point.x - x, point.y - y);
                    return distance < result.distance ? {distance: distance, feature: point.feature} : result;
                }, {distance: 9, feature: null});
                clickedFeature = closest.feature;
            }
            if (!clickedFeature) { return; }
            var index = state.selectedFeatures.indexOf(clickedFeature);
            if (index === -1) { state.selectedFeatures.push(clickedFeature); } else { state.selectedFeatures.splice(index, 1); }
            draw();
        });
        status.textContent = "";
        draw();
        return {draw: draw};
    }

    function renderRepresentation(figure, data) {
        var stage = figure.querySelector(".bluedot-representation-grid");
        var status = figure.querySelector("[data-bluedot-status]");
        var state = {features: ["country", "body_part"], views: {country: {pitch: -0.38, yaw: 0.72}, body_part: {pitch: -0.38, yaw: 0.72}}};

        function rotate(point, view) {
            var cosineY = Math.cos(view.yaw);
            var sineY = Math.sin(view.yaw);
            var cosineX = Math.cos(view.pitch);
            var sineX = Math.sin(view.pitch);
            var x = point[0] * cosineY - point[2] * sineY;
            var depth = point[0] * sineY + point[2] * cosineY;
            var y = point[1] * cosineX - depth * sineX;
            return {x: x, y: y, depth: point[1] * sineX + depth * cosineX};
        }

        function drawPanel(canvas, feature) {
            var frame = canvasContext(canvas);
            var context = frame.context;
            var palette = colors();
            var pointColors = featureColors(palette);
            var active = data.features[feature];
            var rotated = active.points.map(function (point) { return rotate(point, state.views[feature]); });
            var extent = Math.max.apply(null, rotated.map(function (point) { return Math.max(Math.abs(point.x), Math.abs(point.y)); })) || 1;
            var centerX = frame.width / 2;
            var centerY = frame.height / 2;
            var scaleValue = Math.min(frame.width, frame.height) * 0.4 / extent;
            context.clearRect(0, 0, frame.width, frame.height);
            context.fillStyle = palette.paper;
            context.fillRect(0, 0, frame.width, frame.height);
            rotated.map(function (point, index) { return {point: point, index: index}; }).sort(function (first, second) { return first.point.depth - second.point.depth; }).forEach(function (item) {
                var point = item.point;
                var index = item.index;
                var positive = Boolean(active.labels[index]);
                context.fillStyle = positive ? pointColors[feature] : palette.ink;
                context.globalAlpha = positive ? 0.48 + (point.depth + extent) / (2 * extent) * 0.42 : 0.68;
                context.beginPath();
                context.arc(centerX + point.x * scaleValue, centerY - point.y * scaleValue, positive ? 2.3 + (point.depth + extent) / (2 * extent) * 1.4 : 2.1, 0, Math.PI * 2);
                context.fill();
            });
            context.globalAlpha = 1;
        }

        function draw() {
            stage.querySelectorAll("canvas").forEach(function (canvas) { drawPanel(canvas, canvas.dataset.feature); });
        }

        function bindDrag(canvas, feature) {
            var drag = {active: false, pointerX: 0, pointerY: 0};
            canvas.addEventListener("pointerdown", function (event) { drag.active = true; drag.pointerX = event.clientX; drag.pointerY = event.clientY; canvas.setPointerCapture(event.pointerId); });
            canvas.addEventListener("pointermove", function (event) {
                if (!drag.active) { return; }
                state.views[feature].yaw += (event.clientX - drag.pointerX) * 0.012;
                state.views[feature].pitch += (event.clientY - drag.pointerY) * 0.012;
                drag.pointerX = event.clientX;
                drag.pointerY = event.clientY;
                drawPanel(canvas, feature);
            });
            canvas.addEventListener("pointerup", function () { drag.active = false; });
            canvas.addEventListener("pointercancel", function () { drag.active = false; });
        }

        function rebuildGrid() {
            stage.replaceChildren();
            stage.dataset.count = String(state.features.length);
            state.features.forEach(function (feature) {
                if (!state.views[feature]) { state.views[feature] = {pitch: -0.38, yaw: 0.72}; }
                var panel = document.createElement("div");
                var icon = document.createElement("span");
                var canvas = document.createElement("canvas");
                panel.className = "bluedot-representation-panel";
                icon.className = "bluedot-representation-panel-icon";
                icon.textContent = featureIcons()[feature];
                icon.setAttribute("aria-hidden", "true");
                canvas.dataset.feature = feature;
                canvas.setAttribute("aria-label", feature.replace("_", " ") + " activation projection");
                canvas.setAttribute("role", "img");
                panel.appendChild(icon);
                panel.appendChild(canvas);
                stage.appendChild(panel);
                bindDrag(canvas, feature);
            });
            draw();
        }

        function updateFeatureButtons() {
            figure.querySelectorAll("[data-representation-feature]").forEach(function (button) {
                button.setAttribute("aria-pressed", String(state.features.indexOf(button.dataset.representationFeature) !== -1));
            });
        }

        figure.querySelectorAll("[data-representation-feature]").forEach(function (button) {
            button.addEventListener("click", function () {
                var feature = button.dataset.representationFeature;
                var index = state.features.indexOf(feature);
                if (index === -1) { state.features.push(feature); }
                else if (state.features.length > 1) { state.features.splice(index, 1); }
                updateFeatureButtons();
                rebuildGrid();
            });
        });
        status.textContent = "";
        updateFeatureButtons();
        rebuildGrid();
        return {draw: draw};
    }

    function drawEllipse(context, center, covariance, level, mapX, mapY, color) {
        var a = covariance[0][0];
        var b = covariance[1][0];
        var d = covariance[1][1];
        var first = Math.sqrt(Math.max(a, 0));
        var lower = b / (first || 1);
        var second = Math.sqrt(Math.max(d - lower * lower, 0));
        context.strokeStyle = color;
        context.lineWidth = 1.4;
        context.setLineDash([5, 4]);
        context.beginPath();
        for (var step = 0; step <= 80; step += 1) {
            var angle = Math.PI * 2 * step / 80;
            var radius = Math.sqrt(level);
            var x = center[0] + radius * first * Math.cos(angle);
            var y = center[1] + radius * (lower * Math.cos(angle) + second * Math.sin(angle));
            if (step === 0) { context.moveTo(mapX(x), mapY(y)); } else { context.lineTo(mapX(x), mapY(y)); }
        }
        context.stroke();
        context.setLineDash([]);
    }

    function renderRadial(figure, data) {
        var canvas = figure.querySelector("canvas");
        var status = figure.querySelector("[data-bluedot-status]");
        var state = {feature: "country", boundary: "radius", samples: true};
        function draw() {
            var frame = canvasContext(canvas);
            var context = frame.context;
            var chart = {width: frame.width, height: frame.height, left: 42, right: frame.width - 18, top: 16, bottom: frame.height - 58};
            var active = data.features[state.feature];
            var xRange = {min: active.xAxis[0], max: active.xAxis[active.xAxis.length - 1]};
            var yRange = {min: active.yAxis[0], max: active.yAxis[active.yAxis.length - 1]};
            var palette = colors();
            drawAxes(context, chart, xRange, yRange, {x: "activation PC1", y: "activation PC2"});
            var values = active.logitGrid.reduce(function (all, row) { return all.concat(row); }, []);
            var valueRange = range(values);
            active.logitGrid.forEach(function (row, yIndex) { row.forEach(function (value, xIndex) {
                context.fillStyle = mix(palette.paper, palette.accent, (value - valueRange.min) / (valueRange.max - valueRange.min || 1) * 0.42);
                var left = chart.left + (chart.right - chart.left) * xIndex / row.length;
                var top = chart.top + (chart.bottom - chart.top) * (row.length - yIndex - 1) / active.logitGrid.length;
                context.fillRect(left, top, (chart.right - chart.left) / row.length + 1, (chart.bottom - chart.top) / active.logitGrid.length + 1);
            }); });
            var mapX = function (value) { return scale(value, xRange, chart.left, chart.right); };
            var mapY = function (value) { return scale(value, yRange, chart.bottom, chart.top); };
            if (state.samples) {
                active.points.forEach(function (point, index) {
                    context.fillStyle = active.labels[index] ? palette.accent : palette.moss;
                    context.globalAlpha = 0.62;
                    context.beginPath();
                    context.arc(mapX(point[0]), mapY(point[1]), 2, 0, Math.PI * 2);
                    context.fill();
                });
                context.globalAlpha = 1;
            }
            if (state.boundary === "mahalanobis") {
                active.ellipseLevels.forEach(function (level) { drawEllipse(context, active.ellipseCenter, active.ellipseCovariance, level, mapX, mapY, palette.brass); });
            } else {
                context.strokeStyle = palette.brass;
                context.lineWidth = 1.4;
                context.setLineDash([5, 4]);
                active.radiusLevels.forEach(function (level) {
                    context.beginPath();
                    context.arc(mapX(active.radiusCenter[0]), mapY(active.radiusCenter[1]), level * ((chart.right - chart.left) / (xRange.max - xRange.min)) * 2.2, 0, Math.PI * 2);
                    context.stroke();
                });
                context.setLineDash([]);
            }
            context.fillStyle = palette.ink;
            context.font = "12px Lato, sans-serif";
            context.fillText("Mahalanobis AUC " + active.metrics.mahalanobis_radius_auc.toFixed(4), chart.left + 8, chart.top + 18);
            context.fillText("linear AUC " + active.metrics.linear_probe_auc.toFixed(4), chart.left + 8, chart.top + 35);
        }
        figure.querySelector("[data-radial-feature]").addEventListener("change", function (event) { state.feature = event.target.value; draw(); });
        figure.querySelectorAll("[data-radial-boundary]").forEach(function (button) { button.addEventListener("click", function () { state.boundary = button.dataset.radialBoundary; figure.querySelectorAll("[data-radial-boundary]").forEach(function (item) { item.setAttribute("aria-pressed", String(item === button)); }); draw(); }); });
        figure.querySelector("[data-radial-samples]").addEventListener("click", function (button) { state.samples = !state.samples; button.currentTarget.textContent = state.samples ? "Hide samples" : "Show samples"; button.currentTarget.setAttribute("aria-pressed", String(state.samples)); draw(); });
        status.textContent = "";
        draw();
        return {draw: draw};
    }

    function drawZeroContour(context, grid, chart, color) {
        var rows = grid.length - 1;
        var columns = grid[0].length - 1;
        context.strokeStyle = color;
        context.lineWidth = 1.3;
        for (var row = 0; row < rows; row += 1) {
            for (var column = 0; column < columns; column += 1) {
                var values = [grid[row][column], grid[row][column + 1], grid[row + 1][column + 1], grid[row + 1][column]];
                var positions = [[column, row], [column + 1, row], [column + 1, row + 1], [column, row + 1]];
                var crossings = [];
                for (var edge = 0; edge < 4; edge += 1) {
                    var next = (edge + 1) % 4;
                    if ((values[edge] < 0) !== (values[next] < 0)) {
                        var weight = values[edge] / (values[edge] - values[next]);
                        crossings.push([positions[edge][0] + (positions[next][0] - positions[edge][0]) * weight, positions[edge][1] + (positions[next][1] - positions[edge][1]) * weight]);
                    }
                }
                for (var pair = 0; pair + 1 < crossings.length; pair += 2) {
                    context.beginPath();
                    context.moveTo(chart.left + crossings[pair][0] / columns * (chart.right - chart.left), chart.top + crossings[pair][1] / rows * (chart.bottom - chart.top));
                    context.lineTo(chart.left + crossings[pair + 1][0] / columns * (chart.right - chart.left), chart.top + crossings[pair + 1][1] / rows * (chart.bottom - chart.top));
                    context.stroke();
                }
            }
        }
    }

    function renderLandscapes(figure, data) {
        var status = figure.querySelector("[data-bluedot-status]");
        var canvases = figure.querySelectorAll("[data-landscape]");
        function drawOne(canvas, name) {
            var frame = canvasContext(canvas);
            var context = frame.context;
            var chart = {width: frame.width, height: frame.height, left: 28, right: frame.width - 8, top: 8, bottom: frame.height - 24};
            var grid = data.features[name].grid;
            var valueRange = range(grid.reduce(function (all, row) { return all.concat(row); }, []));
            var palette = colors();
            context.fillStyle = palette.paper;
            context.fillRect(0, 0, frame.width, frame.height);
            grid.forEach(function (row, rowIndex) { row.forEach(function (value, columnIndex) {
                context.fillStyle = mix(palette.moss, palette.accent, (value - valueRange.min) / (valueRange.max - valueRange.min || 1));
                context.fillRect(chart.left + columnIndex / row.length * (chart.right - chart.left), chart.top + (grid.length - rowIndex - 1) / grid.length * (chart.bottom - chart.top), (chart.right - chart.left) / row.length + 1, (chart.bottom - chart.top) / grid.length + 1);
            }); });
            drawZeroContour(context, grid, chart, palette.cream || palette.paper);
            context.fillStyle = palette.ink;
            context.font = "11px Lato, sans-serif";
            context.fillText("logit = 0", chart.left + 4, chart.top + 14);
        }
        function draw() { canvases.forEach(function (canvas) { drawOne(canvas, canvas.dataset.landscape); }); }
        status.textContent = "";
        draw();
        return {draw: draw};
    }

    function buildRenderer(figure, data) {
        var type = figure.dataset.bluedotFigure;
        if (type === "causal") { return renderCausal(figure, data); }
        if (type === "gradient") { return renderGradient(figure, data); }
        if (type === "representation") { return renderRepresentation(figure, data); }
        if (type === "radial") { return renderRadial(figure, data); }
        if (type === "landscapes") { return renderLandscapes(figure, data); }
        throw new Error("Unknown BlueDot figure: " + type);
    }

    function loadFigure(figure) {
        if (figure.dataset.bluedotLoaded) { return; }
        figure.dataset.bluedotLoaded = "loading";
        fetch(figure.dataset.bluedotSrc).then(function (response) {
            if (!response.ok) { throw new Error("Unable to load figure data"); }
            return response.json();
        }).then(function (data) {
            var renderer = buildRenderer(figure, data);
            renderers.push(renderer);
            figure.dataset.bluedotLoaded = "true";
            figure.classList.add("is-enhanced");
        }).catch(function () {
            figure.dataset.bluedotLoaded = "failed";
            var status = figure.querySelector("[data-bluedot-status]");
            if (status) { status.textContent = "Interactive data could not load; showing the original figure."; }
        });
    }

    function initialize() {
        var figures = Array.prototype.slice.call(document.querySelectorAll("[data-bluedot-figure]"));
        if (!figures.length || !window.fetch) { return; }
        if ("IntersectionObserver" in window) {
            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) { if (entry.isIntersecting) { loadFigure(entry.target); observer.unobserve(entry.target); } });
            }, {rootMargin: "240px 0px"});
            figures.forEach(function (figure) { observer.observe(figure); });
        } else {
            figures.forEach(loadFigure);
        }
        window.addEventListener("resize", function () { window.requestAnimationFrame(function () { renderers.forEach(function (renderer) { renderer.draw(); }); }); });
        window.addEventListener("phusroyal-themechange", function () { window.requestAnimationFrame(function () { renderers.forEach(function (renderer) { renderer.draw(); }); }); });
    }

    document.addEventListener("DOMContentLoaded", initialize);
}());
