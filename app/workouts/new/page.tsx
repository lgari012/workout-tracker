"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type SetRecord = {
  id: string;
  muscleGroup: string;
  exerciseId: string;
  weight: string;
  reps: string;
};

// Smart helper to determine the likely weight jump based on equipment type
function getWeightStep(exerciseName?: string) {
  if (!exerciseName) return 5;
  const name = exerciseName.toLowerCase();
  
  if (
    name.includes("machine") || 
    name.includes("cable") || 
    name.includes("pulldown") || 
    name.includes("pushdown") ||
    name.includes("pec deck")
  ) {
    return 10;
  }
  
  if (name.includes("dumbbell")) {
    return 5;
  }
  
  if (name.includes("barbell") || name.includes("squat") || name.includes("deadlift")) {
    return 5; 
  }
  
  return 5;
}

export default function NewWorkoutPage() {
  const router = useRouter();
  
  const [sets, setSets] = useState<SetRecord[]>([]);
  const [exercises, setExercises] = useState<{ id: number; name: string; muscle_group: string }[]>([]);
  
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split("T")[0];
  });
  
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

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

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasChanges = sets.length > 0 || name.trim() !== "" || notes.trim() !== "";
      if (hasChanges && !isSubmitting) {
        e.preventDefault();
        e.returnValue = ""; 
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [sets, name, notes, isSubmitting]);

  const muscleGroups = Array.from(new Set(exercises.map((ex) => ex.muscle_group))).sort();

  const handleAddSet = () => {
    setMessage(null);
    const lastSet = sets[sets.length - 1];
    
    const newSet = { 
      id: crypto.randomUUID(), 
      muscleGroup: lastSet ? lastSet.muscleGroup : "",
      exerciseId: lastSet ? lastSet.exerciseId : "", 
      weight: "", 
      reps: "" 
    };
    setSets([...sets, newSet]);
  };

  const handleUpdateSet = (id: string, field: keyof SetRecord, value: string) => {
    setMessage(null);
    setSets(
      sets.map((set) => {
        if (set.id === id) {
          if (field === "muscleGroup") {
            return { ...set, muscleGroup: value, exerciseId: "" };
          }
          return { ...set, [field]: value };
        }
        return set;
      })
    );
  };

  const handleStepWeight = (id: string, currentWeight: string, step: number, direction: 1 | -1) => {
    setMessage(null);
    let val = parseFloat(currentWeight);
    if (isNaN(val)) val = 0;
    
    let newVal = val + (step * direction);
    if (newVal < 0) newVal = 0; 
    
    handleUpdateSet(id, "weight", newVal.toString());
  };

  const handleRemoveSet = (id: string) => {
    setMessage(null);
    setSets(sets.filter((set) => set.id !== id));
  };

  const handleCancel = () => {
    const hasChanges = sets.length > 0 || name.trim() !== "" || notes.trim() !== "";
    
    if (hasChanges) {
      if (window.confirm("You have unsaved changes. Are you sure you want to discard this workout?")) {
        router.push("/");
      }
    } else {
      router.push("/");
    }
  };

  const handleSubmit = async () => {
    setMessage(null);

    if (sets.length === 0) {
      return setMessage({ text: "Add at least one set before saving.", type: "error" });
    }
    
    const isValid = sets.every((s) => s.exerciseId && s.weight && s.reps);
    if (!isValid) {
      return setMessage({ text: "Please fill out Exercise, Weight, and Reps for every set.", type: "error" });
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        date,
        notes,
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
        setMessage({ text: "Workout logged successfully!", type: "success" });
        setSets([]);
        setName("");
        setNotes("");
        
        setTimeout(() => {
          router.push("/");
        }, 1500);

      } else {
        const errorData = await res.json();
        setMessage({ text: `Error: ${errorData.error || "Failed to log workout"}`, type: "error" });
      }
    } catch (error) {
      console.error("Network error during submission:", error);
      setMessage({ text: "A network error occurred while submitting the workout.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold">Log Workout</h1>
        <div className="flex gap-2 items-center w-full sm:w-auto justify-between sm:justify-end">
          <button 
            onClick={handleCancel}
            className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors px-3 py-2"
          >
            Cancel
          </button>
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
      </div>

      {message && (
        <div 
          className={`mb-6 p-4 rounded-md text-sm font-medium ${
            message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white p-6 border rounded-lg shadow-sm mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Workout Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pull Day (Optional)"
              className="w-full border rounded px-3 py-2 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full sm:w-auto border rounded px-3 py-2 text-gray-900"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did the workout feel?"
            rows={2}
            className="w-full border rounded px-3 py-2 text-gray-900 resize-none"
          />
        </div>
      </div>

      {sets.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-lg text-gray-500">
          <p>No sets added yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sets.map((set, index) => {
            const selectedExercise = exercises.find((ex) => ex.id.toString() === set.exerciseId);
            const stepAmount = getWeightStep(selectedExercise?.name);

            return (
              <div key={set.id} className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 p-4 border rounded-lg bg-white shadow-sm">
                
                <span className="font-medium text-gray-700 w-16">
                  Set {index + 1}
                </span>
                
                {/* Dropdowns Row */}
                <div className="flex flex-col sm:flex-row flex-1 w-full sm:w-auto gap-2">
                  <select
                    value={set.muscleGroup}
                    onChange={(e) => handleUpdateSet(set.id, "muscleGroup", e.target.value)}
                    className="border rounded px-2 py-1.5 text-gray-900 bg-white sm:w-36"
                  >
                    <option value="" disabled>Muscle...</option>
                    {muscleGroups.map((mg) => (
                      <option key={mg} value={mg}>{mg}</option>
                    ))}
                  </select>

                  <select
                    value={set.exerciseId}
                    onChange={(e) => handleUpdateSet(set.id, "exerciseId", e.target.value)}
                    disabled={!set.muscleGroup}
                    className="border rounded px-2 py-1.5 text-gray-900 bg-white flex-1 min-w-[200px] disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="" disabled>
                      {set.muscleGroup ? "Select Exercise..." : "Pick Muscle First"}
                    </option>
                    {exercises
                      .filter((ex) => ex.muscle_group === set.muscleGroup)
                      .map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Numbers Row */}
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                  
                  {/* Smart Weight Stepper */}
                  <div className="flex items-center">
                    <label className="text-sm text-gray-600 mr-2">Lbs</label>
                    <div className="flex items-center border rounded overflow-hidden bg-white">
                      <button 
                        type="button"
                        onClick={() => handleStepWeight(set.id, set.weight, stepAmount, -1)}
                        className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold border-r transition-colors"
                      >
                        -
                      </button>
                      
                      <input
                        type="number"
                        value={set.weight}
                        onChange={(e) => handleUpdateSet(set.id, "weight", e.target.value)}
                        className="w-14 px-1 py-1.5 text-center text-gray-900 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0"
                      />
                      
                      <button 
                        type="button"
                        onClick={() => handleStepWeight(set.id, set.weight, stepAmount, 1)}
                        className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold border-l transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Reps Dropdown */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Reps</label>
                    <select
                      value={set.reps}
                      onChange={(e) => handleUpdateSet(set.id, "reps", e.target.value)}
                      className="w-16 border rounded px-2 py-1.5 text-gray-900 bg-white"
                    >
                      <option value="" disabled>-</option>
                      {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => handleRemoveSet(set.id)}
                    className="text-red-500 text-sm font-bold hover:text-red-700 sm:ml-2 p-2"
                  >
                    X
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}