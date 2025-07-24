"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const database_1 = require("../utils/database");
passport_1.default.serializeUser((user, done) => {
    done(null, user.id);
});
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const user = await database_1.prisma.user.findUnique({ where: { id } });
        done(null, user);
    }
    catch (err) {
        done(err, null);
    }
});
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL) {
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails?.[0]?.value;
            if (!email)
                return done(new Error('No email from Google'), false);
            let user = await database_1.prisma.user.findUnique({ where: { email } });
            if (!user) {
                user = await database_1.prisma.user.create({
                    data: {
                        email,
                        name: profile.displayName,
                        password: '',
                        role: 'USER',
                    },
                });
            }
            return done(null, user);
        }
        catch (err) {
            return done(err, false);
        }
    }));
}
else {
    console.log('⚠️  Google OAuth not configured. Google login will be disabled.');
}
exports.default = passport_1.default;
//# sourceMappingURL=authService.js.map