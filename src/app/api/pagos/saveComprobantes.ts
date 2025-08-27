// import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
// import toast, { Toaster } from "react-hot-toast";
// import { useSession } from "next-auth/react";

// const handleEnviarPago = async (file: File) => {
// const { data: session } = useSession();

// if (!file) return;

//   const storage = getStorage();
//   const fileRef = ref(storage, `comprobantes/${session.user.id}-${Date.now()}-${file.name}`);
  
//   // Subir archivo
//   await uploadBytes(fileRef, file);
//   const url = await getDownloadURL(fileRef);

//   // Guardar en tu API
//   const res = await fetch("/api/pagos", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       salidaId: params.id,
//       comprobanteUrl: url,
//     }),
//   });

//   if (res.ok) {
//     toast.success("Solicitud enviada. Espera aprobación del organizador.");
//     onClose();
//   } else {
//     toast.error("Error al enviar comprobante.");
//   }
// };
