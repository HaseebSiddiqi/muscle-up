import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "./apiClient";
import { useAuth } from "./AuthContext";
import { useUnits } from "../contexts/unitContext";
import {
    Tooltip,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer
} from "recharts";


export default function UserStats() {
    const [selectedPeriod, setSelectedPeriod] = useState("lifetime");
    const { weightUnit, lbsToKg, kgToLbs, getLocalDate } = useUnits();
    const [currentWeight, setCurrentWeight] = useState(null);
    const [feedback, setFeedback] = useState("");
    const [lastDate, setLastDate] = useState("");
    const [weightData, setWeightData] = useState([]);
    const { user } = useAuth();

    const fetchWeight = useCallback(async () => {
        const res = await apiFetch(
            "https://workouttracker-production-4d3e.up.railway.app/weightTable"
        );

        const data = await res.json();

        if (data.length > 0) {
            setWeightData(data);

            setCurrentWeight(data[data.length - 1].weight);
            setLastDate(data[data.length - 1].date);

            if (weightUnit === "kg") {
                setCurrentWeight(
                    lbsToKg(data[data.length - 1].weight).toFixed(2)
                );
            }
        }
    }, [weightUnit, lbsToKg]);

    useEffect(() => {
        fetchWeight();
    }, [fetchWeight]);

    let graphData;
    const formatGraphEntry = entry => {
        const [year, month, day] = entry.date.split("-").map(Number);

        return {
            date: entry.date,
            timestamp: new Date(year, month - 1, day).getTime(),
            weight:
                weightUnit === "kg"
                    ? Number(lbsToKg(entry.weight).toFixed(2))
                    : Number(entry.weight)
        };
    };

    if (selectedPeriod === "lifetime") {
        graphData = weightData.map(formatGraphEntry);
    }

    if (selectedPeriod === "quarter") {
        graphData = weightData
            .filter(entry => {
                const [year, month] = entry.date.split("-").map(Number);

                const today = new Date();

                const entryDate = year * 12 + (month - 1);
                const currentMonth =
                    today.getFullYear() * 12 + today.getMonth();

                return currentMonth - entryDate <= 3;
            })
            .map(formatGraphEntry);
    }

    if (selectedPeriod === "yearly") {
        graphData = weightData
            .filter(entry => {
                const year = Number(entry.date.split("-")[0]);
                const currentYear = new Date().getFullYear();

                return currentYear === year;
            })
            .map(formatGraphEntry);
    }

    if (selectedPeriod === "month") {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 30);

        graphData = weightData
            .filter(entry => {
                const [year, month, day] = entry.date.split("-").map(Number);

                const entryDate = new Date(year, month - 1, day);

                return entryDate >= cutoffDate;
            })
            .map(formatGraphEntry);
    }
    const submitWeight = async () => {
        if (currentWeight == null) {
            setFeedback("Enter a valid weight");
            return;
        }

        const username = user.username;
        const currentDate = getLocalDate();

        let weightToSave = currentWeight;

        if (weightUnit === "kg") {
            weightToSave = kgToLbs(currentWeight).toFixed(2);
        }

        await apiFetch(
            "https://workouttracker-production-4d3e.up.railway.app/weightTable",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username,
                    date: currentDate,
                    weight: weightToSave
                })
            }
        );

        setLastDate(currentDate);
        fetchWeight();

        setFeedback("Weight Logged");

        setTimeout(() => {
            setFeedback("");
        }, 2000);
    };

    return (
        <div>
            <h2>Weight Tracker</h2>

            <div className="WeightDisplay">
                <div className="weightInput">
                    <input
                        className="weightNumber"
                        placeholder="---"
                        type="text"
                        inputMode="decimal"
                        value={currentWeight}
                        onChange={e => {
                            const value = e.target.value;

                            if (/^\d{0,3}(\.\d{0,2})?$/.test(value)) {
                                setCurrentWeight(value);
                            }
                        }}
                    />

                    <span>{weightUnit}</span>
                </div>

                {feedback && <h3>{feedback}</h3>}

                {lastDate != null && (
                    <label>Last Updated: {lastDate}</label>
                )}

                <button
                    className="weightSubmit"
                    onClick={() => submitWeight()}
                >
                    Submit
                </button>
            </div>

            {weightData.length !== 0 ? (
                <>
                    <div className="metrics-chart-container">
                        <h4>Weight Over Time</h4>

                        <div style={{ width: "100%", height: 285 }}>
                            <ResponsiveContainer>
                                <AreaChart data={graphData}>
                                    <defs>
                                        <linearGradient
                                            id="colorWeight"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="var(--secondary)"
                                                stopOpacity={0.4}
                                            />

                                            <stop
                                                offset="95%"
                                                stopColor="var(--secondary)"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    </defs>

                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="#f1f5f9"
                                    />

                                    <XAxis
                                        type="number"
                                        dataKey="timestamp"
                                        domain={["dataMin", "dataMax"]}
                                        scale="time"
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{
                                            fill: "#64748b",
                                            fontSize: 11
                                        }}
                                        tickFormatter={timestamp => {
                                            const date = new Date(timestamp);

                                            return date.toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric"
                                            });
                                        }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                    />

                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        width={40}
                                        tick={{
                                            fill: "#64748b",
                                            fontSize: 12
                                        }}
                                        domain={[
                                            "dataMin - 2",
                                            "dataMax + 2"
                                        ]}
                                    />

                                    <Tooltip
                                        labelFormatter={timestamp => {
                                            const date = new Date(timestamp);

                                            return date.toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric"
                                            });
                                        }}
                                        contentStyle={{
                                            borderRadius: 8,
                                            border: "1px solid #e2e8f0",
                                            boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                                        }}
                                        formatter={value => [
                                            `${value} ${weightUnit}`,
                                            "Weight"
                                        ]}
                                    />

                                    <Area
                                        type="monotone"
                                        dataKey="weight"
                                        stroke="var(--secondary)"
                                        fillOpacity={1}
                                        fill="url(#colorWeight)"
                                        strokeWidth={3}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="distributionGrapButtonRow">
                            <button
                                className={`distributionGraphButton ${selectedPeriod === "lifetime" ? "selected" : ""}`}
                                onClick={() =>
                                    setSelectedPeriod("lifetime")
                                }
                            >
                                Lifetime
                            </button>

                            <button
                                className={`distributionGraphButton ${selectedPeriod === "yearly" ? "selected" : ""}`}
                                onClick={() =>
                                    setSelectedPeriod("yearly")
                                }
                            >
                                Last Year
                            </button>

                            <button
                                className={`distributionGraphButton ${selectedPeriod === "quarter" ? "selected" : ""}`}
                                onClick={() =>
                                    setSelectedPeriod("quarter")
                                }
                            >
                                Last 4 Months
                            </button>

                            <button
                                className={`distributionGraphButton ${selectedPeriod === "month" ? "selected" : ""}`}
                                onClick={() =>
                                    setSelectedPeriod("month")
                                }
                            >
                                Last Month
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <h3>Enter your current weight above</h3>
            )}
        </div>
    );
}