require('dotenv').config();
const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Configuración de la base de datos MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect(err => {
  if (err) {
    console.error('Error conectando a MySQL:', err);
    return;
  }
  console.log('Conectado a MySQL');
});

// **Ruta para Login**
app.post('/login', (req, res) => {
  const { correo, contrasena } = req.body;

  const sql = 'SELECT * FROM usuario WHERE correo = ?';
  db.query(sql, [correo], (err, results) => {
    if (err) return res.status(500).send(err);

    if (results.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = results[0];
    bcrypt.compare(contrasena, user.contrasena, (err, isMatch) => {
      if (err) return res.status(500).send(err);

      if (!isMatch) {
        return res.status(401).json({ message: 'Contraseña incorrecta' });
      }

      const { contrasena, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    });
  });
});

// **Obtener usuario (para pruebas o administración)**
app.get('/usuario', (req, res) => {
  db.query('SELECT id_usuario, nombre, apaterno, amaterno, correo, tipo_usuario FROM usuario', (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// **Crear Usuario**
app.post('/usuario', (req, res) => {
  const { nombre, apaterno, amaterno, correo, contrasena, tipo_usuario } = req.body;

  bcrypt.hash(contrasena, 10, (err, hashedPassword) => {
    if (err) return res.status(500).send(err);

    const sql = 'INSERT INTO usuario (nombre, apaterno, amaterno, correo, contrasena, tipo_usuario) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [nombre, apaterno, amaterno, correo, hashedPassword, tipo_usuario], (err, result) => {
      if (err) return res.status(500).send(err);
      res.json({ id_usuario: result.insertId, nombre, apaterno, amaterno, correo, tipo_usuario });
    });
  });
});

// **Actualizar Usuario**
app.put('/usuario/:id', (req, res) => {
  const { nombre, apaterno, amaterno, correo, tipo_usuario } = req.body;
  const sql = 'UPDATE usuario SET nombre=?, apaterno=?, amaterno=?, correo=?, tipo_usuario=? WHERE id_usuario=?';
  db.query(sql, [nombre, apaterno, amaterno, correo, tipo_usuario, req.params.id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json({ message: 'Usuario actualizado' });
  });
});

// **Eliminar Usuario**
app.delete('/usuario/:id', (req, res) => {
  const sql = 'DELETE FROM usuario WHERE id_usuario=?';
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json({ message: 'Usuario eliminado' });
  });
});

// **Obtener solo vehículos activos (estatus = 1)**
app.get('/vehiculo/active', (req, res) => {
  const sql = 'SELECT * FROM vehiculo WHERE estatus = 1';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// **Crear un vehículo**
app.post('/vehiculo', (req, res) => {
  const {
    matricula,
    marca,
    modelo,
    capacidad_peso_max,
    capacidad_volumen,
    estado,
    tipo_vehiculo,
    tipo_carga,
    id_usuario,
  } = req.body;

  // Validar campos requeridos
  if (
    !matricula ||
    !marca ||
    !modelo ||
    !capacidad_peso_max ||
    !capacidad_volumen ||
    !estado ||
    !tipo_vehiculo ||
    !tipo_carga ||
    !id_usuario
  ) {
    return res.status(400).json({ message: "Faltan campos requeridos" });
  }

  // Establecer peso_disponible igual a capacidad_peso_max al crear el vehículo
  const peso_disponible = capacidad_peso_max;
  const folio_iot = null;
  const estatus = 1; // Nuevo vehículo activo por defecto

  const sql = `
    INSERT INTO vehiculo (
      matricula, marca, modelo, capacidad_peso_max, capacidad_volumen, 
      estado, tipo_vehiculo, tipo_carga, id_usuario, peso_disponible, folio_iot, estatus
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(
    sql,
    [
      matricula,
      marca,
      modelo,
      capacidad_peso_max,
      capacidad_volumen,
      estado,
      tipo_vehiculo,
      tipo_carga,
      id_usuario,
      peso_disponible,
      folio_iot,
      estatus,
    ],
    (err, result) => {
      if (err) {
        console.error("Error al insertar vehículo:", err);
        return res.status(500).json({ message: "Error al insertar vehículo", error: err.message });
      }
      res.json({ message: "Vehículo añadido", matricula });
    }
  );
});

// **Actualizar un vehículo**
app.put('/vehiculo/:matricula', (req, res) => {
  const {
    marca,
    modelo,
    capacidad_peso_max,
    capacidad_volumen,
    estado,
    tipo_vehiculo,
    tipo_carga,
    id_usuario,
  } = req.body;

  // Validar campos requeridos
  if (
    !marca ||
    !modelo ||
    !capacidad_peso_max ||
    !capacidad_volumen ||
    !estado ||
    !tipo_vehiculo ||
    !tipo_carga ||
    !id_usuario
  ) {
    return res.status(400).json({ message: "Faltan campos requeridos" });
  }

  const sql = `
    UPDATE vehiculo 
    SET marca = ?, modelo = ?, capacidad_peso_max = ?, capacidad_volumen = ?, 
        estado = ?, tipo_vehiculo = ?, tipo_carga = ?, id_usuario = ?
    WHERE matricula = ?
  `;
  db.query(
    sql,
    [
      marca,
      modelo,
      capacidad_peso_max,
      capacidad_volumen,
      estado,
      tipo_vehiculo,
      tipo_carga,
      id_usuario,
      req.params.matricula,
    ],
    (err, result) => {
      if (err) {
        console.error("Error al actualizar vehículo:", err);
        return res.status(500).json({ message: "Error al actualizar vehículo", error: err.message });
      }
      res.json({ message: "Vehículo actualizado" });
    }
  );
});

// **Eliminar vehículo (baja lógica)**
app.put('/vehiculo/:matricula/delete', (req, res) => {
  const sql = `
    UPDATE vehiculo 
    SET estatus = 0, estado = 'fuera de servicio' 
    WHERE matricula = ?
  `;
  db.query(sql, [req.params.matricula], (err, result) => {
    if (err) {
      console.error("Error al eliminar vehículo:", err);
      return res.status(500).json({ message: "Error al eliminar vehículo", error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Vehículo no encontrado" });
    }
    res.json({ message: "Vehículo dado de baja" });
  });
});

app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));

// GOOGLE
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.post('/google-login', async (req, res) => {
  const { tokenId } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, given_name, family_name } = payload;

    const sql = 'SELECT * FROM usuario WHERE correo = ?';
    db.query(sql, [email], (err, results) => {
      if (err) return res.status(500).send(err);

      if (results.length === 0) {
        const insertSQL =
          'INSERT INTO usuario (nombre, apaterno, correo, tipo_usuario) VALUES (?, ?, ?, ?)';
        db.query(insertSQL, [given_name, family_name, email, 'conductor'], (err, result) => {
          if (err) return res.status(500).send(err);
          const newUser = {
            id_usuario: result.insertId,
            nombre: given_name,
            apaterno: family_name,
            correo: email,
          };
          res.json({ success: true, user: newUser });
        });
      } else {
        const user = results[0];
        res.json({ success: true, user });
      }
    });
  } catch (error) {
    console.error('Error al verificar el token de Google:', error);
    res.status(401).json({ success: false, error: 'Token inválido' });
  }
});