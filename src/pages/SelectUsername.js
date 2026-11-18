import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { signIn, confirmSignIn } from 'aws-amplify/auth';
import { useAuth } from '../components/AuthContext';


export default function SelectUsername() {
    const navigate = useNavigate();
    const { refreshUser } = useAuth();
    const location = useLocation();

    const googleCredential = location.state?.googleCredential;

    const [username, setUsername] = useState('');

    const [checking, setChecking] = useState(false);

    const [error, setError] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");


        if (!googleCredential) {
            setError("Google authentication expired. Please sign up again.");
            return;
        }

        try {
            setChecking(true);

            // Step 1: Check username availability
            const checkResponse = await fetch(
                "https://workouttracker-production-4d3e.up.railway.app/auth/google/check-username",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        username: username.trim()
                    })
                }
            );

            const checkData = await checkResponse.json();

            if (!checkResponse.ok) {
                throw new Error(checkData.error || "Unable to check username.");
            }

            if (!checkData.available) {
                setError("That username is already taken.");
                return;
            }

            // Step 2: Create Cognito account and link Google
            const createResponse = await fetch(
                 "https://workouttracker-production-4d3e.up.railway.app/auth/google/create-account",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        credential: googleCredential,
                        username: username.trim()
                    })
                }
            );

            const createData = await createResponse.json();

            if (!createResponse.ok) {
                throw new Error(createData.error || "Unable to create account.");
            }


            sessionStorage.setItem(
                "createDefaultWorkoutsAfterGoogleSignup",
                "true"
            );

            
            const result = await signIn({
                username: username.trim(),
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

   
            const confirmation = await confirmSignIn({
                challengeResponse: googleCredential
            });

            if (!confirmation.isSignedIn) {
                throw new Error("Google authentication was not completed.");
            }

            
            await refreshUser();
            navigate("/home");


        } catch (err) {
            console.error("Google account creation error:", err);
            setError(err.message);
        } finally {
            setChecking(false);
        }
    };

    return (
        <>
            <div className="navbar">
                <Navbar />
            </div>

            <div className="card login-card">
                <h2>Select a Username!</h2>

                <form onSubmit={handleSubmit}>

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

                    {error && <p className="form-error">{error}</p>}

                    <button
                        type="submit"
                        className="main-action-btn"
                        style={{ marginTop: '10px' }}
                        disabled={checking}
                    >
                        {checking ? "Creating account..." : "Continue"}
                    </button>


                </form>

                <div className="privacy-link-container">
                    <h4 onClick={() => navigate("/privacy")}>
                        View Privacy Policy
                    </h4>
                </div>
            </div>
        </>
    );
}