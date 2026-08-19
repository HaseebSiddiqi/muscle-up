import { useState, useEffect, useRef } from "react";
import { apiFetch } from "./apiClient.js";

export default function WorkoutTypes({ onSelectWorkout, setActiveComponent, refreshKey, setRefreshKey }) {
    const [workouts, setWorkouts] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [colourPicker, setColourPicker] = useState(null);
    const [selectedColour, setSelectedColour] = useState(null);
    const [feedback, setFeedback] = useState("");
    const colourPickerRef = useRef(null);
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                colourPickerRef.current &&
                !colourPickerRef.current.contains(event.target)
            ) {
                setColourPicker(null);
                setSelectedColour(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);
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

    const updateColour = async (workout, xcolour) => {
        const updatedWorkout ={
            ...workout,
            colour: xcolour
        }
       
        await apiFetch("https://workouttracker-production-4d3e.up.railway.app/workouts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedWorkout)
        });
        setWorkouts(prev =>
            prev.map(w =>
                w.workoutName === workout.workoutName
                    ? updatedWorkout
                    : w
            )
        );
        setRefreshKey(prev => prev + 1);
    }

    return (
        <>


            <div className="workout-selector-container">
                <h2>Your Created Workouts</h2>
                {workouts.length > 0 ? (
                    <div className="workout-list" >
                        {workouts.map((workout, i) => (
                            <div key={i} className="workout-item" >
                                <span
                                    className="workout-item-name"
                                    onClick={() => { onSelectWorkout(workout); setActiveComponent("add"); }}
                                >
                                    {workout.workoutName}
                                </span>
                                {workout.colour === "red" ? (
                                    <span className="colour-square red-square"  onClick={()=> {setColourPicker(workout.workoutName); setSelectedColour(workout.colour);}}></span>
                                ):workout.colour === "green" ?(
                                    <span className="colour-square green-square"    onClick={()=> {setColourPicker(workout.workoutName); setSelectedColour(workout.colour);}}></span>
                                ):workout.colour ==="yellow"?(
                                    <span className="colour-square yellow-square"   onClick={()=>{setColourPicker(workout.workoutName); setSelectedColour(workout.colour);}}></span>

                                ):workout.colour ==="teal"?(
                                    <span className="colour-square teal-square"  onClick={()=> {setColourPicker(workout.workoutName); setSelectedColour(workout.colour);}}></span>

                                ):workout.colour ==="pink"?(
                                    <span className="colour-square pink-square"  onClick={()=> {setColourPicker(workout.workoutName); setSelectedColour(workout.colour);}}></span>

                                ):workout.colour ==="purple"?(
                                    <span className="colour-square purple-square" onClick={()=> {setColourPicker(workout.workoutName); setSelectedColour(workout.colour);}}></span>

                                ):(
                                    <span className="colour-square blue-square"  onClick={()=> {setColourPicker(workout.workoutName); setSelectedColour("blue");}}></span>

                                )}
                                 {colourPicker === workout.workoutName && (
                                    <div className ="colour-picker" ref={colourPickerRef}> 
                                        <p className="Colour-Row"> 
                                            <span className={`colour-square blue-square ${selectedColour === "blue" ? "selected" : ""}`}    onClick = {() => {setSelectedColour("blue");updateColour(workout, "blue");}}></span> 
                                            <span className={`colour-square red-square ${selectedColour === "red" ? "selected" : ""}`}    onClick = {() => {setSelectedColour("red"); updateColour(workout, "red");}}></span> 
                                            <span className={`colour-square green-square ${selectedColour === "green" ? "selected" : ""}`}    onClick = {() => {setSelectedColour("green"); updateColour(workout, "green");}}></span> 
                                            <span className={`colour-square yellow-square ${selectedColour === "yellow" ? "selected" : ""}`}   onClick = {() => {setSelectedColour("yellow");  updateColour(workout, "yellow");}}></span> 
                                            <span className={`colour-square teal-square ${selectedColour === "teal" ? "selected" : ""}`}     onClick = {() => {setSelectedColour("teal");  updateColour(workout, "teal");}}></span> 
                                            <span className={`colour-square pink-square ${selectedColour === "pink" ? "selected" : ""}`}    onClick = {() => {setSelectedColour("pink");  updateColour(workout, "pink");}}></span> 
                                            <span className={`colour-square purple-square ${selectedColour === "purple" ? "selected" : ""}`}   onClick = {() => {setSelectedColour("purple"); updateColour(workout, "purple");}}></span> 
                                        </p>
                                    </div>
                                )}
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