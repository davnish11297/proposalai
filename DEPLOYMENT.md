# ProposalAI - Vercel Deployment Guide

## 🚀 Deploy to Vercel

This guide will help you deploy the ProposalAI application to Vercel.

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Environment Variables**: Prepare your environment variables

## 🔧 Environment Variables

You'll need to set these environment variables in your Vercel project:

### Required Environment Variables

```bash
# Database
DATABASE_URL="your_mongodb_connection_string"

# Authentication
JWT_SECRET="your_jwt_secret_key"
GOOGLE_CLIENT_ID="your_google_oauth_client_id"
GOOGLE_CLIENT_SECRET="your_google_oauth_client_secret"

# AI Services
OPENROUTER_API_KEY="your_openrouter_api_key"
ANTHROPIC_API_KEY="your_anthropic_api_key"

# Email Services
SENDGRID_API_KEY="your_sendgrid_api_key"
RESEND_API_KEY="your_resend_api_key"

# Client-side Environment Variables
REACT_APP_API_URL="https://your-vercel-domain.vercel.app/api"
```

## 🛠️ Deployment Steps

### 1. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Select the repository containing your ProposalAI code

### 2. Configure Build Settings

Vercel will automatically detect the configuration from `vercel.json`, but verify these settings:

- **Framework Preset**: Other
- **Root Directory**: `./` (root of the project)
- **Build Command**: `cd client && npm run build`
- **Output Directory**: `client/build`
- **Install Command**: `npm install && cd client && npm install`

### 3. Set Environment Variables

1. In your Vercel project dashboard, go to "Settings" → "Environment Variables"
2. Add all the environment variables listed above
3. Make sure to set them for "Production", "Preview", and "Development" environments

### 4. Deploy

1. Click "Deploy" in Vercel
2. Wait for the build to complete
3. Your app will be available at `https://your-project-name.vercel.app`

## 📁 Project Structure

```
proposalai/
├── client/                 # React frontend
│   ├── src/
│   ├── package.json
│   └── vercel.json
├── src/
│   └── server/            # Node.js backend
│       ├── index.ts
│       ├── routes/
│       └── controllers/
├── vercel.json            # Main Vercel configuration
└── package.json
```

## 🔄 Vercel Configuration

The `vercel.json` file configures:

- **Frontend Build**: React app builds to `client/build`
- **API Routes**: Backend routes are handled by `src/server/index.ts`
- **Routing**: All non-API routes serve the React app
- **Serverless Functions**: Backend runs as serverless functions

## 🐛 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check that all dependencies are in `package.json`
   - Verify environment variables are set correctly
   - Check build logs in Vercel dashboard

2. **API Errors**
   - Ensure `REACT_APP_API_URL` is set correctly
   - Check that database connection string is valid
   - Verify all API keys are properly configured

3. **CORS Issues**
   - The API is configured to handle CORS automatically
   - If issues persist, check the server CORS configuration

### Debugging

1. **Check Build Logs**: Go to your Vercel project → "Deployments" → Click on deployment → "Build Logs"
2. **Check Function Logs**: Go to "Functions" tab to see serverless function logs
3. **Environment Variables**: Verify all variables are set in Vercel dashboard

## 🔒 Security Considerations

1. **Environment Variables**: Never commit sensitive keys to your repository
2. **Database**: Use MongoDB Atlas or similar cloud database
3. **API Keys**: Rotate API keys regularly
4. **HTTPS**: Vercel automatically provides HTTPS

## 📈 Monitoring

1. **Vercel Analytics**: Enable in project settings
2. **Error Tracking**: Consider adding Sentry or similar
3. **Performance**: Monitor function execution times

## 🔄 Continuous Deployment

Once set up, Vercel will automatically deploy when you push to your main branch. For other branches, it creates preview deployments.

## 📞 Support

If you encounter issues:

1. Check Vercel documentation
2. Review build and function logs
3. Verify environment variables
4. Test locally first

---

**Happy Deploying! 🚀** 