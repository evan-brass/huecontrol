const decoder_lossy = new TextDecoder('UTF-8', { fatal: false });
const encoder = new TextEncoder();

let device = null;
const form = document.forms.device;
form.addEventListener('submit', e => { e.preventDefault() });

device_loop: for (; ;) {
	form.reset();
	// Enable pair button
	form.pair.removeAttribute('disabled');

	// Disable disconnect button and control fieldset
	form.disconnect.setAttribute('disabled', '');
	form.identify.setAttribute('disabled', '');
	form.control.setAttribute('disabled', '');

	// Disconnect any previous device
	if (device) {
		device.gatt.disconnect();
		device = null;
	}

	// Need user interaction to access bluetooth
	await new Promise(res => form.addEventListener('submit', res, { once: true }));
	form.pair.setAttribute('disabled', '');

	device = await navigator.bluetooth.requestDevice({
		optionalServices: [
			'932c32bd-0000-47a2-835a-a8d455b859dd',
			'b8843add-0000-4aa1-8794-c3f462030bda',
			'0000fe0f-0000-1000-8000-00805f9b34fb',
			'0000180a-0000-1000-8000-00805f9b34fb',
		],
		acceptAllDevices: true
	});
	if (!device) continue device_loop;

	await device.gatt.connect();

	// Pull Metadata from the bulb
	metadata: {
		const service = await device.gatt.getPrimaryService('0000180a-0000-1000-8000-00805f9b34fb');
		if (!service) break metadata;

		const chars = await Promise.all([
			'00002a24-0000-1000-8000-00805f9b34fb',
			'00002a28-0000-1000-8000-00805f9b34fb',
			'00002a29-0000-1000-8000-00805f9b34fb',
		].map(c => service.getCharacteristic(c)));
		await Promise.all(chars.map(c => c.readValue()));

		const [model, fw, manufacturer] = chars.map(c => decoder_lossy.decode(new Uint8Array(c.value.buffer, c.value.byteOffset, c.value.byteLength)));

		form.model.value = model;
		form.fw.value = fw;
		form.manufacturer.value = manufacturer;
	}

	// Bulb Control loop
	control: {
		const service = await device.gatt.getPrimaryService('932c32bd-0000-47a2-835a-a8d455b859dd');
		if (!service) break control;

		const action_port = await service.getCharacteristic('932c32bd-0006-47a2-835a-a8d455b859dd');
		const control_port = await service.getCharacteristic('932c32bd-0007-47a2-835a-a8d455b859dd');
		try {
			await control_port.readValue();
		} catch {
			alert("Failed to read from the bulb's control port.  You might need to do a factory reset.");
		}
		await control_port.startNotifications();

		// Enable disconnect button and control fieldset
		form.disconnect.removeAttribute('disabled');
		form.identify.removeAttribute('disabled');
		form.control.removeAttribute('disabled');

		for (; ;) {
			// Update the form controls with the current values from the control port:
			let seen_animation = false;
			for (let i = 0; (i + 2) < control_port.value?.byteLength;) {
				const cmd = control_port.value.getUint8(i++);
				const len = control_port.value.getUint8(i++);
				if (i + len > control_port.value.byteLength) {
					throw new Error("Length exceeds command list?");
				}
				switch (cmd) {
					case 0x01: // Power State
						form.power.checked = control_port.value.getUint8(i) == 0x01;
						break;
					case 0x02: // Brightness
						form.bright.value = control_port.value.getUint8(i);
						break;
					case 0x03: // Temperature
						if (control_port.value.getUint8(i + 1) == 0x01) {
							form.temp.value = control_port.value.getUint8(i);
						} else {
							form.temp.value = 0;
						}
						break;
					case 0x04: // Color
						const x = control_port.value.getUint16(i) / 0xffff;
						const y = control_port.value.getUint16(i + 2) / 0xffff;
						console.log('color', x, y);
						// TODO: Convert xy -> rgb and update the color
						break;
					case 0x05: // UNK
						break;
					case 0x06:
						form.animation.value = control_port.value.getUint8(i);
						seen_animation = true;
						break;
					case 0x08:
						form.speed.value = control_port.value.getUint8(i);
						break;
				}
				i += len;
			}
			if (!seen_animation) form.animation.value = 0;

			// Wait for something to happen:
			const e = await new Promise(res => {
				device.addEventListener('gattserverdisconnected', res, { once: true });
				form.addEventListener('submit', res, { once: true });
				control_port.addEventListener('characteristicvaluechanged', res, { once: true });
				form.addEventListener('change', res, { once: true });
			});
			console.log(e);

			// Disconnect button
			if (e.submitter?.name == 'disconnect') {
				break control;
			}

			// Identify button
			else if (e.submitter?.name == 'identify') {
				// Send the blink action
				await action_port.writeValueWithResponse(new Uint8Array([0x01]));
			}

			// Change notifications
			else if (e.type == 'characteristicvaluechanged') {
				continue;
			}

			// Control Input
			else if (e.type == 'change') {
				switch (e.target.name) {
					case 'power':
						await control_port.writeValueWithResponse(new Uint8Array([0x01, 0x01, form.power.checked ? 0x01 : 0x00]));
						break;
					case 'bright':
						await control_port.writeValueWithResponse(new Uint8Array([0x02, 0x01, form.bright.value]));
						break;
					case 'temp':
						await control_port.writeValueWithResponse(new Uint8Array([0x03, 0x02, form.temp.value, 0x01]));
						break;
					case 'color':
						let { 1: r, 2: g, 3: b } = /#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/im.exec(form.color.value);
						r = parseInt(r, 16) / 0xff; g = parseInt(g, 16) / 0xff; b = parseInt(b, 16) / 0xff;

						const X = r * 0.649926 + g * 0.103455 + b * 0.197109;
						const Y = r * 0.234327 + g * 0.743075 + b * 0.022598;
						const Z = r * 0.0000000 + g * 0.053077 + b * 1.035763;

						// const x = X / (X + Y + Z);
						// const y = Y / (X + Y + Z);
						const x = 0.5;
						const y = 0.5;

						const cmd = new DataView(new ArrayBuffer(6));
						cmd.setUint8(0, 0x04);
						cmd.setUint8(1, 0x04);
						cmd.setUint16(2, Math.trunc(0xffff * x));
						cmd.setUint16(4, Math.trunc(0xffff * y));

						await control_port.writeValueWithResponse(cmd);
						break;
					case 'animation':
						await control_port.writeValueWithResponse(new Uint8Array([
							0x06, 0x01, parseInt(form.animation.value),
						]));
						break;
					case 'speed':
						await control_port.writeValueWithResponse(new Uint8Array([
							0x08, 0x01, Math.trunc(form.speed.valueAsNumber)
						]));
						break;
				}
			}
		}
	}
}
