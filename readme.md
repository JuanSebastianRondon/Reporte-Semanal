# Reporte Semanal de Productividad

Programa para el registro del tiempo en pantalla de cada aplicación, generando automáticamente un reporte semanal en PDF cada lunes al encender el dispositivo y enviándolo por correo.

La idea es tener un seguimiento claro de cuáles son los programas que más usas durante la semana.

---

## Requisitos

- Windows 10 o superior
- Node.js v18 o superior
- Una cuenta de Gmail con contraseña de aplicación habilitada
- pm2 instalado globalmente

```
npm install -g pm2
```

---

## Instalación rápida (recomendada)

1. Descarga el `Source code (zip)` y el `Reporte-semanal.exe` desde la sección Releases.
2. Descomprime el zip en cualquier carpeta.
3. Coloca el `Reporte-semanal.exe` dentro de la carpeta descomprimida.
4. Ejecuta el `Reporte-semanal.exe` con doble clic.
5. Ingresa tu correo Gmail y tu contraseña de aplicación.
6. Elige si quieres que arranque automáticamente con Windows o de forma manual.
7. Haz clic en Instalar.

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

5. Inicia con pm2:

```
pm2 start dist/main.js --name reporte-semanal
pm2 start tracker.mjs --name tracker
pm2 save
```

---

## Cómo obtener la contraseña de aplicación de Gmail

La contraseña de aplicación no es tu contraseña normal de Gmail.

1. Ve a myaccount.google.com
2. Entra a Seguridad
3. Activa la verificación en dos pasos si no la tienes activa
4. Busca Contraseñas de aplicaciones
5. Selecciona Correo y Windows y haz clic en Generar
6. Copia la contraseña de 16 caracteres y pégala en el instalador o en el `.env`

---

## Uso

Una vez instalado, el programa corre en segundo plano y registra automáticamente el tiempo de uso de cada aplicación. Cada lunes al encender el PC genera un PDF con el reporte de la semana y lo envía al correo configurado. Los datos se reinician automáticamente después de enviar el reporte.

Para enviar el reporte manualmente en PowerShell:

```
Invoke-WebRequest -Uri http://localhost:3000/reports/send -Method POST
```

---

## Control del programa

Usa el `control.exe` para encender o apagar el programa manualmente. La ventana muestra el estado actual y un botón que actúa como toggle.

---

## Arranque automático con Windows

Si elegiste arranque automático en el instalador, pm2 se encarga de iniciar el programa solo cuando enciendes el PC. Si elegiste manual, usa el `control.exe` para encenderlo cuando lo necesites.

Para configurarlo manualmente:

```
pm2 startup
pm2 save
```

Ejecuta el comando adicional que pm2 indique después de `pm2 startup`.

---

## Tecnologías usadas

- NestJS
- TypeScript
- pdfkit
- nodemailer
- pm2
- active-win
