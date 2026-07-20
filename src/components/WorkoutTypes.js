import { useState, useEffect } from "react";
import { apiFetch } from "./apiClient.js";

export default function WorkoutTypes({ onSelectWorkout, setActiveComponent, refreshKey }) {
    const [workouts, setWorkouts] = useState([]);
    const [loaded, setLoaded] = useState(false);

    const [feedback, setFeedback] = useState("");


    useEffect(() => {
        const fetchWorkouts = async () => {
            try {
                const res = await apiFetch(
                    "https://workouttracker-production-4d3e.up.railway.app/workouts"
                );

                const data = await res.json();
                setWorkouts(data.Items || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoaded(true);
            }
        };

        fetchWorkouts();
    }, [refreshKey]);

    const deleteWorkout = async (index) => {
        const workoutToDelete = workouts[index];
        const workoutName = workoutToDelete.workoutName;

        try {
            const res = await apiFetch(
                `https://workouttracker-production-4d3e.up.railway.app/workouts/${encodeURIComponent(workoutName)}`,
                {
                    method: "DELETE",
                }
            );

            if (!res.ok) {
                const err = await res.json();
                console.error("Delete failed:", err);
                return;
            }

            setWorkouts((prev) => prev.filter((_, i) => i !== index));

            setFeedback("Workout Type Deleted!");

            setTimeout(() => {
                setFeedback("");
            }, 2000);
        } catch (err) {
            console.error("Error deleting workout:", err);
        }
    };
    useEffect(() => {
        if (loaded && workouts.length === 0) {
            setActiveComponent("create");
        }
    }, [loaded, workouts, setActiveComponent]);


    return (
        <>


            <div className="workout-selector-container">
                <h2>Your Created Workouts</h2>
                {workouts.length > 0 ? (
                    <div className="workout-list">
                        {workouts.map((workout, i) => (
                            <div key={i} className="workout-item">
                                <span
                                    className="workout-item-name"
                                    onClick={() => { onSelectWorkout(workout); setActiveComponent("add"); }}
                                >
                                    {workout.workoutName}
                                </span>
                                <button
                                    className="workout-item-delete"
                                    onClick={() => {
                                        const confirmed = window.confirm("Delete this workout?");
                                        if (confirmed) { deleteWorkout(i); }
                                    }}
                                >
                                    ❌
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <h3 className="empty-workouts-text">Add your first workout type to get started</h3>
                )}

                <button
                    className="main-action-btn"
                    onClick={() => { onSelectWorkout(null); setActiveComponent("create"); }}
                >
                    + Add Workout Type
                </button>
                <p className="selector-hint">Select a workout type to log a session</p>
            </div>

            {feedback && <h2>{feedback}</h2>}
        </>
    );
}