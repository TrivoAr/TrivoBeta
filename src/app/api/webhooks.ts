import { Payment } from "mercadopago";
import api from "../../app/api/api.js";

export async function POST(request: Request) {
  const body: { data: { id: string } } = await request.json();

  /*const payment = await new Payment(mercadopago).get({ id: body.data.id });

  if (payment.status === "approved") {
    const metadata = payment.metadata as {
      grupoId: string;
      nombreGrupo: string;
      fecha: string;
    };

    await api.message.add({
      id: payment.id!,
      text: `Pago aprobado para ${metadata.nombreGrupo} el ${metadata.fecha}`,
    });
  }*/

  return new Response(null, { status: 200 });
}
