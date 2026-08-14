import { createContext, useContext, useState, useEffect } from "react";
import { apiFetch } from "../components/apiClient";

const UnitContext = createContext();

export function UnitProvider({ children }) {
    const [weightUnit, setWeightUnit] = useState("lbs");
    const [distanceUnit, setDistanceUnit] = useState("miles");

    const milesToKm = (miles) => {
        return miles * 1.60934;
    };
    const kmToMiles = (km) => {
        return km / 1.60934;
    };
    const lbsToKg = (lbs) => {
        return lbs * 0.453592;
    };
    const kgToLbs = (kg) => {
        return kg / 0.453592;
    };

    const convertWorkout = (workout, distanceUnit, weightUnit) => {
        const copy = structuredClone(workout);

        if (distanceUnit === "km") {
            copy.exercises.forEach((exercise) => {
                if (exercise.distance != null) {
                    exercise.distance = Number(
                        milesToKm(exercise.distance).toFixed(2)
                    );
                }
            });
        }
        if (weightUnit === "kg") {
            copy.exercises.forEach((exercise) => {
                if (exercise.type === "weight_reps") {
                    exercise.sets.forEach((set) => {
                        if (set.weight != null) {
                            set.weight = Number(
                                lbsToKg(set.weight).toFixed(1)
                            );
                        }
                    });
                }
            });
        }


        return copy;
    };

    const convertWorkoutToSave  = (workout, distanceUnit, weightUnit) => {

        const copy = structuredClone(workout);

        if (distanceUnit === "km") {
            copy.exercises.forEach((exercise) => {
                if (exercise.distance != null) {
                    exercise.distance = Number(
                        kmToMiles(exercise.distance)
                    );
                }
            });
        }
         if (weightUnit === "kg") {
            copy.exercises.forEach((exercise) => {
                if (exercise.type === "weight_reps") {
                    exercise.sets.forEach((set) => {
                        if (set.weight != null) {
                            set.weight = Number(
                                kgToLbs(set.weight)
                            );
                        }
                    });
                }
            });
        }
        return copy
    }

    useEffect(() => {
        const fetchUnits = async () => {
            try {
                const res = await apiFetch("https://workouttracker-production-4d3e.up.railway.app/users");
                const data = await res.json();

                if (data) {
                    setWeightUnit(data.weight);
                    setDistanceUnit(data.distance);
                }
            }
            catch (err) {
                console.error("Failed to fetch units:", err);
            }
        };

        fetchUnits();
    }, []);

    return (
        <UnitContext.Provider
            value={{
                weightUnit,
                distanceUnit,
                setWeightUnit,
                setDistanceUnit,
                milesToKm,
                kmToMiles,
                lbsToKg,
                kgToLbs,
                convertWorkout,
                convertWorkoutToSave
            }}
        >
            {children}
        </UnitContext.Provider>
    );
}

export function useUnits() {
    return useContext(UnitContext);
}