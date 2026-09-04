"use client";

import { useState } from "react";

export default function NewExercisePage() {
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await fetch("/api/exercise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, muscle_group: muscleGroup }),
    });

    setName("");
    setMuscleGroup("");
  };

  return (
    <main className="p-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm">
        <input
          type="text"
          placeholder="Exercise Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 rounded"
          required
        />
        
        <input
          type="text"
          placeholder="Muscle Group"
          value={muscleGroup}
          onChange={(e) => setMuscleGroup(e.target.value)}
          className="border p-2 rounded"
        />

        <button type="submit" className="bg-blue-600 text-white p-2 rounded">
          Save
        </button>
      </form>
    </main>
  );
}