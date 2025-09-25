/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from "react";
import { sendToChat, uploadAudio, type ChatMessage } from "../lib/api";
import AudioRecorder from "./AudioRecorder";
import { MessageBubble } from "./MessageBubble";
import InputWithSuggestions from "./InputWithSuggestions";
import InitialBotMessage from "./InitialBotMessage";

export default function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const sessionId = useMemo(() => {
    const existing = localStorage.getItem("sessionId");
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem("sessionId", id);
    return id;
  }, []);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Do not scroll if there are no messages
    if (messages.length > 0) {
      // Delay to ensure the content has been rendered
      setTimeout(() => {
        listRef.current?.scrollTo(0, listRef.current.scrollHeight);
      }, 100);
    }
  }, [messages]);

  // Function to extract quick_answers from the message content
  const extractQuickAnswers = (content: string): { cleanContent: string; quickAnswers: string[] } => {
    try {
      // Search for the complete markdown code block with JSON
      const markdownMatch = content.match(/```json\s*\{[\s\S]*"quick_answers"[\s\S]*?\}\s*```/);
      
      if (markdownMatch) {
        // Extract only the JSON from the markdown block
        const jsonMatch = markdownMatch[0].match(/\{[\s\S]*"quick_answers"[\s\S]*?\}/);
        
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          const parsed = JSON.parse(jsonStr);
          
          if (parsed.quick_answers && Array.isArray(parsed.quick_answers)) {
            // Remove the entire markdown block from the content
            const cleanContent = content.replace(markdownMatch[0], '').trim();
            return { cleanContent, quickAnswers: parsed.quick_answers };
          }
        }
      }
      
      // If the markdown block is not found, search for the JSON alone
      const jsonMatch = content.match(/\{[\s\S]*"quick_answers"[\s\S]*?\}/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        
        if (parsed.quick_answers && Array.isArray(parsed.quick_answers)) {
          // Remove the JSON from the content
          const cleanContent = content.replace(jsonMatch[0], '').trim();
          return { cleanContent, quickAnswers: parsed.quick_answers };
        }
      }
    } catch {
      // Silence parsing errors
    }
    
    return { cleanContent: content, quickAnswers: [] };
  };

  // Function to send message directly with text
  const sendMessageDirectly = async (messageText: string) => {
    if (!messageText.trim()) return;
    const userMsg: ChatMessage = { role: "user", content: messageText.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setIsThinking(true);
    
    try {
      const json = await sendToChat({ message: userMsg.content, sessionId });
      const text = json?.output ?? json?.data ?? JSON.stringify(json);
      
      // Extract quick_answers from the message content
      const { cleanContent, quickAnswers } = extractQuickAnswers(String(text));
      
      setMessages((m) => [...m, { 
        role: "assistant", 
        content: cleanContent,
        quickAnswers: quickAnswers
      }]);
      
    } catch (error) {
      console.error(error);
      setMessages((m) => [...m, { role: "assistant", content: "❌ Error processing your message." }]);
    } finally {
      setIsThinking(false);
    }
  };

  async function sendText() {
    if (!input.trim()) return;
    await sendMessageDirectly(input);
  }

  function handleTemplateSelect(template: string) {
    if (isThinking) return;
    
    // Create user message with selected template
    const userMsg: ChatMessage = { role: "user", content: template };
    setMessages((m) => [...m, userMsg]);
    setIsThinking(true);
    
    // Send template selection to chat
    sendToChat({ message: template, sessionId })
      .then((json) => {
        const text = json?.output ?? json?.data ?? JSON.stringify(json);
        
        // Extract quick_answers from message content
        const { cleanContent, quickAnswers } = extractQuickAnswers(String(text));
        
        setMessages((m) => [...m, { 
          role: "assistant", 
          content: cleanContent,
          quickAnswers: quickAnswers
        }]);
      })
      .catch((error) => {
        console.error(error);
        setMessages((m) => [...m, { role: "assistant", content: "❌ Error processing your message." }]);
      })
      .finally(() => {
        setIsThinking(false);
      });
  }

  function sendQuickAnswer(answer: string) {
    if (isThinking) return;
    
    // Create user message
    const userMsg: ChatMessage = { role: "user", content: answer };
    setMessages((m) => [...m, userMsg]);
    setIsThinking(true);
    
    // Send to chat
    sendToChat({ message: answer, sessionId })
      .then((json) => {
        const text = json?.output ?? json?.data ?? JSON.stringify(json);
        
        // Extract quick_answers from the message content
        const { cleanContent, quickAnswers } = extractQuickAnswers(String(text));
        
        setMessages((m) => [...m, { 
          role: "assistant", 
          content: cleanContent,
          quickAnswers: quickAnswers
        }]);
      })
      .catch((error) => {
        console.error(error);
        setMessages((m) => [...m, { role: "assistant", content: "❌ Error processing your message." }]);
      })
      .finally(() => {
        setIsThinking(false);
      });
  }

  async function sendAudioFile(file: File) {
    // Show initial message in "uploading" state
    const userMsg: ChatMessage = {
      role: "user",
      content: "🎙️ Voice message",
      audioFile: file,
      audioStatus: "uploading",
    };
    setMessages((m) => [...m, userMsg]);

    try {
      // Upload file to n8n webhook
      const { audio_url } = await uploadAudio(file);

      // Update state to "uploaded"
      const updatedMsg: ChatMessage = {
        role: "user",
        content: "🎙️ Voice message",
        audioFile: file,
        audioUrl: audio_url,
        audioStatus: "uploaded",
      };
      setMessages((m) => m.slice(0, -1).concat(updatedMsg));

       // Send audio_url to Chat Trigger for transcription + response
       setIsThinking(true);
       const json = await sendToChat({
         message: "",
         sessionId,
         audio_url,
       });

       const text = json?.output ?? json?.data ?? JSON.stringify(json);
       
       // Extract quick_answers from the message content
       const { cleanContent, quickAnswers } = extractQuickAnswers(String(text));
       
       setMessages((m) => [...m, { 
         role: "assistant", 
         content: cleanContent,
         quickAnswers: quickAnswers
       }]);
       
       setIsThinking(false);
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        role: "user",
        content: "🎙️ Voice message",
        audioFile: file,
        audioStatus: "error",
      };
      setMessages((m) => m.slice(0, -1).concat(errorMsg));
      setMessages((m) => [...m, { role: "assistant", content: "I couldn't process your audio, could you write it instead?" }]);
      setIsThinking(false);
    }
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <header className="bg-white flex flex-col" style={{ padding: '10px 20px 10px 21px' }}>
        {/* Main header row */}
        <div className="flex items-center justify-between w-full">
          {/* Left section */}
          <div className="flex flex-col justify-center" style={{ gap: '10px' }}>
            {/* See all conversations button */}
            <div className="flex justify-start items-end" style={{ padding: '8px 19px 8px 0px' }}>
              <button 
                className="flex items-center rounded-full bg-transparent text-[#3C51E2] hover:bg-gray-50 transition-colors duration-200"
                style={{ 
                  fontFamily: 'Product Sans Light, system-ui, sans-serif', 
                  fontWeight: 300, 
                  fontSize: '16px', 
                  lineHeight: '1.213em',
                  gap: '8px'
                }}
              >
                <svg width="15" height="13" viewBox="0 0 15 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14.5 6.5C14.5 6.78125 14.25 7 13.9688 7H2.1875L6.5625 11.6875C6.75 11.875 6.75 12.1875 6.53125 12.375C6.4375 12.4688 6.3125 12.5 6.1875 12.5C6.03125 12.5 5.90625 12.4688 5.8125 12.3438L0.625 6.84375C0.4375 6.65625 0.4375 6.375 0.625 6.1875L5.8125 0.6875C6 0.46875 6.3125 0.46875 6.53125 0.65625C6.75 0.84375 6.75 1.15625 6.5625 1.34375L2.1875 6H13.9688C14.25 6 14.5 6.25 14.5 6.5Z" fill="#3C51E2"/>
                </svg>
                <span>See all conversations</span>
              </button>
            </div>
            
            {/* Logo and title group */}
            <div className="flex items-center" style={{ gap: '5px' }}>
              {/* Logo */}
              <div 
                className="flex items-center justify-center overflow-hidden"
                style={{ width: '40px', height: '40px' }}
              >
                <img 
                  src="/mini.png" 
                  alt="AirSaas Bot" 
                  className="w-10 h-10 rounded-lg"
                />
              </div>
              
              {/* Title */}
              <div 
                className="text-[#040D22] font-bold"
                style={{ 
                  fontFamily: 'Product Sans, system-ui, sans-serif', 
                  fontWeight: 700, 
                  fontSize: '18px', 
                  lineHeight: '1.213em',
                  paddingLeft: '5px'
                }}
              >
                AirSaas AI assistant
              </div>
            </div>
          </div>
          
          {/* Right section - Action buttons */}
          <div className="flex items-center" style={{ gap: '5px' }}>
            {/* Expand button */}
            <button 
              className="rounded-full bg-transparent text-[#3C51E2] hover:bg-gray-50 transition-colors duration-200"
              style={{ padding: '8px' }}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
              </svg>
            </button>
            
            {/* Close button */}
            <button 
              className="rounded-full bg-transparent text-[#061333] hover:bg-gray-50 transition-colors duration-200"
              style={{ padding: '8px' }}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4 relative z-10 bg-white"
      >
        {/* Background logo - Fixed position */}
        {/*<div className="fixed right-6 sm:right-6 bottom-16 sm:bottom-50 opacity-5 pointer-events-none z-0">
          <img
            src="/logo-air.svg"
            alt="AirSaas Background Logo"
            className="w-20 h-20 sm:w-32 sm:h-32"
          />
        </div>*/}

         {/* Initial bot message with template selection */}
         {messages.length === 0 && (
           <InitialBotMessage onTemplateSelect={handleTemplateSelect} />
         )}
         
         {messages.map((m, i) => {
           // Only show quick answers for the last assistant message
           const isLastAssistantMessage = m.role === "assistant" && 
             i === messages.length - 1;
           
           return (
             <MessageBubble
               key={i}
               role={m.role}
               isAudio={!!(m.audioFile || m.audioUrl)}
               audioFile={m.audioFile}
               showCopyButton={m.role === "assistant"}
               quickAnswers={isLastAssistantMessage ? m.quickAnswers : []}
               onQuickAnswerClick={isLastAssistantMessage ? sendQuickAnswer : undefined}
             >
               {m.content}
             </MessageBubble>
           );
         })}
         
         {/* Thinking indicator */}
         {isThinking && (
           <MessageBubble role="assistant" quickAnswers={[]} onQuickAnswerClick={undefined}>
             {""}
           </MessageBubble>
         )}
         
      </div>

      <footer className="p-4 sm:p-6 bg-transparent">
        <div className="space-y-4">
          {/* Voice Recording Button */}
          <div className="w-full">
            <AudioRecorder onRecorded={sendAudioFile} disabled={isThinking} />
          </div>
          
          {/* Separator */}
          <div className="flex items-center justify-center opacity-80" style={{ height: '15px' }}>
            <div className="flex-1 h-px bg-[#A6AAB6]"></div>
            <span 
              className="text-[#A6AAB6] text-xs font-light"
              style={{ 
                fontFamily: 'Product Sans Light, system-ui, sans-serif', 
                fontWeight: 300, 
                fontSize: '12px', 
                lineHeight: '1.213em',
                paddingLeft: '16px',
                paddingRight: '16px'
              }}
            >
              Or
            </span>
            <div className="flex-1 h-px bg-[#A6AAB6]"></div>
          </div>
          
          {/* Text Input */}
          <div className="w-full">
            <InputWithSuggestions
              value={input}
              onChange={setInput}
              onSend={sendText}
              onSendDirectly={sendMessageDirectly}
              placeholder={isThinking ? "Bot is responding..." : "Type if necessary..."}
              disabled={isThinking}
              isThinking={isThinking}
              suggestions={["Donnez-moi des exemples", "Sauter cette question"]}
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
