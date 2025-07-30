import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/lib/middleware';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Organization from '@/models/Organization';

export async function GET(request: NextRequest) {
  try {
    const userAuth = await authenticateToken(request);
    
    if (!userAuth) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized'
        },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findById(userAuth.userId).select('-password');
    if (!user || !user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found'
        },
        { status: 404 }
      );
    }

    const organization = await Organization.findById(user.organizationId);
    if (!organization) {
      return NextResponse.json(
        {
          success: false,
          error: 'Organization not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organizationId: user.organizationId.toString()
        },
        organization: {
          id: organization._id.toString(),
          name: organization.name,
          slug: organization.slug
        }
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get user'
      },
      { status: 500 }
    );
  }
}