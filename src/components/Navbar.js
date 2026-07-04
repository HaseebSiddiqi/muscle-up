
import { Link } from "react-router-dom"
import { useAuth } from "./AuthContext";
export default function Navbar({username}) {
    const { user } = useAuth();
    const { handleSignOut } = useAuth();
    return (
        <nav className="nav">
            <Link to="/" className="site-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            MUSCLE UP <img src="/strong.png" alt="Logo" style={{ width: "48px", height: "48px" }} />
            </Link>  

                {user ? (<>
                    <p> Welcome {user.username.charAt(0).toUpperCase() + user.username.slice(1)} </p>
                    
                    
                    <button  onClick={handleSignOut}>
                    Sign Out
                </button>

                </>):(
                    <>
                    <button >
                        <Link to="/login">Login</Link>
                    </button>
                    </>

                )}              
                
               
           
    </nav>
    )
}


