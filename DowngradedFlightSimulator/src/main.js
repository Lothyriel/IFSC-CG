"use strict";
class Canvas {
    constructor(scene, camera, render) {
        this.scene = scene;
        this.camera = camera;
        this.render = render;
        this.draw = this.draw.bind(this);
    }
    draw() {
        this.render.render(this.scene, this.camera);
        this.flyControls.update(0.01);
        requestAnimationFrame(this.draw);
    }
}

function configCanvas() {
    let scene = new THREE.Scene();

    let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

    camera.position.set(0, 1, 5);

    let render = new THREE.WebGLRenderer({ antialias: true });
    render.setSize(window.innerWidth, window.innerHeight);
    render.setClearColor(0x3e7999, 1);

    let canvasElement = render.domElement;
    document.body.appendChild(canvasElement);

    return new Canvas(scene, camera, render);
}

function onWindowResize() {
    canvas.camera.aspect = window.innerWidth / window.innerHeight;
    canvas.camera.updateProjectionMatrix();
    canvas.render.setSize(window.innerWidth, window.innerHeight);
}

function main() {
    drawThrustMeter();
    drawLights();
    drawGround();
    drawBuildingsToLookAt();
    drawAirCraft();

    window.addEventListener('resize', onWindowResize, false);

    canvas.draw();
}
function drawThrustMeter() {
    const info = document.createElement('div');
    info.style.position = 'absolute';
    info.style.top = '30px';
    info.style.width = '100%';
    info.style.textAlign = 'center';
    info.style.color = '#fff';
    info.style.fontWeight = 'bold';
    info.style.backgroundColor = 'transparent';
    info.style.zIndex = '1';
    info.style.fontFamily = 'Monospace';
    document.body.appendChild(info);

    canvas.thrustMeter = info;
}

function drawAirCraft() {
    var model = drawAirCraftModel()
    canvas.scene.add(model);

    canvas.model = model;
    model.add(canvas.camera);

    //let controls = new THREE.OrbitControls(canvas.camera, canvas.render.domElement);
    //controls.position.set(0, 0, 5);
    //controls.enablePan = false;
    //canvas.controls = controls;

    canvas.flyControls = new THREE.FlyControls(model);
}

function drawAirCraftModel() {
    var texture = new THREE.TextureLoader().load("https://i.imgur.com/KbCU6K1.png");
    var frameGeometry = new THREE.BoxBufferGeometry(1, 0.25, 3);
    var material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    var frame = new THREE.Mesh(frameGeometry, material);

    var wingsGeometry = new THREE.BoxBufferGeometry(5, 0.05, 1);
    var wings = new THREE.Mesh(wingsGeometry, material);

    frame.add(wings);
    frame.position.set(0, 0.25, 2);
    return frame;
}

function drawBuildingsToLookAt() {
    var texture = new THREE.TextureLoader().load("https://i.imgur.com/7rEnKnv.png");
    var geometry = new THREE.BoxBufferGeometry(4, 10, 4);
    var material = new THREE.MeshBasicMaterial({ map: texture, transparent: true});

    const delimitation = 300;
    const initialLimits = 30;
    for (let i = -delimitation; i < delimitation; i += 10) {
        for (let x = -delimitation; x < delimitation; x += 10) {
            if (x > -initialLimits && x < initialLimits || i > -initialLimits && i < initialLimits)
                continue;
            var cube = new THREE.Mesh(geometry, material);
            cube.position.set(i + Math.random() * i * Math.random()+2, 5, x + Math.random() * x * 5);
            canvas.scene.add(cube);
        }
    }
}

function drawGround() {
    var texture = new THREE.TextureLoader().load("https://i.imgur.com/NirT2E0h.jpg");
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.x = 800;
    texture.repeat.y = 800;
    var geo = new THREE.PlaneBufferGeometry(10000, 10000, 8, 8);
    var mat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    var plane = new THREE.Mesh(geo, mat);
    plane.rotateX(- Math.PI / 2);

    canvas.ground = plane;

    canvas.scene.add(plane);
}

function drawLights() {
    let ambientLight = new THREE.AmbientLight(0x333333);
    canvas.scene.add(ambientLight);

    let lightPoint = new THREE.PointLight(0x888888);
    lightPoint.position.set(2, 2, 4);
    canvas.scene.add(lightPoint);
}

var canvas = configCanvas();