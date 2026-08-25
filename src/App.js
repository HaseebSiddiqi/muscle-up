import { Routes, Route } from "react-router-dom";
import Home from './pages/Home'
import NoPage from './pages/NoPage'
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Privacy from "./pages/Privacy";


function App() {
  return (
    <>


      <div>

        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/privacy" element={<Privacy />}/>
          <Route path="*" element={<NoPage />} />
        </Routes>

      </div>
    </>
  );
}

export default App;
