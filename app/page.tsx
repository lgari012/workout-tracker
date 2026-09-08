import db from "@/lib/db";
import { signIn } from "@/auth";

export default async function ExercisesPage() {
  const exercises = await db.query("SELECT * FROM exercise");

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">All Exercises</h1>
        <form
          action={async () => {
            "use server";
            await signIn("google");
          }}
        >
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
            Sign In with Google
          </button>
        </form>
      </div>
      
      {exercises.rows.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-lg text-gray-500">
          <p>No exercises tracked yet.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {exercises.rows.map((exercise) => (
            <li 
              key={exercise.id} 
              className="p-4 border rounded-lg shadow-sm flex items-center justify-between bg-white"
            >
              <span className="font-medium text-gray-900">{exercise.name}</span>
              {exercise.muscle_group && (
                <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {exercise.muscle_group}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}