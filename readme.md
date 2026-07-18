# Reporte Semanal de Productividad

Programa para el registro del tiempo en pantalla de cada aplicación, generando automáticamente un reporte semanal en PDF cada lunes y enviándolo por correo.

La idea es tener un seguimiento claro de cuáles son los programas que más usas durante la semana.

---

## Requisitos

Para usar la app instalada (usuario final):

- Windows 10 o 11, con .NET Framework 4.8, que normalmente ya viene instalado y actualizado por Windows Update.
- Una cuenta de Gmail con verificación en dos pasos activa, para generar una contraseña de aplicación.

No hace falta tener Node.js instalado. El instalador incluye todo lo necesario.

Para compilar el proyecto desde el código fuente (desarrolladores):

- Node.js v18 o superior
- .NET SDK con soporte para `net48` (Developer Pack de .NET Framework 4.8)
- Inno Setup, si vas a generar el instalador

---

## Instalación rápida (recomendada)

1. Descarga `ReporteSemanal-Setup.exe` desde la sección Releases.
2. Ejecútalo con doble clic. No pide permisos de administrador.
3. Se abrirá un formulario pidiendo tu correo de Gmail y tu contraseña de aplicación. Ingresa los dos.
4. Al guardar, el programa arranca automáticamente y aparece un icono en la bandeja del sistema, junto al reloj.
5. Listo. El programa queda configurado para iniciar junto con Windows.

La app se instala en `%APPDATA%\ReporteSemanal`, en tu propio usuario, sin tocar `Program Files`.

---

## Instalación manual (para desarrolladores)

1. Clona el repositorio:
```
git clone https://github.com/TU_USUARIO/reporte-semanal.git
```

2. Instala las dependencias:
```
npm ci
```

3. Crea un archivo `.env` en la raíz del proyecto:
```
EMAIL_USER=tucorreo@gmail.com
EMAIL_PASS=tucontraseñadeaplicacion
```

4. Compila el proyecto:
```
npm run build
```

5. Arranca el backend directo con tu Node del sistema:
```
node dist/main.js
```

El backend levanta un servidor HTTP local en `http://localhost:4577` y, si encuentra `runtime/ReporteTray.exe` compilado, lanza también el icono de la bandeja.

---

## Cómo obtener la contraseña de aplicación de Gmail

La contraseña de aplicación no es tu contraseña normal de Gmail.

1. Ve a myaccount.google.com
2. Entra a Seguridad
3. Activa la verificación en dos pasos si no la tienes activa
4. Busca Contraseñas de aplicaciones
5. Selecciona Correo y Windows, y haz clic en Generar
6. Copia el código de 16 caracteres y pégalo en el formulario de configuración o en el `.env`

---

## Uso

Una vez instalado, el programa corre en segundo plano y registra automáticamente el tiempo de uso de cada aplicación cada 5 segundos. Cada lunes, al arrancar, genera un PDF con el reporte de la semana y lo envía al correo configurado. Los datos se reinician automáticamente después de enviar el reporte.

Desde el icono de la bandeja del sistema, con clic derecho, tienes:

- **Generar reporte ahora**: fuerza el envío del reporte sin esperar al lunes.
- **Abrir carpeta de datos**: te lleva directo a donde vive tu `.env` y `data.json`.
- **Salir**: apaga el programa por completo.

---

## Control del programa

Usa `control.ps1` (o `control.exe` si tienes la versión compilada) para encender o apagar el programa manualmente. La ventana muestra el estado actual y un botón que actúa como toggle. Debe estar en la misma carpeta donde está instalado el programa, junto a `Launcher.exe`.

---

## Arranque automático con Windows

El instalador configura el arranque automático por defecto, usando el registro de Windows (`HKCU\...\Run`), sin depender de ningún gestor de procesos externo. Se activa solo, no requiere configuración adicional.

Si quieres desactivarlo manualmente, borra la entrada `ReporteSemanal` de:
```
HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run
```

---

## Tecnologías usadas

- NestJS
- TypeScript
- pdfkit
- nodemailer
- get-windows
- C# / WinForms sobre .NET Framework 4.8 (tray e icono de bandeja)
- Inno Setup
