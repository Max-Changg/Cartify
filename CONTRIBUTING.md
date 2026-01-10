# Contributing to Cartify

Thank you for your interest in contributing to Cartify! This guide will help you get started.

## Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/cartify.git
   cd cartify
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

## Development Workflow

### Running the Application

Use the quick start scripts:
```bash
# Mac/Linux
./start-dev.sh

# Windows
start-dev.bat
```

Or run manually in separate terminals:

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
python main.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Making Changes

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Follow the existing code style
   - Add comments for complex logic
   - Update documentation if needed

3. **Test Your Changes**
   - Manually test in the browser
   - Ensure both frontend and backend work together
   - Check for console errors

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

## Code Style Guidelines

### Python (Backend)

- Follow PEP 8 style guide
- Use type hints
- Keep functions small and focused
- Add docstrings for complex functions

```python
def get_item(item_id: int) -> Item:
    """
    Retrieve an item by ID.
    
    Args:
        item_id: The ID of the item to retrieve
        
    Returns:
        Item object if found
    """
    # implementation
```

### TypeScript (Frontend)

- Use TypeScript types/interfaces
- Follow React best practices
- Use functional components with hooks
- Keep components small and reusable

```typescript
interface ItemProps {
  id: number
  name: string
}

const Item: React.FC<ItemProps> = ({ id, name }) => {
  // implementation
}
```

### CSS/Tailwind

- Use Tailwind utility classes first
- Create custom classes only when necessary
- Use the cn() utility for conditional classes

```tsx
<div className={cn(
  "base-classes",
  condition && "conditional-classes"
)}>
  Content
</div>
```

## Project Structure

### Adding Backend Routes

Edit `backend/main.py`:

```python
@app.get("/api/your-route")
async def your_route():
    return {"message": "Hello"}
```

### Adding Frontend Components

Create in `frontend/src/components/`:

```tsx
// YourComponent.tsx
export const YourComponent = () => {
  return <div>Your content</div>
}
```

### Adding shadcn/ui Components

```bash
cd frontend
npx shadcn@latest add [component-name]
```

## Common Tasks

### Adding a New API Endpoint

1. Define Pydantic model in `backend/main.py`
2. Create route handler
3. Test in Swagger UI (`/docs`)
4. Update frontend to call the endpoint

### Adding a New Page

1. Create component in `frontend/src/components/`
2. Import and use in `App.tsx`
3. Style with Tailwind CSS
4. Add shadcn/ui components as needed

### Installing Dependencies

**Backend:**
```bash
pip install package-name
pip freeze > requirements.txt
```

**Frontend:**
```bash
npm install package-name
```

## Testing

### Manual Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] API endpoints return expected data
- [ ] UI displays correctly
- [ ] No console errors
- [ ] Dark mode works (if applicable)
- [ ] Responsive on mobile/tablet/desktop

### Testing API Endpoints

Use the built-in Swagger UI:
1. Start backend: `python main.py`
2. Open: http://localhost:8000/docs
3. Test endpoints interactively

## Pull Request Process

1. **Update Documentation**
   - Update README.md if needed
   - Add comments to complex code
   - Update ARCHITECTURE.md for major changes

2. **Ensure Quality**
   - No console errors
   - Code follows style guidelines
   - Features work as expected

3. **Submit PR**
   - Clear title and description
   - Reference any related issues
   - Include screenshots for UI changes

4. **PR Template**
   ```markdown
   ## Description
   Brief description of changes
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update
   
   ## Testing
   - [ ] Backend tested
   - [ ] Frontend tested
   - [ ] Manual testing completed
   
   ## Screenshots (if applicable)
   Add screenshots here
   ```

## Commit Message Convention

Use conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add user authentication
fix: resolve CORS issue
docs: update installation guide
style: format code with prettier
refactor: simplify API routes
```

## Getting Help

- **Questions?** Open a discussion
- **Bugs?** Open an issue with reproduction steps
- **Features?** Open an issue with detailed description

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Focus on what's best for the project

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

Thank you for contributing! 🎉
