from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn

app = FastAPI(title="Cartify API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class Item(BaseModel):
    id: Optional[int] = None
    name: str
    description: str
    price: float

# In-memory storage (replace with database in production)
items_db: List[Item] = []
item_id_counter = 1

# Routes
@app.get("/")
async def root():
    return {"message": "Welcome to Cartify API"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api/items", response_model=List[Item])
async def get_items():
    return items_db

@app.get("/api/items/{item_id}", response_model=Item)
async def get_item(item_id: int):
    for item in items_db:
        if item.id == item_id:
            return item
    return {"error": "Item not found"}

@app.post("/api/items", response_model=Item)
async def create_item(item: Item):
    global item_id_counter
    item.id = item_id_counter
    item_id_counter += 1
    items_db.append(item)
    return item

@app.put("/api/items/{item_id}", response_model=Item)
async def update_item(item_id: int, item: Item):
    for i, existing_item in enumerate(items_db):
        if existing_item.id == item_id:
            item.id = item_id
            items_db[i] = item
            return item
    return {"error": "Item not found"}

@app.delete("/api/items/{item_id}")
async def delete_item(item_id: int):
    for i, item in enumerate(items_db):
        if item.id == item_id:
            items_db.pop(i)
            return {"message": "Item deleted successfully"}
    return {"error": "Item not found"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
