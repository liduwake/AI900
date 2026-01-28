# React Project

This project was bootstrapped with [Vite](https://vitejs.dev/).

## Features
- **AI-900 Quiz**: Full practice question bank.
- **User Accounts**: Sign in with Google, Facebook, X, or Instagram via Supabase.
- **Progress Tracking**: Automatically records incorrect answers.
- **Dashboard**: View your statistics and total mistake count.
- **Visitor Analytics**: Tracks site visits anonymously.

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
