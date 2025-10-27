# BracketAce - Render Deployment Guide

This guide will help you deploy your BracketAce Angular application to Render.

## Prerequisites

1. A GitHub account
2. A Render account (sign up at https://render.com)
3. Your project pushed to a GitHub repository

## Step 1: Initialize Git Repository (if not already done)

If your project is not yet in a Git repository, initialize it:

```bash
cd /mnt/c/Projects2/BracketAce/bracket-ace
git init
git add .
git commit -m "Initial commit with modern login page"
```

## Step 2: Create a GitHub Repository

1. Go to https://github.com/new
2. Create a new repository (e.g., "bracket-ace")
3. Do NOT initialize with README, .gitignore, or license (since you already have these)

## Step 3: Push Your Code to GitHub

```bash
# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/bracket-ace.git

# Push your code
git branch -M main
git push -u origin main
```

## Step 4: Deploy to Render

### Option A: Using Render Dashboard (Recommended)

1. **Log in to Render**
   - Go to https://dashboard.render.com
   - Sign in or create an account

2. **Create New Static Site**
   - Click "New +" button
   - Select "Static Site"

3. **Connect Your Repository**
   - Connect your GitHub account if not already connected
   - Select your "bracket-ace" repository
   - Click "Connect"

4. **Configure Build Settings**
   - **Name**: bracket-ace (or your preferred name)
   - **Branch**: main
   - **Root Directory**: (leave empty or use `bracket-ace` if repository root is different)
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist/bracket-ace/browser`

5. **Environment Variables** (if needed)
   - Click "Advanced"
   - Add any environment variables your app needs:
     - `NODE_VERSION`: 18
     - `GRAPHQL_ENDPOINT`: your GraphQL API endpoint
     - Any other environment-specific variables

6. **Create Static Site**
   - Click "Create Static Site"
   - Render will automatically build and deploy your application
   - Your site will be available at `https://bracket-ace-XXXX.onrender.com`

### Option B: Using render.yaml (Infrastructure as Code)

Your project already includes a `render.yaml` file. To use it:

1. **Go to Render Dashboard**
   - Navigate to https://dashboard.render.com

2. **Create New Blueprint**
   - Click "New +" button
   - Select "Blueprint"

3. **Connect Repository**
   - Select your GitHub repository
   - Render will automatically detect the `render.yaml` file

4. **Review and Deploy**
   - Review the configuration
   - Click "Apply"
   - Render will deploy your application

## Step 5: Configure Custom Domain (Optional)

1. In your Render dashboard, go to your static site
2. Click "Settings"
3. Scroll to "Custom Domain"
4. Add your domain and follow DNS configuration instructions

## Step 6: Set Up Continuous Deployment

Render automatically sets up continuous deployment:
- Any push to your `main` branch will trigger a new deployment
- Pull requests can be configured to create preview deployments

## Important Configuration Files

### render.yaml
```yaml
services:
  - type: web
    name: bracket-ace
    env: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist/bracket-ace/browser
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
    envVars:
      - key: NODE_VERSION
        value: 18
```

## Environment Variables

If your application needs environment variables (e.g., API endpoints), add them in the Render dashboard:

1. Go to your service in the Render dashboard
2. Click "Environment"
3. Add variables:
   - `NODE_VERSION`: 18
   - `GRAPHQL_ENDPOINT`: your-api-endpoint
   - Any other required variables

## Troubleshooting

### Build Fails

1. **Check Node Version**: Ensure Node 18 or later is specified
2. **Check Build Logs**: Review logs in Render dashboard
3. **Local Build Test**: Run `npm run build` locally first

### Routes Not Working (404 errors)

The `render.yaml` includes rewrite rules to handle Angular routing:
```yaml
routes:
  - type: rewrite
    source: /*
    destination: /index.html
```

This ensures all routes redirect to index.html, allowing Angular Router to handle navigation.

### Build Command Issues

If build fails, try:
```bash
# Clear cache and rebuild
npm cache clean --force
npm install
npm run build
```

## Monitoring Your Deployment

- **Deployment Status**: Check the "Events" tab in your Render dashboard
- **Build Logs**: View detailed build logs for troubleshooting
- **Auto-deploy**: Monitor automatic deployments on git push

## Cost

Render offers:
- **Free Tier**: Static sites are completely free
- **Bandwidth**: 100 GB/month on free tier
- **Custom Domain**: Free on all tiers

## Next Steps

1. Set up environment variables for production
2. Configure custom domain
3. Set up monitoring and analytics
4. Enable HTTPS (automatic on Render)
5. Set up preview environments for pull requests

## Support

- Render Documentation: https://render.com/docs
- Angular Deployment Guide: https://angular.io/guide/deployment
- BracketAce Issues: Create an issue in your GitHub repository

## Quick Reference Commands

```bash
# Build locally
npm run build

# Test production build locally
npm install -g http-server
cd dist/bracket-ace/browser
http-server -p 8080

# Check for build errors
npm run build -- --configuration production

# Commit and push changes
git add .
git commit -m "Your commit message"
git push origin main
```

---

**Deployed Successfully?** Your BracketAce app should now be live at your Render URL!
