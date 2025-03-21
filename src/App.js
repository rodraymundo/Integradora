import './App.css';
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from "react-router-dom";
import Login from "./Login";
import Dashboard from "./pages/Dashboard";
import Vehiculos from "./pages/Vehiculos";
import Usuarios from "./pages/Usuarios";
import Viajes from "./pages/Viajes";
import Alertas from "./pages/Alertas";
import Perfil from "./pages/Perfil";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const session = localStorage.getItem("userSession");
    console.log("Estado inicial de isLoggedIn:", !!session);
    return !!session;
  });

  // Escuchar cambios en localStorage y actualizar isLoggedIn
  useEffect(() => {
    const handleStorageChange = () => {
      const session = localStorage.getItem("userSession");
      console.log("localStorage cambiado, sesión:", session);
      setIsLoggedIn(!!session);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLogout = () => {
    console.log("Cerrando sesión...");
    localStorage.removeItem("userSession");
    setIsLoggedIn(false);
  };

  // Componente wrapper para manejar la redirección inicial
  const AuthWrapper = () => {
    const location = useLocation();
    useEffect(() => {
      console.log("AuthWrapper ejecutado, location.search:", location.search);
      const urlParams = new URLSearchParams(location.search);
      const user = urlParams.get("user");
    
      if (user) {
        try {
          const userData = JSON.parse(decodeURIComponent(user));
          console.log("Usuario recibido en AuthWrapper:", userData);
          localStorage.setItem("userSession", JSON.stringify(userData));
          setIsLoggedIn(true);
          
          // ⚠️ Recarga la página para asegurar la redirección inmediata
          window.location.replace("/");
        } catch (error) {
          console.error("Error al parsear datos de usuario en AuthWrapper:", error);
        }
      }
    }, [location.search]);    

    return (
      <Routes>
        <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
        {isLoggedIn ? (
          <>
            <Route path="/" element={<Dashboard setIsLoggedIn={setIsLoggedIn} handleLogout={handleLogout} />} />
            <Route path="/vehiculos" element={<Vehiculos setIsLoggedIn={setIsLoggedIn} />} />
            <Route path="/usuarios" element={<Usuarios setIsLoggedIn={setIsLoggedIn} />} />
            <Route path="/viajes" element={<Viajes setIsLoggedIn={setIsLoggedIn} />} />
            <Route path="/alertas" element={<Alertas setIsLoggedIn={setIsLoggedIn} />} />
            <Route path="/perfil" element={<Perfil setIsLoggedIn={setIsLoggedIn} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    );
  };

  return (
    <Router>
      <div>
        <AuthWrapper />
      </div>
    </Router>
  );
}

export default App;