const { usuarioConectado, usuarioDesconectado, getUsuaios, grabarMensaje, getAllGrupos } = require("../controllers/sockets");
const { comprobarJWT } = require("../helpers/jwt");
const Grupo = require("./grupos");


class Sockets {

    constructor( io ) {

        this.io = io;

        this.socketEvents();
    }

    socketEvents() {
        // On connection
        this.io.on('connection', async ( socket ) => {

            const [ valido, uid ] = comprobarJWT( socket.handshake.query['x-token'] );

            if ( !valido ) {
                console.log('Socket no identificado');
                return socket.disconnect();
            }

            await usuarioConectado( uid );
            
            // console.log('cliente conectado ', uid)

            // socket.join('sala-gamer');
            // this.io.to('sala-gamer).emit('') esto le enviaria un mensaje a todos los q esten
            // unidos a la sala gamer

    
            // Unir al usuario a una sala de socket.io
            socket.join( uid );
                // TODO: BALIDAR el jwt
                // si el token no es balido, desconectar

                // todo: saber que usuario esta actio mediante el uid

                // todo: emitir todos los usuarios conectados
               
            
                this.io.emit('lista-usuarios', await getUsuaios());
                // console.log(usuarios)
                this.io.emit('lista-grupos', await getAllGrupos());
                // todo: socket join, uid

              // ===== EVENTOS DE GRUPOS =====
              socket.on('canvas:update', async ({ groupId, components }) => {
                try {
                  await Grupo.findByIdAndUpdate(groupId, {
                    contenidoCanvas: {
                      components,
                      canvasWidth: 1000,
                      canvasHeight: 2000
                    }
                  });
              
                  // Emitir a la sala correcta (con el prefijo)
                  socket.to( groupId ).emit('canvas:update', {
                    groupId,
                    components
                  });
                } catch (error) {
                  console.error('Error al manejar canvas:update:', error);
                }
              });
              
              
         
            
            // ===== FIN EVENTOS DE GRUPOS =====

                // todo: escuchar cuando el cliente manda un mensaje 
                // mensaje personal
                socket.on( 'mensaje-personal' ,async( payload ) => {
                   const mensaje = await grabarMensaje( payload );
                   this.io.to( payload.para ).emit('mensaje-personal', mensaje );
                   this.io.to( payload.de ).emit('mensaje-personal', mensaje );
                })

                // todo disconnect
                // marcar el BD     que el usuario se desconecto
                // TODO: en la BD que el usuario se desconecto
                // TODO: emitir todos los usuarios conectados
                socket.on('disconnect', async() => {
                    
                    console.log('cliente desconectado')
                    await usuarioDesconectado( uid );
                    this.io.emit('lista-usuarios', await getUsuaios())
                })
        });
    }
}




module.exports = Sockets;