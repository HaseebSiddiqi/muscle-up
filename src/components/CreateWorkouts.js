import { useState, useEffect } from "react";
import { apiFetch } from "./apiClient.js";

export default function Create_workouts({ onSuccess }) {


    const [workouts, setWorkouts] = useState([]);

    const [workoutNameInput, setWorkoutNameInput] = useState("");

    const [exercises, setExercises] = useState([{ name: "", type: "weight_reps" }, { name: "", type: "" }, { name: "", type: "" }]);

    const [feedback, setFeedback] = useState("");


    useEffect(() => {

        const fetchWorkouts = async () => {
            try {

                const res = await apiFetch(`https://workouttracker-production-4d3e.up.railway.app/workouts`);
                const data = await res.json();

                setWorkouts(data.Items || []);
            }
            catch (err) {
                console.error(err);
            }
        }

        fetchWorkouts();

    }, [])

    const newWorkout = async () => {


        if (!workoutNameInput.trim()) {
            alert("Please enter a Workout Name");
            return;
        }

        const validExercises = exercises.map(e => e.name.trim()).filter(e => e !== "");
        if (validExercises.length !== exercises.length) {
            alert("Please fill all exercises");
            return;
        }

        const workout = {

            workoutName: workoutNameInput.trim(),
            exercises: exercises
        };

        setWorkouts([...workouts, workout]);

        await apiFetch("https://workouttracker-production-4d3e.up.railway.app/workouts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(workout)
        });

        setWorkoutNameInput("");
        setExercises([{ name: "", type: "weight_reps" }, { name: "", type: "weight_reps" }, { name: "", type: "weight_reps" }]);

        setFeedback("New Workout Type Created!")
        setTimeout(() => {
            setFeedback("");
        }, 2000)

        onSuccess();

    }



    return (
        <>
            {feedback && <h2>{feedback}</h2>}
            <div className="table-container">
                <table className="workout-table create-workout-table">
                    <tbody>
                        <tr>
                            <td className='spanrow2' colSpan={4}>
                                <h2>Create Workout Type</h2>
                            </td>
                        </tr>

                        <tr>
                            <td className="inputCell create-name-cell" colSpan={4}>
                                <input
                                    value={workoutNameInput}
                                    maxLength={20}
                                    onChange={e => setWorkoutNameInput(e.target.value)}
                                    className="inputText"
                                    placeholder="Workout Name…"
                                />
                            </td>
                        </tr>
                        <tr>
                            <th className="NewWorkoutType" colSpan={2}>Exercises</th>
                            <th className="NewWorkoutType" colSpan={2}>Exercise Type</th>

                        </tr>

                        {exercises.map((exercise, i) => (
                            <tr key={i}>
                                <td className="inputCell" colSpan={2}>
                                    <input
                                        value={exercise.name}
                                        maxLength={20}
                                        onChange={e => {
                                            const newExercises = [...exercises];
                                            newExercises[i].name = e.target.value;
                                            setExercises(newExercises);
                                        }}
                                        className="inputText"
                                        placeholder={`Exercise ${i + 1}…`}
                                    />
                                </td>
                                <td className="inputCell" colSpan={2}>
                                    <select
                                        value={exercise.type}
                                        maxLength={20}
                                        onChange={e => {
                                            const newExercises = [...exercises];
                                            newExercises[i].type = e.target.value;
                                            setExercises(newExercises);
                                        }}
                                        className="inputText">

                                        <option value="weight_reps">Weight + Reps </option>
                                        <option value="time">Duration (mm:ss)</option>
                                        <option value="reps">Reps</option>
                                    </select>

                                </td>


                            </tr>
                        ))}
                        <tr>
                            <td colSpan={4} className="controlsCell">
                                <div className="SetControls">
                                    <button className="addButton"
                                        onClick={() => setExercises(prev => prev.length < 10 ? [...prev, { name: "", type: "weight_reps" }] : prev)}>
                                        Add Exercise
                                    </button>
                                    <button className="minusButton"
                                        onClick={() => setExercises(prev => prev.length > 1 ? prev.slice(0, -1) : prev)}>
                                        Delete Exercise
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td className='submitbtn' colSpan={4}>
                                <button onClick={newWorkout}>Submit</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>





        </>
    );
}

