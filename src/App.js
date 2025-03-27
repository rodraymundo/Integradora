import './App.css';
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { LoadScript } from "@react-google-maps/api";
import Login from "./Login";
import Dashboard from "./pages/Dashboard";
import Vehiculos from "./pages/Vehiculos";
import Usuarios from "./pages/Usuarios";
import Viajes from "./pages/Viajes";
import Alertas from "./pages/Alertas";
import Perfil from "./pages/Perfil";

// Define las bibliotecas como una constante estática
const LIBRARIES = ["places"];

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const session = localStorage.getItem("userSession");
    console.log("Estado inicial de isLoggedIn:", !!session);
    return !!session;
  });
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(null);

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
            <Route
              path="/"
              element={<Dashboard setIsLoggedIn={setIsLoggedIn} handleLogout={handleLogout} isGoogleMapsLoaded={isGoogleMapsLoaded} />}
            />
            <Route
              path="/vehiculos"
              element={<Vehiculos setIsLoggedIn={setIsLoggedIn} isGoogleMapsLoaded={isGoogleMapsLoaded} />}
            />
            <Route
              path="/usuarios"
              element={<Usuarios setIsLoggedIn={setIsLoggedIn} />}
            />
            <Route
              path="/viajes"
              element={<Viajes setIsLoggedIn={setIsLoggedIn} isGoogleMapsLoaded={isGoogleMapsLoaded} />}
            />
            <Route
              path="/alertas"
              element={<Alertas setIsLoggedIn={setIsLoggedIn} isGoogleMapsLoaded={isGoogleMapsLoaded} />}
            />
            <Route
              path="/perfil"
              element={<Perfil setIsLoggedIn={setIsLoggedIn} />}
            />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    );
  };

  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "AIzaSyC7IIRa4kxYY3Yiq1PD64XHDt1fl_f_kDc"; // Fallback por si no está en .env
  console.log("Clave API:", apiKey);

  if (!apiKey) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h1>Error</h1>
        <p>Configura la variable de entorno <code>REACT_APP_GOOGLE_MAPS_API_KEY</code> en el archivo <code>.env</code>.</p>
      </div>
    );
  }

  return (
    <LoadScript
      googleMapsApiKey={apiKey}
      libraries={LIBRARIES}
      onLoad={() => {
        console.log("Google Maps API cargada");
        setIsGoogleMapsLoaded(true);
      }}
      onError={(error) => {
        console.error("Error al cargar Google Maps API:", error);
        setIsGoogleMapsLoaded(false);
        setApiKeyError("Error al cargar la API de Google Maps. Verifica tu clave API.");
      }}
    >
      {apiKeyError ? (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <h1>Error</h1>
          <p>{apiKeyError}</p>
        </div>
      ) : (
        <Router>
          <div>
            <AuthWrapper />
          </div>
        </Router>
      )}
    </LoadScript>
  );
}

export default App;