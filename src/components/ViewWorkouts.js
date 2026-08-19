import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import { useUnits } from "../contexts/unitContext";
import { apiFetch } from "./apiClient.js";

export default function ViewWorkouts({ viewWorkouts, updateWorkouts, refreshKey }) {

    const { weightUnit, distanceUnit, milesToKm, lbsToKg, convertWorkout, convertWorkoutToSave } = useUnits();
    const [viewCalender, updateCalender] = useState(true);
    const [currentDate, setDate] = useState(null);
    const [feedback, setFeedback] = useState("");
    const [editingWorkoutId, setEditingWorkoutId] = useState(null);
    const [editWorkouts, setEditWorkouts] = useState(null);
    const [workoutTypes, setWorkoutTypes] = useState([]);
    const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());

    useEffect(() => {
        const fetchWorkouts = async () => {
            try {
                const res = await apiFetch(
                    "https://workouttracker-production-4d3e.up.railway.app/workouts"
                );

                const data = await res.json();
                setWorkoutTypes(data.Items || []);
            } catch (err) {
                console.error(err);
            }
        };

        fetchWorkouts();
    }, [refreshKey]);

    const startEditing = (workout) => {

        const copy = convertWorkout(workout, distanceUnit, weightUnit);

        setEditWorkouts(copy);
    };

    const updateWorkout = async (workoutId) => {
        const workoutToSave = convertWorkoutToSave(editWorkouts, distanceUnit, weightUnit)

        await apiFetch(
            `https://workouttracker-production-4d3e.up.railway.app/workoutLogs/${workoutId}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(workoutToSave)
            }
        );

        updateWorkouts(prev =>
            prev.map(w =>
                w.workoutId === workoutId
                    ? workoutToSave
                    : w
            )
        );

        setEditingWorkoutId(null);
        setEditWorkouts(null);
    };

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
        return viewWorkouts.filter(
            w => w.date === dateString
        );
    }


    const handleNumberInput = (value, max, previousValue) => {
        if (value === "") return "";

        if (!/^\d*$/.test(value)) {
            return previousValue;
        }

        return Math.min(max, Math.max(0, Number(value)));
    };

    const handleDecimalInput = (value, max, previousValue) => {
        if (value === "") return "";

        if (!/^\d*\.?\d{0,1}$/.test(value)) {
            return previousValue;
        }

        return Math.min(max, Math.max(0, Number(value)));
    };

    const updateEditValue = (exerciseIndex, setIndex, field, value, max, decimal = false) => {
        const copy = structuredClone(editWorkouts);

        const previousValue =
            copy.exercises[exerciseIndex].sets[setIndex][field];

        copy.exercises[exerciseIndex].sets[setIndex][field] = decimal
            ? handleDecimalInput(value, max, previousValue)
            : handleNumberInput(value, max, previousValue);

        setEditWorkouts(copy);
    };

    const loggedWorkoutTypes = [...new Map(
        viewWorkouts
            .filter(workout => {
                const workoutDate = new Date(workout.date + "T00:00:00");

                return workoutDate.getMonth() === calendarMonth;
            })
            .map(workout => [workout.workoutName, workout])
    ).values()];
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
                            onActiveStartDateChange={({ activeStartDate }) => {
                                setCalendarMonth(activeStartDate.getMonth());
                            }}
                            onClickDay={(date) => {
                                const workouts = isWorkout(date);
                                if (workouts.length > 0) {
                                    setDate(date);
                                    updateCalender(false);
                                }
                            }}
                            tileClassName={({ date, view }) => {
                                if (view !== "month") {
                                    return null
                                }
                                const workouts = isWorkout(date);

                                if (workouts.length === 0) {
                                    return null;
                                }

                                const primaryType = workoutTypes.find(
                                    type => type.workoutName === workouts[0].workoutName
                                );

                                const primary = primaryType?.colour || "blue";

                                let secondary = null;

                                if (workouts.length > 1) {
                                    const secondaryType = workoutTypes.find(
                                        type => type.workoutName === workouts[1].workoutName
                                    );

                                    secondary = secondaryType?.colour || "blue";
                                }

                                if (secondary) {
                                    return `workout-day two-workouts primary-${primary} secondary-${secondary}`;
                                }

                                return `workout-day primary-${primary}`;
                            }}
                        />
                    </div>

                    <div className="Calander bottom">
                        <div className="legend">
                            <p className="legend-item">
                                <span className="colour-square orange-square"></span>
                                No Session
                            </p>
                            
                             {loggedWorkoutTypes.map(workout => {
                                const workoutType = workoutTypes.find(
                                    type => type.workoutName === workout.workoutName
                                );

                                const colour = workoutType?.colour || "blue";

                                return (
                                    <p className="legend-item" key={workout.workoutName}>
                                        <span className={`colour-square ${colour}-square`}></span>
                                        {workout.workoutName}
                                    </p>
                                );
                            })}
                            <p className="legend-hint">
                                Click Active Days To View Logged Sessions
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div>
                    <div className="view-workouts-date-header">
                        <span className="spanrow-date__day">
                            {currentDate?.toLocaleDateString("en-US", { weekday: "long" })}
                        </span>
                        <span className="spanrow-date__main">
                            {currentDate?.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                        </span>
                    </div>

                    <div className="table-container">
                        {viewWorkouts
                            .filter(
                                w =>
                                    w.date === currentDate?.toISOString().split("T")[0]
                            )
                            .map((w, workoutIndex) => {
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
                                                                                    step="1"
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
                                                                                            handleNumberInput(
                                                                                                e.target.value,
                                                                                                999,
                                                                                                copy.exercises[exerciseIndex].duration
                                                                                            );
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

                                                                                        if (e.target.value === "") {
                                                                                            copy.exercises[exerciseIndex].distance = null;
                                                                                        } else {
                                                                                            const value = Math.min(
                                                                                                99,
                                                                                                Math.max(0, Number(e.target.value))
                                                                                            );

                                                                                            copy.exercises[exerciseIndex].distance = value;
                                                                                        }

                                                                                        setEditWorkouts(copy);
                                                                                    }}
                                                                                />
                                                                            ) : (
                                                                                <div className="inputValue">
                                                                                    {exercise.distance != null
                                                                                        ? distanceUnit === "km"
                                                                                            ? milesToKm(exercise.distance).toFixed(2)
                                                                                            : exercise.distance.toFixed(2)
                                                                                        : ""}
                                                                                </div>
                                                                            )}
                                                                            <span className="unit">{distanceUnit}</span>
                                                                        </div>

                                                                        <div className="inputWithUnit">
                                                                            {editing ? (
                                                                                <input
                                                                                    type="number"
                                                                                    step="1"
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
                                                                                            handleNumberInput(
                                                                                                e.target.value,
                                                                                                999,
                                                                                                copy.exercises[exerciseIndex].calories
                                                                                            );

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
                                                                                                                999,
                                                                                                                true
                                                                                                            )}
                                                                                                    />
                                                                                                    {showUnits && (
                                                                                                        <span className="unit">
                                                                                                            {weightUnit}
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

                                                                                                            const previousValue =
                                                                                                                copy.exercises[exerciseIndex].sets[setIndex].seconds;

                                                                                                            copy.exercises[exerciseIndex].sets[setIndex].seconds =
                                                                                                                handleNumberInput(e.target.value, 59, previousValue);

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
                                                                                                        {set.weight != null
                                                                                                            ? weightUnit === "kg"
                                                                                                                ? Number(lbsToKg(set.weight).toFixed(1))
                                                                                                                : Number(set.weight.toFixed(1))
                                                                                                            : ""}

                                                                                                    </div>
                                                                                                    {showUnits && (
                                                                                                        <span className="unit">
                                                                                                            {weightUnit}
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
                                                                if ((!/[0-9]/.test(e.key) &&
                                                                    (!["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)))) {
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
                                                    <td colSpan={99}>
                                                        <span className="duration-row__icon">⏱</span>
                                                        <span className="duration-row__label">Workout Duration</span>
                                                        <span className="duration-row__label">{w.duration ? `${w.duration} mins` : "—"}</span>
                                                    </td>
                                                </tr>
                                            )}
                                            <tr>
                                                <td colSpan={99}>
                                                    <div className="SetControls">
                                                        <button
                                                            className="addButton"
                                                            onClick={() => {
                                                                if (editingWorkoutId !== w.workoutId) {
                                                                    setEditingWorkoutId(w.workoutId);
                                                                    startEditing(w);
                                                                } else {
                                                                    updateWorkout(w.workoutId);
                                                                }
                                                            }}
                                                        >
                                                            {editingWorkoutId === w.workoutId ? "Save" : "Edit"}
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
                            })
                        }
                    </div>

                    <button
                        className="back"
                        onClick={() => {
                            updateCalender(true);
                            setEditingWorkoutId(null);
                            setEditWorkouts(null);
                        }}
                    >
                        ← Back to Calendar
                    </button>
                </div >
            )
            }

            {feedback && <h2>{feedback}</h2>}


        </>

    );

}