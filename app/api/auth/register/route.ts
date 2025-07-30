import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Organization from '@/models/Organization';
import { hashPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, organizationName, organizationSlug } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !organizationName || !organizationSlug) {
      return NextResponse.json(
        {
          success: false,
          error: 'All fields are required'
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User already exists'
        },
        { status: 400 }
      );
    }

    // Check if organization slug is available
    const existingOrg = await Organization.findOne({ slug: organizationSlug.toLowerCase() });
    if (existingOrg) {
      return NextResponse.json(
        {
          success: false,
          error: 'Organization slug already taken'
        },
        { status: 400 }
      );
    }

    // Create organization
    const organization = await Organization.create({
      name: organizationName,
      slug: organizationSlug.toLowerCase(),
      isActive: true
    });

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      role: 'ADMIN',
      isActive: true,
      organizationId: organization._id
    });

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      organizationId: organization._id.toString(),
      role: user.role
    });

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
        },
        token
      },
      message: 'User registered successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to register user'
      },
      { status: 500 }
    );
  }
}