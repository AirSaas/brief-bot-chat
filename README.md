# AirSaas Brief Chat

A modern chat application built with React, TypeScript, and Vite, featuring voice message support with Supabase Storage integration.

## Overview

Brief Chat is a real-time messaging application that enables text and voice communication with an AI assistant. The application provides a clean, responsive interface with advanced audio recording capabilities and seamless integration with external services.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Google Fonts (Google Sans)
- **Audio**: MediaRecorder API, Supabase Storage
- **Backend Integration**: n8n webhooks
- **Markdown**: react-markdown for message rendering

## Features

- Real-time chat interface with typing indicators
- Voice message recording and playback
- Audio file upload to Supabase Storage
- Markdown message rendering
- Responsive design with modern UI/UX
- Bot profile picture and thinking animations
- Session persistence with localStorage
- Keyboard shortcuts (Enter to send)

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- n8n instance (for AI processing)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd brief-chat
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration:
```bash
cp .env.example .env
```

4. Configure environment variables (see Environment Variables section)

5. Start the development server:
```bash
npm run dev
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_SUPABASE_AUDIO=your_supabase_storage_url_here
VITE_SUPABASE_KEY=your_supabase_service_key_here

# n8n Configuration
VITE_N8N_BASE_URL=your_n8n_base_url_here
VITE_N8N_CHAT_WEBHOOK_ID=your_chat_webhook_id_here
```

### Environment Variables Description

- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key for client-side authentication
- `VITE_SUPABASE_AUDIO`: Supabase Storage URL for audio file uploads
- `VITE_SUPABASE_KEY`: Supabase service key for authenticated requests
- `VITE_N8N_BASE_URL`: Base URL of your n8n instance
- `VITE_N8N_CHAT_WEBHOOK_ID`: Webhook ID for chat message processing

## Project Structure

```
src/
├── components/
│   ├── AudioRecorder.tsx    # Audio recording component
│   ├── ChatWindow.tsx       # Main chat interface
│   └── MessageBubble.tsx    # Individual message display
├── lib/
│   └── api.ts              # API integration functions
├── App.tsx                 # Root component
├── index.css               # Global styles and animations
└── main.tsx               # Application entry point
```

## Usage

### Text Messages
- Type your message in the input field
- Press Enter or click Send to submit
- Messages support Markdown formatting

### Voice Messages
- Click the microphone button to start recording
- Click again to stop and send the recording
- Audio files are automatically uploaded to Supabase Storage
- Playback controls are available for all voice messages

### Bot Interaction
- The AI assistant responds to both text and voice messages
- A thinking indicator shows when the bot is processing
- Bot messages include profile picture and markdown rendering

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS for styling
- Functional components with hooks
- English comments and documentation

## API Integration

### Supabase Storage
Audio files are uploaded to Supabase Storage with the following structure:
- Unique filename generation with timestamp
- Bearer token authentication
- Public URL return for playback

### n8n Webhooks
Chat messages are processed through n8n webhooks:
- Text messages sent directly to webhook
- Audio messages uploaded first, then URL sent to webhook
- Session ID persistence for conversation context

## Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting service
3. Ensure environment variables are configured in production
4. Verify Supabase and n8n integrations are working

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For technical support or questions, please open an issue in the repository.