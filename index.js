const express = require('express');
const db = require('./database/db');

const app = express();

app.use(express.json());


const PORT = 3000;
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