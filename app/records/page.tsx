import db from "@/lib/db";
import Link from "next/link";

export default async function RecordsPage() {
  const records = await db.query(`
    SELECT MAX(sets.weight) as max_weight, sets.reps, exercise.name 
    FROM sets 
    JOIN exercise ON sets.exercise_id = exercise.id 
    GROUP BY exercise.name, sets.reps
    ORDER BY max_weight DESC
  `);

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <nav className="mb-8 flex gap-4">
        {/* Updated href to point to the homepage */}
        <Link href="/" className="text-blue-600 hover:underline">
          Exercises
        </Link>
        <span className="text-gray-400">|</span>
        <span className="font-semibold text-gray-900">Records</span>
      </nav>

      <h1 className="text-2xl font-bold mb-6">Personal Records</h1>

      {records.rows.length === 0 ? (
        <p className="text-gray-500">No sets logged yet. Time to hit the gym.</p>
      ) : (
        <ul className="space-y-2">
          {records.rows.map((record) => (
            <li 
              key={`${record.name}-${record.reps}`} 
              className="p-4 border rounded shadow-sm bg-white"
            >
              <span className="font-semibold">{record.name}</span>
              <span className="text-gray-600">
                {" "} &mdash; {record.max_weight} lbs for {record.reps} reps
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}