import { useState, useEffect, Fragment, useRef } from "react";
import { apiFetch } from "./apiClient.js";
import { useUnits } from "../contexts/unitContext";

export default function Add_workouts({ selectedWorkout, onSuccess }) {
    const {weightUnit, distanceUnit, milesToKm,  lbsToKg,  convertWorkoutToSave} = useUnits();

    const [newWorkout, setNewWorkout] = useState(null);
    const [feedback, setFeedback] = useState("");
    const [viewWorkouts, setViewWorkouts] = useState([]);
    const [latestWorkout, setLatestWorkout] = useState(null);
    const [startTime, setStartTime] = useState(null);
    const [showDurationPopup, setShowDurationPopup] = useState(false);
    const [duration, setDuration] = useState(null);

    const durationRef = useRef(null);

    useEffect(() => {
        if (showDurationPopup) {
            requestAnimationFrame(() => {
                setTimeout(() => {
                    const element = durationRef.current;

                    if (!element) return;

                    const rect = element.getBoundingClientRect();
                    const viewportHeight = window.innerHeight;

                    // Already fully visible, don't move
                    if (rect.top >= 0 && rect.bottom <= viewportHeight) {
                        return;
                    }

                    window.scrollTo({
                        top: window.scrollY + rect.bottom - viewportHeight + 50,
                        behavior: "smooth"
                    });

                }, 100);
            });
        }
    }, [showDurationPopup]);

    useEffect(() => {
        if (!selectedWorkout) return;
        setStartTime(new Date());

        const prev = viewWorkouts
            .filter(w => w.workoutName === selectedWorkout.workoutName)
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

        setLatestWorkout(prev || null);
        setShowDurationPopup(false);
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



                if (exType === "cardio") {
                    return {
                        name: exName,
                        type: exType,
                        duration: null,
                        distance: null,
                        calories: null
                    };
                }

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
            if (prevWorkout.exercises
                .filter(ex => ex.type !== "cardio")
                .every(ex => ex.sets.length >= 3)
            ) return prevWorkout;

            return {
                ...prevWorkout,

                exercises: prevWorkout.exercises.map(ex => {
                    if (ex.type === "cardio") return ex;

                    return {
                        ...ex,
                        sets: [
                            ...ex.sets,
                            ex.type === "time"
                                ? { minutes: null, seconds: null }
                                : ex.type === "reps"
                                    ? { reps: null }
                                    : { weight: null, reps: null }
                        ]
                    };
                })
            };
        });
    };

    const delSets = () => {
        setNewWorkout(prevWorkout => {

            const nonCardioExercises = prevWorkout.exercises.filter(
                ex => ex.type !== "cardio"
            );
            if (nonCardioExercises.length === 0) return prevWorkout;

            if (nonCardioExercises[0].sets.length <= 1) return prevWorkout;
            return {
                ...prevWorkout,
                exercises: prevWorkout.exercises.map(ex => {
                    if (ex.type === "cardio") return ex;
                    return {
                        ...ex,
                        sets: ex.sets.slice(0, -1)
                    };
                })
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
        const endTime = new Date();
        const workoutDuration = Math.floor((endTime - startTime) / 60000);
        setDuration(workoutDuration);
        setShowDurationPopup(true);


    }

    const saveWorkout = async (duration) => {

        const workout = {
            ...newWorkout,
            duration
        };
        const workoutToSave = convertWorkoutToSave(
            workout, 
            distanceUnit,
            weightUnit
        )

        await apiFetch("https://workouttracker-production-4d3e.up.railway.app/workoutLogs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(workoutToSave)
        });
        setViewWorkouts(prev => [...prev, workoutToSave]);
        setFeedback("Workout Added!");
        console.log(workoutToSave);
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
            if (exercise.type === "cardio") {
                return true;
            }
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
                time: 2,
                cardio: 3
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

    const handleNumberInput = (value, max, previousValue) => {
    if (value === "") return "";

    if (!/^\d*\.?\d{0,1}$/.test(value)) {
        return previousValue;
    }

    return Math.min(max, Math.max(0, Number(value)));
};

    return (

        <>

            <div >

                {feedback && <h2>{feedback}</h2>}
                {newWorkout && (

                    < div className="table-container">
                        <table className="addWorkoutTable">
                            <tbody>
                                <tr>
                                    <td className="spanrow2" colSpan={12}>
                                        <input
                                            type="date"
                                            value={newWorkout.date || ""}
                                            onChange={(e) =>
                                                setNewWorkout(prev => ({
                                                    ...prev,
                                                    date: e.target.value
                                                }))
                                            }
                                            className="date-input"
                                        />
                                    </td>
                                </tr>


                                <tr>

                                    <th>
                                        {newWorkout.workoutName}
                                    </th>

                                    {newWorkout.exercises.some(ex => ex.type !== "cardio") ? (
                                        Array.from({
                                            length: newWorkout.exercises.find(ex => ex.type !== "cardio").sets.length
                                        }).map((_, index) => (
                                            <th key={index}>
                                                Set {index + 1}
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

                                                {exercise.type === "cardio" ? (
                                                    <td className="cardio-cell" colSpan={newWorkout.exercises.find(ex => ex.type !== "cardio")?.sets.length || 3}>
                                                        <div className="cardio-inputs">

                                                            <div className="inputWithUnit">
                                                                <input
                                                                    type="number"
                                                                    className="no-spinner"
                                                                    step= "1"
                                                                    value={exercise.duration ?? ""}
                                                                    placeholder={prevExercise?.duration ?? ""}
                                                                    onKeyDown={(e) => {
                                                                        if (["e", "E", "+", "-", "."].includes(e.key)) {
                                                                            e.preventDefault();
                                                                        }
                                                                    }}
                                                                    onChange={e => {
                                                                        setNewWorkout(prev => ({
                                                                            ...prev,
                                                                            exercises: prev.exercises.map((ex, index) =>
                                                                                index === exerciseIndex
                                                                                    ? {
                                                                                        ...ex,
                                                                                        duration: e.target.value === "" ? null : Math.min(999, Math.max(0, Number(e.target.value)))
                                                                                    }
                                                                                    : ex
                                                                            )
                                                                        }));
                                                                    }}
                                                                />
                                                                <span className="unit">mins</span>
                                                            </div>

                                                            <div className="inputWithUnit">
                                                                <input
                                                                    type="number"
                                                                    className="no-spinner"
                                                                    step="0.1"
                                                                    value={exercise.distance ?? ""}
                                                                    placeholder={
                                                                        distanceUnit === "km"
                                                                            ? prevExercise?.distance != null
                                                                                ? milesToKm(prevExercise.distance).toFixed(2)
                                                                                : ""
                                                                            : prevExercise?.distance != null
                                                                                ? prevExercise.distance.toFixed(2)
                                                                                : ""
                                                                    }
                                                                    onKeyDown={(e) => {
                                                                        if (["e", "E", "+", "-"].includes(e.key)) {
                                                                            e.preventDefault();
                                                                        }
                                                                    }}
                                                                    onChange={e => {
                                                                        const value = e.target.value;

                                                                        if (!/^\d*\.?\d{0,2}$/.test(value)) {
                                                                            return;
                                                                        }

                                                                        setNewWorkout(prev => ({
                                                                            ...prev,
                                                                            exercises: prev.exercises.map((ex, index) =>
                                                                                index === exerciseIndex
                                                                                    ? {
                                                                                        ...ex,
                                                                                        distance: value === ""
                                                                                            ? null
                                                                                            : Math.min(99, Math.max(0, Number(value)))
                                                                                    }
                                                                                    : ex
                                                                            )
                                                                        }));
                                                                    }}
                                                                />
                                                                <span className="unit">{distanceUnit}</span>
                                                            </div>

                                                            <div className="inputWithUnit">
                                                                <input
                                                                    type="number"
                                                                    className="no-spinner"
                                                                    step= "1"
                                                                    value={exercise.calories ?? ""}
                                                                    placeholder={prevExercise?.calories ?? ""}
                                                                    onKeyDown={(e) => {
                                                                        if (["e", "E", "+", "-", "."].includes(e.key)) {
                                                                            e.preventDefault();
                                                                        }
                                                                    }}
                                                                    onChange={e => {
                                                                        setNewWorkout(prev => ({
                                                                            ...prev,
                                                                            exercises: prev.exercises.map((ex, index) =>
                                                                                index === exerciseIndex
                                                                                    ? {
                                                                                        ...ex,
                                                                                        calories: e.target.value === "" ? null : Math.min(999, Math.max(0, Number(e.target.value)))
                                                                                    }
                                                                                    : ex
                                                                            )
                                                                        }));
                                                                    }}
                                                                />
                                                                <span className="unit">cals</span>
                                                            </div>

                                                        </div>
                                                    </td>
                                                ) : (
                                                    exercise.sets.map((set, j) => {
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
                                                                                    placeholder={
                                                                                        weightUnit === "kg"
                                                                                            ? prevSet?.weight != null && prevSet.weight !== ""
                                                                                                ? Number(lbsToKg(prevSet.weight).toFixed(1))
                                                                                                : undefined
                                                                                            : prevSet?.weight != null && prevSet.weight !== ""
                                                                                                ? Number(prevSet.weight.toFixed(1))
                                                                                                : undefined}
                                                                                    onKeyDown={(e) => {
                                                                                        if (["e", "E", "+", "-"].includes(e.key)) {
                                                                                            e.preventDefault();
                                                                                        }
                                                                                    }}
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
                                                                                        {weightUnit}
                                                                                    </span>
                                                                                }
                                                                            </div>
                                                                            <div className="inputWithUnit">
                                                                                <input
                                                                                    type="number"
                                                                                    value={set.reps}
                                                                                    placeholder={prevSet?.reps}
                                                                                    onKeyDown={(e) => {
                                                                                        if (["e", "E", "+", "-", "."].includes(e.key)) {
                                                                                            e.preventDefault();
                                                                                        }
                                                                                    }}
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
                                                                                    onKeyDown={(e) => {
                                                                                        if (["e", "E", "+", "-", "."].includes(e.key)) {
                                                                                            e.preventDefault();
                                                                                        }
                                                                                    }}
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
                                                                                        onKeyDown={(e) => {
                                                                                            if (["e", "E", "+", "-", "."].includes(e.key)) {
                                                                                                e.preventDefault();
                                                                                            }
                                                                                        }}
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
                                                        );
                                                    })
                                                )}

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
                                    {newWorkout.exercises.some(ex => ex.type !== "cardio") ? (
                                        <td colSpan={5}>

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
                                        </td>) : (null)}
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
                {showDurationPopup && (
                    <div ref={durationRef} className="duration-section">
                        <div className="popup">
                            <h3>Workout Duration (mins)</h3>

                            <input
                                type="number"
                                min={0}
                                max={999}
                                value={duration ?? ""}
                                onKeyDown={(e) => {
                                    if (["e", "E", "+", "-", "."].includes(e.key)) {
                                        e.preventDefault();
                                    }
                                }}
                                onChange={(e) => {
                                    const value = e.target.value;

                                    if (value === "") {
                                        setDuration(null);
                                        return;
                                    }

                                    setDuration(Math.min(999, Number(value)));
                                }}
                            />

                            <div className="popup-buttons">
                                <button
                                    className="save-btn"
                                    onClick={() => {
                                        saveWorkout(duration);
                                        setShowDurationPopup(false);
                                    }}
                                >
                                    Save
                                </button>

                                <button
                                    className="skip-btn"
                                    onClick={() => {
                                        saveWorkout(null);
                                        setShowDurationPopup(false);
                                    }}
                                >
                                    Skip
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div >
        </>
    )

}

