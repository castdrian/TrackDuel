<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# TrackDuel - Song Battle App

This is a mobile-friendly Next.js web application called TrackDuel that allows users to battle songs against each other to create ranked playlists.

## Project Context
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Vercel (serverless)
- **API Integration**: Spotify Web API

## Key Features
- Spotify playlist import and song search
- Song vs song battle interface with 30-second previews
- Mobile-first responsive design
- Playlist ranking based on battle results
- Copyable ranked results list
- Serverless architecture for Vercel deployment

## Development Guidelines
- Prioritize mobile-first responsive design
- Use Spotify Web API for all music data and previews
- Implement efficient state management for battle results
- Ensure all components work seamlessly on touch devices
- Follow Next.js App Router patterns
- Use TypeScript for type safety
- Apply modern UI/UX principles for an engaging experience

## Architecture Notes
- Use Next.js API routes for Spotify API integration
- Implement client-side state management for battle sessions
- Design for offline capability where possible
- Optimize for fast loading and smooth animations
