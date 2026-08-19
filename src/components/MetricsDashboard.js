import { PieChart, Pie, Cell, Tooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { useState, useEffect } from "react";
import { useUnits } from "../contexts/unitContext";


export default function MetricsDashboard({ viewWorkouts }) {
    const {distanceUnit} = useUnits();
    const [useMiles, setUseMiles] = useState(distanceUnit === "miles");
    const [selectedPeriod, setSelectedPeriod] = useState("lifetime");

    useEffect(() => {
        setUseMiles(distanceUnit === "miles");
    }, [distanceUnit]);

    // -----------------------------
    // Basic Metrics
    // -----------------------------

    const totalWorkouts = viewWorkouts.length;
    const empty = totalWorkouts === 0;
    const cutOff = new Date();
    cutOff.setDate(cutOff.getDate() - 28);

    const lastMonth = viewWorkouts.filter(w => {
        const workoutDate = new Date(w.date);
        return workoutDate >= cutOff;
    });

    const cardioDuration = viewWorkouts.reduce((acc, workout) => {
        return acc + (workout.exercises?.reduce((sum, ex) => {
            return ex.type === 'cardio' ? sum + (ex.duration || 0) : sum;
        }, 0) || 0);
    }, 0);


    const cardioDistance = viewWorkouts.reduce((acc, workout) => {
        return acc + (workout.exercises?.reduce((sum, ex) => {
            return ex.type === 'cardio' ? sum + (ex.distance || 0) : sum;
        }, 0) || 0);
    }, 0);


    const cardioCalories = viewWorkouts.reduce((acc, workout) => {
        return acc + (workout.exercises?.reduce((sum, ex) => {
            return ex.type === 'cardio' ? sum + (ex.calories || 0) : sum;
        }, 0) || 0);
    }, 0);

    const totalCardioHours = Math.floor(cardioDuration / 60);
    const totalCardioMinsRemaining = cardioDuration % 60;

    const activeDays = new Set(
        lastMonth.map(workout => workout.date)
    ).size;

    const avgPerWeek = activeDays / 4;


    const totalMins = viewWorkouts.reduce((acc, workout) => {
        return acc + (workout.duration || 0);
    }, 0);
    const totalHours = Math.floor(totalMins / 60);
    const totalMinsRemaining = totalMins % 60;

    // -----------------------------
    // Workout Type Distribution
    // -----------------------------
    let distribution = viewWorkouts; 
    if (selectedPeriod === "yearly"){
        distribution = viewWorkouts.filter(workout => {
            const workoutDate = new Date(workout.date).getFullYear();
            const currentYear = new Date().getFullYear();
            return workoutDate === currentYear;
        });

    }

    if (selectedPeriod === "quarter"){
        distribution = viewWorkouts.filter(workout => {
            const date = new Date(workout.date);
            const today = new Date();

            const workoutDate = date.getFullYear() * 12 + date.getMonth();
            const currentMonth = today.getFullYear() * 12 + today.getMonth();
            return currentMonth - workoutDate <= 3 ;
        });
    }

       if (selectedPeriod === "month"){
        distribution = viewWorkouts.filter(workout => {
            const date = new Date(workout.date);
            
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 30);
            return date >= cutoffDate;
               
        });
    }

    const workoutsByType = distribution.reduce((acc, workout) => {
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


    const weeklyActiveDays = {};

    viewWorkouts.forEach(workout => {
        const date = new Date(workout.date);
        const weekKey = getWeekKey(date);

        if (!weeklyActiveDays[weekKey]) {
            weeklyActiveDays[weekKey] = new Set();
        }

        weeklyActiveDays[weekKey].add(workout.date);
    });

    let streak = 0;

    const currentWeek = getWeekKey(new Date());
    const weeks = Object.keys(weeklyActiveDays).sort().reverse();

    for (const week of weeks) {

        if (week === currentWeek) {
            continue;
        }

        if (weeklyActiveDays[week].size >= 3) {
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
        "#ef4444",
        "#22c55e",
        "#f009e1ff",
        "#fdde11ff",
        "#a211fdff",
        "#814938ff",
    ];

    const displayedDistance = useMiles
        ? cardioDistance.toFixed(2)
        : (cardioDistance * 1.60934).toFixed(2);

    return (
        <div>
            <h2>Workout Stats</h2>
            {empty ? (
                <p>No workouts logged yet. Start working out to see your metrics!</p>
            ) : (
                <>
                    {/* Stat Card Grid */}
                    <div className="metrics-stat-grid">
                        <div className="metric-stat-card">
                            <span className="card-label">Workout Summary</span>

                            <div className="card-value">
                                🏋️‍♂️ {totalWorkouts}
                                <span> workouts</span>
                            </div>

                            <div className="card-value">
                                ⏱️ {totalHours}<span>h</span> {totalMinsRemaining}<span>m</span>
                            </div>
                        </div>

                        <div className="metric-stat-card" onClick={() => setUseMiles(!useMiles)} style={{ cursor: "pointer" }}>
                            <span className="card-label">Cardio Stats <small className="toggle-hint">click to toggle</small></span>
                            <div className="card-value">⏱️ {totalCardioHours}<span>h</span> {totalCardioMinsRemaining}<span>m</span></div>
                            <div className="card-value"> 🛣️ {displayedDistance}<span>{useMiles ? "mi" : "km"}</span></div>
                            <div className="card-value">⚡ {cardioCalories}<span>kcal</span></div>
                        </div>

                        <div className="metric-stat-card">
                            <span className="card-label">Active Days / Week</span>
                            <div className="card-value">📈 {avgPerWeek.toFixed(1)}</div>
                            <p className="metrics-subtitle">(Last 4 weeks)</p>
                        </div>

                        <div className="metric-stat-card">
                            <span className="card-label">Consistency Streak</span>
                            <div className="card-value">🔥 {streak} <span>weeks</span></div>
                            <p className="metrics-subtitle">3+ Active Days Per Week</p>
                        </div>
                    </div>

                    {/* Workout Type Distribution (Donut Chart) */}
                    <div className="metrics-chart-container">
                        <h4>Workout Type Distribution</h4>
                        <div style={{ width: '100%', height: 250 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={data}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={4}
                                    >
                                        {data.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index % COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                         <div className="distributionGrapButtonRow"> 
                                <button className="distributionGraphButton" onClick = {() => setSelectedPeriod("lifetime")}>Lifetime</button>
                                <button className="distributionGraphButton" onClick = {() => setSelectedPeriod("yearly")}>Last Year</button>
                                <button className="distributionGraphButton" onClick = {() => setSelectedPeriod("quarter")}>Last 4 Months</button>
                                <button className="distributionGraphButton" onClick = {() => setSelectedPeriod("month")}>Last Month</button>
                        </div>
                    </div>

                    {/* Monthly Workout Frequency (AreaChart) */}
                    <div className="metrics-chart-container">
                        <h4>Monthly Workout Frequency</h4>
                        <div style={{ width: '100%', height: 250 }}>
                            <ResponsiveContainer>
                                <AreaChart data={LineData}>
                                    <defs>
                                        <linearGradient id="colorWorkouts" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--secondary)" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="var(--secondary)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <YAxis tickLine={false} axisLine={false} width={30} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                                    <Legend />
                                    <Area
                                        type="monotone"
                                        dataKey="workouts"
                                        stroke="var(--secondary)"
                                        fillOpacity={1}
                                        fill="url(#colorWorkouts)"
                                        strokeWidth={3}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}