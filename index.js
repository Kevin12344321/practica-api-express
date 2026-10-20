const express = require('express');
const db = require('./database/db');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Parser } = require('json2csv');

const app = express();

app.use(cors());
app.use(express.json());


const PORT = 3000;

// Configuración para recibir archivos temporalmente
const carpetaUploads = path.join(__dirname, 'uploads');

if (!fs.existsSync(carpetaUploads)) {
    fs.mkdirSync(carpetaUploads, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, carpetaUploads);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${path.basename(file.originalname)}`);
    }
});

const upload = multer({ storage });


//GET 
app.get('/api/alumnos', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM alumnos');

        res.json(rows);
    } catch (error) {
        console.error('Error al obtener alumnos:', error.message);

        res.status(500).json({
            mensaje: 'Error al obtener los alumnos'
        });
    }
});

//GET 
app.get('/api/alumnos/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const [rows] = await db.query(
            'SELECT * FROM alumnos WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                mensaje: 'Alumno no encontrado'
            });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error al obtener alumno:', error.message);

        res.status(500).json({
            mensaje: 'Error al obtener el alumno'
        });
    }
});

//POST 
app.post('/api/alumnos', async (req, res) => {
    try {
        const { nombre, carrera } = req.body;

        const [result] = await db.query(
            'INSERT INTO alumnos (nombre, carrera) VALUES (?, ?)',
            [nombre, carrera]
        );

        const [rows] = await db.query(
            'SELECT * FROM alumnos WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error al crear alumno:', error.message);

        res.status(500).json({
            mensaje: 'Error al crear el alumno'
        });
    }
});

//PUT 
app.put('/api/alumnos/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { nombre, carrera } = req.body;

        const [result] = await db.query(
            'UPDATE alumnos SET nombre = ?, carrera = ? WHERE id = ?',
            [nombre, carrera, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                mensaje: 'Alumno no encontrado'
            });
        }

        const [rows] = await db.query(
            'SELECT * FROM alumnos WHERE id = ?',
            [id]
        );

        res.json(rows[0]);
    } catch (error) {
        console.error('Error al actualizar alumno:', error.message);

        res.status(500).json({
            mensaje: 'Error al actualizar el alumno'
        });
    }
});

//DELETE 
app.delete('/api/alumnos/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const [result] = await db.query(
            'DELETE FROM alumnos WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                mensaje: 'Alumno no encontrado'
            });
        }

        res.json({
            mensaje: 'Alumno eliminado correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar alumno:', error.message);

        res.status(500).json({
            mensaje: 'Error al eliminar el alumno'
        });
    }
});



const importarArchivo = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            mensaje: 'Debes adjuntar un archivo en el campo archivo'
        });
    }

    const rutaArchivo = req.file.path;
    const extension = path.extname(req.file.originalname).toLowerCase();

    try {
        let alumnos = [];

        if (extension === '.json') {
            const contenido = fs.readFileSync(rutaArchivo, 'utf8');
            alumnos = JSON.parse(contenido);
        } else if (extension === '.csv') {
            alumnos = await new Promise((resolve, reject) => {
                const filas = [];

                fs.createReadStream(rutaArchivo)
                    .pipe(csv())
                    .on('data', (fila) => filas.push(fila))
                    .on('end', () => resolve(filas))
                    .on('error', reject);
            });
        } else {
            return res.status(400).json({
                mensaje: 'Formato no válido. Utiliza un archivo JSON o CSV.'
            });
        }

        if (!Array.isArray(alumnos) || alumnos.length === 0) {
            return res.status(400).json({
                mensaje: 'El archivo debe contener un arreglo de alumnos no vacío.'
            });
        }

        // Validar que todos los registros tengan los campos necesarios.
        const validos = alumnos.every(
            (alumno) =>
                typeof alumno.nombre === 'string' &&
                alumno.nombre.trim() !== '' &&
                typeof alumno.carrera === 'string' &&
                alumno.carrera.trim() !== ''
        );

        if (!validos) {
            return res.status(400).json({
                mensaje: 'Cada registro debe tener nombre y carrera válidos.'
            });
        }

        // Insertar todos los alumnos en una sola operación SQL.
        const valores = alumnos.map((alumno) => [
            alumno.nombre.trim(),
            alumno.carrera.trim()
        ]);

        const [resultado] = await db.query(
            'INSERT INTO alumnos (nombre, carrera) VALUES ?',
            [valores]
        );

        return res.status(200).json({
            mensaje: 'Importación completada correctamente',
            totalInsertados: resultado.affectedRows
        });
    } catch (error) {
        console.error('Error al importar archivo:', error.message);

        return res.status(500).json({
            mensaje: 'No se pudo importar el archivo. Verifica su contenido.'
        });
    } finally {
        // Eliminar el archivo temporal cuando termine el procesamiento.
        if (fs.existsSync(rutaArchivo)) {
            fs.unlinkSync(rutaArchivo);
        }
    }
};

app.post(
    '/api/recursos/importar',
    upload.single('archivo'),
    importarArchivo
);



app.get('/api/recursos/exportar/:formato', async (req, res) => {
    try {
        const formato = req.params.formato.toLowerCase();

        if (!['json', 'csv'].includes(formato)) {
            return res.status(400).json({
                mensaje: 'Formato no válido. Utiliza json o csv.'
            });
        }

        const [alumnos] = await db.query('SELECT * FROM alumnos');

        if (formato === 'json') {
            res.setHeader(
                'Content-Disposition',
                'attachment; filename=datos_exportados.json'
            );
            return res.json(alumnos);
        }

        const parser = new Parser({
            fields: ['id', 'nombre', 'carrera']
        });

        const csvData = parser.parse(alumnos);

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=datos_exportados.csv'
        );

        return res.send('\uFEFF' + csvData);
    } catch (error) {
        console.error('Error al exportar alumnos:', error.message);

        return res.status(500).json({
            mensaje: 'Error al exportar los alumnos'
        });
    }
});




async function iniciarServidor() {
    try {
        await db.query('SELECT 1');

        console.log('Conectado exitosamente a la base de datos');

        app.listen(PORT, () => {
            console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Error al conectar con la base de datos:', error.message);
    }
}

iniciarServidor();