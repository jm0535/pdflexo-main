# PDFlexo Vercel Deployment Guide

This guide provides instructions for deploying PDFlexo to Vercel with production, preview, and development environments as subdomains.

## Prerequisites

- A Vercel account
- Your domain configured in Vercel
- Git repository with your PDFlexo codebase

## Deployment Setup

### 1. Connect Your Repository to Vercel

1. Log in to your Vercel account
2. Click "Add New" → "Project"
3. Import your PDFlexo repository
4. Configure the project with the following settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 2. Configure Environment Variables

Set up the following environment variables in your Vercel project settings:

#### Production Environment (main branch)
- `VITE_APP_ENV`: `production`
- `VITE_APP_BASE_URL`: `https://pdflexo.yourdomain.com`
- `VITE_APP_API_URL`: `https://api.yourdomain.com`

#### Preview Environment (preview branch)
- `VITE_APP_ENV`: `preview`
- `VITE_APP_BASE_URL`: `https://preview-pdflexo.yourdomain.com`
- `VITE_APP_API_URL`: `https://preview-api.yourdomain.com`

#### Development Environment (development branch)
- `VITE_APP_ENV`: `development`
- `VITE_APP_BASE_URL`: `https://dev-pdflexo.yourdomain.com`
- `VITE_APP_API_URL`: `https://dev-api.yourdomain.com`

### 3. Configure Domain and Subdomains

1. Go to your Vercel project settings
2. Navigate to "Domains"
3. Add the following domains:
   - `pdflexo.yourdomain.com` (Production)
   - `preview-pdflexo.yourdomain.com` (Preview)
   - `dev-pdflexo.yourdomain.com` (Development)

4. Configure the domain settings:
   - For Production: Set `pdflexo.yourdomain.com` to deploy from the `main` branch
   - For Preview: Set `preview-pdflexo.yourdomain.com` to deploy from the `preview` branch
   - For Development: Set `dev-pdflexo.yourdomain.com` to deploy from the `development` branch

### 4. Git Branch Setup

Ensure you have the following branches in your repository:
- `main` (for production)
- `preview` (for preview/staging)
- `development` (for development)

## Deployment Process

### Automatic Deployments

With the configuration in place, Vercel will automatically deploy:
- Production environment when you push to the `main` branch
- Preview environment when you push to the `preview` branch
- Development environment when you push to the `development` branch

### Manual Deployments

You can also trigger manual deployments from the Vercel dashboard:

1. Go to your project in the Vercel dashboard
2. Click "Deployments"
3. Click "Deploy" and select the branch you want to deploy

## Testing Your Deployment

After deployment, you can access your environments at:
- Production: `https://pdflexo.yourdomain.com`
- Preview: `https://preview-pdflexo.yourdomain.com`
- Development: `https://dev-pdflexo.yourdomain.com`

## Troubleshooting

If you encounter issues with your deployment:

1. Check the build logs in the Vercel dashboard
2. Verify that your environment variables are correctly set
3. Ensure your domain DNS settings are properly configured
4. Check that the `vercel.json` file is correctly formatted

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#vercel)
