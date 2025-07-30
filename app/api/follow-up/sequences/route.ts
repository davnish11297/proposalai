import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/lib/middleware';
import connectDB from '@/lib/mongodb';
import { FollowUpSequence } from '@/models/FollowUp';

// GET all follow-up sequences for the organization
export async function GET(request: NextRequest) {
  try {
    const userAuth = await authenticateToken(request);
    if (!userAuth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const sequences = await FollowUpSequence.find({
      organizationId: userAuth.organizationId,
    })
      .populate('userId', 'firstName lastName email')
      .sort({ isDefault: -1, createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: sequences,
    });

  } catch (error) {
    console.error('Get follow-up sequences error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch follow-up sequences' },
      { status: 500 }
    );
  }
}

// POST create new follow-up sequence
export async function POST(request: NextRequest) {
  try {
    const userAuth = await authenticateToken(request);
    if (!userAuth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      triggerConditions,
      steps,
      escalation,
      isDefault,
    } = body;

    // Validate required fields
    if (!name || !steps || !Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Name and steps are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // If this is set as default, unset other defaults
    if (isDefault) {
      await FollowUpSequence.updateMany(
        { organizationId: userAuth.organizationId },
        { isDefault: false }
      );
    }

    const sequence = await FollowUpSequence.create({
      name,
      description,
      organizationId: userAuth.organizationId,
      userId: userAuth.userId,
      triggerConditions: triggerConditions || {
        daysAfterSent: 3,
        proposalStatuses: ['SENT', 'VIEWED'],
      },
      steps: steps.map((step, index) => ({
        ...step,
        stepNumber: index + 1,
      })),
      escalation: escalation || { enabled: false },
      isDefault: isDefault || false,
    });

    return NextResponse.json({
      success: true,
      data: sequence,
      message: 'Follow-up sequence created successfully',
    });

  } catch (error) {
    console.error('Create follow-up sequence error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create follow-up sequence' },
      { status: 500 }
    );
  }
}