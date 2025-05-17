require("dotenv").config(); // Cargar variables del .env

const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const nodemailer = require("nodemailer");

const app = express();
const PAGE_ACCESS_TOKEN  = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

app.use(bodyParser.json());

// Configurar el transporter de correo (modifica esto con tus datos)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const correosPorPalabraClave = {
  agua: "asesinosuper59@gmail.com",
  fuga: "asesinosuper59@gmail.com",
  luz: "alumbrado@ayuntamiento.mx",
  alumbrado: "alumbrado@ayuntamiento.mx",
  foco: "alumbrado@ayuntamiento.mx",
  bache: "obraspublicas@ayuntamiento.mx",
  basura: "limpieza@ayuntamiento.mx",
  denuncia: "oscar.hinojoza.hernandez@gmail.com",
};

const palabrasClave = Object.keys(correosPorPalabraClave);

function obtenerCorreoPorMensaje(mensaje) {
  const mensajeMin = mensaje.toLowerCase();
  for (const palabra of palabrasClave) {
    if (mensajeMin.includes(palabra)) {
      return correosPorPalabraClave[palabra];
    }
  }
  return "oscar.hinojoza.hernandez@gmail.com"; // Correo por defecto
}

function enviarCorreoDenuncia(mensaje, psid) {
  const destinatario = obtenerCorreoPorMensaje(mensaje);

  const mailOptions = {
    from: '"Chatbot Ayuntamiento" <oscar.hinojoza.hernandez@gmail.com>',
    to: destinatario,
    subject: "Nueva denuncia ciudadana",
    text: `Se ha recibido una nueva denuncia desde Facebook Messenger.\n\nMensaje:\n${mensaje}\n\nPSID del ciudadano: ${psid}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error al enviar el correo:", error);
    } else {
      console.log("Correo enviado:", info.response);
    }
  });
}

// Ruta de verificación del webhook
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verificado");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Ruta que recibe los mensajes
app.post("/webhook", (req, res) => {
  const body = req.body;

  if (body.object === "page") {
    body.entry.forEach(function (entry) {
      const webhook_event = entry.messaging[0];
      const sender_psid = webhook_event.sender.id;
      const message = webhook_event.message?.text;

      if (message) {
        if (esDenuncia(message)) {
          callSendAPI(sender_psid, "Gracias por tu reporte. El personal del ayuntamiento lo atenderá.");
          enviarCorreoDenuncia(message, sender_psid);
        } else {
          callSendAPI(sender_psid, `Recibí tu mensaje: "${message}"`);
        }
      }
    });

    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

function esDenuncia(mensaje) {
  const palabrasClave = ["fuga", "agua", "luz", "alumbrado", "bache", "denuncia", "foco", "basura"];
  return palabrasClave.some((palabra) => mensaje.toLowerCase().includes(palabra));
}

function callSendAPI(sender_psid, response_text) {
  const request_body = {
    recipient: { id: sender_psid },
    messaging_type: "RESPONSE",
    message: { text: response_text },
  };

  request(
    {
      uri: "https://graph.facebook.com/v22.0/me/messages",
      qs: { access_token: PAGE_ACCESS_TOKEN },
      method: "POST",
      json: request_body,
    },
    (err, res, body) => {
      if (!err) {
        console.log("Mensaje enviado:", response_text);
      } else {
        console.error("Error al enviar el mensaje:", err);
      }
    }
  );
}

app.listen(process.env.PORT || 3000, () => {
  console.log("Servidor escuchando en el puerto 3000");
});
