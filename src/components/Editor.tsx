import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db';
import { Send, Copy, Trash, Braces, Save, FolderOpen, X } from 'lucide-react';

interface EditorProps {
  onSend: (message: string) => void;
  isSending: boolean;
  message: string;
  onMessageChange: (msg: string) => void;
  hostSelected: boolean;
}

export function Editor({ onSend, isSending, message, onMessageChange, hostSelected }: EditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showLoadMenu, setShowLoadMenu] = useState(false);

  const savedMessages = useLiveQuery(() => db.savedMessages.orderBy('timestamp').reverse().toArray());

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const handleClear = () => {
    onMessageChange('');
  };

  const handleSaveMessage = async () => {
    if (!message || !saveName) return;
    await db.savedMessages.add({
      name: saveName,
      content: message,
      timestamp: new Date().toISOString()
    });
    setSaveName('');
    setIsSaving(false);
  };
  
  const handleLoadMessage = (content: string) => {
    onMessageChange(content);
    setShowLoadMenu(false);
  };

  const deleteSavedMessage = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await db.savedMessages.delete(id);
  };

  return (
    <div className="flex flex-col h-auto md:h-full bg-white rounded-lg shadow-sm border border-gray-200 md:overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border-b border-gray-200 bg-gray-50/50 gap-3 sm:gap-0">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2 text-sm whitespace-nowrap">
          <Braces size={16} className="text-primary-600" />
          HL7 Message Editor
        </h3>
        
        {isSaving ? (
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              placeholder="Template name..." 
              value={saveName} 
              onChange={e => setSaveName(e.target.value)}
              className="text-sm px-2 py-1 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-primary-500 w-40"
              autoFocus
            />
            <button onClick={handleSaveMessage} disabled={!saveName} className="text-xs bg-primary-600 hover:bg-primary-700 text-white px-2 py-1 rounded transition-colors disabled:opacity-50">Save</button>
            <button onClick={() => setIsSaving(false)} className="text-xs text-gray-500 hover:text-gray-700 px-1"><X size={16} /></button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
            <div className="relative">
              <button onClick={() => setShowLoadMenu(!showLoadMenu)} className="flex items-center gap-1 text-gray-600 hover:text-primary-600 text-xs font-medium px-2 py-1.5 rounded-md hover:bg-primary-50 transition-colors" title="Load Template">
                <FolderOpen size={14} /> Load
              </button>
              
              {showLoadMenu && (
                <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 shadow-lg rounded-md overflow-hidden z-20">
                  <div className="max-h-60 overflow-y-auto">
                    {savedMessages?.length === 0 ? (
                      <div className="p-3 text-xs text-gray-500 text-center">No saved templates</div>
                    ) : (
                      savedMessages?.map(msg => (
                        <div key={msg.id} onClick={() => handleLoadMessage(msg.content)} className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 group">
                          <span className="truncate flex-1 font-medium">{msg.name}</span>
                          <button onClick={(e) => deleteSavedMessage(msg.id!, e)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1">
                            <Trash size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => setIsSaving(true)} disabled={!message} className="flex items-center gap-1 text-gray-600 hover:text-primary-600 text-xs font-medium px-2 py-1.5 rounded-md hover:bg-primary-50 transition-colors disabled:opacity-50" title="Save as Template">
              <Save size={14} /> Save
            </button>
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
            <button onClick={handleCopy} disabled={!message} className="text-gray-500 hover:text-primary-600 p-1.5 rounded-md hover:bg-primary-50 transition-colors disabled:opacity-50" title="Copy Message">
              <Copy size={16} />
            </button>
            <button onClick={handleClear} disabled={!message} className="text-gray-500 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50" title="Clear Editor">
              <Trash size={16} />
            </button>
            <button 
              onClick={() => onSend(message)} 
              disabled={!message || !hostSelected || isSending} 
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-1"
            >
              {isSending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send size={16} />
              )}
              Send
            </button>
          </div>
        )}
      </div>
      <div className="flex-1 p-0 relative">
        {showLoadMenu && <div className="absolute inset-0 z-10" onClick={() => setShowLoadMenu(false)}></div>}
        <textarea
          className="w-full min-h-[300px] md:h-full p-4 resize-none outline-none font-mono text-sm text-gray-800 whitespace-pre scrollbar-thin scrollbar-thumb-gray-300 relative z-0"
          placeholder="Paste your raw HL7 message here...&#10;MSH|^~\&|SENDING_APP|SENDING_FAC|REC_APP|REC_FAC|20230101120000||ADT^A01|MSG00001|P|2.3&#10;EVN|A01|20230101120000&#10;..."
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
