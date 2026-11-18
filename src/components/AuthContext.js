
import { createContext, useContext, useState, useEffect } from "react";
import { signOut, fetchAuthSession } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "./apiClient.js";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const refreshUser = async () => {
        try {
            const session = await fetchAuthSession();
            const payload = session.tokens.idToken.payload;

            const username = payload["cognito:username"];

            setUser({ username });

            // Only initialize workouts for a new Google signup
            if (
                sessionStorage.getItem(
                    "createDefaultWorkoutsAfterGoogleSignup"
                ) === "true"
            ) {
                try {
                    await apiFetch(
                        "https://workouttracker-production-4d3e.up.railway.app/workouts/create-defaults",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            }
                        }
                    );

                    sessionStorage.removeItem(
                        "createDefaultWorkoutsAfterGoogleSignup"
                    );

                    console.log("Default workouts created successfully.");
                } catch (error) {
                    console.error("Default workout creation failed:", error);
                }
            }

        } catch (err) {
            console.error(err);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            setUser(null);
            navigate('/');
        } catch (err) {
            console.error('Error signing out', err);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    return (
        <AuthContext.Provider
            value={{ user, setUser, handleSignOut, loading, refreshUser }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
