"use client";

import Link from "next/link";

function TermsAndConditions() {
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-10 font-sans">
      <h1 className="text-2xl font-bold text-center mb-6 text-orange-500">
        Términos y Condiciones de Uso de Klubo
      </h1>
      
      <p className="text-sm text-gray-500 text-center mb-4">
        Fecha de entrada en vigencia: 10/03/2025
      </p>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-black mb-2">1. Introducción</h2>
        <p className="text-gray-700">
          Klubo es una plataforma diseñada para facilitar la búsqueda y creación de comunidades deportivas y de entretenimiento al aire libre. El uso de Klubo implica la aceptación plena de los presentes Términos y Condiciones. Si no estás de acuerdo, por favor, abstente de utilizar nuestra plataforma.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-black mb-2">2. Registro y Cuenta de Usuario</h2>
        <p className="text-gray-700">
          Para acceder a ciertas funciones, es necesario registrarse y proporcionar información verídica y actualizada. Los usuarios son responsables de mantener la confidencialidad de sus credenciales. Klubo se reserva el derecho de suspender cuentas por actividad fraudulenta.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-black mb-2">3. Servicios Ofrecidos</h2>
        <p className="text-gray-700">
          Klubo actúa como un intermediario para conectar a usuarios con grupos y actividades recreativas. No nos hacemos responsables de la organización, cancelación o problemas en eventos creados por terceros.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-black mb-2">4. Pagos y Responsabilidad</h2>
        <p className="text-gray-700">
          Klubo utiliza Mercado Pago para procesar pagos y no se hace responsable por errores en transacciones. Cualquier inconveniente debe resolverse directamente con Mercado Pago.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-black mb-2">5. Uso de Google Analytics</h2>
        <p className="text-gray-700">
          Utilizamos Google Analytics para mejorar la experiencia en la plataforma. Al usar Klubo, aceptas el uso de cookies y herramientas de seguimiento conforme a nuestra Política de Privacidad.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-black mb-2">6. Limitación de Responsabilidad</h2>
        <p className="text-gray-700">
          Klubo no se responsabiliza por lesiones o daños ocurridos durante eventos promovidos en la plataforma. Nos reservamos el derecho de modificar o suspender el servicio sin previo aviso.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-black mb-2">7. Cambios en los Términos</h2>
        <p className="text-gray-700">
          Nos reservamos el derecho de actualizar estos términos en cualquier momento. Se notificará a los usuarios de cambios sustanciales mediante la plataforma o correo electrónico.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-black mb-2">8. Contacto</h2>
        <p className="text-gray-700">
          Para consultas, puedes contactarnos en <a href="mailto:klubo.ar@hotmail.com" className="text-orange-500 hover:underline">klubo.ar@hotmail.com</a>.
        </p>
      </section>

      <p className="text-center text-gray-600 text-sm mt-6">
        Al utilizar Klubo, confirmas que has leído, entendido y aceptado estos Términos y Condiciones.
      </p>
      
      <div className="text-center mt-4">
        <Link href="/" className="text-orange-500 hover:underline text-sm">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

export default TermsAndConditions;
