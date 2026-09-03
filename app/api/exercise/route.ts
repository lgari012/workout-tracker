import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const exercises = await db.query("SELECT * FROM exercise");
    return NextResponse.json(exercises.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch exercises" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, muscle_group } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const result = await db.query(
      "INSERT INTO exercise (name, muscle_group) VALUES ($1, $2) RETURNING *",
      [name, muscle_group]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create exercise" }, { status: 500 });
  }
}