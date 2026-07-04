
import { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import CreateWorkouts from "../components/CreateWorkouts";
import AddWorkouts from "../components/AddWorkouts";
import ViewWorkouts from "../components/ViewWorkouts";
import WorkoutTypes from "../components/WorkoutTypes";


export default function Home() {
  
    const [selectedWorkout, setSelectedWorkout] = useState(null);

    const [activeComponent, setActiveComponent] = useState("home");

    const [refreshKey, setRefreshKey] = useState(0);

    const bottomRef = useRef(null);

  
    const refreshWorkouts = () => {
        setRefreshKey(prev => prev + 1);
    };


    useEffect(() => {
        if (activeComponent === "add" || activeComponent === "create") {
            requestAnimationFrame(() => {
                setTimeout(() => {
                    bottomRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                }, 0);
            });
        }
    }, [activeComponent]);

    return (
        <>
            <Navbar/>

            <div className="pageH">
                <div className="viewWorkouts">
                    <ViewWorkouts refreshKey={refreshKey} />
                </div>

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
                        <CreateWorkouts onSuccess={refreshWorkouts} />
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

        </>
    );
}