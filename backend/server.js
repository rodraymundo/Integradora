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
      return done(null, false, { message: 'El correo no está registrado.' });
    }

    const user = results[0];
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

app.get('/auth/google/callback', passport.authenticate('google', {
  failureRedirect: 'http://localhost:3000/login',
}), (req, res) => {
  console.log('Callback ejecutado, usuario autenticado:', req.user);
  const { contrasena, ...userWithoutPassword } = req.user;
  const redirectUrl = `http://localhost:3000/?user=${encodeURIComponent(JSON.stringify(userWithoutPassword))}`;
  console.log('Redirigiendo a:', redirectUrl);
  res.redirect(redirectUrl);
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
      req.login(user, (err) => {
        if (err) return res.status(500).send(err);
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
    SELECT matricula, marca, capacidad_peso_max, capacidad_volumen, tipo_carga, peso_disponible, estado 
    FROM vehiculo 
    WHERE estatus = 1 AND estado = 'disponible'
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

// Rutas de carga y viaje
app.post('/carga', (req, res) => {
  const { cliente, peso, volumen, descripcion, tipo_carga, fecha_entrega } = req.body;

  if (!cliente || !peso || !volumen || !tipo_carga || !fecha_entrega) {
    return res.status(400).json({ message: "Faltan campos requeridos" });
  }

  const sql = 'CALL crear_carga(?, ?, ?, ?, ?, ?)';
  db.query(sql, [cliente, peso, volumen, descripcion || null, tipo_carga, fecha_entrega], (err, result) => {
    if (err) {
      console.error("Error al crear carga:", err);
      return res.status(500).json({ message: "Error al crear carga", error: err.message });
    }
    res.json({ message: "Carga creada", id_carga: result[0][0].id_carga });
  });
});

app.post('/viaje', (req, res) => {
  const { origen_latitud, origen_longitud, destino_latitud, destino_longitud, id_carga } = req.body;

  if (!origen_latitud || !origen_longitud || !destino_latitud || !destino_longitud || !id_carga) {
    return res.status(400).json({ message: "Faltan campos requeridos" });
  }

  const sql = 'CALL asignar_viaje(?, ?, ?, ?, ?)';
  db.query(sql, [origen_latitud, origen_longitud, destino_latitud, destino_longitud, id_carga], (err, result) => {
    if (err) {
      console.error("Error al asignar viaje:", err);
      return res.status(500).json({ message: "Error al asignar viaje", error: err.message });
    }

    // Asegurarse de que result[0][0] tenga los datos esperados
    if (!result[0][0]) {
      console.error("No se encontraron resultados al asignar el viaje");
      return res.status(500).json({ message: "Error al asignar el viaje: No se encontraron resultados" });
    }

    const idViaje = result[0][0].id_viaje;
    const idVehiculo = result[0][0].id_vehiculo; // Ahora el id_vehiculo viene del stored procedure

    if (!idVehiculo) {
      console.error("No se asignó un vehículo al viaje:", idViaje);
      return res.status(500).json({ message: "Error al asignar el viaje: No se asignó un vehículo" });
    }

    console.log("Viaje asignado:", { id_viaje: idViaje, id_vehiculo: idVehiculo });
    res.json({ message: "Viaje asignado", id_viaje: idViaje, id_vehiculo: idVehiculo });
  });
});

app.post('/viaje/iniciar/:id', (req, res) => {
  const { id } = req.params;

  const sql = 'CALL iniciar_viaje(?)';
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error al iniciar viaje:", err);
      return res.status(500).json({ message: "Error al iniciar viaje", error: err.message });
    }
    res.json({ message: "Viaje iniciado" });
  });
});

app.get('/carga', (req, res) => {
  const sql = 'SELECT * FROM carga WHERE estatus = 1';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

app.get('/viaje', (req, res) => {
  const sql = `
    SELECT v.*, c.cliente, c.peso, c.volumen, c.tipo_carga, c.descripcion, c.id_carga
    FROM viaje v
    JOIN viaje_carga vc ON v.id_viaje = vc.id_viaje
    JOIN carga c ON vc.id_carga = c.id_carga
    WHERE v.estatus = 1
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).send(err);
    const viajesMap = {};
    results.forEach(row => {
      if (!viajesMap[row.id_viaje]) {
        viajesMap[row.id_viaje] = { ...row, cargas: [] };
      }
      viajesMap[row.id_viaje].cargas.push({
        id_carga: row.id_carga,
        cliente: row.cliente,
        peso: row.peso,
        volumen: row.volumen,
        tipo_carga: row.tipo_carga,
        descripcion: row.descripcion,
      });
    });
    res.json(Object.values(viajesMap));
  });
});

// Nueva ruta para agregar una carga a un viaje existente
app.post('/viaje/:id/add-carga', (req, res) => {
  const { id } = req.params; // ID del viaje
  const { id_carga, origen_latitud, origen_longitud, destino_latitud, destino_longitud } = req.body;

  if (!id_carga) {
    return res.status(400).json({ message: "Falta el ID de la carga" });
  }

  // Obtener datos del viaje, incluyendo coordenadas
  const sqlCheck = `
    SELECT v.id_vehiculo, v.fecha_entrega, v.origen_latitud, v.origen_longitud, 
           v.destino_latitud, v.destino_longitud,
           SUM(c.peso) as total_peso, SUM(c.volumen) as total_volumen,
           c.tipo_carga
    FROM viaje v
    JOIN viaje_carga vc ON v.id_viaje = vc.id_viaje
    JOIN carga c ON vc.id_carga = c.id_carga
    WHERE v.id_viaje = ? AND v.estado = 'asignado'
    GROUP BY v.id_viaje
  `;
  db.query(sqlCheck, [id], (err, result) => {
    if (err) {
      console.error("Error al verificar compatibilidad:", err);
      return res.status(500).json({ message: "Error al verificar compatibilidad", error: err.message });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: "Viaje no encontrado o no está asignado" });
    }

    const viaje = result[0];
    console.log("Datos del viaje:", viaje);

    const vehicleSql = `
      SELECT capacidad_peso_max, capacidad_volumen, tipo_carga, peso_disponible
      FROM vehiculo
      WHERE matricula = ?
    `;
    db.query(vehicleSql, [viaje.id_vehiculo], (err, vehicleResult) => {
      if (err) {
        console.error("Error al obtener vehículo:", err);
        return res.status(500).json({ message: "Error al obtener vehículo", error: err.message });
      }
      if (vehicleResult.length === 0) {
        return res.status(404).json({ message: "Vehículo no encontrado" });
      }

      const vehicle = vehicleResult[0];
      console.log("Datos del vehículo:", vehicle);

      const cargaSql = `
        SELECT peso, volumen, tipo_carga, fecha_entrega
        FROM carga
        WHERE id_carga = ?
      `;
      db.query(cargaSql, [id_carga], (err, cargaResult) => {
        if (err) {
          console.error("Error al obtener carga:", err);
          return res.status(500).json({ message: "Error al obtener carga", error: err.message });
        }
        if (cargaResult.length === 0) {
          return res.status(404).json({ message: "Carga no encontrada" });
        }

        const carga = cargaResult[0];
        console.log("Datos de la carga:", carga);

        const totalPeso = parseFloat(viaje.total_peso || 0) + parseFloat(carga.peso);
        const totalVolumen = parseFloat(viaje.total_volumen || 0) + parseFloat(carga.volumen);
        console.log("Total peso:", totalPeso, "Total volumen:", totalVolumen);

        // Verificar compatibilidad de coordenadas
        let isCloseOrigin = true;
        let isCloseDestination = true;
        if (origen_latitud && origen_longitud && destino_latitud && destino_longitud) {
          isCloseOrigin = Math.abs(viaje.origen_latitud - parseFloat(origen_latitud)) < 0.1 &&
                          Math.abs(viaje.origen_longitud - parseFloat(origen_longitud)) < 0.1;
          isCloseDestination = Math.abs(viaje.destino_latitud - parseFloat(destino_latitud)) < 0.1 &&
                               Math.abs(viaje.destino_longitud - parseFloat(destino_longitud)) < 0.1;
        }

        // Verificar compatibilidad de fecha (mismo día)
        const isSameDay = new Date(viaje.fecha_entrega).toDateString() === new Date(carga.fecha_entrega).toDateString();

        const isCompatible =
          vehicle.capacidad_peso_max >= totalPeso &&
          vehicle.peso_disponible >= totalPeso &&
          vehicle.capacidad_volumen >= totalVolumen &&
          vehicle.tipo_carga === carga.tipo_carga &&
          isSameDay &&
          isCloseOrigin &&
          isCloseDestination;

        console.log("Compatibilidad:", {
          capacidad_peso_max: vehicle.capacidad_peso_max >= totalPeso,
          peso_disponible: vehicle.peso_disponible >= totalPeso,
          capacidad_volumen: vehicle.capacidad_volumen >= totalVolumen,
          tipo_carga: vehicle.tipo_carga === carga.tipo_carga,
          isSameDay,
          isCloseOrigin,
          isCloseDestination,
        });

        if (!isCompatible) {
          return res.status(400).json({ message: "La carga no es compatible con el viaje" });
        }

        // Agregar la carga al viaje
        const sqlInsert = 'INSERT INTO viaje_carga (id_viaje, id_carga) VALUES (?, ?)';
        db.query(sqlInsert, [id, id_carga], (err, result) => {
          if (err) {
            console.error("Error al agregar carga al viaje:", err);
            return res.status(500).json({ message: "Error al agregar carga al viaje", error: err.message });
          }

          // Actualizar peso disponible del vehículo
          const sqlUpdateVehicle = 'UPDATE vehiculo SET peso_disponible = peso_disponible - ? WHERE matricula = ?';
          db.query(sqlUpdateVehicle, [carga.peso, viaje.id_vehiculo], (err, result) => {
            if (err) {
              console.error("Error al actualizar vehículo:", err);
              return res.status(500).json({ message: "Error al actualizar vehículo", error: err.message });
            }
            res.json({ message: "Carga agregada al viaje con éxito" });
          });
        });
      });
    });
  });
});

app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));