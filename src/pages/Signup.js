
import { useState } from "react";
import { signUp, signIn, confirmSignIn } from "aws-amplify/auth";
import MuscleUpGoogleLogin from "../components/MuscleUpGoogleLogin";
import { Link, useNavigate } from "react-router-dom";

import VerifyAccount from "../components/VerifyAccount";
import Navbar from "../components/Navbar";
import { useAuth } from "../components/AuthContext";

export default function Signup() {
    const navigate = useNavigate();
    const { refreshUser } = useAuth();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [verifyAccount, setVerifyAccount] = useState(false);

    const handleSignup = async (e) => {
        e.preventDefault();
        setError("");

        try {
            await signUp({
                username,
                password,
                options: {
                    userAttributes: {
                        email
                    }
                }
            });

            setVerifyAccount(true);
        } catch (err) {
            console.error("Signup error:", err);
            setError(err.message);
        }
    };

    const handleGoogleSignup = async (credential) => {
        try {
            setError("");

            const response = await fetch(
                 "https://workouttracker-production-4d3e.up.railway.app/auth/google/signup",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ credential })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Google signup failed.");
            }

            // New Google user: choose a username
            if (data.accountExists === false) {
                navigate("/select-username", {
                    state: { googleCredential: credential }
                });
                return;
            }

            if (!data.username) {
                throw new Error("Cognito username was not returned.");
            }

            // Existing user: start custom authentication
            const result = await signIn({
                username: data.username,
                options: {
                    authFlowType: "CUSTOM_WITHOUT_SRP"
                }
            });

            if (
                result.nextStep?.signInStep !==
                "CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE"
            ) {
                throw new Error("Unexpected Cognito authentication step.");
            }

            // Verify the original Google credential
            const confirmation = await confirmSignIn({
                challengeResponse: credential
            });

            if (!confirmation.isSignedIn) {
                throw new Error("Google authentication was not completed.");
            }

            await refreshUser();
            navigate("/home");

        } catch (err) {
            console.error("Google signup error:", err);
            setError(err.message || "Google signup failed.");
        }
    };

    return (
        <>
            <div className="navbar">
                <Navbar />
            </div>

            <div className="card login-card">
                {verifyAccount ? (
                    <VerifyAccount
                        username={username}
                        password={password}
                        onSuccess={() => navigate("/home")}
                    />
                ) : (
                    <>
                        <h2>Sign Up to Muscle Up!</h2>

                        <form onSubmit={handleSignup}>
                            <div className="input-group">
                                <label>Username</label>
                                <input
                                    type="text"
                                    className="modern-input"
                                    placeholder="Choose a username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    className="modern-input"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    className="modern-input"
                                    placeholder="Create a password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            {error && (
                                <p className="form-error">{error}</p>
                            )}

                            

                            <button
                                type="submit"
                                className="main-action-btn"
                                style={{ marginTop: "10px" }}
                            >
                                Create Account
                            </button>

                            <div className="google-button">
                                <MuscleUpGoogleLogin
                                    onSuccess={handleGoogleSignup}
                                    onError={() => {
                                        setError("Google signup failed. Please try again.");
                                    }}
                                />
                            </div>
                           

                            <p className="text-center">
                                Already have an account?{" "}
                                <Link to="/login">Log in</Link>
                            </p>

                            <div className="privacy-link-container">
                                <h4 onClick={() => navigate("/privacy")}>
                                    View Privacy Policy
                                </h4>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </>
    );
}
