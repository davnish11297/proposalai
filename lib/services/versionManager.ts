import crypto from 'crypto';
import Proposal from '@/models/Proposal';

interface VersionSnapshot {
  version: number;
  content: string;
  title?: string;
  description?: string;
  changes: string;
  changeType: 'created' | 'content_edit' | 'minor_edit' | 'major_edit' | 'pre_send';
  createdBy: string;
  wordCount: number;
  characterCount: number;
}

interface SendVersionData {
  proposalId: string;
  sentTo: string;
  clientName: string;
  subject?: string;
  emailMessage?: string;
  sentBy: string;
  sendMethod?: 'EMAIL' | 'LINK' | 'DOWNLOAD';
}

export class VersionManager {
  /**
   * Generate content hash to detect changes
   */
  static generateContentHash(content: string): string {
    return crypto.createHash('md5').update(content.trim()).digest('hex');
  }

  /**
   * Calculate word and character counts
   */
  static getContentStats(content: string) {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    return {
      wordCount: words.length,
      characterCount: content.length
    };
  }

  /**
   * Detect what changed between versions
   */
  static detectChanges(oldContent: string, newContent: string): string {
    const oldStats = this.getContentStats(oldContent);
    const newStats = this.getContentStats(newContent);
    
    const wordDiff = newStats.wordCount - oldStats.wordCount;
    const charDiff = newStats.characterCount - oldStats.characterCount;
    
    if (Math.abs(wordDiff) < 10 && Math.abs(charDiff) < 50) {
      return 'Minor text edits';
    }
    
    if (wordDiff > 0) {
      return `Added ${wordDiff} words, expanded content`;
    } else if (wordDiff < 0) {
      return `Removed ${Math.abs(wordDiff)} words, condensed content`;
    }
    
    return 'Content updated';
  }

  /**
   * Check if content has actually changed
   */
  static async hasContentChanged(proposalId: string, newContent: string): Promise<boolean> {
    try {
      const proposal = await Proposal.findById(proposalId);
      if (!proposal) return true;

      const newHash = this.generateContentHash(newContent);
      const currentHash = proposal.lastContentHash;

      return newHash !== currentHash;
    } catch (error) {
      console.error('Error checking content changes:', error);
      return true; // Assume changed if error
    }
  }

  /**
   * Create a new version snapshot (only if content changed)
   */
  static async createVersionSnapshot(
    proposalId: string,
    content: string,
    title: string,
    description: string,
    userId: string,
    changeType: VersionSnapshot['changeType'] = 'content_edit'
  ): Promise<number> {
    try {
      const proposal = await Proposal.findById(proposalId);
      if (!proposal) {
        throw new Error('Proposal not found');
      }

      // Check if content actually changed
      const newHash = this.generateContentHash(content);
      const hasChanged = newHash !== proposal.lastContentHash;

      if (!hasChanged && changeType !== 'created') {
        console.log('No content changes detected, keeping current version');
        return proposal.version;
      }

      // Create new version
      const newVersion = proposal.version + 1;
      const stats = this.getContentStats(content);
      
      // Detect changes if there's a previous version
      let changes = 'Initial version';
      if (proposal.versionSnapshots && proposal.versionSnapshots.length > 0) {
        const lastSnapshot = proposal.versionSnapshots[proposal.versionSnapshots.length - 1];
        changes = this.detectChanges(lastSnapshot.content, content);
      }

      const snapshot: VersionSnapshot = {
        version: newVersion,
        content,
        title,
        description,
        changes,
        changeType,
        createdBy: userId,
        wordCount: stats.wordCount,
        characterCount: stats.characterCount,
      };

      // Update proposal
      await Proposal.findByIdAndUpdate(proposalId, {
        version: newVersion,
        content, // Update current content
        title,
        description,
        lastContentHash: newHash,
        hasUnsavedChanges: false,
        $push: {
          versionSnapshots: snapshot
        },
        updatedAt: new Date()
      });

      console.log(`Created version ${newVersion} for proposal ${proposalId}`);
      return newVersion;

    } catch (error) {
      console.error('Error creating version snapshot:', error);
      throw error;
    }
  }

  /**
   * Send a proposal and lock the version
   */
  static async sendProposalVersion(sendData: SendVersionData): Promise<any> {
    try {
      const proposal = await Proposal.findById(sendData.proposalId);
      if (!proposal) {
        throw new Error('Proposal not found');
      }

      // Get current version content
      const currentVersion = proposal.version;
      const currentSnapshot = proposal.versionSnapshots?.find(
        snap => snap.version === currentVersion
      );

      if (!currentSnapshot) {
        throw new Error('No version snapshot found for current version');
      }

      // Create send record with immutable version data
      const sendRecord = {
        sendId: new (require('mongoose')).Types.ObjectId().toString(),
        version: currentVersion,
        versionSnapshot: {
          content: currentSnapshot.content,
          title: currentSnapshot.title || proposal.title,
          description: currentSnapshot.description || proposal.description,
          wordCount: currentSnapshot.wordCount,
          snapshotTakenAt: new Date()
        },
        sentAt: new Date(),
        sentTo: sendData.sentTo,
        clientName: sendData.clientName,
        subject: sendData.subject,
        emailMessage: sendData.emailMessage,
        status: 'SENT',
        sentBy: sendData.sentBy,
        sendMethod: sendData.sendMethod || 'EMAIL',
        isVersionLocked: true
      };

      // Update proposal
      await Proposal.findByIdAndUpdate(sendData.proposalId, {
        $push: {
          sendHistory: sendRecord
        },
        // Mark version snapshot as sent and locked
        $set: {
          'versionSnapshots.$[elem].isSent': true,
          'versionSnapshots.$[elem].isLocked': true,
          'versionSnapshots.$[elem].sentCount': (currentSnapshot.sentCount || 0) + 1
        }
      }, {
        arrayFilters: [{ 'elem.version': currentVersion }]
      });

      console.log(`Sent proposal ${sendData.proposalId} version ${currentVersion} to ${sendData.sentTo}`);
      return sendRecord;

    } catch (error) {
      console.error('Error sending proposal version:', error);
      throw error;
    }
  }

  /**
   * Get version snapshot content
   */
  static async getVersionContent(proposalId: string, version: number): Promise<any> {
    try {
      const proposal = await Proposal.findById(proposalId);
      if (!proposal) {
        throw new Error('Proposal not found');
      }

      const snapshot = proposal.versionSnapshots?.find(
        snap => snap.version === version
      );

      if (!snapshot) {
        throw new Error(`Version ${version} not found`);
      }

      return {
        version: snapshot.version,
        content: snapshot.content,
        title: snapshot.title,
        description: snapshot.description,
        changes: snapshot.changes,
        changeType: snapshot.changeType,
        createdAt: snapshot.createdAt,
        wordCount: snapshot.wordCount,
        characterCount: snapshot.characterCount,
        isSent: snapshot.isSent,
        sentCount: snapshot.sentCount,
        isLocked: snapshot.isLocked
      };

    } catch (error) {
      console.error('Error getting version content:', error);
      throw error;
    }
  }

  /**
   * Get all versions for a proposal
   */
  static async getVersionHistory(proposalId: string): Promise<any[]> {
    try {
      const proposal = await Proposal.findById(proposalId).populate('versionSnapshots.createdBy', 'firstName lastName');
      if (!proposal) {
        throw new Error('Proposal not found');
      }

      return (proposal.versionSnapshots || []).map(snapshot => ({
        version: snapshot.version,
        changes: snapshot.changes,
        changeType: snapshot.changeType,
        createdAt: snapshot.createdAt,
        createdBy: snapshot.createdBy,
        wordCount: snapshot.wordCount,
        characterCount: snapshot.characterCount,
        isSent: snapshot.isSent,
        sentCount: snapshot.sentCount,
        isLocked: snapshot.isLocked
      })).sort((a, b) => b.version - a.version); // Newest first

    } catch (error) {
      console.error('Error getting version history:', error);
      throw error;
    }
  }

  /**
   * Get send history with version details
   */
  static async getEnhancedSendHistory(proposalId: string): Promise<any[]> {
    try {
      const proposal = await Proposal.findById(proposalId)
        .populate('sendHistory.sentBy', 'firstName lastName');
      
      if (!proposal) {
        throw new Error('Proposal not found');
      }

      return (proposal.sendHistory || []).map(send => ({
        sendId: send.sendId,
        version: send.version,
        sentAt: send.sentAt,
        sentTo: send.sentTo,
        clientName: send.clientName,
        subject: send.subject,
        status: send.status,
        viewedAt: send.viewedAt,
        respondedAt: send.respondedAt,
        sentBy: send.sentBy,
        sendMethod: send.sendMethod,
        // Version snapshot data
        versionSnapshot: send.versionSnapshot,
        hasContent: !!send.versionSnapshot?.content,
        wordCount: send.versionSnapshot?.wordCount,
        isLocked: send.isVersionLocked
      })).sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()); // Newest first

    } catch (error) {
      console.error('Error getting enhanced send history:', error);
      throw error;
    }
  }
}