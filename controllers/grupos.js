const { response } = require("express");
const Grupo = require('../models/grupos');
const Usuario = require('../models/usuario');


// Actualizar el canvas de un grupo - Versión corregida
const actualizarCanvas = async (req, res = response) => {
    try {
        const grupoId = req.params.id;
        const { contenidoCanvas } = req.body;
        
        // Buscar el grupo
        const grupo = await Grupo.findById(grupoId);
        
        if (!grupo) {
            return res.status(404).json({
                ok: false,
                msg: 'Grupo no encontrado'
            });
        }
        
        // Corregir estructura anidada si existe
        let componentsArray = [];
        
        // Verificar si contenidoCanvas.components es un objeto que contiene components
        if (contenidoCanvas && contenidoCanvas.components) {
            if (Array.isArray(contenidoCanvas.components)) {
                componentsArray = contenidoCanvas.components;
            } else if (contenidoCanvas.components.components && Array.isArray(contenidoCanvas.components.components)) {
                // Si hay una estructura anidada incorrecta, extraer el array correcto
                componentsArray = contenidoCanvas.components.components;
                console.log('Corrigiendo estructura anidada de components');
            }
        }
        
        // Asegurarse de que tenemos una estructura válida para el contenidoCanvas
        const contenidoCanvasValido = {
            components: componentsArray,
            canvasWidth: contenidoCanvas.canvasWidth || 1000,
            canvasHeight: contenidoCanvas.canvasHeight || 2000
        };
        
        // Actualizar el contenido del canvas
        grupo.contenidoCanvas = contenidoCanvasValido;
        await grupo.save();
        
        res.json({
            ok: true,
            msg: 'Canvas actualizado correctamente',
            grupo
        });
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            msg: 'Error al actualizar canvas. Hable con el administrador'
        });
    }
};
// Obtener un grupo específico - Versión corregida
const obtenerGrupo = async (req, res = response) => {
    try {
        const grupoId = req.params.id;
        
        // Buscar el grupo
        const grupo = await Grupo.findById(grupoId);
        
        if (!grupo) {
            return res.status(404).json({
                ok: false,
                msg: 'Grupo no encontrado'
            });
        }
        
        // Corregir la estructura del contenidoCanvas si es necesario
        if (grupo.contenidoCanvas) {
            // Verificar si hay una estructura anidada incorrecta
            if (grupo.contenidoCanvas.components && 
                typeof grupo.contenidoCanvas.components === 'object' && 
                !Array.isArray(grupo.contenidoCanvas.components) &&
                grupo.contenidoCanvas.components.components) {
                
                console.log('Corrigiendo estructura anidada en obtenerGrupo');
                
                // Crear una estructura correcta
                const contenidoCanvasCorregido = {
                    components: Array.isArray(grupo.contenidoCanvas.components.components) 
                                ? grupo.contenidoCanvas.components.components 
                                : [],
                    canvasWidth: grupo.contenidoCanvas.canvasWidth || 1000,
                    canvasHeight: grupo.contenidoCanvas.canvasHeight || 2000
                };
                
                // Actualizar en la base de datos
                grupo.contenidoCanvas = contenidoCanvasCorregido;
                await grupo.save();
            }
        }
        
        res.json({
            ok: true,
            grupo
        });
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            msg: 'Error al obtener grupo. Hable con el administrador'
        });
    }
};


// Crear un nuevo grupo
const crearGrupo = async (req, res = response) => {
    try {
        const { nombre } = req.body;
        const uid = req.uid; // ID del usuario que viene del middleware validarJWT
        
        // Crear grupo en la BD con el contenidoCanvas por defecto
        const grupo = new Grupo({
            nombre,
            creador: uid,
            contenidoCanvas: {
                components: [],
                canvasWidth: 1000,
                canvasHeight: 2000
            }
        });
        
        await grupo.save();
        
        // Obtener información del creador para la respuesta
        const usuario = await Usuario.findById(uid);
        
        res.json({
            ok: true,
            grupo: {
                ...grupo.toJSON(),
                creador: usuario
            }
        });
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            msg: 'Error al crear grupo. Hable con el administrador'
        });
    }
};

// Obtener todos los grupos
const obtenerGrupos = async (req, res = response) => {
    try {
        // Buscar todos los grupos activos
        const grupos = await Grupo.find({ 
            activo: true
        }).sort({ updatedAt: -1 }); // Más recientes primero
        
        res.json({
            ok: true,
            grupos
        });
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            msg: 'Error al obtener grupos. Hable con el administrador'
        });
    }
};

module.exports = {
    crearGrupo,
    obtenerGrupos,
    obtenerGrupo,
    actualizarCanvas
};