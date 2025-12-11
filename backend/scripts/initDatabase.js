const pool = require('../config/database');

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database initialization...');
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Users table created');
    
    // Create links table
    await client.query(`
      CREATE TABLE IF NOT EXISTS links (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Links table created');
    
    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);
      CREATE INDEX IF NOT EXISTS idx_links_category ON links(category);
      CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at DESC);
    `);
    console.log('✅ Indexes created');
    
    // Create updated_at trigger function
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    
    // Create triggers for updated_at
    await client.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      
      DROP TRIGGER IF EXISTS update_links_updated_at ON links;
      CREATE TRIGGER update_links_updated_at
        BEFORE UPDATE ON links
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✅ Triggers created');
    
    console.log('🎉 Database initialization completed successfully!');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

createTables();
