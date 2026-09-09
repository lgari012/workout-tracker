"use client";

import { useState, useEffect } from "react";

export default function NewWorkoutPage() {
  const [sets, setSets] = useState<{ id: string; exerciseId: string; weight: string; reps: string }[]>([]);
  const [exercises, setExercises] = useState<{ id: number; name: string; muscle_group: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Fix for the hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    async function loadExercises() {
      try {
        const res = await fetch("/api/exercise");
        if (res.ok) {
          const data = await res.json();
          setExercises(data);
        } else {
          console.error(`Failed to fetch exercises: ${res.status} ${res.statusText}`);
        }
      } catch (error) {
        console.error("Network error while fetching exercises:", error);
      }
    }
    loadExercises();
  }, []);

  const handleAddSet = () => {
    const newSet = { 
      id: crypto.randomUUID(), 
      exerciseId: "", 
      weight: "", 
      reps: "" 
    };
    setSets([...sets, newSet]);
  };

  const handleUpdateSet = (id: string, field: "weight" | "reps" | "exerciseId", value: string) => {
    setSets(
      sets.map((set) => (set.id === id ? { ...set, [field]: value } : set))
    );
  };

  const handleRemoveSet = (id: string) => {
    setSets(sets.filter((set) => set.id !== id));
  };

  const handleSubmit = async () => {
    if (sets.length === 0) return alert("Add at least one set!");
    
    const isValid = sets.every((s) => s.exerciseId && s.weight && s.reps);
    if (!isValid) return alert("Please fill out all fields (Exercise, Weight, Reps) for every set.");

    setIsSubmitting(true);

    try {
      const payload = {
        name: "My Workout",
        sets: sets.map((s, index) => ({
          exerciseId: parseInt(s.exerciseId, 10),
          weight: parseFloat(s.weight),
          reps: parseInt(s.reps, 10),
          setNumber: index + 1,
        })),
      };

      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("Workout logged successfully!");
        setSets([]);
      } else {
        const errorData = await res.json();
        console.error("Failed to log workout:", errorData);
        alert(`Error: ${errorData.error || "Failed to log workout"}`);
      }
    } catch (error) {
      console.error("Network error during submission:", error);
      alert("A network error occurred while submitting the workout.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Log Workout</h1>
        <div className="flex gap-2">
          <button
            onClick={handleAddSet}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded text-sm hover:bg-gray-300 font-medium"
          >
            + Add Set
          </button>
          <button
            onClick={handleSubmit}
            disabled={isMounted ? (isSubmitting || sets.length === 0) : false}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 font-medium disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Workout"}
          </button>
        </div>
      </div>

      {sets.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-lg text-gray-500">
          <p>No sets added yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sets.map((set, index) => (
            <div key={set.id} className="flex flex-wrap items-center gap-4 p-4 border rounded-lg bg-white shadow-sm">
              <span className="font-medium text-gray-700 w-16">
                Set {index + 1}
              </span>
              
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <select
                  value={set.exerciseId}
                  onChange={(e) => handleUpdateSet(set.id, "exerciseId", e.target.value)}
                  className="w-full border rounded px-2 py-1.5 text-gray-900 bg-white"
                >
                  <option value="" disabled>Select Exercise...</option>
                  {exercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Weight</label>
                <input
                  type="number"
                  value={set.weight}
                  onChange={(e) => handleUpdateSet(set.id, "weight", e.target.value)}
                  className="w-20 border rounded px-2 py-1 text-gray-900"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Reps</label>
                <input
                  type="number"
                  value={set.reps}
                  onChange={(e) => handleUpdateSet(set.id, "reps", e.target.value)}
                  className="w-20 border rounded px-2 py-1 text-gray-900"
                />
              </div>

              <button
                onClick={() => handleRemoveSet(set.id)}
                className="text-red-500 text-sm font-bold hover:text-red-700 ml-auto"
              >
                X
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}