import connectDB from '@/lib/mongodb';
import Client from '@/models/Client';
import Proposal from '@/models/Proposal';

interface ClientData {
  name: string;
  email: string;
  company?: string;
}

interface UserAuth {
  userId: string;
  organizationId: string;
}

export class ClientService {
  /**
   * Find or create a client based on email address
   */
  static async findOrCreateClient(
    clientData: ClientData, 
    userAuth: UserAuth
  ): Promise<any> {
    await connectDB();

    // First, try to find existing client by email
    let client = await Client.findOne({
      email: clientData.email.toLowerCase(),
      organizationId: userAuth.organizationId
    });

    if (client) {
      // Update client info if needed
      let needsUpdate = false;
      
      if (clientData.name && client.name !== clientData.name) {
        client.name = clientData.name;
        needsUpdate = true;
      }
      
      if (clientData.company && client.company !== clientData.company) {
        client.company = clientData.company;
        needsUpdate = true;
      }

      client.lastContactDate = new Date();
      
      if (needsUpdate) {
        await client.save();
      }
      
      return client;
    }

    // Create new client
    client = await Client.create({
      name: clientData.name,
      email: clientData.email.toLowerCase(),
      company: clientData.company || 'Unknown Company',
      source: 'OTHER',
      status: 'LEAD',
      priority: 'MEDIUM',
      organizationId: userAuth.organizationId,
      userId: userAuth.userId,
      firstContactDate: new Date(),
      lastContactDate: new Date(),
    });

    return client;
  }

  /**
   * Update client statistics when a proposal is sent
   */
  static async updateClientProposalStats(
    clientId: string, 
    proposalStatus: string = 'SENT'
  ): Promise<void> {
    await connectDB();

    const client = await Client.findById(clientId);
    if (!client) return;

    // Get actual counts from proposals
    const proposals = await Proposal.find({ clientId });
    
    let totalSends = 0;
    let totalProposals = proposals.length;
    
    // Count all sends from sendHistory + legacy emailSent
    proposals.forEach(proposal => {
      if (proposal.sendHistory && proposal.sendHistory.length > 0) {
        totalSends += proposal.sendHistory.length;
      } else if (proposal.emailSent) {
        totalSends += 1;
      }
    });

    // Count accepted proposals
    const acceptedProposals = proposals.filter(p => p.status === 'ACCEPTED').length;
    
    client.totalProposals = totalSends; // Use total sends for the main count
    client.acceptedProposals = acceptedProposals;
    client.lastProposalDate = new Date();
    client.lastContactDate = new Date();

    await client.save();
  }

  /**
   * Get all proposals for a specific client
   */
  static async getClientProposals(
    clientId: string, 
    organizationId: string
  ): Promise<any[]> {
    await connectDB();

    const proposals = await Proposal.find({
      clientId: clientId,
      organizationId: organizationId
    }).sort({ createdAt: -1 });

    return proposals;
  }

  /**
   * Get grouped proposal sends for clean UI display
   */
  static async getClientProposalSendsGrouped(
    clientId: string, 
    organizationId: string
  ): Promise<any[]> {
    await connectDB();

    const proposals = await Proposal.find({
      clientId: clientId,
      organizationId: organizationId
    }).sort({ createdAt: -1 });

    // Transform to flat send list first
    const allSends = [];
    
    for (const proposal of proposals) {
      if (proposal.sendHistory && proposal.sendHistory.length > 0) {
        // Add each send from history
        for (const send of proposal.sendHistory) {
          allSends.push({
            proposalId: proposal._id,
            sendId: send.sendId || send._id,
            title: proposal.title,
            description: proposal.description,
            version: proposal.version || 1,
            sentAt: send.sentAt,
            sentTo: send.sentTo,
            clientName: send.clientName,
            subject: send.subject,
            status: send.status,
            viewedAt: send.viewedAt,
            totalValue: proposal.totalValue,
            currency: proposal.currency
          });
        }
      }
    }

    // Group by proposal ID
    const grouped = new Map();

    allSends.forEach(send => {
      const key = send.proposalId;
      
      if (!grouped.has(key)) {
        grouped.set(key, {
          proposalId: key,
          title: send.title,
          description: send.description,
          version: send.version || 1,
          sends: [],
          latestSend: null,
          sendCount: 0
        });
      }

      const group = grouped.get(key);
      
      const sendData = {
        sendId: send.sendId || send.proposalId,
        sentAt: send.sentAt,
        sentTo: send.sentTo,
        status: send.status,
        subject: send.subject,
        version: send.version || 1
      };
      
      group.sends.push(sendData);
      group.sendCount++;
      
      // Track latest send
      if (!group.latestSend || new Date(sendData.sentAt) > new Date(group.latestSend.sentAt)) {
        group.latestSend = sendData;
      }
    });

    // Sort sends within each group by date (newest first)
    Array.from(grouped.values()).forEach(group => {
      group.sends.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    });

    return Array.from(grouped.values());
  }

  static async getClientWithStats(
    clientId: string, 
    organizationId: string
  ): Promise<any> {
    await connectDB();

    const client = await Client.findOne({
      _id: clientId,
      organizationId: organizationId
    });

    if (!client) return null;

    // Get proposal statistics
    const proposalStats = await Proposal.aggregate([
      {
        $match: {
          clientId: new (require('mongoose')).Types.ObjectId(clientId),
          organizationId: new (require('mongoose')).Types.ObjectId(organizationId)
        }
      },
      {
        $facet: {
          // Count unique proposals by status
          proposalsByStatus: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalValue: { $sum: '$totalValue' }
              }
            }
          ],
          // Count all sends from sendHistory
          sendsByStatus: [
            {
              $unwind: {
                path: '$sendHistory',
                preserveNullAndEmptyArrays: true
              }
            },
            {
              $group: {
                _id: '$sendHistory.status',
                count: { $sum: 1 }
              }
            }
          ],
          // Count total sends (including legacy emailSent)
          totalSends: [
            {
              $addFields: {
                sendCount: {
                  $cond: {
                    if: { $gt: [{ $size: { $ifNull: ['$sendHistory', []] } }, 0] },
                    then: { $size: '$sendHistory' },
                    else: { $cond: { if: '$emailSent', then: 1, else: 0 } }
                  }
                }
              }
            },
            {
              $group: {
                _id: null,
                totalSends: { $sum: '$sendCount' }
              }
            }
          ]
        }
      }
    ]);

    const stats = {
      totalProposals: 0,
      totalSends: 0,
      acceptedProposals: 0,
      rejectedProposals: 0,
      sentProposals: 0,
      draftProposals: 0,
      viewedProposals: 0,
      totalValue: 0,
      acceptedValue: 0
    };

    // Process proposal status counts
    if (proposalStats[0]?.proposalsByStatus) {
      proposalStats[0].proposalsByStatus.forEach(stat => {
        stats.totalProposals += stat.count;
        stats.totalValue += stat.totalValue || 0;
        
        switch (stat._id) {
          case 'ACCEPTED':
            stats.acceptedProposals = stat.count;
            stats.acceptedValue = stat.totalValue || 0;
            break;
          case 'REJECTED':
            stats.rejectedProposals = stat.count;
            break;
          case 'SENT':
            stats.sentProposals = stat.count;
            break;
          case 'DRAFT':
            stats.draftProposals = stat.count;
            break;
          case 'VIEWED':
            stats.viewedProposals = stat.count;
            break;
        }
      });
    }

    // Get total sends count
    if (proposalStats[0]?.totalSends?.[0]?.totalSends) {
      stats.totalSends = proposalStats[0].totalSends[0].totalSends;
    }

    return {
      ...client.toJSON(),
      proposalStats: stats
    };
  }
}