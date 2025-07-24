# Siidaa Music Admin Dashboard

A modern admin dashboard for managing the Siidaa Music platform, built with Next.js 15 and shadcn/ui with full authentication system.

## Features

- 🔐 **Authentication System** - JWT-based login with Django backend
- 📊 **Dashboard Overview** - Real-time metrics from Django API
- 🎤 **Artist Management** - Manage artist profiles and content
- 💿 **Album Management** - Handle album uploads and metadata
- 🎵 **Song Management** - Track individual songs and their performance
- 👥 **User Management** - Manage user accounts and subscriptions
- 💳 **Payment Tracking** - Monitor transactions and revenue
- 📈 **Analytics** - View platform statistics and trends
- ⚙️ **Settings** - Configure platform settings
- 🛡️ **Protected Routes** - Admin-only access with session management

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Authentication**: JWT tokens with Django REST Framework
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **TypeScript**: Full type safety
- **State Management**: React Context for auth state

## Authentication System

### Login Requirements
- **Admin Access**: Only users with `is_staff=True` or `is_superuser=True` can access the admin dashboard
- **JWT Tokens**: Uses Django REST Framework's JWT authentication
- **Session Management**: Automatic token refresh and logout on expiration

### Protected Routes
All admin pages are protected and require authentication:
- Automatic redirect to `/login` for unauthenticated users
- Automatic redirect to `/` for authenticated users accessing `/login`
- Token validation on each API request

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   Create `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://13.60.30.188:8000
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Access the admin dashboard**:
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - You'll be redirected to `/login` if not authenticated
   - Login with Django admin credentials (staff/superuser account required)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── artists/           # Artist management
│   ├── albums/            # Album management
│   ├── songs/             # Song management
│   ├── users/             # User management
│   └── page.tsx           # Dashboard homepage
├── components/
│   ├── ui/                # shadcn/ui components
│   └── layout/            # Layout components
└── lib/
    └── utils.ts           # Utility functions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Adding New Components

To add new shadcn/ui components:

```bash
npx shadcn@latest add [component-name]
```

## Environment Variables

Create a `.env.local` file for environment-specific configuration:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
API_SECRET_KEY=your-secret-key

# Database (if needed)
DATABASE_URL=your-database-url
```

## Deployment

The admin dashboard can be deployed to any platform that supports Next.js:

- **Vercel** (recommended)
- **Netlify**
- **Railway**
- **Docker**

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is part of the Siidaa Music platform.