import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
 const records = await db.query("SELECT MAX(sets.weight) as max_weight, sets.reps, exercise.name FROM sets JOIN exercise ON sets.exercise_id = exercise.id GROUP BY exercise.name, sets.reps");
 return NextResponse.json(records.rows);
}
  