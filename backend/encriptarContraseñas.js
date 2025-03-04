// encriptarContraseñas.js

const bcrypt = require('bcryptjs');
const mysql = require('mysql');

// Configuración de la conexión a la base de datos
const db = mysql.createConnection({
  host: 'localhost',  // Cambia esto según tu configuración
  user: 'root',       // Tu usuario de MySQL
  password: '',       // Tu contraseña de MySQL
  database: 'ruta_segura'  // El nombre de tu base de datos
});

// Conexión a la base de datos
db.connect(err => {
  if (err) {
    console.error('Error conectando a MySQL:', err);
    return;
  }
  console.log('Conectado a MySQL');
});

// Obtener todos los usuarios
db.query('SELECT * FROM usuario', (err, users) => {
  if (err) {
    console.error('Error obteniendo usuarios:', err);
    return;
  }

  // Recorremos todos los usuarios para encriptar sus contraseñas
  users.forEach(user => {
    // Verificamos si la contraseña ya está encriptada
    if (!user.contrasena.startsWith('$2a$')) {
      // Hasheamos la contraseña si no está encriptada
      bcrypt.hash(user.contrasena, 10, (err, hashedPassword) => {
        if (err) {
          console.error('Error hasheando la contraseña:', err);
          return;
        }

        // Actualizamos la contraseña en la base de datos con la versión encriptada
        db.query('UPDATE usuario SET contrasena = ? WHERE id_usuario = ?', [hashedPassword, user.id_usuario], (err, result) => {
          if (err) {
            console.error('Error actualizando la contraseña:', err);
          } else {
            console.log(`Contraseña de usuario ${user.id_usuario} actualizada`);
          }
        });
      });
    }
  });
});
