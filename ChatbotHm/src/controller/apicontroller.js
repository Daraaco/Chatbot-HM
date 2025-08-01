/**
 * CONTROLADOR DE API PARA WHATSAPP WEBHOOK
 * Este módulo maneja las peticiones HTTP del webhook de WhatsApp Business API
 * Procesa la verificación del webhook y los mensajes entrantes
 */

// Importar el servicio que maneja la lógica de mensajes
const sendmessage = require("../service/apiservice");

/**
 * FUNCIÓN DE VERIFICACIÓN DEL WEBHOOK
 * WhatsApp requiere verificar el webhook antes de comenzar a enviar eventos
 * Meta envía una petición GET con parámetros de verificación
 * 
 * @param {Object} req - Objeto de petición HTTP de Express
 * @param {Object} res - Objeto de respuesta HTTP de Express
 * 
 * Parámetros esperados en req.query:
 * - hub.verify_token: Token de verificación enviado por Meta
 * - hub.challenge: Código de desafío que debemos devolver si el token es correcto
 */
const verify = (req, res) => {
    try {
        // Token de verificación configurado en tu app de Meta for Developers
        // IMPORTANTE: Este token debe coincidir con el configurado en Meta
        const tokenhm = "HMVERIFYTOKENAPI";
        
        // Extraer parámetros de la petición de verificación
        const token = req.query["hub.verify_token"];      // Token enviado por Meta
        const challenge = req.query["hub.challenge"];     // Código de desafío a devolver

        // Verificar que ambos parámetros existen y el token coincide
        if (challenge && token && token === tokenhm) {
            // Verificación exitosa: devolver el challenge
            res.send(challenge);
            console.log('Webhook verificado correctamente');
        } else {
            // Verificación fallida: devolver error 400
            console.log('Error en verificación de webhook - Token incorrecto');
            res.status(400).send();
        }
    } catch (error) {
        // Manejar cualquier error durante la verificación
        console.error('Error en verify:', error);
        res.status(400).send();
    }
};

/**
 * FUNCIÓN PARA RECIBIR EVENTOS DE WHATSAPP
 * Procesa todos los eventos enviados por WhatsApp (mensajes, estados, etc.)
 * WhatsApp envía eventos mediante peticiones POST a este endpoint
 * 
 * @param {Object} req - Objeto de petición HTTP que contiene el evento
 * @param {Object} res - Objeto de respuesta HTTP
 * 
 * Estructura esperada del body:
 * {
 *   "entry": [
 *     {
 *       "changes": [
 *         {
 *           "value": {
 *             "messages": [...],    // Mensajes entrantes
 *             "statuses": [...]     // Estados de mensajes (delivered, read, etc.)
 *           }
 *         }
 *       ]
 *     }
 *   ]
 * }
 */
const received = (req, res) => {
    try {
        // VALIDACIÓN INICIAL DEL PAYLOAD
        // Verificar que el body contiene la estructura esperada
        if (!req.body || !req.body.entry || !req.body.entry.length) {
            console.log('Evento recibido sin datos válidos');
            return res.send("EVENT_RECEIVED");
        }

        // EXTRAER DATOS DEL EVENTO
        // WhatsApp envía eventos en un array, tomamos el primero
        const entry = req.body.entry[0];           // Entrada principal del evento
        const changes = entry.changes[0];          // Cambios en la conversación
        const value = changes.value;               // Contenido del cambio

        // PROCESAR MENSAJES ENTRANTES
        // Verificar si el evento contiene mensajes de usuarios
        if (value.messages && value.messages.length > 0) {
            // Obtener el primer mensaje (WhatsApp envía uno a la vez)
            const message = value.messages[0];
            const messageType = message.type;      // Tipo de mensaje (text, interactive, image, etc.)
            const from = message.from;             // Número de teléfono del remitente

            let messageText = '';
            
            // DETERMINAR EL CONTENIDO SEGÚN EL TIPO DE MENSAJE
            switch (messageType) {
                case 'text':
                    // Mensaje de texto simple
                    messageText = message.text.body;
                    console.log(`Mensaje de texto recibido de ${from}: ${messageText}`);
                    break;
                    
                case 'interactive':
                    // Mensaje interactivo (botones o listas)
                    if (message.interactive.type === 'button_reply') {
                        // Usuario hizo clic en un botón
                        messageText = message.interactive.button_reply.id;
                        console.log(`Botón presionado por ${from}: ${messageText}`);
                    } else if (message.interactive.type === 'list_reply') {
                        // Usuario seleccionó de una lista
                        messageText = message.interactive.list_reply.id;
                        console.log(`Opción de lista seleccionada por ${from}: ${messageText}`);
                    }
                    break;
                    
                default:
                    // Tipo de mensaje no soportado (imagen, video, documento, etc.)
                    messageText = 'mensaje_no_soportado';
                    console.log(`Tipo de mensaje no soportado: ${messageType} de ${from}`);
            }

            // PROCESAR EL MENSAJE
            // Enviar el contenido extraído al servicio para generar respuesta
            sendmessage.processMessage(messageText, from);
        }

        // PROCESAR ESTADOS DE MENSAJES
        // WhatsApp también envía notificaciones sobre el estado de mensajes enviados
        if (value.statuses) {
            // Estados posibles: sent, delivered, read, failed
            console.log('Estado del mensaje actualizado:', value.statuses);
            
            // Aquí puedes agregar lógica para manejar estados específicos
            // Por ejemplo, marcar mensajes como leídos en tu base de datos
        }

        // CONFIRMAR RECEPCIÓN DEL EVENTO
        // WhatsApp espera esta respuesta para confirmar que procesamos el evento
        res.send("EVENT_RECEIVED");
        
    } catch (error) {
        // MANEJO DE ERRORES
        // Si algo falla, log del error pero siempre confirmar recepción
        console.error('Error procesando evento de WhatsApp:', error);
        
        // Es importante siempre responder "EVENT_RECEIVED" para evitar reenvíos
        res.send("EVENT_RECEIVED");
    }
};

/**
 * EXPORTAR FUNCIONES
 * Estas funciones son utilizadas por las rutas de Express
 * 
 * - verify: Para verificación inicial del webhook (petición GET)
 * - received: Para procesar eventos entrantes (petición POST)
 */
module.exports = {
    verify,      // Función de verificación del webhook
    received     // Función para procesar eventos de WhatsApp
};