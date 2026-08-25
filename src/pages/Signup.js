import React, { useState } from "react";
import { signUp } from "aws-amplify/auth";
import { Link } from "react-router-dom";
import VerifyAccount from "../components/VerifyAccount";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
export default function Signup() {
    const navigate = useNavigate();
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

            // After signup, go to login page
            setVerifyAccount(true);
        } catch (err) {
            console.error("Signup error:", err);
            setError(err.message);
        }
    };

    return (
        <>
            <div className="navbar">
                <Navbar />
            </div>
            <div className="card login-card">
                {verifyAccount ? (
                    <VerifyAccount username={username} password={password} onSuccess={() => navigate("/home")} />
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
                                    required />
                            </div>

                            <div className="input-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    className="modern-input"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required />
                            </div>

                            <div className="input-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    className="modern-input"
                                    placeholder="Create a password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required />
                            </div>

                            {error && <p className="form-error">{error}</p>}

                            <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>Create Account</button>

                            <p className="text-center">
                                Already have an account? <Link to="/login">Log in</Link>
                            </p>
                            
                            <div className="privacy-link-container">
                                <h4 onClick={() => navigate("/privacy")}>
                                    View Privacy Policy
                                </h4>
                            </div>
                        </form>
                    </>
                )}
            </div></>
    );
}

