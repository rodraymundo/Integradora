import './App.css';
import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Login from "./Login";
import Dashboard from "./pages/Dashboard";
import Vehiculos from "./pages/Vehiculos"; // Asegúrate de que esté en la carpeta correcta
import Usuarios from "./pages/Usuarios"; // Crea este componente
import Viajes from "./pages/Viajes"; // Crea este componente
import Alertas from "./pages/Alertas"; // Crea este componente
import Perfil from "./pages/Perfil"; // Crea este componente

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("userSession") ? true : false
  );

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem("userSession");
    setIsLoggedIn(false);
  };

  return (
    <Router>
      <div>
        {isLoggedIn ? (
          <Routes>
            <Route path="/" element={<Dashboard setIsLoggedIn={setIsLoggedIn} />} />
            <Route path="/vehiculos" element={<Vehiculos setIsLoggedIn={setIsLoggedIn} />} />
            <Route path="/usuarios" element={<Usuarios setIsLoggedIn={setIsLoggedIn} />} />
            <Route path="/viajes" element={<Viajes setIsLoggedIn={setIsLoggedIn} />} />
            <Route path="/alertas" element={<Alertas setIsLoggedIn={setIsLoggedIn} />} />
            <Route path="/perfil" element={<Perfil setIsLoggedIn={setIsLoggedIn} />} />
            <Route path="*" element={<Navigate to="/" />} /> {/* Redirige a Dashboard si la ruta no existe */}
          </Routes>
        ) : (
          <Routes>
            <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
            <Route path="*" element={<Navigate to="/login" />} /> {/* Redirige a Login si no está autenticado */}
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;