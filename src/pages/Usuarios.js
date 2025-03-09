import React, { useState, useEffect } from "react";
import Header from "../Header";
import "bootstrap/dist/css/bootstrap.min.css";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

function Usuarios({ setIsLoggedIn }) {
  const handleLogout = () => {
    localStorage.removeItem("userSession");
    setIsLoggedIn(false);
  };

  // Estados
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null); // Nuevo estado para el ID del usuario en edición
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    apaterno: "",
    amaterno: "",
    correo: "",
    contrasena: "",
    celular: "",
    tipo_usuario: "conductor",
  });

  // Cargar usuarios desde la API
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:5000/usuario");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    }
  };

  // Filtrar usuarios por tipo
  const admins = users.filter((user) => user.tipo_usuario === "administrador");
  const conductores = users.filter((user) => user.tipo_usuario === "conductor");

  // Manejo del modal de detalles
  const handleShowDetails = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    // No limpiamos selectedUser aquí para evitar problemas con el formulario de edición
  };

  // Manejo del modal de formulario (Añadir/Editar)
  const handleShowForm = (user = null) => {
    if (user) {
      setIsEditing(true);
      setEditingUserId(user.id_usuario); // Guardamos el ID del usuario que estamos editando
      setFormData({
        nombre: user.nombre,
        apaterno: user.apaterno,
        amaterno: user.amaterno || "",
        correo: user.correo,
        contrasena: "",
        celular: user.celular || "",
        tipo_usuario: user.tipo_usuario,
      });
    } else {
      setIsEditing(false);
      setEditingUserId(null); // No hay ID para un usuario nuevo
      setFormData({
        nombre: "",
        apaterno: "",
        amaterno: "",
        correo: "",
        contrasena: "",
        celular: "",
        tipo_usuario: "conductor",
      });
    }
    setShowFormModal(true);
  };

  const handleCloseForm = () => {
    setShowFormModal(false);
    setEditingUserId(null); // Limpiamos el ID al cerrar el formulario
    setFormData({
      nombre: "",
      apaterno: "",
      amaterno: "",
      correo: "",
      contrasena: "",
      celular: "",
      tipo_usuario: "conductor",
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (isEditing) {
        if (!editingUserId) {
          throw new Error("No se encontró el ID del usuario para editar");
        }
        response = await fetch(`http://localhost:5000/usuario/${editingUserId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: formData.nombre,
            apaterno: formData.apaterno,
            amaterno: formData.amaterno,
            correo: formData.correo,
            celular: formData.celular,
            tipo_usuario: formData.tipo_usuario,
          }),
        });
      } else {
        response = await fetch("http://localhost:5000/usuario", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: formData.nombre,
            apaterno: formData.apaterno,
            amaterno: formData.amaterno,
            correo: formData.correo,
            contrasena: formData.contrasena,
            celular: formData.celular,
            tipo_usuario: formData.tipo_usuario,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.message.includes("Duplicate entry")) {
          throw new Error("El correo ya está registrado");
        }
        throw new Error(errorData.message || "Error al guardar usuario");
      }

      fetchUsers();
      handleCloseForm();
      handleCloseDetails(); // Cerramos el modal de detalles también
      setSelectedUser(null); // Limpiamos selectedUser después de guardar
    } catch (error) {
      console.error("Error al guardar usuario:", error);
      alert("Error al guardar usuario: " + error.message);
    }
  };

  // Eliminar usuario
  const handleDeleteUser = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este usuario?")) {
      try {
        const response = await fetch(`http://localhost:5000/usuario/${id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Error al eliminar usuario");
        }

        fetchUsers();
        handleCloseDetails();
        setSelectedUser(null);
      } catch (error) {
        console.error("Error al eliminar usuario:", error);
        alert("Error al eliminar usuario: " + error.message);
      }
    }
  };

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", minHeight: "100vh" }}>
      <Header onLogout={handleLogout} />

      {/* Contenido principal */}
      <div style={{ padding: "20px" }}>
        <div className="container-fluid">
          <div className="row g-3">
            {/* Lista de usuarios - Aumentamos a col-lg-6 */}
            <div className="col-lg-6">
              <div className="border rounded p-3 h-100" style={{ maxHeight: "80vh", overflowY: "auto" }}>
                <h3>Administradores</h3>
                {admins.map((admin) => (
                  <div
                    key={admin.id_usuario}
                    className="d-flex justify-content-between align-items-center mb-2 p-2 border-bottom"
                    style={{
                      cursor: "pointer",
                    }}
                    onClick={() => handleShowDetails(admin)}
                  >
                    <div>
                      <p>
                        <strong>Nombre:</strong> {admin.nombre} {admin.apaterno} {admin.amaterno || ""}<br />
                        <strong>Celular:</strong> {admin.celular || "No especificado"}
                      </p>
                    </div>
                    <button className="btn btn-dark">Ver más</button>
                  </div>
                ))}

                <h3 className="mt-4">Conductores</h3>
                {conductores.map((conductor) => (
                  <div
                    key={conductor.id_usuario}
                    className="d-flex justify-content-between align-items-center mb-2 p-2 border-bottom"
                    style={{
                      cursor: "pointer",
                    }}
                    onClick={() => handleShowDetails(conductor)}
                  >
                    <div>
                      <p>
                        <strong>Nombre:</strong> {conductor.nombre} {conductor.apaterno} {conductor.amaterno || ""}<br />
                        <strong>Celular:</strong> {conductor.celular || "No especificado"}
                      </p>
                    </div>
                    <button className="btn btn-dark">Ver más</button>
                  </div>
                ))}
                <button
                  className="btn btn-success mt-3 w-100"
                  onClick={() => handleShowForm()}
                >
                  Añadir usuario
                </button>
              </div>
            </div>

            {/* Área de detalles - Ajustamos a col-lg-6 */}
            <div className="col-lg-6">
              <div className="border rounded p-3 h-100">
                <h3>Detalles del Usuario</h3>
                {selectedUser ? (
                  <div>
                    <p><strong>Nombre:</strong> {selectedUser.nombre}</p>
                    <p><strong>Apellido Paterno:</strong> {selectedUser.apaterno}</p>
                    <p><strong>Apellido Materno:</strong> {selectedUser.amaterno || "No especificado"}</p>
                    <p><strong>Correo:</strong> {selectedUser.correo}</p>
                    <p><strong>Celular:</strong> {selectedUser.celular || "No especificado"}</p>
                    <p><strong>Tipo de usuario:</strong> {selectedUser.tipo_usuario}</p>
                    <p><strong>Fecha de creación:</strong> {new Date(selectedUser.created_at).toLocaleString()}</p>
                    <p><strong>Última actualización:</strong> {new Date(selectedUser.updated_at).toLocaleString()}</p>
                  </div>
                ) : (
                  <p>Selecciona un usuario para ver los detalles.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Detalles */}
      <Modal show={showDetailsModal} onHide={handleCloseDetails}>
        <Modal.Header closeButton>
          <Modal.Title>Detalles del usuario</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <div>
              <p><strong>Nombre:</strong> {selectedUser.nombre}</p>
              <p><strong>Apellido Paterno:</strong> {selectedUser.apaterno}</p>
              <p><strong>Apellido Materno:</strong> {selectedUser.amaterno || "No especificado"}</p>
              <p><strong>Correo:</strong> {selectedUser.correo}</p>
              <p><strong>Celular:</strong> {selectedUser.celular || "No especificado"}</p>
              <p><strong>Tipo de usuario:</strong> {selectedUser.tipo_usuario}</p>
              <p><strong>Fecha de creación:</strong> {new Date(selectedUser.created_at).toLocaleString()}</p>
              <p><strong>Última actualización:</strong> {new Date(selectedUser.updated_at).toLocaleString()}</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDetails}>
            Cerrar
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              handleCloseDetails();
              handleShowForm(selectedUser);
            }}
          >
            Editar
          </Button>
          <Button
            variant="danger"
            onClick={() => handleDeleteUser(selectedUser.id_usuario)}
          >
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Añadir/Editar */}
      <Modal show={showFormModal} onHide={handleCloseForm}>
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? "Editar usuario" : "Añadir usuario"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleFormSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleFormChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Apellido Paterno</Form.Label>
              <Form.Control
                type="text"
                name="apaterno"
                value={formData.apaterno}
                onChange={handleFormChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Apellido Materno</Form.Label>
              <Form.Control
                type="text"
                name="amaterno"
                value={formData.amaterno}
                onChange={handleFormChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Correo</Form.Label>
              <Form.Control
                type="email"
                name="correo"
                value={formData.correo}
                onChange={handleFormChange}
                required
                disabled={isEditing}
              />
            </Form.Group>
            {!isEditing && (
              <Form.Group className="mb-3">
                <Form.Label>Contraseña</Form.Label>
                <Form.Control
                  type="password"
                  name="contrasena"
                  value={formData.contrasena}
                  onChange={handleFormChange}
                  required
                />
              </Form.Group>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Celular</Form.Label>
              <Form.Control
                type="text"
                name="celular"
                value={formData.celular}
                onChange={handleFormChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tipo de usuario</Form.Label>
              <Form.Select
                name="tipo_usuario"
                value={formData.tipo_usuario}
                onChange={handleFormChange}
                required
              >
                <option value="administrador">Administrador</option>
                <option value="conductor">Conductor</option>
              </Form.Select>
            </Form.Group>
            <Button variant="primary" type="submit">
              {isEditing ? "Guardar" : "Añadir usuario"}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default Usuarios;