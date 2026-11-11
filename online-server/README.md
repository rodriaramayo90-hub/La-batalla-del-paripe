# Servidor independiente de La Batalla del Paripé

Worker + Durable Objects. No usa dominios propios ni cambia DNS: `workers_dev: true`, sin routes ni zones. No comparte configuración con Hoy Toca Playa.

1. Desde esta carpeta: `npm ci`.
2. Autorizar la cuenta de Cloudflare: `npx wrangler login` (OAuth; no pegar tokens en el chat).
3. `npm run deploy`. Si Cloudflare solicita habilitar Durable Objects o aceptar condiciones/costes, revisar en la cuenta antes de continuar.
4. Poner la URL HTTPS `workers.dev` devuelta en `../online-config.js`.
5. Publicar los archivos de frontend en el repositorio La-batalla-del-paripe.

El anfitrión simula la pelea y el invitado recibe el estado por WebSocket. Es para partidas amistosas; no incluye antitrampas ni rollback. La conexión tiene latencia y ambos deben mantener abierta la pestaña. Desconectarse termina la sesión; no hay reconexión automática. Las salas son efímeras y expiran a las dos horas. Configuración: al mejor de 1, 3, 5 o 7; gana la mayoría. Un empate repite la ronda. Ambos confirman cada ronda y la revancha.

Prueba local: `npm run dev`, y servir el frontend con `python -m http.server`; apuntar `PARIPE_ONLINE_URL` a `http://127.0.0.1:8895` solo en la configuración local de pruebas.
