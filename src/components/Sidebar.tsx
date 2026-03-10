import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db, { type Host, type Listener } from '../db';
import { Plus, Trash2, Server, Radio, Play, Square, Edit2, X, Check } from 'lucide-react';

interface SidebarProps {
  onSelectHost: (host: Host) => void;
  activeListeners: number[];
  onStartListener: (port: number) => void;
  onStopListener: (port: number) => void;
}

export function Sidebar({ onSelectHost, activeListeners, onStartListener, onStopListener }: SidebarProps) {
  const hosts = useLiveQuery(() => db.hosts.toArray());
  const listeners = useLiveQuery(() => db.listeners.toArray());

  // Host state
  const [newHostName, setNewHostName] = useState('');
  const [newHostIP, setNewHostIP] = useState('');
  const [newHostPort, setNewHostPort] = useState('');
  
  const [editingHostId, setEditingHostId] = useState<number | null>(null);
  const [editHostName, setEditHostName] = useState('');
  const [editHostIP, setEditHostIP] = useState('');
  const [editHostPort, setEditHostPort] = useState('');

  // Listener state
  const [newListenerName, setNewListenerName] = useState('');
  const [newListenerPort, setNewListenerPort] = useState('');

  const [editingListenerId, setEditingListenerId] = useState<number | null>(null);
  const [editListenerName, setEditListenerName] = useState('');
  const [editListenerPort, setEditListenerPort] = useState('');

  // --- Host Operations ---
  const addHost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHostName || !newHostIP || !newHostPort) return;
    await db.hosts.add({
      name: newHostName,
      host: newHostIP,
      port: parseInt(newHostPort, 10),
    });
    setNewHostName('');
    setNewHostIP('');
    setNewHostPort('');
  };

  const deleteHost = async (id?: number) => {
    if (id) await db.hosts.delete(id);
  };

  const startEditHost = (host: Host) => {
    setEditingHostId(host.id!);
    setEditHostName(host.name);
    setEditHostIP(host.host);
    setEditHostPort(host.port.toString());
  };

  const cancelEditHost = () => {
    setEditingHostId(null);
  };

  const saveHost = async (id: number) => {
    if (!editHostName || !editHostIP || !editHostPort) return;
    await db.hosts.update(id, {
      name: editHostName,
      host: editHostIP,
      port: parseInt(editHostPort, 10),
    });
    setEditingHostId(null);
  };

  // --- Listener Operations ---
  const addListener = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListenerName || !newListenerPort) return;
    await db.listeners.add({
      name: newListenerName,
      port: parseInt(newListenerPort, 10),
    });
    setNewListenerName('');
    setNewListenerPort('');
  };

  const deleteListener = async (id?: number) => {
    if (id) await db.listeners.delete(id);
  };

  const startEditListener = (listener: Listener) => {
    setEditingListenerId(listener.id!);
    setEditListenerName(listener.name);
    setEditListenerPort(listener.port.toString());
  };

  const cancelEditListener = () => {
    setEditingListenerId(null);
  };

  const saveListener = async (id: number, active: boolean, oldPort: number) => {
    if (!editListenerName || !editListenerPort) return;
    const newPort = parseInt(editListenerPort, 10);
    
    // Stop it if it's currently active on the old port before switching to the new one
    if (active && oldPort !== newPort) {
      onStopListener(oldPort);
    }
    
    await db.listeners.update(id, {
      name: editListenerName,
      port: newPort,
    });
    setEditingListenerId(null);
  };

  return (
    <div className="w-80 h-full bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
      {/* Senders Section */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <Server size={20} className="text-primary-600" />
          Saved Targets (Send)
        </h2>
        <form onSubmit={addHost} className="space-y-2 mb-4">
          <input type="text" placeholder="Name (e.g., Local PACS)" value={newHostName} onChange={e => setNewHostName(e.target.value)} className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" required />
          <div className="flex gap-2">
            <input type="text" placeholder="Host (IP)" value={newHostIP} onChange={e => setNewHostIP(e.target.value)} className="w-2/3 text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" required />
            <input type="number" placeholder="Port" value={newHostPort} onChange={e => setNewHostPort(e.target.value)} className="w-1/3 text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" required />
          </div>
          <button type="submit" className="w-full flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded-md text-sm font-medium transition-colors">
            <Plus size={16} /> Add Target
          </button>
        </form>
        <ul className="space-y-2">
          {hosts?.map((host) => (
            <li key={host.id} className="flex flex-col p-2 rounded-md hover:bg-gray-50 border border-transparent hover:border-gray-200 cursor-pointer group" onClick={() => editingHostId !== host.id && onSelectHost(host)}>
              {editingHostId === host.id ? (
                <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                  <input type="text" value={editHostName} onChange={e => setEditHostName(e.target.value)} className="w-full text-sm px-2 py-1 border border-gray-300 rounded-md" placeholder="Name" required />
                  <div className="flex gap-2">
                    <input type="text" value={editHostIP} onChange={e => setEditHostIP(e.target.value)} className="w-2/3 text-sm px-2 py-1 border border-gray-300 rounded-md" placeholder="Host" required />
                    <input type="number" value={editHostPort} onChange={e => setEditHostPort(e.target.value)} className="w-1/3 text-sm px-2 py-1 border border-gray-300 rounded-md" placeholder="Port" required />
                  </div>
                  <div className="flex justify-end gap-1 mt-1">
                    <button onClick={cancelEditHost} className="text-gray-500 hover:text-gray-700 p-1 rounded-md transition-colors"><X size={14} /></button>
                    <button onClick={() => saveHost(host.id!)} className="text-green-600 hover:text-green-700 p-1 rounded-md transition-colors"><Check size={14} /></button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-gray-800">{host.name}</p>
                    <p className="text-xs text-gray-500">{host.host}:{host.port}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); startEditHost(host); }} className="text-gray-400 hover:text-primary-600 p-1 transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteHost(host.id); }} className="text-gray-400 hover:text-red-500 p-1 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Listeners Section */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <Radio size={20} className="text-green-600" />
          Local Listeners (Receive)
        </h2>
        <form onSubmit={addListener} className="space-y-2 mb-4">
          <input type="text" placeholder="Name (e.g., ORM Listener)" value={newListenerName} onChange={e => setNewListenerName(e.target.value)} className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" required />
          <input type="number" placeholder="Local Port" value={newListenerPort} onChange={e => setNewListenerPort(e.target.value)} className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" required />
          <button type="submit" className="w-full flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded-md text-sm font-medium transition-colors">
            <Plus size={16} /> Add Listener
          </button>
        </form>
        <ul className="space-y-2">
          {listeners?.map((listener) => {
            const isActive = activeListeners.includes(listener.port);
            return (
              <li key={listener.id} className="flex flex-col p-2 rounded-md bg-gray-50 border border-gray-200 group">
                {editingListenerId === listener.id ? (
                   <div className="flex flex-col gap-2">
                     <input type="text" value={editListenerName} onChange={e => setEditListenerName(e.target.value)} className="w-full text-sm px-2 py-1 border border-gray-300 rounded-md" placeholder="Name" required />
                     <input type="number" value={editListenerPort} onChange={e => setEditListenerPort(e.target.value)} className="w-full text-sm px-2 py-1 border border-gray-300 rounded-md" placeholder="Port" required />
                     <div className="flex justify-end gap-1 mt-1">
                       <button onClick={cancelEditListener} className="text-gray-500 hover:text-gray-700 p-1 rounded-md transition-colors"><X size={14} /></button>
                       <button onClick={() => saveListener(listener.id!, isActive, listener.port)} className="text-green-600 hover:text-green-700 p-1 rounded-md transition-colors"><Check size={14} /></button>
                     </div>
                   </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm text-gray-800">{listener.name}</p>
                        <p className="text-xs text-gray-500">Port: {listener.port}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isActive ? (
                          <button onClick={() => onStopListener(listener.port)} className="text-red-600 hover:text-red-700 bg-red-100 hover:bg-red-200 p-1.5 rounded-md transition-colors" title="Stop Listening">
                            <Square size={16} />
                          </button>
                        ) : (
                          <button onClick={() => onStartListener(listener.port)} className="text-green-600 hover:text-green-700 bg-green-100 hover:bg-green-200 p-1.5 rounded-md transition-colors" title="Start Listening">
                            <Play size={16} />
                          </button>
                        )}
                        <span className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1 ml-1">
                          <button onClick={() => startEditListener(listener)} className="text-gray-400 hover:text-primary-600 p-1.5 rounded-md transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => deleteListener(listener.id)} disabled={isActive} className={`p-1.5 rounded-md transition-colors ${isActive ? 'text-gray-300' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}>
                            <Trash2 size={14} />
                          </button>
                        </span>
                      </div>
                    </div>
                    {isActive && (
                      <div className="flex items-center gap-2 text-xs text-green-600 mt-1">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Listening...
                      </div>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

