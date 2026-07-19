import { createContext, useContext, useState, useEffect } from "react";
import { signOut } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";
import { fetchAuthSession } from "aws-amplify/auth";
const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();



    const refreshUser = async () => {
        try {
            const session = await fetchAuthSession();

            const payload = session.tokens.idToken.payload;

            console.log(payload);

            setUser({
                username: payload["cognito:username"]
            });

        } catch (err) {
            console.error(err);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };
    const handleSignOut = async () => {
        try {
            await signOut();
            setUser(null);
            navigate('/');
        } catch (err) {
            console.error('Error signing out', err);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, handleSignOut, loading, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}