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

function tournamentPortrait(fighter) {
  return '<span class="tournament-portrait" aria-hidden="true">' + portraitMarkup(fighter) + '</span>';
}

function tournamentSetupPlayers() {
  const list = $('tournament-players');
  const previous = Array.from(list.children, card => Number(card.dataset.fighter));
  list.replaceChildren(...Array.from({length: Number($('tournament-count').value)}, (_, index) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.id = 'tournament-player-' + index;
    card.className = 'tournament-player-card';
    setTournamentPlayer(card, index, previous[index] ?? index);
    card.addEventListener('click', () => openTournamentRoster(index));
    return card;
  }));
}

function setTournamentPlayer(card, index, fighter) {
  card.dataset.fighter = fighter;
  card.innerHTML = tournamentPortrait(fighter) + '<span><small>Jugador ' + (index + 1) +
    '</small><strong>' + fighters[fighter][0] + '</strong></span>';
}

function openTournamentRoster(index) {
  const player = $('tournament-player-' + index);
  const selected = Number(player.dataset.fighter);
  TOURNAMENT.picking = index;
  $('tournament-roster-title').textContent = 'Elegí luchador · Jugador ' + (index + 1);
  $('tournament-roster').replaceChildren(...fighters.map((fighter, id) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.id = 'tournament-fighter-choice-' + id;
    card.className = 'tournament-fighter-choice';
    card.setAttribute('aria-pressed', String(id === selected));
    card.innerHTML = tournamentPortrait(id) + '<strong>' + fighter[0] + '</strong>';
    card.addEventListener('click', () => {
      setTournamentPlayer(player, index, id);
      sfx('select');
      closeTournamentRoster();
    });
    return card;
  }));
  tournamentPhase('roster', 'tournament-fighter-choice-' + selected);
}

function closeTournamentRoster() {
  tournamentPhase('setup', 'tournament-player-' + TOURNAMENT.picking);
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
  const entrants = Array.from($('tournament-players').children, (card, index) => ({
    number: index + 1, fighter: Number(card.dataset.fighter)
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
  const depth = TOURNAMENT.rounds.length - 1;
  const rows = Math.max(1, TOURNAMENT.rounds[0].length / 2);
  const tree = document.createElement('div');
  tree.className = 'tournament-tree';
  tree.style.setProperty('--columns', 2 * depth + 1);
  tree.style.setProperty('--rows', rows);
  TOURNAMENT.rounds.forEach((matches, round) => {
    const final = round === depth;
    const half = matches.length / 2;
    const span = final ? rows : 2 ** round;
    for (const column of final ? [depth + 1] : [round + 1, 2 * depth + 1 - round]) {
      const heading = document.createElement('h3');
      heading.textContent = tournamentRoundName(round);
      heading.style.gridColumn = column;
      tree.append(heading);
    }
    matches.forEach((match, index) => {
      const right = !final && index >= half;
      const position = final ? 0 : index % half;
      const slot = document.createElement('div');
      slot.className = 'tournament-match-slot';
      slot.style.gridColumn = right ? 2 * depth + 1 - round : round + 1;
      slot.style.gridRow = (2 + position * span) + ' / span ' + span;
      if (!final) {
        slot.classList.add(right ? 'to-left' : 'to-right');
        if (round < depth - 1) slot.classList.add(position % 2 ? 'join-up' : 'join-down');
      }
      const card = document.createElement('article');
      if (final) card.classList.add('tournament-final');
      if (!match.winner && !TOURNAMENT.current && match.players.every(Boolean)) {
        TOURNAMENT.current = {round, index, match};
        card.classList.add('tournament-next');
        card.setAttribute('aria-label', 'Próximo combate');
      }
      match.players.forEach(entrant => {
        const row = document.createElement('div');
        row.className = 'tournament-entrant';
        if (entrant) {
          row.innerHTML = tournamentPortrait(entrant.fighter);
          const label = document.createElement('span');
          label.textContent = tournamentLabel(entrant);
          row.append(label);
        } else {
          row.textContent = match.winner ? 'Pase directo' : 'Por definir';
          row.classList.add('tournament-empty');
        }
        if (entrant && entrant === match.winner) {
          row.classList.add('tournament-winner');
          const check = document.createElement('span');
          check.textContent = '✓';
          check.setAttribute('aria-label', 'Ganador');
          row.append(check);
        }
        card.append(row);
      });
      slot.append(card);
      tree.append(slot);
    });
  });
  board.append(tree);
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
  $('tournament-portrait-left').innerHTML = tournamentPortrait(players[0].fighter);
  $('tournament-portrait-right').innerHTML = tournamentPortrait(players[1].fighter);
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

function tournamentPadIcon(id) {
  const number = Number(id.slice(4)) + 1;
  return '<span class="tournament-control-icon" role="img" aria-label="Mando ' + number +
    '" title="Mando ' + number + '">🎮 <small>' + number + '</small></span>';
}

function renderTournamentSides() {
  const assignments = [...TOURNAMENT.sides];
  for (const [slot, label] of ['left', 'right'].entries()) {
    const device = assignments.find(([, side]) => side === slot)?.[0];
    const pad = device?.startsWith('pad:');
    const ready = !!device && (!pad || TOURNAMENT.ready.has(device));
    const keyboard = $('tournament-keyboard-' + label);
    keyboard.hidden = !!pad;
    keyboard.setAttribute('aria-pressed', String(ready && !pad));
    const status = $('tournament-side-' + label);
    const message = ready ? 'Listo' : pad ? 'Confirmá' : 'Libre';
    status.innerHTML = (pad ? tournamentPadIcon(device) : '') + '<span>' + message + '</span>';
    status.classList.toggle('control-ready', ready);
  }
  const available = availablePads().map(pad => 'pad:' + pad.index);
  $('tournament-neutral').innerHTML = available.filter(id => !TOURNAMENT.sides.has(id)).map(tournamentPadIcon).join(' ') || '—';
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
