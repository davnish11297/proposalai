#!/usr/bin/env node

/**
 * Follow-up Processor Cron Job - Simple Version
 * 
 * This script processes pending follow-ups using direct database queries
 * without requiring the compiled TypeScript service.
 * 
 * Usage:
 * node scripts/process-followups-simple.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Simple follow-up processing without TypeScript dependencies
async function main() {
  try {
    console.log('🚀 Starting simple follow-up processor...');
    
    // Connect to MongoDB
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get models
    const FollowUpExecution = mongoose.model('FollowUpExecution');
    const Proposal = mongoose.model('Proposal');
    
    // Find executions due for processing
    const now = new Date();
    const dueExecutions = await FollowUpExecution.find({
      status: 'ACTIVE',
      nextExecutionAt: { $lte: now },
    }).populate('proposalId sequenceId');

    console.log(`Found ${dueExecutions.length} follow-ups due for processing`);
    
    for (const execution of dueExecutions) {
      console.log(`Processing follow-up for proposal: ${execution.proposalId.title}`);
      
      // Simple processing - just log for now
      // In a real implementation, you'd send emails here
      
      // Mark as completed for now
      execution.status = 'COMPLETED';
      execution.stoppedReason = 'SEQUENCE_COMPLETED';
      execution.stoppedAt = new Date();
      await execution.save();
    }
    
    console.log('✅ Simple follow-up processing completed');
    
  } catch (error) {
    console.error('❌ Error processing follow-ups:', error);
    
    // If models aren't found, it means the app hasn't been built yet
    if (error.message.includes('Cannot overwrite')) {
      console.log('ℹ️  Models not initialized yet. Please run the app first to initialize the database.');
    }
    
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