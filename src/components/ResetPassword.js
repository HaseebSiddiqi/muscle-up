import React, { useState } from 'react';
import { resetPassword, confirmResetPassword } from 'aws-amplify/auth';

export default function ResetPassword({ onBack }) {
    const [email, setEmail] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');

    const handleSendCode = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await resetPassword({ username: email });
            setCodeSent(true);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await confirmResetPassword({
                username: email,
                confirmationCode: code,
                newPassword: newPassword
            });

            onBack(); // return to login after success
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div >
            <h2 style={{ marginBottom: '20px' }}>Reset Password</h2>

            {!codeSent ? (
                <form onSubmit={handleSendCode}>
                    <div className="input-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            className="modern-input"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    {error && <p className='form-error'>{error}</p>}

                    <button type="submit" className="main-action-btn" style={{ marginTop: '10px' }}>
                        Send Reset Code
                    </button>

                    <div style={{ marginTop: '15px' }}>
                        <button type="button" className="btn btn-secondary" style={{ backgroundColor: 'transparent', color: '#64748b', boxShadow: 'none' }} onClick={onBack}>
                            Back to Login
                        </button>
                    </div>
                </form>
            ) : (
                <form onSubmit={handleResetPassword}>
                    <div className="input-group">
                        <label>Confirmation Code</label>
                        <input
                            type="text"
                            className="modern-input"
                            placeholder="Enter code from email"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>New Password</label>
                        <input
                            type="password"
                            className="modern-input"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <p className='form-error'>{error}</p>}

                    <button type="submit" className="main-action-btn" style={{ marginTop: '10px' }}>
                        Reset Password
                    </button>

                    <div style={{ marginTop: '15px' }}>
                        <button type="button" className="btn btn-secondary" style={{ backgroundColor: 'transparent', color: '#64748b', boxShadow: 'none' }} onClick={onBack}>
                            Back to Login
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}