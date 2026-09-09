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
      "SELECT * FROM workouts WHERE user_id = $1 ORDER BY date DESC",
      [session.user.id]
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch workouts:", error);
    return NextResponse.json({ error: "Failed to fetch workouts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await db.connect(); // Changed to db.connect()

  try {
    const { name, date, sets } = await request.json();

    if (!sets || !Array.isArray(sets) || sets.length === 0) {
      return NextResponse.json({ error: "Workout must contain at least one set" }, { status: 400 });
    }

    for (const set of sets) {
      // Enhanced validation to catch NaN or explicitly null values
      if (
        set.weight == null || Number.isNaN(set.weight) || 
        set.reps == null || Number.isNaN(set.reps) || 
        !set.exerciseId
      ) {
        return NextResponse.json({ error: "Each set must include valid numerical weight, reps, and an exerciseId" }, { status: 400 });
      }

      const exerciseCheck = await client.query(
        "SELECT id FROM exercise WHERE id = $1 AND (user_id IS NULL OR user_id = $2)",
        [set.exerciseId, session.user.id]
      );

      if (exerciseCheck.rows.length === 0) {
        return NextResponse.json({ error: `Invalid exercise ID: ${set.exerciseId}` }, { status: 400 });
      }
    }

    await client.query("BEGIN");

    const workoutResult = await client.query(
      "INSERT INTO workouts (name, date, user_id) VALUES ($1, COALESCE($2, NOW()), $3) RETURNING *",
      [name || "Workout", date || null, session.user.id]
    );
    const workoutId = workoutResult.rows[0].id;

    const insertedSets = [];
    for (const set of sets) {
      const setResult = await client.query(
        "INSERT INTO sets (workout_id, exercise_id, weight, reps, set_number) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [workoutId, set.exerciseId, set.weight, set.reps, set.setNumber || 1]
      );
      insertedSets.push(setResult.rows[0]);
    }

    await client.query("COMMIT");

    return NextResponse.json({
      workout: workoutResult.rows[0],
      sets: insertedSets,
    }, { status: 201 });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to log workout transaction:", error);
    return NextResponse.json({ error: "Failed to log workout" }, { status: 500 });
  } finally {
    client.release();
  }
}