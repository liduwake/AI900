# React Project

This project was bootstrapped with [Vite](https://vitejs.dev/).

## Features
- **AI-900 Quiz**: Full practice question bank.
- **User Accounts**: Sign in with Google, Facebook, X, or Instagram via Supabase.
- **Offline-First Architecture**: Answers are saved locally and synced automatically when back online.
- **Optimized for Free Tier**:
    - **Batched Sync**: Mistake logs are sent in batches to minimize database writes.
    - **Smart Analytics**: Site visits are tracked once per day per user to save bandwidth and storage.
- **Dashboard**: View your statistics and total mistake count.

## Architecture
This project uses a "Local-First" approach to ensure reliability and low cost:
1.  **Mistakes Queue**: Incorrect answers are stored in `localStorage` immediately.
2.  **Sync Manager**: A background process sends these mistakes to Supabase only when you have 5+ mistakes or every 60 seconds.
3.  **Debounced Visits**: We check local storage before sending a "visit" event to ensure we never count the same user twice in one day.

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm
- Supabase Project (for Auth & Database)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure Environment:
   Create a `.env.local` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   ```

### Development

To start the development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

### Build

To build the application for production:
```bash
npm run build
```
The build artifacts will be stored in the `dist/` directory.

## Deployment

This project is configured for automated deployment via GitHub Actions.
Pushing to the `main` branch will trigger a build and deploy the `dist/` folder to GitHub Pages.

## Project Structure
- `.github/workflows`: GitHub Actions workflows
- `src/`: Source code
- `public/`: Static assets
- `vite.config.js`: Configuration

## License
MIT
