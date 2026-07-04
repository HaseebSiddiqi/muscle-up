import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { useEffect } from "react";

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            // Optional: stop observing once animated
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -60px 0px",
      }
    );

    const animatedElements = document.querySelectorAll(".scroll-animate");
    animatedElements.forEach((el) => observer.observe(el));

    return () => {
      animatedElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="landing-container">
      <Navbar />
      
      <div className="landing">
        <div className="hero">
          <div className="hero-copy-wrapper fade-up"> 
            <div className="hero-copy">
              <h1>Keep Track of your Workouts with <span className="text-gradient">Muscle Up</span></h1>
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
                    Get Started Free
                  </button>

                  <button className="hero-btn secondary-btn" onClick={() => navigate("/login")}>
                    Sign In
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="features-section">
            <div className="feature-card scroll-animate slide-in-left">
              <div className="image-container">
                <img src="/WorkoutTypes.png" alt="Workout Types" />
              </div>
              <div className="feature-description">
                <h2>Create Workout Templates</h2>
                <ul>
                  <li>
                    <span className="check-icon">✓</span>
                    <span>Build custom templates for your workout routines</span>
                  </li>
                  <li>
                    <span className="check-icon">✓</span>
                    <span>Quickly build and manage workouts</span>
                  </li>
                  <li>
                    <span className="check-icon">✓</span>
                    <span>Spend Less time planning, more time training</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="feature-card feature-card-right scroll-animate slide-in-right">
              <div className="image-container">
                <img src="/AddWorkout.png" alt="Add Workout" />
              </div>
              <div className="feature-description">
                <h2>Log your Workouts</h2>
                <ul>
                  <li>
                    <span className="check-icon">✓</span>
                    <span>Track sets, reps, weight, and notes</span>
                  </li>
                  <li>
                    <span className="check-icon">✓</span>
                    <span>Log workouts in seconds</span>
                  </li>
                  <li>
                    <span className="check-icon">✓</span>
                    <span>Use past workouts to drive progressive overload</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="feature-card scroll-animate slide-in-left">
              <div className="image-container">
                <img src="/ViewWorkouts.png" alt="View Progress" />
              </div>
              <div className="feature-description">
                <h2>Track Your Consistency</h2>
                <ul>
                  <li>
                    <span className="check-icon">✓</span>
                    <span>See your training history in a calendar view</span>
                  </li>
                  <li>
                    <span className="check-icon">✓</span>
                    <span>Spot streaks and patterns at a glance</span>
                  </li>
                  <li>
                    <span className="check-icon">✓</span>
                    <span>Tap any day to see full workout details</span>
                  </li>
                  <li>
                    <span className="check-icon">✓</span>
                    <span>Cloud sync keeps your workouts available on any device</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
