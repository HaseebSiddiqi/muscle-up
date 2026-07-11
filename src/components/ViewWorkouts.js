import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import React from "react";
import { apiFetch } from "./apiClient.js";

export default function ViewWorkouts({ viewWorkouts, updateWorkouts, refreshKey }) {

    const [viewCalender, updateCalender] = useState(true);
    const [currentDate, setDate] = useState(null);
    const [feedback, setFeedback] = useState("");
    const [editingWorkoutId, setEditingWorkoutId] = useState(null);
    const [editWorkouts, setEditWorkouts] = useState(null);

    const updateWorkout = async (workoutId) => {
        await apiFetch(
            `https://workouttracker-production-4d3e.up.railway.app/workoutLogs/${workoutId}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(editWorkouts)
            }
        );
        updateWorkouts(prev =>
            prev.map(w =>
                w.workoutId === workoutId
                    ? editWorkouts
                    : w
            )
        );
        setEditingWorkoutId(null);
        setEditWorkouts(null);
    }

    const handleDelete = async (workoutId) => {
        await apiFetch(
            `https://workouttracker-production-4d3e.up.railway.app/workoutLogs/${workoutId}`,
            {
                method: "DELETE"
            }
        );
        updateWorkouts(prev =>
            prev.filter(w => w.workoutId !== workoutId)
        );
        updateCalender(true);
        setFeedback("Workout Deleted!");
        setTimeout(() => {
            setFeedback("");
        }, 2000)
    };

    const isWorkout = (date) => {
        const dateString = date.toISOString().split("T")[0];
        return viewWorkouts.some(
            w => w.date === dateString
        );
    }

    const updateEditValue = (exerciseIndex, setIndex, field, value, max) => {
        const copy = structuredClone(editWorkouts);
        copy.exercises[exerciseIndex].sets[setIndex][field] =
            value === ""
                ? null
                : Math.min(max, Math.max(0, Number(value)));
        setEditWorkouts(copy);
    };

    return (
        <>
            {viewCalender ? (
                <div>
                    <div className="calendar-container">
                        <Calendar
                            view="month"
                            minDetail="month"
                            maxDetail="month"
                            showFixedNumberOfWeeks={true}
                            onClickDay={(date) => {
                                if (isWorkout(date)) {
                                    setDate(date);
                                    updateCalender(false);
                                }
                            }}
                            tileClassName={({ date, view }) => {
                                if (view === "month" && isWorkout(date)) {
                                    return "workout-day";
                                }
                                return null;
                            }}
                        />
                    </div>

                    <div className="Calander bottom">
                        <div className="legend">
                            <p>
                                <span className="orange-square"></span>
                                No Session
                            </p>
                            <p>
                                <span className="blue-square"></span>
                                Workout Logged
                            </p>
                            <p className="legend-hint">
                                Click blue days to view details
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div>
                    <div className="table-container">
                        <div className="spanrow-date">
                            {currentDate?.toISOString().split("T")[0]}
                        </div>

                        {viewWorkouts
                            .filter(
                                w =>
                                    w.date === currentDate?.toISOString().split("T")[0]
                            )
                            .map((w) => {
                                const displayExercises =
                                    w.exercises
                                        .map((exercise, index) => ({
                                            ...exercise,
                                            originalIndex: index
                                        }))
                                        .sort((a, b) => {
                                            const order = {
                                                weight_reps: 0,
                                                reps: 1,
                                                time: 2,
                                                cardio: 3
                                            };
                                            return order[a.type] - order[b.type];
                                        });

                                const setColumns =
                                    w.exercises.find(ex => ex.type !== "cardio")?.sets.length || 3;

                                return (
                                    <table className="addWorkoutTable" key={w.workoutId}>
                                        <tbody>
                                            <tr>
                                                <th>
                                                    {w.workoutName}
                                                </th>
                                                {w.exercises.some(ex => ex.type !== "cardio") ? (
                                                    Array.from({
                                                        length: setColumns
                                                    }).map((_, i) => (
                                                        <th key={i}>
                                                            Set {i + 1}
                                                        </th>
                                                    ))
                                                ) : (
                                                    <th colSpan={3}>Stats</th>
                                                )}
                                                <th>
                                                    Notes
                                                </th>
                                            </tr>

                                            {displayExercises.map((exercise, i) => {
                                                const exerciseIndex = exercise.originalIndex;
                                                const editing = editingWorkoutId === w.workoutId;
                                                const showUnits =
                                                    i === 0 ||
                                                    displayExercises[i - 1].type !== exercise.type;

                                                return (
                                                    <>
                                                        <tr key={exerciseIndex}>
                                                            <td className="exercise-name-cell">
                                                                <div className="exercise-name-content">
                                                                    {exercise.name}
                                                                </div>
                                                            </td>

                                                            {exercise.type === "cardio" ? (
                                                                <td className="cardio-cell" colSpan={setColumns}>
                                                                    <div className="cardio-inputs">
                                                                        <div className="inputWithUnit">
                                                                            {editing ? (
                                                                                <input
                                                                                    type="number"
                                                                                    onKeyDown={(e) => {
                                                                                        if (["e", "E", "+", "-", "."].includes(e.key)) {
                                                                                            e.preventDefault();
                                                                                        }
                                                                                    }}
                                                                                    value={
                                                                                        editWorkouts.exercises[exerciseIndex].duration ?? ""
                                                                                    }
                                                                                    onChange={(e) => {
                                                                                        const copy = structuredClone(editWorkouts);
                                                                                        copy.exercises[exerciseIndex].duration =
                                                                                            e.target.value === ""
                                                                                                ? null
                                                                                                : Math.min(999, Math.max(0, Number(e.target.value)));
                                                                                        setEditWorkouts(copy);
                                                                                    }}
                                                                                />
                                                                            ) : (
                                                                                <div className="inputValue">
                                                                                    {exercise.duration}
                                                                                </div>
                                                                            )}
                                                                            <span className="unit">mins</span>
                                                                        </div>

                                                                        <div className="inputWithUnit">
                                                                            {editing ? (
                                                                                <input
                                                                                    type="number"
                                                                                    onKeyDown={(e) => {
                                                                                        if (["e", "E", "+", "-"].includes(e.key)) {
                                                                                            e.preventDefault();
                                                                                        }
                                                                                    }}
                                                                                    value={
                                                                                        editWorkouts.exercises[exerciseIndex].distance ?? ""
                                                                                    }
                                                                                    onChange={(e) => {
                                                                                        if (!/^\d*\.?\d{0,2}$/.test(e.target.value)) {
                                                                                            return;
                                                                                        }

                                                                                        const copy = structuredClone(editWorkouts);
                                                                                        copy.exercises[exerciseIndex].distance =
                                                                                            e.target.value === ""
                                                                                                ? null
                                                                                                : Math.min(99, Math.max(0, Number(e.target.value)));
                                                                                        setEditWorkouts(copy);
                                                                                    }}
                                                                                />
                                                                            ) : (
                                                                                <div className="inputValue">
                                                                                    {exercise.distance}
                                                                                </div>
                                                                            )}
                                                                            <span className="unit">km</span>
                                                                        </div>

                                                                        <div className="inputWithUnit">
                                                                            {editing ? (
                                                                                <input
                                                                                    type="number"
                                                                                    onKeyDown={(e) => {
                                                                                        if (["e", "E", "+", "-", "."].includes(e.key)) {
                                                                                            e.preventDefault();
                                                                                        }
                                                                                    }}
                                                                                    value={
                                                                                        editWorkouts.exercises[exerciseIndex].calories ?? ""
                                                                                    }
                                                                                    onChange={(e) => {
                                                                                        const copy = structuredClone(editWorkouts);
                                                                                        copy.exercises[exerciseIndex].calories =
                                                                                            e.target.value === ""
                                                                                                ? null
                                                                                                : Math.min(999, Math.max(0, Number(e.target.value)));
                                                                                        setEditWorkouts(copy);
                                                                                    }}
                                                                                />
                                                                            ) : (
                                                                                <div className="inputValue">
                                                                                    {exercise.calories}
                                                                                </div>
                                                                            )}
                                                                            <span className="unit">cals</span>
                                                                        </div>
                                                                    </div>
                                                                </td>

                                                            ) : (

                                                                exercise.sets.map((set, setIndex) => (
                                                                    <td
                                                                        className="Sets"
                                                                        key={setIndex}
                                                                    >
                                                                        <div className="Sets-content">
                                                                            <div className="set-inputs">
                                                                                {editing ? (
                                                                                    <>
                                                                                        {exercise.type === "weight_reps" && (
                                                                                            <>
                                                                                                <div className="inputWithUnit">
                                                                                                    <input
                                                                                                        type="number"
                                                                                                        onKeyDown={(e) => {
                                                                                                            if (["e", "E", "+", "-", "."].includes(e.key)) {
                                                                                                                e.preventDefault();
                                                                                                            }
                                                                                                        }}
                                                                                                        value={
                                                                                                            editWorkouts
                                                                                                                .exercises[exerciseIndex]
                                                                                                                .sets[setIndex]
                                                                                                                .weight ?? ""
                                                                                                        }
                                                                                                        onChange={(e) =>
                                                                                                            updateEditValue(
                                                                                                                exerciseIndex,
                                                                                                                setIndex,
                                                                                                                "weight",
                                                                                                                e.target.value,
                                                                                                                999
                                                                                                            )}
                                                                                                    />
                                                                                                    {showUnits && (
                                                                                                        <span className="unit">
                                                                                                            lbs
                                                                                                        </span>
                                                                                                    )}
                                                                                                </div>
                                                                                                <div className="inputWithUnit">
                                                                                                    <input
                                                                                                        type="number"
                                                                                                        onKeyDown={(e) => {
                                                                                                            if (["e", "E", "+", "-", "."].includes(e.key)) {
                                                                                                                e.preventDefault();
                                                                                                            }
                                                                                                        }}
                                                                                                        value={
                                                                                                            editWorkouts
                                                                                                                .exercises[exerciseIndex]
                                                                                                                .sets[setIndex]
                                                                                                                .reps ?? ""
                                                                                                        }
                                                                                                        onChange={(e) =>
                                                                                                            updateEditValue(
                                                                                                                exerciseIndex,
                                                                                                                setIndex,
                                                                                                                "reps",
                                                                                                                e.target.value,
                                                                                                                99
                                                                                                            )}
                                                                                                    />
                                                                                                    {showUnits && (
                                                                                                        <span className="unit">
                                                                                                            reps
                                                                                                        </span>
                                                                                                    )}
                                                                                                </div>
                                                                                            </>
                                                                                        )}
                                                                                        {exercise.type === "reps" && (
                                                                                            <div className="inputWithUnit">
                                                                                                <input
                                                                                                    type="number"
                                                                                                    onKeyDown={(e) => {
                                                                                                        if (["e", "E", "+", "-", "."].includes(e.key)) {
                                                                                                            e.preventDefault();
                                                                                                        }
                                                                                                    }}
                                                                                                    value={
                                                                                                        editWorkouts
                                                                                                            .exercises[exerciseIndex]
                                                                                                            .sets[setIndex]
                                                                                                            .reps ?? ""
                                                                                                    }
                                                                                                    onChange={(e) =>
                                                                                                        updateEditValue(
                                                                                                            exerciseIndex,
                                                                                                            setIndex,
                                                                                                            "reps",
                                                                                                            e.target.value,
                                                                                                            99
                                                                                                        )}
                                                                                                />
                                                                                                {showUnits && (
                                                                                                    <span className="unit">
                                                                                                        reps
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>
                                                                                        )}
                                                                                        {exercise.type === "time" && (
                                                                                            <div className="duration-input">
                                                                                                {showUnits && (
                                                                                                    <div className="duration-labels">
                                                                                                        <span className="unit">mins</span>
                                                                                                        <span className="unit">sec</span>
                                                                                                    </div>
                                                                                                )}
                                                                                                <div className="duration-values">
                                                                                                    <input
                                                                                                        type="number"
                                                                                                        onKeyDown={(e) => {
                                                                                                            if (["e", "E", "+", "-", "."].includes(e.key)) {
                                                                                                                e.preventDefault();
                                                                                                            }
                                                                                                        }}
                                                                                                        value={
                                                                                                            editWorkouts
                                                                                                                .exercises[exerciseIndex]
                                                                                                                .sets[setIndex]
                                                                                                                .minutes ?? ""
                                                                                                        }
                                                                                                        onChange={(e) =>
                                                                                                            updateEditValue(
                                                                                                                exerciseIndex,
                                                                                                                setIndex,
                                                                                                                "minutes",
                                                                                                                e.target.value,
                                                                                                                120
                                                                                                            )
                                                                                                        }
                                                                                                    />
                                                                                                    <span className="time-divider">:</span>
                                                                                                    <input
                                                                                                        type="text"

                                                                                                        onKeyDown={(e) => {
                                                                                                            if (
                                                                                                                !/^\d$/.test(e.key) &&
                                                                                                                !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)
                                                                                                            ) {
                                                                                                                e.preventDefault();
                                                                                                            }
                                                                                                        }}
                                                                                                        value={
                                                                                                            editWorkouts.exercises[exerciseIndex].sets[setIndex].seconds === "" ||
                                                                                                                editWorkouts.exercises[exerciseIndex].sets[setIndex].seconds == null
                                                                                                                ? ""
                                                                                                                : String(
                                                                                                                    editWorkouts.exercises[exerciseIndex].sets[setIndex].seconds
                                                                                                                ).padStart(2, "0")
                                                                                                        }
                                                                                                        onChange={(e) => {
                                                                                                            const copy = structuredClone(editWorkouts);
                                                                                                            copy.exercises[exerciseIndex].sets[setIndex].seconds =
                                                                                                                e.target.value === ""
                                                                                                                    ? null
                                                                                                                    : Math.min(59, Math.max(0, Number(e.target.value)));
                                                                                                            setEditWorkouts(copy);
                                                                                                        }}
                                                                                                    />
                                                                                                </div>
                                                                                            </div>
                                                                                        )}
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        {exercise.type === "weight_reps" && (
                                                                                            <>
                                                                                                <div className="inputWithUnit">
                                                                                                    <div className="inputValue">
                                                                                                        {set.weight}
                                                                                                    </div>
                                                                                                    {showUnits && (
                                                                                                        <span className="unit">
                                                                                                            lbs
                                                                                                        </span>
                                                                                                    )}
                                                                                                </div>
                                                                                                <div className="inputWithUnit">
                                                                                                    <div className="inputValue">
                                                                                                        {set.reps}
                                                                                                    </div>
                                                                                                    {showUnits && (
                                                                                                        <span className="unit">
                                                                                                            reps
                                                                                                        </span>
                                                                                                    )}
                                                                                                </div>
                                                                                            </>
                                                                                        )}
                                                                                        {exercise.type === "reps" && (

                                                                                            <div className="inputWithUnit">
                                                                                                <div className="inputValue">
                                                                                                    {set.reps}
                                                                                                </div>
                                                                                                {showUnits && (
                                                                                                    <span className="unit">
                                                                                                        reps
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>
                                                                                        )}
                                                                                        {exercise.type === "time" && (
                                                                                            <div className="duration-input">
                                                                                                {showUnits && (
                                                                                                    <div className="duration-labels">
                                                                                                        <span className="unit">mins</span>
                                                                                                        <span className="unit">sec</span>
                                                                                                    </div>
                                                                                                )}
                                                                                                <div className="duration-values">
                                                                                                    <div className="duration-value">
                                                                                                        {set.minutes}
                                                                                                    </div>
                                                                                                    <span className="time-divider">:</span>
                                                                                                    <div className="duration-value">
                                                                                                        {set.seconds == null ? "" : String(set.seconds).padStart(2, "0")}
                                                                                                    </div>
                                                                                                </div>

                                                                                            </div>
                                                                                        )}
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                ))
                                                            )}
                                                            {i === 0 && (
                                                                <td
                                                                    className="notes"
                                                                    rowSpan={displayExercises.length}
                                                                >
                                                                    {editing ? (
                                                                        <textarea
                                                                            className="textarea"
                                                                            value={
                                                                                editWorkouts.notes ?? ""
                                                                            }
                                                                            onChange={(e) => {
                                                                                const copy =
                                                                                    structuredClone(editWorkouts);
                                                                                copy.notes = e.target.value;
                                                                                setEditWorkouts(copy);
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        w.notes
                                                                    )}
                                                                </td>
                                                            )}
                                                        </tr>

                                                    </>
                                                )

                                            })}
                                            {editingWorkoutId === w.workoutId ? (
                                                <tr className="duration-row">
                                                    <td colSpan={99}>
                                                        Workout Duration: 
                                                        <input
                                                            value={editWorkouts.duration ?? ""}
                                                            onKeyDown={(e) => {
                                                                if (!/[0-9]/.test(e.key)) {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                            onChange={(e) => {
                                                                const copy = structuredClone(editWorkouts);
                                                                copy.duration = Math.min(Number(e.target.value), 999);
                                                                setEditWorkouts(copy);
                                                            }}
                                                        />
                                                        mins
                                                    </td>
                                                </tr>
                                            ) : (
                                                <tr className="duration-row">
                                                    <td colSpan={99}>Workout Duration: {w.duration ? `${w.duration} mins` : "N/A"}</td>
                                                </tr>
                                            )}
                                            <tr>
                                                <td colSpan={99}>
                                                    <div className="SetControls">
                                                        <button
                                                            className="addButton"
                                                            onClick={() => {
                                                                if (editingWorkoutId !== w.workoutId) {
                                                                    setEditWorkouts(
                                                                        structuredClone(w)
                                                                    );
                                                                    setEditingWorkoutId(
                                                                        w.workoutId
                                                                    );
                                                                }
                                                                else {
                                                                    updateWorkout(
                                                                        w.workoutId
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            {
                                                                editingWorkoutId === w.workoutId
                                                                    ? "Save"
                                                                    : "Edit"
                                                            }
                                                        </button>
                                                        <button
                                                            className="minusButton"
                                                            onClick={() => {
                                                                if (window.confirm(
                                                                    "Delete this workout?"
                                                                )) {
                                                                    handleDelete(
                                                                        w.workoutId
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                )
                            })}
                    </div>

                    <button
                        className="my-button"
                        onClick={() => {
                            updateCalender(true);
                            setEditingWorkoutId(null);
                            setEditWorkouts(null);
                        }}
                    >
                        Back to Calendar
                    </button>
                </div>
            )}

            {feedback && <h2>{feedback}</h2>}


        </>

    );

}