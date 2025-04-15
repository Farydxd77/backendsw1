
const Usuario = require('../models/usuario');
const Mensaje = require('../models/mensaje');
const Grupo = require('../models/grupos')
const usuarioConectado = async( uid ) => {

    const usuario = await Usuario.findById(uid);
   
    usuario.online = true;
    await usuario.save();
    // console.log(usuario)
    return usuario;
}

const usuarioDesconectado = async( uid  ) => {
    const usuario = await Usuario.findById(uid);
    usuario.online = false;
    await usuario.save();
    // console.log(usuario)
    return usuario;
}

const getUsuaios = async() => {

    const  usuarios = await Usuario
    .find()
    .sort('-online');

    return usuarios;
}

const grabarMensaje = async( payload) => {

    try {
        const mensaje = new Mensaje( payload );
        await mensaje.save();

        return mensaje;
        
    } catch (error) {
        console.log(error)
        return false;
    }
}
// Obtener todos los grupos activos
const getAllGrupos = async() => {
    const grupos = await Grupo.
    find().
    sort('-updatedAt');
    
    return grupos;
}
module.exports = {
    usuarioConectado,
    usuarioDesconectado,
    getUsuaios,
    grabarMensaje,
    getAllGrupos
}