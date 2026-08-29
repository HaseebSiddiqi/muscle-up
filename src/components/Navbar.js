import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useState, useEffect, useRef } from "react";
import { apiFetch } from "../components/apiClient.js";
import { useUnits } from "../contexts/unitContext";
export default function Navbar() {
    const { user, handleSignOut } = useAuth();
    const [dropDown, setDropDown] = useState(false);
    const { weightUnit, distanceUnit, setWeightUnit, setDistanceUnit } = useUnits();
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [verifyDelete, setVerifyDelete] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const [deleteWarning, setDeleteWarning] = useState(false);
    const ref = useRef();

    const deleteAccount = async () => {
        try {
            await apiFetch("https://workouttracker-production-4d3e.up.railway.app/deleteAccount", {
                method: "DELETE"
            });
            handleSignOut();
        } catch (err){
            console.error(err);
        }
       
    };

    const checkText = () => {
        if (confirmText === "Confirm Delete") {
                setConfirmDelete(false)
                setVerifyDelete(true)
                setConfirmText("")
        } 
        else {
                setDeleteWarning(true)
                setConfirmText("")
            }

    }
    useEffect(() => {
        const fetchUnits = async () => {
            try {
                const res = await apiFetch(
                    "https://workouttracker-production-4d3e.up.railway.app/users"
                );

                const data = await res.json();

                if (data) {
                    setWeightUnit(data.weight);
                    setDistanceUnit(data.distance);
                }
            }
            catch (err) {
                console.error(err);
            }
        };

        if (user) {
            fetchUnits();
        }

    }, [user, setWeightUnit, setDistanceUnit]);
    const updateUnits = async (newWeight, newDistance) => {
        try {
            await apiFetch("https://workouttracker-production-4d3e.up.railway.app/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    distance: newDistance,
                    weight: newWeight
                })
            });
        }
        catch (err) {
            console.error(err);
        }
    }
    useEffect(() => {
        const close = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setDropDown(false);
                setConfirmDelete(false);
                setVerifyDelete(false);
                setDeleteWarning(false);
                
            }
        };

        document.addEventListener("mousedown", close);

        return () => {
            document.removeEventListener("mousedown", close);
        };
    }, []);
    return (
        <nav className="nav">
            <Link to="/" className="site-brand">
                <span className="brand-text">MUSCLE UP</span>
                <img src="/strong.png" alt="Logo" className="brand-logo" />
            </Link>

            <div className="nav-actions">
                {user ? (
                    <>
                    <div ref={ref}>
                        <span className="nav-welcome" onClick={() => setDropDown(prev => !prev)}>
                            Welcome, {user.username.charAt(0).toUpperCase() + user.username.slice(1)}
                        </span>
                        {dropDown && (
                            <div className="drop-down" >
                                <div className="setting-row">
                                    <span>Set Weight Units</span>

                                    <div className="toggle-container">
                                        <span className="toggle-label">LBS</span>
                                        <button
                                            className={`toggle ${weightUnit === "kg" ? "active" : ""}`}
                                            onClick={() => {
                                                const newWeight = weightUnit === "lbs" ? "kg" : "lbs";

                                                setWeightUnit(newWeight);

                                                updateUnits(newWeight, distanceUnit);
                                            }}>
                                            <span className="toggle-circle"></span>
                                        </button>
                                        <span className="toggle-label">KG</span>
                                    </div>
                                </div>

                                <div className="setting-row">
                                    <span>Set Distance Units</span>

                                    <div className="toggle-container">
                                        <span className="toggle-label">MILES</span>
                                        <button
                                            className={`toggle ${distanceUnit === "km" ? "active" : ""}`}
                                            onClick={() => {
                                                const newDistance = distanceUnit === "miles" ? "km" : "miles";

                                                setDistanceUnit(newDistance);

                                                updateUnits(weightUnit, newDistance);
                                            }}>
                                            <span className="toggle-circle"></span>
                                        </button>
                                        <span className="toggle-label">KM</span>
                                    </div>
                                </div>
                                <h4>DANGER ZONE </h4>
                                <div className="DangerZone">

                                 {confirmDelete === true && (
                                    <>
                                    <div className="Confirm-Delete"> 
                                        <input type="text" placeholder="Type 'Confirm Delete'" onChange={(e) => setConfirmText(e.target.value)}/>
                                        <button className="delete-account" onClick = {() => checkText()}>
                                            Delete Account
                                        </button>
                                     
                                    </div>
                                       {deleteWarning === true && (
                                            <>
                                            <h3>Type 'Confirm Delete' Exactly</h3>
                                            </>
                                        )}
                                   
                                    </>
                                )}

                                 {verifyDelete === true && (
                                        <>
                                        <h5>Are you Sure? This action cant be reversed</h5>
                                        <div className="Confirm-Delete">
                                            <button className ="delete-account-back" onClick = {()=> {setVerifyDelete(false);}}>
                                                Cancel
                                            </button>
                                        
                                            <button className="delete-account" onClick={deleteAccount}>
                                                Delete Account
                                            </button>
                                           
                                        </div>
                                        </>
                                    )}
                                {confirmDelete === false && verifyDelete === false && (
                                    
                                    <button className="delete-account" onClick = {() => setConfirmDelete(true)}>
                                    Delete Account
                                </button>
                                
                                )}
                                </div>


                            </div>
                           
                                            
                               
                                
                            
                        )}
                    </div>
                        <button className="nav-btn" onClick={handleSignOut}>
                            Sign Out
                        </button>
                    </>
                ) : (
                    <Link to="/login" className="nav-btn nav-btn-primary">
                        Login
                    </Link>
                )}
            </div>

        </nav >


    );
}