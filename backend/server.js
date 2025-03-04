require('dotenv').config();
const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // Para hashear las contraseñas
const app = express();
const PORT = process.env.PORT || 5000;

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

  // Verificar si el correo existe en la base de datos
  const sql = 'SELECT * FROM usuario WHERE correo = ?';
  db.query(sql, [correo], (err, results) => {
    if (err) return res.status(500).send(err);

    // Si no hay resultados, correo no existe
    if (results.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = results[0]; // Tomamos el primer usuario encontrado

    // Comparar la contraseña recibida con la almacenada en la base de datos
    bcrypt.compare(contrasena, user.contrasena, (err, isMatch) => {
      if (err) return res.status(500).send(err);

      if (!isMatch) {
        return res.status(401).json({ message: 'Contraseña incorrecta' });
      }

      // Si la contraseña es correcta, enviamos los datos del usuario (sin contraseña)
      const { contrasena, ...userWithoutPassword } = user; // Quitamos la contraseña de la respuesta
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

  // Hashear la contraseña antes de guardarla
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

app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));

//GOOGLE
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID); // Usa tu Client ID

// Ruta para el login con Google
app.post('/google-login', async (req, res) => {
  const { tokenId } = req.body;

  // Verificar el token con Google
  try {
    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID, // Asegúrate de usar el mismo Client ID
    });

    const payload = ticket.getPayload();
    const { email, given_name, family_name } = payload;

    // Verificar si el usuario existe en la base de datos
    const sql = 'SELECT * FROM usuario WHERE correo = ?';
    db.query(sql, [email], (err, results) => {
      if (err) return res.status(500).send(err);

      if (results.length === 0) {
        // Si el usuario no existe, lo creamos
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
        // Si el usuario existe, lo autenticamos
        const user = results[0];
        res.json({ success: true, user });
      }
    });
  } catch (error) {
    console.error('Error al verificar el token de Google:', error);
    res.status(401).json({ success: false, error: 'Token inválido' });
  }
});
