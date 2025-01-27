const { readFileSync, writeFileSync } = require("fs");
const axios = require("axios");

const accessToken = process.env.MP_ACCESS_TOKEN || "APP_USR-4970861093465590-010315-67d54047f2b166ed4a4b294ad01bf781-2190675569";
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://klubo-mvp-v1.vercel.app/";

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
    async submit(metadata, amount, accessToken) {
      try {
        const preferenceData = {
          items: [
            {
              id: "grupoPago",
              title: `Pago para ${metadata.nombreGrupo}`,
              quantity: 1,
              unit_price: parseFloat(amount),
            },
          ],
          metadata: {
            grupoId: metadata.grupoId,
            nombreGrupo: metadata.nombreGrupo,
            fecha: metadata.fecha,
          },
          back_urls: {
            success: `${baseUrl}/success`,
            failure: `${baseUrl}/failure`,
            pending: `${baseUrl}/pending`,
          },
          auto_return: "approved",
        };
    
        const response = await axios.post(
          "https://api.mercadopago.com/checkout/preferences",
          preferenceData,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`, // Usa el accessToken proporcionado
              "Content-Type": "application/json",
            },
          }
        );
    
        if (!response.data.init_point) {
          throw new Error("No se pudo generar el punto de inicio de pago");
        }
    
        return response.data.init_point;
      } catch (error) {
        console.error("Error al crear la preferencia:", error);
        throw new Error("Error al crear la preferencia de pago");
      }
    }
  }
};

module.exports = api;
