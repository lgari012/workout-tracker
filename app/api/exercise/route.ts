import db from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  const query = userId
    ? { text: "SELECT * FROM exercise WHERE user_id IS NULL OR user_id = $1", values: [userId] }
    : { text: "SELECT * FROM exercise WHERE user_id IS NULL", values: [] };

  const exercises = await db.query(query);
  return NextResponse.json(exercises.rows);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, muscle_group } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const result = await db.query(
      "INSERT INTO exercise (name, muscle_group, user_id) VALUES ($1, $2, $3) RETURNING *",
      [name, muscle_group || null, session.user.id]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Failed to create exercise:", error);
    return NextResponse.json({ error: "Failed to create exercise" }, { status: 500 });
  }
}