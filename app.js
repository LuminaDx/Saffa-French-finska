const app = document.getElementById('app');

let state = {
  mode: null,
  teams: [],
  currentTeam: 0,
  playerIndex: [0, 0],
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
    playerIndex: state.playerIndex,
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
  state.savedPlayers = JSON.parse(localStorage.getItem('finskaPlayers') || localStorage.getItem('finskaPlayersBackup') || '[]');
  if (!Array.isArray(state.playerIndex)) state.playerIndex = [0, 0];
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
          <div class="pin-row"><div class="pin">7</div><div class="pin gold">9</div><div class="pin">8</div></div>
          <div class="pin-row"><div class="pin">5</div><div class="pin green">11</div><div class="pin gold">12</div><div class="pin">6</div></div>
          <div class="pin-row"><div class="pin green">3</div><div class="pin">10</div><div class="pin gold">4</div></div>
          <div class="pin-row"><div class="pin green">1</div><div class="pin gold">2</div></div>
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
  state.playerIndex = [0, 0];
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

  // Check if already on the other team this game
  const otherTeam = 1 - ti;
  if (state.teams[otherTeam] && state.teams[otherTeam].players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
    alert(name + ' is already on the other team this game.');
    return;
  }

  // Check if already on this team
  if (state.teams[ti].players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
    alert(name + ' is already on this team.');
    return;
  }

  state.teams[ti].players.push({ name });
  if (!state.savedPlayers.some(n => n.toLowerCase() === name.toLowerCase())) {
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

function startGame() {
  state.teams.forEach(t => {
    if (t.players.length === 0) t.players.push({ name: t.name });
  });
  state.currentTeam = Math.floor(Math.random() * state.teams.length);
  state.playerIndex = state.teams.map(t => Math.floor(Math.random() * Math.max(1, t.players.length)));
  state.history = [];
  state.gameOver = false;
  saveState();
  render();
}

function getPlayerName(teamIdx) {
  const team = state.teams[teamIdx];
  if (!team) return '';
  if (!team.players || !team.players.length) return team.name || '';
  const idx = (state.playerIndex[teamIdx] || 0) % team.players.length;
  return team.players[idx].name || team.name || '';
}

function renderGame() {
  const teams = state.teams;
  let tally = '';
  if (state.rematchActive && state.wins.length) {
    const w1 = state.wins[0] || 0;
    const w2 = state.wins[1] || 0;
    const t1Bold = w1 > w2;
    const t2Bold = w2 > w1;
    tally = `<div class="tally" style="font-size:16px;">Series:&nbsp;&nbsp;Team 1&nbsp;&nbsp;<span style="font-size:${t1Bold ? '22px' : '16px'}; font-weight:${t1Bold ? '800' : '400'};">${w1}</span>&nbsp;&nbsp;v&nbsp;&nbsp;Team 2&nbsp;&nbsp;<span style="font-size:${t2Bold ? '22px' : '16px'}; font-weight:${t2Bold ? '800' : '400'};">${w2}</span></div>`;
  }
  const currentPlayerName = getPlayerName(state.currentTeam);
  app.innerHTML = `
    <div class="screen game">
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
          const isActive = i === state.currentTeam;
          const isLeft = i === 0;
          const missHtml = t.strikes > 0 ? `<div style="color:#e53935; font-size:20px; margin:4px 0;">${'✕'.repeat(t.strikes)}</div>` : '';
          const playerName = isActive ? (currentPlayerName || t.name) : '';
          const cardClass = isLeft ? 'team-left' : 'team-right';
          const activeClass = isActive ? 'active-frame' : '';
          return `
          <div class="score-card ${cardClass} ${activeClass}" style="min-width:140px; max-width:180px; margin:6px;">
            <div class="score">${t.score}</div>
            <div class="last-shots">Last Shots</div>
            ${missHtml}
            ${isActive && playerName ? `<div style="font-size:18px; font-weight:700; margin:6px 0; color:#111;">${playerName}</div>` : ''}
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
  const ti = state.currentTeam;
  const team = state.teams[ti];
  if (!team) return;

  state.history.push(JSON.parse(JSON.stringify({
    teams: state.teams,
    currentTeam: state.currentTeam,
    playerIndex: [...state.playerIndex]
  })));

  team.throws++;
  team.points.push(points);
  team.lastShots = (team.lastShots || []).slice(-2).concat(points);

  if (points === 0) {
    team.strikes++;
    if (team.strikes >= 3) {
      eliminate(ti);
      return;
    }
  } else {
    team.strikes = 0;
    let ns = team.score + points;
    if (ns > 50) ns = 25;
    team.score = ns;
    if (team.score === 50) {
      win(ti);
      return;
    }
  }

  if (team.players.length) {
    state.playerIndex[ti] = (state.playerIndex[ti] + 1) % team.players.length;
  }
  state.currentTeam = 1 - ti;
  saveState();
  render();
}

function eliminate(idx) {
  state.teams[idx].eliminated = true;
  const active = state.teams.filter(t => !t.eliminated);
  if (active.length <= 1) {
    if (active.length === 1) win(state.teams.indexOf(active[0]));
    else endGame();
  } else {
    state.currentTeam = 1 - idx;
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
  state.currentTeam = prev.currentTeam;
  state.playerIndex = prev.playerIndex;
  state.gameOver = false;
  saveState();
  render();
}

function renderEnd() {
  const w = state.winner !== null ? state.teams[state.winner] : null;
  app.innerHTML = `
    <div class="screen" style="text-align:center;">
      <h1 style="font-size:36px; margin:40px 0 10px;">${w ? 'VICTORY!' : 'GAME OVER'}</h1>
      ${state.rematchActive && state.wins.length ? `<div class="tally">Series: ${state.wins.map((w,i) => state.teams[i] ? state.teams[i].name + ' ' + w : '').filter(Boolean).join(' – ')}</div>` : ''}
      <div class="scores-row" style="margin-top:20px; flex-wrap:wrap; justify-content:center; align-items:flex-end;">
        ${state.teams.map((t, i) => {
          const isWinner = i === state.winner;
          return `<div class="score-card ${isWinner ? 'winner' : ''}" style="margin:6px;">
            <div class="score" style="${isWinner ? 'font-size:88px;' : ''}">${t.score}</div>
            <div class="team-name">${t.name}</div>
          </div>`;
        }).join('')}
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
  const loser = state.winner === 0 ? 1 : 0;
  state.currentTeam = loser;
  state.playerIndex = state.teams.map(t => Math.floor(Math.random() * Math.max(1, t.players.length)));
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
