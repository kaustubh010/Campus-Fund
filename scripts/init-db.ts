import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), '.env.local');

// Check if .env.local exists, if not create it with DATABASE_URL
if (!fs.existsSync(dbPath)) {
  const envContent = 'DATABASE_URL="file:./prisma/dev.db"\n';
  fs.writeFileSync(dbPath, envContent);
  console.log('Created .env.local with DATABASE_URL');
} else {
  const envContent = fs.readFileSync(dbPath, 'utf-8');
  if (!envContent.includes('DATABASE_URL')) {
    fs.appendFileSync(dbPath, '\nDATABASE_URL="file:./prisma/dev.db"\n');
    console.log('Added DATABASE_URL to .env.local');
  }
}

// Run Prisma migrations
console.log('Running Prisma migrations...');
try {
  execSync('prisma migrate dev --name init', { stdio: 'inherit' });
  console.log('Database initialized successfully!');
} catch (error) {
  console.error('Failed to initialize database:', error);
  process.exit(1);
}
