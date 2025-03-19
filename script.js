const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

const teamMapping = {
  1: "Arsenal",
  2: "Aston Villa",
  3: "Bournemouth",
  4: "Brentford",
  5: "Brighton",
  6: "Chelsea",
  7: "Crystal Palace",
  8: "Everton",
  9: "Fulham",
  10: "Ipswich",
  11: "Leicester",
  12: "Liverpool",
  13: "Man City",
  14: "Man Utd",
  15: "Newcastle",
  16: "Nott'm Forest",
  17: "Southampton",
  18: "Spurs",
  19: "West Ham",
  20: "Wolves"
};

let players = [];
let mysteryPlayer = null;
let user = null;

async function fetchFPLData() {
  const modal = document.getElementById('modal');
  const modalMessage = document.getElementById('modalMessage');
  modalMessage.textContent = 'Loading player data...';
  modal.style.display = 'flex';

  try {
    console.log('Attempting to fetch data from: ./fpl-data-raw.json');
    const response = await fetch('./fpl-data-raw.json');
    console.log('Fetch response:', response);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Fetched data successfully:', data);

    if (!data.elements) {
      throw new Error("Invalid JSON structure: 'elements' missing.");
    }

    const currentDate = new Date('2025-03-18');

    const players = data.elements
      .filter(player => player.element_type >= 1 && player.element_type <= 4)
      .map(player => {
        let age = null;
        if (player.birth_date) {
          const birthDate = new Date(player.birth_date);
          const ageDiffMs = currentDate - birthDate;
          const ageDate = new Date(ageDiffMs);
          age = Math.abs(ageDate.getUTCFullYear() - 1970);
        } else {
          age = Math.floor(Math.random() * 15) + 20;
        }

        return {
          name: `${player.first_name} ${player.second_name}`,
          team: teamMapping[player.team] || `Team ${player.team}`,
          position: ['GKP', 'DEF', 'MID', 'FWD'][player.element_type - 1],
          age: age,
          appearances: Math.min(Math.floor(player.total_points / 3) + Math.floor(Math.random() * 5), 38),
          goals: player.goals_scored,
          assists: player.assists,
          code: player.code
        };
      });

    console.log('Processed players:', players);
    modal.style.display = 'none';
    return { players };
  } catch (error) {
    console.error('Error loading FPL data:', error);
    showModal('Failed to load player data. Check console or refresh.');
    return { players: [] };
  }
}

function getDailyPlayer(players) {
  const now = new Date();
  const seed = now.getDate() + now.getMonth() + now.getFullYear();
  const index = seed % players.length;
  return players[index];
}

function setupAutocomplete() {
  const input = document.getElementById('guessInput');
  const autocomplete = document.createElement('div');
  autocomplete.id = 'autocomplete';
  input.parentNode.insertBefore(autocomplete, input.nextSibling);

  input.addEventListener('input', debounce(() => {
    const value = input.value.toLowerCase();
    const suggestions = players.filter(p => p.name.toLowerCase().includes(value)).slice(0, 5);
    autocomplete.innerHTML = suggestions.map(p => `<div>${p.name} (${p.team})</div>`).join('');
    autocomplete.style.display = suggestions.length ? 'block' : 'none';
  }, 300));

  autocomplete.addEventListener('click', (e) => {
    if (e.target.tagName === 'DIV') {
      input.value = e.target.textContent.split(' (')[0];
      autocomplete.style.display = 'none';
      submitGuess();
    }
  });

  input.addEventListener('blur', () => {
    setTimeout(() => (autocomplete.style.display = 'none'), 200);
  });

  input.addEventListener('touchend', (e) => {
    if (e.target === input && !input.value) e.preventDefault();
  });

  document.getElementById('submitGuess').addEventListener('touchend', (e) => {
    e.preventDefault();
    submitGuess();
  });
}

function setupSilhouette() {
  const silhouette = document.getElementById('silhouette');
  silhouette.src = `silhouette.png`;
}

function setupTeams(teams) {
  const ul = document.getElementById('teams').querySelector('ul');
  ul.innerHTML = teams.map(team => `<li>${team.name}</li>`).join('');
  ul.addEventListener('click', (e) => {
    if (e.target.tagName === 'LI') {
      const team = e.target.textContent;
      const filteredPlayers = players.filter(p => p.team === team);
      if (filteredPlayers.length > 0) {
        mysteryPlayer = filteredPlayers[Math.floor(Math.random() * filteredPlayers.length)];
        document.getElementById('guessTable').querySelector('tbody').innerHTML = '';
        document.getElementById('submitGuess').disabled = false;
        e.target.style.backgroundColor = '#d4edda'; // Highlight selected team
        setTimeout(() => (e.target.style.backgroundColor = ''), 1000);
      }
    }
  });
}

function setupDailyTip() {
  const tip = document.createElement('p');
  tip.textContent = 'Tip: Guess based on team and stats!';
  tip.style.textAlign = 'center';
  tip.style.marginTop = '0.5rem';
  tip.style.color = '#1e3a8a';
  document.getElementById('game').appendChild(tip);
}

function updateAuthLink() {
  const loginLink = document.getElementById('loginLink');
  const logoutLink = document.getElementById('logoutLink');
  if (user) {
    loginLink.style.display = 'none';
    logoutLink.style.display = 'inline';
  } else {
    loginLink.style.display = 'inline';
    logoutLink.style.display = 'none';
  }
}

function showModal(message) {
  const modal = document.getElementById('modal');
  const modalMessage = document.getElementById('modalMessage');
  modalMessage.textContent = message;
  modal.style.display = 'flex';
  document.getElementById('closeModal').focus();
  document.getElementById('closeModal').addEventListener('click', () => {
    modal.style.display = 'none';
  });
}

function createConfetti() {
  const colors = ['#ff0', '#f00', '#0f0', '#00f', '#ff69b4'];
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = `${Math.random() * 100}vw`;
    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = `${Math.random() * 2}s`;
    document.body.appendChild(confetti);
  }
}

function updateGuessTable(player) {
  const table = document.getElementById('guessTable').querySelector('tbody');
  const row = table.insertRow();
  row.style.opacity = '0';
  row.style.transform = 'translateY(20px)';
  setTimeout(() => {
    row.style.transition = 'all 0.5s ease';
    row.style.opacity = '1';
    row.style.transform = 'translateY(0)';
  }, 10);

  const cells = [
    player.name,
    player.team,
    player.position,
    player.age,
    player.appearances,
    player.goals,
    player.assists
  ];

  cells.forEach((cell, index) => {
    const td = row.insertCell();
    td.textContent = cell;
    const mysteryValue = [mysteryPlayer.name, mysteryPlayer.team, mysteryPlayer.position, mysteryPlayer.age, mysteryPlayer.appearances, mysteryPlayer.goals, mysteryPlayer.assists][index];
    if (index === 0) {
      td.style.backgroundColor = cell === mysteryValue ? '#d4edda' : '#f8d7da';
    } else if (index === 3) {
      td.style.backgroundColor = cell === mysteryValue ? '#d4edda' : (Math.abs(cell - mysteryValue) <= 5 ? '#fff3cd' : '#f8d7da');
    } else {
      td.style.backgroundColor = cell === mysteryValue ? '#d4edda' : '#f8d7da';
    }
  });

  if (table.rows.length >= 8) {
    document.getElementById('submitGuess').disabled = true;
    showModal(`Game Over! The player was ${mysteryPlayer.name}.`);
  }
}

function checkWin() {
  const table = document.getElementById('guessTable').querySelector('tbody');
  const lastRow = table.rows[table.rows.length - 1];
  const playerCell = lastRow.cells[0];
  if (playerCell.textContent === mysteryPlayer.name) {
    showModal(`Congratulations! You found ${mysteryPlayer.name} in ${table.rows.length} guesses!`);
    document.getElementById('submitGuess').disabled = true;
    lastRow.style.animation = 'celebrate 0.5s ease';
    createConfetti();
  }
}

function submitGuess() {
  const input = document.getElementById('guessInput');
  const guess = input.value.trim();
  if (!guess) return;

  const player = players.find(p => p.name.toLowerCase() === guess.toLowerCase());
  if (!player) {
    showModal('Player not found!');
    return;
  }

  updateGuessTable(player);
  input.value = '';
  document.getElementById('autocomplete').style.display = 'none';
  checkWin();
}

async function init() {
  const data = await fetchFPLData();
  players = data.players;
  if (players.length === 0) return;

  user = JSON.parse(localStorage.getItem('user')) || null;
  if (user && user.username === 'admin') {
    const manualPlayer = prompt('Enter player name or leave blank for random:');
    if (manualPlayer) {
      mysteryPlayer = players.find(p => p.name.toLowerCase() === manualPlayer.toLowerCase()) || getDailyPlayer(players);
    } else {
      mysteryPlayer = getDailyPlayer(players);
    }
  } else {
    mysteryPlayer = getDailyPlayer(players);
  }

  setupAutocomplete();
  setupSilhouette();
  const teams = Object.values(teamMapping).map((name, index) => ({
    short: name,
    name: name
  }));
  setupTeams(teams);
  setupDailyTip();
  updateAuthLink();
}

init();