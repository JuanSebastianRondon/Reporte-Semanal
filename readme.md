# Reporte Semanal de Productividad

Programa creado para el registro del tiempo en pantalla que tienen otros programas, dando un automaticamente un reporte semanal a trabes de un PDF cada lunes al momento de prender el dispositivo ese dia.

La idea del programa es la de tener un seguimiento de cuales son los programas que mas usas en la semana.

---- 
## Requisitos
- Windows 10 o superior
- Node.js v18 o superior
- Una cuenta de Gmail con contraseña de aplicación habilitada
- pm2 instalado globalmente
  
```
npm install -g pm2
```
 
---
 
## Instalación
 
1. Clona el repositorio o descarga el código fuente.
2. Instala las dependencias:
```
npm install
```
 
3. Crea un archivo `.env` en la raíz del proyecto con tus credenciales:
```
EMAIL_USER=tucorreo@gmail.com
EMAIL_PASS=tucontraseñadeaplicacion
```
 
4. Compila el proyecto:
```
npm run build
```
 
5. Inicia el programa con pm2:
```
pm2 start dist/main.js --name reporte-semanal
pm2 save
```
 
---
 
## Cómo obtener la contraseña de aplicación de Gmail
 
La contraseña de aplicación no es tu contraseña normal de Gmail. Para obtenerla:
 
1. Ve a tu cuenta de Google en [myaccount.google.com](https://myaccount.google.com)
2. Entra a **Seguridad**
3. Activa la **verificación en dos pasos** si no la tienes activa
4. Busca **Contraseñas de aplicaciones**
5. Selecciona "Correo" y "Windows" y haz clic en Generar
6. Copia la contraseña de 16 caracteres que aparece y pégala en `EMAIL_PASS` del `.env`
---
 
## Uso
 
Una vez iniciado con pm2, el programa corre en segundo plano y registra automáticamente el tiempo de uso de cada aplicación. Cada lunes al encender el PC, genera un PDF con el reporte de la semana y lo envía al correo configurado.
 
Para enviar el reporte manualmente:
 
```
curl -X POST http://localhost:3000/reports/send
```
 
O en PowerShell:
 
```
Invoke-WebRequest -Uri http://localhost:3000/reports/send -Method POST
```
 
---
 
## Iniciar automáticamente con Windows
 
Para que el programa arranque solo cuando enciendes el PC:
 
```
pm2 startup
pm2 save
```
 
Ejecuta el comando que pm2 te indique después de `pm2 startup`.
 
---
 
## Tecnologías usadas
 
- NestJS
- TypeScript
- pdfkit
- nodemailer
- pm2
- active-win
 
