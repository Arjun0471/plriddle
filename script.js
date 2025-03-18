let players = [];
let mysteryPlayer = null;
let guesses = 0;
let guessHistory = [];
let user = null;
const maxGuesses = 8;

async function fetchFPLData() {
  try {
    const response = await fetch('https://arjun0471.github.io/plriddle/fpl-data-raw.json');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Fetched data:', data); // Debug log
    const teams = data.teams.map(t => ({ name: t.name, short: t.short_name }));
    const players = data.elements
      .filter(player => player.element_type >= 1 && player.element_type <= 4)
      .map(player => ({
        name: `${player.first_name} ${player.second_name}`,
        team: teams.find(t => t.id === player.team).name,
        position: ['GKP', 'DEF', 'MID', 'FWD'][player.element_type - 1],
        age: Math.floor(Math.random() * 15) + 20,
        appearances: Math.min(Math.floor(player.total_points / 3) + Math.floor(Math.random() * 5), 38),
        goals: player.goals_scored,
        assists: player.assists,
        code: player.code
      }));
    return { teams, players };
  } catch (error) {
    console.error('Error loading FPL data:', error);
    showModal('Failed to load player data. Check console or refresh.');
    return { teams: [], players: [] };
  }
}

function getDailyPlayer(players) {
  const today = new Date().toDateString();
  const seed = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = seed % players.length;
  return players[index];
}

function setupAutocomplete() {
  const input = document.getElementById('playerInput');
  const suggestions = document.getElementById('suggestions');
  let selectedIndex = -1;

  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();
    suggestions.innerHTML = '';
    selectedIndex = -1;
    if (query.length < 2) {
      suggestions.style.display = 'none';
      return;
    }

    const matches = players
      .filter(p => p.name.toLowerCase().includes(query))
      .slice(0, 5);
    if (matches.length > 0) {
      matches.forEach((player, i) => {
        const li = document.createElement('li');
        li.textContent = player.name;
        li.onclick = () => {
          input.value = player.name;
          suggestions.style.display = 'none';
        };
        suggestions.appendChild(li);
      });
      suggestions.style.display = 'block';
    } else {
      suggestions.style.display = 'none';
    }
  });

  input.addEventListener('keydown', (e) => {
    const items = suggestions.querySelectorAll('li');
    if (!items.length || suggestions.style.display === 'none') return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
      updateSelection(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, -1);
      updateSelection(items);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      input.value = items[selectedIndex].textContent;
      suggestions.style.display = 'none';
      submitGuess();
    }
  });

  input.addEventListener('blur', () => setTimeout(() => suggestions.style.display = 'none', 100));
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && selectedIndex < 0) submitGuess();
  });

  function updateSelection(items) {
    items.forEach((item, i) => item.classList.toggle('selected', i === selectedIndex));
    if (selectedIndex >= 0) input.value = items[selectedIndex].textContent;
  }
}

function setupSilhouette() {
  const silhouette = document.getElementById('silhouette');
  silhouette.src = `https://resources.premierleague.com/premierleague/photos/players/110x140/p${mysteryPlayer.code}.png`;
  silhouette.style.display = 'block';

  const toggleButton = document.getElementById('toggleSilhouette');
  let isShown = false;
  toggleButton.onclick = () => {
    if (guesses < maxGuesses && !silhouette.classList.contains('revealed')) {
      isShown = !isShown;
      silhouette.classList.toggle('shown', isShown);
      toggleButton.textContent = isShown ? 'Hide Silhouette' : 'Show Silhouette';
    }
  };
}

function revealImage() {
  const silhouette = document.getElementById('silhouette');
  silhouette.classList.remove('shown');
  silhouette.classList.add('revealed');
  document.getElementById('toggleSilhouette').disabled = true;
}

function setupTeams(teams) {
  const teamList = document.getElementById('teamList');
  teams.forEach(team => {
    const li = document.createElement('li');
    li.textContent = team.short;
    li.title = team.name;
    teamList.appendChild(li);
  });

  const toggleBtn = document.getElementById('toggleTeams');
  const sidebar = document.getElementById('teamSidebar');
  const showBtn = document.getElementById('showTeamsBtn');
  toggleBtn.onclick = () => {
    sidebar.classList.toggle('hidden');
    toggleBtn.textContent = sidebar.classList.contains('hidden') ? 'Show' : 'Hide';
  };
  showBtn.onclick = () => {
    sidebar.style.display = 'block';
    sidebar.classList.remove('hidden');
    toggleBtn.textContent = 'Hide';
  };
}

function setupDailyTip() {
  const tips = [
    "Check the silhouette for position hints!",
    "Midfielders often have high assists.",
    "Young players may have fewer appearances.",
    "Goalkeepers rarely score goals."
  ];
  const tip = tips[Math.floor(Math.random() * tips.length)];
  document.getElementById('dailyTip').textContent = tip;
}

function getShareText() {
  let text = `PL Riddle ${new Date().toLocaleDateString()} ${guesses}/${maxGuesses}\n\n`;
  guessHistory.forEach(guess => {
    const row = [
      guess.name === mysteryPlayer.name ? '🟩' : '⬜',
      guess.team === mysteryPlayer.team ? '🟩' : '⬜',
      guess.position === mysteryPlayer.position ? '🟩' : '⬜',
      guess.age === mysteryPlayer.age ? '🟩' : Math.abs(guess.age - mysteryPlayer.age) <= 5 ? '🟨' : '⬜',
      guess.appearances === mysteryPlayer.appearances ? '🟩' : Math.abs(guess.appearances - mysteryPlayer.appearances) <= 5 ? '🟨' : '⬜',
      guess.goals === mysteryPlayer.goals ? '🟩' : Math.abs(guess.goals - mysteryPlayer.goals) <= 2 ? '🟨' : '⬜',
      guess.assists === mysteryPlayer.assists ? '🟩' : Math.abs(guess.assists - mysteryPlayer.assists) <= 2 ? '🟨' : '⬜'
    ];
    text += row.join('') + '\n';
  });
  return text;
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
  setupTeams(data.teams);
  setupDailyTip();
  updateAuthLink();
}

function updateGuessCounter() {
  document.getElementById('guessCount').textContent = `${guesses}/${maxGuesses}`;
}

function showModal(message, showShare = false) {
  const modal = document.getElementById('modal');
  const result = document.getElementById('result');
  const shareBtn = document.getElementById('shareBtn');
  const closeGameBtn = document.getElementById('closeGameBtn');
  result.textContent = message;
  shareBtn.style.display = showShare ? 'inline-block' : 'none';
  closeGameBtn.style.display = showShare ? 'inline-block' : 'none';
  modal.style.display = 'block';
  if (showShare) {
    shareBtn.onclick = () => {
      navigator.clipboard.writeText(getShareText());
      shareBtn.textContent = 'Copied!';
      setTimeout(() => shareBtn.textContent = 'Share', 2000);
    };
    closeGameBtn.onclick = () => modal.style.display = 'none';
  }
  document.getElementById('modalClose').onclick = () => modal.style.display = 'none';
}

function submitGuess() {
  const input = document.getElementById('playerInput');
  const guessName = input.value.trim();
  const guess = players.find(p => p.name.toLowerCase() === guessName.toLowerCase());
  input.value = '';
  document.getElementById('suggestions').style.display = 'none';

  if (!guess || guesses >= maxGuesses) return;

  guesses++;
  guessHistory.push(guess);
  updateGuessCounter();
  const tbody = document.querySelector('#guessTable tbody');
  const row = document.createElement('tr');

  const fields = ['name', 'team', 'position', 'age', 'appearances', 'goals', 'assists'];
  fields.forEach(field => {
    const cell = document.createElement('td');
    let cellText = guess[field];
    if (['age', 'appearances', 'goals', 'assists'].includes(field)) {
      const diff = guess[field] - mysteryPlayer[field];
      if (diff !== 0) {
        const arrow = document.createElement('span');
        arrow.classList.add(diff < 0 ? 'arrow-up' : 'arrow-down');
        cell.appendChild(document.createTextNode(guess[field] + ' '));
        cell.appendChild(arrow);
      } else {
        cell.textContent = cellText;
      }
    } else {
      cell.textContent = cellText;
    }
    if (field === 'name') {
      cell.classList.add(guess[field] === mysteryPlayer[field] ? 'green' : 'gray');
    } else if (['age', 'appearances'].includes(field)) {
      const diff = Math.abs(guess[field] - mysteryPlayer[field]);
      cell.classList.add(guess[field] === mysteryPlayer[field] ? 'green' : diff <= 5 ? 'yellow' : 'gray');
    } else if (['goals', 'assists'].includes(field)) {
      const diff = Math.abs(guess[field] - mysteryPlayer[field]);
      cell.classList.add(guess[field] === mysteryPlayer[field] ? 'green' : diff <= 2 ? 'yellow' : 'gray');
    } else {
      cell.classList.add(guess[field] === mysteryPlayer[field] ? 'green' : 'gray');
    }
    row.appendChild(cell);
  });
  tbody.appendChild(row);

  if (guess.name === mysteryPlayer.name) {
    if (user) {
      user.streak = (user.streak || 0) + 1;
      localStorage.setItem('user', JSON.stringify(user));
    }
    showModal(`You got it in ${guesses} guesses!`, true);
    input.disabled = true;
    document.querySelector('button').disabled = true;
    revealImage();
  } else if (guesses === maxGuesses) {
    if (user) {
      user.streak = 0;
      localStorage.setItem('user', JSON.stringify(user));
    }
    showModal(`Game over! It was ${mysteryPlayer.name}.`, true);
    input.disabled = true;
    document.querySelector('button').disabled = true;
    revealImage();
  }
}

function updateAuthLink() {
  const authLink = document.getElementById('authLink');
  if (user) {
    authLink.textContent = `Logout (${user.username})`;
    authLink.href = '#';
    authLink.onclick = () => {
      localStorage.removeItem('user');
      user = null;
      updateAuthLink();
    };
  } else {
    authLink.textContent = 'Login/Register';
    authLink.href = 'login.html';
  }
}

window.onload = init;