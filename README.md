# Velocity - Email at the Speed of Thought

A blazing fast, multi-account email client inspired by Superhuman. Connect your Google (Gmail/Workspace) and Microsoft (Outlook/365) accounts and manage all your email from a single, keyboard-driven interface.

## Features

- **Multi-Account Support** - Connect multiple Google and Microsoft email accounts
- **Unified Inbox** - View all emails across accounts in one stream
- **Split View** - Read and triage emails side-by-side
- **Keyboard Shortcuts** - Vim-style navigation (J/K, G+I, G+S, etc.)
- **Command Palette** - `Cmd+K` to access any action instantly
- **Fast Search** - Search across all accounts with advanced filters
- **Compose** - Rich text email composition with reply/forward
- **Dark Theme** - Beautiful dark UI designed for focus

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `J` / `K` | Navigate down / up |
| `Enter` / `O` | Open email thread |
| `U` / `Escape` | Go back to list |
| `C` | Compose new email |
| `/` | Search |
| `Cmd+K` | Command palette |
| `E` | Archive |
| `#` | Delete |
| `S` | Star/unstar |
| `G I` | Go to Inbox |
| `G S` | Go to Starred |
| `G T` | Go to Sent |
| `G D` | Go to Drafts |
| `G A` | Go to All Mail |

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure OAuth credentials

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

#### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new OAuth 2.0 Client ID (Web application)
3. Add `http://localhost:3000/api/auth/callback/google` as an Authorized redirect URI
4. Enable the **Gmail API** in the API Library
5. Copy Client ID and Client Secret to `.env.local`

#### Microsoft OAuth Setup
1. Go to [Azure Portal - App Registrations](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps)
2. Register a new application
3. Add `http://localhost:3000/api/auth/callback/azure-ad` as a Redirect URI (Web)
4. Under API Permissions, add: `Mail.Read`, `Mail.Send`, `Mail.ReadWrite`, `offline_access`
5. Create a client secret and copy ID + Secret to `.env.local`

#### NextAuth Secret
Generate a secret:
```bash
openssl rand -base64 32
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start using Velocity.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Auth**: NextAuth.js (Google + Azure AD)
- **State**: Zustand
- **Email APIs**: Gmail API (googleapis) + Microsoft Graph API
- **Icons**: Lucide React

## Architecture

```
src/
├── app/                  # Next.js app router pages & API routes
│   ├── api/
│   │   ├── auth/         # NextAuth endpoints
│   │   └── emails/       # Email CRUD API routes
│   ├── auth/signin/      # Sign-in page
│   └── page.tsx          # Main email client page
├── components/
│   ├── common/           # Search, Command Palette, Account Manager
│   ├── compose/          # Email composition modal
│   ├── email/            # Email list and detail views
│   └── layout/           # Sidebar navigation
├── lib/
│   ├── auth.ts           # NextAuth configuration
│   ├── google-mail.ts    # Gmail API integration
│   ├── microsoft-mail.ts # Microsoft Graph integration
│   ├── hooks.ts          # Custom React hooks
│   └── utils.ts          # Utility functions
├── store/
│   └── email-store.ts    # Zustand global state
└── types/
    └── index.ts          # TypeScript type definitions
```
