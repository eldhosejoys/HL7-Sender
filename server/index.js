import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import net from 'net';

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// MLLP Framing characters
const VT = Buffer.from([0x0b]);
const FS = Buffer.from([0x1c]);
const CR = Buffer.from([0x0d]);

// Active listeners map: port -> net.Server
const activeListeners = new Map();

// Helper to frame a message
const frameMessage = (msg) => Buffer.concat([VT, Buffer.from(msg, 'utf8'), FS, CR]);

/**
 * Generate a simple AA (Application Accept) ACK for a given HL7 message
 */
const generateAck = (hl7Message) => {
  const segments = hl7Message.split(/[\r\n]+/);
  const msh = segments.find(s => s.startsWith('MSH'));
  if (!msh) return '';

  const fieldSeparator = msh.length > 3 ? msh.charAt(3) : '|';
  const fields = msh.split(fieldSeparator);
  const encodingChars = fields[1] || '^~\\&';
  const sendingApp = fields[2] || '';
  const sendingFac = fields[3] || '';
  const receivingApp = fields[4] || '';
  const receivingFac = fields[5] || '';
  const messageControlId = fields[9] || '';
  const processingId = fields[10] || '';
  const version = fields[11] || '2.3';

  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 14);

  const ackMsh = `MSH${fieldSeparator}${encodingChars}${fieldSeparator}${receivingApp}${fieldSeparator}${receivingFac}${fieldSeparator}${sendingApp}${fieldSeparator}${sendingFac}${fieldSeparator}${timestamp}${fieldSeparator}${fieldSeparator}ACK${fieldSeparator}${messageControlId}${fieldSeparator}${processingId}${fieldSeparator}${version}`;
  const msa = `MSA${fieldSeparator}AA${fieldSeparator}${messageControlId}`;

  return `${ackMsh}\r${msa}\r`;
};

// 1. Send HL7 Message Endpoint
app.post('/api/send', async (req, res) => {
  const { host, port, message } = req.body;

  if (!host || !port || !message) {
    return res.status(400).json({ error: 'Missing host, port, or message' });
  }

  const client = new net.Socket();
  const timeoutMs = 10000;
  let responseData = Buffer.alloc(0);

  client.setTimeout(timeoutMs);

  client.on('timeout', () => {
    client.destroy();
    res.status(504).json({ error: 'Connection timed out' });
  });

  client.on('error', (err) => {
    client.destroy();
    res.status(500).json({ error: err.message });
  });

  client.connect(port, host, () => {
    const framedMessage = frameMessage(message);
    client.write(framedMessage);
  });

  client.on('data', (chunk) => {
    responseData = Buffer.concat([responseData, chunk]);
    
    // Check if we have the end of MLLP block
    if (responseData.includes(FS) && responseData.includes(CR)) {
      client.destroy(); // Got the ACK, close connection
      
      // Unwrap
      let ackStr = responseData.toString('utf8');
      ackStr = ackStr.replace(/^\x0b/, '').replace(/\x1c\x0d$/, '');
      
      if (!res.headersSent) {
        return res.json({ ack: ackStr });
      }
    }
  });

  client.on('close', () => {
     if (!res.headersSent) {
        // If connection closed without receiving full ACK block
        let ackStr = responseData.toString('utf8');
        ackStr = ackStr.replace(/^\x0b/, '').replace(/\x1c\x0d$/, '');
        res.json({ ack: ackStr || 'Connection closed before ACK received.' });
     }
  });
});

// 2. Start Listener Endpoint
app.post('/api/listen', (req, res) => {
  const { port } = req.body;
  if (!port) return res.status(400).json({ error: 'Port is required' });

  if (activeListeners.has(port)) {
    return res.status(400).json({ error: `Already listening on port ${port}` });
  }

  const listener = net.createServer((socket) => {
    let buffer = Buffer.alloc(0);

    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);

      // Process complete MLLP messages
      let startIndex = buffer.indexOf(VT);
      while (startIndex !== -1) {
        const endIndex = buffer.indexOf(Buffer.concat([FS, CR]), startIndex);
        if (endIndex !== -1) {
          // Extract message
          const msgBuffer = buffer.subarray(startIndex + 1, endIndex);
          const hl7Message = msgBuffer.toString('utf8');
          
          // Generate and send ACK
          const ack = generateAck(hl7Message);
          socket.write(frameMessage(ack));

          // Push to frontend via WebSocket
          io.emit('hl7_received', {
            port,
            message: hl7Message,
            ackSent: ack,
            timestamp: new Date().toISOString()
          });

          // Remove processed message from buffer
          buffer = buffer.subarray(endIndex + 2);
          startIndex = buffer.indexOf(VT);
        } else {
          break; // Wait for more data
        }
      }
    });

    socket.on('error', (err) => {
      console.error(`Socket error on port ${port}:`, err.message);
    });
  });

  listener.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      if (!res.headersSent) {
        res.status(409).json({ error: `Port ${port} is already in use.` });
      } else {
        io.emit('listener_error', { port, error: `Port ${port} is already in use.` });
      }
    } else {
      if (!res.headersSent) {
        res.status(500).json({ error: `Failed to start listener: ${err.message}` });
      } else {
        io.emit('listener_error', { port, error: err.message });
      }
    }
    activeListeners.delete(port);
  });

  listener.listen(port, () => {
    activeListeners.set(port, listener);
    if (!res.headersSent) {
      res.json({ success: true, message: `Started listening on port ${port}` });
    }
    io.emit('listener_status', { port, status: 'listening' });
  });
});

// 3. Stop Listener Endpoint
app.post('/api/stop-listen', (req, res) => {
  const { port } = req.body;
  
  if (!activeListeners.has(port)) {
    return res.status(400).json({ error: `Not listening on port ${port}` });
  }

  const listener = activeListeners.get(port);
  listener.close(() => {
    activeListeners.delete(port);
    res.json({ success: true, message: `Stopped listening on port ${port}` });
    io.emit('listener_status', { port, status: 'stopped' });
  });
});

io.on('connection', (socket) => {
  console.log('Frontend connected:', socket.id);
  
  // Send current active listeners
  socket.emit('active_listeners', Array.from(activeListeners.keys()));

  socket.on('disconnect', () => {
    console.log('Frontend disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`HL7 Backend Server running on port ${PORT}`);
});
