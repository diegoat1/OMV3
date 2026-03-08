// Mock Data Initialization Script
// Run this to set up mock data for testing
import { initializeMockSystem, populateMockData, resetMockData, mockDatabase } from '../src/core/mock-data';

const args = process.argv.slice(2);
const command = args[0] || 'populate';
const count = parseInt(args[1]) || 50;

async function main() {
  try {
    console.log('🚀 Mock Data Management Script');
    console.log('================================');

    switch (command) {
      case 'init':
        console.log('📦 Initializing mock database...');
        await initializeMockSystem();
        console.log('✅ Mock database initialized successfully');
        break;

      case 'populate':
        console.log(`📝 Populating mock data with ${count} users...`);
        await initializeMockSystem();
        await populateMockData(count);
        console.log(`✅ Mock data populated with ${count} users`);

        // Verify data was created
        const users = await mockDatabase.getUsers(5);
        console.log(`📊 Sample users created: ${users.length}`);
        if (users.length > 0) {
          console.log(`👤 First user: ${users[0].nombre_apellido} (${users[0].email})`);
        }
        break;

      case 'reset':
        console.log('🗑️ Resetting mock data...');
        await resetMockData();
        console.log('✅ Mock data cleared');
        break;

      case 'stats':
        console.log('📊 Getting mock data statistics...');
        await initializeMockSystem();
        const allUsers = await mockDatabase.getUsers(1000);
        console.log(`📈 Total users: ${allUsers.length}`);

        if (allUsers.length > 0) {
          const roles = allUsers.reduce((acc, user) => {
            acc[user.rol] = (acc[user.rol] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          console.log('👥 Users by role:', roles);

          // Get measurements for first user
          const measurements = await mockDatabase.getUserMeasurements(allUsers[0].id);
          console.log(`📏 Measurements for ${allUsers[0].nombre_apellido}: ${measurements.length} records`);
        }
        break;

      default:
        console.log('❓ Usage:');
        console.log('  npm run mock:init      - Initialize mock database');
        console.log('  npm run mock:populate  - Populate with mock data (default 50 users)');
        console.log('  npm run mock:reset     - Clear all mock data');
        console.log('  npm run mock:stats     - Show mock data statistics');
        console.log('  node scripts/mock-data.js <command> [count]');
        break;
    }

    console.log('================================');
    console.log('✨ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
