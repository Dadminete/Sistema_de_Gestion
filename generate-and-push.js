// Script to generate Prisma client and push schema to database
const { execSync } = require('child_process');

console.log('🔄 Generating Prisma client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated successfully');
} catch (error) {
  console.error('❌ Error generating Prisma client:', error.message);
  process.exit(1);
}

console.log('🔄 Pushing schema to database...');
try {
  execSync('npx prisma db push', { stdio: 'inherit' });
  console.log('✅ Schema pushed to database successfully');
} catch (error) {
  console.error('❌ Error pushing schema to database:', error.message);
  process.exit(1);
}

console.log('🎉 All operations completed successfully!');
