# HL7 Sender & Receiver

A full-stack application for sending and receiving HL7 messages over MLLP (Minimal Lower Layer Protocol), built with React (Vite) on the frontend and Node.js (Express) on the backend.

## Features

- **Send HL7 Messages**: Send customizable HL7 messages to any defined host and port.
- **Listen for HL7 Messages**: Create local listeners on specific ports to receive HL7 messages.
- **Auto-Acknowledge**: Automatically generates and sends back an HL7 ACK (AA - Application Accept) when a message is successfully received.
- **Real-time Updates**: Real-time message status updates using WebSockets (Socket.IO).
- **Target Management**: Save, edit, and manage frequently used sending targets (host/port) and listening receivers using IndexedDB (Dexie).

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Socket.IO Client, Dexie (IndexedDB wrapper)
- **Backend**: Node.js, Express, Socket.IO, `net` (for raw TCP/MLLP connections)

## Prerequisites

- Node.js (v16+ recommended)
- npm (or yarn/pnpm)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

To start both the frontend and backend servers concurrently, run:

```bash
npm run dev
```

This will run:
- **Frontend**: Vite dev server (usually on `http://localhost:5173`)
- **Backend**: Express/Node server (defaults to port `3001`)

To start them individually:
- `npm run dev:frontend`
- `npm run dev:backend`

## Building for Production

Compile TypeScript and build the Vite frontend:

```bash
npm run build
```

## Linting

You can run ESLint over the project using:

```bash
npm run lint
```
