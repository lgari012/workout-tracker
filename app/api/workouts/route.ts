import pool from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Check out a dedicated client from the pool for the transaction
  const client = await pool.connect();

  try {
    const { name, date, sets } = await request.json();

    // 2. Begin the transaction block
    await client.query("BEGIN");

    // 3. Insert the parent workout row and grab its generated ID
    const workoutResult = await client.query(
      "INSERT INTO workouts (name, date, user_id) VALUES ($1, COALESCE($2, NOW()), $3) RETURNING *",
      [name || "Workout", date || null, session.user.id]
    );
    const workoutId = workoutResult.rows[0].id;

    // 4. Iterate through the sets array and insert each one linked to the workout ID
    const insertedSets = [];
    if (sets && Array.isArray(sets)) {
      for (const set of sets) {
        const setResult = await client.query(
          "INSERT INTO sets (workout_id, exercise_id, weight, reps, set_number) VALUES ($1, $2, $3, $4, $5) RETURNING *",
          [workoutId, set.exerciseId, set.weight, set.reps, set.setNumber]
        );
        insertedSets.push(setResult.rows[0]);
      }
    }

    // 5. If everything succeeded, commit the transaction
    await client.query("COMMIT");

    return NextResponse.json({
      workout: workoutResult.rows[0],
      sets: insertedSets,
    }, { status: 201 });

  } catch (error) {
    // 6. If any query fails, roll back all changes made in this transaction
    await client.query("ROLLBACK");
    console.error("Failed to log workout transaction:", error);
    return NextResponse.json({ error: "Failed to log workout" }, { status: 500 });
  } finally {
    // 7. Always release the client back to the pool
    client.release();
  }
}