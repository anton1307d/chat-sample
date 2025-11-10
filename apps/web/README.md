# Chat Application - Web Client

Modern real-time chat application built with React, TypeScript, and Vite.

## Features

- 🔐 Authentication (Login/Register)
- 💬 Real-time messaging via WebSocket
- 👥 Group conversations
- 📝 Message editing and deletion
- 😊 Emoji reactions
- ✅ Read receipts
- ⌨️ Typing indicators
- 📱 Responsive design
- 🎨 Modern UI with Tailwind CSS

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Socket.IO** - WebSocket client
- **React Router** - Routing
- **Axios** - HTTP client

## Getting Started

### Prerequisites

- Node.js 18+
pnpm

### Installation
```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your API URLs
```

### Development
```bash
npm run dev
```

App will be available at `http://localhost:3001`

### Build
```bash
pnpm run build
```

### Preview Production Build
```bash
pnpm run preview
```

## Project Structure