const app = document.getElementById('app');

let state = {
  mode: null,
  teams: [],
  currentTeam: 0,
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
      <div class="header-icons">
        <button class="icon-btn" onclick="renderHome()">←</button>
        <span style="font-weight:700; font-size:20px;">Setup Teams</span>
        <span></span>
      </div>
      ${state.teams.map((team, ti) => `
        <div style="margin:20px 0; padding:12px; border:1.5px solid var(--sa-gold); border-radius:12px;">
          <h3 style="margin:0 0 10px; color:var(--french-blue);">${team.name}</h3>
          <div class="player-list">
            ${team.players.map((p, pi) => `
              <div class="player-item">
                <span>👤 ${p.name}</span>
                <button onclick="removePlayer(${ti},${pi})" style="background:none;border:none;font-size:18px;">✕</button>
              </div>
            `).join('')}
          </div>
          <div class="add-player" style="display:flex;gap:8px;margin-top:8px;">
            <input id="newp${ti}" placeholder="Add player name" list="savedPlayers" style="flex:1;padding:10px;border-radius:8px;border:1px solid #ccc;">
            <button onclick="addPlayer(${ti})" style="padding:10px 16px;background:var(--french-blue);color:#fff;border:none;border-radius:8px;">Add</button>
          </div>
        </div>
      `).join('')}
      <datalist id="savedPlayers">
        ${state.savedPlayers.map(n => `<option value="${n}">`).join('')}
      </datalist>
      ${state.teams.length < 6 ? `<button class="btn" onclick="addTeam()" style="margin:10px 0;">+ Add New Team</button>` : ''}
      <button class="btn primary" onclick="startGame()" style="margin-top:16px;background:var(--sa-green);border-color:var(--sa-green);">START GAME</button>
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

function addTeam() {
  if (state.teams.length >= 6) return;
  const n = state.teams.length + 1;
  state.teams.push({ name: 'Team ' + n, players: [], score: 0, strikes: 0, throws: 0, points: [], lastShots: [] });
  saveState();
  renderTeamSetup();
}
  state.teams[ti].players.splice(pi, 1);
  saveState();
  renderTeamSetup();
}

function startGame() {
  // ensure at least one player per team
  state.teams.forEach(t => {
    if (t.players.length === 0) t.players.push({ name: t.name });
  });
  state.currentTeam = 0;
  state.history = [];
  state.gameOver = false;
  saveState();
  render();
}

function renderGame() {
  const teams = state.teams;
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
          const isActive = i === state.currentTeam;
          const missHtml = t.strikes > 0 ? `<div style="color:#e53935; font-size:20px; margin:4px 0;">${'✕'.repeat(t.strikes)}</div>` : '';
          const playerName = (t.players && t.players[0]) ? t.players[0].name : '';
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
  const teams = state.teams;
  let tally = '';
  if (state.rematchActive && state.wins.length) {
    tally = `<div class="tally">Series: ${state.wins.map((w,i) => teams[i].name + ' ' + w).join(' – ')}</div>`;
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
          const isActive = i === state.currentTeam;
          const missHtml = t.strikes > 0 ? `<div style="color:#e53935; font-size:20px; margin:4px 0;">${'✕'.repeat(t.strikes)}</div>` : '';
          const playerName = (t.players && t.players[0]) ? t.players[0].name : '';
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
  const teams = state.teams;
  let tally = '';
  if (state.rematchActive) {
    tally = `<div class="tally">Series: ${teams[0].name} ${state.wins[0]} – ${state.wins[1]} ${teams[1].name}</div>`;
  }
  app.innerHTML = `
    <div class="screen">
      <button class="theme-toggle" onclick="toggleTheme()">🌙</button>
      <div class="header-icons">
        <button class="icon-btn" onclick="showMenu()">☰</button>
        <span></span>
        <div>
          <button class="icon-btn" onclick="editNames()">✎</button>
          <button class="icon-btn" onclick="undo()">↩</button>
        </div>
      </div>
      ${tally}
      <div class="scores-row">
        ${teams.map((t, i) => {
          const isActive = i === state.currentTeam;
          const missHtml = t.strikes > 0 ? `<div class="strikes" style="color:#e53935; font-size:22px; margin:6px 0;">${'✕'.repeat(t.strikes)}</div>` : '';
          const playerName = t.players && t.players.length ? t.players[0].name : t.name;
          return `
          <div class="score-card ${isActive ? 'active' : ''}">
            <div class="score">${t.score}</div>
            <div class="last-shots">Last Shots</div>
            ${missHtml}
            ${isActive ? `<div style="font-size:22px; font-weight:700; margin:8px 0;">${playerName}</div>` : ''}
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
  const team = state.teams[state.currentTeam];
  state.history.push(JSON.parse(JSON.stringify(state.teams)));
  team.throws++;
  team.points.push(points);
  team.lastShots = team.lastShots.slice(-2).concat(points);

  if (points === 0) {
    team.strikes++;
    if (team.strikes >= 3) {
      eliminate(state.currentTeam);
      return;
    }
  } else {
    team.strikes = 0;
    let ns = team.score + points;
    if (ns > 50) ns = 25;
    team.score = ns;
    if (team.score === 50) {
      win(state.currentTeam);
      return;
    }
  }
  state.currentTeam = (state.currentTeam + 1) % state.teams.length;
  saveState();
  render();
}

function eliminate(idx) {
  state.teams[idx].eliminated = true;
  const active = state.teams.filter(t => !t.eliminated);
  if (active.length <= 1) {
    if (active.length === 1) win(state.teams.indexOf(active[0]));
    else endGame(null);
  } else {
    state.currentTeam = (state.currentTeam + 1) % state.teams.length;
    while (state.teams[state.currentTeam].eliminated) {
      state.currentTeam = (state.currentTeam + 1) % state.teams.length;
    }
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
  state.teams = state.history.pop();
  state.gameOver = false;
  saveState();
  render();
}

function renderEnd() {
  const w = state.winner !== null ? state.teams[state.winner] : null;
  app.innerHTML = `
    <div class="screen" style="text-align:center;">
      <h1 style="font-size:36px; margin:40px 0 10px;">${w ? 'VICTORY!' : 'GAME OVER'}</h1>
      ${state.rematchActive ? `<div class="tally">Series: ${state.wins[0]} – ${state.wins[1]}</div>` : ''}
      <div class="scores-row" style="margin-top:20px;">
        ${state.teams.map(t => `<div class="score-card"><div class="score">${t.score}</div><div class="team-name">${t.name}</div></div>`).join('')}
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
  state.currentTeam = 0;
  state.history = [];
  state.gameOver = false;
  state.winner = null;
  saveState();
  render();
}
  state.rematchActive = true;
  state.teams.forEach(t => {
    t.score = 0; t.strikes = 0; t.throws = 0; t.points = []; t.lastShots = []; t.eliminated = false;
  });
  state.currentTeam = 0;
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
  // simple prompt edit
  state.teams.forEach((t, i) => {
    const n = prompt(`Team ${i+1} name:`, t.name);
    if (n) t.name = n;
  });
  saveState();
  render();
}

function toggleTheme() {} // removed

// init
loadState();
render();

// expose
window.continueGame = continueGame;
window.newGame = newGame;
window.addPlayer = addPlayer;
window.removePlayer = removePlayer;
window.addTeam = addTeam;
window.startGame = startGame;
window.score = score;
window.undo = undo;
window.rematch = rematch;
window.renderHome = renderHome;
window.showMenu = showMenu;
window.editNames = editNames;
  state.dark = !state.dark;
  saveState();
  render();
}

function showRules() {
  alert('Finska: Reach exactly 50. Over 50 resets to 25. 3 misses = out.\nPins: single = number, multiple = count.');
}

// init
loadState();
render();

// expose
window.continueGame = continueGame;
window.newGame = newGame;
window.addPlayer = addPlayer;
window.removePlayer = removePlayer;
window.startGame = startGame;
window.score = score;
window.undo = undo;
window.rematch = rematch;
window.renderHome = renderHome;
window.toggleTheme = toggleTheme;
window.showMenu = showMenu;
window.editNames = editNames;
