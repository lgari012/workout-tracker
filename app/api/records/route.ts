import db from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Scope the personal records query through the workouts or sets table tied to this user
    const result = await db.query(
      `SELECT e.name AS exercise_name, MAX(s.weight) AS max_weight 
       FROM sets s
       JOIN workouts w ON s.workout_id = w.id
       JOIN exercise e ON s.exercise_id = e.id
       WHERE w.user_id = $1
       GROUP BY e.name`,
      [session.user.id]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch personal records:", error);
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 });
  }
}