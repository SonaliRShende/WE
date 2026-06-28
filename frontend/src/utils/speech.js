let currentSpeech = null;

export function speak(text, lang = "en-IN", callback = null) {

    window.speechSynthesis.cancel();

    currentSpeech = new SpeechSynthesisUtterance(text);

    currentSpeech.lang = lang;

    currentSpeech.rate = 0.9;

    currentSpeech.pitch = 1;

    currentSpeech.volume = 1;

    if (callback) {
        currentSpeech.onend = callback;
    }

    window.speechSynthesis.speak(currentSpeech);
}

export function stopSpeaking() {

    window.speechSynthesis.cancel();

}