
import { useState } from "react";
import { Capacitor } from "@capacitor/core";
import { SocialLogin } from "@capgo/capacitor-social-login";
import { GoogleLogin } from "@react-oauth/google";

const GOOGLE_CLIENT_ID =
    "331810302639-38t5brk0if3qf703vl71971cutseahcg.apps.googleusercontent.com";

let initializationPromise = null;

function initializeNativeGoogle() {
    if (!initializationPromise) {
        initializationPromise = SocialLogin.initialize({
            google: {
                webClientId: GOOGLE_CLIENT_ID
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

    const isNative = Capacitor.isNativePlatform();

    const handleNativeLogin = async () => {
        if (loading) return;

        setLoading(true);

        try {
            await initializeNativeGoogle();

            const result = await SocialLogin.login({
                provider: "google"
            });

            const credential = result.result?.idToken;

            if (!credential) {
                throw new Error("Google did not return an ID token.");
            }

            await onSuccess(credential);

        } catch (error) {
            console.error("Native Google login error:", error);
            onError?.(error);
        } finally {
            setLoading(false);
        }
    };

   if (isNative) {
        return (
           
            <button
                type="button"
                className="gsi-material-button"
                onClick={handleNativeLogin}
                disabled={loading}
            >
                <img
                    src="/google-logo.svg"
                    alt=""
                    style={{
                        width: "46px",
                        height: "46px",
                        objectFit: "contain",
                        flexShrink: 0
                    }}
                />

                <span>
                    {loading ? "Signing in..." : "Continue with Google"}
                </span>
            </button>

        );
    }

    return (
        <GoogleLogin
            onSuccess={response => {
                if (response.credential) {
                    onSuccess(response.credential);
                } else {
                    onError?.(new Error("Missing Google credential."));
                }
            }}
            onError={() => {
                onError?.(new Error("Google login failed."));
            }}
            size="large"
            shape="pill"
            text="continue_with"
        />
    );
}
