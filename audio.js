class AudioEngine {
  constructor() {
    this.audioEnabled = true;

    // Rest music playlist
    this.restTracks = ["rest1.mp3", "rest2.mp3", "rest3.mp3"];
    this.music = null;

    // Voice preference tags (browser-dependent)
    this.voiceTags = {
      english: ["Google US English", "Google UK English Male", "Microsoft David"],
      hindi: ["Google हिन्दी", "Microsoft Heera"],
      gujarati: ["Google ગુજરાતી"]
    };

    // Encouragement phrases
    this.encouragement = {
      en: ["Good", "Steady", "Nice", "Gentle"],
      hi: ["अच्छा", "ठीक है", "बहुत बढ़िया"],
      gu: ["સારું", "જોરથી નહીં", "મજામાં"]
    };

    // Language mode: "en", "hi", "gu"
    this.languageMode = "en";
  }

  setAudioEnabled(enabled) {
    this.audioEnabled = enabled;
  }

  setLanguageMode(mode) {
    this.languageMode = mode; // "en" | "hi" | "gu"
  }

  pickVoice(tagList) {
    if (!("speechSynthesis" in window)) return null;
    const voices = speechSynthesis.getVoices();
    for (const tag of tagList) {
      const v = voices.find(x => x.name && x.name.includes(tag));
      if (v) return v;
    }
    return null;
  }

  speak(text, langGroup = "english") {
    if (!this.audioEnabled) return;
    if (!("speechSynthesis" in window)) return;

    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.0;
    utter.pitch = 1.0;

    let tags;
    if (langGroup === "english") tags = this.voiceTags.english;
    else if (langGroup === "hindi") tags = this.voiceTags.hindi;
    else if (langGroup === "gujarati") tags = this.voiceTags.gujarati;
    else tags = this.voiceTags.english;

    const v = this.pickVoice(tags);
    if (v) utter.voice = v;

    // Slight pitch variation to avoid monotony
    utter.pitch = 0.9 + Math.random() * 0.2;

    speechSynthesis.speak(utter);
  }

  // Repeat announcement with variation + language
  announceRepeat(current, total) {
    let text;
    if (this.languageMode === "hi") {
      const variants = [
        `दोहराव ${current} में से ${total}`,
        `अगला दोहराव ${current} में से ${total}`,
        `अब दोहराव नंबर ${current}`
      ];
      text = variants[Math.floor(Math.random() * variants.length)];
      this.speak(text, "hindi");
    } else if (this.languageMode === "gu") {
      const variants = [
        `રીપીટ ${current} માંથી ${total}`,
        `આગળનું રીપીટ ${current} માંથી ${total}`,
        `હવે રીપીટ નંબર ${current}`
      ];
      text = variants[Math.floor(Math.random() * variants.length)];
      this.speak(text, "gujarati");
    } else {
      const variants = [
        `Repeat ${current} of ${total}`,
        `Next repeat: ${current} of ${total}`,
        `Repeat number ${current}`,
        `Let’s go — ${current} of ${total}`
      ];
      text = variants[Math.floor(Math.random() * variants.length)];
      this.speak(text, "english");
    }
  }

  // Hold: "Hold" then 2, 3, 4… with occasional encouragement for long holds
  holdCount(second, holdDurationSec = 0) {
    if (second === 1) {
      if (this.languageMode === "hi") {
        this.speak("होल्ड", "hindi");
      } else if (this.languageMode === "gu") {
        this.speak("હોલ્ડ", "gujarati");
      } else {
        this.speak("Hold", "english");
      }
    } else {
      const useEncouragement = holdDurationSec > 12 && second % 4 === 0;
      if (useEncouragement) {
        let word;
        if (this.languageMode === "hi") {
          word = this.encouragement.hi[Math.floor(Math.random() * this.encouragement.hi.length)];
          this.speak(`${word}… ${second}`, "hindi");
        } else if (this.languageMode === "gu") {
          word = this.encouragement.gu[Math.floor(Math.random() * this.encouragement.gu.length)];
          this.speak(`${word}… ${second}`, "gujarati");
        } else {
          word = this.encouragement.en[Math.floor(Math.random() * this.encouragement.en.length)];
          this.speak(`${word}… ${second}`, "english");
        }
      } else {
        if (this.languageMode === "hi") {
          this.speak(String(second), "hindi");
        } else if (this.languageMode === "gu") {
          this.speak(String(second), "gujarati");
        } else {
          this.speak(String(second), "english");
        }
      }
    }
  }

  // Rest announcement + music
  announceRest() {
    if (this.languageMode === "hi") {
      this.speak("तीस सेकंड आराम करें", "hindi");
    } else if (this.languageMode === "gu") {
      this.speak("ત્રીસ સેકન્ડ આરામ કરો", "gujarati");
    } else {
      this.speak("Take rest for 30 seconds", "english");
    }
  }

  playSoothingMusic() {
    if (!this.audioEnabled) return;
    const track =
      this.restTracks[Math.floor(Math.random() * this.restTracks.length)];
    this.music = new Audio(track);
    this.music.volume = 0.3;
    this.music.play();
    setTimeout(() => {
      if (this.music) this.music.pause();
    }, 30000);
  }
}

window.audioEngine = new AudioEngine();
