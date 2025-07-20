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
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error('No email from Google'), false);
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          // Create user if doesn't exist
          user = await prisma.user.create({
            data: {
              email,
              name: profile.displayName,
              password: '', // Not used for Google users
              role: 'USER',
              // You may want to assign organizationId, etc.
            },
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    }
  ));
} else {
  console.log('⚠️  Google OAuth not configured. Google login will be disabled.');
}

export default passport; 