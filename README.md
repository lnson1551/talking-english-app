# Talking English - Real-time Voice Chat App

A real-time voice chat application for English practice, built with Next.js, Supabase, and WebRTC.

## Features

- 🔐 **User Authentication**: Sign up, login, and password reset
- 👤 **User Profiles**: Display names for better identification
- 🏠 **Room Management**: Create and join voice chat rooms
- 🎤 **Real-time Audio**: WebRTC peer-to-peer voice communication
- 🔇 **Mic Controls**: Mute/unmute functionality
- 👥 **Participant Management**: See who's in the room and their status
- 📊 **Audio Visualization**: Real-time volume levels and audio controls
- 🔄 **Auto-reconnection**: Handles connection drops gracefully

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime + WebRTC
- **Audio**: WebRTC MediaStream API

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd talking-english-app
npm install
```

### 2. Supabase Setup

1. Go to [Supabase](https://supabase.com) and create a new project
2. Copy your project URL and anon key from Settings > API
3. Update the Supabase configuration in `lib/supabase.ts`:

```typescript
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'
```

### 3. Database Setup

1. Go to your Supabase project's SQL Editor
2. Copy and paste the contents of `database-schema.sql`
3. Run the SQL to create the necessary tables and policies

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### For Users

1. **Sign Up**: Create an account with your email
2. **Set Display Name**: Choose how you want to be identified
3. **Create or Join Room**: 
   - Create a new room with a custom name
   - Join existing rooms from the list
4. **Voice Chat**: 
   - Allow microphone access when prompted
   - Use the mic toggle to mute/unmute
   - See other participants and their audio levels
5. **Leave Room**: Click "Leave Room" to exit

### For Developers

#### Project Structure

```
├── app/                    # Next.js app directory
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   ├── forgot-password/   # Password reset
│   ├── create-room/       # Room creation
│   ├── join-room/         # Room joining
│   └── room/[roomId]/     # Voice chat room
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── profile-setup.tsx # Profile setup modal
│   └── audio-controls.tsx # Audio controls
├── contexts/             # React contexts
│   └── auth-context.tsx  # Authentication context
├── lib/                  # Utility functions
│   ├── supabase.ts       # Supabase client
│   ├── database.ts       # Database functions
│   └── utils.ts          # General utilities
└── database-schema.sql   # Database schema
```

#### Key Components

- **AuthContext**: Manages user authentication state
- **ProfileSetup**: Handles new user profile creation
- **AudioControls**: Manages remote audio streams and visualization
- **RoomPage**: Main voice chat interface with WebRTC integration

#### WebRTC Implementation

The app uses WebRTC for peer-to-peer audio communication:

1. **Signaling**: Supabase Realtime channels exchange SDP offers/answers and ICE candidates
2. **Peer Connections**: Each participant creates connections to other participants
3. **Audio Streams**: Local microphone stream is shared with all peers
4. **Remote Audio**: Remote streams are played through hidden audio elements

#### Database Schema

- **user_profiles**: User display names and metadata
- **rooms**: Voice chat rooms with names and status
- **room_participants**: Tracks who's in each room and their mute status

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Browser Support

- Chrome 66+
- Firefox 60+
- Safari 14+
- Edge 79+

**Note**: WebRTC requires HTTPS in production for microphone access.

## Troubleshooting

### Common Issues

1. **Microphone not working**: Check browser permissions and HTTPS
2. **Connection issues**: Verify Supabase configuration and network
3. **Audio not playing**: Check browser autoplay policies
4. **Database errors**: Ensure schema is properly set up

### Development Tips

- Use browser dev tools to monitor WebRTC connections
- Check Supabase logs for real-time connection issues
- Test with multiple browser tabs to simulate multiple users

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the troubleshooting section
- Review browser console for errors
- Ensure all dependencies are up to date 