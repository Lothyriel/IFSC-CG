"use strict";
class Canvas {
    constructor(scene, camera, render) {
        this.scene = scene;
        this.camera = camera;
        this.render = render;
    }
    draw() {
        this.render.render(this.scene, this.camera);
        requestAnimationFrame(this.draw.bind(this));
    }
}

function createCurve() {
    let lineMaterial = new THREE.LineBasicMaterial({ color: 0xFFFFFF });
    let points = [
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(-0.5, 0.5, 0),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.5, -0.5, 0),
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(1.5, 0.5, 0),
        new THREE.Vector3(2, 0, 0)
    ];
    let curve = new THREE.SplineCurve(points);
    let curvePoints = curve.getPoints(50);

    let lineGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    let line = new THREE.Line(lineGeometry, lineMaterial);
    canvas.scene.add(line);

    return curve
}

function drawPoints(points) {
    let pointMaterial = new THREE.PointsMaterial({ size: 10, sizeAttenuation: false });

    for (let p of points) {
        let coord = [];
        coord.push(new THREE.Vector3(p.x, p.y, p.z));
        let pointGeometry = new THREE.BufferGeometry().setFromPoints(coord);
        let renderedPoint = new THREE.Points(pointGeometry, pointMaterial);
        canvas.scene.add(renderedPoint);
    }
}

function configurarCanvas() {
    let scene = new THREE.Scene();

    let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    let render = new THREE.WebGLRenderer();
    render.setSize(window.innerWidth, window.innerHeight);

    let canvasElement = render.domElement;
    document.body.appendChild(canvasElement);

    let ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);

    let lightPoint = new THREE.PointLight(0x888888);
    lightPoint.position.set(2, 2, 4);
    scene.add(lightPoint);

    let _ = THREE.OrbitControls(camera, render.domElement);

    return new Canvas(scene, camera, render)
}

function main() {
    let curve = createCurve();

    drawPoints(curve.points);

    canvas.draw();
}

let canvas = configurarCanvas();
main();