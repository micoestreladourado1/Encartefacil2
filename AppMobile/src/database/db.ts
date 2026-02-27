import * as SQLite from 'expo-sqlite';

// Definimos o nome base de dados
export const dbName = 'encartes.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

// Função para obter conexão com banco de dados (Singleton)
export const getDb = () => {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync(dbName);
  }
  return dbInstance;
};

// Função para criar tabelas iniciais
export const initDb = () => {
  const db = getDb();

  // Sincronizando esquema para garantir que 'data' existe na tabela flyers
  // e limpando tabelas antigas se necessário para evitar conflitos de migração manual
  db.execSync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS flyers (
      id INTEGER PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      data TEXT NOT NULL
    );
  `);

  console.log('SQLite Schema initialized successfully');
};
