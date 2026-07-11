import { PieChart, Pie, Cell, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

export default function MetricsDashboard({ viewWorkouts }) {

    // -----------------------------
    // Basic Metrics
    // -----------------------------

    const totalWorkouts = viewWorkouts.length;

    const cutOff = new Date();
    cutOff.setDate(cutOff.getDate() - 28);

    const lastMonth = viewWorkouts.filter(w => {
        const workoutDate = new Date(w.date);
        return workoutDate >= cutOff;
    });

    const avgPerWeek = lastMonth.length / 4;


    // -----------------------------
    // Workout Type Distribution
    // -----------------------------

    const workoutsByType = viewWorkouts.reduce((acc, workout) => {
        acc[workout.workoutName] = (acc[workout.workoutName] || 0) + 1;
        return acc;
    }, {});


    const data = Object.keys(workoutsByType).map((type) => ({
        name: type,
        value: workoutsByType[type]
    }));


    // -----------------------------
    // Consistency Streak
    // -----------------------------

    function getWeekKey(date) {
        const year = date.getFullYear();

        const startOfYear = new Date(year, 0, 1);
        const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));

        const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);

        return `${year}-W${week}`;
    }


    const weeklyWorkouts = {};

    viewWorkouts.forEach(workout => {
        const date = new Date(workout.date);
        const weekKey = getWeekKey(date);

        weeklyWorkouts[weekKey] = (weeklyWorkouts[weekKey] || 0) + 1;
    });


    let streak = 0;

    const currentWeek = getWeekKey(new Date());
    const weeks = Object.keys(weeklyWorkouts).sort().reverse();

    for (const week of weeks) {

        if (week === currentWeek) {
            continue;
        }

        if (weeklyWorkouts[week] >= 3) {
            streak++;
        } else {
            break;
        }
    }


    // -----------------------------
    // Monthly Workout Frequency
    // -----------------------------

    const monthlyWorkouts = Array(12).fill(0);

    viewWorkouts.forEach(workout => {
        const date = new Date(workout.date);
        const month = date.getMonth();

        monthlyWorkouts[month]++;
    });


    const LineData = [
        { month: "Jan", workouts: monthlyWorkouts[0] },
        { month: "Feb", workouts: monthlyWorkouts[1] },
        { month: "Mar", workouts: monthlyWorkouts[2] },
        { month: "Apr", workouts: monthlyWorkouts[3] },
        { month: "May", workouts: monthlyWorkouts[4] },
        { month: "Jun", workouts: monthlyWorkouts[5] },
        { month: "Jul", workouts: monthlyWorkouts[6] },
        { month: "Aug", workouts: monthlyWorkouts[7] },
        { month: "Sep", workouts: monthlyWorkouts[8] },
        { month: "Oct", workouts: monthlyWorkouts[9] },
        { month: "Nov", workouts: monthlyWorkouts[10] },
        { month: "Dec", workouts: monthlyWorkouts[11] }
    ];


    // -----------------------------
    // Chart Colors
    // -----------------------------

    const COLORS = [
        "#f97316",
        "#0284c7",
        "#f61b1bff",
        "#12c524ff",
        "#f009e1ff",
        "#fdde11ff",
        "#a211fdff",
        "#814938ff",
    ];


    return (
        <div>
            <h2>MetricsDashboard</h2>

            <h2>Total workouts: {totalWorkouts}</h2>

            <h3>
                Average Workouts per Week (Last 4 Weeks): {avgPerWeek.toFixed(1)}
            </h3>



            <h3>Consistency Streak: 🔥 {streak} weeks</h3>
            <p>3+ workouts per week</p>

            <h3>Workout Type Distribution</h3>
            <PieChart width={400} height={400}>
                <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={170}
                    activeIndex={-1}
                >
                    {data.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            stroke="#ebe2e2ff"
                            strokeWidth={3}
                            fill={COLORS[index % COLORS.length]}
                        />
                    ))}
                </Pie>

                <Tooltip />
                <Legend />
            </PieChart>


            <h3>Monthly Workout Frequency</h3>

            <LineChart width={700} height={400} data={LineData}>
                <CartesianGrid />
                <XAxis dataKey="month" />
                <YAxis label={{ value: "# of workouts", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Legend />

                <Line
                    type="monotone"
                    dataKey="workouts"
                    stroke="#000000ff"
                    strokeWidth={3}
                />
            </LineChart>

        </div>
    )
}