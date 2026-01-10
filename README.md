# Cartify

A modern full-stack web application starter template with Python backend and React TypeScript frontend.

## Tech Stack

### Backend
- **FastAPI** - Modern, fast web framework for building APIs
- **Uvicorn** - Lightning-fast ASGI server
- **Pydantic** - Data validation using Python type annotations
- **Python 3.x** - Latest Python version

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe JavaScript
- **Vite** - Next generation frontend tooling
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautifully designed components
- **Lucide React** - Beautiful & consistent icons

## Project Structure

```
Cartify/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   └── .gitignore          # Backend gitignore
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── ui/         # shadcn/ui components
│   │   ├── lib/
│   │   │   └── utils.ts    # Utility functions
│   │   ├── App.tsx         # Main application component
│   │   ├── main.tsx        # Application entry point
│   │   └── index.css       # Global styles with Tailwind
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── components.json     # shadcn/ui configuration
└── README.md
```

## Getting Started

### Prerequisites
- Python 3.8 or higher
- Node.js 18 or higher
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
- On macOS/Linux:
```bash
source venv/bin/activate
```
- On Windows:
```bash
venv\Scripts\activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Run the development server:
```bash
python main.py
```

The backend API will be available at `http://localhost:8000`

#### API Endpoints

- `GET /` - Welcome message
- `GET /api/health` - Health check endpoint
- `GET /api/items` - Get all items
- `GET /api/items/{item_id}` - Get a specific item
- `POST /api/items` - Create a new item
- `PUT /api/items/{item_id}` - Update an item
- `DELETE /api/items/{item_id}` - Delete an item

API documentation is available at `http://localhost:8000/docs`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Development

### Backend Development

The FastAPI backend includes:
- CORS middleware configured for local development
- RESTful API with full CRUD operations
- Pydantic models for request/response validation
- Auto-generated API documentation (Swagger UI)

To add new endpoints, edit `backend/main.py`.

### Frontend Development

The React frontend includes:
- TypeScript for type safety
- Tailwind CSS for styling
- shadcn/ui components (Button, Card)
- Path aliases configured (`@/*` → `src/*`)
- Lucide React icons

To add new shadcn/ui components:
```bash
npx shadcn@latest add [component-name]
```

For example:
```bash
npx shadcn@latest add input
npx shadcn@latest add dialog
npx shadcn@latest add table
```

### Building for Production

#### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

#### Frontend
```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`.

## Environment Variables

### Backend
Create a `.env` file in the `backend` directory (see `.env.example`):
```env
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True
```

### Frontend
Create a `.env` file in the `frontend` directory if needed:
```env
VITE_API_URL=http://localhost:8000
```

## Features

✅ Modern Python backend with FastAPI  
✅ Type-safe React frontend with TypeScript  
✅ Beautiful UI components with shadcn/ui  
✅ Utility-first styling with Tailwind CSS  
✅ Fast development with Vite HMR  
✅ CORS configured for local development  
✅ Auto-generated API documentation  
✅ Path aliases for clean imports  
✅ Dark mode support built-in  

## Next Steps

- [ ] Add database integration (PostgreSQL, MongoDB, etc.)
- [ ] Implement authentication (JWT, OAuth)
- [ ] Add state management (Zustand, Redux)
- [ ] Set up testing (Pytest, Vitest)
- [ ] Configure CI/CD pipeline
- [ ] Add Docker configuration
- [ ] Implement logging and monitoring

## License

MIT

## Contributing

Feel free to submit issues and enhancement requests!
