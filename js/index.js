function clearCanvas(ctx) {
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}


class Tipi {
	ctx;
	tarpaulinCtx;
	baseDiameter
	tipDiameter;
	height;

	constructor(ctx, tarpaulinCtx) {
		this.ctx = ctx;
		this.tarpaulinCtx = tarpaulinCtx || ctx;
		this.baseDiameter = 100;
		this.height = 100;
	}


	getDiameter() {
		return this.baseDiameter;
	}

	getHeight() {
		return this.height;
	}

	setBaseDiameter(diameter) {
		this.baseDiameter = diameter;
	}

	setTipDiameter(diameter) {
		this.tipDiameter = diameter;
	}

	setHeight(height) {
		this.height = height;
	}

	getSlopeLength() {
		const radius = (this.baseDiameter - this.tipDiameter) / 2;

		return Math.sqrt(radius * radius + this.height * this.height);
	}

	getConeSlant() {
		const baseRadius = this.baseDiameter / 2;
		const coneHeight = this.height * this.baseDiameter / (this.baseDiameter - this.tipDiameter);
		return Math.sqrt(baseRadius * baseRadius + coneHeight * coneHeight);
	}

	getConeAngle() {
		return Math.PI * this.baseDiameter / this.getConeSlant();
	}

	getLogLength() {
		const coneSlant = this.getConeSlant();
		const slopeLength = this.getSlopeLength();
		const offset = coneSlant - slopeLength;

		return coneSlant + offset;
	}

	getTarpaulinDimensions() {
		const coneSlant = this.getConeSlant();
		const angle = this.getConeAngle();
		let overflow;

		if (angle > 3 / 2 * Math.PI) {
			overflow = 1;
		} else if (angle > Math.PI) {
			overflow = Math.sin(-angle);
		} else {
			overflow = 0;
		}
	
		return [coneSlant + coneSlant * overflow, 2 * coneSlant];
	}

	getScaledDimensions() {
		let scale = 1;


		scale = this.ctx.canvas.height / this.height;

		if (this.baseDiameter * scale > this.ctx.canvas.width) {
			scale = this.ctx.canvas.width / this.baseDiameter;
		}

		return [this.baseDiameter * scale, this.tipDiameter * scale, this.height * scale];
	}

	draw() {
		const scaledDimensions = this.getScaledDimensions();

		const baseRadius = scaledDimensions[0] / 2;
		const tipRadius = scaledDimensions[1] / 2;
		const centerX = this.ctx.canvas.width / 2;
		const tipY = this.ctx.canvas.height / 2 + scaledDimensions[2] / 2;

		clearCanvas(this.ctx);
		this.ctx.beginPath();
		this.ctx.moveTo(centerX - baseRadius, tipY);
		this.ctx.lineTo(centerX - tipRadius, tipY - scaledDimensions[2]);
		this.ctx.moveTo(centerX + tipRadius, tipY - scaledDimensions[2]);
		this.ctx.lineTo(centerX + baseRadius, tipY);
		this.ctx.stroke();
	}

	drawTarpaulin() {
		const centerX = this.tarpaulinCtx.canvas.width / 2;
		const centerY = this.tarpaulinCtx.canvas.height / 2;

		const coneSlant = this.getConeSlant();
		const angle = this.getConeAngle();

		const maxSize = Math.min(this.tarpaulinCtx.canvas.width, this.tarpaulinCtx.canvas.height);
		const scale = maxSize / (coneSlant * 2);

		clearCanvas(this.tarpaulinCtx);

		this.tarpaulinCtx.beginPath();
		this.tarpaulinCtx.arc(centerX, centerY, coneSlant * scale, 0, angle);
		this.tarpaulinCtx.lineTo(centerX, centerY);
		this.tarpaulinCtx.lineTo(centerX + coneSlant * scale, centerY);
		this.tarpaulinCtx.stroke();
	}
}

let tipi;

function updateMaterials() {
	const logLength = tipi.getLogLength();
	const tarpaulinDimension = tipi.getTarpaulinDimensions();
	const logLengthElem = document.getElementById('log-length');
	const tarpaulinDimensionsElem = document.getElementById('tarpaulin-dimensions');

	logLengthElem.innerText = `${logLength.toFixed(2)} cm`;
	tarpaulinDimensionsElem.innerText = `${tarpaulinDimension[0].toFixed(2)}x${tarpaulinDimension[1].toFixed(2)} cm`;
}

function setParam(name, value) {
	switch (name) {
		case "base-diameter":
			tipi.setBaseDiameter(value);
			break;
		case "tip-diameter":
			tipi.setTipDiameter(value);
			break;
		case "height":
			tipi.setHeight(value);
			break;
		default:
			console.error("drawTipi: Unexpected target:", name, value);
			return;
	}
}

function onValueChanged(changedTarget) {
	setParam(changedTarget.name, changedTarget.value);

	updateMaterials();
	tipi.draw();
	tipi.drawTarpaulin();
}

window.addEventListener('load', (e) => {
	const form = document.getElementById('parameters');
	const formData = new FormData(form);

	const baseDiameterInput = document.getElementById('base-diameter');
	const tipDiameterInput = document.getElementById('tip-diameter');

	const tipiCanvas = document.getElementById('preview-tipi');
	const tarpaulinCanvas = document.getElementById('preview-tarpaulin')

	if (tipiCanvas === null || tarpaulinCanvas === null) {
		console.error("Could not find canvas!");
		return;
	}

	if (baseDiameterInput == null || tipDiameterInput == null) {
		console.error("Could not find diameter inputs!");
		return;
	}

	if (baseDiameterInput.value)
		tipDiameterInput.max = baseDiameterInput.value;

	form.addEventListener('change', (e) => {
		onValueChanged(e.target);
	});


	tipi = new Tipi(tipiCanvas.getContext('2d'), tarpaulinCanvas.getContext('2d'));

	for (let pair of formData.entries()) {
		switch (pair[0]) {
			case "base-diameter":
				tipi.setBaseDiameter(pair[1]);
				break;
			case "tip-diameter":
				tipi.setTipDiameter(pair[1]);
				break;
			case "height":
				tipi.setHeight(pair[1]);
				break;
			default:
				console.error("drawTipi: Unexpected target:", changedTarget.name, changedTarget.value);
				break;
		}
	}

	updateMaterials();
	tipi.draw();
	tipi.drawTarpaulin();
});

