# Supabase Proxy Server

A proxy server that handles Supabase database operations for the Chrome extension.

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   PORT=3000
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

This project is configured for deployment on Vercel. To deploy:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in the Vercel dashboard
4. Deploy!

## API Endpoints

### GET /rest/v1/Database

Query activation codes.

### PATCH /rest/v1/Database

Update activation code data.

## Environment Variables

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `PORT`: Server port (default: 3000)
