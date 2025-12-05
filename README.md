# 🏗️ RenoTimeline

> **Professional project management for renovation projects**

RenoTimeline is a modern, full-featured project management platform designed specifically for renovation and construction projects. Plan, track, and collaborate on your projects with powerful tools including Kanban boards, timelines, automated workflows, and seamless integration with CalcReno.

**🌐 Live**: [renotimeline.com](https://www.renotimeline.com)

---

## ✨ Features

### 📊 **Project Management**
- **Kanban Boards** - Visual task management with drag-and-drop
- **Timeline View** - Gantt-style project timelines
- **Task Tracking** - Detailed task management with assignments and deadlines
- **Project Dashboard** - Real-time insights and analytics

### 👥 **Team Collaboration**
- **Team Management** - Add and manage team members
- **Task Assignments** - Assign tasks to team members
- **Real-time Updates** - Stay synchronized with your team
- **Activity Feed** - Track all project activities

### 🤖 **Automation & Workflows**
- **Workflow Engine** - Automated workflows for common tasks
- **Smart Notifications** - Intelligent notification system
- **CalcReno Integration** - Seamless integration with CalcReno ecosystem
- **Event Triggers** - Automatic actions based on project events

### 📅 **Calendar & Scheduling**
- **Calendar Integration** - View and manage project schedules
- **Deadline Tracking** - Never miss important dates
- **Time Management** - Track project timelines

### 📁 **File Management**
- **File Upload** - Store and organize project files
- **Document Management** - Centralized document storage

### 📈 **Analytics & Reports**
- **Project Reports** - Comprehensive project analytics
- **Progress Tracking** - Visual progress indicators
- **Budget Tracking** - Monitor project expenses

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm (or [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- **Supabase Account** - For database and authentication

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd renotl

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 🛠️ Development

### Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Project Structure

```
renotl/
├── src/
│   ├── components/     # React components
│   ├── pages/         # Page components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utilities and services
│   ├── contexts/      # React contexts
│   └── integrations/   # External integrations
├── supabase/          # Supabase functions and migrations
└── public/            # Static assets
```

---

## 🏗️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and caching

### UI & Styling
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Component library
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library

### Backend & Database
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication
  - Real-time subscriptions
  - Edge Functions

### Additional Tools
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **date-fns** - Date utilities
- **Recharts** - Data visualization

---

## 🌐 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Configure environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

The project is configured for automatic deployments on push to main.

### Environment Variables

Create a `.env.local` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 📚 Documentation

- [Deployment Instructions](./docs/DEPLOYMENT_INSTRUCTIONS.md)
- [CalcReno Integration Guide](./docs/CALCRENO_CONNECTION_GUIDE.md)
- [Manual Testing Guide](./docs/MANUAL_TESTING_GUIDE.md)
- [Quick Setup Checklist](./docs/QUICK_SETUP_CHECKLIST.md)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is private and proprietary.

---

## 🔗 Related Projects

- **CalcReno** - Renovation cost estimation tool
- **RenoScout** - Property acquisition platform

---

**Built with ❤️ for renovation professionals**
