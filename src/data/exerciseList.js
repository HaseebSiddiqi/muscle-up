

const exerciseList = {
        Chest: [
            { name: "Bench Press", type: "weight_reps" },
            { name: "Incline Bench Press", type: "weight_reps" },
            { name: "Decline Bench Press", type: "weight_reps" },
            { name: "Dumbbell Bench Press", type: "weight_reps" },
            { name: "Incline Dumbbell Press", type: "weight_reps" },
            { name: "Chest Fly", type: "weight_reps" },
            { name: "Cable Chest Fly", type: "weight_reps" },
            { name: "Dumbbell Chest Fly", type: "weight_reps" },
            { name: "Push Ups", type: "reps" },
            { name: "Incline Push Ups", type: "reps" },
            { name: "Decline Push Ups", type: "reps" },
            { name: "Wide Grip Push Ups", type: "reps" },
            { name: "Diamond Push Ups", type: "reps" }
        ],

        Shoulders: [
            { name: "Shoulder Press", type: "weight_reps" },
            { name: "Dumbbell Shoulder Press", type: "weight_reps" },
            { name: "Arnold Press", type: "weight_reps" },
            { name: "Lateral Raises", type: "weight_reps" },
            { name: "Dumbbell Lateral Raises", type: "weight_reps" },
            { name: "Cable Lateral Raises", type: "weight_reps" },
            { name: "Front Raises", type: "weight_reps" },
            { name: "Dumbbell Front Raises", type: "weight_reps" },
            { name: "Rear Delt Fly", type: "weight_reps" },
            { name: "Face Pulls", type: "weight_reps" },
            { name: "Upright Row", type: "weight_reps" }
        ],

        Back: [
            { name: "Pull Ups", type: "reps" },
            { name: "Assisted Pull Ups", type: "weight_reps" },
            { name: "Weighted Pull Ups", type: "weight_reps" },
            { name: "Chin Ups", type: "reps" },
            { name: "Assisted Chin Ups", type: "weight_reps" },
            { name: "Weighted Chin Ups", type: "weight_reps" },
            { name: "Lat Pulldown", type: "weight_reps" },
            { name: "Seated Cable Row", type: "weight_reps" },
            { name: "One Arm Cable Row", type: "weight_reps" },
            { name: "Dumbbell Row", type: "weight_reps" },
            { name: "Barbell Row", type: "weight_reps" },
            { name: "T-Bar Row", type: "weight_reps" },
            { name: "Chest Supported Row", type: "weight_reps" },
            { name: "Straight Arm Pulldown", type: "weight_reps" }
        ],

        Biceps: [
            { name: "Dumbbell Curl", type: "weight_reps" },
            { name: "Hammer Curl", type: "weight_reps" },
            { name: "Barbell Curl", type: "weight_reps" },
            { name: "Cable Curl", type: "weight_reps" },
            { name: "Preacher Curl", type: "weight_reps" },
            { name: "Incline Dumbbell Curl", type: "weight_reps" },
            { name: "Concentration Curl", type: "weight_reps" },
            { name: "Reverse Curl", type: "weight_reps" }
        ],

        Triceps: [
            { name: "Dips", type: "reps" },
            { name: "Weighted Dips", type: "weight_reps" },
            { name: "Assisted Dips", type: "weight_reps" },
            { name: "Tricep Pushdown", type: "weight_reps" },
            { name: "Tricep Overhead", type: "weight_reps" },
            { name: "Skull Crushers", type: "weight_reps" },
            { name: "Diamond Push Ups", type: "reps" }
        ],

        Legs: [
            { name: "Squats", type: "weight_reps" },
            { name: "Body Weight Squats", type: "reps" },
            { name: "Leg Press", type: "weight_reps" },
            { name: "Leg Extension", type: "weight_reps" },
            { name: "Leg Curl", type: "weight_reps" },
            { name: "Romanian Deadlift", type: "weight_reps" },
            { name: "Deadlift", type: "weight_reps" },
            { name: "Bulgarian Split Squat", type: "weight_reps" },
            { name: "Weighted Lunges", type: "weight_reps" },
            { name: "Lunges", type: "reps" },
            { name: "Calf Raises", type: "weight_reps" },
        ],


        Abs: [
            { name: "Planks", type: "time" },
            { name: "Side Planks", type: "time" },
            { name: "Crunches", type: "reps" },
            { name: "Cable Crunches", type: "weight_reps" },
            { name: "Decline Sit Ups", type: "weight_reps" },
            { name: "Sit Ups", type: "reps" },
            { name: "Leg Raises", type: "reps" },
            { name: "Hanging Leg Raises", type: "reps" },
            { name: "Knee Raises", type: "reps" },
            { name: "Bicycle Crunches", type: "reps" },
            { name: "Russian Twists", type: "reps" },
            { name: "Ab Wheel Rollout", type: "reps" }
        ],

        Cardio : [
            { name: "Treadmill", type: "cardio" },
            { name: "Walking", type: "cardio" },
            { name: "Running", type: "cardio" },
            { name: "Cycling", type: "cardio" },
            { name: "Stationary Bike", type: "cardio" },
            { name: "Elliptical", type: "cardio" },
            { name: "Stair Master", type: "cardio" },
            { name: "Rowing Machine", type: "cardio" },
        ]
    };

export default exerciseList;