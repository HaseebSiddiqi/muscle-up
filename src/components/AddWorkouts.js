
import { useState, useEffect } from 'react';
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
                console.log(selectedWorkout.exercises);
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
                        if (exType === "time") return { minutes: "", seconds: "" };
                        if (exType === "reps") return { reps: "" };
                        return { weight: "", reps: "" };
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
                    sets: [...ex.sets, { weight: "", reps: "" }]
                }))
            }
        })
    }

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
        return set.reps != null && set.reps !== "";
    }
    const isExerciseEmpty = (exercise) => {
        return exercise.sets.every(set => !isSetFilled(set));
    };
    const validSets = (sets) => {
        for (let i = 0; i < sets.length; i++) {
            if (!isSetFilled(sets[i])) {
                for (let j = i + 1; j < sets.length; j++) {
                    if (isSetFilled(sets[j])) return false;
                }
                break;
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
                                            onChange={(e) => setNewWorkout(prev => ({ ...prev, date: e.target.value }))}
                                        />
                                    </th>
                                </tr>
                                <tr>

                                    <th>{newWorkout.workoutName}  </th>
                                    {newWorkout?.exercises[0]?.sets.map((set, setIndex) => (
                                        <th key={setIndex}>Set {setIndex + 1}</th>
                                    ))}

                                    <th>Notes</th>

                                </tr>
                            
                                {newWorkout?.exercises?.map((exercise, i) => (
                                    <tr key={i}>
                                        

                                        <td className="exercise-name-cell">
                                            <div className="exercise-name-wrapper">
                                                <div className="exercise-name-content">{exercise.name}</div>

                                            </div>
                                        </td>
                                        {exercise.sets.map((set, j) => {

                                            const prevExercise = latestWorkout?.exercises?.find(
                                                ex => ex.name === exercise.name
                                            );

                                            const prevSet = prevExercise?.sets?.[j];

                                            return (
                                                <td className='Sets' key={j}>
                                                    <div className="Sets-content">

                                                        {
                                                            exercise.type === "weight_reps" ? (
                                                                <div className="set-inputs">
                                                                    <div className='inputWithUnit '>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            max="999"
                                                                            value={set.weight}
                                                                            placeholder={prevSet?.weight}
                                                                            onChange={(e) =>
                                                                                setNewWorkout(prev => ({
                                                                                    ...prev,
                                                                                    exercises: prev.exercises.map((ex, exIndex) =>
                                                                                        exIndex === i
                                                                                            ? {
                                                                                                ...ex,
                                                                                                sets: ex.sets.map((s, sIndex) =>
                                                                                                    sIndex === j
                                                                                                        ? {
                                                                                                            ...s,
                                                                                                            weight: e.target.value === ""
                                                                                                                ? ""
                                                                                                                : Math.min(999,
                                                                                                                    Math.max(0, Number(e.target.value))
                                                                                                                )
                                                                                                        }
                                                                                                        : s
                                                                                                )
                                                                                            }
                                                                                            : ex
                                                                                    )
                                                                                }))
                                                                            }
                                                                        />
                                                                        <span className='unit'>lbs</span>
                                                                    </div>
                                                                    <div className='inputWithUnit '>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            max="99"
                                                                            value={set.reps}
                                                                            placeholder={prevSet?.reps}
                                                                            onChange={(e) =>
                                                                                setNewWorkout(prev => ({
                                                                                    ...prev,
                                                                                    exercises: prev.exercises.map((ex, exIndex) =>
                                                                                        exIndex === i
                                                                                            ? {
                                                                                                ...ex,
                                                                                                sets: ex.sets.map((s, sIndex) =>
                                                                                                    sIndex === j
                                                                                                        ? {
                                                                                                            ...s,
                                                                                                            reps: e.target.value === ""
                                                                                                                ? ""
                                                                                                                : Math.min(99,
                                                                                                                    Math.max(0, Number(e.target.value))
                                                                                                                )
                                                                                                        }


                                                                                                        : s
                                                                                                )
                                                                                            }
                                                                                            : ex
                                                                                    )
                                                                                }))
                                                                            }
                                                                        />
                                                                        <span className='unit'>reps</span>

                                                                    </div>
                                                                </div>
                                                            ) : exercise.type === "reps" ? (
                                                                <div className="set-input">

                                                                    <div className='inputWithUnit ' colSpan={2}>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            max="99"
                                                                            value={set.reps}
                                                                            placeholder={prevSet?.reps}
                                                                            onChange={(e) =>
                                                                                setNewWorkout(prev => ({
                                                                                    ...prev,
                                                                                    exercises: prev.exercises.map((ex, exIndex) =>
                                                                                        exIndex === i
                                                                                            ? {
                                                                                                ...ex,
                                                                                                sets: ex.sets.map((s, sIndex) =>
                                                                                                    sIndex === j
                                                                                                        ? {
                                                                                                            ...s,
                                                                                                            reps: e.target.value === ""
                                                                                                                ? ""
                                                                                                                : Math.min(99,
                                                                                                                    Math.max(0, Number(e.target.value))
                                                                                                                )
                                                                                                        }


                                                                                                        : s
                                                                                                )
                                                                                            }
                                                                                            : ex
                                                                                    )
                                                                                }))
                                                                            }
                                                                        />
                                                                        <span className='unit'>reps</span>

                                                                    </div>
                                                                </div>

                                                            ) : exercise.type === "time" ? (
                                                                <div className="set-inputs">
                                                                    <div className='inputWithUnit '>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            max="99"
                                                                            value={set.minutes}
                                                                            placeholder={prevSet?.minutes}
                                                                            onChange={(e) =>
                                                                                setNewWorkout(prev => ({
                                                                                    ...prev,
                                                                                    exercises: prev.exercises.map((ex, exIndex) =>
                                                                                        exIndex === i
                                                                                            ? {
                                                                                                ...ex,
                                                                                                sets: ex.sets.map((s, sIndex) =>
                                                                                                    sIndex === j
                                                                                                        ? {
                                                                                                            ...s,
                                                                                                            minutes: e.target.value === ""
                                                                                                                ? ""
                                                                                                                : Math.min(99,
                                                                                                                    Math.max(0, Number(e.target.value))
                                                                                                                )
                                                                                                        }


                                                                                                        : s
                                                                                                )
                                                                                            }
                                                                                            : ex
                                                                                    )
                                                                                }))
                                                                            }
                                                                        />
                                                                        <span className='unit'>mins</span>

                                                                    </div>
                                                                    <div className='inputWithUnit '>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            max="59"
                                                                            value={set.seconds}
                                                                            placeholder={prevSet?.seconds}
                                                                            onChange={(e) =>
                                                                                setNewWorkout(prev => ({
                                                                                    ...prev,
                                                                                    exercises: prev.exercises.map((ex, exIndex) =>
                                                                                        exIndex === i
                                                                                            ? {
                                                                                                ...ex,
                                                                                                sets: ex.sets.map((s, sIndex) =>
                                                                                                    sIndex === j
                                                                                                        ? {
                                                                                                            ...s,
                                                                                                            seconds: e.target.value === ""
                                                                                                                ? ""
                                                                                                                : Math.min(59,
                                                                                                                    Math.max(0, Number(e.target.value))
                                                                                                                )
                                                                                                        }


                                                                                                        : s
                                                                                                )
                                                                                            }
                                                                                            : ex
                                                                                    )
                                                                                }))
                                                                            }
                                                                        />
                                                                        <span className='unit'>sec</span>

                                                                    </div>

                                                                </div>

                                                            ) :
                                                                null
                                                        }


                                                    </div>
                                                </td>
                                            )
                                        })}
                                        {i === 0 && (
                                            <td className="notes" rowSpan={newWorkout.exercises.length}>
                                                <textarea className="textarea" placeholder={latestWorkout?.notes ?? "Workout notes..."} value={newWorkout.notes} onChange={e => setNewWorkout({ ...newWorkout, notes: e.target.value })} />
                                            </td>
                                        )}

                                    </tr>
                                ))}
                                <tr>
                                    <td colSpan={newWorkout.exercises[0].sets.length + 2}>

                                        <div className='SetControls'>
                                            <button className="addButton" onClick={addSets}>Add Set</button>
                                            <button className="minusButton" onClick={delSets}>Delete Set</button>
                                        </div>
                                    </td>


                                </tr>
                                <tr>
                                    <td className='submitbtn' colSpan={12}>
                                        <button onClick={submitTable}>Submit</button></td>
                                </tr>
                            </tbody>
                        </table>

                    </div>
                )}















            </div>
        </>
    )


}

