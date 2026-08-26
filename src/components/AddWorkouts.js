import { useState, useEffect, Fragment, useRef } from "react";
import { apiFetch } from "./apiClient.js";
import { useUnits } from "../contexts/unitContext";

const WORKOUT_API =
    "https://workouttracker-production-4d3e.up.railway.app/workoutLogs";

const TYPE_ORDER = {
    weight_reps: 0,
    reps: 1,
    time: 2,
    cardio: 3
};

/* ============================================================
   REUSABLE INPUT COMPONENTS
   ============================================================ */

function UnitInput({
    value,
    placeholder,
    type = "number",
    step,
    unit,
    showUnit = true,
    onChange
}) {
    return (
        <div className="inputWithUnit">
            <input
                type={type}
                className="no-spinner"
                step={step}
                value={value ?? ""}
                placeholder={placeholder ?? ""}
                onChange={onChange}
            />

            {showUnit && (
                <span className="unit">
                    {unit}
                </span>
            )}
        </div>
    );
}

function DurationInputs({
    minutes,
    seconds,
    minutesPlaceholder,
    secondsPlaceholder,
    showUnits,
    onMinutesChange,
    onSecondsChange,
    className = "duration-input"
}) {
    return (
        <div className={className}>
            {showUnits && (
                <div className="duration-labels">
                    <span className="unit">mins</span>
                    <span className="unit">sec</span>
                </div>
            )}

            <div className="duration-values">
                <input
                    type="number"
                    className="no-spinner"
                    value={minutes ?? ""}
                    placeholder={minutesPlaceholder ?? ""}
                    onChange={onMinutesChange}
                />

                <span className="time-divider">:</span>

                <input
                    type="text"
                    className="no-spinner"
                    value={
                        seconds === "" || seconds == null
                            ? ""
                            : String(seconds).padStart(2, "0")
                    }
                    placeholder={
                        secondsPlaceholder != null
                            ? String(secondsPlaceholder).padStart(2, "0")
                            : ""
                    }
                    onChange={onSecondsChange}
                />
            </div>
        </div>
    );
}

/* ============================================================
   HELPERS
   ============================================================ */

const isSetFilled = set =>
    Object.values(set).some(
        value => value !== null && value !== ""
    );

const isExerciseEmpty = exercise => {
    if (!exercise.sets) return true;

    return exercise.sets.every(
        set => !isSetFilled(set)
    );
};

const validSets = sets => {
    if (!sets) return true;

    let foundEmpty = false;

    for (const set of sets) {
        if (!isSetFilled(set)) {
            foundEmpty = true;
        } else if (foundEmpty) {
            return false;
        }
    }

    return true;
};

const getPreviousExercise = (
    workout,
    exerciseName
) =>
    workout?.exercises?.find(
        ex => ex.name === exerciseName
    );

const handleNumberInput = (
    value,
    max,
    previousValue = null
) => {
    if (value === "") return "";

    if (!/^\d*$/.test(value)) {
        return previousValue;
    }

    return Math.min(
        max,
        Math.max(0, Number(value))
    );
};

const handleDecimalInput = (
    value,
    max,
    previousValue = null
) => {
    if (value === "") return "";

    if (!/^\d*\.?\d{0,1}$/.test(value)) {
        return previousValue;
    }

    return Math.min(
        max,
        Math.max(0, Number(value))
    );
};

const createSet = type => {
    if (type === "time") {
        return {
            minutes: null,
            seconds: null
        };
    }

    if (type === "reps") {
        return {
            reps: null
        };
    }

    return {
        weight: null,
        reps: null
    };
};

const createExercise = (
    exercise,
    previousExercise,
    isRounds
) => {
    const name =
        typeof exercise === "string"
            ? exercise
            : exercise.name;

    const type =
        typeof exercise === "string"
            ? "weight_reps"
            : exercise.type;

    if (type === "cardio") {
        return {
            name,
            type,
            duration: null,
            distance: null,
            calories: null
        };
    }

    if (isRounds) {
        if (type === "time") {
            return {
                name,
                type,
                minutes:
                    previousExercise?.minutes ?? null,
                seconds:
                    previousExercise?.seconds ?? null
            };
        }

        if (type === "weight_reps") {
            return {
                name,
                type,
                weight:
                    previousExercise?.weight ?? null,
                reps:
                    previousExercise?.reps ?? null
            };
        }

        return {
            name,
            type,
            reps:
                previousExercise?.reps ?? null
        };
    }

    const setCount =
        previousExercise?.sets?.length || 3;

    return {
        name,
        type,
        sets: Array.from(
            { length: setCount },
            () => createSet(type)
        )
    };
};

/* ============================================================
   COMPONENT
   ============================================================ */

export default function Add_workouts({
    selectedWorkout,
    onSuccess
}) {
    const {
        weightUnit,
        distanceUnit,
        milesToKm,
        lbsToKg,
        convertWorkoutToSave,
        getLocalDate
    } = useUnits();

    const [newWorkout, setNewWorkout] =
        useState(null);
    const [feedback, setFeedback] =
        useState("");
    const [viewWorkouts, setViewWorkouts] =
        useState([]);
    const [latestWorkout, setLatestWorkout] =
        useState(null);
    const [startTime, setStartTime] =
        useState(null);
    const [showDurationPopup, setShowDurationPopup] =
        useState(false);
    const [duration, setDuration] =
        useState(null);

    const durationRef = useRef(null);

    /* ========================================================
       SHARED STATE HELPERS
       ======================================================== */

    const showFeedback = message => {
        setFeedback(message);

        setTimeout(() => {
            setFeedback("");
        }, 2000);
    };

    const updateWorkout = updater => {
        setNewWorkout(prev =>
            prev ? updater(prev) : prev
        );
    };

    const updateExerciseField = (
        exerciseIndex,
        field,
        value
    ) => {
        updateWorkout(prev => ({
            ...prev,
            exercises: prev.exercises.map(
                (exercise, index) =>
                    index === exerciseIndex
                        ? {
                            ...exercise,
                            [field]:
                                value === ""
                                    ? null
                                    : Number(value)
                        }
                        : exercise
            )
        }));
    };

    const updateSet = (
        exerciseIndex,
        setIndex,
        field,
        value
    ) => {
        updateWorkout(prev => ({
            ...prev,
            exercises: prev.exercises.map(
                (exercise, exIndex) =>
                    exIndex === exerciseIndex
                        ? {
                            ...exercise,
                            sets: exercise.sets.map(
                                (set, index) =>
                                    index === setIndex
                                        ? {
                                            ...set,
                                            [field]:
                                                value ===
                                                    ""
                                                    ? null
                                                    : Number(
                                                        value
                                                    )
                                        }
                                        : set
                            )
                        }
                        : exercise
            )
        }));
    };

    const updateRounds = (
        field,
        value
    ) => {
        updateWorkout(prev => ({
            ...prev,
            rounds: {
                ...prev.rounds,
                [field]:
                    value === ""
                        ? null
                        : Number(value)
            }
        }));
    };

    const updateDate = value => {
        updateWorkout(prev => ({
            ...prev,
            date: value
        }));
    };

    const updateNotes = value => {
        updateWorkout(prev => ({
            ...prev,
            notes: value
        }));
    };

    /* ========================================================
       DURATION POPUP SCROLL
       ======================================================== */

    useEffect(() => {
        if (!showDurationPopup) return;

        requestAnimationFrame(() => {
            setTimeout(() => {
                const element =
                    durationRef.current;

                if (!element) return;

                const rect =
                    element.getBoundingClientRect();

                const viewportHeight =
                    window.innerHeight;

                if (
                    rect.top >= 0 &&
                    rect.bottom <= viewportHeight
                ) {
                    return;
                }

                window.scrollTo({
                    top:
                        window.scrollY +
                        rect.bottom -
                        viewportHeight +
                        50,
                    behavior: "smooth"
                });
            }, 100);
        });
    }, [showDurationPopup]);

    /* ========================================================
       LOAD SELECTED WORKOUT
       ======================================================== */

    useEffect(() => {
        if (!selectedWorkout) return;

        setStartTime(new Date());

        const previousWorkout =
            viewWorkouts
                .filter(
                    workout =>
                        workout.workoutName ===
                        selectedWorkout.workoutName
                )
                .sort(
                    (a, b) =>
                        new Date(b.date) -
                        new Date(a.date)
                )[0];

        setLatestWorkout(
            previousWorkout || null
        );

        setShowDurationPopup(false);

        const exercises = (
            selectedWorkout.exercises || []
        ).map(exercise =>
            createExercise(
                exercise,
                getPreviousExercise(
                    previousWorkout,
                    typeof exercise === "string"
                        ? exercise
                        : exercise.name
                ),
                selectedWorkout.isRounds
            )
        );

        setNewWorkout({
            workoutId: Date.now().toString(),
            workoutName:
                selectedWorkout.workoutName,
            date: getLocalDate(),
            notes: "",
            description:
                selectedWorkout.description,
            isRounds:
                selectedWorkout.isRounds,
            rounds: selectedWorkout.isRounds
                ? { count: null }
                : null,
            exercises
        });
    }, [
        selectedWorkout,
        viewWorkouts,
        getLocalDate
    ]);

    /* ========================================================
       FETCH WORKOUTS
       ======================================================== */

    useEffect(() => {
        const fetchWorkouts = async () => {
            try {
                const res = await apiFetch(
                    WORKOUT_API
                );

                const data =
                    await res.json();

                setViewWorkouts(
                    data.Items || []
                );
            } catch (error) {
                console.error(
                    "Error fetching workouts:",
                    error
                );
            }
        };

        fetchWorkouts();
    }, [selectedWorkout]);

    /* ========================================================
       DISPLAY EXERCISES
       ======================================================== */

    const displayExercises =
        newWorkout?.exercises
            ?.map((exercise, index) => ({
                ...exercise,
                originalIndex: index
            }))
            .sort(
                (a, b) =>
                    TYPE_ORDER[a.type] -
                    TYPE_ORDER[b.type]
            ) || [];

    /* ========================================================
       SET CONTROLS
       ======================================================== */

    const addSets = () => {
        updateWorkout(prev => {
            const exercises =
                prev.exercises.filter(
                    ex => ex.type !== "cardio"
                );

            if (
                exercises.length === 0 ||
                exercises.every(
                    ex => ex.sets.length >= 3
                )
            ) {
                return prev;
            }

            return {
                ...prev,
                exercises:
                    prev.exercises.map(
                        exercise =>
                            exercise.type ===
                                "cardio"
                                ? exercise
                                : {
                                    ...exercise,
                                    sets: [
                                        ...exercise.sets,
                                        createSet(
                                            exercise.type
                                        )
                                    ]
                                }
                    )
            };
        });
    };

    const delSets = () => {
        updateWorkout(prev => {
            const exercises =
                prev.exercises.filter(
                    ex => ex.type !== "cardio"
                );

            if (
                exercises.length === 0 ||
                exercises[0].sets.length <= 1
            ) {
                return prev;
            }

            return {
                ...prev,
                exercises:
                    prev.exercises.map(
                        exercise =>
                            exercise.type ===
                                "cardio"
                                ? exercise
                                : {
                                    ...exercise,
                                    sets: exercise.sets.slice(
                                        0,
                                        -1
                                    )
                                }
                    )
            };
        });
    };

    /* ========================================================
       VALIDATION
       ======================================================== */

    const validateWorkout = exercises =>
        exercises.every(exercise => {
            if (newWorkout?.isRounds) {
                return true;
            }

            if (exercise.type === "cardio") {
                return true;
            }

            if (isExerciseEmpty(exercise)) {
                return true;
            }

            return validSets(exercise.sets);
        });

    /* ========================================================
       SUBMIT / SAVE
       ======================================================== */

    const submitTable = () => {
        if (!newWorkout) return;

        if (
            !validateWorkout(
                newWorkout.exercises
            )
        ) {
            showFeedback(
                "Please fill sets in order"
            );
            return;
        }

        if (newWorkout.isRounds) {
            const hasNonCardioExercise =
                newWorkout.exercises.some(
                    ex => ex.type !== "cardio"
                );

            if (
                hasNonCardioExercise &&
                newWorkout.rounds?.count == null
            ) {
                showFeedback(
                    "Please enter the number of rounds"
                );
                return;
            }
        }

        const endTime = new Date();

        const workoutDuration = startTime
            ? Math.floor(
                (endTime - startTime) /
                60000
            )
            : 0;

        setDuration(workoutDuration);
        setShowDurationPopup(true);
    };

    const saveWorkout = async workoutDuration => {
        if (!newWorkout) return;

        const workout = {
            ...newWorkout,
            duration: workoutDuration
        };

        const workoutToSave = {
            ...convertWorkoutToSave(
                workout,
                distanceUnit,
                weightUnit
            ),
            rounds: workout.rounds
        };
        try {
            await apiFetch(
                WORKOUT_API,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify(
                        workoutToSave
                    )
                }
            );

            setViewWorkouts(prev => [
                ...prev,
                workoutToSave
            ]);

            setFeedback("Workout Added!");

            console.log(workoutToSave);

            setTimeout(() => {
                setFeedback("");
                setNewWorkout(null);
                onSuccess();
            }, 2000);
        } catch (error) {
            console.error(
                "Error saving workout:",
                error
            );

            showFeedback(
                "Error saving workout"
            );
        }
    };

    /* ========================================================
       CARDIO
       ======================================================== */

    const renderCardioInputs = (
        exercise,
        exerciseIndex,
        prevExercise,
        showUnits = true
    ) => {
        const updateCardio = (
            field,
            value
        ) =>
            updateExerciseField(
                exerciseIndex,
                field,
                value
            );

        const distancePlaceholder =
            distanceUnit === "km"
                ? prevExercise?.distance != null
                    ? milesToKm(
                        prevExercise.distance
                    ).toFixed(2)
                    : ""
                : prevExercise?.distance != null
                    ? prevExercise.distance.toFixed(
                        2
                    )
                    : "";

        return (
            <div className="cardio-inputs">

                <UnitInput
                    value={exercise.duration}
                    placeholder={
                        prevExercise?.duration
                    }
                    step="1"
                    unit="mins"
                    showUnit={showUnits}
                    onChange={e =>
                        updateCardio(
                            "duration",
                            handleNumberInput(
                                e.target.value,
                                999,
                                exercise.duration
                            )
                        )
                    }
                />

                <UnitInput
                    value={exercise.distance}
                    placeholder={
                        distancePlaceholder
                    }
                    step="0.1"
                    unit={distanceUnit}
                    showUnit={showUnits}
                    onChange={e => {
                        const value =
                            e.target.value;

                        if (
                            !/^\d*\.?\d{0,2}$/.test(
                                value
                            )
                        ) {
                            return;
                        }

                        updateCardio(
                            "distance",
                            value === ""
                                ? ""
                                : Math.min(
                                    99,
                                    Math.max(
                                        0,
                                        Number(value)
                                    )
                                )
                        );
                    }}
                />

                <UnitInput
                    value={exercise.calories}
                    placeholder={
                        prevExercise?.calories
                    }
                    step="1"
                    unit="cals"
                    showUnit={showUnits}
                    onChange={e =>
                        updateCardio(
                            "calories",
                            handleNumberInput(
                                e.target.value,
                                999,
                                exercise.calories
                            )
                        )
                    }
                />
            </div>
        );
    };

    /* ========================================================
       NOTES
       ======================================================== */

    const renderNotes = rowSpan => (
        <td
            className="notes"
            rowSpan={rowSpan}
        >
            <textarea
                className="textarea"
                placeholder={
                    latestWorkout?.notes ??
                    "Workout notes..."
                }
                value={newWorkout.notes}
                onChange={e =>
                    updateNotes(
                        e.target.value
                    )
                }
            />
        </td>
    );

    /* ========================================================
       DATE
       ======================================================== */

    const renderDate = () => (
        <div className="workout-date-picker">
            <input
                type="date"
                max={getLocalDate()}
                value={newWorkout.date || ""}
                onChange={e =>
                    updateDate(e.target.value)
                }
                className="date-input"
            />
        </div>
    );

    /* ========================================================
       ROUND EXERCISE INPUT
       ======================================================== */

    const renderRoundExerciseInput = (
        exercise,
        exerciseIndex,
        prevExercise,
        showUnits = true
    ) => {
        if (
            exercise.type === "weight_reps"
        ) {
            return (
                <div className="round-input">
                    <div className="set-inputs">

                        <UnitInput
                            value={
                                exercise.weight
                            }
                            placeholder={
                                weightUnit === "kg"
                                    ? prevExercise?.weight !=
                                        null
                                        ? Number(
                                            lbsToKg(
                                                prevExercise.weight
                                            ).toFixed(
                                                1
                                            )
                                        )
                                        : ""
                                    : prevExercise?.weight
                            }
                            unit={weightUnit}
                            showUnit={showUnits}
                            onChange={e =>
                                updateExerciseField(
                                    exerciseIndex,
                                    "weight",
                                    handleDecimalInput(
                                        e.target.value,
                                        999
                                    )
                                )
                            }
                        />

                        <UnitInput
                            value={
                                exercise.reps
                            }
                            placeholder={
                                prevExercise?.reps
                            }
                            unit="reps"
                            showUnit={showUnits}
                            onChange={e =>
                                updateExerciseField(
                                    exerciseIndex,
                                    "reps",
                                    handleNumberInput(
                                        e.target.value,
                                        99
                                    )
                                )
                            }
                        />

                    </div>
                </div>
            );
        }

        if (exercise.type === "reps") {
            return (
                <div className="round-input">
                    <UnitInput
                        value={
                            exercise.reps
                        }
                        placeholder={
                            prevExercise?.reps
                        }
                        unit="reps"
                        showUnit={showUnits}
                        onChange={e =>
                            updateExerciseField(
                                exerciseIndex,
                                "reps",
                                handleNumberInput(
                                    e.target.value,
                                    99
                                )
                            )
                        }
                    />
                </div>
            );
        }

        if (exercise.type === "time") {
            return (
                <div className="round-input">
                    <DurationInputs
                        minutes={
                            exercise.minutes
                        }
                        seconds={
                            exercise.seconds
                        }
                        minutesPlaceholder={
                            prevExercise?.minutes
                        }
                        secondsPlaceholder={
                            prevExercise?.seconds
                        }
                        showUnits={showUnits}
                        onMinutesChange={e =>
                            updateExerciseField(
                                exerciseIndex,
                                "minutes",
                                handleNumberInput(
                                    e.target.value,
                                    120
                                )
                            )
                        }
                        onSecondsChange={e =>
                            updateExerciseField(
                                exerciseIndex,
                                "seconds",
                                handleNumberInput(
                                    e.target.value,
                                    59
                                )
                            )
                        }
                        className="duration-input"
                    />
                </div>
            );
        }

        return null;
    };

    /* ========================================================
       ROUNDS WORKOUT
       ======================================================== */

    const renderRoundsWorkout = () => {
        const nonCardioExercises =
            displayExercises.filter(
                ex => ex.type !== "cardio"
            );

        const cardioExercises =
            displayExercises.filter(
                ex => ex.type === "cardio"
            );

        const hasRoundExercises =
            nonCardioExercises.length > 0;

        return (
            <table className="addWorkoutTable workout-log-table workout-log-table--entry">
                <tbody>

                    

                    <tr>
                        <th>
                            {newWorkout.workoutName}
                        </th>

                        {hasRoundExercises ? (
                            <>
                                <th>Per Round</th>
                                <th>Rounds</th>
                            </>
                        ) : (
                            <th>Cardio Stats</th>
                        )}

                        <th>Notes</th>
                    </tr>

                    {nonCardioExercises.map(
                        (exercise, i) => {
                            const exerciseIndex =
                                exercise.originalIndex;

                            const prevExercise =
                                getPreviousExercise(
                                    latestWorkout,
                                    exercise.name
                                );

                            const showUnits =
                                i === 0 ||
                                nonCardioExercises[
                                    i - 1
                                ].type !==
                                exercise.type;

                            return (
                                <tr
                                    key={
                                        exerciseIndex
                                    }
                                >
                                    <td className="exercise-name-cell">
                                        <div className="exercise-name-wrapper">
                                            <div className="exercise-name-content">
                                                {
                                                    exercise.name
                                                }
                                            </div>
                                        </div>
                                    </td>

                                    <td>
                                        {renderRoundExerciseInput(
                                            exercise,
                                            exerciseIndex,
                                            prevExercise,
                                            showUnits
                                        )}
                                    </td>

                                    {exercise ===
                                        nonCardioExercises[0] && (
                                            <td
                                                rowSpan={
                                                    nonCardioExercises.length
                                                }
                                            >
                                                <UnitInput
                                                    value={
                                                        newWorkout
                                                            .rounds
                                                            ?.count
                                                    }
                                                    placeholder={
                                                        latestWorkout
                                                            ?.rounds
                                                            ?.count
                                                    }
                                                    unit="Rounds"
                                                    onChange={e =>
                                                        updateRounds(
                                                            "count",
                                                            handleNumberInput(
                                                                e.target.value,
                                                                999
                                                            )
                                                        )
                                                    }
                                                />
                                            </td>
                                        )}

                                    {exercise ===
                                        nonCardioExercises[0] &&
                                        renderNotes(
                                            newWorkout
                                                .exercises
                                                .length
                                        )}
                                </tr>
                            );
                        }
                    )}

                    {cardioExercises.map(
                        exercise => {
                            const exerciseIndex =
                                exercise.originalIndex;

                            const prevExercise =
                                getPreviousExercise(
                                    latestWorkout,
                                    exercise.name
                                );

                            return (
                                <tr
                                    key={
                                        exerciseIndex
                                    }
                                >
                                    <td className="exercise-name-cell">
                                        <div className="exercise-name-wrapper">
                                            <div className="exercise-name-content">
                                                {
                                                    exercise.name
                                                }
                                            </div>
                                        </div>
                                    </td>

                                    <td
                                        colSpan={
                                            hasRoundExercises
                                                ? 2
                                                : 1
                                        }
                                        className="cardio-cell"
                                    >
                                        {renderCardioInputs(
                                            exercise,
                                            exerciseIndex,
                                            prevExercise,
                                            true
                                        )}
                                    </td>

                                    {!hasRoundExercises &&
                                        exercise ===
                                        cardioExercises[0] &&
                                        renderNotes(
                                            cardioExercises.length
                                        )}
                                </tr>
                            );
                        }
                    )}

                    <tr>
                        <td
                            className="submitbtn"
                            colSpan={
                                hasRoundExercises
                                    ? 4
                                    : 3
                            }
                        >
                            <button
                                onClick={
                                    submitTable
                                }
                            >
                                Submit
                            </button>
                        </td>
                    </tr>

                </tbody>
            </table>
        );
    };

    /* ========================================================
       NORMAL EXERCISE INPUT
       ======================================================== */

    const renderSetInput = (
        exercise,
        set,
        setIndex,
        exerciseIndex,
        previousSet,
        showUnits
    ) => {
        if (
            exercise.type ===
            "weight_reps"
        ) {
            return (
                <div className="set-inputs">

                    <UnitInput
                        value={set.weight}
                        placeholder={
                            weightUnit === "kg"
                                ? previousSet?.weight !=
                                    null &&
                                    previousSet.weight !==
                                    ""
                                    ? Number(
                                        lbsToKg(
                                            previousSet.weight
                                        ).toFixed(
                                            1
                                        )
                                    )
                                    : undefined
                                : previousSet?.weight !=
                                    null &&
                                    previousSet.weight !==
                                    ""
                                    ? Number(
                                        Number(
                                            previousSet.weight
                                        ).toFixed(
                                            1
                                        )
                                    )
                                    : undefined
                        }
                        unit={weightUnit}
                        showUnit={showUnits}
                        onChange={e =>
                            updateSet(
                                exerciseIndex,
                                setIndex,
                                "weight",
                                handleDecimalInput(
                                    e.target.value,
                                    999
                                )
                            )
                        }
                    />

                    <UnitInput
                        value={set.reps}
                        placeholder={
                            previousSet?.reps
                        }
                        unit="reps"
                        showUnit={showUnits}
                        onChange={e =>
                            updateSet(
                                exerciseIndex,
                                setIndex,
                                "reps",
                                handleNumberInput(
                                    e.target.value,
                                    99
                                )
                            )
                        }
                    />

                </div>
            );
        }

        if (
            exercise.type === "reps"
        ) {
            return (
                <div className="set-inputs">
                    <UnitInput
                        value={set.reps}
                        placeholder={
                            previousSet?.reps
                        }
                        unit="reps"
                        showUnit={showUnits}
                        onChange={e =>
                            updateSet(
                                exerciseIndex,
                                setIndex,
                                "reps",
                                handleNumberInput(
                                    e.target.value,
                                    99
                                )
                            )
                        }
                    />
                </div>
            );
        }

        if (
            exercise.type === "time"
        ) {
            return (
                <div className="set-inputs">
                    <DurationInputs
                        minutes={
                            set.minutes
                        }
                        seconds={
                            set.seconds
                        }
                        minutesPlaceholder={
                            previousSet?.minutes
                        }
                        secondsPlaceholder={
                            previousSet?.seconds
                        }
                        showUnits={
                            showUnits
                        }
                        onMinutesChange={e =>
                            updateSet(
                                exerciseIndex,
                                setIndex,
                                "minutes",
                                handleNumberInput(
                                    e.target.value,
                                    120
                                )
                            )
                        }
                        onSecondsChange={e =>
                            updateSet(
                                exerciseIndex,
                                setIndex,
                                "seconds",
                                handleNumberInput(
                                    e.target.value,
                                    59
                                )
                            )
                        }
                    />
                </div>
            );
        }

        return null;
    };

    /* ========================================================
       NORMAL WORKOUT
       ======================================================== */

    const renderNormalWorkout = () => {
        const firstNonCardio =
            newWorkout.exercises.find(
                ex => ex.type !== "cardio"
            );

        const setCount =
            firstNonCardio?.sets?.length ||
            3;

        const hasNonCardio =
            Boolean(firstNonCardio);

        return (
            <table className="addWorkoutTable workout-log-table workout-log-table--entry">
                <tbody>

                    

                    <tr>
                        <th>
                            {newWorkout.workoutName}
                        </th>

                        {hasNonCardio ? (
                            Array.from({
                                length: setCount
                            }).map(
                                (_, index) => (
                                    <th
                                        key={
                                            index
                                        }
                                    >
                                        Set{" "}
                                        {index + 1}
                                    </th>
                                )
                            )
                        ) : (
                            <th colSpan={3}>
                                Stats
                            </th>
                        )}

                        <th>Notes</th>
                    </tr>

                    {displayExercises.map(
                        (exercise, i) => {
                            const exerciseIndex =
                                exercise.originalIndex;

                            const showUnits =
                                i === 0 ||
                                displayExercises[
                                    i - 1
                                ].type !==
                                exercise.type;

                            const prevExercise =
                                getPreviousExercise(
                                    latestWorkout,
                                    exercise.name
                                );

                            return (
                                <Fragment
                                    key={
                                        exerciseIndex
                                    }
                                >
                                    <tr>

                                        <td className="exercise-name-cell">
                                            <div className="exercise-name-wrapper">
                                                <div className="exercise-name-content">
                                                    {
                                                        exercise.name
                                                    }
                                                </div>
                                            </div>
                                        </td>

                                        {exercise.type ===
                                            "cardio" ? (
                                            <td
                                                className="cardio-cell"
                                                colSpan={
                                                    firstNonCardio
                                                        ?.sets
                                                        ?.length ||
                                                    3
                                                }
                                            >
                                                {renderCardioInputs(
                                                    exercise,
                                                    exerciseIndex,
                                                    prevExercise,
                                                    showUnits
                                                )}
                                            </td>
                                        ) : (
                                            exercise.sets.map(
                                                (
                                                    set,
                                                    j
                                                ) => (
                                                    <td
                                                        className="Sets"
                                                        key={
                                                            j
                                                        }
                                                    >
                                                        <div className="Sets-content">
                                                            {renderSetInput(
                                                                exercise,
                                                                set,
                                                                j,
                                                                exerciseIndex,
                                                                prevExercise
                                                                    ?.sets?.[
                                                                j
                                                                ],
                                                                showUnits
                                                            )}
                                                        </div>
                                                    </td>
                                                )
                                            )
                                        )}

                                        {i === 0 &&
                                            renderNotes(
                                                displayExercises.length
                                            )}

                                    </tr>
                                </Fragment>
                            );
                        }
                    )}

                    {hasNonCardio && (
                        <tr>
                            <td colSpan={5}>
                                <div className="SetControls">

                                    <button
                                        className="addButton"
                                        onClick={
                                            addSets
                                        }
                                    >
                                        Add Set
                                    </button>

                                    <button
                                        className="minusButton"
                                        onClick={
                                            delSets
                                        }
                                    >
                                        Delete Set
                                    </button>

                                </div>
                            </td>
                        </tr>
                    )}

                    <tr>
                        <td
                            className="submitbtn"
                            colSpan={12}
                        >
                            <button
                                onClick={
                                    submitTable
                                }
                            >
                                Submit
                            </button>
                        </td>
                    </tr>

                </tbody>
            </table>
        );
    };

    /* ========================================================
       RETURN
       ======================================================== */

    return (
        <>
            <div>

                {feedback && (
                    <h2>{feedback}</h2>
                )}

                {newWorkout && (
                    
                    <div className="table-container">
                        {renderDate()}
                        {newWorkout.isRounds
                            ? renderRoundsWorkout()
                            : renderNormalWorkout()}

                        {newWorkout.description && (
                            <div className="selector-hint">
                                <p>

                                    {
                                        newWorkout.description
                                    }
                                </p>
                            </div>
                        )}

                    </div>
                )}

                {showDurationPopup && (
                    <div
                        ref={durationRef}
                        className="duration-section"
                    >
                        <div className="popup">

                            <h3>
                                Workout Duration (mins)
                            </h3>

                            <input
                                type="number"
                                className="no-spinner"
                                min={0}
                                max={999}
                                value={
                                    duration ?? ""
                                }
                                onChange={e => {
                                    const value =
                                        e.target.value;

                                    if (
                                        value === ""
                                    ) {
                                        setDuration(
                                            null
                                        );
                                        return;
                                    }

                                    setDuration(
                                        Math.min(
                                            999,
                                            Number(
                                                value
                                            )
                                        )
                                    );
                                }}
                            />

                            <div className="popup-buttons">

                                <button
                                    className="save-btn"
                                    onClick={() => {
                                        saveWorkout(
                                            duration
                                        );

                                        setShowDurationPopup(
                                            false
                                        );
                                    }}
                                >
                                    Save
                                </button>

                                <button
                                    className="skip-btn"
                                    onClick={() => {
                                        saveWorkout(
                                            null
                                        );

                                        setShowDurationPopup(
                                            false
                                        );
                                    }}
                                >
                                    Skip
                                </button>

                            </div>

                        </div>
                    </div>
                )}

            </div>
        </>
    );
}
