const canvas = document.querySelector("#draw");
const ctx = canvas.getContext("2d");
let vertices = Array();
let isDrawing = false;

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    length() {
        return Math.hypot(x, y);
    }

    static distance(v, w) {
        return Math.hypot(v.x - w.x, v.y - w.y);
    }
}

ctx.strokeStyle = "#FFF";
ctx.lineCap = 'round';

document.addEventListener("pointerdown", onMouseDown, false);
document.addEventListener("mouseup", onMouseUp, false);
document.addEventListener("touchend", onMouseUp, false);
document.addEventListener("mousemove", onMouseMove, false);
document.addEventListener("touchmove", onTouchMove, false);

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

// ellipse
// short-axis = shortest to center
// long-axis = farthest to center
// (ellipse acc 60% circle acc 20% start-end 20%) * time (<1s: 100%, 1-2s: 100%-80%, >2s: 80% * 2 ^ (4-2*s))
// PERFECT! 80%-100% GREAT! 60%-80% GOOD 0%-60%
// TODO: start-end ARC length

// B plan
// acc:
// 50% shake acc
// 30% radius acc
// 20% start-end acc

function evaluate() {
    let accumulatedLength = 0;

    let weightedPos = new Point(0, 0);
    for (let i = 1; i < vertices.length; i++) {
        let length = Point.distance(vertices[i], vertices[i - 1]);
        accumulatedLength += length;
        weightedPos.x += vertices[i].x * length;
        weightedPos.y += vertices[i].y * length;
    }
    let totalLength = accumulatedLength;
    weightedPos.x /= totalLength;
    weightedPos.y /= totalLength;
    let center = weightedPos;

    // accumulatedLength = 0;
    let weightedDiff = 0;
    // let shortRadius = -1;
    // let shortRadiusAtLength = -1;
    // let longRadius = -1;
    // let longRadiusAtLength = -1;
    for (let i = 1; i < vertices.length; i++) {
        let length = Point.distance(vertices[i], vertices[i - 1]);
        // accumulatedLength += length;
        let diff = Point.distance(vertices[i], center);
        // if (shortRadius === -1 || diff < shortRadius) {
        //     shortRadius = diff;
        //     shortRadiusAtLength = accumulatedLength;
        // }
        // else if (diff > longRadius) {
        //     longRadius = diff;
        //     longRadiusAtLength = accumulatedLength;
        // }
        weightedDiff += diff * length;
    }
    weightedDiff /= totalLength;
    let radius = weightedDiff;
    // if (shortRadiusAtLength >= totalLength * 0.5)
    //     shortRadiusAtLength -= totalLength * 0.5;
    // if (longRadiusAtLength >= totalLength * 0.5)
    //     longRadiusAtLength -= totalLength * 0.5;

    // accumulatedLength = 0;
    for (let i = 1; i < vertices.length; i++) {
        let length = Point.distance(vertices[i], vertices[i - 1]);
        accumulatedLength += length;
        let expectedRadius = (accumulatedLength % (totalLength / 2)) / totalLength
        let diff = Point.distance(vertices[i], center);
        let accuracy = Math.max(1 - Math.abs(diff / radius - 1) / 0.2, 0);
        weightedAccuracy += accuracy * length;
    }
    weightedAccuracy /= totalLength;
    let startEndDiff = Math.hypot(vertices[vertices.length - 1][0] - center[0], vertices[vertices.length - 1][1] - center[1])
        - Math.hypot(vertices[0][0] - center[0], vertices[0][1] - center[1]);
    let startEndAccuracy = Math.max(1 - Math.pow(Math.abs(startEndDiff / radius) / 0.1, 2), 0);

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
    ctx.strokeStyle = "#FFF";
}

function onMouseDown(e) {
    if (isDrawing)
        return;
    isDrawing = true;
    vertices = Array();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function onMouseUp(e) {
    if (!isDrawing)
        return;
    isDrawing = false;
    if (vertices.length > 0)
        evaluate();
}

function onMouseMove(e) {
    if (isDrawing) {
        mouseX = e.clientX - canvas.offsetLeft;
        mouseY = e.clientY - canvas.offsetTop;
        drawVertex(mouseX, mouseY, 0.5);
    }
}

function onTouchMove(e) {
    if (isDrawing && e.touches && e.touches.length == 1) {
        let touch = e.touches[0]; // Get the information for finger #1
        touchX = touch.pageX - canvas.offsetLeft;
        touchY = touch.pageY - canvas.offsetTop;
        drawVertex(touchX, touchY, touch.force);
    }
}