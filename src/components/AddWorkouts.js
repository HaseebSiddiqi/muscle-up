import { useState, useEffect, Fragment } from "react";
import { apiFetch } from "./apiClient.js";
export default function Add_workouts({ selectedWorkout, onSuccess }) {



    const [newWorkout, setNewWorkout] = useState(null);

    const [feedback, setFeedback] = useState("");

    const [viewWorkouts, setViewWorkouts] = useState([]);
    const [latestWorkout, setLatestWorkout] = useState(null);

    useEffect(() => {
        if (!selectedWorkout) return;


        const prev = viewWorkouts
            .filter(w => w.workoutName === selectedWorkout.workoutName)
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

        setLatestWorkout(prev || null);

        setNewWorkout({

            workoutId: Date.now().toString(),
            workoutName: selectedWorkout?.workoutName,
            date: new Date().toLocaleDateString("en-CA"),
            notes: "",

            exercises: selectedWorkout?.exercises.map(ex => {

                // OLD FORMAT support (string)

                const exName = typeof ex === "string" ? ex : ex.name;
                const exType = typeof ex === "string" ? "weight_reps" : ex.type;

                const prevExercise = prev?.exercises?.find(
                    e => e.name === exName
                );

                const setCount = prevExercise?.sets?.length || 3;

                return {
                    name: exName,
                    type: exType,
                    sets: Array.from({ length: setCount }).map(() => {
                        if (exType === "time") return { minutes: null, seconds: null };
                        if (exType === "reps") return { reps: null };
                        return { weight: null, reps: null };
                    })
                };
            })

        });
    }, [selectedWorkout, viewWorkouts]);

    useEffect(() => {
        const fetchWorkouts = async () => {
            const res = await apiFetch(`https://workouttracker-production-4d3e.up.railway.app/workoutLogs`);
            const data = await res.json();
            setViewWorkouts(data.Items || []);

        };

        fetchWorkouts();
    }, [selectedWorkout]);



    const addSets = () => {
        setNewWorkout(prevWorkout => {
            if (prevWorkout.exercises[0].sets.length >= 3) return prevWorkout;
            return {
                ...prevWorkout,
                exercises: prevWorkout.exercises.map(ex => ({
                    ...ex,
                    sets: [
                        ...ex.sets,
                        ex.type === "time"
                            ? { minutes: null, seconds: null }
                            : ex.type === "reps"
                                ? { reps: null }
                                : { weight: null, reps: null }
                    ]
                }))
            };
        });
    };

    const delSets = () => {
        setNewWorkout(prevWorkout => {
            if (prevWorkout.exercises[0].sets.length <= 1) return prevWorkout;
            return {
                ...prevWorkout,
                exercises: prevWorkout.exercises.map(ex => ({
                    ...ex,
                    sets: ex.sets.slice(0, -1)
                }))
            }

        })
    }

    const submitTable = async () => {
        if (!validateWorkout(newWorkout.exercises)) {
            setFeedback("Please fill sets in order");

            setTimeout(() => {
                setFeedback("");
            }, 2000);

            return;
        }
        await apiFetch("https://workouttracker-production-4d3e.up.railway.app/workoutLogs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newWorkout)
        });
        setViewWorkouts(prev => [...prev, newWorkout]);
        setFeedback("Workout Added!");

        setTimeout(() => {
            setFeedback("");
            setNewWorkout(null);
            onSuccess();
        }, 2000);
    }
const isSetFilled = (set) => {
    return Object.values(set).some(
        value => value !== null && value !== ""
    );
};

const isExerciseEmpty = (exercise) => {
    return exercise.sets.every(set => !isSetFilled(set));
};

const validSets = (sets) => {
    let foundEmpty = false;

    for (const set of sets) {
        if (!isSetFilled(set)) {
            foundEmpty = true;
        } 
        else if (foundEmpty) {
            return false;
        }
    }

    return true;
};

const validateWorkout = (exercises) => {
    return exercises.every(exercise => {
        if (isExerciseEmpty(exercise)) return true;

        return validSets(exercise.sets);
    });
};

    const displayExercises = newWorkout?.exercises
        ?.map((exercise, index) => ({
            ...exercise,
            originalIndex: index
        }))
        .sort((a, b) => {
            const order = {
                weight_reps: 0,
                reps: 1,
                time: 2
            };

            return order[a.type] - order[b.type];
        });


    const updateSet = (exerciseIndex, setIndex, field, value) => {
        setNewWorkout(prev => ({
            ...prev,
            exercises: prev.exercises.map((ex, exIndex) =>
                exIndex === exerciseIndex
                    ? {
                        ...ex,
                        sets: ex.sets.map((s, sIndex) =>
                            sIndex === setIndex
                                ? {
                                    ...s,
                                    [field]: value === "" ? null : Number(value)
                                }
                                : s
                        )
                    }
                    : ex
            )
        }));
    };


    const handleNumberInput = (value, max) => {
        if (value === "") return "";
        return Math.min(max, Math.max(0, Number(value)));
    };

    return (

        <>

            <div >

                {feedback && <h2>{feedback}</h2>}
                {newWorkout && (
                    <div className="table-container">
                        <table className="addWorkoutTable">
                            <tbody>

                                <tr>
                                    <th className="spanrow2" colSpan={12}>
                                        <input
                                            type="date"
                                            value={newWorkout.date || ""}
                                            onChange={(e) =>
                                                setNewWorkout(prev => ({
                                                    ...prev,
                                                    date: e.target.value
                                                }))
                                            }
                                        />
                                    </th>
                                </tr>


                                <tr>

                                    <th>
                                        {newWorkout.workoutName}
                                    </th>

                                    {newWorkout.exercises[0].sets.map((_, index) => (
                                        <th key={index}>
                                            Set {index + 1}
                                        </th>
                                    ))}

                                    <th>
                                        Notes
                                    </th>

                                </tr>


                                {displayExercises.map((exercise, i) => {

                                    const exerciseIndex = exercise.originalIndex;

                                    const showUnits =
                                        i === 0 ||
                                        displayExercises[i - 1].type !== exercise.type;


                                    const prevExercise =
                                        latestWorkout?.exercises?.find(
                                            ex => ex.name === exercise.name
                                        );


                                    return (

                                        <Fragment key={exerciseIndex}>


                                            <tr>


                                                <td className="exercise-name-cell">

                                                    <div className="exercise-name-wrapper">

                                                        <div className="exercise-name-content">
                                                            {exercise.name}
                                                        </div>

                                                    </div>

                                                </td>


                                                {exercise.sets.map((set, j) => {


                                                    const prevSet = prevExercise?.sets?.[j];


                                                    return (

                                                        <td className="Sets" key={j}>


                                                            <div className="Sets-content">


                                                                {exercise.type === "weight_reps" && (

                                                                    <div className="set-inputs">


                                                                        <div className="inputWithUnit">



                                                                            <input
                                                                                type="number"
                                                                                value={set.weight}
                                                                                placeholder={prevSet?.weight}
                                                                                onChange={(e) =>
                                                                                    updateSet(
                                                                                        exerciseIndex,
                                                                                        j,
                                                                                        "weight",
                                                                                        handleNumberInput(e.target.value, 999)
                                                                                    )}
                                                                            />
                                                                            {showUnits &&
                                                                                <span className="unit">
                                                                                    lbs
                                                                                </span>
                                                                            }



                                                                        </div>



                                                                        <div className="inputWithUnit">




                                                                            <input
                                                                                type="number"
                                                                                value={set.reps}
                                                                                placeholder={prevSet?.reps}
                                                                                onChange={(e) =>
                                                                                    updateSet(
                                                                                        exerciseIndex,
                                                                                        j,
                                                                                        "reps",
                                                                                        handleNumberInput(e.target.value, 99)
                                                                                    )}
                                                                            />
                                                                            {showUnits &&
                                                                                <span className="unit">
                                                                                    reps
                                                                                </span>
                                                                            }


                                                                        </div>


                                                                    </div>

                                                                )}




                                                                {exercise.type === "reps" && (
                                                                    <div className="set-inputs">
                                                                        <div className="inputWithUnit">




                                                                            <input
                                                                                type="number"
                                                                                value={set.reps}
                                                                                placeholder={prevSet?.reps}
                                                                                onChange={(e) =>
                                                                                    updateSet(
                                                                                        exerciseIndex,
                                                                                        j,
                                                                                        "reps",
                                                                                        handleNumberInput(e.target.value, 99)
                                                                                    )}
                                                                            />
                                                                            {showUnits &&
                                                                                <span className="unit">
                                                                                    reps
                                                                                </span>
                                                                            }
                                                                        </div>


                                                                    </div>

                                                                )}
                                                                {exercise.type === "time" && (
                                                                    <div className="set-inputs">

                                                                        <div className="duration-input">
                                                                            {showUnits &&
                                                                                <div className="duration-labels">

                                                                                    <span className="unit">mins</span>
                                                                                    <span className="unit">sec</span>

                                                                                </div>}

                                                                            <div className="duration-values">
                                                                                <input
                                                                                    type="number"
                                                                                    value={set.minutes}
                                                                                    placeholder={prevSet?.minutes}
                                                                                    onChange={(e) =>
                                                                                        updateSet(
                                                                                            exerciseIndex,
                                                                                            j,
                                                                                            "minutes",
                                                                                            handleNumberInput(e.target.value, 120)
                                                                                        )
                                                                                    }
                                                                                />
                                                                                <span className="time-divider">:</span>
                                                                                <input
                                                                                    type="text"
                                                                                    value={
                                                                                        set.seconds === "" || set.seconds == null
                                                                                            ? ""
                                                                                            : String(set.seconds).padStart(2, "0")
                                                                                    }
                                                                                    placeholder={
                                                                                        prevSet?.seconds != null
                                                                                            ? String(prevSet.seconds).padStart(2, "0")
                                                                                            : ""
                                                                                    }
                                                                                    onChange={(e) =>
                                                                                        updateSet(
                                                                                            exerciseIndex,
                                                                                            j,
                                                                                            "seconds",
                                                                                            handleNumberInput(e.target.value, 59)

                                                                                        )
                                                                                    }
                                                                                />
                                                                            </div>

                                                                        </div>

                                                                    </div>
                                                                )}





                                                            </div>


                                                        </td>

                                                    )

                                                })}



                                                {i === 0 && (

                                                    <td
                                                        className="notes"
                                                        rowSpan={displayExercises.length}
                                                    >

                                                        <textarea
                                                            className="textarea"
                                                            placeholder={
                                                                latestWorkout?.notes ??
                                                                "Workout notes..."
                                                            }
                                                            value={newWorkout.notes}
                                                            onChange={(e) =>
                                                                setNewWorkout({
                                                                    ...newWorkout,
                                                                    notes: e.target.value
                                                                })
                                                            }
                                                        />

                                                    </td>

                                                )}



                                            </tr>


                                        </Fragment>

                                    )

                                })}



                                <tr>

                                    <td colSpan={newWorkout.exercises[0].sets.length + 2}>

                                        <div className="SetControls">

                                            <button
                                                className="addButton"
                                                onClick={addSets}
                                            >
                                                Add Set
                                            </button>


                                            <button
                                                className="minusButton"
                                                onClick={delSets}
                                            >
                                                Delete Set
                                            </button>


                                        </div>


                                    </td>


                                </tr>


                                <tr>

                                    <td className="submitbtn" colSpan={12}>

                                        <button onClick={submitTable}>
                                            Submit
                                        </button>

                                    </td>

                                </tr>


                            </tbody>
                        </table>

                    </div>
                )}















            </div>
        </>
    )


}

