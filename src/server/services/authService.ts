import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from '../utils/database';
import { generateToken } from '../utils/auth';

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});



// Only configure Google OAuth if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL) {
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: false
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google OAuth profile received:', { 
          id: profile.id, 
          displayName: profile.displayName,
          emails: profile.emails?.map(e => e.value)
        });
        
        const email = profile.emails?.[0]?.value;
        if (!email) {
          console.error('No email found in Google profile');
          return done(new Error('No email from Google'), false);
        }
        
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          console.log('Creating new user from Google OAuth:', { email, name: profile.displayName });
          // Create user if doesn't exist
          user = await prisma.user.create({
            data: {
              email,
              name: profile.displayName,
              password: '', // Not used for Google users
              role: 'USER',
            },
          });
          console.log('New user created:', { userId: user.id, email: user.email });
        } else {
          console.log('Existing user found:', { userId: user.id, email: user.email });
        }
        
        return done(null, user);
      } catch (err) {
        console.error('Google OAuth strategy error:', err);
        return done(err, false);
      }
    }
  ));
  console.log('✅ Google OAuth strategy configured successfully');
} else {
  console.log('⚠️  Google OAuth not configured. Google login will be disabled.');
}

export default passport; 