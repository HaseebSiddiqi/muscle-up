import { createContext, useContext, useState, useEffect } from "react";
import { signOut } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "aws-amplify/auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const refreshUser = async () => {
        try {
            const currentUser = await getCurrentUser();
            setUser({ username: currentUser.username });
        } catch {
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