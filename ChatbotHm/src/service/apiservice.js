const https = require('https');

/**
 * CONFIGURACIÓN DE CREDENCIALES
 * Configuración de tokens y IDs para la API de WhatsApp Business
 */
require('dotenv').config();
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;


/**
 * INFORMACIÓN DE LA EMPRESA HM INSURANCE BROKERS
 * Información general de la empresa, horarios, oficinas y asesores
 */
const COMPANY_INFO = {
    name: 'HM Insurance Brokers',
    website: 'www.hmbrokers.mx',
    city: 'Saltillo, Coahuila',
    schedule: {
        mondayToThursday: '8:30 a.m. a 2:00 p.m. y 3:30 p.m. a 6:00 p.m.',
        friday: '8:30 a.m. a 2:00 p.m. y 3:30 p.m. a 5:00 p.m.',
        online: '24/7'
    },
    offices: {
        musa: { 
            name: 'HM Insurance Brokers - Oficina Musa', 
            latitude: 25.4680278, 
            longitude: -100.9627102, 
            address: 'Saltillo, Coahuila'
        },
        plazaLasVigas: { 
            name: 'HM Insurance Brokers - Plaza Las Vigas', 
            latitude: 25.4584206, 
            longitude: -100.9839111, 
            address: 'Saltillo, Coahuila'
        }
    },
    // Lista unificada de asesores
    advisors: [
        {
            name: 'Karen Ottosen',
            phone: '528121234567'
        },
        {
            name: 'Selene Salazar',
            phone: '528127654321'
        },
        {
            name: 'Rocio de Hoyos',
            phone: '528129876543'
        },
        {
            name: 'Andres Castillo',
            phone: '528123456789'
        }
    ]
};

// Estado de conversaciones y estados de flujo
const userSessions = new Map();

// Estados posibles para el flujo de consulta de póliza
const STATES = {
    IDLE: 'IDLE',
    WAITING_POLIZA_CHOICE: 'WAITING_POLIZA_CHOICE',
    WAITING_NAME: 'WAITING_NAME',
    WAITING_CURP: 'WAITING_CURP',
    WAITING_BIRTHDATE: 'WAITING_BIRTHDATE',
    WAITING_INSURANCE_TYPE: 'WAITING_INSURANCE_TYPE'
};

// Función para obtener o crear sesión de usuario
function getUserSession(phoneNumber) {
    if (!userSessions.has(phoneNumber)) {
        userSessions.set(phoneNumber, {
            state: STATES.IDLE,
            userData: {},
            attempts: 0,
            lastAttempt: null
        });
    }
    return userSessions.get(phoneNumber);
}

// Función para actualizar estado de sesión
function updateUserSession(phoneNumber, newState, userData = {}) {
    const session = getUserSession(phoneNumber);
    session.state = newState;
    session.userData = { ...session.userData, ...userData };
    userSessions.set(phoneNumber, session);
}

/**
 * FUNCIÓN PRINCIPAL PARA ENVIAR MENSAJES (Formato original mejorado)
 * Usa el mismo formato que tu código anterior pero con mejoras
 */
function SendWhatsappMessage(text, number) {
    const originalText = text;
    text = text.toLowerCase();
    
    // Obtener sesión del usuario
    const session = getUserSession(number);
    
    // Determinar respuesta basada en el mensaje y estado actual
    let data;
    
    // Manejar estados del flujo de consulta de póliza
    if (session.state === STATES.WAITING_POLIZA_CHOICE) {
        if (text === "1a") {
            data = JSON.stringify({
                messaging_product: "whatsapp",
                to: "528135212365",
                type: "text",
                text: {
                    preview_url: false,
                    body: "🔢 Por favor, ingresa tu número de póliza:"
                }
            });
            updateUserSession(number, STATES.IDLE); // Por ahora regresamos a IDLE ya que no implementaremos el flujo completo de 1A
        } else if (text === "1b") {
            data = JSON.stringify({
                messaging_product: "whatsapp",
                to: "528135212365",
                type: "text",
                text: {
                    preview_url: false,
                    body: "👤 Para ayudarte a encontrar tu póliza, necesito algunos datos.\n\nPor favor, ingresa tu *nombre completo* (como aparece en tu identificación):"
                }
            });
            updateUserSession(number, STATES.WAITING_NAME);
        } else {
            data = JSON.stringify({
                messaging_product: "whatsapp",
                to: "528135212365",
                type: "text",
                text: {
                    preview_url: false,
                    body: "❌ Opción no válida. Por favor selecciona:\n\n🔢 *1A* - Sé mi número de póliza\n❓ *1B* - No sé mi número de póliza"
                }
            });
        }
        return sendRequest(data, number, text);
    }
    
    if (session.state === STATES.WAITING_NAME) {
        if (originalText.trim().length < 5) {
            data = JSON.stringify({
                messaging_product: "whatsapp",
                to: "528135212365",
                type: "text",
                text: {
                    preview_url: false,
                    body: "❌ Por favor ingresa tu nombre completo (mínimo 5 caracteres):"
                }
            });
        } else {
            data = JSON.stringify({
                messaging_product: "whatsapp",
                to: "528135212365",
                type: "text",
                text: {
                    preview_url: false,
                    body: "📋 Perfecto. Ahora necesito tu *CURP* (Clave Única de Registro de Población):\n\nEjemplo: ABCD123456HDFGHI01"
                }
            });
            updateUserSession(number, STATES.WAITING_CURP, { fullName: originalText.trim() });
        }
        return sendRequest(data, number, text);
    }
    
    if (session.state === STATES.WAITING_CURP) {
        const curpPattern = /^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9]{2}$/;
        if (!curpPattern.test(originalText.toUpperCase())) {
            data = JSON.stringify({
                messaging_product: "whatsapp",
                to: "528135212365",
                type: "text",
                text: {
                    preview_url: false,
                    body: "❌ CURP no válido. Debe tener 18 caracteres.\n\nEjemplo: ABCD123456HDFGHI01\n\nPor favor ingresa tu CURP nuevamente:"
                }
            });
        } else {
            data = JSON.stringify({
                messaging_product: "whatsapp",
                to: "528135212365",
                type: "text",
                text: {
                    preview_url: false,
                    body: "📅 Excelente. Ahora ingresa tu *fecha de nacimiento*:\n\nFormato: DD/MM/AAAA\nEjemplo: 15/08/1985"
                }
            });
            updateUserSession(number, STATES.WAITING_BIRTHDATE, { curp: originalText.toUpperCase() });
        }
        return sendRequest(data, number, text);
    }
    
    if (session.state === STATES.WAITING_BIRTHDATE) {
        const datePattern = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
        if (!datePattern.test(originalText)) {
            data = JSON.stringify({
                messaging_product: "whatsapp",
                to: "528135212365",
                type: "text",
                text: {
                    preview_url: false,
                    body: "❌ Formato de fecha incorrecto.\n\nUsa el formato: DD/MM/AAAA\nEjemplo: 15/08/1985\n\nPor favor ingresa tu fecha de nacimiento:"
                }
            });
        } else {
            data = JSON.stringify({
                messaging_product: "whatsapp",
                to: "528135212365",
                type: "text",
                text: {
                    preview_url: false,
                    body: "🛡️ Por último, ¿qué tipo de seguro tienes con nosotros?\n\nSelecciona escribiendo el número:\n\n1️⃣ Seguro de Auto\n2️⃣ Seguro de Vida\n3️⃣ Gastos Médicos Mayores\n4️⃣ Seguro Empresarial\n5️⃣ Otro tipo de seguro"
                }
            });
            updateUserSession(number, STATES.WAITING_INSURANCE_TYPE, { birthDate: originalText });
        }
        return sendRequest(data, number, text);
    }
    
    if (session.state === STATES.WAITING_INSURANCE_TYPE) {
        const insuranceTypes = {
            '1': 'Seguro de Auto',
            '2': 'Seguro de Vida',
            '3': 'Gastos Médicos Mayores',
            '4': 'Seguro Empresarial',
            '5': 'Otro tipo de seguro'
        };
        
        if (!insuranceTypes[text]) {
            data = JSON.stringify({
                messaging_product: "whatsapp",
                to: "528135212365",
                type: "text",
                text: {
                    preview_url: false,
                    body: "❌ Opción no válida. Selecciona el número correspondiente:\n\n1️⃣ Seguro de Auto\n2️⃣ Seguro de Vida\n3️⃣ Gastos Médicos Mayores\n4️⃣ Seguro Empresarial\n5️⃣ Otro tipo de seguro"
                }
            });
        } else {
            // Aquí irá la consulta a la base de datos en el futuro
            const userData = session.userData;
            updateUserSession(number, STATES.WAITING_INSURANCE_TYPE, { insuranceType: insuranceTypes[text] });
            
            data = JSON.stringify({
                messaging_product: "whatsapp",
                to: "528135212365",
                type: "text",
                text: {
                    preview_url: false,
                    body: `✅ *Datos recibidos correctamente:*\n\n👤 Nombre: ${userData.fullName}\n📋 CURP: ${userData.curp}\n📅 Fecha de nacimiento: ${userData.birthDate}\n🛡️ Tipo de seguro: ${insuranceTypes[text]}\n\n🔍 *Procesando búsqueda de póliza...*\n\n⏳ En breve un asesor verificará tus datos y te proporcionará la información de tu póliza.\n\n📞 También puedes contactar directamente a un asesor escribiendo *6* en el menú principal.`
                }
            });
            
            // Reiniciar sesión después de completar el proceso
            updateUserSession(number, STATES.IDLE, {});
        }
        return sendRequest(data, number, text);
    }
    
    if (text.includes("hola") || text.includes("hi") || text.includes("buenos") || text.includes("buenas")) {
        data = JSON.stringify({
            messaging_product: "whatsapp",
            to: "528135212365",//numero de telefono local de prueba no es el definitivo 
            type: "text",
            text: {
                preview_url: false,
                body: `🔒💙 ¡Hola! Bienvenido al bot *${COMPANY_INFO.name}*.\n\nEstamos para ayudarte con todo lo relacionado a tus seguros.\n\nVisita nuestra página web: ${COMPANY_INFO.website}\n\nSelecciona una opción para continuar:\n\n1️⃣ Consultar mi póliza\n2️⃣ Ver ubicación de oficinas\n3️⃣ Descargar documento informativo\n4️⃣ Escuchar mensaje de bienvenida\n5️⃣ Video explicativo\n6️⃣ Hablar con un asesor\n7️⃣ Horarios de atención`
            }
        });
    } else if (text === "1") {
        data = JSON.stringify({
            messaging_product: "whatsapp",
            to: "528135212365", // numero de telefono local de prueba no es el definitivo
            type: "text",
            text: {
                preview_url: false,
                body: "📄 Para consultar tu póliza, por favor proporciona tu número de póliza o tu nombre completo. Uno de nuestros asesores te atenderá pronto."
            }
        });
    } else if (text === "2") {
        data = JSON.stringify({
            messaging_product: "whatsapp",
            to: "528135212365", // numero de telefono local de prueba no es el definitivo
            type: "text",
            text: {
                preview_url: false,
                body: "📍 ¿Qué oficina deseas ubicar?\n\n✳️ Escribe: *oficina musa* o *oficina plaza las vigas*"
            }
        });
    } else if (text.includes("oficina musa")) {
        data = JSON.stringify({
            messaging_product: "whatsapp",
            to: "528135212365", // numero de telefono local de prueba no es el definitivo
            type: "location",
            location: {
                latitude: COMPANY_INFO.offices.musa.latitude,
                longitude: COMPANY_INFO.offices.musa.longitude,
                name: COMPANY_INFO.offices.musa.name,
                address: COMPANY_INFO.offices.musa.address
            }
        });
    } else if (text.includes("oficina plaza las vigas")) {
        data = JSON.stringify({
            messaging_product: "whatsapp",
            to: "528135212365", // numero de telefono local de prueba no es el definitivo
            type: "location",
            location: {
                latitude: COMPANY_INFO.offices.plazaLasVigas.latitude,
                longitude: COMPANY_INFO.offices.plazaLasVigas.longitude,
                name: COMPANY_INFO.offices.plazaLasVigas.name,
                address: COMPANY_INFO.offices.plazaLasVigas.address
            }
        });
    } else if (text === "3") {
        data = JSON.stringify({
            messaging_product: "whatsapp",
            to: "528135212365", // numero de telefono local de prueba no es el definitivo
            type: "document",
            document: {
                link: "https://example.com/documento_informativo.pdf",
                caption: "📎 Información sobre nuestros servicios"
            }
        });
    } else if (text === "4") {
        data = JSON.stringify({
            messaging_product: "whatsapp",
            to: "528135212365", // numero de telefono local de prueba no es el definitivo
            type: "audio",
            audio: {
                link: "https://example.com/audio_bienvenida.mp3"
            }
        });
    } else if (text === "5") {
        data = JSON.stringify({
            messaging_product: "whatsapp",
            to: "528135212365", // numero de telefono local de prueba no es el definitivo
            type: "text",
            text: {
                preview_url: true,
                body: "🎥 Mira nuestro video explicativo: https://youtu.be/tu_video_id"
            }
        });
    } else if (text === "6") {
        // Lista simplificada de asesores sin distinguir por oficina
        let advisorList = `👥 *Nuestros asesores disponibles:*\n\n`;
        
        COMPANY_INFO.advisors.forEach((advisor, index) => {
            advisorList += `${index + 1}️⃣ *${advisor.name}*\n📱 ${advisor.phone}\n\n`;
        });
        
        advisorList += `💬 Puedes contactar directamente a cualquiera de nuestros asesores haciendo clic en su número de teléfono.`;
        
        data = JSON.stringify({
            messaging_product: "whatsapp",
            to: "528135212365", // numero de telefono local de prueba no es el definitivo
            type: "text",
            text: {
                preview_url: false,
                body: advisorList
            }
        });
    } else if (text === "7") {
        data = JSON.stringify({
            messaging_product: "whatsapp",
            to: "528135212365", // numero de telefono local de prueba no es el definitivo
            type: "text",
            text: {
                preview_url: false,
                body: `🕒 Nuestro horario de atención es:\n\nLunes a Jueves: ${COMPANY_INFO.schedule.mondayToThursday}\nViernes: ${COMPANY_INFO.schedule.friday}\n\n🌐 Atención en línea ${COMPANY_INFO.schedule.online}\n📍 Estamos ubicados en ${COMPANY_INFO.city}.`
            }
        });
    } else if (text.includes("gracias")) {
        data = JSON.stringify({
            messaging_product: "whatsapp",
            to: "528135212365", // numero de telefono local de prueba no es el definitivo
            type: "text",
            text: {
                preview_url: false,
                body: `😊 ¡Gracias a ti por contactarnos en *${COMPANY_INFO.name}*! Estamos para servirte.`
            }
        });
    } else if (text.includes("adios") || text.includes("bye") || text.includes("nos vemos")) {
        data = JSON.stringify({
            messaging_product: "whatsapp",
            to: "528135212365", // numero de telefono local de prueba no es el definitivo
            type: "text",
            text: {
                preview_url: false,
                body: `👋 ¡Hasta luego! Gracias por confiar en *${COMPANY_INFO.name}*.`
            }
        });
    } else if (text === "menu" || text === "menú" || text === "0") {
        data = JSON.stringify({
            messaging_product: "whatsapp",
            to: "528135212365", // numero de telefono local de prueba no es el definitivo
            type: "text",
            text: {
                preview_url: false,
                body: "Selecciona una opción para continuar:\n1️⃣ Consultar mi póliza\n2️⃣ Ver ubicación de oficinas\n3️⃣ Descargar documento informativo\n4️⃣ Escuchar mensaje de bienvenida\n5️⃣ Video explicativo\n6️⃣ Hablar con un asesor\n7️⃣ Horarios de atención"
            }
        });
    } else {
        data = JSON.stringify({
            messaging_product: "whatsapp",
            to: "528135212365", // numero de telefono local de prueba no es el definitivo
            type: "text",
            text: {
                preview_url: false,
                body: "🤖 No entendí tu mensaje. Por favor responde con un número del 1 al 7 para recibir información:\n\n1️⃣ Consultar mi póliza\n2️⃣ Ver ubicación\n3️⃣ Descargar documento\n4️⃣ Escuchar audio\n5️⃣ Video explicativo\n6️⃣ Hablar con asesor\n7️⃣ Horarios de atención"
            }
        });
    }

    // Configuración de la petición HTTP (formato exacto de tu código original)
    const options = {
        host: "graph.facebook.com",
        path: `/v22.0/${PHONE_NUMBER_ID}/messages`, // Usamos v22.0 como en tu código original
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ACCESS_TOKEN}`
        }
    };

    console.log(`Enviando mensaje a ${number}: ${text}`);

    // Realizar la petición HTTP
    const req = https.request(options, (res) => {
        let responseData = '';
        
        res.on("data", (chunk) => {
            responseData += chunk;
        });
        
        res.on("end", () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                console.log(`Mensaje enviado exitosamente: ${responseData}`);
            } else {
                console.error(`Error HTTP ${res.statusCode}: ${responseData}`);
            }
        });
    });

    req.on("error", (error) => {
        console.error('Error en petición:', error);
    });

    req.write(data);
    req.end();
}

/**
 * FUNCIÓN PARA COMPATIBILIDAD CON EL CONTROLADOR
 */
const processMessage = (messageText, from) => {
    console.log(`Procesando mensaje de ${from}: ${messageText}`);
    SendWhatsappMessage(messageText, from);
};

// Exportar funciones
module.exports = {
    SendWhatsappMessage,
    processMessage
};