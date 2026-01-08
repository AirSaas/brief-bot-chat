/* eslint-disable @typescript-eslint/no-unused-vars */
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

// Function to insert initial chat history into Supabase
export async function insertInitialChatHistory(
  sessionId: string,
  humanMessage: Record<string, unknown>,
  aiMessage: Record<string, unknown>
) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseToken = import.meta.env.VITE_SUPABASE_SERVICE_KEY || import.meta.env.VITE_SUPABASE_KEY;
  
  if (!supabaseUrl || !supabaseToken) {
    throw new Error("Supabase configuration not found in environment variables");
  }

  try {
    // Insert human message
    const humanResponse = await fetch(`${supabaseUrl}/rest/v1/n8n_splited_brief_chat_histories`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${supabaseToken}`,
        "Content-Type": "application/json",
        "apikey": supabaseToken,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        session_id: sessionId,
        message: humanMessage,
      }),
    });

    if (!humanResponse.ok) {
      const errorText = await humanResponse.text();
      throw new Error(`Failed to insert human message: ${humanResponse.status} - ${errorText}`);
    }

    // Insert AI message
    const aiResponse = await fetch(`${supabaseUrl}/rest/v1/n8n_splited_brief_chat_histories`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${supabaseToken}`,
        "Content-Type": "application/json",
        "apikey": supabaseToken,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        session_id: sessionId,
        message: aiMessage,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      throw new Error(`Failed to insert AI message: ${aiResponse.status} - ${errorText}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to insert initial chat history:", error);
    throw error;
  }
}

// Function to get initial messages for a template and language
export function getInitialMessages(templateValue: string, language: string) {
  const isFrench = language === 'fr' || language.startsWith('fr');
  
  if (isFrench) {
    if (templateValue === 'basic') {
      return {
        human: {
          "type": "human",
          "content": "Let's start a Basic Narrative, ask me your first question to guide the brief! =my language is French, let's keep this conversation entirely in French=\n\nthe template is \"Basic Story Telling\", Its data is:\nAirsaas main instruction : \nYou are a highly experienced project management consultant. You are known for your ability to listen, analyze, and synthesize important information from data sets that are sometimes incomplete or ambiguous.\nYour goal is to write project briefs based on one-minute audio notes or text answers, in which a person is asked to describe their project in a guided manner. They must discuss the context of the project, its scope, its objective, the risks of not doing it, and the people who will be impacted.\nThis brief must include the following sections, based strictly on the information provided and using constructive creativity when data is missing.\n\nTONE of VOICE of brief project\nYou will be concise and polite but not so professional.  You want to write something that people love to read.\u000b\u000bGlobal information template :\nProject context: You provide a clear and engaging description of the project, using formal and professional language. This section should establish the overall framework of the project, its importance to the company, and how it fits into a broader strategy.\nTarget users: Identify who will directly benefit from this project. Do not limit yourself to generalities; try to define their specific needs and how the project will meet them.\nProject objective: Detail the specific goals the project aims to achieve, highlighting the added value for the company and for the target users.\nRisks of not completing the project: you assess the potential consequences of not completing the project. Use an analysis method to present these risks in a structured way.\nTarget budget: you propose several budget scenarios (minimalist, standard, ambitious), explaining how each one affects the scope and objectives of the project.\nProvide estimates based on similar projects or industry standards if the audio does not contain specific information on this subject.\nIf crucial information is missing from the audio, feel free to make informed assumptions based on similar projects or industry best practices. Your analysis should help fill in the gaps in information while remaining faithful to the requested sections.\nIt must contain a minimum of 500 and a maximum of 1,500 words. This length requirement, which you must adhere to, is intended to ensure a comprehensive and detailed analysis, while remaining concise and relevant.\nAttribute prompt / To find : \n\nAttribute name : Importance \u000bDescription : Importance du projet \u000bAttribute value : Vital : un projet indispensable pour l'organisation, sans lui ça va sera une catastrophe\nAttribute value : Essentiel : un projet vraiment fondamental qu'il faudra faire\nAttribute value : Normal : un projet intéressant \nAttribute value : Faible : un projet sans intérêt \n\nAttribut Budget Capex : Number\nDescription : Budget Capex du projet. \n\n\n---\n\nYou must work with all this information.",
          "additional_kwargs": {},
          "response_metadata": {}
        },
        ai: {
          "type": "ai",
          "content": "Pour mieux comprendre votre projet, il est important de décrire son contexte de manière claire et engageante. Pouvez-vous nous donner une description du cadre global de votre projet, en soulignant son importance pour l'organisation et sa place dans une stratégie plus large ?\n\n{ \"quick_answers\": [ \"Le projet que nous envisageons vise à développer une plateforme SaaS pour améliorer la gestion des ressources humaines au sein de notre organisation. Ce projet est crucial car il soutiendra notre stratégie de digitalisation en facilitant la gestion des talents et en optimisant les processus internes. Sans cette initiative, nous risquons de perdre en compétitivité sur le marché, car nos processus actuels sont trop manuels et inefficaces.\", \"Notre projet consiste à créer un outil de gestion des performances pour les équipes RH. Cela répond à un besoin urgent d'aligner les objectifs des employés avec ceux de l'entreprise. En intégrant cette solution, nous prévoyons d'améliorer la satisfaction des employés et d'augmenter la productivité. Ce projet est essentiel pour notre stratégie de croissance, car il nous permettra d'attirer et de retenir les meilleurs talents dans un marché de l'emploi concurrentiel.\", \"Nous développons une application mobile pour faciliter la communication interne entre les employés. Ce projet est vital pour notre organisation, car il répond à une lacune dans notre approche actuelle de la collaboration. En améliorant la communication, nous espérons réduire le turnover et renforcer l'engagement des employés. Si nous n'agissons pas, cela pourrait entraîner un isolement des équipes et une diminution de l'efficacité opérationnelle.\", \"Le cadre global de notre projet consiste à mettre en place un système intégré de gestion des ressources humaines qui regroupe tous les processus en un seul endroit. Ce projet est fondamental pour notre stratégie à long terme car il nous permettra d'analyser nos données RH de manière plus efficace et d'adapter nos stratégies en conséquence. Ne pas réaliser ce projet pourrait entraîner une perte de temps précieux pour nos équipes et un manque d'alignement stratégique.\" ] }",
          "tool_calls": [],
          "additional_kwargs": {},
          "response_metadata": {},
          "invalid_tool_calls": []
        }
      };
    } else if (templateValue === 'emotional') {
      return {
        human: {
          "type": "human",
          "content": "Let's start an Emotional Narrative, ask me your first question to guide the brief! =my language is French, let's keep this conversation entirely in French=\n\nthe template is \"Emotional Story Telling\", Its data is:\nAirsaas main instruction:  \u000b\nYou are a highly experienced project management consultant specialized in corporate storytelling. You are known for your ability to transform complex project inputs into emotionally engaging narratives that mobilize internal teams.\n\nYour goal is to write project briefs based on one-minute audio notes or text answers, in which a person is asked to describe their project in a guided manner.  \nThey must discuss the context and purpose of the project, the people it impacts (protagonists), and the main challenge or risk if the project fails.\n\nContext:  \nYou will receive a user input about an internal company project. Your mission is to extract the essential information by guiding the user with specific questions.  \nOnce all relevant information is gathered, you will generate a succinct and captivating project brief in the form of a short emotional story.\n\nThis brief must remain faithful to the user's input while using copywriting and storytelling techniques to create an emotional, convincing, and inspiring narrative.\n\nTONE of VOICE of brief project:  \nThe brief must be written in English. It should aim to inform, inspire, and mobilize a company's teams around a shared project vision.  \nUse a storytelling tone that balances emotional resonance with clarity and accuracy — do not exaggerate.\n\nGlobal information template:  \nThis project brief must be between **300 and 1000 words**.  \nThe content must:\n- Inform and inspire readers\n- Translate raw project information into a narrative that resonates emotionally\n- Be structured and easy to read\n- Stay aligned with the actual data provided (no fiction or invention)\n\nIf the input lacks details, you may apply light constructive creativity based on similar use cases or organizational needs — but **never invent information.**\n\nAttribute prompt / To find:\n\nAttribute name: Context and Purpose  \nDescription: The context of the project and the reason it is being initiated. What need or problem is it solving?\n\nAttribute name: Protagonists  \nDescription: Who are the beneficiaries or affected users? What do they need? How will the project impact them?\n\nAttribute name: Main Challenge  \nDescription: What is the primary objective or challenge of the project? What is at risk if the project is not completed?\n\n\n\n\n\n---\n\nYou must work with all this information.",
          "additional_kwargs": {},
          "response_metadata": {}
        },
        ai: {
          "type": "ai",
          "content": "Pour bien comprendre votre projet, il est important de connaître le contexte et les raisons qui le sous-tendent. Quel besoin ou problème votre projet cherche-t-il à résoudre ?\n\n{ \"quick_answers\": [ \"Our project aims to streamline communication within our remote teams, addressing the growing issue of miscommunication and delays in project timelines. By implementing a centralized platform for collaboration, we hope to enhance productivity and ensure that everyone stays aligned with project goals.\", \"The primary need our project seeks to resolve is the inefficiency in our current workflow processes. Many teams are struggling with disparate tools that don't integrate well, leading to wasted time and frustration. We aim to create an all-in-one solution that simplifies task management and enhances team collaboration, ultimately driving better results.\", \"This initiative is designed to tackle the problem of employee disengagement in our organization. With remote work becoming the norm, many employees feel isolated and disconnected from their teams. Our project will introduce regular virtual team-building activities and feedback mechanisms to foster a sense of community and improve overall morale.\", \"We are addressing a critical gap in customer feedback management. Currently, we lack a streamlined process for gathering and analyzing customer insights, which hinders our ability to respond effectively to their needs. This project will implement a robust feedback system that empowers our teams to make data-driven decisions, enhancing customer satisfaction and loyalty.\" ] }",
          "tool_calls": [],
          "additional_kwargs": {},
          "response_metadata": {},
          "invalid_tool_calls": []
        }
      };
    }
  } else {
    // English messages
    if (templateValue === 'basic') {
      return {
        human: {
          "type": "human",
          "content": "Let's start a Basic Story Telling, start your first question to me for guiding the brief! =my language is English, let's keep this conversation completely in English=\n\nthe template is \"Basic Story Telling\", Its data is:\nAirsaas main instruction : \nYou are a highly experienced project management consultant. You are known for your ability to listen, analyze, and synthesize important information from data sets that are sometimes incomplete or ambiguous.\nYour goal is to write project briefs based on one-minute audio notes or text answers, in which a person is asked to describe their project in a guided manner. They must discuss the context of the project, its scope, its objective, the risks of not doing it, and the people who will be impacted.\nThis brief must include the following sections, based strictly on the information provided and using constructive creativity when data is missing.\n\nTONE of VOICE of brief project\nYou will be concise and polite but not so professional.  You want to write something that people love to read.\u000b\u000bGlobal information template :\nProject context: You provide a clear and engaging description of the project, using formal and professional language. This section should establish the overall framework of the project, its importance to the company, and how it fits into a broader strategy.\nTarget users: Identify who will directly benefit from this project. Do not limit yourself to generalities; try to define their specific needs and how the project will meet them.\nProject objective: Detail the specific goals the project aims to achieve, highlighting the added value for the company and for the target users.\nRisks of not completing the project: you assess the potential consequences of not completing the project. Use an analysis method to present these risks in a structured way.\nTarget budget: you propose several budget scenarios (minimalist, standard, ambitious), explaining how each one affects the scope and objectives of the project.\nProvide estimates based on similar projects or industry standards if the audio does not contain specific information on this subject.\nIf crucial information is missing from the audio, feel free to make informed assumptions based on similar projects or industry best practices. Your analysis should help fill in the gaps in information while remaining faithful to the requested sections.\nIt must contain a minimum of 500 and a maximum of 1,500 words. This length requirement, which you must adhere to, is intended to ensure a comprehensive and detailed analysis, while remaining concise and relevant.\nAttribute prompt / To find : \n\nAttribute name : Importance \u000bDescription : Importance du projet \u000bAttribute value : Vital : un projet indispensable pour l'organisation, sans lui ça va sera une catastrophe\nAttribute value : Essentiel : un projet vraiment fondamental qu'il faudra faire\nAttribute value : Normal : un projet intéressant \nAttribute value : Faible : un projet sans intérêt \n\nAttribut Budget Capex : Number\nDescription : Budget Capex du projet. \n\n\n---\n\nYou must work with all this information.",
          "additional_kwargs": {},
          "response_metadata": {}
        },
        ai: {
          "type": "ai",
          "content": "To create a compelling project brief, I need to understand the context and purpose of your project. What need or problem is your project addressing?\n\n{ \"quick_answers\": [ \"Our project addresses the need for improved communication within our remote teams, as we've identified that miscommunication has led to delays and frustration among team members. By implementing a centralized communication platform, we aim to enhance collaboration and streamline project workflows.\", \"The purpose of our project is to tackle the inefficiencies in our current onboarding process, which has been a significant pain point for new hires. We are creating a comprehensive onboarding program that not only educates new employees about their roles but also fosters a sense of belonging within the company culture.\", \"This project aims to solve the problem of high employee turnover caused by inadequate career development opportunities. By introducing a mentorship program, we hope to provide our employees with guidance and support, ultimately improving retention rates and job satisfaction.\", \"Our initiative focuses on addressing the lack of data-driven decision-making in our marketing department. The goal is to implement an analytics dashboard that provides real-time insights into campaign performance, enabling teams to make informed choices and optimize strategies effectively.\" ] }",
          "tool_calls": [],
          "additional_kwargs": {},
          "response_metadata": {},
          "invalid_tool_calls": []
        }
      };
    } else if (templateValue === 'emotional') {
      return {
        human: {
          "type": "human",
          "content": "Let's start an Emotional Story Telling, start your first question to me for guiding the brief! =my language is English, let's keep this conversation completely in English=\n\nthe template is \"Emotional Story Telling\", Its data is:\nAirsaas main instruction:  \u000b\nYou are a highly experienced project management consultant specialized in corporate storytelling. You are known for your ability to transform complex project inputs into emotionally engaging narratives that mobilize internal teams.\n\nYour goal is to write project briefs based on one-minute audio notes or text answers, in which a person is asked to describe their project in a guided manner.  \nThey must discuss the context and purpose of the project, the people it impacts (protagonists), and the main challenge or risk if the project fails.\n\nContext:  \nYou will receive a user input about an internal company project. Your mission is to extract the essential information by guiding the user with specific questions.  \nOnce all relevant information is gathered, you will generate a succinct and captivating project brief in the form of a short emotional story.\n\nThis brief must remain faithful to the user's input while using copywriting and storytelling techniques to create an emotional, convincing, and inspiring narrative.\n\nTONE of VOICE of brief project:  \nThe brief must be written in English. It should aim to inform, inspire, and mobilize a company's teams around a shared project vision.  \nUse a storytelling tone that balances emotional resonance with clarity and accuracy — do not exaggerate.\n\nGlobal information template:  \nThis project brief must be between **300 and 1000 words**.  \nThe content must:\n- Inform and inspire readers\n- Translate raw project information into a narrative that resonates emotionally\n- Be structured and easy to read\n- Stay aligned with the actual data provided (no fiction or invention)\n\nIf the input lacks details, you may apply light constructive creativity based on similar use cases or organizational needs — but **never invent information.**\n\nAttribute prompt / To find:\n\nAttribute name: Context and Purpose  \nDescription: The context of the project and the reason it is being initiated. What need or problem is it solving?\n\nAttribute name: Protagonists  \nDescription: Who are the beneficiaries or affected users? What do they need? How will the project impact them?\n\nAttribute name: Main Challenge  \nDescription: What is the primary objective or challenge of the project? What is at risk if the project is not completed?\n\n\n\n\n\n---\n\nYou must work with all this information.",
          "additional_kwargs": {},
          "response_metadata": {}
        },
        ai: {
          "type": "ai",
          "content": "To create a compelling narrative for your project brief, it's essential to understand the context and purpose behind your project. Could you please describe what need or problem your project is addressing?\n\n{ \"quick_answers\": [ \"Our project addresses the urgent need for a streamlined internal communication system within our organization, which has been hampered by disjointed channels and unclear messaging. By developing a unified platform, we aim to enhance collaboration among teams, ultimately improving productivity and morale.\", \"The primary problem our project tackles is the inefficiency in reporting processes that leads to delays in decision-making. With this initiative, we seek to implement a real-time data analytics tool that empowers our teams with timely insights, enabling them to respond swiftly to market changes and customer needs.\", \"This project is designed to solve the issue of employee disengagement stemming from lack of recognition and feedback. By introducing a new performance management system that incorporates regular check-ins and peer recognition, we aim to foster a culture of appreciation that enhances employee satisfaction and retention.\", \"Our initiative is born out of the necessity to adapt to remote work challenges that have emerged post-pandemic. The main challenge lies in creating an engaging virtual environment for team collaboration. If we fail to implement effective tools and practices, we risk losing team cohesion and the innovative spirit that drives our company forward.\" ] }",
          "tool_calls": [],
          "additional_kwargs": {},
          "response_metadata": {},
          "invalid_tool_calls": []
        }
      };
    }
  }
  
  return null;
}

// Function to get the first AI message from Supabase for a session
export async function getFirstAIMessage(sessionId: string) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseToken = import.meta.env.VITE_SUPABASE_SERVICE_KEY || import.meta.env.VITE_SUPABASE_KEY;
  
  if (!supabaseUrl || !supabaseToken) {
    throw new Error("Supabase configuration not found in environment variables");
  }

  try {
    // Get messages for this session, ordered by created_at
    const response = await fetch(
      `${supabaseUrl}/rest/v1/n8n_splited_brief_chat_histories?session_id=eq.${sessionId}&order=created_at.asc`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${supabaseToken}`,
          "Content-Type": "application/json",
          "apikey": supabaseToken,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get messages: ${response.status} - ${errorText}`);
    }

    const messages = await response.json() as Array<{ message: { type: string; content: string; [key: string]: unknown } }>;
    
    // Find the first AI message
    const aiMessage = messages.find(msg => msg.message.type === 'ai');
    
    if (aiMessage && aiMessage.message.content) {
      return aiMessage.message.content;
    }
    
    return null;
  } catch (error) {
    console.error("Failed to get first AI message:", error);
    throw error;
  }
}
