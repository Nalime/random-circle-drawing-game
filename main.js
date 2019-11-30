const canvas = document.querySelector("#draw");
const ctx = canvas.getContext("2d");
let vertices = Array();
let isDrawing = false;

ctx.strokeStyle = "#FFF";
ctx.lineCap = 'round';

document.addEventListener("pointerdown", onMouseDown, false);
document.addEventListener("mouseup", onMouseUp, false);
document.addEventListener("touchend", onMouseUp, false);
document.addEventListener("mousemove", onMouseMove, false);
document.addEventListener("touchmove", onTouchMove, false);

function drawVertex(pos, pressure) {
    ctx.lineWidth = pressure * 10;
    ctx.beginPath();
    if (vertices.length > 0)
        ctx.moveTo(vertices[vertices.length - 1][0], vertices[vertices.length - 1][1]);
    ctx.lineTo(pos[0], pos[1]);
    ctx.stroke();
    ctx.closePath();
    vertices.push([pos[0], pos[1]]);
}

function evaluateCenter() {
    let totalLength = 0;
    let weightedPos = [0, 0];
    for (let i = 1; i < vertices.length; i++) {
        let length = Math.hypot(vertices[i][0] - vertices[i - 1][0], vertices[i][1] - vertices[i - 1][1]);
        totalLength += length;
        weightedPos[0] += vertices[i][0] * length;
        weightedPos[1] += vertices[i][1] * length;
    }
    weightedPos[0] /= totalLength;
    weightedPos[1] /= totalLength;
    return weightedPos;
}

function evaluateRadius(center) {
    let totalLength = 0;
    let weightedDiff = 0;
    for (let i = 1; i < vertices.length; i++) {
        let length = Math.hypot(vertices[i][0] - vertices[i - 1][0], vertices[i][1] - vertices[i - 1][1]);
        totalLength += length;
        let diff = Math.hypot(vertices[i][0] - center[0], vertices[i][1] - center[1]);
        weightedDiff += diff * length;
    }
    weightedDiff /= totalLength;
    return weightedDiff;
}

function evaluateAccuracy(center, radius) {
    let totalLength = 0;
    let weightedAccuracy = 0;
    for (let i = 1; i < vertices.length; i++) {
        let length = Math.hypot(vertices[i][0] - vertices[i - 1][0], vertices[i][1] - vertices[i - 1][1]);
        totalLength += length;
        let diff = Math.hypot(vertices[i][0] - center[0], vertices[i][1] - center[1]);
        let accuracy = Math.max(1 - Math.abs(diff / radius - 1) / 0.2, 0);
        weightedAccuracy += accuracy * length;
    }
    weightedAccuracy /= totalLength;
    let startEndDiff = Math.hypot(vertices[vertices.length - 1][0] - center[0], vertices[vertices.length - 1][1] - center[1])
        - Math.hypot(vertices[0][0] - center[0], vertices[0][1] - center[1]);
    let startEndAccuracy = Math.max(1 - Math.pow(Math.abs(startEndDiff / radius) / 0.1, 2), 0);
    return weightedAccuracy * 0.8 + startEndAccuracy * 0.2;
}

// ellipse
// short-axis = shortest to center
// long-axis = farthest to center
// (ellipse acc 60% circle acc 20% start-end 20%) * time (<1s: 100%, 1-2s: 100%-80%, >2s: 80% * 2 ^ (4-2*s))
// PERFECT! 80%-100% GREAT! 60%-80% GOOD 0%-60%
// TODO: start-end ARC length

function evaluate() {
    let center = evaluateCenter()

    ctx.lineWidth = 5;
    ctx.strokeStyle = "#F008";
    ctx.beginPath();
    ctx.lineTo(center[0], center[1]);
    ctx.stroke();
    ctx.closePath();

    let radius = evaluateRadius(center);

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.arc(center[0], center[1], radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.closePath();
    ctx.strokeStyle = "#FFF";

    let accuracy = evaluateAccuracy(center, radius)
    console.log(accuracy * 100 + "%");
}

function onMouseDown(e) {
    console.log("down");
    if (isDrawing)
        return;
    isDrawing = true;
    vertices = Array();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function onMouseUp(e) {
    console.log("up");
    if (!isDrawing)
        return;
    isDrawing = false;
    if (vertices.length > 0)
        evaluate();
}

function onMouseMove(e) {
    console.log("move");
    if (isDrawing) {
        mouseX = e.clientX - canvas.offsetLeft;
        mouseY = e.clientY - canvas.offsetTop;
        drawVertex([mouseX, mouseY], 0.5);
    }
}

function onTouchMove(e) {
    console.log("move");
    if (isDrawing && e.touches && e.touches.length == 1) {
        let touch = e.touches[0]; // Get the information for finger #1
        touchX = touch.pageX - canvas.offsetLeft;
        touchY = touch.pageY - canvas.offsetTop;
        drawVertex([touchX, touchY], touch.force);
    }
}