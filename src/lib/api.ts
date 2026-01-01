/* eslint-disable @typescript-eslint/no-explicit-any */
const BASE = import.meta.env.VITE_N8N_BASE_URL;
const CHAT_ID = import.meta.env.VITE_N8N_CHAT_WEBHOOK_ID;

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  audioUrl?: string;
  audioFile?: File;
  audioStatus?: "uploading" | "uploaded" | "error";
  quickAnswers?: string[];
};
export type ChatPayload = {
  message?: string;
  sessionId: string;
  metadata?: Record<string, unknown>;
  audio_url?: string;
  language?: string;
  selected_template?: string;
  signal?: AbortSignal;
};

export async function sendToChat(payload: ChatPayload) {
  try {
    let controller: AbortController | null = null;
    let timeout: NodeJS.Timeout | null = null;
    
    // If no signal provided, create our own controller with timeout
    if (!payload.signal) {
      controller = new AbortController();
      timeout = setTimeout(() => controller!.abort(), 600000); // 10 minutes
    }
    
    const signal = payload.signal || controller!.signal;
    const url = `${BASE}/webhook/${CHAT_ID}/chat`;
    
    // Remove signal from payload before stringifying (it's not JSON serializable)
    const { signal: _, ...payloadWithoutSignal } = payload;
    
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payloadWithoutSignal),
      signal: signal,
    });
    
    if (timeout) clearTimeout(timeout);

    if (!r.ok) throw new Error(`Chat error ${r.status}`);
    return r.json() as Promise<{ output?: string; quick_answers?: string[]; [key: string]: any }>;
  } catch (err) {
    console.error("sendToChat failed:", err);
    throw err;
  }
}

export async function uploadAudio(file: File) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_AUDIO;
  const supabaseToken = import.meta.env.VITE_SUPABASE_KEY;
  
  if (!supabaseToken) {
    throw new Error("Supabase token not found in environment variables");
  }

  // Generate unique filename with timestamp
  const timestamp = Date.now();
  const filename = `audio_${timestamp}_${file.name}`;
  const fullUrl = `${supabaseUrl}${filename}`;

  try {
    const res = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${supabaseToken}`,
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!res.ok) {
      throw new Error(`Supabase upload error ${res.status}: ${res.statusText}`);
    }

    // Return the public URL for the uploaded file
    return { audio_url: fullUrl };
  } catch (error) {
    console.error("Supabase upload failed:", error);
    throw error;
  }
}
