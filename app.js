const app = document.getElementById('app');
let state = {
  mode: null, // '1v1', '2v2', '3p'
  players: [],
  currentIndex: 0,
  history: [],
  gameOver: false,
  winner: null,
  wins: { 0: 0, 1: 0 }, // for rematch tally (sides)
  rematchActive: false,
  dark: false
};

function saveState() {
  localStorage.setItem('saffaFrenchFinska', JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem('saffaFrenchFinska');
  if (saved) {
    try { state = JSON.parse(saved); } catch(e) {}
  }
}

function render() {
  document.body.classList.toggle('dark', state.dark);
  if (!state.mode) {
    renderHome();
  } else if (state.gameOver) {
    renderEnd();
  } else {
    renderGame();
  }
}

function renderHome() {
  app.innerHTML = `
    <div class="screen">
      <button class="theme-toggle" onclick="toggleTheme()">🌙</button>
      <div class="logo">SaffaFrench<br>Finska</div>
      <button class="btn" onclick="startSetup('1v1')">PLAY 1v1</button>
      <button class="btn" onclick="startSetup('2v2')">PLAY 2v2</button>
      <button class="btn" onclick="startSetup('3p')">3 PLAYERS</button>
      <button class="btn" onclick="showRules()">RULES</button>
    </div>
  `;
}

function startSetup(mode) {
  state.mode = mode;
  state.players = [];
  state.currentIndex = 0;
  state.history = [];
  state.gameOver = false;
  state.winner = null;
  state.rematchActive = false;
  // wins persist only during rematch chain
  if (!state.rematchActive) state.wins = { 0: 0, 1: 0 };

  let labels = [];
  if (mode === '1v1') labels = ['Player 1', 'Player 2'];
  else if (mode === '2v2') labels = ['Team 1 Player A', 'Team 1 Player B', 'Team 2 Player A', 'Team 2 Player B'];
  else labels = ['Player 1', 'Player 2', 'Player 3'];

  app.innerHTML = `
    <div class="screen">
      <div class="header">
        <button class="back" onclick="resetToHome()">←</button>
        <span>Setup</span>
        <span></span>
      </div>
      <h2 style="text-align:center; margin:20px 0;">Enter Names</h2>
      ${labels.map((l, i) => `
        <div class="input-group">
          <label>${l}</label>
          <input id="name${i}" placeholder="${l}" value="${l.split(' ')[0]}">
        </div>
      `).join('')}
      <button class="btn primary" onclick="startGame()">START GAME</button>
    </div>
  `;
}

function startGame() {
  const inputs = app.querySelectorAll('input');
  state.players = Array.from(inputs).map((inp, i) => ({
    name: inp.value || `Player ${i+1}`,
    score: 0,
    strikes: 0,
    throws: 0,
    points: [],
    side: state.mode === '2v2' ? Math.floor(i / 2) : i
  }));
  state.currentIndex = 0;
  state.history = [];
  state.gameOver = false;
  saveState();
  render();
}

function renderGame() {
  const current = state.players[state.currentIndex];
  const sides = getSides();

  let tallyHtml = '';
  if (state.rematchActive && state.mode !== '3p') {
    tallyHtml = `<div class="tally">Wins: ${sides[0].name || 'Side A'} ${state.wins[0]} – ${state.wins[1]} ${sides[1].name || 'Side B'}</div>`;
  }

  app.innerHTML = `
    <div class="screen">
      <button class="theme-toggle" onclick="toggleTheme()">🌙</button>
      <div class="header">
        <button class="back" onclick="resetToHome()">←</button>
        <span></span>
        <button class="undo" onclick="undo()">Undo</button>
      </div>
      ${tallyHtml}
      <div class="scores">
        ${sides.map((s, idx) => `
          <div class="score-block">
            <div class="score ${idx === getCurrentSide() ? 'active' : ''}">${s.score}</div>
            <div class="name">${s.displayName}</div>
            ${s.subNames ? `<div class="name sub">${s.subNames}</div>` : ''}
            ${s.strikes > 0 ? `<div class="strike">${'⊘'.repeat(s.strikes)}</div>` : ''}
          </div>
        `).join('')}
      </div>
      <div class="numpad">
        <div class="numpad-grid">
          ${[1,2,3,4,5,6,7,8,9,10,11,12].map(n => `<button class="num-btn" onclick="score(${n})">${n}</button>`).join('')}
        </div>
        <button class="strike-btn" onclick="score(0)">STRIKE</button>
      </div>
    </div>
  `;
}

function getSides() {
  if (state.mode === '2v2') {
    const t1 = state.players.filter(p => p.side === 0);
    const t2 = state.players.filter(p => p.side === 1);
    return [
      { score: t1.reduce((a,p)=>a+p.score,0), displayName: t1[0].name, subNames: t1[1]?.name, strikes: t1[0].strikes, side: 0 },
      { score: t2.reduce((a,p)=>a+p.score,0), displayName: t2[0].name, subNames: t2[1]?.name, strikes: t2[0].strikes, side: 1 }
    ];
  }
  return state.players.map(p => ({ score: p.score, displayName: p.name, strikes: p.strikes, side: p.side }));
}

function getCurrentSide() {
  return state.players[state.currentIndex].side;
}

function score(points) {
  if (state.gameOver) return;
  const p = state.players[state.currentIndex];
  const oldScore = p.score;
  const oldStrikes = p.strikes;

  state.history.push(JSON.parse(JSON.stringify(state.players)));

  p.throws++;
  p.points.push(points);

  if (points === 0) {
    p.strikes++;
    if (p.strikes >= 3) {
      eliminate(p);
      return;
    }
  } else {
    p.strikes = 0;
    let newScore = p.score + points;
    if (newScore > 50) newScore = 25;
    p.score = newScore;
    if (p.score === 50) {
      win(p);
      return;
    }
  }

  // next player
  state.currentIndex = (state.currentIndex + 1) % state.players.length;
  // skip eliminated if any
  while (state.players[state.currentIndex].eliminated) {
    state.currentIndex = (state.currentIndex + 1) % state.players.length;
  }
  saveState();
  render();
}

function eliminate(p) {
  p.eliminated = true;
  // check if only one left
  const active = state.players.filter(pl => !pl.eliminated);
  if (active.length <= 1) {
    if (active.length === 1) win(active[0]);
    else endGame(null);
  } else {
    state.currentIndex = (state.currentIndex + 1) % state.players.length;
    while (state.players[state.currentIndex].eliminated) {
      state.currentIndex = (state.currentIndex + 1) % state.players.length;
    }
    saveState();
    render();
  }
}

function win(p) {
  state.gameOver = true;
  state.winner = p;
  // update wins tally for rematch
  if (state.mode !== '3p') {
    const side = p.side;
    state.wins[side] = (state.wins[side] || 0) + 1;
  }
  saveState();
  render();
}

function endGame(winner) {
  state.gameOver = true;
  state.winner = winner;
  saveState();
  render();
}

function undo() {
  if (state.history.length === 0) return;
  state.players = state.history.pop();
  // find current
  state.gameOver = false;
  saveState();
  render();
}

function renderEnd() {
  const sides = getSides();
  let title = state.winner ? 'VICTORY!' : 'DISQUALIFIED';
  let tallyHtml = '';
  if (state.rematchActive && state.mode !== '3p') {
    tallyHtml = `<div class="tally">Series: ${state.wins[0]} – ${state.wins[1]}</div>`;
  }

  // simple stats
  const stats = state.players.map(p => {
    const avg = p.throws ? (p.score / p.throws).toFixed(1) : '0.0';
    return { name: p.name, score: p.score, avg, strikes: p.strikes };
  }).sort((a,b) => b.score - a.score);

  app.innerHTML = `
    <div class="screen">
      <div class="victory">
        <h1>${title}</h1>
        ${tallyHtml}
        <div class="scores">
          ${sides.map(s => `<div class="score-block"><div class="score">${s.score}</div><div class="name">${s.displayName}</div></div>`).join('')}
        </div>
      </div>
      <div class="stats">
        <h3 style="text-align:center; margin-bottom:10px;">MATCH STATS</h3>
        <table>
          <tr><th>#</th><th>Name</th><th>Score</th><th>Avg</th><th>Strikes</th></tr>
          ${stats.map((s,i) => `<tr><td class="rank">${i+1}</td><td>${s.name}</td><td>${s.score}</td><td>${s.avg}</td><td>${s.strikes}</td></tr>`).join('')}
        </table>
      </div>
      <button class="btn primary" onclick="rematch()">REMATCH</button>
      <button class="btn" onclick="resetToHome()">MAIN MENU</button>
    </div>
  `;
}

function rematch() {
  state.rematchActive = true;
  state.players.forEach(p => {
    p.score = 0;
    p.strikes = 0;
    p.throws = 0;
    p.points = [];
    p.eliminated = false;
  });
  state.currentIndex = 0;
  state.history = [];
  state.gameOver = false;
  state.winner = null;
  saveState();
  render();
}

function resetToHome() {
  state.mode = null;
  state.rematchActive = false;
  state.wins = { 0: 0, 1: 0 };
  saveState();
  render();
}

function showRules() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <button class="close" onclick="this.closest('.modal').remove()">×</button>
      <h2 style="text-align:center;">HOW TO PLAY<br><span style="font-size:28px;">finska</span></h2>
      <div class="pins">
        <div class="pin-row"><div class="pin">7</div><div class="pin">9</div><div class="pin">8</div></div>
        <div class="pin-row"><div class="pin">5</div><div class="pin">11</div><div class="pin">12</div><div class="pin">6</div></div>
        <div class="pin-row"><div class="pin">3</div><div class="pin">10</div><div class="pin">4</div></div>
        <div class="pin-row"><div class="pin">1</div><div class="pin">2</div></div>
      </div>
      <p>Finska can be played as a 1v1, 2v2 or 3 players.</p>
      <p style="margin-top:12px;">To start, all 12 pins are arranged as shown above.</p>
      <p style="margin-top:12px;"><strong>The goal is to reach exactly 50 points.</strong><br>Any player or team that exceeds 50 points gets their score back to 25.</p>
      <p style="margin-top:12px;">Players take turns throwing the finska (throwing stick) at the pins behind a line placed 3–4 metres from the pins.</p>
      <p style="margin-top:12px;">Single pin = the number on the pin.<br>Multiple pins = 1 point per pin.</p>
      <p style="margin-top:12px;">Three consecutive misses (strikes) eliminate the player/team.</p>
    </div>
  `;
  document.body.appendChild(modal);
}

function toggleTheme() {
  state.dark = !state.dark;
  saveState();
  render();
}

// init
loadState();
render();

// expose for onclick
window.startSetup = startSetup;
window.startGame = startGame;
window.score = score;
window.undo = undo;
window.rematch = rematch;
window.resetToHome = resetToHome;
window.showRules = showRules;
window.toggleTheme = toggleTheme;
