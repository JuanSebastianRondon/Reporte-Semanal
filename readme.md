Programa para el registro del tiempo en pantalla que tienen otros programas, dando un automaticamente un reporte semanal a trabes de un pdf cada lunes al momento de prender el dispositivo ese dia.

La idea del programa es la de tener un seguimiento de cuales son los programas que mas utilizamos en la semana.

Para empezar con el programa, primero se debe de crear un archivo .env donde contenga tanto el correo remitente de la siguiente forma:

EMAIL_USER=youruser@gmail.com


EMAIL_PASS=gimrcdrciyfathir



curl -X POST http://localhost:3000/reports/send 