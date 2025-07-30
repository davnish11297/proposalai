#!/usr/bin/env node

/**
 * Follow-up Processor Cron Job
 * 
 * This script should be run periodically (e.g., every hour) to process
 * pending follow-up sequences and send automated emails.
 * 
 * Usage:
 * node scripts/process-followups.js
 * 
 * Or add to crontab:
 * 0 * * * * /path/to/node /path/to/scripts/process-followups.js
 */

const mongoose = require('mongoose');
const path = require('path');
const { config } = require('dotenv');

// Load environment variables
config({ path: path.resolve(__dirname, '../.env.local') });

// Import the follow-up service (this will need to be CommonJS compatible)
async function main() {
  try {
    console.log('🚀 Starting follow-up processor...');
    
    // Connect to MongoDB
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Import and use the follow-up service
    const { FollowUpService } = require('../dist/lib/services/followUpService');
    
    // Process pending follow-ups
    await FollowUpService.processPendingFollowUps();
    console.log('✅ Follow-up processing completed');
    
  } catch (error) {
    console.error('❌ Error processing follow-ups:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔐 Database connection closed');
    process.exit(0);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the main function
main();