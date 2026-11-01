import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import Navbar from "../components/Navbar";

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    document.body.classList.add("welcome-page");

    return () => {
      document.body.classList.remove("welcome-page");
    };
  }, []);

  return (
    <div className="welcome-screen">
      <Navbar />

      <main className="welcome-main">
        <section className="welcome-panel" aria-labelledby="welcome-title">
          <img
            className="welcome-app-icon"
            src="/strong-icon.png"
            alt=""
          />
          <p className="welcome-eyebrow">YOUR WORKOUT TRACKER</p>
          <h1 id="welcome-title">Make every workout count.</h1>
          <p className="welcome-description">
            Build your routine, log every session, and see your strength add up.
          </p>

          <div className="welcome-actions">
            {user ? (
              <button
                type="button"
                className="main-action-btn"
                onClick={() => navigate("/home")}
              >
                Open Muscle Up
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="main-action-btn"
                  onClick={() => navigate("/login")}
                >
                  Log in
                </button>
                <button
                  type="button"
                  className="second-action-btn"
                  onClick={() => navigate("/signup")}
                >
                  Create an account
                </button>
              </>
            )}
          </div>

          <ul className="welcome-benefits" aria-label="What you can do">
            <li>Build habits</li>
            <li>Track weight</li>
            <li>Reach your goals</li>
          </ul>
        </section>
      </main>

      <footer className="welcome-footer">
        <button type="button" onClick={() => navigate("/privacy")}>
          Privacy policy
        </button>
      </footer>
    </div>
  );
}
