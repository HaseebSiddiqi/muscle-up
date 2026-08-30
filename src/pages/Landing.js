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
              <h1>
                STOP GUESSING, START TRACKING With{" "}
                <span className="text-gradient">Muscle Up</span>
              </h1>

              <p>
                Track your workouts, weight, and progress all in one place. Muscle Up makes
                it easy to see what you’ve done, stay consistent, and know what to aim for
                next.
              </p>


              {user ? (
                <div className="hero-buttons">
                  <button
                    className="hero-btn primary-btn"
                    onClick={() => navigate("/home")}
                  >
                    Go to Dashboard
                  </button>
                </div>
              ) : (
                <div className="hero-buttons">
                  <button
                    className="hero-btn primary-btn"
                    onClick={() => navigate("/signup")}
                  >
                    Get Started For Free
                  </button>

                  <button
                    className="hero-btn secondary-btn"
                    onClick={() => navigate("/login")}
                  >
                    Sign In
                  </button>
                </div>
              )}

              <div className="privacy-link-container">
                <h4 onClick={() => navigate("/privacy")}>
                  View Privacy Policy
                </h4>
              </div>
            </div>
          </div>

          <div className="features-section">

            <div className="feature-card scroll-animate slide-in-left">
              <div className="image-container">
                <img src="/WorkoutTypes.png" alt="Workout Types" />
              </div>

              <div className="feature-description">
                <h2>Build Your Plan</h2>

                <ul>
                  <li>
                    <span className="check-icon">✓</span>
                    <span>Create your routines once</span>
                  </li>

                  <li>
                    <span className="check-icon">✓</span>
                    <span>Keep every workout organized</span>
                  </li>

                  <li>
                    <span className="check-icon">✓</span>
                    <span>Start training without the planning</span>
                  </li>
                </ul>
              </div>
            </div>


            <div className="feature-card feature-card-right scroll-animate slide-in-right">
              <div className="image-container">
                <img src="/AddWorkout.png" alt="Add Workout" />
              </div>

              <div className="feature-description">
                <h2>Train With Purpose</h2>

                <ul>
                  <li>
                    <span className="check-icon">✓</span>
                    <span>Log your sets as you train</span>
                  </li>

                  <li>
                    <span className="check-icon">✓</span>
                    <span>See what you did in your last workout</span>
                  </li>

                  <li>
                    <span className="check-icon">✓</span>
                    <span>Set your next goal using your past results</span>
                  </li>

                  <li>
                    <span className="check-icon">✓</span>
                    <span>Take the guesswork out of progressive overload</span>
                  </li>
                </ul>
              </div>


            </div>


            <div className="feature-card scroll-animate slide-in-left">
              <div className="image-container">
                <img src="/ViewWorkouts.png" alt="View Progress" />
              </div>

              <div className="feature-description">
                <h2>Stay Consistent</h2>

                <ul>
                  
                  <li>
                    <span className="check-icon">✓</span>
                    <span>See how often you actually train</span>
                  </li>

                  <li>
                    <span className="check-icon">✓</span>
                    <span>Plan your next workout</span>
                  </li>

                  <li>
                    <span className="check-icon">✓</span>
                    <span>Check your progress at any time</span>
                  </li>

                  <li>
                    <span className="check-icon">✓</span>
                    <span>Customize your calendar</span>
                  </li>
                </ul>
              </div>
            </div>


            <div className="feature-card feature-card-right scroll-animate slide-in-right">
              <div className="image-container">
                <img
                  src="/MetricsDashboard.png"
                  alt="Metrics Dashboard"
                />
              </div>

              <div className="feature-description">
                <h2>Know Your Training</h2>

                <ul>
                  <li>
                    <span className="check-icon">✓</span>
                    <span>Monitor your consistency streak</span>
                  </li>

                  <li>
                    <span className="check-icon">✓</span>
                    <span>See how your training is distributed</span>
                  </li>

                  <li>
                    <span className="check-icon">✓</span>
                    <span>Track your weekly and monthly consistency</span>
                  </li>

                  <li>
                    <span className="check-icon">✓</span>
                    <span>Use your stats to set goals and track your progress towards them</span>
                  </li>
                </ul>
              </div>
            </div>


            <div className="feature-card scroll-animate slide-in-left">
              <div className="image-container">
                <img
                  src="/weightTracker.png"
                  alt="Weight Tracker"
                />
              </div>

              <div className="feature-description">
                <h2>Adjust With Real Data</h2>

                <ul>
                  <li>
                    <span className="check-icon">✓</span>
                    <span>Track how your weight changes</span>
                  </li>

                  <li>
                    <span className="check-icon">✓</span>
                    <span>See trends over time</span>
                  </li>

                  <li>
                    <span className="check-icon">✓</span>
                    <span>Know when your plan needs to change</span>
                  </li>

                  <li>
                    <span className="check-icon">✓</span>
                    <span>Make smarter decisions using your data</span>
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