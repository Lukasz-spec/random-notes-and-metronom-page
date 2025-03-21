// Tablica nut z półtonami
const notes = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];

let metronomeInterval = null;
let audioContext = null;
let usedNotes = new Set();
let currentNote = null;
let isComplete = false;
let beatCount = 0; // Licznik uderzeń

// Elementy DOM
const generateNoteButton = document.getElementById('generateNote');
const noteDisplay = document.getElementById('noteDisplay');
const completionMessage = document.getElementById('completionMessage');
const playMetronomeButton = document.getElementById('playMetronome');
const stopMetronomeButton = document.getElementById('stopMetronome');
const bpmInput = document.getElementById('bpm');

// Funkcja do generowania losowej nuty
function generateRandomNote() {
    if (isComplete) {
        // Reset stanu po zakończeniu cyklu
        usedNotes.clear();
        isComplete = false;
        completionMessage.classList.remove('visible');
        completionMessage.textContent = '';
        noteDisplay.textContent = '';
        return;
    }

    const availableNotes = notes.filter(note => !usedNotes.has(note));
    const randomIndex = Math.floor(Math.random() * availableNotes.length);
    currentNote = availableNotes[randomIndex];
    usedNotes.add(currentNote);
    
    // Wyświetlanie nuty
    noteDisplay.textContent = currentNote;
    
    // Jeśli wszystkie nuty zostały użyte
    if (usedNotes.size === notes.length) {
        isComplete = true;
        completionMessage.textContent = "All 12 notes have been randomly selected!";
        completionMessage.classList.add('visible');
    }
}

// Event listener dla przycisku generowania nuty
generateNoteButton.addEventListener('click', generateRandomNote);

// Funkcja do tworzenia dźwięku metronomu
function createMetronomeSound(isAccent = false) {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Główny oscylator dla "kliknięcia"
    const clickOsc = audioContext.createOscillator();
    const clickGain = audioContext.createGain();
    
    // Oscylator dla rezonansu
    const resonanceOsc = audioContext.createOscillator();
    const resonanceGain = audioContext.createGain();
    
    // Połączenia
    clickOsc.connect(clickGain);
    resonanceOsc.connect(resonanceGain);
    clickGain.connect(audioContext.destination);
    resonanceGain.connect(audioContext.destination);
    
    // Ustawienia dla kliknięcia
    clickOsc.type = 'sine';
    clickOsc.frequency.setValueAtTime(isAccent ? 2200 : 2000, audioContext.currentTime); // Wyższa częstotliwość dla akcentu
    
    // Ustawienia dla rezonansu
    resonanceOsc.type = 'sine';
    resonanceOsc.frequency.setValueAtTime(isAccent ? 480 : 440, audioContext.currentTime); // Niższy dźwięk dla rezonansu
    
    // Obwiednia dźwięku dla kliknięcia
    const now = audioContext.currentTime;
    clickGain.gain.setValueAtTime(0, now);
    // Zwiększona głośność dla akcentowanego uderzenia
    const clickVolume = isAccent ? 0.5 : 0.3;
    clickGain.gain.linearRampToValueAtTime(clickVolume, now + 0.001); // Szybki atak
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03); // Krótki decay
    
    // Obwiednia dźwięku dla rezonansu
    resonanceGain.gain.setValueAtTime(0, now);
    // Zwiększona głośność rezonansu dla akcentowanego uderzenia
    const resonanceVolume = isAccent ? 0.2 : 0.1;
    resonanceGain.gain.linearRampToValueAtTime(resonanceVolume, now + 0.005); // Wolniejszy atak
    resonanceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1); // Dłuższy decay
    
    return { 
        start: () => {
            clickOsc.start(now);
            resonanceOsc.start(now);
            clickOsc.stop(now + 0.03);
            resonanceOsc.stop(now + 0.1);
        }
    };
}

// Funkcja do uruchamiania metronomu
function startMetronome() {
    if (metronomeInterval) {
        clearInterval(metronomeInterval);
    }
    
    beatCount = 0; // Reset licznika przy starcie
    const bpm = parseInt(bpmInput.value);
    const interval = (60 / bpm) * 1000; // Konwersja BPM na milisekundy
    
    metronomeInterval = setInterval(() => {
        const isFirstBeat = beatCount % 4 === 0; // Akcent na pierwszym uderzeniu w takcie
        const sound = createMetronomeSound(isFirstBeat);
        sound.start();
        beatCount++;
    }, interval);
}

// Funkcja do zatrzymywania metronomu
function stopMetronome() {
    if (metronomeInterval) {
        clearInterval(metronomeInterval);
        metronomeInterval = null;
        beatCount = 0; // Reset licznika przy zatrzymaniu
    }
}

// Event listeners dla przycisków metronomu
playMetronomeButton.addEventListener('click', () => {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
    // Sprawdź i skoryguj wartość BPM przed uruchomieniem
    let value = parseInt(bpmInput.value);
    if (value < 40) {
        value = 40;
        bpmInput.value = 40;
    }
    if (value > 208) {
        value = 208;
        bpmInput.value = 208;
    }
    startMetronome();
});

stopMetronomeButton.addEventListener('click', () => {
    stopMetronome();
});

// Walidacja wartości BPM i aktualizacja w czasie rzeczywistym
bpmInput.addEventListener('input', () => {
    let value = parseInt(bpmInput.value);
    // Pozwól na wpisanie dowolnej wartości, ale ogranicz tylko górny zakres
    if (value > 208) {
        value = 208;
        bpmInput.value = 208;
    }
    
    // Jeśli metronom jest aktywny, zaktualizuj tempo
    // i wymuś minimalną wartość 40
    if (metronomeInterval !== null) {
        if (value < 40) {
            value = 40;
            bpmInput.value = 40;
        }
        startMetronome();
    }
}); 