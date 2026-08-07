# Technical Specifications — Physio Timing Coach

## 1. Overview
Physio Timing Coach is a browser‑based physiotherapy timing engine built using pure HTML, CSS, and JavaScript.  
It provides real‑time audio and visual guidance for physiotherapy exercises with adaptive timing and multilingual support.

---

## 2. System Architecture

### 2.1 Modules
| Module | Purpose |
|--------|---------|
| `audio.js` | Speech synthesis, multilingual voices, encouragement, rest music |
| `timerEngine.js` | Core timing state machine (MOVE → HOLD → GAP → NEXT) |
| `adaptiveEngine.js` | Adaptive gap logic based on user performance |
| `app.js` | UI wiring, event handling, configuration |
| `index.html` | Main UI layout |
| `styles.css` | Visual styling |

---

## 3. Timing State Machine

### States
1. **IDLE**  
2. **PREP** (1‑second warm‑up)
3. **MOVE** (movement duration, silent)
4. **HOLD**  
   - Second 1 → “Hold”  
   - Second 2+ → spoken count  
   - Occasional encouragement  
5. **GAP**  
   - Silent  
   - Adaptive gap duration  
6. **COMPLETE**


---

## 4. Adaptive Gap Engine

### Inputs
- `userAdvancedEarly` (boolean)
- Base gap duration

### Logic
f early:
gap -= deltaEarly
else:
gap += deltaLate

gap = clamp(MIN_GAP, MAX_GAP)


### Default Values
- `deltaEarly = -0.5 sec`
- `deltaLate = +0.5 sec`
- `MIN_GAP = 1 sec`
- `MAX_GAP = 10 sec`

---

## 5. Audio System

### 5.1 Speech Synthesis
Uses browser `speechSynthesis` API.

### 5.2 Voice Pools

English:  Google US English, Google UK English Male, Microsoft David
Hindi:    Google हिन्दी, Microsoft Heera
Gujarati: Google ગુજરાતી


### 5.3 Encouragement Phrases


---

## 6. UI Components

### 6.1 Configuration Panel
- Exercise name  
- Repeats  
- Sets  
- Movement duration  
- Hold duration  
- Gap duration  
- Adaptive gap toggle  
- Audio toggle  
- Language selector  

### 6.2 Status Panel
- Current exercise  
- Set counter  
- Repeat counter  
- Phase  
- Seconds in phase  
- Adaptive gap value  
- Progress bars  

### 6.3 Controls
- Start  
- Reset  
- Next  
- Pause  
- Resume  

---

## 7. Browser Compatibility
- Chrome (recommended)
- Edge
- Firefox
- Safari (speech synthesis varies)

---

## 8. Performance Considerations
- Uses `setInterval(1000ms)` for timing  
- Speech synthesis is asynchronous  
- Background music uses HTML5 Audio  
- No external libraries → lightweight and fast  

---

## 9. Future Enhancements
- Physiotherapy exercise presets  
- Mobile‑optimized layout  
- Session history + analytics  
- Cloud sync  
- Custom voice packs  
- AI‑based movement detection (camera optional)

---

## 10. File List







### Transitions

