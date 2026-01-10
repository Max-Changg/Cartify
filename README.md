# Cartify

Cartify is an AI-powered health and wellness shopping assistant that helps users plan meals and order groceries more efficiently. It uses natural conversation to understand a user’s dietary preferences and health goals, then generates personalized grocery lists and recipe suggestions. Cartify integrates directly with Weee! to streamline the process from planning to checkout.

## Why We Built It

Meal planning and grocery shopping are time-consuming, especially for people with specific dietary needs or health goals. Existing tools often require manual searching, list building, and constant app switching. We built Cartify to reduce this friction by combining conversational AI, recipe intelligence, and direct grocery platform integration into a single workflow.

## What It Does

Cartify allows users to interact via text or voice to describe their goals (such as weight loss or muscle gain), dietary restrictions, and cuisine preferences. Based on this input, it generates a tailored shopping list and suggests recipes that use those ingredients to minimize waste. Users can refine the list through continued conversation, then automatically populate their Weee! cart and complete checkout with a final review.

## Tech Stack

**Frontend**

* React 18
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui (Radix UI)

**Backend**

* Python 3.8+
* FastAPI
* Uvicorn
* Pydantic

**AI & Integrations**

* Deepgram API (speech-to-text and text-to-speech)
* Weee! platform integration
