import React, { useState } from "react";

function Login({ setIsLoggedIn }) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState({});

  // Manejar cambios en los inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  // Validar datos del formulario
  const validate = () => {
    const newError = {};

    if (!formData.username.trim()) {
      newError.username = "El usuario es requerido";
    }

    if (!formData.password.trim()) {
      newError.password = "La contraseña es requerida";
    }

    return newError;
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const existingSession = localStorage.getItem("userSession");
    if (existingSession) {
      alert("Ya existe una sesión activa. Por favor, cierra la otra sesión antes de continuar.");
      return;
    }

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Realizar la solicitud POST para autenticar al usuario
    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          correo: formData.username,
          contrasena: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Autenticación exitosa
        localStorage.setItem("userSession", JSON.stringify(data)); // Almacenar datos de sesión
        setIsLoggedIn(true);
      } else {
        setErrors({
          username: "",
          password: data.error || "Usuario y/o contraseña incorrectos.",
        });
      }
    } catch (error) {
      console.error("Error de red:", error);
      setErrors({
        username: "",
        password: "Error al intentar iniciar sesión.",
      });
    }
  };

  return (
    <form
      onSubmit={handleLogin}
      style={{
        maxWidth: "350px",
        margin: "0 auto",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <img
        src="logo_ruta_segura.png"
        alt="Logo de la empresa"
        style={{
          width: "320px",
          marginTop: "80px",
          marginBottom: "30px",
        }}
      />

      <h2 
        style={{
          fontSize: "45px", 
          color: "black", 
          marginBottom: "20px" }}>
        Bienvenido
      </h2>
      <div style={{ marginBottom: "15px" }}>
        <input
          type="text"
          name="username"
          placeholder="Correo electrónico"
          value={formData.username}
          onChange={handleChange}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            boxSizing: "border-box",
            marginBottom: "5px",
          }}
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
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            boxSizing: "border-box",
            marginBottom: "5px",
          }}
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
        }}
      >
        Ingresar
      </button>
      <div style={{ marginTop: "20px" }}>
        <img
          src="google-icon.png"
          alt="Google"
          style={{
            width: "36px",
            marginRight: "10px",
            cursor: "pointer",
            verticalAlign: "middle",
          }}
        />
        <img
          src="facebook-icon.png"
          alt="Facebook"
          style={{
            width: "36px",
            cursor: "pointer",
            verticalAlign: "middle",
          }}
        />
      </div>
    </form>
  );
}

export default Login;
