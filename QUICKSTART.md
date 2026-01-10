# Cartify - Quick Start Guide

## 🎉 Your full-stack baseline is ready!

This repository contains a complete full-stack web application with:
- **Backend**: Python FastAPI
- **Frontend**: React TypeScript with Vite
- **Styling**: Tailwind CSS + shadcn/ui

## 📁 Project Structure

```
Cartify/
├── backend/                    # Python FastAPI backend
│   ├── main.py                # Main application with API routes
│   ├── requirements.txt       # Python dependencies
│   └── package.json          # Backend metadata
├── frontend/                  # React TypeScript frontend
│   ├── src/
│   │   ├── components/ui/    # shadcn/ui components
│   │   ├── lib/utils.ts      # Utility functions
│   │   ├── App.tsx           # Main application
│   │   └── index.css         # Tailwind styles
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── components.json       # shadcn/ui config
├── .vscode/                   # VSCode settings
├── README.md                  # Full documentation
├── start-dev.sh              # Quick start script (Mac/Linux)
└── start-dev.bat             # Quick start script (Windows)
```

## 🚀 Quick Start

### Option 1: Automatic Setup (Recommended)

**Mac/Linux:**
```bash
./start-dev.sh
```

**Windows:**
```bash
start-dev.bat
```

This will automatically:
1. Create Python virtual environment
2. Install all dependencies
3. Start both backend and frontend servers

### Option 2: Manual Setup

#### Backend (Terminal 1)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Backend runs at: http://localhost:8000

#### Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

## 🎨 What's Included

### Backend Features
✅ FastAPI REST API with CRUD operations
✅ CORS configured for local development
✅ Pydantic models for validation
✅ Auto-generated API docs at `/docs`
✅ Health check endpoint

### Frontend Features
✅ React 18 with TypeScript
✅ Vite for fast development
✅ Tailwind CSS for styling
✅ shadcn/ui components (Button, Card)
✅ Lucide React icons
✅ Path aliases configured (`@/*`)
✅ Dark mode support

### Available shadcn/ui Components
- Button (with multiple variants)
- Card (with Header, Content, Footer)

To add more components:
```bash
cd frontend
npx shadcn@latest add input
npx shadcn@latest add dialog
npx shadcn@latest add table
```

## 📚 API Endpoints

- `GET /` - Welcome message
- `GET /api/health` - Health check
- `GET /api/items` - List all items
- `POST /api/items` - Create item
- `PUT /api/items/{id}` - Update item
- `DELETE /api/items/{id}` - Delete item

Full API documentation: http://localhost:8000/docs

## 🛠️ Development Tips

### Adding New shadcn/ui Components
```bash
cd frontend
npx shadcn@latest add [component-name]
```

Popular components to add:
- `input` - Form inputs
- `dialog` - Modals
- `table` - Data tables
- `form` - Form handling
- `select` - Dropdowns
- `toast` - Notifications

### VSCode Extensions (Recommended)
The project includes recommended extensions. VSCode will prompt you to install them:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Python
- Pylance

### Folder Organization
```
frontend/src/
├── components/
│   ├── ui/           # shadcn/ui components
│   └── [feature]/    # Your feature components
├── lib/
│   └── utils.ts      # Utility functions
├── hooks/            # Custom React hooks
└── pages/            # Page components
```

## 🎯 Next Steps

1. **Database Integration**
   - Add PostgreSQL/MongoDB
   - Use SQLAlchemy (Python) or Prisma (Node.js)

2. **Authentication**
   - JWT tokens
   - OAuth providers

3. **State Management**
   - Zustand (recommended)
   - Redux Toolkit

4. **Testing**
   - Backend: pytest
   - Frontend: Vitest + React Testing Library

5. **Deployment**
   - Backend: Railway, Heroku, or AWS
   - Frontend: Vercel, Netlify, or Cloudflare Pages

## 📖 Useful Commands

### Backend
```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
python main.py

# Run with uvicorn directly
uvicorn main:app --reload
```

### Frontend
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Add shadcn component
npx shadcn@latest add [component]
```

## 🐛 Troubleshooting

### Backend not connecting?
- Check if port 8000 is available
- Ensure virtual environment is activated
- Verify all dependencies are installed

### Frontend not loading?
- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Check if port 5173 is available
- Ensure backend is running first

### CORS errors?
- Backend CORS is configured for `http://localhost:5173`
- If using different port, update in `backend/main.py`

## 🎨 Customization

### Change Theme Colors
Edit `frontend/src/index.css` - modify CSS variables under `:root` and `.dark`

### Update Backend Port
Edit `backend/main.py` - change port in `uvicorn.run()`

### Update Frontend Port
Edit `frontend/vite.config.ts` - add server config:
```typescript
export default defineConfig({
  server: {
    port: 3000
  }
})
```

## 📝 License

MIT

---

**Happy coding! 🚀**

For more details, see the main [README.md](README.md)
