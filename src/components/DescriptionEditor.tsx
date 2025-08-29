// // components/DescriptionEditor.tsx
// "use client";

// import { useMemo, useState } from "react";
// import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";
// import rehypeSanitize from "rehype-sanitize";

// type Props = {
//   defaultValue?: string;
//   onChange?: (val: string) => void;
//   maxChars?: number;
// };

// export default function DescriptionEditor({ defaultValue = "", onChange, maxChars = 2000 }: Props) {
//   const [value, setValue] = useState(defaultValue);

//   const remaining = maxChars - value.length;
//   const counterClass = remaining < 0 ? "text-red-400" : remaining < 80 ? "text-yellow-400" : "text-gray-400";

//   const placeholder = useMemo(() => ([
//     "Ejemplo de descripción (Markdown soportado):",
//     "",
//     "### 🧗‍♂️ Social Trek – El Gauchito",
//     "Primera experiencia social de montaña en Tucumán. Caminamos juntos, subimos al Gauchito y cerramos con un after.",
//     "",
//     "**Opciones**",
//     "- Solo trekking **$10.000**",
//     "- Trekking + after *(tostado + bebida incluida)* **$5.000**",
//     "",
//     "**📅 Sábado 30 de Agosto – 9:00 AM**  ",
//     "**📍 Av. Perón 2707**  ",
//     "**⏱️ Duración:** 2h 30m  ",
//     "**🥾 Distancia:** 15 km  ",
//     "**⚡ Cupos limitados**  ",
//     "✅ Actividad con prestador de turismo habilitado.",
//   ].join("\n")), []);

//   return (
//     <div className="space-y-3">
//       <textarea
//         className="
//           w-full h-[200px] rounded-xl bg-white border shadow-md
//           p-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-orange-500
//         "
//         value={value}
//         onChange={(e) => { setValue(e.target.value); onChange?.(e.target.value); }}
//         placeholder={placeholder}
//         maxLength={maxChars * 2} // permite pegar y luego editar por encima del soft-limit
//       />

//       <div className="flex items-center justify-between text-xs">
//         <p className="text-gray-400">
//           **, *, #, -, listas, tablas, links y checklists (GFM) habilitados.
//         </p>
//         <p className={counterClass}>{remaining} caracteres</p>
//       </div>

//       <div className="rounded-xl bg-white border">
//         <div className="px-3 py-2 text-xs text-gray-400 border-b border-neutral-800">Previsualización</div>
//         <article className="p-3 prose prose-neutral dark:prose-invert max-w-none leading-relaxed">
//           <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
//             {value || placeholder}
//           </ReactMarkdown>
//         </article>
//       </div>
//     </div>
//   );
// }
// components/DescriptionEditor.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

type Props = {
  value?: string;              // ← NUEVO: modo controlado
  defaultValue?: string;       // opcional (fallback si no usás value)
  onChange?: (val: string) => void;
  maxChars?: number;
};

export default function DescriptionEditor({
  value,
  defaultValue = "",
  onChange,
  maxChars = 2000,
}: Props) {
  const [internal, setInternal] = useState(value ?? defaultValue);

  // Si viene `value`, sincronizá el estado interno cuando cambie
  useEffect(() => {
    if (value !== undefined) setInternal(value);
  }, [value]);

  // Si NO hay `value`, pero cambió `defaultValue` (carga async inicial), sync
  useEffect(() => {
    if (value === undefined) setInternal(defaultValue);
  }, [defaultValue, value]);

  const remaining = maxChars - internal.length;
  const counterClass =
    remaining < 0 ? "text-red-400" : remaining < 80 ? "text-yellow-400" : "text-gray-400";

  const placeholder = useMemo(
    () =>
      [
        "### 🧗‍♂️ Social Trek – El Gauchito",
        "Primera experiencia social de montaña en Tucumán. Caminamos juntos, subimos al Gauchito y cerramos con un after.",
        "",
        "**Opciones**",
        "- Solo trekking **$10.000**",
        "- Trekking + after *(tostado + bebida incluida)* **$5.000**",
        "",
        "**📅 Sábado 30 de Agosto – 9:00 AM**  ",
        "**📍 Av. Perón 2707**  ",
        "**⏱️ Duración:** 2h 30m  ",
        "**🥾 Distancia:** 15 km  ",
        "**⚡ Cupos limitados**  ",
        "✅ Actividad con prestador de turismo habilitado.",
      ].join("\n"),
    []
  );

  return (
    <div className="space-y-3">
      <textarea
        className="
          w-full min-h-48 rounded-xl bg-white border shadow-md
          p-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-orange-500
        "
        value={internal}
        onChange={(e) => {
          const next = e.target.value;
          setInternal(next);
          onChange?.(next);
        }}
        placeholder={placeholder}
        maxLength={maxChars * 2}
      />

      <div className="flex items-center justify-between text-xs">
        <p className="text-gray-400">**, *, #, -, listas, tablas, links y checklists (GFM).</p>
        <p className={counterClass}>{remaining} caracteres</p>
      </div>

      <div className="rounded-xl bg-white border shadow-md">
        <div className="px-3 py-2 text-xs text-gray-400 border-b border-neutral-800">
          Previsualización
        </div>
        <article className="p-3 prose prose-neutral dark:prose-invert max-w-none leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
            {internal || placeholder}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
