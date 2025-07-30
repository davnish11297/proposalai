#!/usr/bin/env node

// Debug and Setup Script for ProposalAI Next.js
console.log('🔍 ProposalAI Setup & Debug Checker\n');

// Check Node.js version
const nodeVersion = process.version;
console.log(`📦 Node.js Version: ${nodeVersion}`);
if (nodeVersion.startsWith('v22')) {
  console.log('✅ Node.js 22 - Perfect!\n');
} else if (parseInt(nodeVersion.slice(1)) >= 18) {
  console.log('✅ Node.js version supported\n');
} else {
  console.log('❌ Node.js version too old. Need 18+\n');
}

// Check environment variables
console.log('🔧 Environment Variables:');
const requiredVars = [
  'MONGODB_URI_DEV',
  'OPENROUTER_API_KEY', 
  'JWT_SECRET',
  'NEXTAUTH_SECRET'
];

const optionalVars = [
  'SENDGRID_API_KEY',
  'EMAIL_FROM'
];

let allRequired = true;

requiredVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}: ${process.env[varName].substring(0, 10)}...`);
  } else {
    console.log(`❌ ${varName}: Missing`);
    allRequired = false;
  }
});

optionalVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}: ${process.env[varName].substring(0, 10)}...`);
  } else {
    console.log(`⚠️  ${varName}: Optional (not set)`);
  }
});

console.log('\n📋 Next Steps:');

if (!allRequired) {
  console.log('❌ Missing required environment variables');
  console.log('   Please check your .env.local file');
} else {
  console.log('✅ All required environment variables present');
}

console.log('\n🚀 Quick Commands:');
console.log('   npm run dev     - Start development server');
console.log('   npm run build   - Build for production');
console.log('   npm run lint    - Check code quality');

console.log('\n🔗 Debug URLs (after starting dev server):');
console.log('   http://localhost:3000           - Main app');
console.log('   http://localhost:3000/api/debug - Environment check');
console.log('   http://localhost:3000/api/test  - Auth test');

console.log('\n✨ Ready to start development!');
