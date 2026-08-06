class AudioEngine {
  constructor() {
    this.audioEnabled = true;
    this.music = new Audio("soothing.mp3");
    this.music.volume = 0.4;
  }

  setAudioEnabled(enabled) {
    this.audioEnabled = enabled;
  }

  speak(text, voiceName = null) {
    if (!this.audioEnabled) return;
    if (!("speechSynthesis" in window)) return;

    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.0;
    utter.pitch = 1.0;

    if (voiceName) {
      const voices = speechSynthesis.getVoices();
      const v = voices.find(x => x.name.includes(voiceName));
      if (v) utter.voice = v;
    }

    speechSynthesis.speak(utter);
  }

  announceRepeat(current, total) {
    this.speak(`Repeat ${current} of ${total}`, "Google UK English Male");
  }

  holdCount(second) {
    if (second === 1) {
      this.speak("Hold", "Google US English");
    } else {
      this.speak(String(second), "Google US English");
    }
  }

  announceRest() {
    this.speak("Take rest for 30 seconds", "Google US English");
  }

  playSoothingMusic() {
    this.music.currentTime = 0;
    this.music.play();
    setTimeout(() => this.music.pause(), 30000);
  }
}

window.audioEngine = new AudioEngine();
