import { NextResponse } from "next/server"
import { generateRecipes } from "@/lib/recipeEngine"

export async function POST(req: Request) {
  try {
    const raw = await req.text()

    if (!raw) {
      return NextResponse.json(
        { error: "Empty request body" },
        { status: 400 }
      )
    }

    let body: any
    try {
      body = JSON.parse(raw)
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      )
    }

    const { prompt } = body

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Invalid prompt" },
        { status: 400 }
      )
    }

    const result = await generateRecipes(prompt)
    return NextResponse.json(result)
  } catch (err) {
    console.error("API ERROR:", err)
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}
