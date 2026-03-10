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

## Testing Locally (Usage)

You can easily test the sender and receiver against each other on your local machine.

1. **Start the applications**: Run `npm run dev` in your terminal.
2. **Open the App**: Navigate to `http://localhost:5173` in your browser.
3. **Start a Listener (Receiver)**: 
   - On the "Receivers" side, add a new receiver and set the port to something like `5000`.
   - Start the listener on port `5000`. The server is now waiting for MLLP/HL7 messages on `localhost:5000`.
4. **Send a Message (Sender)**:
   - On the "Targets" side, configure your target Host as `localhost` and Port as `5000`.
   - Paste or type standard HL7 message into the message box.
   - Click "Send".
5. **Verify**:
   - You should see the message pop up in the logs on the Receiver side.
   - The Sender should display a successful ACK received from the Receiver.
