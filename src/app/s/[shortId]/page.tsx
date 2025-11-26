// app/s/[shortId]/page.tsx
import { redirect } from "next/navigation";
import { connectDB } from "../../../libs/mongodb";
import SalidaSocial from "../../../models/salidaSocial";
import { Types } from "mongoose";

export const dynamic = "force-dynamic"; // evita SSG/caché para nuevos códigos

export default async function ShortRedirect({
  params,
}: {
  params: Promise<{ shortId: string }>;
}) {
  await connectDB();

  const { shortId } = await params;

  const ev = (await SalidaSocial.findOne({ shortId })
    .select("_id")
    .lean()) as { _id: Types.ObjectId } | null;

  if (!ev?._id) {
    redirect("/404");
  }

  const id = ev._id.toString(); // <-- convertir a string
  redirect(`/social/${id}`);
}
