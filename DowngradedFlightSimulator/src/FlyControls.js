(function () {
	const _changeEvent = {
		type: 'change'
	};

	class FlyControls extends THREE.EventDispatcher {
		constructor(object) {
			super();

			//constants
			this.gravity = -0.75;
			this.airDensity = 1.225;	//i could make air density based on altitude (Y)
			this.frameArea = 1.5;

			this.dragCoefficient = 0.027;

			this.liftCoefficient = 0.008;

			this.maxThrust = 3.5;
			this.thrust = 0;
			this.rollSpeed = 0.75;
			this.accelerationConstant = this.maxThrust / 100;

			//variables
			this.speed = 0;
			this.yVelocity = 0;

			// internals
			this.object = object;
			const scope = this;
			const EPS = 0.000001;
			const lastQuaternion = new THREE.Quaternion();
			const lastPosition = new THREE.Vector3();
			this.tmpQuaternion = new THREE.Quaternion();
			this.moveState = {
				thrustUp: 0,
				thrustDown: 0,
				up: 0,	//sai fora???
				down: 0,
				left: 0,
				right: 0,
				back: 0,
				pitchUp: 0,
				pitchDown: 0,
				yawLeft: 0,
				yawRight: 0,
				rollLeft: 0,
				rollRight: 0,
				breaking: 0
			};
			this.moveVector = new THREE.Vector3(0, 0, 0);
			this.rotationVector = new THREE.Vector3(0, 0, 0);

			this.keydown = function (event) {
				switch (event.code) {
					case 'KeyC':
						this.moveState.thrustUp = 1;
						break;

					case 'KeyV':
						this.moveState.thrustDown = 1;
						break;

					case 'KeyS':
						this.moveState.pitchUp = 1;
						break;

					case 'KeyW':
						this.moveState.pitchDown = 1;
						break;

					case 'KeyQ':
						this.moveState.yawLeft = 1;
						break;

					case 'KeyE':
						this.moveState.yawRight = 1;
						break;

					case 'KeyA':
						this.moveState.rollLeft = 1;
						break;

					case 'KeyD':
						this.moveState.rollRight = 1;
						break;
					case 'Space':
						this.moveState.breaking = 1;
						break;
				}
			};

			this.keyup = function (event) {
				switch (event.code) {
					case 'KeyC':
						this.moveState.thrustUp = 0;
						break;

					case 'KeyV':
						this.moveState.thrustDown = 0;
						break;

					case 'KeyS':
						this.moveState.pitchUp = 0;
						break;

					case 'KeyW':
						this.moveState.pitchDown = 0;
						break;

					case 'KeyQ':
						this.moveState.yawLeft = 0;
						break;

					case 'KeyE':
						this.moveState.yawRight = 0;
						break;

					case 'KeyA':
						this.moveState.rollLeft = 0;
						break;

					case 'KeyD':
						this.moveState.rollRight = 0;
						break;
					case 'Space':
						this.moveState.breaking = 0;
						break;
				}
			};

			this.update = function (delta) {
				this.updateMovementVector();
				this.updateRotationVector();
				this.accelerate(delta);
				this.climb();
				this.detectCollision();
				this.roll();
				this.updateThrustMeter();

				const rotMult = delta * scope.rollSpeed;
				const moveMult = delta * scope.speed;

				scope.object.translateX(scope.moveVector.x * moveMult);
				scope.object.translateY(scope.moveVector.y * moveMult);
				scope.object.translateZ(scope.moveVector.z * moveMult);

				scope.tmpQuaternion.set(scope.rotationVector.x * rotMult, scope.rotationVector.y * rotMult / 7.5, scope.rotationVector.z * rotMult, 1).normalize();
				scope.object.quaternion.multiply(scope.tmpQuaternion);

				if (lastPosition.distanceToSquared(scope.object.position) > EPS || 8 * (1 - lastQuaternion.dot(scope.object.quaternion)) > EPS) {
					scope.dispatchEvent(_changeEvent);
					lastQuaternion.copy(scope.object.quaternion);
					lastPosition.copy(scope.object.position);
				}
			};

			this.updateMovementVector = function () {
				this.moveVector.x = - this.moveState.left + this.moveState.right;
				this.moveVector.y = - this.moveState.down + this.moveState.up;
				this.moveVector.z = - this.speed + this.moveState.back;
			};

			this.updateRotationVector = function () {
				this.rotationVector.x = - this.moveState.pitchDown + this.moveState.pitchUp;
				this.rotationVector.y = - this.moveState.yawRight + this.moveState.yawLeft;
				this.rotationVector.z = - this.moveState.rollRight + this.moveState.rollLeft;
			};

			this.drag = function (speed) {
				/*The drag equation states that drag is equal to the
				p: the density of the fluid times
				v squared: the speed of the object relative to the fluid times
				A: the cross sectional area times
				C: the drag coefficient – a dimensionless number.*/
				return (1 / 2) * this.airDensity * this.dragCoefficient * this.frameArea * Math.pow(speed, 2);
			}
			this.lift = function (speed) {
				/*The lift equation states that lift L is equal to the 
				lift coefficient Cl 
				times the density r 
				times half of the velocity V squared 
				times the wing area A.*/
				//get based on AOA
				return (1 / 2) * this.airDensity * this.liftCoefficient * this.frameArea * Math.pow(speed, 2);
			}
			const _keydown = this.keydown.bind(this);

			const _keyup = this.keyup.bind(this);

			window.addEventListener('keydown', _keydown);
			window.addEventListener('keyup', _keyup);
		}

		updateThrustMeter() {
			const thrust = `Thrust: ${(this.thrust / this.maxThrust) * 100}%`;
			const speed = `Speed: ${this.speed} kn`;
			const drag = `Drag: ${this.currentDrag}`;
			canvas.thrustMeter.innerHTML = `${thrust}<br>${speed}<br>${drag}`;
		}

		accelerate(delta) {
			this.thrust += this.accelerationConstant * (this.moveState.thrustUp - this.moveState.thrustDown);

			if (this.thrust > this.maxThrust)
				this.thrust = this.maxThrust;
			else if (this.thrust < 0)
				this.thrust = 0;

			const drag = this.drag(this.speed);
			this.currentDrag = drag;
			this.speed += (this.thrust - drag) * delta;
		}
		roll() {
			if (this.yVelocity <= 0)
				return;

			const angle = this.object.quaternion.z * this.object.quaternion.w;
			this.tmpQuaternion.set(0, angle * 0.005, 0, 1);
			this.object.quaternion.multiply(this.tmpQuaternion);
		}
		climb() {
			this.yVelocity = this.lift(this.speed) + this.gravity;
			this.object.position.y += this.yVelocity;
		}
		detectCollision() {
			if (this.object.position.y < 0.125) {
				this.object.position.y = 0.125;
				if (this.speed > 0.003)
					this.speed -= 0.01 * this.moveState.breaking;
			}
		}
	}

	THREE.FlyControls = FlyControls;
})();