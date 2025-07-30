/**
 * Proposal Version Management Utilities
 * Optimized for performance and storage efficiency
 */

export class ProposalVersionManager {
  /**
   * Create new version entry (smart snapshots)
   */
  static createVersion(currentContent: string, previousContent: string, changes: string) {
    const contentSizeChange = Math.abs(currentContent.length - previousContent.length) / previousContent.length;
    const isMajorChange = contentSizeChange > 0.2 || changes.toLowerCase().includes('major') || changes.toLowerCase().includes('rewrite');
    
    return {
      changes,
      changeType: isMajorChange ? 'major_edit' : 'minor_edit',
      isSnapshot: isMajorChange,
      content: isMajorChange ? currentContent : null, // Only store full content for major changes
      createdAt: new Date()
    };
  }

  /**
   * Create snapshot before sending
   */
  static createPreSendSnapshot(content: string, version: number) {
    return {
      version,
      content,
      changes: 'Pre-send snapshot',
      changeType: 'pre_send',
      isSnapshot: true,
      createdAt: new Date()
    };
  }

  /**
   * Group sends by proposal for clean UI display
   */
  static groupSendHistory(proposals: any[]) {
    const grouped = new Map();

    proposals.forEach(proposal => {
      const key = proposal.proposalId || proposal._id;
      
      if (!grouped.has(key)) {
        grouped.set(key, {
          proposalId: key,
          title: proposal.title,
          description: proposal.description,
          version: proposal.version || 1,
          sends: [],
          latestSend: null,
          sendCount: 0
        });
      }

      const group = grouped.get(key);
      
      if (proposal.sentAt) {
        const send = {
          sendId: proposal.sendId || proposal._id,
          sentAt: proposal.sentAt,
          sentTo: proposal.sentTo,
          status: proposal.status,
          subject: proposal.subject,
          version: proposal.version || 1
        };
        
        group.sends.push(send);
        group.sendCount++;
        
        // Track latest send
        if (!group.latestSend || new Date(send.sentAt) > new Date(group.latestSend.sentAt)) {
          group.latestSend = send;
        }
      }
    });

    // Sort sends within each group by date (newest first)
    Array.from(grouped.values()).forEach(group => {
      group.sends.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    });

    return Array.from(grouped.values());
  }

  /**
   * Create activity timeline (sends + edits combined)
   */
  static createTimeline(proposal: any) {
    const timeline = [];

    // Add version history
    if (proposal.versionHistory) {
      proposal.versionHistory.forEach(version => {
        timeline.push({
          type: 'edit',
          timestamp: version.createdAt,
          version: version.version,
          changes: version.changes,
          changeType: version.changeType,
          isSnapshot: version.isSnapshot
        });
      });
    }

    // Add send history
    if (proposal.sendHistory) {
      proposal.sendHistory.forEach(send => {
        timeline.push({
          type: 'send',
          timestamp: send.sentAt,
          version: send.version,
          sentTo: send.sentTo,
          status: send.status,
          subject: send.subject
        });
      });
    }

    // Sort by timestamp (newest first)
    return timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Get version status insights
   */
  static getVersionInsights(proposal: any) {
    const insights = [];
    const latestSend = proposal.sendHistory?.sort((a, b) => 
      new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
    )[0];

    if (latestSend && proposal.version > latestSend.version) {
      insights.push({
        type: 'warning',
        message: `Client has v${latestSend.version}, you're editing v${proposal.version}`,
        action: 'Consider sending updated version'
      });
    }

    if (latestSend && latestSend.status === 'SENT') {
      const daysSinceSent = Math.floor((Date.now() - new Date(latestSend.sentAt).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceSent > 3) {
        insights.push({
          type: 'info',
          message: `No response for ${daysSinceSent} days`,
          action: 'Consider following up'
        });
      }
    }

    if (latestSend && latestSend.version === proposal.version && latestSend.status === 'VIEWED') {
      insights.push({
        type: 'success',
        message: 'Client has viewed latest version',
        action: null
      });
    }

    return insights;
  }
}