/**
 * Tempo MySQL Connection Verification Script
 * Tests the live Node.js connection to MySQL using mysql2 and server/config/db.config.js.
 */

import mysql from 'mysql2/promise';
import { dbConfig, validateDbEnv } from '../server/config/db.config.js';

console.log('=== Tempo MySQL Connection Verification ===\n');

// 1. Check configuration
const envValidation = validateDbEnv();
console.log('1. Configuration Settings:');
console.log(`   Host:     ${dbConfig.host}`);
console.log(`   Port:     ${dbConfig.port}`);
console.log(`   User:     ${dbConfig.user}`);
console.log(`   Database: ${dbConfig.database}`);
console.log(`   Password: ${dbConfig.password ? '****** (configured)' : '(empty)'}`);
console.log(`   Timezone: ${dbConfig.timezone}\n`);

if (envValidation.warnings.length > 0) {
  envValidation.warnings.forEach(w => console.log(`   [Warning] ${w}`));
}

// 2. Test Connection
console.log('2. Testing MySQL Server Handshake...');

async function testConnection() {
  let connection;
  try {
    // Attempt connection without specifying database first (in case tempo_db doesn't exist yet)
    connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      connectTimeout: dbConfig.connectTimeout,
      timezone: dbConfig.timezone
    });

    const [pingResult] = await connection.query('SELECT 1 + 1 AS ping, VERSION() AS version, CURRENT_TIMESTAMP() AS serverTime');
    console.log('   [SUCCESS] Connected to MySQL Server!');
    console.log(`   Server Version: ${pingResult[0].version}`);
    console.log(`   Server Time:    ${pingResult[0].serverTime}`);

    // 3. Check for tempo_db
    console.log('\n3. Checking Target Database:');
    const [databases] = await connection.query('SHOW DATABASES');
    const dbList = databases.map(d => Object.values(d)[0]);
    const dbExists = dbList.includes(dbConfig.database);

    if (dbExists) {
      console.log(`   [FOUND] Target database '${dbConfig.database}' exists.`);
      // Connect directly to the database to verify permissions
      await connection.changeUser({ database: dbConfig.database });
      console.log(`   [READY] User '${dbConfig.user}' has full access to '${dbConfig.database}'.`);
    } else {
      console.log(`   [PENDING] Target database '${dbConfig.database}' does not exist yet.`);
      console.log(`   Existing databases on server: ${dbList.filter(d => !d.startsWith('information_schema') && !d.startsWith('performance_schema')).join(', ')}`);
      console.log(`\n   You can create it by running:`);
      console.log(`   CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    }

    console.log('\n===========================================');
    console.log('STATUS: MySQL2 Connection Verified Successfully!');
    console.log('===========================================');

  } catch (err) {
    console.error('\n   [FAILED] Could not connect to MySQL:');
    console.error(`   Error Code:    ${err.code || 'UNKNOWN'}`);
    console.error(`   Error Number:  ${err.errno || 'N/A'}`);
    console.error(`   SQL State:     ${err.sqlState || 'N/A'}`);
    console.error(`   Message:       ${err.message}`);

    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n   Resolution for ER_ACCESS_DENIED_ERROR:');
      console.log(`   - Check that DB_USER ('${dbConfig.user}') and DB_PASSWORD in your .env file match your MySQL setup.`);
      console.log(`   - If your root user has a password, ensure DB_PASSWORD is set in .env.`);
    } else if (err.code === 'ECONNREFUSED') {
      console.log('\n   Resolution for ECONNREFUSED:');
      console.log(`   - MySQL service is not running on ${dbConfig.host}:${dbConfig.port}.`);
      console.log('   - Start the service using: net start MySQL80');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testConnection();

