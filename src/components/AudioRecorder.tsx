import { useEffect, useRef, useState } from 'react';

type Props = { onRecorded: (file: File) => Promise<void>; disabled?: boolean };

export default function AudioRecorder({ onRecorded, disabled }: Props) {
  const [rec, setRec] = useState<MediaRecorder|null>(null);
  const [isRec, setIsRec] = useState(false);
  const chunks = useRef<BlobPart[]>([]);

  useEffect(() => () => { if (rec?.state === 'recording') rec.stop(); }, [rec]);

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data); };
    mr.onstop = async () => {
      const blob = new Blob(chunks.current, { type: 'audio/webm' });
      chunks.current = [];
      const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
      await onRecorded(file);
      stream.getTracks().forEach(t => t.stop());
    };
    mr.start();
    setRec(mr);
    setIsRec(true);
  }

  function stop() {
    rec?.stop();
    setIsRec(false);
  }

  return (
    <>
      {!isRec ? (
        <button 
          disabled={disabled} 
          onClick={start} 
          className="px-3 sm:px-5 py-2 sm:py-3 bg-brand-500 text-white font-bold shadow-lg hover:bg-brand-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed audio-recorder-button text-sm sm:text-base touch-manipulation"
          style={{ color: 'white', backgroundColor: '#3C51E2' }}
        >
          <span className="sm:hidden">🎙️</span>
          <span className="hidden sm:inline">🎙️ Record</span>
        </button>
      ) : (
        <button 
          onClick={stop} 
          className="px-3 sm:px-5 py-2 sm:py-3 text-white font-bold audio-recorder-button audio-recorder-stop text-sm sm:text-base touch-manipulation"
          style={{ color: 'white' }}
        >
          <span className="sm:hidden">⏹</span>
          <span className="hidden sm:inline">⏹ Stop</span>
        </button>
      )}
    </>
  );
}
