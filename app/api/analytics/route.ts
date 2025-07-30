import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/lib/middleware';
import connectDB from '@/lib/mongodb';
import Proposal from '@/models/Proposal';
import Client from '@/models/Client';

export async function GET(request: NextRequest) {
  try {
    const userAuth = await authenticateToken(request);
    if (!userAuth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30'; // days
    const includeForecasting = searchParams.get('forecasting') === 'true';

    await connectDB();

    const daysAgo = parseInt(timeRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Conversion Funnel Analysis
    const conversionFunnel = await Proposal.aggregate([
      {
        $match: {
          organizationId: userAuth.organizationId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $facet: {
          totalProposals: [
            { $count: 'count' }
          ],
          sentProposals: [
            { $match: { status: { $in: ['SENT', 'VIEWED', 'ACCEPTED', 'REJECTED'] } } },
            { $count: 'count' }
          ],
          viewedProposals: [
            { $match: { status: { $in: ['VIEWED', 'ACCEPTED', 'REJECTED'] } } },
            { $count: 'count' }
          ],
          acceptedProposals: [
            { $match: { status: 'ACCEPTED' } },
            { $count: 'count' }
          ]
        }
      }
    ]);

    // Performance by Industry
    const industryPerformance = await Proposal.aggregate([
      {
        $match: {
          organizationId: userAuth.organizationId,
          createdAt: { $gte: startDate },
          clientId: { $exists: true }
        }
      },
      {
        $lookup: {
          from: 'clients',
          localField: 'clientId',
          foreignField: '_id',
          as: 'client'
        }
      },
      {
        $unwind: '$client'
      },
      {
        $group: {
          _id: '$client.industry',
          totalProposals: { $sum: 1 },
          acceptedProposals: { $sum: { $cond: [{ $eq: ['$status', 'ACCEPTED'] }, 1, 0] } },
          totalValue: { $sum: { $ifNull: ['$totalValue', 0] } },
          acceptedValue: { $sum: { $cond: [{ $eq: ['$status', 'ACCEPTED'] }, { $ifNull: ['$totalValue', 0] }, 0] } }
        }
      },
      {
        $addFields: {
          conversionRate: {
            $cond: [
              { $gt: ['$totalProposals', 0] },
              { $multiply: [{ $divide: ['$acceptedProposals', '$totalProposals'] }, 100] },
              0
            ]
          }
        }
      },
      {
        $sort: { totalValue: -1 }
      }
    ]);

    // Performance by Day of Week
    const dayOfWeekPerformance = await Proposal.aggregate([
      {
        $match: {
          organizationId: userAuth.organizationId,
          sentAt: { $gte: startDate, $exists: true }
        }
      },
      {
        $addFields: {
          dayOfWeek: { $dayOfWeek: '$sentAt' }
        }
      },
      {
        $group: {
          _id: '$dayOfWeek',
          totalSent: { $sum: 1 },
          totalViewed: { $sum: { $cond: [{ $in: ['$status', ['VIEWED', 'ACCEPTED', 'REJECTED']] }, 1, 0] } },
          totalAccepted: { $sum: { $cond: [{ $eq: ['$status', 'ACCEPTED'] }, 1, 0] } },
          avgValue: { $avg: { $ifNull: ['$totalValue', 0] } }
        }
      },
      {
        $addFields: {
          viewRate: {
            $cond: [
              { $gt: ['$totalSent', 0] },
              { $multiply: [{ $divide: ['$totalViewed', '$totalSent'] }, 100] },
              0
            ]
          },
          conversionRate: {
            $cond: [
              { $gt: ['$totalSent', 0] },
              { $multiply: [{ $divide: ['$totalAccepted', '$totalSent'] }, 100] },
              0
            ]
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Content Analysis (sections with highest engagement)
    const contentInsights = await Proposal.aggregate([
      {
        $match: {
          organizationId: userAuth.organizationId,
          createdAt: { $gte: startDate },
          views: { $exists: true, $ne: [] }
        }
      },
      {
        $unwind: '$views'
      },
      {
        $group: {
          _id: null,
          avgViewDuration: { $avg: '$views.duration' },
          totalViews: { $sum: 1 },
          uniqueViewers: { $addToSet: '$views.viewerIP' }
        }
      },
      {
        $addFields: {
          uniqueViewerCount: { $size: '$uniqueViewers' }
        }
      }
    ]);

    // Behavioral Data Analysis
    const behavioralData = await Proposal.aggregate([
      {
        $match: {
          organizationId: userAuth.organizationId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $facet: {
          viewPatterns: [
            {
              $match: { views: { $exists: true, $ne: [] } }
            },
            {
              $unwind: '$views'
            },
            {
              $group: {
                _id: {
                  hour: { $hour: '$views.viewedAt' }
                },
                viewCount: { $sum: 1 },
                avgDuration: { $avg: '$views.duration' }
              }
            },
            {
              $sort: { '_id.hour': 1 }
            }
          ],
          downloadPatterns: [
            {
              $match: { downloads: { $exists: true, $ne: [] } }
            },
            {
              $unwind: '$downloads'
            },
            {
              $group: {
                _id: '$downloads.format',
                downloadCount: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);

    // Win/Loss Analysis
    const winLossAnalysis = await Proposal.aggregate([
      {
        $match: {
          organizationId: userAuth.organizationId,
          createdAt: { $gte: startDate },
          status: { $in: ['ACCEPTED', 'REJECTED'] }
        }
      },
      {
        $facet: {
          byValue: [
            {
              $bucket: {
                groupBy: '$totalValue',
                boundaries: [0, 1000, 5000, 10000, 50000, 100000, Infinity],
                default: 'Unknown',
                output: {
                  totalProposals: { $sum: 1 },
                  acceptedProposals: { $sum: { $cond: [{ $eq: ['$status', 'ACCEPTED'] }, 1, 0] } },
                  avgValue: { $avg: '$totalValue' }
                }
              }
            },
            {
              $addFields: {
                conversionRate: {
                  $cond: [
                    { $gt: ['$totalProposals', 0] },
                    { $multiply: [{ $divide: ['$acceptedProposals', '$totalProposals'] }, 100] },
                    0
                  ]
                }
              }
            }
          ],
          byTimeline: [
            {
              $addFields: {
                timeToResponse: {
                  $cond: [
                    { $and: ['$sentAt', '$respondedAt'] },
                    { $divide: [{ $subtract: ['$respondedAt', '$sentAt'] }, 1000 * 60 * 60 * 24] },
                    null
                  ]
                }
              }
            },
            {
              $match: { timeToResponse: { $ne: null } }
            },
            {
              $group: {
                _id: '$status',
                avgTimeToResponse: { $avg: '$timeToResponse' },
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);

    // Revenue Forecasting (if requested)
    let forecasting = null;
    if (includeForecasting) {
      forecasting = await generateRevenueForecasting(userAuth.organizationId, startDate);
    }

    // Monthly trends
    const monthlyTrends = await Proposal.aggregate([
      {
        $match: {
          organizationId: userAuth.organizationId,
          createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 12)) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalProposals: { $sum: 1 },
          acceptedProposals: { $sum: { $cond: [{ $eq: ['$status', 'ACCEPTED'] }, 1, 0] } },
          totalValue: { $sum: { $ifNull: ['$totalValue', 0] } },
          acceptedValue: { $sum: { $cond: [{ $eq: ['$status', 'ACCEPTED'] }, { $ifNull: ['$totalValue', 0] }, 0] } }
        }
      },
      {
        $addFields: {
          conversionRate: {
            $cond: [
              { $gt: ['$totalProposals', 0] },
              { $multiply: [{ $divide: ['$acceptedProposals', '$totalProposals'] }, 100] },
              0
            ]
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    const analytics = {
      conversionFunnel: {
        total: conversionFunnel[0]?.totalProposals[0]?.count || 0,
        sent: conversionFunnel[0]?.sentProposals[0]?.count || 0,
        viewed: conversionFunnel[0]?.viewedProposals[0]?.count || 0,
        accepted: conversionFunnel[0]?.acceptedProposals[0]?.count || 0,
        sentRate: conversionFunnel[0]?.totalProposals[0]?.count > 0 
          ? Math.round((conversionFunnel[0]?.sentProposals[0]?.count || 0) / conversionFunnel[0].totalProposals[0].count * 100)
          : 0,
        viewRate: conversionFunnel[0]?.sentProposals[0]?.count > 0 
          ? Math.round((conversionFunnel[0]?.viewedProposals[0]?.count || 0) / conversionFunnel[0].sentProposals[0].count * 100)
          : 0,
        conversionRate: conversionFunnel[0]?.sentProposals[0]?.count > 0 
          ? Math.round((conversionFunnel[0]?.acceptedProposals[0]?.count || 0) / conversionFunnel[0].sentProposals[0].count * 100)
          : 0,
      },
      
      industryPerformance: industryPerformance.filter(item => item._id), // Remove null industries
      
      dayOfWeekPerformance: dayOfWeekPerformance.map(item => ({
        ...item,
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][item._id - 1]
      })),
      
      contentInsights: contentInsights[0] || {
        avgViewDuration: 0,
        totalViews: 0,
        uniqueViewerCount: 0
      },
      
      behavioralData: {
        viewPatterns: behavioralData[0]?.viewPatterns || [],
        downloadPatterns: behavioralData[0]?.downloadPatterns || []
      },
      
      winLossAnalysis: {
        byValue: winLossAnalysis[0]?.byValue || [],
        byTimeline: winLossAnalysis[0]?.byTimeline || []
      },
      
      monthlyTrends,
      
      ...(forecasting && { forecasting })
    };

    return NextResponse.json({
      success: true,
      data: analytics,
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

async function generateRevenueForecasting(organizationId: string, startDate: Date) {
  try {
    // Get historical data for forecasting
    const historicalData = await Proposal.aggregate([
      {
        $match: {
          organizationId,
          status: 'ACCEPTED',
          respondedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$respondedAt' },
            month: { $month: '$respondedAt' }
          },
          revenue: { $sum: { $ifNull: ['$totalValue', 0] } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    if (historicalData.length < 3) {
      return {
        prediction: 'Insufficient data for forecasting',
        confidence: 0,
        nextMonthRevenue: 0,
        nextQuarterRevenue: 0
      };
    }

    // Simple linear regression for forecasting
    const revenues = historicalData.map(d => d.revenue);
    const avgRevenue = revenues.reduce((a, b) => a + b, 0) / revenues.length;
    
    // Calculate growth trend
    let trend = 0;
    if (revenues.length >= 2) {
      const recentRevenues = revenues.slice(-3); // Last 3 months
      const oldRevenues = revenues.slice(0, 3); // First 3 months
      const recentAvg = recentRevenues.reduce((a, b) => a + b, 0) / recentRevenues.length;
      const oldAvg = oldRevenues.reduce((a, b) => a + b, 0) / oldRevenues.length;
      trend = (recentAvg - oldAvg) / oldAvg;
    }

    const nextMonthRevenue = Math.round(avgRevenue * (1 + trend));
    const nextQuarterRevenue = Math.round(nextMonthRevenue * 3 * (1 + trend / 3));

    return {
      prediction: trend > 0 ? 'Growing' : trend < 0 ? 'Declining' : 'Stable',
      confidence: Math.min(0.9, historicalData.length / 12), // Max 90% confidence
      nextMonthRevenue,
      nextQuarterRevenue,
      trend: Math.round(trend * 100) // Percentage
    };

  } catch (error) {
    console.error('Forecasting error:', error);
    return {
      prediction: 'Error generating forecast',
      confidence: 0,
      nextMonthRevenue: 0,
      nextQuarterRevenue: 0
    };
  }
}