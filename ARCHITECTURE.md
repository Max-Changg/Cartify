architecture.txt - Project Architecture Overview

┌─────────────────────────────────────────────────────────────────┐
│                         CARTIFY                                  │
│                   Full-Stack Application                         │
└─────────────────────────────────────────────────────────────────┘

┌────────────────────────────┐         ┌────────────────────────────┐
│         FRONTEND           │         │          BACKEND           │
│    (React + TypeScript)    │         │      (Python FastAPI)      │
├────────────────────────────┤         ├────────────────────────────┤
│                            │         │                            │
│  ┌──────────────────────┐  │         │  ┌──────────────────────┐  │
│  │   React Components   │  │         │  │   FastAPI Routes     │  │
│  │  - App.tsx           │  │         │  │  - GET /api/items    │  │
│  │  - shadcn/ui         │  │         │  │  - POST /api/items   │  │
│  │    * Button          │  │         │  │  - PUT /api/items    │  │
│  │    * Card            │  │         │  │  - DELETE /api/items │  │
│  └──────────────────────┘  │         │  └──────────────────────┘  │
│             │              │         │            │               │
│             ▼              │         │            ▼               │
│  ┌──────────────────────┐  │         │  ┌──────────────────────┐  │
│  │   Tailwind CSS       │  │         │  │  Pydantic Models     │  │
│  │   + Custom Themes    │  │         │  │  - Request/Response  │  │
│  └──────────────────────┘  │         │  │    Validation        │  │
│             │              │         │  └──────────────────────┘  │
│             ▼              │         │            │               │
│  ┌──────────────────────┐  │         │            ▼               │
│  │   Vite Dev Server    │  │◄───────►│  ┌──────────────────────┐  │
│  │   Port: 5173         │  │  HTTP   │  │  Uvicorn Server      │  │
│  └──────────────────────┘  │  CORS   │  │  Port: 8000          │  │
│                            │         │  └──────────────────────┘  │
└────────────────────────────┘         └────────────────────────────┘
        │                                           │
        └───────────────────┬───────────────────────┘
                            ▼
                   ┌─────────────────┐
                   │   Developer     │
                   │   Browser       │
                   │  localhost:5173 │
                   └─────────────────┘

TECHNOLOGY STACK:
═════════════════

Frontend:                          Backend:
- React 18                        - Python 3.8+
- TypeScript                      - FastAPI
- Vite                           - Uvicorn ASGI Server
- Tailwind CSS                   - Pydantic
- shadcn/ui                      - Python-dotenv
- Lucide React Icons
- class-variance-authority
- clsx & tailwind-merge

DATA FLOW:
══════════

1. User interacts with React UI
   │
2. TypeScript ensures type safety
   │
3. HTTP request sent to FastAPI backend
   │
4. Pydantic validates request data
   │
5. FastAPI processes request
   │
6. Response sent back to frontend
   │
7. React updates UI with new data

FILE STRUCTURE:
═══════════════

Cartify/
├── backend/
│   ├── main.py              # FastAPI app + routes
│   ├── requirements.txt     # Python dependencies
│   └── .gitignore          
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── ui/         # shadcn/ui components
│   │   ├── lib/
│   │   │   └── utils.ts    # Helper functions
│   │   ├── App.tsx         # Main component
│   │   ├── main.tsx        # Entry point
│   │   └── index.css       # Tailwind + theme
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── .vscode/                # Editor settings
├── README.md              # Full documentation
├── QUICKSTART.md          # Quick start guide
├── package.json           # Root package.json
└── start-dev.sh/.bat      # Development scripts

API ENDPOINTS:
══════════════

GET    /                    → Welcome message
GET    /api/health         → Health check
GET    /api/items          → Get all items
GET    /api/items/{id}     → Get specific item
POST   /api/items          → Create new item
PUT    /api/items/{id}     → Update item
DELETE /api/items/{id}     → Delete item

Auto-generated docs at: http://localhost:8000/docs
