
import { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import CreateWorkouts from "../components/CreateWorkouts";
import AddWorkouts from "../components/AddWorkouts";
import ViewWorkouts from "../components/ViewWorkouts";
import WorkoutTypes from "../components/WorkoutTypes";
import MetricsDashboard from "../components/MetricsDashboard";
import { apiFetch } from "../components/apiClient.js";


export default function Home() {
    const [viewWorkouts, updateWorkouts] = useState([]);
    const [selectedWorkout, setSelectedWorkout] = useState(null);

    const [activeComponent, setActiveComponent] = useState("home");

    const [refreshKey, setRefreshKey] = useState(0);

    const bottomRef = useRef(null);



    const refreshWorkouts = () => {
        setRefreshKey(prev => prev + 1);
    };

    useEffect(() => {
        const fetchWorkouts = async () => {
            try {
                const res = await apiFetch(
                    `https://workouttracker-production-4d3e.up.railway.app/workoutLogs`
                );
                const data = await res.json();
                const normalized = (data.Items || []).map(w => ({
                    ...w,
                    exercises: w.exercises.map(ex => ({
                        ...ex,
                        type: ex.type || "weight_reps"
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

    useEffect(() => {
        if (activeComponent === "add" || activeComponent === "create") {
            requestAnimationFrame(() => {
                setTimeout(() => {
                    const element = bottomRef.current;

                    if (!element) return;

                    const rect = element.getBoundingClientRect();

                    // Don't scroll if already visible
                    if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
                        return;
                    }

                    window.scrollTo({
                        top: window.scrollY + rect.top - 100,
                        behavior: "smooth"
                    });

                }, 0);
            });
        }
    }, [activeComponent]);

    return (
        <>
            <Navbar />

            <div className="pageH">

                <div className="left-column">


                    <div className="viewWorkouts">
                        <ViewWorkouts viewWorkouts={viewWorkouts} updateWorkouts={updateWorkouts} refreshKey={refreshKey} />
                    </div>
                    <div className="dashboard">
                        <MetricsDashboard viewWorkouts={viewWorkouts} />
                    </div>

                </div>

                <div className="right-column">
                    <div className="workoutForms">

                        <div ref={activeComponent === "add" ? bottomRef : null} className="addWorkout" style={{ display: activeComponent === "add" ? "block" : "none" }}>
                            <AddWorkouts
                                selectedWorkout={selectedWorkout}
                                onSuccess={() => {
                                    refreshWorkouts();
                                    setActiveComponent("home");
                                }}
                            />
                        </div>

                        <div ref={activeComponent === "create" ? bottomRef : null} className="createWorkout" style={{ display: activeComponent === "create" ? "block" : "none" }}>
                            <CreateWorkouts onSuccess={refreshWorkouts} active = {activeComponent === "create"} />
                        </div>
                    </div>

                    <div className="workoutTypes" style={{ display: "block" }}>
                        <WorkoutTypes
                            onSelectWorkout={setSelectedWorkout}
                            setActiveComponent={setActiveComponent}
                            refreshKey={refreshKey}
                        />
                    </div>

                </div>



            </div>

        </>
    );
}