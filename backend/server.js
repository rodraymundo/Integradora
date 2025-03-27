require('dotenv').config();
const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();
const PORT = 5000;

// Configuración de CORS para permitir solicitudes desde el frontend
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Configuración de sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'tu_secreto_aqui',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false },
}));

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

// Configuración de la base de datos MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true, // Añade esta línea
});

db.connect(err => {
  if (err) {
    console.error('Error conectando a MySQL:', err);
    return;
  }
  console.log('Conectado a MySQL');
});

// Configuración de la estrategia de Google OAuth
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:5000/auth/google/callback',
}, (accessToken, refreshToken, profile, done) => {
  const email = profile.emails[0].value;

  const sql = 'SELECT * FROM usuario WHERE correo = ?';
  db.query(sql, [email], (err, results) => {
    if (err) return done(err);

    if (results.length === 0) {
      // Correo no registrado
      return done(null, false, { message: 'El correo no está registrado en el sistema.' });
    }

    const user = results[0];
    // Validar que el usuario sea administrador
    if (user.tipo_usuario !== 'administrador') {
      return done(null, false, { message: 'Solo los administradores pueden iniciar sesión.' });
    }

    return done(null, user);
  });
}));

passport.serializeUser((user, done) => {
  done(null, user.id_usuario);
});

passport.deserializeUser((id, done) => {
  const sql = 'SELECT * FROM usuario WHERE id_usuario = ?';
  db.query(sql, [id], (err, results) => {
    if (err) return done(err);
    done(null, results[0]);
  });
});

// Rutas de autenticación
app.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

app.get('/auth/google/callback', (req, res, next) => {
  passport.authenticate('google', (err, user, info) => {
    if (err) {
      console.error("Error en autenticación con Google:", err);
      return res.redirect(`http://localhost:3000/login?error=${encodeURIComponent('Error en el servidor. Por favor, intenta de nuevo.')}`);
    }

    if (!user) {
      const errorMessage = info && info.message ? info.message : 'Error desconocido al autenticar con Google.';
      console.log("Autenticación fallida, mensaje:", errorMessage);
      return res.redirect(`http://localhost:3000/login?error=${encodeURIComponent(errorMessage)}`);
    }

    req.login(user, (loginErr) => {
      if (loginErr) {
        console.error("Error al iniciar sesión:", loginErr);
        return res.redirect(`http://localhost:3000/login?error=${encodeURIComponent('Error al iniciar sesión. Por favor, intenta de nuevo.')}`);
      }

      console.log('Callback ejecutado, usuario autenticado:', user);
      const { contrasena, ...userWithoutPassword } = user;
      const redirectUrl = `http://localhost:3000/?user=${encodeURIComponent(JSON.stringify(userWithoutPassword))}`;
      console.log('Redirigiendo a:', redirectUrl);
      return res.redirect(redirectUrl);
    });
  })(req, res, next);
});

app.get('/auth/session', (req, res) => {
  if (req.isAuthenticated()) {
    const { contrasena, ...userWithoutPassword } = req.user;
    return res.json(userWithoutPassword);
  }
  res.status(401).json({ message: 'No autenticado' });
});

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).send(err);
    res.redirect('http://localhost:3000/login');
  });
});

// Ruta de login tradicional
app.post('/login', (req, res) => {
  const { correo, contrasena } = req.body;

  const sql = 'SELECT * FROM usuario WHERE correo = ?';
  db.query(sql, [correo], (err, results) => {
    if (err) return res.status(500).json({ message: "Error en el servidor. Por favor, intenta de nuevo." });

    if (results.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    const user = results[0];
    // Validar que el usuario sea administrador
    if (user.tipo_usuario !== 'administrador') {
      return res.status(403).json({ message: "Solo los administradores pueden iniciar sesión." });
    }

    bcrypt.compare(contrasena, user.contrasena, (err, isMatch) => {
      if (err) return res.status(500).json({ message: "Error en el servidor. Por favor, intenta de nuevo." });

      if (!isMatch) {
        return res.status(401).json({ message: "Contraseña incorrecta." });
      }

      const { contrasena, ...userWithoutPassword } = user;
      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Error al iniciar sesión. Por favor, intenta de nuevo." });
        res.json(userWithoutPassword);
      });
    });
  });
});

// Rutas de usuario
app.get('/usuario', (req, res) => {
  const sql = 'SELECT id_usuario, nombre, apaterno, amaterno, correo, celular, tipo_usuario, created_at, updated_at FROM usuario';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

app.post('/usuario', (req, res) => {
  const { nombre, apaterno, amaterno, correo, contrasena, celular, tipo_usuario } = req.body;

  if (!nombre || !apaterno || !correo || !contrasena || !tipo_usuario) {
    return res.status(400).json({ message: "Faltan campos requeridos" });
  }

  bcrypt.hash(contrasena, 10, (err, hashedPassword) => {
    if (err) return res.status(500).send(err);

    const sql = 'INSERT INTO usuario (nombre, apaterno, amaterno, correo, contrasena, celular, tipo_usuario) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [nombre, apaterno, amaterno || null, correo, hashedPassword, celular || null, tipo_usuario], (err, result) => {
      if (err) {
        console.error("Error al insertar usuario:", err);
        return res.status(500).json({ message: "Error al insertar usuario", error: err.message });
      }
      res.json({ id_usuario: result.insertId, nombre, apaterno, amaterno, correo, celular, tipo_usuario });
    });
  });
});

app.put('/usuario/:id', (req, res) => {
  const { nombre, apaterno, amaterno, correo, celular, tipo_usuario } = req.body;

  if (!nombre || !apaterno || !correo || !tipo_usuario) {
    return res.status(400).json({ message: "Faltan campos requeridos" });
  }

  const sql = 'UPDATE usuario SET nombre=?, apaterno=?, amaterno=?, correo=?, celular=?, tipo_usuario=? WHERE id_usuario=?';
  db.query(sql, [nombre, apaterno, amaterno || null, correo, celular || null, tipo_usuario, req.params.id], (err, result) => {
    if (err) {
      console.error("Error al actualizar usuario:", err);
      return res.status(500).json({ message: "Error al actualizar usuario", error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.json({ message: "Usuario actualizado" });
  });
});

app.delete('/usuario/:id', (req, res) => {
  const sql = 'DELETE FROM usuario WHERE id_usuario=?';
  db.query(sql, [req.params.id], (err, result) => {
    if (err) {
      console.error("Error al eliminar usuario:", err);
      return res.status(500).json({ message: "Error al eliminar usuario", error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.json({ message: "Usuario eliminado" });
  });
});

// Rutas de vehículo
app.get('/vehiculo/active', (req, res) => {
  const sql = `
    SELECT matricula, marca, modelo, capacidad_peso_max, capacidad_volumen, tipo_carga, 
           peso_disponible, estado, tipo_vehiculo, id_usuario
    FROM vehiculo 
    WHERE estatus = 1
  `; 
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error al obtener vehículos:", err);
      return res.status(500).send(err);
    }
    res.json(results);
  });
});

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

  const peso_disponible = capacidad_peso_max;
  const folio_iot = null;
  const estatus = 1;

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


// Ruta para crear una carga
app.post('/carga', (req, res) => {
  const { cliente, peso, volumen, descripcion, tipo_carga, fecha_entrega } = req.body;

  if (!cliente || !peso || !volumen || !tipo_carga || !fecha_entrega) {
    return res.status(400).json({ message: "Faltan campos requeridos" });
  }

  const sql = `
    INSERT INTO carga (cliente, peso, volumen, descripcion, tipo_carga, fecha_entrega)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  db.query(sql, [cliente, peso, volumen, descripcion || null, tipo_carga, fecha_entrega], (err, result) => {
    if (err) {
      console.error("Error al crear carga:", err);
      return res.status(500).json({ message: "Error al crear carga", error: err.message });
    }
    res.json({ id_carga: result.insertId, cliente, peso, volumen, tipo_carga, fecha_entrega });
  });
});

app.get('/carga/sin-viaje', (req, res) => {
  console.log("Ruta /carga/sin-viaje alcanzada");
  const sql = `
    SELECT id_carga, cliente, peso, volumen, tipo_carga, fecha_entrega
    FROM carga
    WHERE estatus = 1 AND id_carga NOT IN (SELECT id_carga FROM viaje_carga WHERE estatus = 1)
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error al obtener cargas sin viaje:", err);
      return res.status(500).json({ message: "Error al obtener cargas", error: err.message });
    }
    res.json(results);
  });
});

app.post('/viaje/asignar-carga', (req, res) => {
  const { id_carga, origen_latitud, origen_longitud, destino_latitud, destino_longitud, fecha_entrega } = req.body;

  if (!id_carga || !origen_latitud || !origen_longitud || !destino_latitud || !destino_longitud || !fecha_entrega) {
    return res.status(400).json({ message: "Faltan campos requeridos" });
  }

  const sql = 'CALL AsignarCargaAViaje(?, ?, ?, ?, ?, ?, @id_viaje_asignado); SELECT @id_viaje_asignado AS id_viaje;';
  db.query(sql, [id_carga, origen_latitud, origen_longitud, destino_latitud, destino_longitud, fecha_entrega], (err, results) => {
    if (err) {
      console.error("Error al asignar carga a viaje:", err);
      return res.status(500).json({ message: "Error al asignar carga", error: err.message });
    }

    const id_viaje = results[1][0].id_viaje;
    res.json({ message: "Carga asignada a viaje", id_viaje });
  });
});

app.get('/vista_viajes_activos', (req, res) => {
  console.log("Ruta /vista_viajes_activos alcanzada");
  const sql = `
    SELECT 
      id_viaje, 
      id_vehiculo, 
      estado, 
      origen_latitud, 
      origen_longitud, 
      destino_latitud, 
      destino_longitud, 
      fecha_entrega, 
      fecha_salida, 
      estatus, 
      id_carga, 
      cliente, 
      peso, 
      volumen, 
      tipo_carga, 
      descripcion,
      conductor_nombre,     
      conductor_apaterno,     
      conductor_amaterno
    FROM vista_viajes_activos
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error al obtener viajes activos:", err);
      return res.status(500).json({ message: "Error al obtener viajes activos", error: err.message });
    }
    res.json(results);
  });
});

// Rutas de alertas
app.get('/alertas', (req, res) => {
  const sql = `
    SELECT 
      a.id_alerta,
      a.id_viaje,
      a.fecha_hora,
      a.tipo_alerta,
      a.ubicacion_latitud,
      a.ubicacion_longitud,
      v.id_vehiculo,
      v.estado AS estado_viaje,
      veh.marca,
      veh.modelo,
      u.nombre AS conductor_nombre,
      u.apaterno AS conductor_apaterno,
      u.amaterno AS conductor_amaterno
    FROM alertas a
    JOIN viaje v ON a.id_viaje = v.id_viaje
    JOIN vehiculo veh ON v.id_vehiculo = veh.matricula
    JOIN usuario u ON veh.id_usuario = u.id_usuario
    WHERE a.estatus = 1
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error al obtener alertas:", err);
      return res.status(500).json({ message: "Error al obtener alertas", error: err.message });
    }

    const alertas = results.map(alerta => ({
      id: alerta.id_alerta,
      id_viaje: alerta.id_viaje, // Asegurarse de que esté incluido
      marca: alerta.marca,
      modelo: alerta.modelo,
      conductor: `${alerta.conductor_nombre} ${alerta.conductor_apaterno} ${alerta.conductor_amaterno || ''}`.trim(),
      coordenadas: {
        lat: parseFloat(alerta.ubicacion_latitud),
        lng: parseFloat(alerta.ubicacion_longitud),
      },
      tipo: alerta.tipo_alerta,
      icon: getIconForAlertType(alerta.tipo_alerta),
    }));

    console.log("Datos enviados desde /alertas:", alertas); // Depuración en el backend
    res.json(alertas);
  });
});

// Función para asignar el icono según el tipo de alerta
function getIconForAlertType(tipoAlerta) {
  switch (tipoAlerta.toLowerCase()) {
    case 'accidente':
      return "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
    case 'tráfico':
      return "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
    case 'falla mecánica':
      return "http://maps.google.com/mapfiles/ms/icons/orange-dot.png";
    case 'descanso activo':
      return "http://maps.google.com/mapfiles/ms/icons/purple-dot.png";
    default:
      return "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";
  }
}

app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));