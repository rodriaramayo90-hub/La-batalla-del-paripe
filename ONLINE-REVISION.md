# Salas online conectadas

Servidor: https://la-batalla-del-paripe-online.rodriaramayo90.workers.dev

Se verificó el endpoint /health y una partida con dos navegadores contra el Worker público: creación de sala, invitación, elección de personajes, golpes de ambos jugadores, salud sincronizada y victoria al llegar a dos rondas al mejor de tres.

La rama online-salas-v25 es la fuente del Worker en Cloudflare. El directorio raíz es online-server; build npm ci; deploy npx wrangler deploy. No usa dominios propios ni rutas de zona, y no modifica Hoy Toca Playa.

El anfitrión simula la pelea y el invitado recibe estados a 20 Hz por WebSocket; envía entradas a 30 Hz. Esta primera versión es para partidas amistosas, sin antitrampas ni rollback. Ambos deben mantener abierta la pestaña; las desconexiones terminan la sesión y las salas expiran a las dos horas. Falta comprobar la experiencia y la latencia en teléfonos físicos de redes distintas.

Configuración: al mejor de 1, 3, 5 o 7 rondas. Gana la mayoría. Un empate repite la ronda. Ambos confirman cada ronda y la revancha.

La integración conserva las correcciones de sonido para Samsung Internet, el escape de esquina y los golpes cargados a 0,6 segundos.
