import React, { useState } from 'react';
import { confirmSignUp } from 'aws-amplify/auth';
import { useNavigate } from "react-router-dom";
import { signIn } from 'aws-amplify/auth';
import { useAuth } from './AuthContext';

export default function VerifyAccount({ username, password, onSuccess, onBack }) {

    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { setUser } = useAuth();
    const handleVerify = async (e) => {
        e.preventDefault();
        setError("");

        try {
            await confirmSignUp({
                username,
                confirmationCode: code
            });
            alert("Account verified successfully")

            await signIn({ username, password });
            setUser({ username });

            onSuccess?.();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div>
            <h2>Verify Account</h2>

            <form onSubmit={handleVerify}>
                <input className="modern-input" type="text" placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} required />
                {error && <p className="form-error">{error}</p>}
                <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>Verify</button>
                <button type="button" className="btn btn-secondary" style={{ marginTop: '10px', backgroundColor: 'transparent', color: '#64748b', boxShadow: 'none' }} onClick={() => { onBack?.(); navigate("/login"); }}>Back to Login</button>
            </form>




        </div>
    );
}