require("dotenv").config();

const authMiddleware = require("./authMiddleware");

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand, UpdateCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const {
    CognitoIdentityProviderClient,
    AdminDeleteUserCommand
} = require("@aws-sdk/client-cognito-identity-provider");
const rateLimit = require("express-rate-limit");
const cognitoClient = new CognitoIdentityProviderClient({
    region: process.env.COGNITO_REGION
});
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

app.use(express.json({ limit: "100kb" }));
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
        console.log(req.body);
        const username = req.user.username;
        const { workoutName, exercises, description, isRounds, colour } = req.body;

        if (
            typeof workoutName !== "string" ||
            !Array.isArray(exercises)
        ) {
            return res.status(400).json({
                error: "Invalid workout format"
            });
        }

        if (exercises.length > 10) {
            return res.status(400).json({
                error: "Too many exercises"
            });
        }
        const item = {
            username,
            workoutName,
            exercises,
            description,
            isRounds,
            colour
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

app.post("/users", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.sub;
        const username = req.user.username;
        const { distance, weight } = req.body;

        const item = {
            userId,
            username,
            distance,
            weight
        };

        await db.send(
            new PutCommand({
                TableName: "Users",
                Item: item
            })
        );

        res.json({ success: true, item });
        console.log({ item }, "User preferences updated");

    } catch (error) {
        console.error("Error updating user preferences:", error);
        res.status(500).json({ error: "Failed to update user preferences" });
    }
});

app.get("/users", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.sub;

        const result = await db.send(
            new GetCommand({
                TableName: "Users",
                Key: {
                    userId,
                },
            })
        );
        res.json(result.Item);
        console.log({ result }, "Fetching user preferences");
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch user preferences" });
    }
})


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
        const { workoutId, workoutName, date, duration, notes, exercises, rounds } = req.body;
        const username = req.user.username;

        const item = {
            username,
            workoutId,
            workoutName,
            date,
            duration,
            notes,
            exercises,
            rounds
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

app.post("/weightTable", authMiddleware, async (req, res) => {
    try {
        const username = req.user.username;
        const { date, weight } = req.body;

        const item = {
            username,
            date,
            weight
        };

        await db.send(
            new PutCommand({
                TableName: "WeightTable",
                Item: item
            })
        );

        res.json({ success: true, item });
        console.log({ item }, "User Weight Logged");

    } catch (error) {
        console.error("Error Logging Weight:", error);
        res.status(500).json({ error: "Failed to log weight" });
    }
});

app.get("/weightTable", authMiddleware, async (req, res) => {
    try {
        const username = req.user.username;

        const result = await db.send(
            new QueryCommand({
                TableName: "WeightTable",
                KeyConditionExpression: "username = :username",
                ExpressionAttributeValues: {
                    ":username": username
                }
            })
        );
        res.json(result.Items);
        console.log({ result }, "Fetching user weight entries");
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch user weight entries" });
    }
})

app.delete("/deleteAccount", authMiddleware, async (req, res) => {
    try {
        const sub = req.user.sub;
        const username = req.user.username;

        const resultLog = await db.send(
            new QueryCommand({
                TableName: "WorkoutLogs",
                KeyConditionExpression: "username = :username",
                ExpressionAttributeValues: {
                    ":username": username
                }
            })
        );
        let i = 0;
        while (i < resultLog.Items.length) {


            const item = resultLog.Items[i];
            await db.send(
                new DeleteCommand({
                    TableName: "WorkoutLogs",
                    Key: {
                        username: item.username,
                        workoutId: item.workoutId

                    }
                })
            );
            i++;
        }

        const resultType = await db.send(
            new QueryCommand({
                TableName: "WorkoutTypes",
                KeyConditionExpression: "username = :username",
                ExpressionAttributeValues: {
                    ":username": username
                }
            })
        );
        let j = 0;
        while (j < resultType.Items.length) {
            const item = resultType.Items[j];
            await db.send(
                new DeleteCommand({
                    TableName: "WorkoutTypes",
                    Key: {
                        username: item.username,
                        workoutName: item.workoutName
                    }
                })
            );
            j++;

        }

        const resultWeight = await db.send(
            new QueryCommand({
                TableName: "WeightTable",
                KeyConditionExpression: "username = :username",
                ExpressionAttributeValues: {
                    ":username": username
                }
            })
        );
        let k = 0;
        while (k < resultWeight.Items.length) {
            const item = resultWeight.Items[k];
            await db.send(
                new DeleteCommand({
                    TableName: "WeightTable",
                    Key: {
                        username: item.username,
                        date: item.date
                    }
                })
            );
            k++;

        }

        await db.send(
            new DeleteCommand({
                TableName: "Users",
                Key: {
                    userId: sub
                }
            })
        );

        await cognitoClient.send(
            new AdminDeleteUserCommand({
                UserPoolId: process.env.COGNITO_USER_POOL_ID,
                Username: username
            })
        );
        res.status(200).json({ message: "Account deleted successfully" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ err: "Failed to Delete Account" });

    }


});


