// src/emails/resetPasswordTemplate.ts
export function resetPasswordTemplate(code: string) {
  return `
    <div style="font-family: Arial, sans-serif; text-align: center; color: #333;">
      <h2 style="color:#FF6600;">Restablecer Contraseña</h2>
      <p>Tu código de recuperación es:</p>
      <p style="font-size: 24px; font-weight: bold; color: #FF6600;">${code}</p>
      <p style="font-size: 12px; color: #777;">Este código expirará en 15 minutos.</p>
    </div>
  `;
}
