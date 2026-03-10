import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db';
import { format } from 'date-fns';
import { Trash, ArrowUpRight, ArrowDownLeft, FileText } from 'lucide-react';

interface LogViewerProps {
  onCopyMessage: (msg: string) => void;
}

export function LogViewer({ onCopyMessage }: LogViewerProps) {
  const logs = useLiveQuery(() => db.logs.orderBy('timestamp').reverse().toArray());

  const clearLogs = async () => {
    if (confirm('Are you sure you want to clear all logs?')) {
      await db.logs.clear();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50/50">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2 text-sm">
          <FileText size={16} className="text-gray-500" />
          Message Logs
        </h3>
        <button onClick={clearLogs} disabled={!logs?.length} className="text-sm flex items-center gap-1 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50">
          <Trash size={14} /> Clear Logs
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {logs?.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <p className="text-sm">No logs available</p>
          </div>
        ) : (
          logs?.map((log) => (
            <div key={log.id} className="border border-gray-200 rounded-md overflow-hidden bg-gray-50 flex flex-col">
              <div className="flex items-center justify-between px-3 py-2 bg-gray-100/50 border-b border-gray-200 text-xs">
                <div className="flex items-center gap-3">
                  {log.type === 'sent' ? (
                    <span className="flex items-center gap-1 text-primary-600 font-medium">
                      <ArrowUpRight size={14} /> Sent to {log.host}:{log.port}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-green-600 font-medium">
                      <ArrowDownLeft size={14} /> Received on port {log.port}
                    </span>
                  )}
                  <span className="text-gray-500">{format(new Date(log.timestamp), 'MMM dd, yyyy hh:mm:ss a')}</span>
                </div>
                <button onClick={() => onCopyMessage(log.message)} className="text-primary-600 hover:underline">
                  Load in Editor
                </button>
              </div>
              <div className="p-3 grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 mb-1">Message</h4>
                  <pre className="text-xs font-mono text-gray-800 bg-white border border-gray-200 p-2 rounded max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {log.message}
                  </pre>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 mb-1">{log.type === 'sent' ? 'Received ACK' : 'Auto-Sent ACK'}</h4>
                  <pre className="text-xs font-mono text-gray-800 bg-white border border-gray-200 p-2 rounded max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {log.ack || 'No ACK received'}
                  </pre>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
