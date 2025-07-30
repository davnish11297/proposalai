import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/lib/middleware';
import connectDB from '@/lib/mongodb';
import { FollowUpSequence, FollowUpExecution } from '@/models/FollowUp';
import Proposal from '@/models/Proposal';

// POST trigger follow-up for a proposal
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
    const { proposalId, sequenceId } = body;

    if (!proposalId) {
      return NextResponse.json(
        { success: false, error: 'Proposal ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get proposal
    const proposal = await Proposal.findOne({
      _id: proposalId,
      organizationId: userAuth.organizationId,
    }).populate('clientId');

    if (!proposal) {
      return NextResponse.json(
        { success: false, error: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Get sequence (use default if not specified)
    let sequence;
    if (sequenceId) {
      sequence = await FollowUpSequence.findOne({
        _id: sequenceId,
        organizationId: userAuth.organizationId,
      });
    } else {
      sequence = await FollowUpSequence.findOne({
        organizationId: userAuth.organizationId,
        isDefault: true,
        isActive: true,
      });
    }

    if (!sequence) {
      return NextResponse.json(
        { success: false, error: 'No follow-up sequence found' },
        { status: 404 }
      );
    }

    // Check if follow-up is already active for this proposal
    const existingExecution = await FollowUpExecution.findOne({
      proposalId,
      status: 'ACTIVE',
    });

    if (existingExecution) {
      return NextResponse.json(
        { success: false, error: 'Follow-up sequence already active for this proposal' },
        { status: 409 }
      );
    }

    // Calculate next execution time (first step)
    const firstStep = sequence.steps.find(step => step.stepNumber === 1);
    if (!firstStep) {
      return NextResponse.json(
        { success: false, error: 'Invalid sequence: no first step found' },
        { status: 400 }
      );
    }

    const nextExecutionAt = new Date();
    nextExecutionAt.setDate(nextExecutionAt.getDate() + firstStep.delayDays);

    // Create follow-up execution
    const execution = await FollowUpExecution.create({
      proposalId,
      sequenceId: sequence._id,
      organizationId: userAuth.organizationId,
      status: 'ACTIVE',
      currentStep: 1,
      nextExecutionAt,
    });

    // Update sequence usage count
    await FollowUpSequence.findByIdAndUpdate(sequence._id, {
      $inc: { usageCount: 1 },
    });

    return NextResponse.json({
      success: true,
      data: execution,
      message: 'Follow-up sequence triggered successfully',
    });

  } catch (error) {
    console.error('Trigger follow-up error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to trigger follow-up sequence' },
      { status: 500 }
    );
  }
}

// GET active follow-up executions
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

    const executions = await FollowUpExecution.find({
      organizationId: userAuth.organizationId,
      status: 'ACTIVE',
    })
      .populate({
        path: 'proposalId',
        select: 'title status clientId clientInfo',
        populate: {
          path: 'clientId',
          select: 'name email company',
        },
      })
      .populate('sequenceId', 'name')
      .sort({ nextExecutionAt: 1 });

    return NextResponse.json({
      success: true,
      data: executions,
    });

  } catch (error) {
    console.error('Get follow-up executions error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch follow-up executions' },
      { status: 500 }
    );
  }
}