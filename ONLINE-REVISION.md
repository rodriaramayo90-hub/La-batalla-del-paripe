# Salas online: versión de revisión

## Estado
Implementadas y verificadas en servidor Cloudflare local y dos navegadores. NO desplegadas en una cuenta pública: Wrangler indica que no hay autenticación. La versión de main permanece intacta. No se ha cambiado ningún dominio ni DNS.

## Desplegar sin tocar Hoy Toca Playa
En Cloudflare, Workers & Pages → Create → Import a repository. Elegir únicamente rodriaramayo90-hub/La-batalla-del-paripe, rama online-salas-v25. Directorio raíz: online-server. Nombre del Worker: la-batalla-del-paripe-online. Comando de despliegue: npx wrangler deploy. Instalar dependencias con npm ci si el formulario lo pide. No añadir dominios personalizados ni rutas de zona; la configuración usa workers.dev.

Al terminar, copiar la URL HTTPS workers.dev del Worker. Esa URL no es una contraseña. Hay que ponerla en online-config.js, verificar dos clientes contra el Worker público y después integrar esta rama en main. No publicar el menú online antes de configurar y verificar el servidor.

Alternativa por CLI: los pasos están en online-server/README.md.

## Comprobaciones realizadas
- Worker local real con Durable Objects, sin mock de red.
- Dos navegadores: crear, invitar, elegir personajes distintos, confirmar, golpes en ambos sentidos, salud sincronizada, siguiente ronda, victoria al llegar a 2 en mejor de 3.
- Protocolo: mejor de 1/3/5/7; sala llena; desconexión; el invitado no puede reportar resultados como anfitrión.
- Regresión: escape de esquina con 12 personajes y ambas orientaciones; portada sin recortes en ocho tamaños.

## Límites de esta primera versión
Simulación en el anfitrión, sin antitrampas ni rollback; apropiada para partidas amistosas. El invitado recibe estados a 20 Hz y manda entradas a 30 Hz. Hay latencia; falta verificarla con móviles en redes distintas. No hay reconexión de partidas interrumpidas. El anfitrión debe mantener la pestaña abierta y en horizontal. No se ofrece audio por micrófono. Las salas expiran a las dos horas. Cloudflare puede requerir habilitar Durable Objects; revisar límites y condiciones de la cuenta antes de desplegar.
