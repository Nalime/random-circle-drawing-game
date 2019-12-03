const canvas = document.querySelector("#draw");
const ctx = canvas.getContext("2d");
const scorePop = document.querySelector("#score-pop");
const scoresElements =
    [document.querySelector("#scores-perfect"),
    document.querySelector("#scores-great"),
    document.querySelector("#scores-good"),
    document.querySelector("#scores-bad")]
let vertices = [];
let isDrawing = false;
let sessionHigh = 0;
let careerHigh = 0;
let sessionScores = [0, 0, 0, 0];

loadCookies();
resetCanvasStyle();

document.addEventListener("pointerdown", onMouseDown, false);
document.addEventListener("mouseup", onMouseUp, false);
document.addEventListener("touchend", onMouseUp, false);
document.addEventListener("mousemove", onMouseMove, false);
document.addEventListener("touchmove", onTouchMove, false);

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    length() {
        return Math.hypot(this.x, this.y);
    }

    static add(v, w) {
        return new Point(v.x + w.x, v.y + w.y);
    }

    static diff(v, w) {
        return new Point(w.x - v.x, w.y - v.y);
    }

    static multiply(v, s) {
        return new Point(v.x * s, v.y * s);
    }

    static dot(v, w) {
        return v.x * w.x + v.y * w.y;
    }

    static dist(v, w) {
        return Math.hypot(v.x - w.x, v.y - w.y);
    }
}

function drawVertex(x, y, pressure) {
    ctx.lineWidth = pressure * 10;
    ctx.beginPath();
    if (vertices.length > 0)
        ctx.moveTo(vertices[vertices.length - 1].x, vertices[vertices.length - 1].y);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.closePath();
    vertices.push(new Point(x, y));
}

function evaluate() {
    // Accuracy calculation
    let totalLength = 0;

    let center = new Point(0, 0);
    for (let i = 1; i < vertices.length; i++) {
        let length = Point.dist(vertices[i], vertices[i - 1]);
        totalLength += length;
        center.x += vertices[i].x * length;
        center.y += vertices[i].y * length;
    }
    center.x /= totalLength;
    center.y /= totalLength;

    let radius = 0;
    for (let i = 1; i < vertices.length; i++) {
        let length = Point.dist(vertices[i], vertices[i - 1]);
        let distToCenter = Point.dist(vertices[i], center);
        radius += distToCenter * length;
    }
    radius /= totalLength;

    let radiusAccuracy = 0;
    for (let i = 1; i < vertices.length; i++) {
        let length = Point.dist(vertices[i], vertices[i - 1]);
        let distToCenter = Point.dist(vertices[i], center);

        let radiusAccuracyThis = Math.max(1 - Math.abs(distToCenter / radius - 1) / 0.15, 0);
        radiusAccuracy += radiusAccuracyThis * length;
    }
    radiusAccuracy /= totalLength;

    let startEndDiff = Point.dist(vertices[vertices.length - 1], center)
        - Point.dist(vertices[0], center);
    let startEndAccuracy = Math.max(1 - Math.pow(Math.abs(startEndDiff / radius) / 0.1, 2), 0);

    let accuracy = radiusAccuracy * 0.8 + startEndAccuracy * 0.2;

    // Draw reference circle
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#F008";
    ctx.beginPath();
    ctx.lineTo(center.x, center.y);
    ctx.stroke();
    ctx.closePath();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.closePath();
    resetCanvasStyle();

    if (accuracy > careerHigh) {
        careerHigh = accuracy;
        setCookie("careerHigh", accuracy);
    }

    if (accuracy > sessionHigh) {
        sessionHigh = accuracy;
    }

    // Increments appropriate score and show the "judgment"
    scorePop.innerHTML = "";
    if (accuracy < 0.6) {
        incrementScore(3);
        scorePop.innerHTML += "BAD";
        scorePop.style.color = "#15C";
    }
    else if (accuracy < 0.8) {
        incrementScore(2);
        scorePop.innerHTML += "GOOD";
        scorePop.style.color = "#9F3";
    }
    else if (accuracy < 0.9) {
        incrementScore(1);
        scorePop.innerHTML += " GREAT!";
        scorePop.style.color = "#D3B";
    }
    else {
        incrementScore(0);
        scorePop.innerHTML += "<strong> PERFECT!</strong>";
        scorePop.style.color = "#FFF";
    }
    scorePop.innerHTML += `<br><div id=\"score-percent\">${(accuracy * 100).toFixed(1)}%<br>`
        + `<div id=\"score-percent-detail\">(Radius: ${(radiusAccuracy * 100).toFixed(1)}%`
        + `, Start-End: ${(startEndAccuracy * 100).toFixed(1)}%)`
        + "</div></div>";

    scorePop.style.animation = 'none';
    scorePop.offsetHeight;
    scorePop.style.animation = null;
}

function incrementScore(index) {
    sessionScores[index]++;
    if (index === 0)
        incrementCookie("totalPerfects");

    let total = 0;
    for (const score of sessionScores)
        total += score;
    for (let i = 0; i < sessionScores.length; i++) {
        scoresElements[i].innerHTML = scoresElements[i].innerHTML.split("<br>")[0] + "<br>"
            + sessionScores[i] + "<br>"
            + `${(sessionScores[i] * 100 / total).toFixed(1)}%`;
    }
}

function loadCookies() {
    let cookieCareerHigh = getCookie("careerHigh");
    if (cookieCareerHigh !== undefined)
        careerHigh = Number.parseFloat(cookieCareerHigh);
}

function setCookie(key, value) {
    document.cookie = `${key}=${value}`;
}

function incrementCookie(key) {
    let value = getCookie(key);
    if (value !== undefined)
        setCookie(key, Number.parseInt(value) + 1);
    else
        setCookie(key, 1);
}

// https://stackoverflow.com/a/15724300
function getCookie(key) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + key + "=");
    if (parts.length == 2) return parts.pop().split(";").shift();
}

function resetCanvasStyle() {
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#FFF";
    ctx.lineCap = 'round';
}

function onMouseDown(e) {
    if (isDrawing)
        return;
    isDrawing = true;
    vertices = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function onMouseUp(e) {
    if (!isDrawing)
        return;
    if (vertices.length > 5)
        setTimeout(evaluate, 50);
    isDrawing = false;
}

function onMouseMove(e) {
    if (isDrawing) {
        mouseX = e.clientX - canvas.offsetLeft;
        mouseY = e.clientY - canvas.offsetTop;
        drawVertex(mouseX, mouseY, 0.5);
    }
}

function onTouchMove(e) {
    if (isDrawing && e.touches) {
        let touch = e.touches[0];
        touchX = touch.pageX - canvas.offsetLeft;
        touchY = touch.pageY - canvas.offsetTop;
        drawVertex(touchX, touchY, 0.2 + 0.6 * touch.force);
    }
}