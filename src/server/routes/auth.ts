import express from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../utils/database';
import { generateToken } from '../utils/auth';
import bcrypt from 'bcrypt';
import passport from 'passport';

const router = express.Router();

// Validation rules
const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
];

const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().isLength({ min: 1 }),
  body('lastName').trim().isLength({ min: 1 }),
];

// Routes
router.post('/login', loginValidation, validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        organization: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken(user as any);

    // Return user data (excluding password) and token
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      data: {
        token,
        user: userWithoutPassword
      }
    });
    return;
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
    return;
  }
});

router.post('/register', registerValidation, validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const { email, password, firstName, lastName, organizationName } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create organization first
    const organization = await prisma.organization.create({
      data: {
        name: organizationName,
        description: `Organization for ${organizationName}`,
        industry: 'Technology'
      }
    });

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: `${firstName} ${lastName}`,
        role: 'ADMIN',
        organizationId: organization.id
      },
      include: {
        organization: true
      }
    });

    // Generate JWT token
    const token = generateToken(user as any);

    // Return user data (excluding password) and token
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      data: {
        token,
        user: userWithoutPassword
      }
    });
    return;
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
    return;
  }
});

router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // TODO: Implement logout logic
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    const userId = req.user.userId;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      data: userWithoutPassword
    });
    return;
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user data'
    });
    return;
  }
});

// Google OAuth login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth callback
router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/login', 
    session: false,
    failureFlash: true 
  }), 
  async (req, res) => {
    try {
      const user = req.user as any;
      if (!user) {
        console.error('Google OAuth callback: No user found');
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=authentication_failed`);
      }
      
      console.log('Google OAuth callback: User authenticated successfully', { userId: user.id, email: user.email });
      
      const token = generateToken(user);
      
      // Redirect to frontend with token in query param
      const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/login?token=${token}`;
      console.log('Redirecting to:', redirectUrl);
      
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=token_generation_failed`);
    }
  }
);

export default router; 