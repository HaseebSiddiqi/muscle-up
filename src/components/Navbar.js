import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function Navbar() {
    const { user, handleSignOut } = useAuth();

    return (
        <nav className="nav">
            <Link to="/" className="site-brand">
                <span className="brand-text">MUSCLE UP</span>
                <img src="/strong.png" alt="Logo" className="brand-logo" />
            </Link>

            <div className="nav-actions">
                {user ? (
                    <>
                        <span className="nav-welcome">
                            Welcome, {user.username.charAt(0).toUpperCase() + user.username.slice(1)}
                        </span>

                        <button className="nav-btn" onClick={handleSignOut}>
                            Sign Out
                        </button>
                    </>
                ) : (
                    <Link to="/login" className="nav-btn nav-btn-primary">
                        Login
                    </Link>
                )}
            </div>
        </nav>
    );
}