# Cartify

A modern full-stack application built with **Next.js 15 App Router**, **TypeScript**, **Tailwind CSS v4**, and **shadcn/ui**.

> **Note**: This project was recently migrated from Python FastAPI + React to a unified Next.js application. See [MIGRATION.md](MIGRATION.md) for details.

## 🚀 Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS v4** - Utility-first CSS framework
- **shadcn/ui** - Beautiful UI components
- **Zod** - TypeScript-first schema validation
- **Lucide React** - Beautiful icons

## 📁 Project Structure

```
Cartify/
├── app/
│   ├── api/                    # Backend API Route Handlers
│   │   ├── health/            # Health check endpoint
│   │   ├── items/             # Items CRUD endpoints
│   │   └── route.ts           # Root API endpoint
│   ├── components/ui/         # shadcn/ui components
│   ├── lib/                   # Utilities and data models
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page
│   └── globals.css           # Global styles
├── public/                    # Static assets
├── next.config.ts            # Next.js configuration
├── tailwind.config.ts        # Tailwind CSS configuration
└── tsconfig.json             # TypeScript configuration
```

## 🏃 Getting Started

### Prerequisites
- Node.js 18 or higher
- npm, yarn, or pnpm

### Installation

1. **Clone the repository** (or use your existing one)
```bash
cd Cartify
```

2. **Install dependencies**
```bash
npm install
```

3. **Run the development server**
```bash
npm run dev
```

4. **Open your browser**
```
http://localhost:3000
```

## 📚 API Endpoints

All API routes are located in `app/api/`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api` | Welcome message |
| GET | `/api/health` | Health check |
| GET | `/api/items` | Get all items |
| POST | `/api/items` | Create a new item |
| GET | `/api/items/[id]` | Get item by ID |
| PUT | `/api/items/[id]` | Update item by ID |
| DELETE | `/api/items/[id]` | Delete item by ID |

### Example Request

```typescript
// Create an item
const response = await fetch('/api/items', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Sample Item',
    description: 'A sample item',
    price: 29.99
  })
})
const item = await response.json()
```

## 🎨 UI Components

This project uses **shadcn/ui** components. Current components:
- Button
- Card (with Header, Content, Footer)

### Adding More Components

```bash
npx shadcn@latest add [component-name]
```

Popular components to add:
```bash
npx shadcn@latest add input
npx shadcn@latest add dialog
npx shadcn@latest add table
npx shadcn@latest add form
npx shadcn@latest add select
npx shadcn@latest add toast
```

## 🔧 Development

### Project Scripts

```bash
# Development
npm run dev          # Start dev server with Turbopack

# Production
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint
```

### Environment Variables

Create a `.env.local` file for local environment variables:

```env
# Example environment variables
DATABASE_URL=your_database_url
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## 🗄️ Data Storage

Currently using **in-memory storage** for demo purposes. To add a database:

### Option 1: Prisma + PostgreSQL

```bash
npm install prisma @prisma/client
npx prisma init
```

Then define your schema in `prisma/schema.prisma` and run:
```bash
npx prisma migrate dev
npx prisma generate
```

### Option 2: MongoDB + Mongoose

```bash
npm install mongoose
```

## 🚀 Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Vercel will auto-detect Next.js and deploy

### Other Platforms
- **Netlify**: Supports Next.js
- **Railway**: Full-stack deployment
- **AWS Amplify**: Scalable hosting

## 📖 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Zod](https://zod.dev/)

## 🎯 Features

✅ **Unified full-stack app** - Frontend and backend in one codebase  
✅ **Type-safe** - TypeScript everywhere  
✅ **Modern UI** - Tailwind CSS v4 + shadcn/ui  
✅ **API Routes** - Next.js Route Handlers for backend logic  
✅ **Validation** - Zod schemas for data validation  
✅ **Hot reload** - Fast refresh for both frontend and backend  
✅ **Dark mode** - Built-in dark mode support  
✅ **Responsive** - Mobile-first design  

## 🛠️ Next Steps

- [ ] Add database integration (Prisma, MongoDB)
- [ ] Implement authentication (NextAuth.js)
- [ ] Add form validation (React Hook Form + Zod)
- [ ] Set up testing (Jest + React Testing Library)
- [ ] Add more shadcn/ui components
- [ ] Configure environment variables
- [ ] Set up CI/CD pipeline

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please check out [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

**Built with ❤️ using Next.js 15**
