import { useState, useEffect } from "react";
import { apiFetch } from "./apiClient.js";
import exerciseList from "../data/exerciseList.js";
import "../styles.css";

export default function Create_workouts({ onSuccess, active }) {


    const [workouts, setWorkouts] = useState([]);
    const [dropDown, setDropDown] = useState(null);
    const [muscleGroup, setMuscleGroup] = useState(null);
    const [selectedColour, setSelectedColour] = useState("blue");
    const [description, setDescription] = useState("");
    const [isRounds, setIsRounds] = useState(false);
    const [workoutNameInput, setWorkoutNameInput] = useState("");

    const [exercises, setExercises] = useState([{ name: "", type: "weight_reps" }, { name: "", type: "weight_reps" }, { name: "", type: "weight_reps" }]);

    const [feedback, setFeedback] = useState("");

    useEffect(() => {
        if (active) {
            setDropDown(null);
            setMuscleGroup(null);
            setWorkoutNameInput("");
            setExercises([
                { name: "", type: "weight_reps" },
                { name: "", type: "weight_reps" },
                { name: "", type: "weight_reps" }
            ]);
            setDescription("");
            setIsRounds(false);
            setSelectedColour("blue");
        }
    }, [active]);

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
            exercises: exercises,
            description: description,
            isRounds: isRounds,
            colour: selectedColour

        };

        setWorkouts([...workouts, workout]);
        console.log(workout);

        await apiFetch("https://workouttracker-production-4d3e.up.railway.app/workouts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(workout)
        });

        setWorkoutNameInput("");
        setExercises([{ name: "", type: "weight_reps" }, { name: "", type: "weight_reps" }, { name: "", type: "weight_reps" }]);
        setDescription("")
        setSelectedColour("blue");
        setIsRounds(false);
        setFeedback("New Workout Type Created!");
        setTimeout(() => {
            setFeedback("");
        }, 2000);

        onSuccess();

    }



    return (
        <>
            {feedback && <h2>{feedback}</h2>}

            <form className="create-workout-form">
                <div className="form-section">
                    <h2>Create Workout</h2>
                    <input
                        value={workoutNameInput}
                        maxLength={25}
                        onChange={e => setWorkoutNameInput(e.target.value)}
                        className="workout-name-input"
                        placeholder="Workout Name…"
                    />
                </div>


                <div className="exercises-section">
                    <h3>Exercises</h3>

                    <div className="exercises-list">
                        {exercises.map((exercise, i) => (
                            <div key={i} className="exercise-row">
                                <div className="exercise-input-wrapper"
                                    onFocus={() => { setDropDown(i); setMuscleGroup(null); }}
                                >
                                    <label>Exercise Name</label>
                                    <input
                                        value={exercise.name}
                                        maxLength={20}
                                        onChange={e => {
                                            const newExercises = [...exercises];
                                            newExercises[i].name = e.target.value;
                                            setExercises(newExercises);
                                            setDropDown(null);
                                            setMuscleGroup(null);
                                        }}
                                        className="exercise-name-input"
                                        placeholder={`Exercise ${i + 1}…`}
                                    />
                                    {dropDown === i && (
                                        muscleGroup === null ? (
                                            <div className="exercise-selector">
                                                <h5 onClick={() => { setDropDown(null); }}>← Select Category </h5>
                                                {Object.keys(exerciseList).map(group => (
                                                    <div className="list" onClick={() => setMuscleGroup(group)}>
                                                        {group}
                                                    </div>
                                                ))}

                                            </div>

                                        ) : (

                                            <div className="exercise-selector">
                                                <h5 onClick={() => { setMuscleGroup(null); }}> ← Select Exercise</h5>
                                                {exerciseList[muscleGroup].map(exercise => (
                                                    <div className="list" onClick={() => {
                                                        const newExercises = [...exercises];
                                                        newExercises[i].name = exercise.name;
                                                        newExercises[i].type = exercise.type;
                                                        setExercises(newExercises);
                                                        setDropDown(null);
                                                        setMuscleGroup(null);
                                                    }}>
                                                        {exercise.name}
                                                    </div>
                                                ))}</div>

                                        )
                                    )}
                                </div>

                                <div className="exercise-type-wrapper">
                                    <label>Exercise Type</label>
                                    <select
                                        value={exercise.type}
                                        onChange={e => {
                                            const newExercises = [...exercises];
                                            newExercises[i].type = e.target.value;
                                            setExercises(newExercises);
                                        }}
                                        className="exercise-type-select">

                                        <option value="weight_reps">Weight + Reps </option>
                                        <option value="reps">Reps</option>
                                        <option value="time">Duration (mm:ss)</option>
                                        <option value="cardio">Cardio</option>

                                    </select>

                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="Workout-Description">
                    <label>Description</label>

                    <input value={description} maxLength={100} onChange={e => setDescription(e.target.value)} placeholder="Enter A Short Workout Description"></input>
                </div>

                <div className="workout-type-container">
                    <label>Workout Type</label>

                    <button
                        type="button"
                        className={`workout-type-toggle ${isRounds ? "rounds" : ""}`}
                        onClick={() => setIsRounds(!isRounds)}
                    >
                        <span>
                            <span>Sets</span>
                            <span>Rounds</span>
                        </span>
                    </button>
                </div>

                <div className="Colour-Picker">
                    <label>Select A Colour</label>

                    <p className="Colour-Row">
                        <span className={`colour-square blue-square ${selectedColour === "blue" ? "selected" : ""}`} onClick={() => setSelectedColour("blue")}></span>
                        <span className={`colour-square red-square ${selectedColour === "red" ? "selected" : ""}`} onClick={() => setSelectedColour("red")}></span>
                        <span className={`colour-square green-square ${selectedColour === "green" ? "selected" : ""}`} onClick={() => setSelectedColour("green")}></span>
                        <span className={`colour-square yellow-square ${selectedColour === "yellow" ? "selected" : ""}`} onClick={() => setSelectedColour("yellow")}></span>
                        <span className={`colour-square teal-square ${selectedColour === "teal" ? "selected" : ""}`} onClick={() => setSelectedColour("teal")}></span>
                        <span className={`colour-square pink-square ${selectedColour === "pink" ? "selected" : ""}`} onClick={() => setSelectedColour("pink")}></span>
                        <span className={`colour-square purple-square ${selectedColour === "purple" ? "selected" : ""}`} onClick={() => setSelectedColour("purple")}></span>
                    </p>

                </div>

                <div className="form-controls">
                    <button type="button" className="addButton"
                        onClick={() => setExercises(prev => prev.length < 10 ? [...prev, { name: "", type: "weight_reps" }] : prev)}>
                        ADD EXERCISE
                    </button>
                    <button type="button" className="minusButton"
                        onClick={() => setExercises(prev => prev.length > 1 ? prev.slice(0, -1) : prev)}>
                        DELETE EXERCISE
                    </button>
                </div>

                <div className="form-submit">
                    <button type="button" onClick={newWorkout}>Submit</button>
                </div>
            </form>






        </>
    );
}

