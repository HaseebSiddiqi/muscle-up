require("dotenv").config();

const authMiddleware = require("./authMiddleware");

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const rateLimit = require("express-rate-limit");

const client = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

const db = DynamoDBDocumentClient.from(client);



const express = require("express");

const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 5000;

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(express.json());
//Allow requests from the frontend
app.use(cors({
    origin: ["https://muscleup.live", "http://localhost:3000"],
    credentials: true
}));

app.use(apiLimiter);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

//Create new workout type
app.post("/workouts", authMiddleware, async (req, res) => {
    try {
        const username = req.user.username;
        const { workoutName, exercises } = req.body;

        const item = {
            username,
            workoutName,
            exercises
        };

        await db.send(
            new PutCommand({
                TableName: "WorkoutTypes",
                Item: item
            })
        );

        res.json({ success: true, item });
        console.log({ item }, "Workout Created");

    } catch (error) {
        console.error("Error creating workout:", error);
        res.status(500).json({ error: "Failed to create workout" });
    }

});

//Get workout types for user
app.get("/workouts", authMiddleware, async (req, res) => {
    try {
        const username = req.user.username;

        const result = await db.send(
            new QueryCommand({
                TableName: "WorkoutTypes",
                KeyConditionExpression: "username = :username",
                ExpressionAttributeValues: {
                    ":username": username
                }
            })
        );
        res.json(result);
        console.log({ result }, "Fetching user workouts");
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch workouts" });
    }
});

//Delete workout type
app.delete("/workouts/:workoutName", authMiddleware, async (req, res) => {
    try {
        const { workoutName } = req.params;
        const username = req.user.username;
        await db.send(
            new DeleteCommand({
                TableName: "WorkoutTypes",
                Key: {
                    username,
                    workoutName
                }
            })
        );

        res.json({ success: true });
        console.log({ workoutName }, "Deleted Successfully");
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete workout" });
    }
});




// CRUD CALLS FOR WORKOUT LOGS 
app.post("/workoutLogs", authMiddleware, async (req, res) => {
    try {
        const { workoutId, workoutName, date, notes, exercises } = req.body;
        const username = req.user.username;

        const item = {
            username,
            workoutId,
            workoutName,
            date,
            notes,
            exercises
        };

        await db.send(
            new PutCommand({
                TableName: "WorkoutLogs",
                Item: item
            })
        );

        res.json({ success: true, item });
        console.log({ item }, "Workout Created");

    } catch (error) {
        console.error("Error creating workout:", error);
        res.status(500).json({ error: "Failed to create workout" });
    }

});

app.get("/workoutLogs", authMiddleware, async (req, res) => {
    try {
        const username = req.user.username;

        const result = await db.send(
            new QueryCommand({
                TableName: "WorkoutLogs",
                KeyConditionExpression: "username = :username",
                ExpressionAttributeValues: {
                    ":username": username
                }
            })
        );
        res.json(result);
        console.log({ result }, "Fetching user workout log");
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch workouts" });
    }
});

app.delete("/workoutLogs/:workoutId", authMiddleware, async (req, res) => {
    try {
        const { workoutId } = req.params;
        const username = req.user.username;

        await db.send(
            new DeleteCommand({
                TableName: "WorkoutLogs",
                Key: {
                    username,
                    workoutId
                }
            })
        );
        res.json({ success: true });
        console.log({ workoutId }, "Deleted Successfully");

    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete workout entry" });
    }
});

app.patch("/workoutLogs/:workoutId", authMiddleware, async (req, res) => {
    try {
        const { workoutId } = req.params;
        const username = req.user.username;
        const updatedWorkout = req.body;

        await db.send(
            new PutCommand({
                TableName: "WorkoutLogs",
                Item: {
                    ...updatedWorkout,
                    username,
                    workoutId,
                },

            })
        );
        res.json({ success: true });
        console.log({ workoutId }, "Updated Successfully");
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update workout entry" });

    }
});