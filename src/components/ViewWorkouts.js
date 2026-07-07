import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import React from "react";
import { apiFetch } from "./apiClient.js";

export default function ViewWorkouts({ refreshKey }) {


    const [viewWorkouts, updateWorkouts] = useState([]);

    const [viewCalender, updateCalender] = useState(true);

    const [currentDate, setDate] = useState(null);

    const [feedback, setFeedback] = useState("");

    const [isEditing, setIsEditing] = useState(false);
    const [editWorkouts, setEditWorkouts] = useState(null);


    useEffect(() => {
        const fetchWorkouts = async () => {
            try {
                const res = await apiFetch(`https://workouttracker-production-4d3e.up.railway.app/workoutLogs`);
                const data = await res.json();
                const normalized = (data.Items || []).map(w => ({
                    ...w,
                    exercises: w.exercises.map(ex => ({
                        ...ex,
                        type: ex.type || "weight_reps"   // 🔥 default for old workouts
                    }))
                }));

                updateWorkouts(normalized);

            }
            catch (err) {
                console.error(err);
            }
        }

        fetchWorkouts();


    }, [refreshKey])

    const updateWorkout = async (workoutId) => {
        await apiFetch(`https://workouttracker-production-4d3e.up.railway.app/workoutLogs/${workoutId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editWorkouts)
        });

        updateWorkouts(prev =>
            prev.map(w =>
                w.workoutId === workoutId ? editWorkouts : w
            )
        );

        setIsEditing(false);

    }

    const handleDelete = async (workoutId) => {
        await apiFetch(`https://workouttracker-production-4d3e.up.railway.app/workoutLogs/${workoutId}`, {
            method: "DELETE"
        });

        updateWorkouts(prev =>
            prev.filter(w => w.workoutId !== workoutId)
        );
        updateCalender(true);


        setFeedback("Workout Deleted!")
        setTimeout(() => {
            setFeedback("");
        }, 2000)


    };

    const isWorkout = (date) => {
        const dateString = date.toISOString().split("T")[0];
        return viewWorkouts.some(w => w.date === dateString);
    }
    return (
        <>

            {viewCalender ? (<div>
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
                        }
                        }

                    />

                </div>
                <div className="Calander bottom ">
                    <div className="legend">
                        <p> <span className="orange-square"></span>  No Session </p>
                        <p> <span className="blue-square"></span> Workout Logged  </p>
                        <p className="legend-hint">
                            Click blue days to view details
                        </p>
                    </div>
                </div>
            </div>

            ) : (
                <div>
                    <div className="table-container">
                        <table className="addWorkoutTable" >
                            <tbody>

                                <tr>
                                    <th className="spanrow" colSpan={99} >{currentDate?.toISOString().split("T")[0]}</th>
                                </tr>
                                {viewWorkouts
                                    .filter(w => w.date === currentDate?.toISOString().split("T")[0])
                                    .map((w, index, arr) => (
                                        <React.Fragment key={w.workoutId}>
                                            <tr>
                                                <th>{w.workoutName}</th>

                                                {w.exercises[0].sets.map((set, i) => (
                                                    <th key={i}>
                                                        <div key={i}>
                                                            Set {i + 1}
                                                        </div>
                                                    </th>

                                                ))}
                                                <th> Notes</th>


                                            </tr>

                                            {w.exercises?.map((exercise, exerciseIndex) => (

                                                <tr key={exerciseIndex}>
                                                    <td className="exercise-name-cell">

                                                        <div className="exercise-name-content">{exercise.name}</div>

                                                    </td>

                                                    {exercise.sets.map((set, i) => (
                                                        <td className='Sets' key={i}>
                                                            <div className="Sets-content">
                                                                <div className="set-inputs">


                                                                    {isEditing ? (
                                                                        <>

                                                                            {exercise.type === "weight_reps" && (
                                                                                <>
                                                                                    <div className="inputWithUnit">
                                                                                        <input
                                                                                            type="number"
                                                                                            min="0"
                                                                                            max="999"
                                                                                            value={editWorkouts.exercises[exerciseIndex].sets[i].weight ?? ""}
                                                                                            onChange={(e) => {
                                                                                                const copy = structuredClone(editWorkouts);
                                                                                                copy.exercises[exerciseIndex].sets[i].weight =
                                                                                                    e.target.value === ""
                                                                                                        ? ""
                                                                                                        : Math.min(999, Math.max(0, Number(e.target.value)));
                                                                                                setEditWorkouts(copy);
                                                                                            }}
                                                                                        />
                                                                                        {set.weight !== "" && <span className="unit">lbs</span>}
                                                                                    </div>

                                                                                    <div className="inputWithUnit">
                                                                                        <input
                                                                                            type="number"
                                                                                            min="0"
                                                                                            max="999"
                                                                                            value={editWorkouts.exercises[exerciseIndex].sets[i].reps ?? ""}
                                                                                            onChange={(e) => {
                                                                                                const copy = structuredClone(editWorkouts);
                                                                                                copy.exercises[exerciseIndex].sets[i].reps =
                                                                                                    e.target.value === ""
                                                                                                        ? ""
                                                                                                        : Math.min(999, Math.max(0, Number(e.target.value)));
                                                                                                setEditWorkouts(copy);
                                                                                            }}
                                                                                        />
                                                                                        {set.reps !== "" && <span className="unit">reps</span>}
                                                                                    </div>
                                                                                </>
                                                                            )}
                                                                            {exercise.type === "reps" && (
                                                                                <div className="set-input">
                                                                                    <div className="inputWithUnit">
                                                                                        <input
                                                                                            type="number"
                                                                                            value={editWorkouts.exercises[exerciseIndex].sets[i].reps ?? ""}
                                                                                            onChange={(e) => {
                                                                                                const copy = structuredClone(editWorkouts);
                                                                                                copy.exercises[exerciseIndex].sets[i].reps =
                                                                                                    e.target.value === ""
                                                                                                        ? ""
                                                                                                        : Math.min(999, Math.max(0, Number(e.target.value)));
                                                                                                setEditWorkouts(copy);
                                                                                            }}
                                                                                        />
                                                                                        {set.reps !== "" && <span className="unit">reps</span>}
                                                                                    </div>
                                                                                </div>
                                                                            )}


                                                                            {exercise.type === "time" && (
                                                                                <>
                                                                                    <div className="inputWithUnit">
                                                                                        <input
                                                                                            type="number"
                                                                                            value={editWorkouts.exercises[exerciseIndex].sets[i].minutes ?? ""}
                                                                                            onChange={(e) => {
                                                                                                const copy = structuredClone(editWorkouts);
                                                                                                copy.exercises[exerciseIndex].sets[i].minutes =
                                                                                                    e.target.value === ""
                                                                                                        ? ""
                                                                                                        : Math.min(99, Math.max(0, Number(e.target.value)));
                                                                                                setEditWorkouts(copy);
                                                                                            }}
                                                                                        />
                                                                                        {set.minutes !== "" && <span className="unit">min</span>}
                                                                                    </div>

                                                                                    <div className="inputWithUnit">
                                                                                        <input
                                                                                            type="number"
                                                                                            value={editWorkouts.exercises[exerciseIndex].sets[i].seconds ?? ""}
                                                                                            onChange={(e) => {
                                                                                                const copy = structuredClone(editWorkouts);
                                                                                                copy.exercises[exerciseIndex].sets[i].seconds =
                                                                                                    e.target.value === ""
                                                                                                        ? ""
                                                                                                        : Math.min(59, Math.max(0, Number(e.target.value)));
                                                                                                setEditWorkouts(copy);
                                                                                            }}
                                                                                        />
                                                                                        {set.seconds !== "" && <span className="unit">sec</span>}
                                                                                    </div>
                                                                                </>
                                                                            )}

                                                                        </>
                                                                    ) : (
                                                                        <>

                                                                            {exercise.type === "weight_reps" && (
                                                                                <>
                                                                                    <div className="inputWithUnit">
                                                                                        <div className="inputValue">{set.weight}</div>
                                                                                        {set.weight !== "" && <span className="unit">lbs</span>}
                                                                                    </div>
                                                                                    <div className="inputWithUnit">
                                                                                        <div className="inputValue">{set.reps}</div>
                                                                                        {set.reps !== "" && <span className="unit">reps</span>}
                                                                                    </div>
                                                                                </>
                                                                            )}


                                                                            {exercise.type === "reps" && (
                                                                                <div className="set-input">
                                                                                    <div className="inputWithUnit">
                                                                                        <div className="inputValue">{set.reps}</div>
                                                                                        {set.reps !== "" && <span className="unit">reps</span>}
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            {exercise.type === "time" && (
                                                                                <>
                                                                                    <div className="inputWithUnit">
                                                                                        <div className="inputValue">{set.minutes}</div>
                                                                                        {set.minutes !== "" && <span className="unit">min</span>}
                                                                                    </div>
                                                                                    <div className="inputWithUnit">
                                                                                        <div className="inputValue">{set.seconds}</div>
                                                                                        {set.seconds !== "" && <span className="unit">sec</span>}

                                                                                    </div>
                                                                                </>

                                                                            )}

                                                                        </>

                                                                    )}

                                                                </div>

                                                            </div>
                                                        </td>
                                                    ))}
                                                    {exerciseIndex === 0 && (

                                                        <td rowSpan={w.exercises.length}>
                                                            {isEditing ? (
                                                                <textarea className="textarea"
                                                                    value={editWorkouts.notes}
                                                                    onChange={(e) => {
                                                                        const copy = structuredClone(editWorkouts);
                                                                        copy.notes = e.target.value;
                                                                        setEditWorkouts(copy);
                                                                    }} />
                                                            ) : (w.notes

                                                            )}
                                                        </td>

                                                    )}



                                                </tr>
                                            ))}

                                            <tr>
                                                <td colSpan={99}>
                                                    <div className='SetControls'>
                                                        <button className="addButton" onClick={() => {
                                                            if (!isEditing) {

                                                                setEditWorkouts(structuredClone(w));
                                                                setIsEditing(true);
                                                            } else {
                                                                updateWorkout(w.workoutId);

                                                            }
                                                        }}>
                                                            {isEditing ? "Save" : "Edit"}

                                                        </button>

                                                        <button className="minusButton" onClick={() => {
                                                            const confirmed = window.confirm("Delete this workout?");
                                                            if (confirmed) {
                                                                handleDelete(w.workoutId);
                                                            }
                                                        }} > Delete

                                                        </button>
                                                    </div>
                                                </td>

                                            </tr>
                                            {index < arr.length - 1 && (
                                                <tr className="workout-spacer-row">
                                                    <td colSpan={12}></td>
                                                </tr>
                                            )}
                                        </React.Fragment>


                                    ))}


                            </tbody>
                        </table>

                    </div>

                    <button className="my-button" onClick={() => { updateCalender(true); setIsEditing(false); }} >Back to Calendar</button>
                </div>



            )

            }
            {feedback && <h2>{feedback}</h2>}




        </>

    )



}