function Metronome() {
	var context = new AudioContext();
	var osc = context.createOscillator();
	var gain = context.createGain();
	osc.frequency.value = 1000.0;
	osc.start(0);
	osc.connect(gain);
	this.volume = 0.5;
	
	this.tick = function() {
		gain.gain.value = this.volume;
		gain.connect(context.destination);
	}

	this.tock = function() {
		gain.disconnect();
	}
}