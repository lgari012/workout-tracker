import db from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await db.query(
      "SELECT * FROM weightlog WHERE user_id = $1 ORDER BY date DESC",
      [session.user.id]
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch weight log:", error);
    return NextResponse.json({ error: "Failed to fetch weight log" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { weight, date } = await request.json();

    if (!weight) {
      return NextResponse.json({ error: "Weight is required" }, { status: 400 });
    }

    const result = await db.query(
      "INSERT INTO weightlog (weight, date, user_id) VALUES ($1, COALESCE($2, NOW()), $3) RETURNING *",
      [weight, date || null, session.user.id]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Failed to insert weight log:", error);
    return NextResponse.json({ error: "Failed to insert weight log" }, { status: 500 });
  }
}