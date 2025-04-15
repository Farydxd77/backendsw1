const { response } = require("express");
const bcrypt = require('bcryptjs');
const Usuario = require('../models/usuario'); 
const { generarJWT } = require("../helpers/jwt");


const crearUsuario = async ( req, res = response ) => {
    try {
        const { email, password } =req.body;
        const existeEmail = await Usuario.findOne( { email });

        if ( existeEmail ) {
            return res.status(400).json({
                ok:false,
                msg: 'El correo ya existe'
            });
        }
        // GUARDAR usuario en DB
        const usuario = new Usuario( req.body );
    
        // TODO: encriptar contrasena
        const salt = bcrypt.genSaltSync();
        usuario.password = bcrypt.hashSync( password , salt  );

        await usuario.save();

        //  Generar el JWT
        const token = await generarJWT( usuario.id );

        res.json({
            usuario,
            token
        });
            
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            ok: false,
            msg: 'Hable con el administrador'
        })
    } 
}

const login = async ( req, res = response ) => {

    const { email, password } = req.body;

    try {
        // Verificar si el correo existe
        const usuarioDB = await Usuario.findOne({email});
        if ( !usuarioDB ) {
            return res.status(404).json({
                ok: false,
                msg: 'Email no encontrado'
            });
        }

        // Validar el password
        const validPassword = bcrypt.compareSync( password, usuarioDB.password );
        if ( !validPassword ) {
            return res.status(400).json({
                ok: false,
                msg: 'Password no es correcto'
            })
        }

        const token = await generarJWT( usuarioDB.id );

        res.json({
            ok: true,
            usuario: usuarioDB,
            token
        })
        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Hable con el administrador'
        });
        
    }
}

const renewToken = async  ( req, res = response ) => {

    const uid = req.uid;

    //Generar un nuevo JWT
    const token = await generarJWT( uid );
    //Obtener el usuario por uid

    const usuario = await Usuario.findById( uid );

    res.json({
        ok: true,
        token,
        usuario
    })
}


module.exports = {
    crearUsuario,
    login,
    renewToken
};