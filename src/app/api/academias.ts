import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from "next-auth/react";
import Academia from "../../models/academia";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getSession({ req });

  // Verificar que el usuario esté autenticado
  if (!session) {
    return res.status(401).json({ message: "No autenticado" });
  }

  // Verificar que el usuario tenga el rol de "dueño"
  if (session.user.role !== "dueño de academia") {
    return res.status(403).json({ message: "No tienes permisos para crear una academia" });
  }

  if (req.method === "POST") {
    try {
      const nuevaAcademia = new Academia({
        dueño_id: session.user.id, // Asegúrate de tener el ID del usuario autenticado
        nombre_academia: req.body.nombre_academia,
        pais: req.body.pais,
        provincia: req.body.provincia,
        localidad: req.body.localidad,
        descripcion: req.body.descripcion,
        tipo_disciplina: req.body.tipo_disciplina,
        telefono: req.body.telefono,
        imagen: req.body.imagen,
      });

      await nuevaAcademia.save(); // Guardar en la base de datos

      res.status(201).json({ message: "Academia creada exitosamente" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Hubo un error al crear la academia" });
    }
  } else {
    res.status(405).json({ message: "Método no permitido" });
  }
};

export default handler;
