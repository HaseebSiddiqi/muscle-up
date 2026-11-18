import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { AuthProvider } from "./components/AuthContext";
import { UnitProvider } from './contexts/unitContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
Amplify.configure({
    Auth: {
        Cognito: {
            userPoolId: process.env.REACT_APP_USER_POOL_ID,
            userPoolClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID,

            loginWith: {
                oauth: {
                    domain: "us-east-1cozdlkowm.auth.us-east-1.amazoncognito.com",
                    scopes: ["openid", "email", "profile"],
                    redirectSignIn: ["http://localhost:3000/"],
                    redirectSignOut: ["http://localhost:3000/"],
                    responseType: "code"
                }
            }
        }
    }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(

  <React.StrictMode>
    <GoogleOAuthProvider clientId="331810302639-38t5brk0if3qf703vl71971cutseahcg.apps.googleusercontent.com">
      <BrowserRouter>
        <AuthProvider>
          <UnitProvider>
            <App />
          </UnitProvider>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>

);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register({
  onUpdate: registration => {
    const waitingServiceWorker = registration.waiting;
    if (waitingServiceWorker) {
      waitingServiceWorker.addEventListener("statechange", event => {
        if (event.target.state === "activated") {
          window.location.reload();
        }
      });
      waitingServiceWorker.postMessage({ type: "SKIP_WAITING" });
    }
  }
});
