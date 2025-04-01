import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";

const REACT_APP_API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

console.log(process.env.REACT_APP_API_URL);

function Login({ setIsLoggedIn }) {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const validate = () => {
    const newError = {};
    if (!formData.username.trim()) newError.username = "El usuario es requerido";
    if (!formData.password.trim()) newError.password = "La contraseña es requerida";
    return newError;
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const existingSession = localStorage.getItem("userSession");
    if (existingSession) {
      Swal.fire({
        icon: "warning",
        title: "Sesión Activa",
        text: "Ya existe una sesión activa. Por favor, cierra la otra sesión antes de continuar.",
        confirmButtonText: "Aceptar",
      });
      return;
    }

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const response = await fetch(`${REACT_APP_API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correo: formData.username,
          contrasena: formData.password,
        }),
        credentials: "include",
      });

      const data = await response.json();
      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "¡Bienvenido!",
          text: "Inicio de sesión exitoso.",
          timer: 2000, // Aumentamos el tiempo para que sea más visible
          showConfirmButton: false,
        }).then(() => {
          localStorage.setItem("userSession", JSON.stringify(data));
          setIsLoggedIn(true);
          navigate("/");
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.message || "Usuario y/o contraseña incorrectos.",
          confirmButtonText: "Intentar de nuevo",
        });
        setErrors({
          username: "",
          password: data.message || "Usuario y/o contraseña incorrectos.",
        });
      }
    } catch (error) {
      console.error("Error de red:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al intentar iniciar sesión. Por favor, verifica tu conexión.",
        confirmButtonText: "Aceptar",
      });
      setErrors({ username: "", password: "Error al intentar iniciar sesión." });
    }
  };

  const handleGoogleLogin = () => {
    console.log("Iniciando autenticación con Google...");
    window.location.href = `${REACT_APP_API_URL}/auth/google`;
  };

  useEffect(() => {
    console.log("useEffect ejecutado en Login.js");
    console.log("location.search:", location.search);
    const urlParams = new URLSearchParams(location.search);
    const user = urlParams.get("user");
    const error = urlParams.get("error");

    if (error) {
      console.log("Error recibido desde Google:", decodeURIComponent(error));
      Swal.fire({
        icon: "error",
        title: "Error",
        text: decodeURIComponent(error),
        confirmButtonText: "Aceptar",
      });
      navigate("/login", { replace: true });
      return;
    }

    if (user && !localStorage.getItem("userSession")) {
      try {
        const userData = JSON.parse(decodeURIComponent(user));
        console.log("Usuario recibido desde Google:", userData);
        Swal.fire({
          icon: "success",
          title: "¡Bienvenido!",
          text: "Inicio de sesión con Google exitoso.",
          timer: 2000, // Aumentamos el tiempo para que sea más visible
          showConfirmButton: false,
        }).then(() => {
          localStorage.setItem("userSession", JSON.stringify(userData));
          setIsLoggedIn(true);
          console.log("isLoggedIn establecido a true, redirigiendo a /");
          navigate("/", { replace: true });
        });
      } catch (error) {
        console.error("Error al parsear datos de usuario:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Error al procesar los datos de Google. Por favor, intenta de nuevo.",
          confirmButtonText: "Aceptar",
        });
        navigate("/login", { replace: true });
      }
    } else {
      console.log("No se encontró parámetro 'user' ni 'error' en la URL o ya existe una sesión");
    }
  }, [setIsLoggedIn, navigate, location.search]);

  return (
    <div style={{ maxWidth: "350px", margin: "0 auto", padding: "20px", textAlign: "center" }}>
      <form onSubmit={handleLogin}>
        <img src="logo_ruta_segura.png" alt="Logo de la empresa" style={{ width: "320px", marginTop: "80px", marginBottom: "30px" }} />
        <div style={{ marginBottom: "15px" }}>
          <input
            type="text"
            name="username"
            placeholder="Correo electrónico"
            value={formData.username}
            onChange={handleChange}
            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box", marginBottom: "5px" }}
          />
          {errors.username && <p style={{ color: "red" }}>{errors.username}</p>}
        </div>
        <div style={{ marginBottom: "15px" }}>
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={formData.password}
            onChange={handleChange}
            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box", marginBottom: "5px" }}
          />
          {errors.password && <p style={{ color: "red" }}>{errors.password}</p>}
        </div>
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#007bff",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "16px",
            transition: "background-color 0.3s ease",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#0056b3")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#007bff")}
        >
          Ingresar
        </button>
      </form>

      <div style={{ marginTop: "20px" }}>
        <button
          onClick={handleGoogleLogin}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            padding: "12px",
            backgroundColor: "#ffffff",
            color: "#4285f4",
            border: "1px solid #dadce0",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "16px",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            transition: "box-shadow 0.3s ease, background-color 0.3s ease",
            gap: "10px",
          }}
          onMouseOver={(e) => {
            e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
            e.target.style.backgroundColor = "#f8f9fa";
          }}
          onMouseOut={(e) => {
            e.target.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
            e.target.style.backgroundColor = "#ffffff";
          }}
        >
          <svg
            width="18"
            height="18"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
            <path fill="none" d="M0 0h48v48H0z" />
          </svg>
          Iniciar sesión con Google
        </button>
      </div>
    </div>
  );
}

export default Login;