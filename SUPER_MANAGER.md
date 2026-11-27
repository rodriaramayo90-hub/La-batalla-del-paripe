# Super especiales: motor unificado

\`super-manager-v1.js\` se carga después de \`super-defense-v1.js\` y antes de
las cinemáticas de los personajes. **Es el único despachador EX** para los
eventos globales del combate:

- \`strike(a,b,type,power,low)\`: identifica al personaje y ejecuta el súper
  si su condición \`canStart\` se cumple; de lo contrario, usa el ataque normal.
- \`update(dt)\`: avanza únicamente la cinemática activa, suspendiendo la
  simulación de combate durante su ejecución, igual que antes.
- \`draw()\`: conserva el dibujo del escenario y dibuja encima la cinemática.
- \`updateHud()\`: actualiza el HUD base y los indicadores de EX registrados.
- \`resetArcade()\`: limpia todos los estados registrados, las defensas QTE
  y después reinicia el motor base.

## Registro de un nuevo personaje

Cada archivo del súper mantiene sus funciones \`canStart\`, \`startStrike\`,
\`tick\`, \`cinematic\`, \`drawSuperHud\` y \`reset\`. Para agregar un luchador,
registrá sus funciones al final del módulo, **sin sobrescribir**
\`strike\`, \`update\`, \`draw\`, \`updateHud\` ni \`resetArcade\`:

\`\`\`js
window.SUPER_MANAGER.register({
  fighterId: 7,
  key: 'flor',
  state: FLOR_SUPER,
  canStart,
  start: startStrike,
  update: tick,
  draw: cinematic,
  hud: drawSuperHud,
  reset
});
\`\`\`

\`state.active\` debe ser booleano. \`fighterId\` y \`key\` son únicos.
\`defenseKey\` es opcional, para ataques cuyo nombre de defensa QTE difiere
del registro. La selección de personajes compatibles en entrenamiento
consulta automáticamente \`SUPER_MANAGER.supports(id)\`.

**No se ha cambiado** el daño, las ventanas defensivas, la duración,
los recursos artísticos ni los nombres de los siete súper existentes.

## Compatibilidad

Los súper cinemáticos se conservan para campaña, práctica y VS local.
El especial normal sigue siendo independiente de R2 + ○ y del botón táctil
SÚPER EX. El online sigue excluido hasta que exista sincronización de
cinemáticas y defensas entre clientes.

## Pruebas

\`npm test\` comprueba el despacho, bloqueo de dos súper simultáneos,
renderizado, actualización, limpieza, duplicados, registro de los seis módulos
reales y los tests previos de daño, controles, parry y sprites.
