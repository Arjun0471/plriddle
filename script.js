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

const correctSound = document.getElementById('correctSound');
const wrongSound = document.getElementById('wrongSound');
const winSound = document.getElementById('winSound');
const darkModeToggle = document.getElementById('darkModeToggle');
const leaderboardList = document.getElementById('leaderboardList');

darkModeToggle.addEventListener('click', () => {
  try {
    document.body.dataset.theme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', document.body.dataset.theme);
  } catch (error) {
    console.error('Error toggling dark mode:', error);
  }
});

document.body.dataset.theme = localStorage.getItem('theme') || 'light';

async function fetchFPLData() {
  const modal = document.getElementById('modal');
  const modalMessage = document.getElementById('modalMessage');
  modalMessage.textContent = 'Loading player data...';
  modal.style.display = 'flex';

  try {
    const response = await fetch('./fpl-data-raw.json');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
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

    modal.style.display = 'none';
    return { players };
  } catch (error) {
    console.error('Error loading FPL data:', error);
    showModal('Failed to load player data. Check console or refresh.');
    return { players: [] };
  }
}

function getDailyPlayer(players) {
  try {
    const now = new Date();
    const seed = now.getDate() + now.getMonth() + now.getFullYear();
    const index = seed % players.length;
    return players[index];
  } catch (error) {
    console.error('Error selecting daily player:', error);
    return null;
  }
}

function setupAutocomplete() {
  const input = document.getElementById('guessInput');
  if (!input) return;

  const autocomplete = document.createElement('div');
  autocomplete.id = 'autocomplete';
  input.parentNode.insertBefore(autocomplete, input.nextSibling);

  input.addEventListener('input', debounce(() => {
    try {
      const value = input.value.toLowerCase();
      const suggestions = players.filter(p => p.name.toLowerCase().includes(value)).slice(0, 5);
      autocomplete.innerHTML = suggestions.map(p => `<div>${p.name} (${p.team})</div>`).join('');
      autocomplete.style.display = suggestions.length ? 'block' : 'none';
    } catch (error) {
      console.error('Error in autocomplete:', error);
    }
  }, 300));

  autocomplete.addEventListener('click', (e) => {
    try {
      if (e.target.tagName === 'DIV') {
        input.value = e.target.textContent.split(' (')[0];
        autocomplete.style.display = 'none';
        submitGuess();
      }
    } catch (error) {
      console.error('Error selecting autocomplete suggestion:', error);
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
  try {
    const silhouette = document.getElementById('silhouette');
    if (silhouette) {
      silhouette.src = 'silhouette.png';
    }
  } catch (error) {
    console.error('Error setting up silhouette:', error);
  }
}

function setupDailyTip() {
  try {
    const tip = document.createElement('p');
    tip.textContent = 'Tip: Guess based on team and stats!';
    tip.style.textAlign = 'center';
    tip.style.marginTop = '0.5rem';
    tip.style.color = '#a3bffa';
    document.getElementById('game').appendChild(tip);
  } catch (error) {
    console.error('Error setting up daily tip:', error);
  }
}

function updateAuthLink() {
  try {
    const loginLink = document.getElementById('loginLink');
    const logoutLink = document.getElementById('logoutLink');
    if (user) {
      loginLink.style.display = 'none';
      logoutLink.style.display = 'inline';
    } else {
      loginLink.style.display = 'inline';
      logoutLink.style.display = 'none';
    }
  } catch (error) {
    console.error('Error updating auth link:', error);
  }
}

function showModal(message) {
  try {
    const modal = document.getElementById('modal');
    const modalMessage = document.getElementById('modalMessage');
    modalMessage.textContent = message;
    modal.style.display = 'flex';
    document.getElementById('closeModal').focus();
    document.getElementById('closeModal').addEventListener('click', () => {
      modal.style.display = 'none';
    });
  } catch (error) {
    console.error('Error showing modal:', error);
  }
}

function createConfetti() {
  try {
    const colors = ['#ff0', '#f00', '#0f0', '#00f', '#ff69b4'];
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = `${Math.random() * 100}vw`;
      confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = `${Math.random() * 2}s`;
      document.body.appendChild(confetti);
    }
  } catch (error) {
    console.error('Error creating confetti:', error);
  }
}

function updateLeaderboard(guesses) {
  try {
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
    leaderboard.push({ name: user ? user.username : 'Anonymous', guesses, date: new Date().toLocaleDateString() });
    leaderboard.sort((a, b) => a.guesses - b.guesses);
    leaderboard = leaderboard.slice(0, 5);
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    renderLeaderboard();
  } catch (error) {
    console.error('Error updating leaderboard:', error);
  }
}

function renderLeaderboard() {
  try {
    const leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
    leaderboardList.innerHTML = leaderboard.length ? leaderboard.map((entry, index) => `<li>${index + 1}. ${entry.name} - ${entry.guesses} guesses (${entry.date})</li>`).join('') : '<li>No scores yet!</li>';
  } catch (error) {
    console.error('Error rendering leaderboard:', error);
    leaderboardList.innerHTML = '<li>Error loading leaderboard.</li>';
  }
}

function updateGuessTable(player) {
  try {
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

    let isCorrect = false;
    cells.forEach((cell, index) => {
      const td = row.insertCell();
      td.textContent = cell;
      const mysteryValue = [mysteryPlayer.name, mysteryPlayer.team, mysteryPlayer.position, mysteryPlayer.age, mysteryPlayer.appearances, mysteryPlayer.goals, mysteryPlayer.assists][index];
      if (index === 0) {
        td.style.backgroundColor = cell === mysteryValue ? '#d4edda' : '#f8d7da';
        isCorrect = cell === mysteryValue;
      } else if (index === 3) {
        td.style.backgroundColor = cell === mysteryValue ? '#d4edda' : (Math.abs(cell - mysteryValue) <= 5 ? '#fff3cd' : '#f8d7da');
      } else {
        td.style.backgroundColor = cell === mysteryValue ? '#d4edda' : '#f8d7da';
      }
    });

    try {
      if (isCorrect) {
        correctSound.play();
      } else {
        wrongSound.play();
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }

    if (table.rows.length >= 8) {
      document.getElementById('submitGuess').disabled = true;
      showModal(`Game Over! The player was ${mysteryPlayer.name}.`);
    }
  } catch (error) {
    console.error('Error updating guess table:', error);
  }
}

function checkWin() {
  try {
    const table = document.getElementById('guessTable').querySelector('tbody');
    const lastRow = table.rows[table.rows.length - 1];
    const playerCell = lastRow.cells[0];
    if (playerCell.textContent === mysteryPlayer.name) {
      showModal(`Congratulations! You found ${mysteryPlayer.name} in ${table.rows.length} guesses!`);
      document.getElementById('submitGuess').disabled = true;
      lastRow.style.animation = 'celebrate 0.5s ease';
      try {
        winSound.play();
      } catch (error) {
        console.error('Error playing win sound:', error);
      }
      createConfetti();
      updateLeaderboard(table.rows.length);
    }
  } catch (error) {
    console.error('Error checking win:', error);
  }
}

function submitGuess() {
  try {
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
  } catch (error) {
    console.error('Error submitting guess:', error);
    showModal('Error submitting guess. Check console.');
  }
}

async function init() {
  try {
    const data = await fetchFPLData();
    players = data.players;
    if (players.length === 0) {
      showModal('No players loaded. Please refresh the page.');
      return;
    }

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

    if (!mysteryPlayer) {
      showModal('Error selecting mystery player. Please refresh.');
      return;
    }

    setupAutocomplete();
    setupSilhouette();
    setupDailyTip();
    updateAuthLink();
    renderLeaderboard();
  } catch (error) {
    console.error('Error initializing game:', error);
    showModal('Failed to initialize game. Check console or refresh.');
  }
}

init();