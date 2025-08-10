import toast from "react-hot-toast";

// Interfaz para tipado de props
interface ConfirmActionOptionsToast {
  message?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  onConfirm: () => Promise<void> | void;
  onCancel?: () => void;
}

export function confirmActionToast({
  message = "¿Estás seguro?",
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  loadingMessage = "Procesando...",
  successMessage = "Acción realizada con éxito",
  errorMessage = "Ocurrió un error",
  onConfirm,
  onCancel,
}: ConfirmActionOptionsToast) {
  toast.custom(
    (t) => {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg flex flex-col w-[320px] gap-3">
          <p className="text-sm text-gray-800 font-medium">{message}</p>
          {description && (
            <p className="text-xs text-gray-500 leading-tight">{description}</p>
          )}
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              // onClick={async () => {
              //   toast.dismiss(t.id); // Cerrar el toast de confirmación
              //   const toastId = toast.loading(loadingMessage); // Mostrar loading

              //   try {
              //     await Promise.resolve(onConfirm());
              //     toast.dismiss(toastId); // Cerrar loading manualmente
              //     toast.success(successMessage, { duration: 3000 }); // Mostrar success
              //   } catch (error) {
              //     console.error(error);
              //     toast.dismiss(toastId); // Cerrar loading
              //     toast.error(errorMessage, { duration: 3000 }); // Mostrar error
              //   }
              // }}
              onClick={async () => {
                toast.dismiss(t.id); // Cierra el toast de confirmación
                const toastId = toast.loading(loadingMessage); // Muestra loading

                try {
                  await Promise.resolve(onConfirm());

                  toast.dismiss(toastId); // Cierra el toast de loading

                  // ✅ Mostramos el toast de éxito un momento antes de redirigir
                  toast.success(successMessage, { duration: 2000 });

                  // Esperar un momento si onConfirm hizo router.push
                  setTimeout(() => {
                    toast.dismiss(); // Limpiamos todo por las dudas
                  }, 2000);
                } catch (error) {
                  console.error(error);
                  toast.dismiss(toastId);
                  toast.error(errorMessage, { duration: 3000 });
                }
              }}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm rounded"
            >
              {confirmText}
            </button>
            <button
              type="button"
              onClick={() => {
                toast.dismiss(t.id);
                if (onCancel) onCancel();
              }}
              className="text-gray-600 hover:text-black px-3 py-1 text-sm"
            >
              {cancelText}
            </button>
          </div>
        </div>
      );
    },
    {
      duration: Infinity,
    }
  );
}
