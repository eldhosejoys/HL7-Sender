import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db, { type Host } from '../db';
import { format } from 'date-fns';
import { Trash, ArrowUpRight, ArrowDownLeft, FileText, Maximize2, Minimize2 } from 'lucide-react';

interface LogViewerProps {
  onCopyMessage: (msg: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  selectedHost?: Host | null;
  selectedListener?: { port: number, name: string } | null;
}

export function LogViewer({ onCopyMessage, isExpanded, onToggleExpand, selectedHost, selectedListener }: LogViewerProps) {
  const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all');
  
  const rawLogs = useLiveQuery(() => db.logs.orderBy('timestamp').reverse().toArray());
  
  const allLogs = React.useMemo(() => {
    if (!rawLogs) return [];
    if (!selectedHost && !selectedListener) return rawLogs;
    
    return rawLogs.filter(log => {
      if (selectedHost) {
        return log.type === 'sent' && log.host === selectedHost.host && log.port === selectedHost.port;
      } else if (selectedListener) {
        return log.type === 'received' && log.port === selectedListener.port;
      }
      return true;
    });
  }, [rawLogs, selectedHost, selectedListener]);

  const clearLogs = async () => {
    let msg = 'Are you sure you want to clear all logs?';
    if (selectedHost) msg = 'Are you sure you want to clear all sent logs for this target?';
    else if (selectedListener) msg = 'Are you sure you want to clear all received logs for this listener?';
    else if (filter === 'sent') msg = 'Are you sure you want to clear all sent logs?';
    else if (filter === 'received') msg = 'Are you sure you want to clear all received logs?';

    if (confirm(msg)) {
      if (!selectedHost && !selectedListener && filter === 'all') {
        await db.logs.clear();
      } else {
        const logsToDelete = (!selectedHost && !selectedListener) ? (allLogs?.filter(log => log.type === filter) || []) : allLogs;
        const ids = logsToDelete.map(log => log.id!).filter(Boolean) as number[];
        await db.logs.bulkDelete(ids);
      }
    }
  };

  const allCount = allLogs?.length || 0;
  const receivedCount = allLogs?.filter(log => log.type === 'received').length || 0;
  const sentCount = allLogs?.filter(log => log.type === 'sent').length || 0;

  const logs = allLogs?.filter(log => (selectedHost || selectedListener) ? true : (filter === 'all' || log.type === filter)) || [];

  return (
    <div className="flex flex-col h-auto md:h-full bg-white rounded-lg shadow-sm border border-gray-200 md:overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border-b border-gray-200 bg-gray-50/50 gap-3 sm:gap-0">
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2 text-sm">
              <FileText size={16} className="text-gray-500" />
              Message Logs
            </h3>
            {!selectedHost && !selectedListener ? (
              <div className="flex bg-gray-200/50 p-1 rounded-md">
                <button 
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 text-xs font-medium rounded ${filter === 'all' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  All ({allCount})
                </button>
                <button 
                  onClick={() => setFilter('received')}
                  className={`px-3 py-1 text-xs font-medium rounded ${filter === 'received' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Received ({receivedCount})
                </button>
                <button 
                  onClick={() => setFilter('sent')}
                  className={`px-3 py-1 text-xs font-medium rounded ${filter === 'sent' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Sent ({sentCount})
                </button>
              </div>
            ) : (
              <div className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-md border border-gray-200">
                {selectedHost ? `Sent Logs (${allCount})` : `Received Logs (${allCount})`}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
          {onToggleExpand && (
            <button onClick={onToggleExpand} className="text-sm flex items-center gap-1 text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-2 py-1.5 rounded-md transition-colors">
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          )}
          <button onClick={clearLogs} disabled={!logs?.length} className="text-sm flex items-center gap-1 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50">
            <Trash size={14} /> Clear {selectedHost ? 'Target Logs' : selectedListener ? 'Listener Logs' : filter === 'all' ? 'All Logs' : filter === 'sent' ? 'Sent Logs' : 'Received Logs'}
          </button>
        </div>
      </div>
      <div className="md:flex-1 md:overflow-y-auto p-4 space-y-4">
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
              <div className="p-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 mb-1">Message</h4>
                  <pre className="text-xs font-mono text-gray-800 bg-white border border-gray-200 p-2 rounded max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {log.message.replace(/\r/g, '\n')}
                  </pre>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 mb-1">{log.type === 'sent' ? 'Received ACK' : 'Auto-Sent ACK'}</h4>
                  <pre className="text-xs font-mono text-gray-800 bg-white border border-gray-200 p-2 rounded max-h-40 overflow-y-auto whitespace-pre-wrap break-all">
                    {log.ack ? log.ack.replace(/\r/g, '\n') : 'No ACK received'}
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
