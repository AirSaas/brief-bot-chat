import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

type Props = { 
  onRecorded: (file: File) => Promise<void>; 
  disabled?: boolean;
  onRecordingStateChange?: (isRecording: boolean) => void;
};

export default function AudioRecorder({ onRecorded, disabled, onRecordingStateChange }: Props) {
  const { t } = useTranslation();
  const [rec, setRec] = useState<MediaRecorder|null>(null);
  const [isRec, setIsRec] = useState(false);
  const chunks = useRef<BlobPart[]>([]);

  useEffect(() => () => { if (rec?.state === 'recording') rec.stop(); }, [rec]);

  // Notify parent when recording state changes
  useEffect(() => {
    onRecordingStateChange?.(isRec);
  }, [isRec, onRecordingStateChange]);

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
          tabIndex={2}
          className="w-full px-[19px] py-2 bg-[#E8EBFE] text-[#3C51E2] font-light text-base rounded-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:bg-[#D8DCFE]"
          style={{ fontFamily: 'Product Sans Light, system-ui, sans-serif', lineHeight: '1.213em' }}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
          <span>{t('chat.audio_button.start_dictating')}</span>
        </button>
      ) : (
        <button 
          onClick={stop}
          tabIndex={2}
          className="w-full px-[19px] py-2 bg-[#FEE8E8] text-[#E23C3C] font-light text-base rounded-full flex items-center justify-center gap-2 transition-all duration-300 hover:bg-[#FED8D8]"
          style={{ fontFamily: 'Product Sans Light, system-ui, sans-serif', lineHeight: '1.213em' }}
        >
          <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.5 3.5C14.5938 3.5 15.5 4.40625 15.5 5.5V13.5C15.5 14.5938 14.5938 15.5 13.5 15.5H5.5C4.375 15.5 3.5 14.5938 3.5 13.5V5.5C3.5 4.40625 4.375 3.5 5.5 3.5H13.5ZM14.5 13.5V5.5C14.5 4.96875 14.0312 4.5 13.5 4.5H5.5C4.9375 4.5 4.5 4.96875 4.5 5.5V13.5C4.5 14.0625 4.9375 14.5 5.5 14.5H13.5C14.0312 14.5 14.5 14.0625 14.5 13.5Z" fill="currentColor"/>
          </svg>
          <span>{t('chat.audio_button.stop_recording')}</span>
        </button>
      )}
    </>
  );
}
