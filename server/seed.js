import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database file location
const dbFile = join(__dirname, 'db.json');

// Sample data
const seedData = {
  videos: [
    {
      id: 'sample-video-1',
      title: 'Sample Video - Big Buck Bunny',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      duration_ms: 596458, // Approximate duration
      created_at: new Date().toISOString()
    }
  ],
  annotations: []
};

async function seed() {
  try {
    // Create adapter and database instance
    const adapter = new JSONFile(dbFile);
    const db = new Low(adapter, seedData);
    
    // Write seed data
    db.data = seedData;
    await db.write();
    
    console.log('✅ Database seeded successfully!');
    console.log('📹 Sample video added:');
    console.log('   ID:', seedData.videos[0].id);
    console.log('   Title:', seedData.videos[0].title);
    console.log('   URL:', seedData.videos[0].url);
    console.log('\n🚀 You can now start the server and client!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
