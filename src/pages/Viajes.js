import React, { useState, useEffect } from "react";
import Header from "../Header";
import Swal from "sweetalert2";
import "bootstrap/dist/css/bootstrap.min.css";

function Viajes({ setIsLoggedIn }) {
  const handleLogout = () => {
    localStorage.removeItem("userSession");
    setIsLoggedIn(false);
  };

  const [cargas, setCargas] = useState([]);
  const [viajes, setViajes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [selectedCarga, setSelectedCarga] = useState(null);
  const [selectedViaje, setSelectedViaje] = useState(null);
  const [newCarga, setNewCarga] = useState({
    cliente: "",
    peso: "",
    volumen: "",
    descripcion: "",
    tipo_carga: "",
    fecha_entrega: "",
  });
  const [newViaje, setNewViaje] = useState({
    origen_latitud: "",
    origen_longitud: "",
    destino_latitud: "",
    destino_longitud: "",
  });

  const tiposCarga = ["carga seca", "refrigerada", "plataforma", "cama baja"];

  useEffect(() => {
    fetchCargas();
    fetchViajes();
    fetchVehiculos();
  }, [viajes]); // Añadimos viajes como dependencia para actualizar cargas cuando cambien

  const fetchCargas = async () => {
    try {
      const response = await fetch("http://localhost:5000/carga", {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const allCargas = await response.json();
        const assignedCargaIds = new Set(viajes.flatMap(viaje => viaje.cargas.map(c => c.id_carga)));
        const pendingCargas = allCargas.filter((carga) => !carga.fecha_salida && !assignedCargaIds.has(carga.id_carga));
        setCargas(pendingCargas);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: await response.text(),
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error de red al obtener cargas",
      });
    }
  };

  const fetchViajes = async () => {
    try {
      const response = await fetch("http://localhost:5000/viaje", {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setViajes(data);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: await response.text(),
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error de red al obtener viajes",
      });
    }
  };

  const fetchVehiculos = async () => {
    try {
      const response = await fetch("http://localhost:5000/vehiculo/active", {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setVehiculos(data);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: await response.text(),
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error de red al obtener vehículos",
      });
    }
  };

  const handleCreateCarga = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/carga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newCarga),
      });
      if (response.ok) {
        fetchCargas();
        setNewCarga({
          cliente: "",
          peso: "",
          volumen: "",
          descripcion: "",
          tipo_carga: "",
          fecha_entrega: "",
        });
        Swal.fire({
          icon: "success",
          title: "Éxito",
          text: "Carga creada exitosamente.",
        });
      } else {
        const errorText = await response.text();
        Swal.fire({
          icon: "error",
          title: "Error",
          text: `Error al crear carga: ${errorText}`,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error de red al crear carga",
      });
    }
  };

  const handleAddCargaToViaje = async (idViaje, idCarga) => {
    try {
      const response = await fetch(`http://localhost:5000/viaje/${idViaje}/add-carga`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id_carga: idCarga,
          origen_latitud: newViaje.origen_latitud,
          origen_longitud: newViaje.origen_longitud,
          destino_latitud: newViaje.destino_latitud,
          destino_longitud: newViaje.destino_longitud,
        }),
      });
      if (response.ok) {
        fetchViajes();
        fetchCargas();
        setSelectedCarga(null);
        Swal.fire({
          icon: "success",
          title: "Éxito",
          text: "Carga agregada al viaje con éxito.",
        });
      } else {
        const errorText = await response.text();
        Swal.fire({
          icon: "error",
          title: "Error",
          text: `Error al agregar carga al viaje: ${errorText}`,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error de red al agregar carga al viaje",
      });
    }
  };

  const handleAsignarViaje = async (e) => {
    e.preventDefault();
    if (!selectedCarga) {
      Swal.fire({
        icon: "warning",
        title: "Advertencia",
        text: "Selecciona una carga primero",
      });
      return;
    }
  
    // Encontrar todos los viajes compatibles
    const compatibleViajes = viajes.filter((viaje) => {
      const totalPeso = viaje.cargas.reduce((sum, carga) => sum + parseFloat(carga.peso || 0), 0) + parseFloat(selectedCarga.peso);
      const totalVolumen = viaje.cargas.reduce((sum, carga) => sum + parseFloat(carga.volumen || 0), 0) + parseFloat(selectedCarga.volumen);
      const vehicle = vehiculos.find((v) => v.matricula === viaje.id_vehiculo);
      const isSameDay = new Date(viaje.fecha_entrega).toDateString() === new Date(selectedCarga.fecha_entrega).toDateString();
      const isCloseOrigin = Math.abs(viaje.origen_latitud - parseFloat(newViaje.origen_latitud)) < 0.1 &&
                           Math.abs(viaje.origen_longitud - parseFloat(newViaje.origen_longitud)) < 0.1;
      const isCloseDestination = Math.abs(viaje.destino_latitud - parseFloat(newViaje.destino_latitud)) < 0.1 &&
                                Math.abs(viaje.destino_longitud - parseFloat(newViaje.destino_longitud)) < 0.1;
  
      return (
        vehicle &&
        vehicle.capacidad_peso_max >= totalPeso &&
        vehicle.peso_disponible >= totalPeso &&
        vehicle.capacidad_volumen >= totalVolumen &&
        vehicle.tipo_carga === selectedCarga.tipo_carga &&
        isSameDay &&
        isCloseOrigin &&
        isCloseDestination &&
        viaje.estado === "asignado"
      );
    });
  
    if (compatibleViajes.length > 0) {
      const options = compatibleViajes.map((viaje) => ({
        value: viaje.id_viaje,
        text: `Viaje ${viaje.id_viaje} con vehículo ${viaje.id_vehiculo}`,
      }));
      Swal.fire({
        icon: "info",
        title: "Viajes Compatibles Encontrados",
        html: `Selecciona un viaje para unir la carga:<br><select id="compatibleViaje" class="swal2-select">${options.map(opt => `<option value="${opt.value}">${opt.text}</option>`).join('')}</select>`,
        showCancelButton: true,
        confirmButtonText: "Asignar",
        cancelButtonText: "Crear nuevo viaje",
        didOpen: () => {
          const select = Swal.getPopup().querySelector("#compatibleViaje");
          select.focus();
        },
        preConfirm: () => {
          return Swal.getPopup().querySelector("#compatibleViaje").value;
        },
      }).then((result) => {
        if (result.isConfirmed) {
          const selectedViajeId = result.value;
          console.log("Botón 'Asignar' presionado, agregando carga al viaje:", selectedViajeId);
          handleAddCargaToViaje(selectedViajeId, selectedCarga.id_carga);
        } else {
          console.log("Botón 'Crear nuevo viaje' presionado");
          createNewViaje();
        }
      });
      return;
    }
  
    console.log("No se encontraron viajes compatibles, creando uno nuevo");
    createNewViaje();
  };

  const createNewViaje = async () => {
    try {
      const response = await fetch("http://localhost:5000/viaje", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...newViaje, id_carga: selectedCarga.id_carga }),
      });
      if (response.ok) {
        const result = await response.json();
        console.log("Respuesta del servidor:", result); // Log para depuración
        const assignedVehicle = result.id_vehiculo || "Desconocido";
        fetchViajes();
        setNewViaje({
          origen_latitud: "",
          origen_longitud: "",
          destino_latitud: "",
          destino_longitud: "",
        });
        setSelectedCarga(null);
        Swal.fire({
          icon: "success",
          title: "Éxito",
          text: `Viaje asignado con éxito. Vehículo asignado: ${assignedVehicle}`,
        });
      } else {
        const errorText = await response.text();
        Swal.fire({
          icon: "error",
          title: "Error",
          text: `Error al asignar viaje: ${errorText}`,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error de red al asignar viaje",
      });
    }
  };

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", minHeight: "100vh" }}>
      <Header onLogout={handleLogout} />

      <div style={{ padding: "20px" }}>
        <div className="container-fluid">
          <div className="row g-3">
            {/* Lista de cargas pendientes */}
            <div className="col-lg-4">
              <div className="border rounded p-3 h-100">
                <h3>Cargas Pendientes</h3>
                {cargas.length === 0 ? (
                  <p>No hay cargas pendientes.</p>
                ) : (
                  cargas.map((carga) => (
                    <div
                      key={carga.id_carga}
                      className="d-flex justify-content-between align-items-center mb-2 p-2 border-bottom"
                      style={{ backgroundColor: "#f8f9fa", cursor: "pointer" }}
                      onClick={() => setSelectedCarga(carga)}
                    >
                      <div>
                        <p>
                          <strong>Cliente:</strong> {carga.cliente}<br />
                          <strong>Peso:</strong> {carga.peso} kg<br />
                          <strong>Tipo Carga:</strong> {carga.tipo_carga}<br />
                          <strong>Entrega:</strong> {new Date(carga.fecha_entrega).toLocaleString()}
                        </p>
                      </div>
                      <button className="btn btn-dark">Seleccionar</button>
                    </div>
                  ))
                )}
                <h4 className="mt-3">Añadir Nueva Carga</h4>
                <form onSubmit={handleCreateCarga}>
                  <input
                    type="text"
                    className="form-control mb-2"
                    placeholder="Cliente"
                    value={newCarga.cliente}
                    onChange={(e) => setNewCarga({ ...newCarga, cliente: e.target.value })}
                    required
                  />
                  <input
                    type="number"
                    step="0.01"
                    className="form-control mb-2"
                    placeholder="Peso (kg)"
                    value={newCarga.peso}
                    onChange={(e) => setNewCarga({ ...newCarga, peso: e.target.value })}
                    required
                  />
                  <input
                    type="number"
                    step="0.01"
                    className="form-control mb-2"
                    placeholder="Volumen (m³)"
                    value={newCarga.volumen}
                    onChange={(e) => setNewCarga({ ...newCarga, volumen: e.target.value })}
                    required
                  />
                  <textarea
                    className="form-control mb-2"
                    placeholder="Descripción"
                    value={newCarga.descripcion}
                    onChange={(e) => setNewCarga({ ...newCarga, descripcion: e.target.value })}
                  />
                  <select
                    className="form-control mb-2"
                    value={newCarga.tipo_carga}
                    onChange={(e) => setNewCarga({ ...newCarga, tipo_carga: e.target.value })}
                    required
                  >
                    <option value="">Selecciona el tipo de carga</option>
                    {tiposCarga.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                  <input
                    type="datetime-local"
                    className="form-control mb-2"
                    value={newCarga.fecha_entrega}
                    onChange={(e) => setNewCarga({ ...newCarga, fecha_entrega: e.target.value })}
                    required
                  />
                  <button type="submit" className="btn btn-success w-100">
                    Añadir Carga
                  </button>
                </form>
              </div>
            </div>

            {/* Asignar Viaje */}
            <div className="col-lg-4">
              <div className="border rounded p-3 h-100">
                <h3>Asignar Viaje</h3>
                {selectedCarga ? (
                  <form onSubmit={handleAsignarViaje}>
                    <input
                      type="number"
                      step="0.000001"
                      className="form-control mb-2"
                      placeholder="Origen Latitud"
                      value={newViaje.origen_latitud}
                      onChange={(e) => setNewViaje({ ...newViaje, origen_latitud: e.target.value })}
                      required
                    />
                    <input
                      type="number"
                      step="0.000001"
                      className="form-control mb-2"
                      placeholder="Origen Longitud"
                      value={newViaje.origen_longitud}
                      onChange={(e) => setNewViaje({ ...newViaje, origen_longitud: e.target.value })}
                      required
                    />
                    <input
                      type="number"
                      step="0.000001"
                      className="form-control mb-2"
                      placeholder="Destino Latitud"
                      value={newViaje.destino_latitud}
                      onChange={(e) => setNewViaje({ ...newViaje, destino_latitud: e.target.value })}
                      required
                    />
                    <input
                      type="number"
                      step="0.000001"
                      className="form-control mb-2"
                      placeholder="Destino Longitud"
                      value={newViaje.destino_longitud}
                      onChange={(e) => setNewViaje({ ...newViaje, destino_longitud: e.target.value })}
                      required
                    />
                    <button type="submit" className="btn btn-success w-100">
                      Asignar Viaje
                    </button>
                  </form>
                ) : (
                  <p>Selecciona una carga para asignar un viaje.</p>
                )}
              </div>
            </div>

            {/* Lista de Viajes */}
            <div className="col-lg-4">
              <div className="border rounded p-3 h-100">
                <h3>Viajes Actuales</h3>
                {viajes.length === 0 ? (
                  <p>No hay viajes actuales.</p>
                ) : (
                  viajes.map((viaje) => (
                    <div
                      key={viaje.id_viaje}
                      className="d-flex justify-content-between align-items-center mb-2 p-2 border-bottom"
                      style={{ backgroundColor: "#f8f9fa", cursor: "pointer" }}
                      onClick={() => setSelectedViaje(viaje)}
                    >
                      <div>
                        <p>
                          <strong>ID Viaje:</strong> {viaje.id_viaje}<br />
                          <strong>Estado:</strong> {viaje.estado}<br />
                          <strong>Origen:</strong> {viaje.origen_latitud}, {viaje.origen_longitud}<br />
                          <strong>Destino:</strong> {viaje.destino_latitud}, {viaje.destino_longitud}<br />
                          <strong>Cliente(s):</strong>{" "}
                          {viaje.cargas.map((c) => c.cliente).join(", ") || "N/A"}
                        </p>
                      </div>
                      <button
                        className="btn btn-dark"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedViaje(viaje);
                        }}
                      >
                        Ver más
                      </button>
                    </div>
                  ))
                )}
                {selectedViaje && (
                  <div className="mt-3 p-3 border rounded" style={{ backgroundColor: "#e9ecef" }}>
                    <h4>Detalles del Viaje</h4>
                    <p>
                      <strong>ID Viaje:</strong> {selectedViaje.id_viaje}<br />
                      <strong>Vehículo:</strong>{" "}
                      {selectedViaje.id_vehiculo || "No asignado"}<br />
                      <strong>Estado:</strong> {selectedViaje.estado}<br />
                      <strong>Origen:</strong>{" "}
                      {selectedViaje.origen_latitud}, {selectedViaje.origen_longitud}<br />
                      <strong>Destino:</strong>{" "}
                      {selectedViaje.destino_latitud}, {selectedViaje.destino_longitud}<br />
                      <strong>Fecha Entrega:</strong>{" "}
                      {new Date(selectedViaje.fecha_entrega).toLocaleString()}<br />
                      <strong>Fecha Salida:</strong>{" "}
                      {selectedViaje.fecha_salida
                        ? new Date(selectedViaje.fecha_salida).toLocaleString()
                        : "No iniciada"}<br />
                      <strong>Cargas:</strong>
                      <ul>
                        {selectedViaje.cargas.map((carga, index) => (
                          <li key={index}>
                            {carga.cliente} - {carga.peso} kg - {carga.volumen} m³ -{" "}
                            {carga.tipo_carga}
                          </li>
                        ))}
                      </ul>
                    </p>
                    <button
                      className="btn btn-secondary mt-2"
                      onClick={() => setSelectedViaje(null)}
                    >
                      Cerrar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Viajes;