// Simple audio + count engine using Web Audio API and SpeechSynthesis

class AudioEngine {
  constructor() {
    this.audioEnabled = true;
    this.context = null;
    this.initContext();
  }

  initContext() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.context = new AudioContext();
    } catch (e) {
      console.warn("Web Audio API not supported, falling back to basic audio.");
      this.context = null;
    }
  }

  setAudioEnabled(enabled) {
    this.audioEnabled = enabled;
  }

  beep() {
    if (!this.audioEnabled || !this.context) return;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1000, this.context.currentTime);
    gain.gain.setValueAtTime(0.2, this.context.currentTime);

    osc.connect(gain);
    gain.connect(this.context.destination);

    osc.start();
    osc.stop(this.context.currentTime + 0.1);
  }

  speak(text) {
    if (!this.audioEnabled) return;
    if (!("speechSynthesis" in window)) return;

    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.1;
    utter.pitch = 1.0;
    window.speechSynthesis.speak(utter);
  }

  beepAndCount(count) {
    this.beep();
    this.speak(String(count));
  }

  announce(phrase) {
    this.speak(phrase);
  }
}

window.audioEngine = new AudioEngine();
