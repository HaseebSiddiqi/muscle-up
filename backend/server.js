require("dotenv").config();

const authMiddleware = require("./authMiddleware");
const { OAuth2Client } = require("google-auth-library");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand, UpdateCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const {
    CognitoIdentityProviderClient,
    AdminDeleteUserCommand,
    AdminGetUserCommand,
    ListUsersCommand, 
    AdminCreateUserCommand,
    AdminSetUserPasswordCommand,
    AdminLinkProviderForUserCommand
} = require("@aws-sdk/client-cognito-identity-provider");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const cognitoClient = new CognitoIdentityProviderClient({
    region: process.env.COGNITO_REGION
});

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
);
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
    max: 400,
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(express.json({ limit: "100kb" }));
//Allow requests from the frontend
app.use(cors({
    origin: ["https://muscleup.live", "http://localhost:3000", "https://localhost"],
    credentials: true
}));

app.use(apiLimiter);

app.post("/auth/google/signup", async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({
                error: "Google credential is required"
            });
        }

        // Verify Google's ID token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        const email = payload.email;
        const googleSubject = payload.sub;
        const emailVerified = payload.email_verified;

        if (!email || !googleSubject || emailVerified !== true) {
            return res.status(400).json({
                error: "A verified Google email is required"
            });
        }

        // Search Cognito for an account with this email
        const result = await cognitoClient.send(
            new ListUsersCommand({
                UserPoolId: process.env.COGNITO_USER_POOL_ID,
                Filter: `email = "${email.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`,
                Limit: 60
            })
        );

        const matchingUsers = (result.Users || []).filter(user => {
            const userEmail = user.Attributes?.find(
                attribute => attribute.Name === "email"
            )?.Value;

            return userEmail?.toLowerCase() === email.toLowerCase();
        });

        if (matchingUsers.length > 1) {
            return res.status(409).json({
                error: "Multiple accounts found. Manual account review required."
            });
        }

        if (matchingUsers.length === 1) {
        const existingUser = matchingUsers[0];
        const cognitoUsername = existingUser.Username;

        // Check whether this Google identity is already linked
        const identitiesAttribute = existingUser.Attributes?.find(
            attribute => attribute.Name === "identities"
        )?.Value;

        const identities = identitiesAttribute
            ? JSON.parse(identitiesAttribute)
            : [];

        const googleAlreadyLinked = identities.some(
            identity =>
                identity.providerName === "Google" &&
                identity.userId === googleSubject
        );

        // Link Google to the existing Cognito account if necessary
        if (!googleAlreadyLinked) {
            await cognitoClient.send(
                new AdminLinkProviderForUserCommand({
                    UserPoolId: process.env.COGNITO_USER_POOL_ID,
                    DestinationUser: {
                        ProviderName: "Cognito",
                        ProviderAttributeValue: cognitoUsername
                    },
                    SourceUser: {
                        ProviderName: "Google",
                        ProviderAttributeName: "Cognito_Subject",
                        ProviderAttributeValue: googleSubject
                    }
                })
            );
        }
        return res.json({
            accountExists: true,
            username: cognitoUsername,
            email: email
        });

        }

        return res.json({
            accountExists: false
        });

    } catch (error) {
        console.error("Google signup verification error:", error);

        return res.status(401).json({
            error: "Google authentication failed"
        });
    }
}); 


app.post("/auth/google/check-username", async (req, res) => {
    try {
        const { username } = req.body;

        if (!username || typeof username !== "string" || !username.trim()) {
            return res.status(400).json({
                error: "Username is required"
            });
        }

        const cleanUsername = username.trim();

        try {
            await cognitoClient.send(
                new AdminGetUserCommand({
                    UserPoolId: process.env.COGNITO_USER_POOL_ID,
                    Username: cleanUsername
                })
            );

            // Cognito found this username
            return res.json({
                available: false
            });

        } catch (error) {
            if (error.name === "UserNotFoundException") {
                return res.json({
                    available: true
                });
            }

            throw error;
        }

    } catch (error) {
        console.error("Username availability check error:", error);

        return res.status(500).json({
            error: "Unable to check username availability"
        });
    }
});

app.post("/auth/google/create-account", async (req, res) => {
    let createdUsername = null;

    try {
        const { credential, username } = req.body;

        if (
            !credential ||
            typeof username !== "string" ||
            !username.trim()
        ) {
            return res.status(400).json({
                error: "Google credential and username are required"
            });
        }

        const cleanUsername = username.trim();

        // Verify the Google ID token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const email = payload.email;
        const googleSubject = payload.sub;

        if (!email || !googleSubject || payload.email_verified !== true) {
            return res.status(400).json({
                error: "A verified Google email is required"
            });
        }

        // Check that the username is still available
        try {
            await cognitoClient.send(
                new AdminGetUserCommand({
                    UserPoolId: process.env.COGNITO_USER_POOL_ID,
                    Username: cleanUsername
                })
            );

            return res.status(409).json({
                error: "That username is already taken."
            });
        } catch (error) {
            if (error.name !== "UserNotFoundException") {
                throw error;
            }
        }

        // Check that an account with this email does not already exist
        const result = await cognitoClient.send(
            new ListUsersCommand({
                UserPoolId: process.env.COGNITO_USER_POOL_ID,
                Filter: `email = "${email.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`,
                Limit: 60
            })
        );

        const matchingUsers = (result.Users || []).filter(user => {
            const userEmail = user.Attributes?.find(
                attribute => attribute.Name === "email"
            )?.Value;

            return userEmail?.toLowerCase() === email.toLowerCase();
        });

        if (matchingUsers.length > 0) {
            return res.status(409).json({
                error: "An account with this email already exists.",
                accountExists: true
            });
        }

        // Generate a secure internal password
        const internalPassword =
            "Aa1!" + crypto.randomBytes(32).toString("hex");

        // Create the Cognito account using the chosen username
        await cognitoClient.send(
            new AdminCreateUserCommand({
                UserPoolId: process.env.COGNITO_USER_POOL_ID,
                Username: cleanUsername,
                MessageAction: "SUPPRESS",
                UserAttributes: [
                    { Name: "email", Value: email },
                    { Name: "email_verified", Value: "true" }
                ]
            })
        );

        createdUsername = cleanUsername;

        // Set the internal password as permanent
        await cognitoClient.send(
            new AdminSetUserPasswordCommand({
                UserPoolId: process.env.COGNITO_USER_POOL_ID,
                Username: cleanUsername,
                Password: internalPassword,
                Permanent: true
            })
        );

        // Link the Google identity to the new Cognito account
        await cognitoClient.send(
            new AdminLinkProviderForUserCommand({
                UserPoolId: process.env.COGNITO_USER_POOL_ID,
                DestinationUser: {
                    ProviderName: "Cognito",
                    ProviderAttributeValue: cleanUsername
                },
                SourceUser: {
                    ProviderName: "Google",
                    ProviderAttributeName: "Cognito_Subject",
                    ProviderAttributeValue: googleSubject
                }
            })
        );

        return res.status(201).json({
            success: true,
            message: "Google account created successfully."
        });

    } catch (error) {
        console.error("Google account creation error:", error);

        // Remove the new account if setup failed
        if (createdUsername) {
            try {
                await cognitoClient.send(
                    new AdminDeleteUserCommand({
                        UserPoolId: process.env.COGNITO_USER_POOL_ID,
                        Username: createdUsername
                    })
                );
            } catch (deleteError) {
                console.error("Account cleanup error:", deleteError);
            }
        }

        if (error.name === "UsernameExistsException") {
            return res.status(409).json({
                error: "That username is already taken."
            });
        }

        return res.status(500).json({
            error: "Unable to create your Google account."
        });
    }
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


// Create the four default workouts for a newly registered account
app.post("/workouts/create-defaults", authMiddleware, async (req, res) => {
    try {
        const username = req.user.username;

        const defaultWorkouts = [
            {
                workoutName: "Push Day",
                exercises: [
                    { name: "Bench Press", type: "weight_reps" },
                    { name: "Shoulder Press", type: "weight_reps" },
                    { name: "Chest Fly", type: "weight_reps" },
                    { name: "Tricep Overhead", type: "weight_reps" },
                    { name: "Lateral Raises", type: "weight_reps" }
                ],
                colour: "purple"
            },
            {
                workoutName: "Pull Day",
                exercises: [
                    { name: "Assisted Pull Ups", type: "weight_reps" },
                    { name: "Lat Pulldown", type: "weight_reps" },
                    { name: "Seated Cable Row", type: "weight_reps" },
                    { name: "Dumbbell Curl", type: "weight_reps" },
                    { name: "Hammer Curl", type: "weight_reps" }
                ],
                colour: "green"
            },
            {
                workoutName: "Legs & Abs",
                exercises: [
                    { name: "Leg Press", type: "weight_reps" },
                    { name: "Leg Curl", type: "weight_reps" },
                    { name: "Leg Extension", type: "weight_reps" },
                    { name: "Calf Raises", type: "weight_reps" },
                    { name: "Decline Sit Ups", type: "weight_reps" },
                    { name: "Planks", type: "time" }
                ],
                colour: "red"
            },
            {
                workoutName: "Calisthenics",
                exercises: [
                    { name: "Push Ups", type: "reps" },
                    { name: "Pull Ups", type: "reps" },
                    { name: "Squats", type: "reps" },
                    { name: "Lunges", type: "reps" },
                    { name: "Planks", type: "time" }
                ],
                colour: "blue"
            }
        ];

        for (const workout of defaultWorkouts) {
            await db.send(
                new PutCommand({
                    TableName: "WorkoutTypes",
                    Item: {
                        username,
                        ...workout
                    }
                })
            );
        }

        return res.status(201).json({
            success: true,
            message: "Default workouts created successfully."
        });

    } catch (error) {
        console.error("Default workout creation error:", error);

        return res.status(500).json({
            error: "Failed to create default workouts."
        });
    }
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});


