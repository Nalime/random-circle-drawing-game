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

function drawVertex(x, y, pressure) {
    ctx.lineWidth = pressure * 10;
    ctx.beginPath();
    if (vertices.length > 0)
        ctx.moveTo(vertices[vertices.length - 1][0] / 2, vertices[vertices.length - 1][1] / 2);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.closePath();
    vertices.push([2 * x, 2 * y, 1]);
}

function leastSquaresCircle() {
    // Least squares solution
    let ATA = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];

    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++)
            for (let k = 0; k < vertices.length; k++)
                ATA[i][j] += vertices[k][i] * vertices[k][j];

    let ATb = [];
    let temp = 0;

    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < vertices.length; j++)
            temp += vertices[j][i] * (Math.pow(vertices[j][0], 2) + Math.pow(vertices[j][1], 2));
        ATb.push(temp);
        temp = 0;
    }

    // Gauss-Jordan Elimination
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (i === j)
                continue;
            let m = ATA[j][i] / ATA[i][i];
            for (let k = i; k < 3; k++)
                ATA[j][k] -= ATA[i][k] * m;
            ATb[j] -= ATb[i] * m;
        }
    }

    let sol = [];
    for (let i = 0; i < 3; i++)
        sol.push(ATb[i] / ATA[i][i]);

    let center = [sol[0] / 4, sol[1] / 4];
    let radius = Math.sqrt(sol[2] + Math.pow(center[0] * 2, 2) + Math.pow(center[1] * 2, 2)) / 2;

    // Draw reference circle
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#F008";
    ctx.beginPath();
    ctx.lineTo(center[0], center[1]);
    ctx.stroke();
    ctx.closePath();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(center[0], center[1], radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.closePath();
    resetCanvasStyle();

    // Accuracy calculation
    let totalLength = 0;
    for (let i = 1; i < vertices.length; i++)
        totalLength += Math.hypot(vertices[i][0] - vertices[i - 1][0], vertices[i][1] - vertices[i - 1][1]) / 2;

    let accuracy = 0;
    for (let i = 1; i < vertices.length; i++) {
        let length = Math.hypot(vertices[i][0] - vertices[i - 1][0], vertices[i][1] - vertices[i - 1][1]) / 2;
        let distToCenter = Math.hypot(vertices[i][0] / 2 - center[0], vertices[i][1] / 2 - center[1]);

        let accuracyThis = Math.max(1 - Math.abs(distToCenter / radius - 1) / 0.15, 0);
        accuracy += accuracyThis * length;
    }
    accuracy /= totalLength;
    
    accuracy *= Math.pow(Math.min(totalLength, 1.9 * Math.PI * radius) / (1.9 * Math.PI * radius), 2);

    return accuracy;
}

function evaluate() {
    let accCircle = leastSquaresCircle();

    let accuracy = accCircle;

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
        // + `<div id=\"score-percent-detail\">(Radius: ${(radiusAccuracy * 100).toFixed(1)}%`
        // + `, Start-End: ${(startEndAccuracy * 100).toFixed(1)}%)`
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
        drawVertex(touchX, touchY, 0.1 + 0.9 * touch.force);
    }
}