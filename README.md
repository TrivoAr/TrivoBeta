# Klubo Trivo

Trivo es una aplicación diseñada para la gestión de academias y entrenamientos. Este MVP (Minimum Viable Product) proporciona una plataforma para administrar usuarios, academias y entrenamientos con autenticación segura y almacenamiento en MongoDB.

## Tecnologías utilizadas

- **Next.js**: Framework de React para aplicaciones web modernas.
- **NextAuth**: Gestión de autenticación y sesiones.
- **MongoDB**: Base de datos NoSQL para almacenamiento de datos.
- **Redux**: Manejo del estado global de la aplicación.
- **bcrypt**: Encriptación de contraseñas.

## Características principales

- Autenticación de usuarios con NextAuth.
- Administración de academias y sus grupos.
- Visualización y asignación de entrenamientos a los usuarios.
- Historial de entrenamientos para cada usuario.

## Instalación y ejecución

1. Clonar el repositorio:
   ```sh
   git clone https://github.com/men7ar31/Klubo_Mvp.git
   ```
2. Navegar al directorio del proyecto:
   ```sh
   cd Klubo_Mvp
   ```
3. Instalar dependencias:
   ```sh
   npm install
   ```
4. Configurar las variables de entorno en un archivo `.env`:
   ```sh
   NEXTAUTH_URL=http://localhost:3000
   MONGODB_URI=your_mongodb_connection_string
   NEXTAUTH_SECRET=your_secret_key
   ```
5. Ejecutar la aplicación en modo desarrollo:
   ```sh
   npm run dev
   ```

## Uso

- Los administradores pueden gestionar academias y asignar entrenamientos a los usuarios.
- Los usuarios pueden visualizar su historial de entrenamientos.

## Contribución

Si deseas contribuir, por favor sigue estos pasos:

1. Realiza un fork del repositorio.
2. Crea una rama con tu nueva funcionalidad:
   ```sh
   git checkout -b feature/nueva-funcionalidad
   ```
3. Realiza los cambios y confirma los commits:
   ```sh
   git commit -m "Descripción de la mejora"
   ```
4. Sube los cambios a tu fork:
   ```sh
   git push origin feature/nueva-funcionalidad
   ```
5. Abre un Pull Request en el repositorio original.

## Licencia

Este proyecto está bajo la licencia MIT. Puedes ver más detalles en el archivo LICENSE.

---

¡Gracias por contribuir a Klubo MVP!


