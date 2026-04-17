import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let dbInstance = null;

async function initDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  const SQL = await initSqlJs();
  
  const dbPath = process.env.DATABASE_PATH || './data/database.sqlite';
  
  // Ensure data directory exists
  const dataDir = dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Load existing database or create new one
  let db;
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
    
    // Read and execute schema
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema in transactions
    db.run('BEGIN TRANSACTION');
    try {
      // Split by semicolons and execute each statement
      const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
      for (const statement of statements) {
        if (statement.trim()) {
          db.run(statement);
        }
      }
      db.run('COMMIT');
      
      // Save initial database
      saveDatabase(db);
      console.log('✓ Database initialized with schema');
    } catch (error) {
      db.run('ROLLBACK');
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  dbInstance = db;
  return db;
}

function saveDatabase(db) {
  const dbPath = process.env.DATABASE_PATH || './data/database.sqlite';
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

// Auto-save on close
process.on('exit', () => {
  if (dbInstance) {
    saveDatabase(dbInstance);
    dbInstance.close();
  }
});

// Save database periodically (every 5 minutes)
setInterval(() => {
  if (dbInstance) {
    saveDatabase(dbInstance);
  }
}, 5 * 60 * 1000);

export default initDatabase;
