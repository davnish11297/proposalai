# 🔔 Notification System

## Overview

The ProposalAI notification system provides real-time updates to users about important events related to their proposals. Users can see notifications in the top navigation bar with a bell icon that shows the count of unread notifications.

## Features

### 📱 Notification Bell
- **Location**: Top navigation bar, next to user menu
- **Badge**: Red circle showing unread count (max 99+)
- **Dropdown**: Click to view all notifications
- **Auto-refresh**: Polls for new notifications every 30 seconds

### 🔔 Notification Types

1. **Proposal Opened** (`PROPOSAL_OPENED`)
   - Triggered when a client opens a proposal
   - Icon: 👁️ Green eye icon
   - Message: "Your proposal was opened by the client"

2. **New Client Comment** (`COMMENT`)
   - Triggered when a client adds a comment
   - Icon: 💬 Blue chat bubble
   - Message: "A client commented on your proposal"

3. **Client Reply** (`CLIENT_REPLY`)
   - Triggered when a client replies to a proposal
   - Icon: 👤 Purple user icon
   - Message: "A client replied to your proposal"

4. **Proposal Approved** (`PROPOSAL_APPROVED`)
   - Triggered when a client approves a proposal
   - Icon: ✅ Green checkmark
   - Message: "Your proposal was approved by the client!"

5. **Proposal Feedback** (`PROPOSAL_REJECTED`)
   - Triggered when a client provides feedback/rejection
   - Icon: ❌ Red X icon
   - Message: "Your proposal received feedback from the client"

6. **Access Request** (`ACCESS_REQUEST`)
   - Triggered when someone requests access to a proposal
   - Icon: 👤 Orange user icon
   - Message: "Someone requested access to your proposal"

### 🎨 Visual Design

- **Unread notifications**: Blue background with blue dot indicator
- **Read notifications**: White background
- **Hover effects**: Smooth transitions and hover states
- **Icons**: Color-coded by notification type
- **Timestamps**: Relative time (e.g., "2h ago", "Just now")

### ⚡ Actions

- **Click notification**: Mark as read
- **"Mark all read"**: Mark all notifications as read
- **"View all proposals"**: Navigate to sent proposals page
- **Auto-dismiss**: Click outside dropdown to close

## Technical Implementation

### Frontend Components

- `NotificationBell.tsx`: Main notification component
- `Layout.tsx`: Integrated into top navigation
- `api.ts`: Notification API endpoints

### Backend Components

- `notificationController.ts`: Handles notification CRUD operations
- `notificationService.ts`: Service layer for creating notifications
- `notifications.ts`: API routes
- `schema.prisma`: Notification model

### Database Schema

```prisma
model Notification {
  id        String   @id @default(cuid())
  type      String   // Notification type
  title     String   // Notification title
  message   String   // Notification message
  isRead    Boolean  @default(false)
  metadata  String?  // JSON metadata
  createdAt DateTime @default(now())

  // Relations
  user       User     @relation(fields: [userId], references: [id])
  userId     String
  proposal   Proposal? @relation(fields: [proposalId], references: [id])
  proposalId String?
}
```

### API Endpoints

- `GET /api/notifications` - Get all notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/mark-all-read` - Mark all as read
- `GET /api/notifications/proposal/:id` - Get proposal notifications

## Usage Examples

### Creating Notifications

```typescript
// From notification service
await notificationService.notifyProposalOpened(proposalId, clientName, clientEmail);
await notificationService.notifyNewClientComment(proposalId, commentId, clientName, commentContent);
await notificationService.notifyProposalApproved(proposalId, clientName, comment);
```

### From controllers
```typescript
await notificationController.createNotification({
  userId: proposal.authorId,
  type: 'COMMENT',
  title: 'New Client Comment',
  message: `A client commented on your proposal "${proposal.title}"`,
  proposalId: proposal.id,
  metadata: { commentId, clientName }
});
```

## Testing

### Sample Data
Run the seeding script to create test notifications:
```bash
npx ts-node --project tsconfig.server.json src/server/scripts/seed-notifications.ts
```

### Test Credentials
- Email: `test@example.com`
- Password: `password123`

## Future Enhancements

- [ ] Push notifications for real-time updates
- [ ] Email notifications integration
- [ ] Notification preferences/settings
- [ ] Notification categories and filtering
- [ ] Bulk actions (delete, archive)
- [ ] Notification sound alerts
- [ ] Mobile app notifications 