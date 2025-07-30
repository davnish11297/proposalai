import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/lib/middleware';
import connectDB from '@/lib/mongodb';
import Client from '@/models/Client';

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

    const clients = await Client.find({ 
      organizationId: userAuth.organizationId 
    }).sort({ lastContactDate: -1, createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: clients
    });

  } catch (error) {
    console.error('Get clients error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get clients'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const { 
      name, 
      email, 
      company, 
      phone, 
      jobTitle, 
      website, 
      industry,
      status = 'LEAD',
      priority = 'MEDIUM',
      notes 
    } = body;

    if (!name || !email || !company) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name, email, and company are required'
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if client already exists
    const existingClient = await Client.findOne({
      email: email.toLowerCase(),
      organizationId: userAuth.organizationId
    });

    if (existingClient) {
      return NextResponse.json(
        {
          success: false,
          error: 'Client with this email already exists'
        },
        { status: 400 }
      );
    }

    const client = await Client.create({
      name,
      email: email.toLowerCase(),
      company,
      phone,
      jobTitle,
      website,
      industry,
      status,
      priority,
      notes,
      organizationId: userAuth.organizationId,
      userId: userAuth.userId,
      firstContactDate: new Date(),
      lastContactDate: new Date()
    });

    return NextResponse.json({
      success: true,
      data: client,
      message: 'Client created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Create client error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create client'
      },
      { status: 500 }
    );
  }
}