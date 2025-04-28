const { usuarioConectado, usuarioDesconectado, getUsuaios, grabarMensaje, getAllGrupos } = require("../controllers/sockets");
const { comprobarJWT } = require("../helpers/jwt");
const Grupo = require("./grupos");

class Sockets {
    constructor(io) {
        this.io = io;
        // Inicializar el mapa de salas de grupo
        this.grupoRooms = new Map();
        this.socketEvents();
    }

    socketEvents() {
        // Guardar referencia a 'this' para usar dentro de los callbacks
        const self = this;
        
        // On connection
        this.io.on('connection', async (socket) => {
            const [valido, uid] = comprobarJWT(socket.handshake.query['x-token']);

            if (!valido) {
                console.log('Socket no identificado');
                return socket.disconnect();
            }

            await usuarioConectado(uid);            
          
            // Unir al usuario a una sala de socket.io con su UID
            socket.join(uid);
                   
            this.io.emit('lista-usuarios', await getUsuaios());
            this.io.emit('lista-grupos', await getAllGrupos());

            // ===== EVENTOS DE GRUPOS =====
            
            // Evento para unirse a la sala de un grupo
            socket.on('join-grupo', (groupId) => {
                console.log(`Usuario ${uid} unido al grupo ${groupId}`);
                
                // Unir al usuario a la sala del grupo
                socket.join(groupId);
                
                // Usar 'self' en lugar de 'this' dentro del callback
                if (!self.grupoRooms.has(groupId)) {
                    self.grupoRooms.set(groupId, new Set());
                }
                self.grupoRooms.get(groupId).add(uid);
            });
            
            // Evento para salir de la sala de un grupo
            socket.on('leave-grupo', (groupId) => {
                console.log(`Usuario ${uid} dejó el grupo ${groupId}`);
                
                // Sacar al usuario de la sala del grupo
                socket.leave(groupId);
                
                // Usar 'self' en lugar de 'this'
                if (self.grupoRooms.has(groupId)) {
                    self.grupoRooms.get(groupId).delete(uid);
                }
            });
            
            // Escuchar cuando un usuario crea un nuevo grupo
            socket.on('crear-grupo', async () => {
                // Obtener la lista actualizada de grupos y emitirla a todos
                const grupos = await getAllGrupos();
                self.io.emit('lista-grupos', grupos);
            });
            
            // Evento para actualización del canvas
            socket.on('canvas:update', async ({ groupId, components }) => {
                try {
                    // Emitir a todos los usuarios en la sala del grupo EXCEPTO al emisor
                    socket.to(groupId).emit('canvas:update', {
                        groupId,
                        components
                    });
                    
                    // No guardamos en la base de datos en cada actualización
                    // para evitar sobrecarga. Esto lo gestiona el cliente con debounce.
                } catch (error) {
                    console.error('Error al manejar canvas:update:', error);
                }
            });
              
            // ===== FIN EVENTOS DE GRUPOS =====

            // Mensaje personal
            socket.on('mensaje-personal', async (payload) => {
                const mensaje = await grabarMensaje(payload);
                self.io.to(payload.para).emit('mensaje-personal', mensaje);
                self.io.to(payload.de).emit('mensaje-personal', mensaje);
            });

            // Desconexión
            socket.on('disconnect', async () => {
                console.log('Cliente desconectado');
                
                // Marcar usuario como desconectado
                await usuarioDesconectado(uid);
                self.io.emit('lista-usuarios', await getUsuaios());
                
                // Eliminar al usuario de todas las salas de grupo en las que estaba
                for (const [groupId, users] of self.grupoRooms.entries()) {
                    if (users.has(uid)) {
                        users.delete(uid);
                    }
                }
            });
        });
    }
}

module.exports = Sockets;