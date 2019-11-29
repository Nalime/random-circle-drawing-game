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
    ctx.lineWidth = pressure * 2;
    ctx.beginPath();
    ctx.moveTo(oldPos[0], oldPos[1]);
    ctx.lineTo(pos[0], pos[1]);
    ctx.stroke();
    ctx.closePath();
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

function evaluate() {
    let center = evaluateCenter()

    ctx.beginPath();
    ctx.moveTo(center[0], center[1]);
    ctx.lineTo(center[0] + 0.1, center[1] + 0.1);
    ctx.stroke();
    ctx.closePath();

    let radius = evaluateRadius(center);

    ctx.beginPath();
    ctx.moveTo(10, 10);
    ctx.lineTo(10 + radius, 10);
    ctx.stroke();
    ctx.closePath();
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
        drawToPoint(getMousePos(e, canvas), (1 + Math.sin(new Date().getTime() / 200)) * 2);
    }
}