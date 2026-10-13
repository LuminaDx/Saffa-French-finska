const app = document.getElementById('app');

let state = {
  mode: null,
  teams: [],
  currentTeam: 0,
  currentPlayer: 0,
  turnOrder: [],
  turnIndex: 0,
  history: [],
  gameOver: false,
  winner: null,
  wins: [],
  rematchActive: false,
  savedPlayers: JSON.parse(localStorage.getItem('finskaPlayers') || '[]')
};

function saveState() {
  localStorage.setItem('saffaFrenchFinska', JSON.stringify({
    mode: state.mode, teams: state.teams, currentTeam: state.currentTeam,
    currentPlayer: state.currentPlayer, turnOrder: state.turnOrder, turnIndex: state.turnIndex,
    history: state.history, gameOver: state.gameOver, winner: state.winner,
    wins: state.wins, rematchActive: state.rematchActive
  }));
  localStorage.setItem('finskaPlayers', JSON.stringify(state.savedPlayers));
}

function loadState() {
  const saved = localStorage.getItem('saffaFrenchFinska');
  if (saved) {
    try {
      const s = JSON.parse(saved);
      Object.assign(state, s);
    } catch(e) {}
  }
  state.savedPlayers = JSON.parse(localStorage.getItem('finskaPlayers') || '[]');
}

function render() {
  if (!state.mode || (state.gameOver && !state.rematchActive)) {
    renderHome();
  } else if (state.gameOver) {
    renderEnd();
  } else {
    renderGame();
  }
}

function renderHome() {
  const hasGame = state.teams && state.teams.length > 0 && !state.gameOver;
  app.innerHTML = `
    <div class="screen">
      <div class="title" style="color:var(--french-blue); font-size:42px; line-height:1.1;">SaffaFrench<br>Finska</div>
      <div class="subtitle">Keep track of your games!</div>
      <div class="pins-container">
        <div class="pins">
          <div class="pin-row"><div class="pin">7</div><div class="pin" style="border-color:var(--sa-gold)">9</div><div class="pin">8</div></div>
          <div class="pin-row"><div class="pin">5</div><div class="pin" style="border-color:var(--sa-green)">11</div><div class="pin" style="border-color:var(--sa-gold)">12</div><div class="pin">6</div></div>
          <div class="pin-row"><div class="pin" style="border-color:var(--sa-green)">3</div><div class="pin">10</div><div class="pin" style="border-color:var(--sa-gold)">4</div></div>
          <div class="pin-row"><div class="pin" style="border-color:var(--sa-green)">1</div><div class="pin" style="border-color:var(--sa-gold)">2</div></div>
        </div>
      </div>
      <div class="bottom-buttons">
        ${hasGame ? '<button class="btn" onclick="continueGame()">CONTINUE GAME</button>' : ''}
        <button class="btn" onclick="newGame()">NEW GAME</button>
      </div>
    </div>
  `;
}

function continueGame() {
  if (state.teams.length) render();
}

function newGame() {
  state.mode = 'teams';
  state.teams = [
    { name: 'Team 1', players: [], score: 0, strikes: 0, throws: 0, points: [], lastShots: [] },
    { name: 'Team 2', players: [], score: 0, strikes: 0, throws: 0, points: [], lastShots: [] }
  ];
  state.currentTeam = 0;
  state.history = [];
  state.gameOver = false;
  state.winner = null;
  state.rematchActive = false;
  state.wins = [];
  renderTeamSetup();
}

function renderTeamSetup() {
  app.innerHTML = `
    <div class="screen">
      <div class="header-icons" style="margin-bottom:16px;">
        <button class="icon-btn" onclick="renderHome()" style="font-size:24px;">←</button>
        <span style="font-weight:700; font-size:22px; color:var(--french-blue);">Setup Teams</span>
        <span></span>
      </div>
      ${state.teams.map((team, ti) => `
        <div style="margin:16px 0 24px;">
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
            <div style="width:32px; height:32px; background:var(--french-blue); color:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700;">${ti+1}</div>
            <h3 style="margin:0; color:var(--french-blue); font-size:18px;">${team.name}</h3>
          </div>
          <div style="border:1.5px solid var(--sa-gold); border-radius:14px; padding:12px; background:#fff;">
            ${team.players.map((p, pi) => `
              <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 4px; border-bottom:1px solid #eee;">
                <span>👤 ${p.name}</span>
                <button onclick="removePlayer(${ti},${pi})" style="background:none;border:none;font-size:18px;color:#999;">✕</button>
              </div>
            `).join('')}
            <div style="display:flex; gap:8px; margin-top:12px; align-items:center;">
              <input id="newp${ti}" placeholder="Add player name" list="savedPlayers" style="flex:1; padding:12px; border-radius:10px; border:1px solid #ddd; font-size:16px;">
              <button onclick="addPlayer(${ti})" style="padding:12px 20px; background:var(--french-blue); color:#fff; border:none; border-radius:10px; font-weight:600;">Add</button>
            </div>
          </div>
        </div>
      `).join('')}
      <datalist id="savedPlayers">
        ${state.savedPlayers.map(n => `<option value="${n}">`).join('')}
      </datalist>
      <button class="btn primary" onclick="startGame()" style="background:var(--sa-green); border-color:var(--sa-green); margin-top:8px;">START GAME</button>
    </div>
  `;
}

function addPlayer(ti) {
  const input = document.getElementById('newp' + ti);
  const name = input.value.trim();
  if (!name) return;
  state.teams[ti].players.push({ name });
  if (!state.savedPlayers.includes(name)) {
    state.savedPlayers.push(name);
  }
  input.value = '';
  saveState();
  renderTeamSetup();
}

function removePlayer(ti, pi) {
  state.teams[ti].players.splice(pi, 1);
  saveState();
  renderTeamSetup();
}

function buildTurnOrder() {
  const order = [];
  const maxPlayers = Math.max(...state.teams.map(t => t.players.length), 1);
  for (let p = 0; p < maxPlayers; p++) {
    for (let t = 0; t < state.teams.length; t++) {
      if (state.teams[t].players.length > p) {
        order.push({ team: t, player: p });
      }
    }
  }
  state.turnOrder = order;
  state.turnIndex = 0;
  if (order.length) {
    state.currentTeam = order[0].team;
    state.currentPlayer = order[0].player;
  }
}

function startGame() {
  state.teams.forEach(t => {
    if (t.players.length === 0) t.players.push({ name: t.name });
  });
  buildTurnOrder();
  state.history = [];
  state.gameOver = false;
  saveState();
  render();
}

function renderGame() {
  const teams = state.teams;
  const current = state.turnOrder[state.turnIndex] || { team: 0, player: 0 };
  const currentTeamIdx = current.team;
  let tally = '';
  if (state.rematchActive && state.wins.length) {
    tally = `<div class="tally">Series: ${state.wins.map((w,i) => (teams[i] ? teams[i].name + ' ' + w : '')).filter(Boolean).join(' – ')}</div>`;
  }
  app.innerHTML = `
    <div class="screen">
      <div class="header-icons">
        <button class="icon-btn" onclick="showMenu()">☰</button>
        <span></span>
        <div>
          <button class="icon-btn" onclick="editNames()">✎</button>
          <button class="icon-btn" onclick="undo()">↩</button>
        </div>
      </div>
      ${tally}
      <div class="scores-row" style="flex-wrap:wrap; justify-content:center;">
        ${teams.map((t, i) => {
          const isActive = i === currentTeamIdx;
          const missHtml = t.strikes > 0 ? `<div style="color:#e53935; font-size:20px; margin:4px 0;">${'✕'.repeat(t.strikes)}</div>` : '';
          const playerName = isActive && t.players[current.player] ? t.players[current.player].name : '';
          return `
          <div class="score-card ${isActive ? 'active' : ''}" style="min-width:140px; max-width:180px; margin:6px;">
            <div class="score">${t.score}</div>
            <div class="last-shots">Last Shots</div>
            ${missHtml}
            ${isActive && playerName ? `<div style="font-size:18px; font-weight:700; margin:6px 0;">${playerName}</div>` : ''}
            <div class="team-name">${t.name}</div>
          </div>`;
        }).join('')}
      </div>
      <div class="numpad">
        <div class="numpad-grid">
          ${[1,2,3,4,5,6,7,8,9,10,11,12].map(n => `<button class="num-btn" onclick="score(${n})">${n}</button>`).join('')}
        </div>
        <button class="miss-btn" onclick="score(0)">MISS</button>
      </div>
    </div>
  `;
}

function score(points) {
  if (state.gameOver) return;
  const current = state.turnOrder[state.turnIndex];
  if (!current) return;
  const team = state.teams[current.team];
  state.history.push(JSON.parse(JSON.stringify({ teams: state.teams, turnIndex: state.turnIndex, turnOrder: state.turnOrder })));
  team.throws++;
  team.points.push(points);
  team.lastShots = (team.lastShots || []).slice(-2).concat(points);

  if (points === 0) {
    team.strikes++;
    if (team.strikes >= 3) {
      eliminate(current.team);
      return;
    }
  } else {
    team.strikes = 0;
    let ns = team.score + points;
    if (ns > 50) ns = 25;
    team.score = ns;
    if (team.score === 50) {
      win(current.team);
      return;
    }
  }
  advanceTurn();
  saveState();
  render();
}

function advanceTurn() {
  if (!state.turnOrder.length) return;
  let next = (state.turnIndex + 1) % state.turnOrder.length;
  let attempts = 0;
  while (attempts < state.turnOrder.length) {
    const t = state.turnOrder[next];
    if (!state.teams[t.team].eliminated) break;
    next = (next + 1) % state.turnOrder.length;
    attempts++;
  }
  state.turnIndex = next;
  state.currentTeam = state.turnOrder[next].team;
  state.currentPlayer = state.turnOrder[next].player;
}

function eliminate(idx) {
  state.teams[idx].eliminated = true;
  const active = state.teams.filter(t => !t.eliminated);
  if (active.length <= 1) {
    if (active.length === 1) win(state.teams.indexOf(active[0]));
    else endGame();
  } else {
    advanceTurn();
    saveState();
    render();
  }
}

function win(idx) {
  state.gameOver = true;
  state.winner = idx;
  if (!state.wins.length) state.wins = Array(state.teams.length).fill(0);
  state.wins[idx] = (state.wins[idx] || 0) + 1;
  saveState();
  renderEnd();
}

function endGame() {
  state.gameOver = true;
  saveState();
  renderEnd();
}

function undo() {
  if (!state.history.length) return;
  const prev = state.history.pop();
  state.teams = prev.teams;
  state.turnIndex = prev.turnIndex;
  state.turnOrder = prev.turnOrder;
  state.gameOver = false;
  if (state.turnOrder[state.turnIndex]) {
    state.currentTeam = state.turnOrder[state.turnIndex].team;
    state.currentPlayer = state.turnOrder[state.turnIndex].player;
  }
  saveState();
  render();
}

function renderEnd() {
  const w = state.winner !== null ? state.teams[state.winner] : null;
  app.innerHTML = `
    <div class="screen" style="text-align:center;">
      <h1 style="font-size:36px; margin:40px 0 10px;">${w ? 'VICTORY!' : 'GAME OVER'}</h1>
      ${state.rematchActive && state.wins.length ? `<div class="tally">Series: ${state.wins.map((w,i) => state.teams[i] ? state.teams[i].name + ' ' + w : '').filter(Boolean).join(' – ')}</div>` : ''}
      <div class="scores-row" style="margin-top:20px; flex-wrap:wrap; justify-content:center;">
        ${state.teams.map(t => `<div class="score-card" style="margin:6px;"><div class="score">${t.score}</div><div class="team-name">${t.name}</div></div>`).join('')}
      </div>
      <button class="btn primary" onclick="rematch()">REMATCH</button>
      <button class="btn" onclick="newGame()">NEW GAME</button>
      <button class="btn" onclick="renderHome()">MAIN MENU</button>
    </div>
  `;
}

function rematch() {
  state.rematchActive = true;
  if (!state.wins.length) state.wins = Array(state.teams.length).fill(0);
  state.teams.forEach(t => {
    t.score = 0; t.strikes = 0; t.throws = 0; t.points = []; t.lastShots = []; t.eliminated = false;
  });
  buildTurnOrder();
  state.history = [];
  state.gameOver = false;
  state.winner = null;
  saveState();
  render();
}

function showMenu() {
  if (confirm('Return to main menu? Current game will be saved.')) {
    renderHome();
  }
}

function editNames() {
  state.teams.forEach((t, i) => {
    const n = prompt(`Team ${i+1} name:`, t.name);
    if (n) t.name = n;
  });
  saveState();
  render();
}

loadState();
render();

window.continueGame = continueGame;
window.newGame = newGame;
window.addPlayer = addPlayer;
window.removePlayer = removePlayer;
window.startGame = startGame;
window.score = score;
window.undo = undo;
window.rematch = rematch;
window.renderHome = renderHome;
window.showMenu = showMenu;
window.editNames = editNames;
