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
                    <div className="hero-copy-wrapper fade-up"> 
                    <div className="hero-copy">
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
                    </div>

                    <div className="feature-card">
                        <div className="image-container">
                        <img src="/WorkoutTypes.png" alt="Workout Types" />
                        </div>
                        <div className="feature-description">
                        <h2>Create Workout Templates</h2>
                        <ul>
                            <li>Build custom templates for your workout routines</li>
                            <li>Quickly build and manage workouts</li>
                            <li>Spend Less time planning, more time training</li>
                        </ul>
                        </div>
                    </div>

                    <div className="feature-card feature-card-right">
                        <div className="image-container">
                        <img src="/AddWorkout.png" alt="Add Workout" />
                        </div>
                        <div className="feature-description">
                        <h2>Log your Workouts</h2>
                        <ul>
                            <li>Track sets, reps, weight, and notes</li>
                            <li>Log workouts in seconds</li>
                            <li>Use past workouts to drive progressive overload</li>
                        </ul>
                        </div>
                    </div>

                    <div className="feature-card">
                        <div className="image-container">
                        <img src="/ViewWorkouts.png" alt="View Progress" />
                        </div>
                        <div className="feature-description">
                        <h2>Track Your Consistency</h2>
                        <ul>
                            <li>See your training history in a calendar view</li>
                            <li>Spot streaks and patterns at a glance</li>
                            <li>Tap any day to see full workout details</li>
                            <li>Cloud sync keeps your workouts available on any device</li>
                        </ul>
                        </div>
                    </div>
                </div>
            </div>
     
    </div>
  );
}
