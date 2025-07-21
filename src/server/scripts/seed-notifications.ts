import { prisma } from '../utils/database';

async function seedNotifications() {
  try {
    console.log('🌱 Seeding notifications...');

    // Get the first user and proposal for testing
    const user = await prisma.user.findFirst({
      where: { isPublicUser: false }
    });

    const proposal = await prisma.proposal.findFirst({
      where: { authorId: user?.id }
    });

    if (!user || !proposal) {
      console.log('❌ No user or proposal found for seeding notifications');
      return;
    }

    // Create sample notifications
    const notifications = [
      {
        userId: user.id,
        type: 'PROPOSAL_OPENED',
        title: 'Proposal Opened',
        message: `Your proposal "${proposal.title}" was opened by the client`,
        proposalId: proposal.id,
        isRead: false,
        metadata: JSON.stringify({
          clientName: 'John Doe',
          clientEmail: 'john@example.com'
        })
      },
      {
        userId: user.id,
        type: 'COMMENT',
        title: 'New Client Comment',
        message: `A client commented on your proposal "${proposal.title}"`,
        proposalId: proposal.id,
        isRead: false,
        metadata: JSON.stringify({
          commentId: 'sample-comment-1',
          clientName: 'Jane Smith',
          commentContent: 'This looks great! Can you add more details about the timeline?'
        })
      },
      {
        userId: user.id,
        type: 'CLIENT_REPLY',
        title: 'Client Replied',
        message: `A client replied to your proposal "${proposal.title}"`,
        proposalId: proposal.id,
        isRead: true,
        metadata: JSON.stringify({
          clientName: 'Mike Johnson',
          commentContent: 'Thanks for the quick response!'
        })
      },
      {
        userId: user.id,
        type: 'PROPOSAL_APPROVED',
        title: 'Proposal Approved!',
        message: `Your proposal "${proposal.title}" was approved by the client!`,
        proposalId: proposal.id,
        isRead: false,
        metadata: JSON.stringify({
          clientName: 'Sarah Wilson',
          comment: 'Perfect! Let\'s move forward with this.'
        })
      },
      {
        userId: user.id,
        type: 'ACCESS_REQUEST',
        title: 'New Access Request',
        message: `Bob Brown requested access to your proposal "${proposal.title}"`,
        proposalId: proposal.id,
        isRead: false,
        metadata: JSON.stringify({
          requesterName: 'Bob Brown',
          requesterEmail: 'bob@company.com',
          company: 'Tech Solutions Inc.'
        })
      }
    ];

    // Create notifications with different timestamps
    for (let i = 0; i < notifications.length; i++) {
      const notification = notifications[i];
      const createdAt = new Date();
      createdAt.setHours(createdAt.getHours() - i * 2); // Each notification 2 hours apart

      await prisma.notification.create({
        data: {
          ...notification,
          createdAt
        }
      });
    }

    console.log('✅ Notifications seeded successfully!');
    console.log(`📊 Created ${notifications.length} sample notifications for user: ${user.email}`);
  } catch (error) {
    console.error('❌ Error seeding notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedNotifications(); 