const TOURNAMENT = {
  rounds: [], current: null, champion: null, phase: '',
  sides: new Map(), ready: new Set(), lineup: [], loading: false
};

function buildTournament(entrants, random = Math.random) {
  const shuffled = [...entrants];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const size = 2 ** Math.ceil(Math.log2(shuffled.length));
  const rounds = [];
  for (let count = size / 2; count >= 1; count /= 2) {
    rounds.push(Array.from({length: count}, () => ({players: [null, null], winner: null})));
  }
  rounds[0].forEach((match, index) => {
    match.players = [shuffled[index], shuffled[index + size / 2] ?? null];
    if (!match.players[1]) {
      match.winner = match.players[0];
      rounds[1][Math.floor(index / 2)].players[index % 2] = match.winner;
    }
  });
  return rounds;
}

function tournamentLabel(entrant) {
  return 'J' + entrant.number + ' · ' + fighters[entrant.fighter][0];
}

function tournamentRoundName(round) {
  return ['Final', 'Semifinales', 'Cuartos de final', 'Octavos de final'][TOURNAMENT.rounds.length - round - 1];
}

function tournamentPhase(phase, focus) {
  TOURNAMENT.phase = phase;
  show('tournament-screen');
  for (const panel of $('tournament-screen').querySelectorAll('[data-phase]')) {
    panel.hidden = panel.dataset.phase !== phase;
  }
  $(focus).focus();
}

function tournamentSetupPlayers() {
  const list = $('tournament-players');
  const previous = Array.from(list.querySelectorAll('select'), select => select.value);
  list.replaceChildren(...Array.from({length: Number($('tournament-count').value)}, (_, index) => {
    const label = document.createElement('label');
    const select = document.createElement('select');
    label.textContent = 'Jugador ' + (index + 1);
    fighters.forEach((fighter, id) => select.add(new Option(fighter[0], id)));
    select.value = previous[index] ?? String(index);
    label.append(select);
    return label;
  }));
}

function leaveTournament() {
  TOURNAMENT.phase = '';
  TOURNAMENT.current = null;
  TOURNAMENT.loading = false;
}

function openTournament() {
  leaveLocal();
  leaveTournament();
  cancelSpeech();
  audio.stopMusic();
  tournamentSetupPlayers();
  tournamentPhase('setup', 'tournament-count');
}

function startTournament() {
  const entrants = Array.from($('tournament-players').querySelectorAll('select'), (select, index) => ({
    number: index + 1, fighter: Number(select.value)
  }));
  TOURNAMENT.rounds = buildTournament(entrants);
  TOURNAMENT.champion = null;
  TOURNAMENT.bestOf = Number($('tournament-rounds').value);
  showTournamentBracket();
}

function showTournamentBracket() {
  leaveLocal();
  audio.stopMusic();
  TOURNAMENT.current = null;
  const board = $('tournament-bracket');
  board.replaceChildren();
  TOURNAMENT.rounds.forEach((matches, round) => {
    const column = document.createElement('section');
    const heading = document.createElement('h3');
    heading.textContent = tournamentRoundName(round);
    column.append(heading);
    matches.forEach((match, index) => {
      const card = document.createElement('article');
      if (!match.winner && !TOURNAMENT.current && match.players.every(Boolean)) {
        TOURNAMENT.current = {round, index, match};
        card.classList.add('tournament-next');
      }
      match.players.forEach(entrant => {
        const row = document.createElement('div');
        row.textContent = entrant ? tournamentLabel(entrant) : match.winner ? 'Pase directo' : 'Por definir';
        if (entrant && entrant === match.winner) {
          row.className = 'tournament-winner';
          row.textContent = '✓ ' + row.textContent;
        }
        card.append(row);
      });
      column.append(card);
    });
    board.append(column);
  });
  const champion = TOURNAMENT.champion;
  $('tournament-result').textContent = champion ? '🏆 Campeón · ' + tournamentLabel(champion) : '';
  $('tournament-result').hidden = !champion;
  $('tournament-next-match').textContent = champion ? '' :
    'Próximo combate · ' + TOURNAMENT.current.match.players.map(tournamentLabel).join(' vs. ');
  $('tournament-play').hidden = !!champion;
  $('tournament-restart').hidden = !champion;
  tournamentPhase('bracket', champion ? 'tournament-restart' : 'tournament-play');
  board.querySelector('.tournament-next')?.scrollIntoView({block:'nearest', inline:'nearest'});
}

function openTournamentSides() {
  if (!TOURNAMENT.current) return;
  TOURNAMENT.loading = false;
  TOURNAMENT.sides.clear();
  TOURNAMENT.ready.clear();
  $('tournament-side-status').textContent = '';
  tournamentPhase('sides', 'tournament-sides-title');
  const players = TOURNAMENT.current.match.players;
  $('tournament-fighter-left').textContent = '1P · ' + tournamentLabel(players[0]);
  $('tournament-fighter-right').textContent = '2P · ' + tournamentLabel(players[1]);
  renderTournamentSides();
}

function toggleTournamentKeyboard(slot) {
  const id = slot === 0 ? 'keyboard-left' : 'keyboard-right';
  if (TOURNAMENT.loading) return;
  if (TOURNAMENT.sides.has(id)) clearTournamentSide(id);
  else assignTournamentSide(id, slot);
}

function tournamentDevice(id) {
  return id === 'keyboard-left' ? 'Teclado ←' : id === 'keyboard-right' ? 'Teclado D' : 'Mando ' + (Number(id.slice(4)) + 1);
}

function renderTournamentSides() {
  const assignments = [...TOURNAMENT.sides];
  for (const [slot, label] of ['left', 'right'].entries()) {
    const device = assignments.find(([, side]) => side === slot)?.[0];
    $('tournament-side-' + label).textContent = device ?
      tournamentDevice(device) + (TOURNAMENT.ready.has(device) ? ' · Listo' : ' · Confirmá') : 'Libre';
  }
  const available = availablePads().map(pad => 'pad:' + pad.index);
  $('tournament-neutral').textContent = available.filter(id => !TOURNAMENT.sides.has(id)).map(tournamentDevice).join(' · ') || '—';
  $('tournament-start').disabled = assignments.length < 2 ||
    assignments.some(([id]) => id.startsWith('pad:') && !TOURNAMENT.ready.has(id)) || TOURNAMENT.loading;
}

function assignTournamentSide(id, slot) {
  if (TOURNAMENT.loading || TOURNAMENT.ready.has(id)) return;
  const side = TOURNAMENT.sides.get(id);
  if (side === slot) return;
  if ([...TOURNAMENT.sides.values()].includes(slot)) {
    $('tournament-side-status').textContent = 'Ese lado ya tiene un control asignado.';
    return;
  }
  $('tournament-side-status').textContent = '';
  TOURNAMENT.sides.set(id, slot);
  renderTournamentSides();
}

function clearTournamentSide(id) {
  TOURNAMENT.ready.delete(id);
  if (TOURNAMENT.sides.delete(id)) $('tournament-side-status').textContent = '';
  renderTournamentSides();
}

function tournamentPadInput(pad, state, previous) {
  const id = 'pad:' + pad.index;
  const pressed = key => state[key] && !previous[key];
  if (TOURNAMENT.loading) return;
  if (pressed('back')) {
    if (TOURNAMENT.ready.delete(id)) renderTournamentSides();
    else clearTournamentSide(id);
    return;
  }
  if (pressed('left') || pressed('right')) {
    const side = pressed('left') ? 0 : 1;
    if (TOURNAMENT.sides.has(id) && TOURNAMENT.sides.get(id) !== side) {
      if (!TOURNAMENT.ready.has(id)) clearTournamentSide(id);
    } else assignTournamentSide(id, side);
  }
  if (pressed('confirm') || pressed('options')) {
    if (!TOURNAMENT.sides.has(id)) return;
    TOURNAMENT.ready.add(id);
    renderTournamentSides();
    if (!$('tournament-start').disabled) startTournamentFight();
  }
}

function syncTournamentPads(pads) {
  if (mode !== 'tournament-screen' || TOURNAMENT.phase !== 'sides') return;
  for (const id of TOURNAMENT.sides.keys()) {
    if (id.startsWith('pad:') && !pads.some(pad => 'pad:' + pad.index === id)) clearTournamentSide(id);
  }
  renderTournamentSides();
}

async function startTournamentFight() {
  if (TOURNAMENT.phase !== 'sides' || $('tournament-start').disabled) return;
  const token = battleToken;
  TOURNAMENT.loading = true;
  renderTournamentSides();
  unlockAudio();
  try {
    await assetReady;
    if (token !== battleToken || TOURNAMENT.phase !== 'sides') return;
    syncTournamentPads(availablePads());
    if (TOURNAMENT.sides.size !== 2) {
      $('tournament-side-status').textContent = 'Reconectá el mando o elegí teclado.';
      return;
    }
    const {round, index, match} = TOURNAMENT.current;
    TOURNAMENT.lineup = match.players;
    LOCAL.selected = match.players.map(entrant => entrant.fighter);
    LOCAL.controls = [0, 1].map(slot => {
      const [id] = [...TOURNAMENT.sides].find(([, value]) => value === slot);
      return id.startsWith('pad:') ? id : 'keyboard';
    });
    LOCAL.bestOf = TOURNAMENT.bestOf;
    LOCAL.stage = (round + index) % STAGES.length;
    LOCAL.wins = [0, 0];
    LOCAL.round = 1;
    LOCAL.active = true;
    TOURNAMENT.phase = 'fight';
    startLocalRound();
  } catch (error) {
    $('tournament-side-status').textContent = 'No se pudo iniciar el combate.';
    console.error(error);
  } finally {
    if (token === battleToken || TOURNAMENT.phase === 'fight') TOURNAMENT.loading = false;
    if (mode === 'tournament-screen' && TOURNAMENT.phase === 'sides') renderTournamentSides();
  }
}

function finishTournamentMatch(slot) {
  const {round, index, match} = TOURNAMENT.current;
  const winner = TOURNAMENT.lineup[slot];
  match.winner = winner;
  const next = TOURNAMENT.rounds[round + 1];
  if (next) next[Math.floor(index / 2)].players[index % 2] = winner;
  else TOURNAMENT.champion = winner;
  TOURNAMENT.phase = 'result';
}

document.addEventListener('keydown', event => {
  if (mode !== 'tournament-screen' || TOURNAMENT.phase !== 'sides' || event.repeat) return;
  const slot = {ArrowLeft: 0, KeyD: 1}[event.code];
  if (slot === undefined) return;
  event.preventDefault();
  assignTournamentSide(slot === 0 ? 'keyboard-left' : 'keyboard-right', slot);
});
