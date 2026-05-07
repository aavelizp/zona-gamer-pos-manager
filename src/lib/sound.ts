// Simple beep using WebAudio
let ctx: AudioContext | null = null;
function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch { return null; }
  }
  return ctx;
}

export function playAlert() {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  for (let i = 0; i < 3; i++) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.value = 880;
    o.type = "square";
    g.gain.setValueAtTime(0.0001, now + i * 0.5);
    g.gain.exponentialRampToValueAtTime(0.25, now + i * 0.5 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.5 + 0.35);
    o.connect(g).connect(c.destination);
    o.start(now + i * 0.5);
    o.stop(now + i * 0.5 + 0.4);
  }
}
