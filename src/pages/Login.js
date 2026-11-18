
import { useState, useEffect } from 'react';

import { signIn, confirmSignIn, getCurrentUser } from 'aws-amplify/auth';
import { useNavigate, Link } from 'react-router-dom';
import ResetPassword from '../components/ResetPassword';
import VerifyAccount from '../components/VerifyAccount';
import { useAuth } from "../components/AuthContext";
import Navbar from '../components/Navbar';

import MuscleUpGoogleLogin from "../components/MuscleUpGoogleLogin";

export default function Login() {
    const navigate = useNavigate();
    const { refreshUser } = useAuth();

    useEffect(() => {
        const checkUser = async () => {
            try {
                await getCurrentUser();
                navigate('/home');
            } catch {
                // Not logged in
            }
        };

        checkUser();
    }, [navigate]);

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const [showVerify, setShowVerify] = useState(false);
    const [resetPassword, setResetPassword] = useState(false);

   
    const handleGoogleLogin = async (credential) => {
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
                throw new Error(data.error || "Google login failed.");
            }

            if (data.accountExists === false) {
                navigate("/select-username", {
                    state: {
                        googleCredential: credential
                    }
                });
                return;
            }

            if (!data.username) {
                throw new Error("Cognito username was not returned.");
            }

            // Start custom authentication with Cognito
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

            // Verify the original Google credential through Lambda
            const confirmation = await confirmSignIn({
                challengeResponse: credential
            });

            if (!confirmation.isSignedIn) {
                throw new Error("Google authentication was not completed.");
            }

            await refreshUser();
            navigate("/home");

        } catch (err) {
            console.error("Google login error:", err);
            setError(err.message || "Google login failed. Please try again.");
        }
    };


    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const res = await signIn({
                username,
                password
            });

            console.log("SIGNIN RESPONSE:", res);

            if (res?.nextStep?.signInStep === "CONFIRM_SIGN_UP") {
                setResetPassword(false);
                setError('');
                setShowVerify(true);
                return;
            }

            await refreshUser();
            navigate('/home');

        } catch (err) {
            console.log("FULL COGNITO ERROR:", err);
            console.log("NAME:", err?.name);
            console.log("CODE:", err?.code);
            console.log("MESSAGE:", err?.message);

            const message = err?.message?.toLowerCase?.() || '';

            const isUnconfirmed =
                err?.name === "UserNotConfirmedException" ||
                err?.code === "UserNotConfirmedException" ||
                message.includes("not confirmed") ||
                message.includes("confirmation");

            if (isUnconfirmed) {
                setError('');
                setResetPassword(false);
                setShowVerify(true);
                return;
            }

            setError(err?.message || "Login failed");
        }
    };

    return (
        <>
            <div className="navbar">
                <Navbar />
            </div>

            <div className="card login-card">

                {showVerify ? (
                    <VerifyAccount
                        username={username}
                        password={password}
                        onSuccess={async () => {
                            await refreshUser();
                            navigate("/home");
                        }}
                        onBack={() => setShowVerify(false)}
                    />

                ) : resetPassword ? (
                    <ResetPassword
                        onBack={() => setResetPassword(false)}
                    />

                ) : (
                    <>
                        <h2>Log In To Muscle Up!</h2>

                        <form onSubmit={handleLogin}>

                            <div className="input-group">
                                <label>Username</label>
                                <input
                                    type="text"
                                    className="modern-input"
                                    value={username}
                                    placeholder="Enter your username"
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    className="modern-input"
                                    value={password}
                                    placeholder="Enter your password"
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            {error && (
                                <p className="form-error">
                                    {error}
                                </p>
                            )}

                           

                            <button
                                type="submit"
                                className="main-action-btn"
                                style={{ marginTop: '10px' }}
                            >
                                Sign In
                            </button>
                            
                            <div className="google-button">
                                <MuscleUpGoogleLogin
                                    onSuccess={handleGoogleLogin}
                                    onError={() => {
                                        setError("Google login failed. Please try again.");
                                    }}
                                />
                            </div>
                            <div style={{ marginTop: '15px' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    style={{
                                        backgroundColor: 'transparent',
                                        color: '#64748b',
                                        boxShadow: 'none'
                                    }}
                                    onClick={() => setResetPassword(true)}
                                >
                                    Forgot Password?
                                </button>
                            </div>

                            <p className="text-center">
                                Don't have an account? <Link to="/signup">Sign up</Link>
                            </p>

                        </form>
                    </>
                )}

                <div className="privacy-link-container">
                    <h4 onClick={() => navigate("/privacy")}>
                        View Privacy Policy
                    </h4>
                </div>

                <div style={{
                    fontSize: "10px",
                    opacity: 0.5,
                    textAlign: "center",
                }}>
                    <a
                        href="https://www.flaticon.com/free-icons/muscle"
                        title="muscle icons"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: "none" }}
                    >
                        Muscle icons created by Magnific - Flaticon
                    </a>
                </div>
            </div>
        </>
    );
}
