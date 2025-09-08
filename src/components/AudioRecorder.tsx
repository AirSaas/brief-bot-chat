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
    <div className="flex items-center gap-2">
      {!isRec ? (
        <button 
          disabled={disabled} 
          onClick={start} 
          className="px-5 py-3 bg-brand-500 text-white font-bold shadow-lg hover:bg-brand-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ color: 'white', backgroundColor: '#3C51E2' }}
        >
          🎙️ Record
        </button>
      ) : (
        <button 
          onClick={stop} 
          className="px-5 py-3 bg-red-500 text-white font-bold shadow-lg hover:bg-red-600 transition-all duration-300"
          style={{ color: 'white', backgroundColor: '#EF4444' }}
        >
          ⏹ Stop
        </button>
      )}
    </div>
  );
}
