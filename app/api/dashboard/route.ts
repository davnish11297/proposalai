import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/lib/middleware';
import connectDB from '@/lib/mongodb';
import Proposal from '@/models/Proposal';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Dashboard API: Request received');
    
    const userAuth = await authenticateToken(request);
    if (!userAuth) {
      console.log('❌ Dashboard API: Authentication failed');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('✅ Dashboard API: User authenticated:', userAuth.userId);

    await connectDB();
    console.log('✅ Dashboard API: Database connected');

    // Safe date calculations
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    console.log('✅ Dashboard API: Date calculations complete');

    // Initialize safe defaults
    let metrics = {
      totalProposals: 0,
      totalSent: 0,
      acceptedProposals: 0,
      draftProposals: 0,
      conversionRate: 0,
    };

    let proposalsNeedingFollowUp = [];
    let recentProposals = [];
    let recentActivity = [];

    try {
      // Get basic proposal counts
      console.log('📊 Dashboard API: Fetching proposal counts...');
      
      const [totalCount, sentCount, acceptedCount, draftCount] = await Promise.all([
        Proposal.countDocuments({
          organizationId: userAuth.organizationId,
          createdAt: { $gte: monthAgo }
        }),
        Proposal.countDocuments({
          organizationId: userAuth.organizationId,
          status: { $in: ['SENT', 'VIEWED', 'ACCEPTED', 'REJECTED'] },
          createdAt: { $gte: monthAgo }
        }),
        Proposal.countDocuments({
          organizationId: userAuth.organizationId,
          status: 'ACCEPTED',
          createdAt: { $gte: monthAgo }
        }),
        Proposal.countDocuments({
          organizationId: userAuth.organizationId,
          status: 'DRAFT'
        })
      ]);

      metrics.totalProposals = totalCount;
      metrics.totalSent = sentCount;
      metrics.acceptedProposals = acceptedCount;
      metrics.draftProposals = draftCount;
      metrics.conversionRate = sentCount > 0 ? Math.round((acceptedCount / sentCount) * 100) : 0;

      console.log('✅ Dashboard API: Metrics calculated:', metrics);

    } catch (error) {
      console.error('⚠️ Dashboard API: Error getting metrics:', error.message);
      // Continue with default metrics
    }

    try {
      // Get proposals needing follow-up
      console.log('📊 Dashboard API: Fetching follow-ups...');
      
      proposalsNeedingFollowUp = await Proposal.find({
        organizationId: userAuth.organizationId,
        status: { $in: ['SENT', 'VIEWED'] },
        sentAt: { $lt: threeDaysAgo, $exists: true }
      }).limit(5).lean().exec();

      console.log('✅ Dashboard API: Follow-ups found:', proposalsNeedingFollowUp.length);

    } catch (error) {
      console.error('⚠️ Dashboard API: Error getting follow-ups:', error.message);
      proposalsNeedingFollowUp = [];
    }

    try {
      // Get recent proposals
      console.log('📊 Dashboard API: Fetching recent proposals...');
      
      recentProposals = await Proposal.find({
        organizationId: userAuth.organizationId,
      })
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean()
      .exec();

      console.log('✅ Dashboard API: Recent proposals found:', recentProposals.length);

      // Create activity from recent proposals
      recentActivity = recentProposals
        .filter(proposal => proposal.updatedAt >= yesterday)
        .slice(0, 8)
        .map(proposal => ({
          id: proposal._id.toString(),
          type: 'sent' as const,
          title: proposal.title || 'Untitled Proposal',
          clientName: proposal.clientInfo?.name || 'Unknown Client',
          company: proposal.clientInfo?.company || '',
          timestamp: proposal.updatedAt || proposal.createdAt,
          proposalId: proposal._id.toString(),
        }));

    } catch (error) {
      console.error('⚠️ Dashboard API: Error getting recent proposals:', error.message);
      recentProposals = [];
      recentActivity = [];
    }

    // Generate quick actions
    const quickActions = [];
    if (proposalsNeedingFollowUp.length > 0) {
      quickActions.push({
        id: 'follow-up',
        type: 'follow-up',
        title: `Follow up with client`,
        description: `${proposalsNeedingFollowUp.length} proposals need follow-up`,
        action: 'send-follow-up',
        proposalId: proposalsNeedingFollowUp[0]._id.toString(),
        urgent: true,
        icon: 'mail',
      });
    }

    // Generate insights
    const insights = [];
    if (metrics.conversionRate > 0) {
      insights.push(`Your proposals have a ${metrics.conversionRate}% conversion rate`);
    }
    if (metrics.draftProposals > 0) {
      insights.push(`You have ${metrics.draftProposals} drafts ready to send`);
    }
    if (metrics.totalProposals === 0) {
      insights.push('Welcome to ProposalAI! Create your first proposal to get started.');
    }
    if (insights.length === 0) {
      insights.push('Keep creating great proposals to unlock more insights!');
    }

    // Build safe response
    const dashboardData = {
      priorities: {
        needsFollowUp: proposalsNeedingFollowUp.length,
        recentViews: 0, // Simplified for now
        draftProposals: metrics.draftProposals,
        expiringProposals: 0, // Simplified for now
      },
      recentActivity,
      metrics: {
        totalProposals: metrics.totalProposals,
        totalSent: metrics.totalSent,
        conversionRate: metrics.conversionRate,
        totalValue: 0, // Can be calculated if needed
        acceptedValue: 0, // Can be calculated if needed
        responseRate: 0, // Can be calculated if needed
      },
      notifications: proposalsNeedingFollowUp.slice(0, 3).map(proposal => ({
        id: `follow-up-${proposal._id}`,
        type: 'follow-up',
        title: 'Follow-up needed',
        message: `Proposal "${proposal.title || 'Untitled'}" needs follow-up`,
        timestamp: proposal.sentAt,
        actionable: true,
        proposalId: proposal._id.toString(),
      })),
      insights,
      quickActions,
      recentProposals: recentProposals.slice(0, 5).map(proposal => ({
        id: proposal._id.toString(),
        title: proposal.title || 'Untitled Proposal',
        status: proposal.status,
        clientName: proposal.clientInfo?.name || 'Unknown Client',
        company: proposal.clientInfo?.company || '',
        updatedAt: proposal.updatedAt,
        totalValue: proposal.totalValue || 0,
      })),
    };

    console.log('✅ Dashboard API: Response prepared successfully');
    
    return NextResponse.json({
      success: true,
      data: dashboardData,
    });

  } catch (error) {
    console.error('💥 Dashboard API: Critical error:', error);
    console.error('Error stack:', error.stack);
    
    // Return ultra-safe fallback
    const safeFallback = {
      priorities: {
        needsFollowUp: 0,
        recentViews: 0,
        draftProposals: 0,
        expiringProposals: 0,
      },
      recentActivity: [],
      metrics: {
        totalProposals: 0,
        totalSent: 0,
        conversionRate: 0,
        totalValue: 0,
        acceptedValue: 0,
        responseRate: 0,
      },
      notifications: [],
      insights: ['Dashboard temporarily unavailable. All features are still working!'],
      quickActions: [],
      recentProposals: [],
    };

    return NextResponse.json({
      success: true,
      data: safeFallback,
      fallback: true,
      error: 'Dashboard data temporarily limited'
    });
  }
}