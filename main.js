const canvas = document.querySelector("#draw");
const ctx = canvas.getContext("2d");
let vertices = Array();
let isDrawing = false;

document.addEventListener("mousedown", onMouseDown, false);
document.addEventListener("mouseup", onMouseUp, false);
document.addEventListener("mousemove", onMouseMove, false);

ctx.strokeStyle = "#FFF";
ctx.lineCap = 'round';

function getLastVertex() {
    if (vertices.length === 0)
        return null;
    return [vertices[vertices.length - 1][0], vertices[vertices.length - 1][1]];
}

function drawToPoint(pos, pressure) {
    oldPos = getLastVertex();
    vertices.push([pos[0], pos[1]]);
    if (oldPos === null)
        return;
    ctx.lineWidth = pressure * 10;
    ctx.beginPath();
    ctx.moveTo(oldPos[0], oldPos[1]);
    ctx.lineTo(pos[0], pos[1]);
    ctx.stroke();
    ctx.closePath();
    ctx.lineWidth = 5;
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
    let lastVertex = getLastVertex();
    let startEndDiff = Math.hypot(lastVertex[0] - center[0], lastVertex[1] - center[1])
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

    ctx.beginPath();
    ctx.moveTo(center[0], center[1]);
    ctx.lineTo(center[0] + 0.1, center[1] + 0.1);
    ctx.stroke();
    ctx.closePath();

    let radius = evaluateRadius(center);

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.arc(center[0], center[1], radius, 0, Math.PI * 2);
    ctx.strokeStyle = "#F008";
    ctx.stroke();
    ctx.closePath();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#FFF";

    let accuracy = evaluateAccuracy(center, radius)
    console.log(accuracy * 100 + "%");
}

function getMousePos(mouse, element) {
    return [mouse.clientX - canvas.offsetLeft, mouse.clientY - canvas.offsetTop];
}

function onMouseDown(e) {
    isDrawing = true;
    vertices = Array();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function onMouseUp(e) {
    isDrawing = false;
    evaluate();
}

function onMouseMove(e) {
    if (isDrawing) {
        drawToPoint(getMousePos(e, canvas), typeof e.pressure == "number" ? e.pressure : 0.5);
    }
}