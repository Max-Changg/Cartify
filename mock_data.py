import random
import uuid
import json
import csv

# -----------------------------
# CONFIG
# -----------------------------
NUM_ITEMS = 600
OUTPUT_JSON = "amazon_fresh_mock.json"
OUTPUT_CSV = "amazon_fresh_mock.csv"

STORES = ["Amazon Fresh"]
BRANDS = [
    "Amazon Fresh", "365 Whole Foods", "Organic Valley",
    "Kirkland", "Perdue", "Chobani", "Oatly",
    "Earthbound Farm", "Lundberg", "Tyson"
]

CATEGORIES = {
    "Produce": {
        "Fruit": ["Apple", "Banana", "Orange", "Blueberries", "Strawberries"],
        "Vegetables": ["Broccoli", "Carrots", "Bell Pepper", "Zucchini"],
        "Leafy Greens": ["Spinach", "Kale", "Arugula"]
    },
    "Meat & Seafood": {
        "Poultry": ["Chicken Breast", "Chicken Thighs", "Ground Turkey"],
        "Beef": ["Ground Beef 90/10", "Sirloin Steak"],
        "Seafood": ["Salmon", "Shrimp", "Tilapia"]
    },
    "Dairy & Eggs": {
        "Milk": ["Whole Milk", "2% Milk", "Almond Milk", "Oat Milk"],
        "Yogurt": ["Greek Yogurt", "Skyr"],
        "Eggs": ["Large Eggs", "Organic Eggs"]
    },
    "Pantry": {
        "Grains": ["Brown Rice", "White Rice", "Quinoa", "Pasta"],
        "Canned Goods": ["Black Beans", "Chickpeas", "Tomato Sauce"],
        "Oils": ["Olive Oil", "Avocado Oil"]
    },
    "Frozen": {
        "Frozen Veggies": ["Frozen Broccoli", "Frozen Peas"],
        "Frozen Fruit": ["Frozen Mango", "Frozen Berries"],
        "Meals": ["Frozen Burrito Bowl", "Frozen Pizza"]
    },
    "Snacks": {
        "Protein": ["Protein Bar", "Protein Chips"],
        "Chips": ["Tortilla Chips", "Potato Chips"],
        "Nuts": ["Almonds", "Trail Mix"]
    },
    "Beverages": {
        "Water": ["Sparkling Water", "Mineral Water"],
        "Coffee": ["Cold Brew", "Iced Latte"],
        "Protein": ["Protein Shake"]
    }
}

TAGS = [
    "high-protein", "low-carb", "vegan", "vegetarian",
    "organic", "budget", "bulk-friendly", "keto",
    "gluten-free", "micronutrient-dense"
]

UNITS = ["per lb", "12 oz", "16 oz", "32 oz", "1 count", "6 pack", "12 pack"]

# -----------------------------
# HELPERS
# -----------------------------
def random_price(category):
    ranges = {
        "Produce": (0.99, 4.99),
        "Meat & Seafood": (3.99, 14.99),
        "Dairy & Eggs": (2.49, 7.99),
        "Pantry": (1.49, 8.99),
        "Frozen": (2.99, 9.99),
        "Snacks": (1.99, 6.99),
        "Beverages": (1.49, 5.99)
    }
    low, high = ranges.get(category, (1.99, 9.99))
    return round(random.uniform(low, high), 2)


def nutrition_profile(category):
    if category == "Meat & Seafood":
        return random.randint(120, 300), random.uniform(18, 40), 0, random.uniform(2, 15)
    if category == "Produce":
        return random.randint(20, 120), random.uniform(1, 5), random.uniform(5, 25), 0
    if category == "Dairy & Eggs":
        return random.randint(80, 200), random.uniform(6, 20), random.uniform(3, 12), random.uniform(3, 10)
    if category == "Snacks":
        return random.randint(150, 300), random.uniform(3, 15), random.uniform(10, 30), random.uniform(7, 20)
    return random.randint(100, 250), random.uniform(2, 15), random.uniform(10, 45), random.uniform(1, 15)


def generate_product():
    category = random.choice(list(CATEGORIES.keys()))
    subcategory = random.choice(list(CATEGORIES[category].keys()))
    base_name = random.choice(CATEGORIES[category][subcategory])

    calories, protein, carbs, fat = nutrition_profile(category)

    return {
        "product_id": f"AF-{uuid.uuid4()}",
        "name": base_name,
        "brand": random.choice(BRANDS),
        "category": category,
        "subcategory": subcategory,
        "price": random_price(category),
        "unit": random.choice(UNITS),
        "store": random.choice(STORES),
        "organic": random.choice([True, False]),
        "calories": calories,
        "protein_g": round(protein, 1),
        "carbs_g": round(carbs, 1),
        "fat_g": round(fat, 1),
        "tags": random.sample(TAGS, k=random.randint(2, 4)),
        "image_url": "https://images.amazon.com/mock-product.jpg"
    }


# -----------------------------
# GENERATE DATASET
# -----------------------------
dataset = [generate_product() for _ in range(NUM_ITEMS)]

# -----------------------------
# EXPORT JSON
# -----------------------------
with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
    json.dump(dataset, f, indent=2)

# -----------------------------
# EXPORT CSV
# -----------------------------
with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=dataset[0].keys())
    writer.writeheader()
    for item in dataset:
        writer.writerow(item)

print(f"✅ Generated {NUM_ITEMS} items")
print(f"📦 JSON → {OUTPUT_JSON}")
print(f"📦 CSV  → {OUTPUT_CSV}")


# -----------------------------
# SAMPLE QUERY FUNCTIONS
# -----------------------------
def high_protein_under(price_limit=5):
    return [
        p for p in dataset
        if p["price"] <= price_limit and "high-protein" in p["tags"]
    ]


def vegetarian_bulk():
    return [
        p for p in dataset
        if p["category"] in ["Produce", "Pantry"]
        and ("vegetarian" in p["tags"] or "vegan" in p["tags"])
    ]


def store_breakdown():
    stores = {}
    for p in dataset:
        stores.setdefault(p["store"], []).append(p)
    return stores
