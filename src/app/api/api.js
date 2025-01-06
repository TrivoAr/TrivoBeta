const { readFileSync, writeFileSync } = require("fs");
const axios = require("axios");

const accessToken = process.env.MP_ACCESS_TOKEN || "APP_USR-4970861093465590-010315-67d54047f2b166ed4a4b294ad01bf781-2190675569";
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

const api = {
  message: {
    async list() {
      const db = readFileSync("db/message.db");
      return JSON.parse(db.toString());
    },
    async add(message) {
      const db = await api.message.list();
      if (db.some((_message) => _message.id === message.id)) {
        throw new Error("Message already added");
      }
      const draft = db.concat(message);
      writeFileSync("db/message.db", JSON.stringify(draft, null, 2));
    },
    async submit(metadata, amount) {
      try {
        // Datos de la preferencia
        const preferenceData = {
          items: [
            {
              id: "grupoPago",
              title: `Pago para ${metadata.nombreGrupo}`,
              quantity: 1,
              unit_price: parseFloat(amount), // Convierte el monto a número
            },
          ],
          metadata: {
            grupoId: metadata.grupoId,
            nombreGrupo: metadata.nombreGrupo,
            fecha: metadata.fecha,
          },
          back_urls: {
            success: `${baseUrl}/success`, // URL de éxito
            failure: `${baseUrl}/failure`, // URL de falla
            pending: `${baseUrl}/pending`, // URL de pendiente
          },
          auto_return: "approved",
        };

        // Realizamos la solicitud POST a la API de Mercado Pago
        const response = await axios.post(
          "https://api.mercadopago.com/checkout/preferences",
          preferenceData,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`, // Usamos el access token en los headers
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.data.init_point) {
          throw new Error("No se pudo generar el punto de inicio de pago");
        }

        console.log("Respuesta de Mercado Pago:", response.data);

        // Retornamos el punto de inicio de pago
        return response.data.init_point;
      } catch (error) {
        console.error("Error al crear la preferencia:", error);
        throw new Error("Error al crear la preferencia de pago");
      }
    }
  }
};

module.exports = api;
