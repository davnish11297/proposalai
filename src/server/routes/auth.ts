import { Router } from 'express';
import { connectToDatabase } from '../utils/mongoClient';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { ObjectId } from 'mongodb';

const router = Router();

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, organizationName, organizationSlug } = req.body;

    if (!email || !password || !firstName || !lastName || !organizationName || !organizationSlug) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    const { db } = await connectToDatabase();

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Check if organization slug is available
    const existingOrg = await db.collection('organizations').findOne({ slug: organizationSlug });

    if (existingOrg) {
      return res.status(400).json({
        success: false,
        error: 'Organization slug already taken'
      });
    }

    // Create organization
    const organizationResult = await db.collection('organizations').insertOne({
      name: organizationName,
      slug: organizationSlug,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const userResult = await db.collection('users').insertOne({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'ADMIN',
      isActive: true,
      organizationId: organizationResult.insertedId,
      onboardingCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const user = {
      id: userResult.insertedId.toString(),
      email,
      firstName,
      lastName,
      role: 'ADMIN',
      organizationId: organizationResult.insertedId.toString(),
      onboardingCompleted: false,
      isActive: true,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Generate token
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      data: {
        user,
        organization: {
          id: organizationResult.insertedId.toString(),
          name: organizationName,
          slug: organizationSlug,
          isActive: true
        },
        token
      },
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to register user'
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const { db } = await connectToDatabase();

    // Find user
    const user = await db.collection('users').findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Get organization
    const organization = await db.collection('organizations').findOne({ 
      _id: user.organizationId 
    });

    // Generate token
    const tokenUser = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      organizationId: user.organizationId.toString(),
      isActive: user.isActive || true,
      emailVerified: user.emailVerified || false,
      createdAt: user.createdAt || new Date(),
      updatedAt: user.updatedAt || new Date()
    };
    const token = generateToken(tokenUser);

    return res.json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organizationId: user.organizationId.toString(),
          onboardingCompleted: user.onboardingCompleted || false
        },
        organization: organization ? {
          id: organization._id.toString(),
          name: organization.name,
          slug: organization.slug,
          isActive: organization.isActive
        } : null,
        token
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to login'
    });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { db } = await connectToDatabase();

    const user = await db.collection('users').findOne({ 
      _id: new ObjectId(authenticatedReq.user!.userId)
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get organization
    const organization = await db.collection('organizations').findOne({ 
      _id: user.organizationId 
    });

    return res.json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organizationId: user.organizationId.toString(),
          onboardingCompleted: user.onboardingCompleted || false
        },
        organization: organization ? {
          id: organization._id.toString(),
          name: organization.name,
          slug: organization.slug,
          isActive: organization.isActive
        } : null
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get user'
    });
  }
});

// Complete onboarding
router.post('/onboarding/complete', authenticateToken, async (req, res) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { name, privacyMode, industry, goal } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required'
      });
    }

    const { db } = await connectToDatabase();

    // Update user with onboarding data
    await db.collection('users').updateOne(
      { _id: new ObjectId(authenticatedReq.user!.userId) },
      {
        $set: {
          firstName: name,
          onboardingCompleted: true,
          privacyMode: privacyMode || false,
          industry: industry || '',
          goal: goal || '',
          updatedAt: new Date()
        }
      }
    );

    return res.json({
      success: true,
      data: {
        message: 'Onboarding completed successfully'
      }
    });
  } catch (error) {
    console.error('Onboarding completion error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to complete onboarding'
    });
  }
});

export default router; 