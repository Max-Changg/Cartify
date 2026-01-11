import { NextRequest, NextResponse } from "next/server";
import { addItemToWeeeCart } from "@/lib/weee-browser";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body;
    console.log('[WEEE ADD TO CART] itemName received:', items);

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Items array is required" },
        { status: 400 }
      );
    }

    let successCount = 0;
    const failures: string[] = [];

    for (const itemName of items) {
      try {
        const result = await addItemToWeeeCart(itemName);
        if (result.success) {
          successCount++;
        } else {
          failures.push(itemName);
        }
      } catch {
        failures.push(itemName);
      }
    }

    return NextResponse.json({
      success: true,
      added: successCount,
      failed: failures,
    });
  } catch (error) {
    console.error("❌ Weee bulk add error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
