import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
 const exercises = await db.query("SELECT * FROM exercise");
 return NextResponse.json(exercises.rows);
}
  