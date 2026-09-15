import { useRef, useState } from 'react';

const SpeechRecognitionAPI =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

// Small mic toggle that dictates into a text field via the browser's
// built-in speech recognition — no server, no API key, no cost. Appends
// each recognized utterance to the field's current value, so tapping it
// again continues dictating rather than overwriting.
export default function MicButton({ value, onText, lang = 'fr-FR' }) {
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);

  if (!SpeechRecognitionAPI) return null;

  function stop() {
    recRef.current?.stop();
  }

  function start() {
    const rec = new SpeechRecognitionAPI();
    rec.lang = lang;
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e) => {
      const text = Array.from(e.results)
        .map((r) => r[0].transcript.trim())
        .join(' ');
      if (!text) return;
      const sep = value && !/[\s\n]$/.test(value) ? ' ' : '';
      onText(value + sep + text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  }

  return (
    <button
      type="button"
      onClick={listening ? stop : start}
      aria-label={listening ? 'Arrêter la dictée' : 'Dicter au micro'}
      title={listening ? 'Arrêter la dictée' : 'Dicter au micro'}
      style={{
        flex: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 26,
        height: 26,
        padding: 0,
        border: 0,
        borderRadius: 999,
        cursor: 'pointer',
        background: listening ? 'var(--color-accent)' : 'var(--color-neutral-200)',
        color: listening ? '#fff' : 'var(--color-neutral-700)',
        animation: listening ? 'mic-pulse 1.1s ease-in-out infinite' : 'none'
      }}
    >
      <style>{`@keyframes mic-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .55; } }`}</style>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
        <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
        <path d="M12 18v4M8 22h8" />
      </svg>
    </button>
  );
}
