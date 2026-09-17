"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Exercise = {
  id: number;
  name: string;
  muscle_group: string;
};

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadExercises();
  }, []);

  async function loadExercises() {
    try {
      // FIXED: Singular path
      const res = await fetch("/api/exercise");
      if (res.ok) {
        const data = await res.json();
        setExercises(data);
      }
    } catch (error) {
      console.error("Failed to load exercises");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    
    if (!name.trim() || !muscleGroup.trim()) {
      return setMessage({ text: "Please fill out both the name and muscle group.", type: "error" });
    }

    setIsSubmitting(true);
    try {
      // FIXED: Singular path
      const res = await fetch("/api/exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), muscle_group: muscleGroup.trim() }),
      });

      if (res.ok) {
        setMessage({ text: "Exercise added successfully!", type: "success" });
        setName("");
        setMuscleGroup("");
        loadExercises(); 
      } else {
        const data = await res.json();
        setMessage({ text: data.error || "Failed to add exercise.", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "A network error occurred.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="p-8 max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Manage Exercises</h1>
        <Link 
          href="/" 
          className="text-sm font-medium text-blue-600 hover:underline transition-colors"
        >
          &larr; Back to Dashboard
        </Link>
      </div>

      {message && (
        <div className={`p-4 rounded-md text-sm font-medium ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {message.text}
        </div>
      )}

      <section className="bg-white p-6 border rounded-xl shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Add New Exercise</h2>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Exercise Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bench Press"
              className="w-full border rounded px-3 py-2 text-gray-900"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Muscle Group</label>
            <input
              type="text"
              value={muscleGroup}
              onChange={(e) => setMuscleGroup(e.target.value)}
              placeholder="e.g. Chest"
              className="w-full border rounded px-3 py-2 text-gray-900"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50 h-[42px]"
          >
            {isSubmitting ? "Adding..." : "Add"}
          </button>
        </form>
      </section>

      <section className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">Your Exercises</h2>
        </div>
        {exercises.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No exercises added yet. Create one above!
          </div>
        ) : (
          <ul className="divide-y">
            {exercises.map((ex) => (
              <li key={ex.id} className="px-6 py-4 flex justify-between items-center">
                <span className="font-medium text-gray-900">{ex.name}</span>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                  {ex.muscle_group}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}