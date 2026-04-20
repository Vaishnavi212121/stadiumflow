# Cloud Run Deployment Guide for StadiumFlow

## Prerequisites
- Google Cloud CLI installed: `gcloud --version`
- Authenticated: `gcloud auth login`
- Project ID ready
- Billing enabled for the selected GCP project

## Quick Deploy

```bash
# Set your GCP project
gcloud config set project YOUR_PROJECT_ID

# Deploy to Cloud Run
gcloud run deploy stadiumflow \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=YOUR_GEMINI_KEY,NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_MAPS_KEY,GOOGLE_MAPS_API_KEY=YOUR_MAPS_KEY

# View live logs
gcloud run logs read stadiumflow --region us-central1 --limit 50
```

## Billing and Project Notes
- Cloud Run deployment requires billing enabled on the selected project.
- Confirm the project with:
```bash
gcloud config list --format='value(core.project)'
```
- If the deployment fails because the project has no billing account, enable billing for that project in the Google Cloud Console.

## ZIP Timestamp Workaround
If you see a `ZIP does not support timestamps before 1980` error during source upload, try deploying from a clean source copy:

```bash
cd /tmp
m -rf stadiumflow-deploy
cp -R /Users/vaishnavi/stadiumflow stadiumflow-deploy
cd stadiumflow-deploy
rm -rf node_modules .git .next

gcloud run deploy stadiumflow \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=YOUR_GEMINI_KEY,NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_MAPS_KEY,GOOGLE_MAPS_API_KEY=YOUR_MAPS_KEY
```

## Alternative Container Deploy
If source-based deploy still fails, build and deploy with a container image instead:

```bash
# Build and push the image
docker build -t gcr.io/YOUR_PROJECT_ID/stadiumflow .
docker push gcr.io/YOUR_PROJECT_ID/stadiumflow

# Deploy the pushed image
gcloud run deploy stadiumflow \
  --image gcr.io/YOUR_PROJECT_ID/stadiumflow \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=YOUR_GEMINI_KEY,NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_MAPS_KEY,GOOGLE_MAPS_API_KEY=YOUR_MAPS_KEY
```

## Post-Deployment
1. Update Google Maps API key restrictions to include the deployed Cloud Run URL
2. Test the live app at the deployed URL

## Environment Variables Required
- `GEMINI_API_KEY`: Your Google Gemini API key
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Public Maps API key (for client-side)
- `GOOGLE_MAPS_API_KEY`: Server-side Maps API key (optional)
