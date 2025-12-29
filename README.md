<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/15unq9faw_2FLXVHSpRyIK8Oxb0xEfUPv

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deployment

This project is configured to automatically deploy to GitHub Pages using GitHub Actions.

1. Go to your repository **Settings** > **Pages**.
2. Under "Build and deployment", select **GitHub Actions**.
3. Push your changes to the `main` branch.
4. The deployment workflow will run automatically.

## Project Structure

- `src/`: Source code
- `.github/workflows/`: CI/CD configurations
- `vite.config.ts`: Vite configuration (configured for GitHub Pages base path)
