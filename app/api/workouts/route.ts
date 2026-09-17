import db from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Limit workouts first in a CTE, then join sets to prevent truncating mid-workout
    const result = await db.query(
      `WITH recent_workouts AS (
         SELECT id, name, date 
         FROM workouts 
         WHERE user_id = $1 
         ORDER BY date DESC, id DESC 
         LIMIT 10
       )
       SELECT rw.id AS workout_id, rw.name AS workout_name, rw.date, 
              s.exercise_id, s.weight, s.reps, s.set_number
       FROM recent_workouts rw
       JOIN sets s ON rw.id = s.workout_id
       ORDER BY rw.date DESC, rw.id DESC, s.set_number ASC`,
      [session.user.id]
    );

    const workoutsMap = new Map();
    for (const row of result.rows) {
      if (!workoutsMap.has(row.workout_id)) {
        workoutsMap.set(row.workout_id, {
          id: row.workout_id,
          name: row.workout_name,
          date: row.date,
          sets: []
        });
      }
      workoutsMap.get(row.workout_id).sets.push({
        exerciseId: row.exercise_id,
        weight: row.weight,
        reps: row.reps,
      });
    }

    return NextResponse.json(Array.from(workoutsMap.values()));
  } catch (error) {
    console.error("Failed to fetch workouts:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, date, notes, sets } = body;

    // Start a transaction so we don't save a workout if the sets fail
    await db.query("BEGIN");

    const workoutRes = await db.query(
      `INSERT INTO workouts (user_id, name, date, notes) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id`,
      [session.user.id, name || "Workout", date, notes || null]
    );
    
    const workoutId = workoutRes.rows[0].id;

    for (const set of sets) {
      await db.query(
        `INSERT INTO sets (workout_id, exercise_id, weight, reps, set_number) 
         VALUES ($1, $2, $3, $4, $5)`,
        [workoutId, set.exerciseId, set.weight, set.reps, set.setNumber]
      );
    }

    await db.query("COMMIT");

    return NextResponse.json({ success: true, workoutId });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Failed to save workout:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}