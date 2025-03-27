const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const moment = require('moment-timezone');

const app = express();
const PORT = 5001;

const uri = "mongodb+srv://YOYI:XekPrkpgCTbqyupz@rutasegura.oxetc.mongodb.net/RutaSegura?retryWrites=true&w=majority&appName=RutaSegura";
const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };
// Conectar a MongoDB Atlas
async function connectToMongoDB() {
    try {
        await mongoose.connect(uri, clientOptions);
        console.log("Conectado a MongoDB Atlas con éxito");
    } catch (error) {
        console.error("Error conectando a MongoDB Atlas:", error);
        process.exit(1); // Terminar el proceso si no se puede conectar
    }
}

// Ejecutar la conexión al iniciar el servidor
connectToMongoDB();


//Esquema del GPS
const gpsSchema = new mongoose.Schema({
    folioIot: String,
    latitud: Number,
    longitud: Number,
    fecha: Date
});

// Modelo en la colección "ubicacionesTiempoReal"
const GPSData = mongoose.model('GPSData', gpsSchema, 'ubicacionesTiempoReal');

app.use(bodyParser.json());
app.use(cors());

const Alerta = mongoose.model('Alerta', gpsSchema, 'alertasEmergencia');

app.post('/alertaEmergencia', async (req, res) => {
    const { latitude, longitude } = req.body;

    try {
        const fechaConZona = moment().tz("America/Mexico_City").toDate();
        const nuevaAlerta = await Alerta.create({
            folioIot : "001",
            latitud: latitude,
            longitud: longitude,
            fecha: fechaConZona
        });

        console.log(Alerta Agregada: Lat ${latitude}, Lng ${longitude}, Fecha ${fechaConZona});
        res.status(200).json({
            success: true,
            message: 'Alerta de emergencia registrada correctamente',
            data: nuevaAlerta
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
});


// 🔹 Iniciar servidor en el puerto 3000
app.listen(PORT, () => {
    console.log(🚀 Servidor corriendo en http://localhost:${PORT});
});