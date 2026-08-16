import React, { useState } from 'react';
import { confirmSignUp } from 'aws-amplify/auth';
import { useNavigate } from "react-router-dom";
import { signIn } from 'aws-amplify/auth';
import { useAuth } from './AuthContext';
import { apiFetch } from "./apiClient.js";

export default function VerifyAccount({ username, password, onSuccess, onBack }) {

    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { setUser } = useAuth();
    const handleVerify = async (e) => {
        e.preventDefault();
        setError("");

        try {
            await confirmSignUp({
                username,
                confirmationCode: code
            });
            alert("Account verified successfully")

            await signIn({ username, password });
            setUser({ username });

            await apiFetch("https://workouttracker-production-4d3e.up.railway.app/workouts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        workoutName: "Push Day",
                        exercises: [
                            { name: "Bench Press", type: "weight_reps" },
                            { name: "Shoulder Press", type: "weight_reps" },
                            { name: "Chest Fly", type: "weight_reps" },
                            { name: "Tricep Overhead", type: "weight_reps" },
                            { name: "Lateral Raises", type: "weight_reps" }
                        ]
                    })
                });

            await apiFetch("https://workouttracker-production-4d3e.up.railway.app/workouts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        workoutName: "Pull Day",
                        exercises: [
                            { name: "Assisted Pull Ups", type: "weight_reps" },
                            { name: "Lat Pulldown", type: "weight_reps" },
                            { name: "Seated Cable Row", type: "weight_reps" },
                            { name: "Dumbbell Curl", type: "weight_reps" },
                            { name: "Hammer Curl", type: "weight_reps" }
                        ]
                    })
                });
            await apiFetch("https://workouttracker-production-4d3e.up.railway.app/workouts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        workoutName: "Legs & Abs",
                        exercises: [
                            { name: "Leg Press", type: "weight_reps" },
                            { name: "Leg Curl", type: "weight_reps" },
                            { name: "Leg Extension", type: "weight_reps" },
                            { name: "Calf Raises", type: "weight_reps" },
                            { name: "Decline Sit Ups", type: "weight_reps" },
                            { name: "Planks", type: "time" }
                        ]
                    })
                });
            await apiFetch("https://workouttracker-production-4d3e.up.railway.app/workouts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        workoutName: "Home Full Body",
                        exercises: [
                            { name: "Push Ups", type: "reps" },
                            { name: "Pull Ups", type: "reps" },
                            { name: "Squats", type: "reps" },
                            { name: "Lunges", type: "reps" },
                            { name: "Planks", type: "time" }
                        ]
                    })
                });

            onSuccess?.();
            
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div>
            <h2>Verify Account</h2>

            <form onSubmit={handleVerify}>
                <input className="modern-input" type="text" placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} required />
                {error && <p className="form-error">{error}</p>}
                <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>Verify</button>
                <button type="button" className="btn btn-secondary" style={{ marginTop: '10px', backgroundColor: 'transparent', color: '#64748b', boxShadow: 'none' }} onClick={() => { onBack?.(); navigate("/login"); }}>Back to Login</button>
            </form>




        </div>
    );
}