import { useState, useEffect } from 'react';
import { signIn } from 'aws-amplify/auth';
import { useNavigate } from 'react-router-dom';
import { Link } from "react-router-dom";
import ResetPassword from '../components/ResetPassword';
import { getCurrentUser } from 'aws-amplify/auth';
import VerifyAccount from '../components/VerifyAccount';
import { useAuth } from "../components/AuthContext";
import Navbar from '../components/Navbar';

export default function Login() {
    const navigate = useNavigate();
    const { setUser } = useAuth();
    useEffect(() => {
        const checkUser = async () => {
            try {
                await getCurrentUser();
                navigate('/home'); // already logged in
            } catch {
                // not logged in → stay on login page
            }
        };

        checkUser();
    }, [navigate]);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const [showVerify, setShowVerify] = useState(false);

    const [resetPassword, setResetPassword] = useState(false);
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const res = await signIn({ username, password });

            console.log("SIGNIN RESPONSE:", res);

            // Amplify v6 flow check (IMPORTANT)
            if (res?.nextStep?.signInStep === "CONFIRM_SIGN_UP") {
                setResetPassword(false);
                setError('');
                setShowVerify(true);
                return;
            }
            setUser({ username });
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
                    <VerifyAccount username={username} password={password} onSuccess={() => navigate("/home")} onBack={() => setShowVerify(false)} />
                ) : resetPassword ? (
                    <ResetPassword onBack={() => setResetPassword(false)} />
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
                                    required />
                            </div>

                            <div className="input-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    className="modern-input"
                                    value={password}
                                    placeholder="Enter your password"
                                    onChange={(e) => setPassword(e.target.value)}
                                    required />
                            </div>

                            {error && <p className="form-error">{error}</p>}

                            <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>Sign In</button>

                            <div style={{ marginTop: '15px' }}>
                                <button type="button" className="btn btn-secondary" style={{ backgroundColor: 'transparent', color: '#64748b', boxShadow: 'none' }} onClick={() => setResetPassword(true)}>Forgot Password?</button>
                            </div>

                            <p className="text-center">
                                Don't have an account? <Link to="/signup">Sign up</Link>
                            </p>
                        </form>
                    </>
                )}
                <div style={{ fontSize: "10px", opacity: 0.5, textAlign: "center" }}>
                    Icon by Freepik (Flaticon)
                </div>
            </div></>
    )
}


