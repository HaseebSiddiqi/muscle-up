
import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { SocialLogin } from "@capgo/capacitor-social-login";

const GOOGLE_CLIENT_ID =
    "331810302639-38t5brk0if3qf703vl71971cutseahcg.apps.googleusercontent.com";

let initializationPromise = null;

function initializeGoogle() {
    if (!initializationPromise) {
        initializationPromise = SocialLogin.initialize({
            google: {
                webClientId: GOOGLE_CLIENT_ID,
                ...(!Capacitor.isNativePlatform() && {
                    redirectUrl: `${window.location.origin}/login`
                })
            }
        }).catch(error => {
            initializationPromise = null;
            throw error;
        });
    }

    return initializationPromise;
}

export default function MuscleUpGoogleLogin({
    onSuccess,
    onError
}) {
    const [loading, setLoading] = useState(false);

    // Initialize on web so the Google popup redirect can be handled.
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) {
            initializeGoogle().catch(error => {
                console.error("Google initialization error:", error);
            });
        }
    }, []);

    const handleGoogleLogin = async () => {
        if (loading) return;

        setLoading(true);

        try {
            await initializeGoogle();

            const result = await SocialLogin.login({
                provider: "google",
                options: {}
            });

            const credential = result.result?.idToken;

            if (!credential) {
                throw new Error("Google did not return an ID token.");
            }

            await onSuccess(credential);
        } catch (error) {
            console.error("Google login error:", error);
            onError?.(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            type="button"
            className="gsi-material-button"
            onClick={handleGoogleLogin}
            disabled={loading}
        >
            <img
                src="/google-logo.svg"
                alt=""
                className="google-logo"
            />

            <span>
                {loading ? "Signing in..." : "Continue with Google"}
            </span>
        </button>
    );
}
