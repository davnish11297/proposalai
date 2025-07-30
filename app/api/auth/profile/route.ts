import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/lib/middleware';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

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

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get profile'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { firstName, lastName, email } = body;

    // Basic validation
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        {
          success: false,
          error: 'All fields are required'
        },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email format'
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if email is already taken by another user
    const existingUser = await User.findOne({
      email: email,
      _id: { $ne: userAuth.userId }
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email already in use'
        },
        { status: 400 }
      );
    }

    const updatedUser = await User.findByIdAndUpdate(
      userAuth.userId,
      {
        firstName,
        lastName,
        email,
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update profile'
      },
      { status: 500 }
    );
  }
}