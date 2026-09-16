import db from "@/lib/db";
import { auth, signOut } from "@/auth";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();

  // --- LOGGED OUT VIEW ---
  if (!session?.user?.id) {
    return (
      <main className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <h1 className="text-4xl font-bold mb-4">
          Track Your Workouts
        </h1>
        <p className="text-lg opacity-80 mb-8 max-w-md">
          A simple, no-nonsense logger to track your sets, reps, and progress over time.
        </p>
        <Link 
          href="/api/auth/signin" 
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Sign In to Start
        </Link>
      </main>
    );
  }

  // --- LOGGED IN VIEW ---
  const recentWorkoutsResult = await db.query(
    `SELECT id, name, date, notes 
     FROM workouts 
     WHERE user_id = $1 
     ORDER BY date DESC, id DESC 
     LIMIT 3`,
    [session.user.id]
  );
  
  const recentWorkouts = recentWorkoutsResult.rows;

  return (
    <main className="p-8 max-w-4xl mx-auto space-y-8">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="opacity-80 mt-1">
            Welcome back, {session.user.name || "Lifter"}.
          </p>
        </div>
        
        {/* NextAuth v5 Server Action Sign Out */}
        <form 
          action={async () => {
            "use server";
            await signOut();
          }}
        >
          <button 
            type="submit" 
            className="text-sm font-medium border border-gray-600 hover:bg-gray-800 px-3 py-1.5 rounded-md transition-colors"
          >
            Sign Out
          </button>
        </form>
      </header>

      {/* Primary Action */}
      <section>
        <Link 
          href="/workouts/new"
          className="block w-full bg-blue-600 text-white text-center px-4 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-sm transition-colors"
        >
          + Log Today's Workout
        </Link>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <section className="p-6 border border-gray-800 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Recent Activity</h2>
            <Link href="/workouts" className="text-sm text-blue-500 hover:underline font-medium">
              View All
            </Link>
          </div>
          
          {recentWorkouts.length === 0 ? (
            <p className="opacity-60 text-sm">No workouts logged yet.</p>
          ) : (
            <ul className="space-y-4">
              {recentWorkouts.map((workout) => (
                <li key={workout.id} className="border-b border-gray-800 last:border-0 pb-4 last:pb-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold">{workout.name}</span>
                    <span className="text-sm opacity-80 font-medium">
                      {new Date(workout.date).toLocaleDateString()}
                    </span>
                  </div>
                  {workout.notes && (
                    <p className="text-sm opacity-60 truncate">{workout.notes}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Quick Links */}
        <section className="p-6 border border-gray-800 rounded-xl shadow-sm">
          <h2 className="text-xl font-bold mb-4">Quick Links</h2>
          <div className="space-y-3">
            <Link 
              href="/exercises" 
              className="block px-4 py-3 border border-gray-800 rounded-lg font-medium hover:bg-gray-900 transition-colors"
            >
              Manage Exercises
            </Link>
            <Link 
              href="/records" 
              className="block px-4 py-3 border border-gray-800 rounded-lg font-medium hover:bg-gray-900 transition-colors"
            >
              View Personal Records
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}