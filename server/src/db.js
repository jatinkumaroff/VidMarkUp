import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database file location
const dbFile = join(__dirname, '..', 'db.json');

// Initialize database with default structure
const defaultData = {
  videos: [],
  annotations: []
};

// Create adapter and database instance
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, defaultData);

// Read data from JSON file, this will set db.data content
await db.read();

// If file doesn't exist or is empty, write default data
if (!db.data) {
  db.data = defaultData;
  await db.write();
}

export default db;
