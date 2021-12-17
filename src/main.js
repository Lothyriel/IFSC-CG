"use strict";
class Canvas {
    constructor(scene, camera, render, element) {
        this.scene = scene;
        this.camera = camera;
        this.render = render;
        this.entities = {};
        this.keys = {};
        this.up = new THREE.Vector3(1, 0, 0);
        this.started = false;
        this.element = element;
        this.curveMainPoints = [];
    }
    draw() {
        this.render.render(this.scene, this.camera);

        treatKeyInputs();

        Object.values(this.entities).forEach(element => {
            if (typeof element.draw === 'function')
                element.draw();
        });

        requestAnimationFrame(this.draw.bind(this));
    }
}

class Car {
    constructor(curve, step) {
        this.curve = curve;
        this.counter = 0;
        this.cube = this.createCube();
        this.step = step;
    }
    createCube() {
        let cubeMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        let cubeGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.2);

        let cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        canvas.scene.add(cube);
        return cube;
    }
    draw() {
        console.log(`t: ${this.counter} | x: ${this.cube.position.x} y: ${this.cube.position.y}`);

        let point = this.curve.getPointAt(this.counter);
        this.cube.position.set(point.x, point.y, 0);
        this.adjustAngle();
    }
    adjustAngle() {
        let tangent = this.curve.getTangentAt(this.counter).normalize();
        tangent = new THREE.Vector3(tangent.x, tangent.y, 0);

        let axis = new THREE.Vector3();
        axis.crossVectors(canvas.up, tangent).normalize();

        let radians = Math.acos(canvas.up.dot(tangent));

        this.cube.quaternion.setFromAxisAngle(axis, radians);
    }
    moveLeft() {
        if (this.counter - this.step < 0)
            return;

        this.move(-this.step);
    }
    moveRight() {
        if (this.counter + this.step > 1)
            return;
        this.move(this.step);
    }
    move(step) {
        this.counter += step;
    }
}

function createCurve(precision, mainPoints) {
    let lineMaterial = new THREE.LineBasicMaterial({ color: 0xFFFFFF });
    let curve = new THREE.SplineCurve(mainPoints);
    let points = curve.getPoints(precision);

    let lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    let line = new THREE.Line(lineGeometry, lineMaterial);
    canvas.scene.add(line);

    return curve;
}

function drawInitialPoints(points) {
    for (let p of points)
        canvas.scene.add(renderPoint(new THREE.Vector3(p.x, p.y, p.z)));
}

function renderPoint(vector3) {
    let pointMaterial = new THREE.PointsMaterial({ size: 10, sizeAttenuation: false });
    let pointGeometry = new THREE.BufferGeometry().setFromPoints([vector3]);
    return new THREE.Points(pointGeometry, pointMaterial);
}

function configCanvas() {
    let scene = new THREE.Scene();

    let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    let render = new THREE.WebGLRenderer();
    render.setSize(window.innerWidth, window.innerHeight);

    let canvasElement = render.domElement;
    document.body.appendChild(canvasElement);

    let _ = new THREE.OrbitControls(camera, render.domElement);

    return new Canvas(scene, camera, render, canvasElement);
}

function configInputs() {
    document.onkeydown = function (evt) {
        canvas.keys[evt.key] = true;
        console.log(evt.key);
    }
    document.onkeyup = function (evt) {
        canvas.keys[evt.key] = false;
    }
    document.onclick = function (evt) {
        treatMouseClick(evt);
    }
    window.addEventListener('resize', onWindowResize, false);
}

function treatKeyInputs() {
    let car = canvas.entities["car"];
    if (canvas.keys["ArrowLeft"])
        car.moveLeft();
    if (canvas.keys["ArrowRight"])
        car.moveRight();
    if (canvas.keys["Enter"])
        configEntities();
    if (canvas.keys["Escape"])
        reset();
}

function treatMouseClick(evt) {
    if (canvas.started)
        return;

    let x = (evt.clientX / window.innerWidth) * 2 - 1;
    let y = -(evt.clientY / window.innerHeight) * 2 + 1;

    let point = new THREE.Vector3(x, y, 0);

    canvas.curveMainPoints.push(point);
    canvas.scene.add(renderPoint(point));
}

function onWindowResize() {
    canvas.camera.aspect = window.innerWidth / window.innerHeight;
    canvas.camera.updateProjectionMatrix();
    canvas.render.setSize(window.innerWidth, window.innerHeight);
}

function configEntities() {
    if (canvas.curveMainPoints.length < minCurvePoints) {
        console.log(`Menos de ${minCurvePoints} pontos iniciais`);
        return;
    }
    if (canvas.started)
        return;
    let curve = createCurve(curvePrecision, canvas.curveMainPoints);
    canvas.entities["curve"] = curve;

    canvas.entities["car"] = new Car(curve, carStep);

    drawInitialPoints(curve.points);

    drawLights();

    canvas.started = true;
}

function drawLights() {
    let ambientLight = new THREE.AmbientLight(0x333333);
    canvas.scene.add(ambientLight);

    let lightPoint = new THREE.PointLight(0x888888);
    lightPoint.position.set(2, 2, 4);
    canvas.scene.add(lightPoint);
}

function reset() {
    let scene = canvas.scene;
    scene.remove.apply(scene, scene.children);

    configEntities();

    canvas.curveMainPoints = [];
    canvas.started = false;
}

function main() {
    configInputs();

    canvas.draw();
}

const minCurvePoints = 3;
const curvePrecision = 200;
const carStep = 0.01;
var canvas = configCanvas();