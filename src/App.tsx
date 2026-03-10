import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import db, { type Host } from './db';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { LogViewer } from './components/LogViewer';
import { Activity } from 'lucide-react';

const socket = io(window.location.hostname === 'localhost' ? 'http://localhost:3001' : '/');

function App() {
  const [selectedHost, setSelectedHost] = useState<Host | null>(null);
  const [selectedListener, setSelectedListener] = useState<{ port: number, name: string } | null>(null);
  const [activeListeners, setActiveListeners] = useState<number[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState('');
  const [isLogsExpanded, setIsLogsExpanded] = useState(false);

  // Setup sockets
  useEffect(() => {
    socket.on('active_listeners', (listeners: number[]) => {
      setActiveListeners(listeners);
    });

    socket.on('listener_status', ({ port, status }) => {
      if (status === 'listening') {
        setActiveListeners(prev => Array.from(new Set([...prev, port])));
      } else {
        setActiveListeners(prev => prev.filter(p => p !== port));
      }
    });

    socket.on('hl7_received', async (data) => {
      // Save to logs
      await db.logs.add({
        type: 'received',
        timestamp: data.timestamp,
        port: data.port,
        message: data.message,
        ack: data.ackSent
      });
    });

    return () => {
      socket.off('active_listeners');
      socket.off('listener_status');
      socket.off('hl7_received');
    };
  }, []);

  const handleSend = async (message: string) => {
    if (!selectedHost) return;
    setIsSending(true);
    
    try {
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: selectedHost.host,
          port: selectedHost.port,
          message
        })
      });

      const data = await response.json();
      
      await db.logs.add({
        type: 'sent',
        timestamp: new Date().toISOString(),
        host: selectedHost.host,
        port: selectedHost.port,
        message,
        ack: data.ack || data.error || 'Failed to get valid ACK'
      });
      
    } catch (err: any) {
      await db.logs.add({
        type: 'sent',
        timestamp: new Date().toISOString(),
        host: selectedHost.host,
        port: selectedHost.port,
        message,
        ack: `Connection error: ${err.message}`
      });
    } finally {
      setIsSending(false);
    }
  };

  const startListener = async (port: number) => {
    try {
      const response = await fetch('/api/listen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port })
      });
      
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Failed to start listener on this port.');
      }
    } catch (err: any) {
      alert(`Network error starting listener: ${err.message}`);
    }
  };

  const stopListener = async (port: number) => {
    await fetch('/api/stop-listen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ port })
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-900 font-sans">
      <Sidebar 
        selectedHost={selectedHost}
        selectedListener={selectedListener}
        onSelectHost={(host) => {
          setSelectedHost(host);
          setSelectedListener(null);
        }} 
        onSelectListener={(listener) => {
          setSelectedListener({ port: listener.port, name: listener.name });
          setSelectedHost(null);
        }}
        activeListeners={activeListeners}
        onStartListener={startListener}
        onStopListener={stopListener}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-2 text-primary-600 font-semibold text-lg">
            <Activity size={24} />
            HL7 Studio Platform
          </div>
          {selectedHost ? (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Selected Target: 
              <span className="font-semibold text-gray-800">{selectedHost.name}</span> 
              ({selectedHost.host}:{selectedHost.port})
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">No Target Selected</div>
          )}
          
          {selectedListener ? (
            <div className="flex items-center gap-2 text-sm text-gray-600 ml-4 border-l border-gray-200 pl-4">
              <span className={`w-2 h-2 rounded-full ${activeListeners.includes(selectedListener.port) ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              Selected Listener: 
              <span className="font-semibold text-gray-800">{selectedListener.name}</span> 
              (Port: {selectedListener.port})
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic ml-4 border-l border-gray-200 pl-4">No Listener Selected</div>
          )}
        </header>
        
        <main className={`flex-1 p-4 ${isLogsExpanded || selectedListener ? 'flex flex-col' : 'grid grid-rows-2'} gap-4 overflow-hidden`}>
          {(!isLogsExpanded && !selectedListener) && (
            <Editor 
              onSend={handleSend} 
              isSending={isSending} 
              initialMessage={copiedMessage}
              hostSelected={!!selectedHost}
            />
          )}
          <LogViewer 
            onCopyMessage={(msg) => setCopiedMessage(msg)} 
            isExpanded={isLogsExpanded || !!selectedListener}
            onToggleExpand={selectedListener ? undefined : () => setIsLogsExpanded(!isLogsExpanded)}
            selectedHost={selectedHost}
            selectedListener={selectedListener}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
