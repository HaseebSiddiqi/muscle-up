import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="landing-container">
      <Navbar />
      <div className="landing">
        <div className="hero">
          <div className="hero-copy fade-up">
            <h1>Keep Track of your Workouts with Muscle Up!</h1>
            <p>
              Create custom workout routines, log your sessions, and visualize your consistency
              all in one place.
            </p>

            {user ? (
              <div className="hero-buttons">
                <button className="hero-btn primary-btn" onClick={() => navigate("/home")}>
                  Go to Dashboard
                </button>
              </div>
            ) : (
              <div className="hero-buttons">
                <button className="hero-btn primary-btn" onClick={() => navigate("/signup")}>
                  Get Started
                </button>

                <button className="hero-btn secondary-btn" onClick={() => navigate("/login")}>
                  Sign In
                </button>
              </div>
            )}
          </div>

          <div className="feature-card fade-up delay-1">
            <div className="image-container">
              <img src="/AddWorkout.png" alt="Workout Types" />
            </div>
            <div className="feature-description">
              <h2>Create Workout Templates</h2>
              <ul>
                <li>Reusable templates for every routine</li>
                <li>Fast setup and cleaner organization</li>
                <li>Less time planning, more time training</li>
              </ul>
            </div>
          </div>

          <div className="feature-card feature-card-right fade-up delay-1">
            <div className="image-container">
              <img src="/AddWorkout.png" alt="Add Workout" />
            </div>
            <div className="feature-description">
              <h2>Log your Workouts</h2>
              <ul>
                <li>Capture sets, reps, weight, and notes fast</li>
                <li>Quick logging with a simple, guided flow</li>
                <li>Previous values help you progress smoothly</li>
              </ul>
            </div>
          </div>

          <div className="feature-card fade-up delay-2">
            <div className="image-container">
              <img src="/ViewWorkouts.png" alt="View Progress" />
            </div>
            <div className="feature-description">
              <h2>Track Your Consistency</h2>
              <ul>
                <li>Review your history in a clean calendar view</li>
                <li>Spot streaks and patterns at a glance</li>
                <li>Inspect each day with full workout detail</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
