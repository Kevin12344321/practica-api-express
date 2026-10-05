const express = require('express');

const app = express();

app.use(express.json());

//Construcción de la API REST y Acceso a Datos
let alumnos = [
    {
        id: 1,
        nombre: 'Kevin',
        carrera: 'Ingeniería en Sistemas Computacionales'
    },
    {
        id: 2,
        nombre: 'Paulina',
        carrera: 'Ingeniería en Sistemas Computacionales'
    },
    {
        id: 3,
        nombre: 'Denisse',
        carrera: 'Ingeniería en Sistemas Computacionales'
    }
];
//Construcción de la API REST y Acceso a Datos

const PORT = 3000;
//GET
app.get('/api/alumnos', (req, res) => {
    res.json(alumnos);
});
//GET
app.get('/api/alumnos/:id', (req, res) => {
    const id = parseInt(req.params.id);

    const alumno = alumnos.find(alumno => alumno.id === id);

    if (!alumno) {
        return res.status(404).json({
            mensaje: 'Alumno no encontrado'
        });
    }

    res.json(alumno);
});
//POST
app.post('/api/alumnos', (req, res) => {
    const nuevoAlumno = {
        id: alumnos.length > 0 ? Math.max(...alumnos.map(alumno => alumno.id)) + 1 : 1,
        nombre: req.body.nombre,
        carrera: req.body.carrera
    };

    alumnos.push(nuevoAlumno);

    res.status(201).json(nuevoAlumno);
});
//PUT
app.put('/api/alumnos/:id', (req, res) => {
    const id = parseInt(req.params.id);

    const alumno = alumnos.find(alumno => alumno.id === id);

    if (!alumno) {
        return res.status(404).json({
            mensaje: 'Alumno no encontrado'
        });
    }

    alumno.nombre = req.body.nombre ?? alumno.nombre;
    alumno.carrera = req.body.carrera ?? alumno.carrera;

    res.json(alumno);
});
//DELETE
app.delete('/api/alumnos/:id', (req, res) => {
    const id = parseInt(req.params.id);

    const indice = alumnos.findIndex(alumno => alumno.id === id);

    if (indice === -1) {
        return res.status(404).json({
            mensaje: 'Alumno no encontrado'
        });
    }

    alumnos.splice(indice, 1);

    res.json({
        mensaje: 'Alumno eliminado correctamente'
    });
});

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});