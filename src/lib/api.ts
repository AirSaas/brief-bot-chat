/* eslint-disable @typescript-eslint/no-explicit-any */
const BASE = import.meta.env.VITE_N8N_BASE_URL;
const CHAT_ID = import.meta.env.VITE_N8N_CHAT_WEBHOOK_ID;

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  audioUrl?: string;
  audioFile?: File;
  audioStatus?: "uploading" | "uploaded" | "error";
};
export type ChatPayload = {
  message?: string;
  sessionId: string;
  metadata?: Record<string, unknown>;
  audio_url?: string;
};

export async function sendToChat(payload: ChatPayload) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s
    const url = `${BASE}/webhook/${CHAT_ID}/chat`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!r.ok) throw new Error(`Chat error ${r.status}`);
    return r.json() as Promise<{ output?: string; [key: string]: any }>;
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
