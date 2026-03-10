import Dexie, { type EntityTable } from 'dexie';

export interface Host {
  id?: number;
  name: string;
  host: string;
  port: number;
}

export interface Listener {
  id?: number;
  name: string;
  port: number;
}

export interface Log {
  id?: number;
  type: 'sent' | 'received';
  timestamp: string;
  host?: string; // Only for 'sent' type
  port: number;
  message: string;
  ack: string;
}

export interface SavedMessage {
  id?: number;
  name: string;
  content: string;
  timestamp: string;
}

const db = new Dexie('HL7SenderDB') as Dexie & {
  hosts: EntityTable<Host, 'id'>,
  listeners: EntityTable<Listener, 'id'>,
  logs: EntityTable<Log, 'id'>,
  savedMessages: EntityTable<SavedMessage, 'id'>
};

// Auto-upgrade database schema by just incrementing the version
db.version(2).stores({
  hosts: '++id, name, host, port',
  listeners: '++id, name, port',
  logs: '++id, type, timestamp, port',
  savedMessages: '++id, name, timestamp'
});

export default db;
