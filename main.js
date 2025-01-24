const decoder_lossy = new TextDecoder('UTF-8', { fatal: false });

let device;
const form = document.forms.device;
form.addEventListener('submit', e => { e.preventDefault() });

for (; ;) {
	// Need user interaction to access bluetooth
	form.pair.removeAttribute('disabled');
	await new Promise(res => form.addEventListener('submit', res, { once: true }));
	form.pair.setAttribute('disabled', '');
	form.reset();

	device = await navigator.bluetooth.requestDevice({
		optionalServices: [
			'932c32bd-0000-47a2-835a-a8d455b859dd',
			'b8843add-0000-4aa1-8794-c3f462030bda',
			'0000fe0f-0000-1000-8000-00805f9b34fb',
			'0000180a-0000-1000-8000-00805f9b34fb',
		],
		acceptAllDevices: true
	});
	if (!device) continue;

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
}
