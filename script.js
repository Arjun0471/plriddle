const teamMapping = {
  1: "Arsenal", 2: "Aston Villa", 3: "Bournemouth", 4: "Brentford", 5: "Brighton",
  6: "Chelsea", 7: "Crystal Palace", 8: "Everton", 9: "Fulham", 10: "Ipswich",
  11: "Leicester", 12: "Liverpool", 13: "Man City", 14: "Man Utd", 15: "Newcastle",
  16: "Nott'm Forest", 17: "Southampton", 18: "Spurs", 19: "West Ham", 20: "Wolves"
};

const badgeMapping = {
  1: "t3", 2: "t7", 3: "t91", 4: "t94", 5: "t36", 6: "t8", 7: "t31", 8: "t11",
  9: "t54", 10: "t40", 11: "t13", 12: "t14", 13: "t43", 14: "t1", 15: "t4",
  16: "t17", 17: "t20", 18: "t6", 19: "t21", 20: "t39"
};

let players = [];
let mysteryPlayer = null;
let guesses = 0;
let guessHistory = [];
let user = null;
const maxGuesses = 8;
let timerInterval = null;
let timeLeft = 120;

async function checkImageExists(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

let attributeBounds = {
  age: { min: 0, max: Infinity },
  minutes: { min: 0, max: Infinity },
  goals: { min: 0, max: Infinity },
  assists: { min: 0, max: Infinity },
  days_at_club: { min: 0, max: Infinity }
};

function updateBoundsFromGuess(guess) {
  // Update bounds based on the guess
  ['age', 'minutes', 'goals', 'assists', 'days_at_club'].forEach(attr => {
    const guessValue = guess[attr];
    const actualValue = mysteryPlayer[attr];
    if (guessValue < actualValue) {
      attributeBounds[attr].min = Math.max(attributeBounds[attr].min, guessValue + 1);
    } else if (guessValue > actualValue) {
      attributeBounds[attr].max = Math.min(attributeBounds[attr].max, guessValue - 1);
    }
  });
}

function updateBoundsFromHint(attr, direction, hintValue) {
  if (direction === 'higher') {
    attributeBounds[attr].min = Math.max(attributeBounds[attr].min, hintValue + 1);
  } else {
    attributeBounds[attr].max = Math.min(attributeBounds[attr].max, hintValue - 1);
  }
}

function isAttributeConverged(attr) {
  const bounds = attributeBounds[attr];
  return bounds.min === bounds.max || (bounds.max - bounds.min <= 1 && attr === 'age'); // For age, max-min <= 1 means a single value
}

function getHint() {
  if (guesses >= maxGuesses) return;
  const attributes = ['team', 'position', 'age', 'minutes', 'goals', 'assists', 'days_at_club'];
  const guessedAttributes = guessHistory.map(g => {
    const attrs = [];
    if (g.team === mysteryPlayer.team) attrs.push('team');
    if (g.position === mysteryPlayer.position) attrs.push('position');
    if (g.age === mysteryPlayer.age) attrs.push('age');
    if (g.minutes === mysteryPlayer.minutes) attrs.push('minutes');
    if (g.goals === mysteryPlayer.goals) attrs.push('goals');
    if (g.assists === mysteryPlayer.assists) attrs.push('assists');
    if (g.days_at_club === mysteryPlayer.days_at_club) attrs.push('days_at_club');
    return attrs;
  }).flat();
  const available = attributes.filter(attr => {
    if (guessedAttributes.includes(attr)) return false;
    if (['team', 'position'].includes(attr)) return true;
    return !isAttributeConverged(attr);
  });
  if (available.length === 0) {
    showModal('No new hints available! All key attributes have been matched or determined.');
    return;
  }
  const hintAttr = available[Math.floor(Math.random() * available.length)];
  guesses++;
  updateGuessCounter();
  const tbody = document.querySelector('#guessTable tbody');
  const row = document.createElement('tr');
  row.style.animationDelay = `${guesses * 0.1}s`;
  row.classList.add('hint-row'); // Add a class for styling
  const fields = ['name', 'team', 'position', 'age', 'minutes', 'goals', 'assists', 'days_at_club'];
  fields.forEach(field => {
    const cell = document.createElement('td');
    if (field === hintAttr) {
      if (field === 'team') {
        const img = document.createElement('img');
        img.src = `https://resources.premierleague.com/premierleague/badges/50/${mysteryPlayer.badgeId}.png`;
        img.alt = mysteryPlayer.team;
        img.classList.add('team-logo');
        cell.appendChild(img);
      } else if (field === 'position') {
        cell.textContent = mysteryPlayer.position;
      } else if (field === 'days_at_club') {
        cell.textContent = mysteryPlayer.days_at_club;
      } else {
        const value = mysteryPlayer[field];
        const direction = Math.random() < 0.5 ? 'higher' : 'lower';
        let hintValue;
        if (field === 'age') {
          hintValue = direction === 'higher' ? value - (Math.floor(Math.random() * 5) + 1) : value + (Math.floor(Math.random() * 5) + 1);
          hintValue = Math.max(0, hintValue);
          cell.textContent = `${direction === 'higher' ? '>' : '<'} ${hintValue}`;
        } else if (field === 'minutes') {
          hintValue = direction === 'higher' ? value - (Math.floor(Math.random() * 500) + 1) : value + (Math.floor(Math.random() * 500) + 1);
          hintValue = Math.max(0, hintValue);
          cell.textContent = `${direction === 'higher' ? '>' : '<'} ${hintValue}`;
        } else if (field === 'goals' || field === 'assists') {
          hintValue = direction === 'higher' ? value - (Math.floor(Math.random() * 2) + 1) : value + (Math.floor(Math.random() * 2) + 1);
          hintValue = Math.max(0, hintValue);
          cell.textContent = `${direction === 'higher' ? '>' : '<'} ${hintValue}`;
        } else if (field === 'days_at_club') {
          hintValue = direction === 'higher' ? value - (Math.floor(Math.random() * 365) + 1) : value + (Math.floor(Math.random() * 365) + 1);
          hintValue = Math.max(0, hintValue);
          cell.textContent = `${direction === 'higher' ? '>' : '<'} ${hintValue}`;
        }
        updateBoundsFromHint(field, direction, hintValue);
      }
      cell.classList.add('yellow');
    } else if (field === 'name') {
      cell.textContent = 'Hint';
      cell.classList.add('gray');
    } else {
      cell.textContent = '-';
      cell.classList.add('gray');
    }
    row.appendChild(cell);
  });
  tbody.appendChild(row);
  if (guesses === maxGuesses) {
    if (user) {
      user.streak = 0;
      localStorage.setItem('user', JSON.stringify(user));
    }
    showModal(`Game over! It was ${mysteryPlayer.name}.`, true);
    document.getElementById('playerInput').disabled = true;
    document.querySelector('button[onclick="submitGuess()"]').disabled = true;
    revealImage();
    updateStats(false);
  }
}

async function fetchFPLData() {
  const spinner = document.getElementById('loadingSpinner');
  spinner.style.display = 'block';
  try {
    const response = await fetch('./fpl-data-raw.json');
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    if (!data.elements) throw new Error("Invalid JSON structure: 'elements' missing.");
    const currentDate = new Date();
    const filteredPlayers = [];
    for (const player of data.elements) {
      const photoUrl = `https://resources.premierleague.com/premierleague/photos/players/250x250/p${player.code}.png`;
      const hasPhoto = await checkImageExists(photoUrl);
      if (
        player.element_type >= 1 &&
        player.element_type <= 4 &&
        player.minutes > 0 &&
        player.birth_date &&
        player.team_join_date &&
        player.goals_scored !== undefined &&
        player.assists !== undefined &&
        player.first_name &&
        player.second_name &&
        player.code &&
        player.team &&
        hasPhoto // Only include players with a valid photo
      ) {
        const birthDate = new Date(player.birth_date);
        const age = Math.floor((currentDate - birthDate) / (1000 * 60 * 60 * 24 * 365.25));
        const joinDate = new Date(player.team_join_date);
        const daysAtClub = Math.floor((currentDate - joinDate) / (1000 * 60 * 60 * 24));
        filteredPlayers.push({
          name: `${player.first_name} ${player.second_name}`,
          team: teamMapping[player.team],
          teamId: player.team,
          badgeId: badgeMapping[player.team],
          position: ['GKP', 'DEF', 'MID', 'FWD'][player.element_type - 1],
          age: age,
          minutes: player.minutes,
          goals: player.goals_scored,
          assists: player.assists,
          days_at_club: daysAtClub,
          code: player.code,
          index: filteredPlayers.length
        });
      }
    }
    players = filteredPlayers;
    spinner.style.display = 'none';
    return { players };
  } catch (error) {
    console.error('Error loading FPL data:', error);
    showModal('Failed to load player data. Check console or refresh.');
    spinner.style.display = 'none';
    return { players: [] };
  }
}

function getDailyPlayer(players) {
  const today = new Date().toDateString();
  const seed = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = seed % players.length;
  return players[index];
}

function getRandomPlayer(players) {
  const randomIndex = Math.floor(Math.random() * players.length);
  return players[randomIndex];
}

function ensureValidMysteryPlayer(players) {
  let selectedPlayer = getDailyPlayer(players);
  return selectedPlayer; // The filtering in fetchFPLData ensures the photo exists
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
      .map(player => {
        const nameLower = player.name.toLowerCase();
        const index = nameLower.indexOf(query);
        return { player, index, score: index === 0 ? 0 : index > -1 ? 1 : 2 };
      })
      .filter(m => m.index > -1)
      .sort((a, b) => a.score - b.score || a.player.name.localeCompare(b.player.name))
      .slice(0, 10); // Show up to 10 suggestions
    if (matches.length > 0) {
      matches.forEach((match, i) => {
        const player = match.player;
        const li = document.createElement('li');
        const name = player.name;
        const index = match.index;
        const queryLength = query.length;
        const beforeMatch = name.substring(0, index);
        const matched = name.substring(index, index + queryLength);
        const afterMatch = name.substring(index + queryLength);
        li.innerHTML = `${beforeMatch}<strong>${matched}</strong>${afterMatch} (${player.team})`;
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
      input.value = items[selectedIndex].textContent.split(' (')[0];
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
    if (selectedIndex >= 0) input.value = items[selectedIndex].textContent.split(' (')[0];
  }
}

function setupSilhouette() {
  const silhouette = document.getElementById('silhouette');
  silhouette.src = `https://resources.premierleague.com/premierleague/photos/players/250x250/p${mysteryPlayer.code}.png`;
  silhouette.onerror = () => {
    silhouette.alt = "Silhouette unavailable";
    silhouette.style.display = 'block'; // Show the alt text if the image fails to load
  };
  silhouette.onload = () => {
    silhouette.style.display = 'block'; // Ensure the image is visible once loaded
  };
  const toggleButton = document.getElementById('toggleSilhouette');
  let isShown = false;
  toggleButton.onclick = () => {
    if (guesses < maxGuesses && !silhouette.classList.contains('revealed')) {
      isShown = !isShown;
      silhouette.classList.toggle('shown', isShown);
      toggleButton.textContent = isShown ? 'Hide Silhouette' : 'Show Silhouette';
    }
  };
  document.getElementById('newPlayerBtn').onclick = randomizePlayer;
  document.getElementById('getHintBtn').onclick = getHint;
  document.getElementById('customPlayerBtn').onclick = setupCustomPlayer;
}

function revealImage() {
  const silhouette = document.getElementById('silhouette');
  silhouette.classList.remove('shown');
  silhouette.classList.add('revealed');
  document.getElementById('toggleSilhouette').disabled = true;
}

function randomizePlayer() {
  guesses = 0;
  guessHistory = [];
  updateGuessCounter();
  document.querySelector('#guessTable tbody').innerHTML = '';
  document.getElementById('playerInput').disabled = false;
  document.getElementById('playerInput').value = '';
  document.querySelector('button[onclick="submitGuess()"]').disabled = false;
  mysteryPlayer = getRandomPlayer(players);
  const silhouette = document.getElementById('silhouette');
  silhouette.src = `https://resources.premierleague.com/premierleague/photos/players/250x250/p${mysteryPlayer.code}.png`;
  silhouette.classList.remove('shown', 'revealed');
  document.getElementById('toggleSilhouette').textContent = 'Show Silhouette';
  document.getElementById('toggleSilhouette').disabled = false;
  document.getElementById('modal').style.display = 'none';
  resetTimer();
  // Reset attribute bounds
  attributeBounds = {
    age: { min: 0, max: Infinity },
    minutes: { min: 0, max: Infinity },
    goals: { min: 0, max: Infinity },
    assists: { min: 0, max: Infinity },
    days_at_club: { min: 0, max: Infinity }
  };
}

function getHint() {
  if (guesses >= maxGuesses) return;
  const attributes = ['team', 'position', 'age', 'minutes', 'goals', 'assists', 'days_at_club'];
  const guessedAttributes = guessHistory.map(g => {
    const attrs = [];
    if (g.team === mysteryPlayer.team) attrs.push('team');
    if (g.position === mysteryPlayer.position) attrs.push('position');
    if (g.age === mysteryPlayer.age) attrs.push('age');
    if (g.minutes === mysteryPlayer.minutes) attrs.push('minutes');
    if (g.goals === mysteryPlayer.goals) attrs.push('goals');
    if (g.assists === mysteryPlayer.assists) attrs.push('assists');
    if (g.days_at_club === mysteryPlayer.days_at_club) attrs.push('days_at_club');
    return attrs;
  }).flat();
  const available = attributes.filter(attr => !guessedAttributes.includes(attr));
  if (available.length === 0) {
    showModal('No new hints available! All key attributes have been matched.');
    return;
  }
  const hintAttr = available[Math.floor(Math.random() * available.length)];
  guesses++;
  updateGuessCounter();
  const tbody = document.querySelector('#guessTable tbody');
  const row = document.createElement('tr');
  row.style.animationDelay = `${guesses * 0.1}s`;
  const fields = ['name', 'team', 'position', 'age', 'minutes', 'goals', 'assists', 'days_at_club'];
  let hintText = '';
  fields.forEach(field => {
    const cell = document.createElement('td');
    if (field === hintAttr) {
      if (field === 'team') {
        const img = document.createElement('img');
        img.src = `https://resources.premierleague.com/premierleague/badges/50/${mysteryPlayer.badgeId}.png`;
        img.alt = mysteryPlayer.team;
        img.classList.add('team-logo');
        cell.appendChild(img);
        hintText = `The player is from ${mysteryPlayer.team}.`;
      } else if (field === 'position') {
        cell.textContent = mysteryPlayer.position;
        hintText = `The player is a ${mysteryPlayer.position}.`;
      } else if (field === 'days_at_club') {
        cell.textContent = mysteryPlayer.days_at_club;
        hintText = `The player has been at their club for ${mysteryPlayer.days_at_club} days.`;
      } else {
        const value = mysteryPlayer[field];
        const direction = Math.random() < 0.5 ? 'higher' : 'lower';
        let hintValue;
        if (field === 'age') {
          hintValue = direction === 'higher' ? value - (Math.floor(Math.random() * 5) + 1) : value + (Math.floor(Math.random() * 5) + 1);
          hintValue = Math.max(0, hintValue); // Ensure non-negative
          cell.textContent = `${direction === 'higher' ? '>' : '<'} ${hintValue}`;
          hintText = `The player's age is ${direction === 'higher' ? 'greater than' : 'less than'} ${hintValue}.`;
        } else if (field === 'minutes') {
          hintValue = direction === 'higher' ? value - (Math.floor(Math.random() * 500) + 1) : value + (Math.floor(Math.random() * 500) + 1);
          hintValue = Math.max(0, hintValue); // Ensure non-negative
          cell.textContent = `${direction === 'higher' ? '>' : '<'} ${hintValue}`;
          hintText = `The player's minutes are ${direction === 'higher' ? 'greater than' : 'less than'} ${hintValue}.`;
        } else if (field === 'goals' || field === 'assists') {
          hintValue = direction === 'higher' ? value - (Math.floor(Math.random() * 2) + 1) : value + (Math.floor(Math.random() * 2) + 1);
          hintValue = Math.max(0, hintValue); // Ensure non-negative
          cell.textContent = `${direction === 'higher' ? '>' : '<'} ${hintValue}`;
          hintText = `The player's ${field} are ${direction === 'higher' ? 'greater than' : 'less than'} ${hintValue}.`;
        } else if (field === 'days_at_club') {
          hintValue = direction === 'higher' ? value - (Math.floor(Math.random() * 365) + 1) : value + (Math.floor(Math.random() * 365) + 1);
          hintValue = Math.max(0, hintValue); // Ensure non-negative
          cell.textContent = `${direction === 'higher' ? '>' : '<'} ${hintValue}`;
          hintText = `The player has been at their club for ${direction === 'higher' ? 'more than' : 'less than'} ${hintValue} days.`;
        }
      }
      cell.classList.add('yellow');
    } else if (field === 'name') {
      cell.textContent = 'Hint';
      cell.classList.add('gray');
    } else {
      cell.textContent = '-';
      cell.classList.add('gray');
    }
    row.appendChild(cell);
  });
  tbody.appendChild(row);
  // Show hint in a modal instead of alert (to be removed later)
  // alert(hintText);
  if (guesses === maxGuesses) {
    if (user) {
      user.streak = 0;
      localStorage.setItem('user', JSON.stringify(user));
    }
    showModal(`Game over! It was ${mysteryPlayer.name}.`, true);
    document.getElementById('playerInput').disabled = true;
    document.querySelector('button[onclick="submitGuess()"]').disabled = true;
    revealImage();
    updateStats(false);
  }
}

function setupCustomPlayer() {
  const playerName = prompt('Enter the name of the player for a custom challenge:');
  if (!playerName) return;
  const selectedPlayer = players.find(p => p.name.toLowerCase() === playerName.toLowerCase());
  if (!selectedPlayer) {
    alert('Player not found. Please try again.');
    return;
  }
  guesses = 0;
  guessHistory = [];
  updateGuessCounter();
  document.querySelector('#guessTable tbody').innerHTML = '';
  document.getElementById('playerInput').disabled = false;
  document.getElementById('playerInput').value = '';
  document.querySelector('button[onclick="submitGuess()"]').disabled = false;
  mysteryPlayer = selectedPlayer;
  const silhouette = document.getElementById('silhouette');
  silhouette.src = `https://resources.premierleague.com/premierleague/photos/players/250x250/p${mysteryPlayer.code}.png`;
  silhouette.classList.remove('shown', 'revealed');
  document.getElementById('toggleSilhouette').textContent = 'Show Silhouette';
  document.getElementById('toggleSilhouette').disabled = false;
  document.getElementById('modal').style.display = 'none';
  const customLink = `${window.location.origin}${window.location.pathname}?pid=${selectedPlayer.index}`;
  navigator.clipboard.writeText(customLink);
  alert(`Custom challenge link copied to clipboard: ${customLink}`);
}

function setupDailyTip() {
  const tips = [
    "Check the silhouette for position hints!",
    "Midfielders often have high assists.",
    "Young players may have fewer minutes.",
    "Goalkeepers rarely score goals.",
    "Strikers typically have more goals than assists."
  ];
  const tip = tips[Math.floor(Math.random() * tips.length)];
  document.getElementById('dailyTip').textContent = tip;
  const sidebar = document.getElementById('dailyTipSidebar');
  const sidebarHeader = sidebar.querySelector('h3');
  // Ensure the sidebar is not collapsed by default
  if (window.innerWidth <= 600) {
    sidebar.classList.remove('collapsed'); // Ensure it’s visible on mobile initially
  }
  sidebarHeader.addEventListener('click', () => {
    if (window.innerWidth <= 600) {
      sidebar.classList.toggle('collapsed');
    }
  });
}

function setupMobileMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const topNav = document.querySelector('.top-nav');
  menuToggle.addEventListener('click', () => topNav.classList.toggle('active'));
}

function setupSoundToggle() {
  const soundToggle = document.getElementById('soundToggle');
  const soundIcon = document.getElementById('soundIcon');
  const isSoundOn = localStorage.getItem('soundOn') !== 'false';
  soundIcon.src = isSoundOn ? 'assets/images/sound-on.svg' : 'assets/images/sound-off.svg';
  soundIcon.alt = isSoundOn ? 'Sound On' : 'Sound Off';
  soundIcon.classList.toggle('sound-on', isSoundOn);
  soundIcon.classList.toggle('sound-off', !isSoundOn);
  soundToggle.addEventListener('click', () => {
    const newState = localStorage.getItem('soundOn') !== 'false';
    localStorage.setItem('soundOn', !newState);
    soundIcon.src = !newState ? 'assets/images/sound-on.svg' : 'assets/images/sound-off.svg';
    soundIcon.alt = !newState ? 'Sound On' : 'Sound Off';
    soundIcon.classList.toggle('sound-on', !newState);
    soundIcon.classList.toggle('sound-off', newState);
  });
}

function setupTimedMode() {
  const timedModeToggle = document.getElementById('timedModeToggle');
  const isTimedMode = localStorage.getItem('timedMode') === 'true';
  timedModeToggle.textContent = `Timed Mode: ${isTimedMode ? 'On' : 'Off'}`;
  document.getElementById('timer').style.display = isTimedMode ? 'block' : 'none';
  if (isTimedMode) startTimer();
  timedModeToggle.addEventListener('click', () => {
    const newState = localStorage.getItem('timedMode') !== 'true';
    localStorage.setItem('timedMode', newState);
    timedModeToggle.textContent = `Timed Mode: ${newState ? 'On' : 'Off'}`;
    document.getElementById('timer').style.display = newState ? 'block' : 'none';
    if (newState) startTimer();
    else {
      clearInterval(timerInterval);
      timeLeft = 120;
      updateTimerDisplay();
    }
  });
}

function startTimer() {
  clearInterval(timerInterval);
  timeLeft = 120;
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      if (guesses < maxGuesses) {
        showModal(`Time's up! It was ${mysteryPlayer.name}.`, true);
        document.getElementById('playerInput').disabled = true;
        document.querySelector('button[onclick="submitGuess()"]').disabled = true;
        revealImage();
        updateStats(false);
      }
    }
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  document.getElementById('timeLeft').textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function resetTimer() {
  clearInterval(timerInterval);
  timeLeft = 120;
  updateTimerDisplay();
  if (localStorage.getItem('timedMode') === 'true') startTimer();
}

function playSound(type) {
  if (localStorage.getItem('soundOn') === 'false') return;
  const sounds = {
    guess: 'https://www.myinstants.com/media/sounds/click.mp3',
    win: 'https://www.myinstants.com/media/sounds/success.mp3',
    lose: 'https://www.myinstants.com/media/sounds/fail.mp3'
  };
  const audio = new Audio(sounds[type]);
  audio.play().catch(err => console.log('Sound playback failed:', err));
}

function getShareText() {
  let text = `PL Riddle ${new Date().toLocaleDateString()} ${guesses}/${maxGuesses}\n\n`;
  guessHistory.forEach(guess => {
    if (guess.name === 'Hint') return;
    const row = [
      guess.name === mysteryPlayer.name ? '🟩' : '⬜',
      guess.team === mysteryPlayer.team ? '🟩' : '⬜',
      guess.position === mysteryPlayer.position ? '🟩' : '⬜',
      guess.age === mysteryPlayer.age ? '🟩' : Math.abs(guess.age - mysteryPlayer.age) <= 5 ? '🟨' : '⬜',
      guess.minutes === mysteryPlayer.minutes ? '🟩' : Math.abs(guess.minutes - mysteryPlayer.minutes) <= 500 ? '🟨' : '⬜',
      guess.goals === mysteryPlayer.goals ? '🟩' : Math.abs(guess.goals - mysteryPlayer.goals) <= 2 ? '🟨' : '⬜',
      guess.assists === mysteryPlayer.assists ? '🟩' : Math.abs(guess.assists - mysteryPlayer.assists) <= 2 ? '🟨' : '⬜',
      guess.days_at_club === mysteryPlayer.days_at_club ? '🟩' : Math.abs(guess.days_at_club - mysteryPlayer.days_at_club) <= 365 ? '🟨' : '⬜'
    ];
    text += row.join('') + '\n';
  });
  return text;
}

async function shareImage() {
  const table = document.getElementById('guessTable');
  try {
    const canvas = await html2canvas(table, { scale: 2, useCORS: true });
    canvas.toBlob(async (blob) => {
      if (!blob) {
        console.error('Canvas to Blob failed');
        alert('Failed to generate share image. Try again.');
        return;
      }
      const file = new File([blob], 'pl-riddle-result.png', { type: 'image/png' });
      const filesArray = [file];
      const shareData = {
        files: filesArray,
        title: `PL Riddle ${new Date().toLocaleDateString()}`,
        text: getShareText()
      };
      if (navigator.canShare && navigator.canShare({ files: filesArray })) {
        try {
          await navigator.share(shareData);
        } catch (err) {
          console.error('Share failed:', err);
          fallbackDownload(canvas);
        }
      } else {
        fallbackDownload(canvas);
      }
    }, 'image/png');
  } catch (error) {
    console.error('html2canvas error:', error);
    alert('Share failed. Check console for details.');
  }
}

function fallbackDownload(canvas) {
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = 'pl-riddle-result.png';
  link.click();
}

function updateStats(won) {
  const stats = JSON.parse(localStorage.getItem('gameStats')) || {
    totalGames: 0,
    wins: 0,
    totalGuesses: 0,
    longestStreak: 0,
    currentStreak: 0,
    guessDistribution: Array(8).fill(0),
    achievements: []
  };
  stats.totalGames++;
  if (won) {
    stats.wins++;
    stats.totalGuesses += guesses;
    stats.currentStreak++;
    stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
    stats.guessDistribution[guesses - 1]++;
    // Check for new achievements
    if (!stats.achievements.includes('firstWin') && stats.wins === 1) {
      stats.achievements.push('firstWin');
      showModal('Achievement Unlocked: First Win!');
    }
    if (!stats.achievements.includes('streakMaster') && stats.currentStreak >= 5) {
      stats.achievements.push('streakMaster');
      showModal('Achievement Unlocked: Streak Master!');
    }
    if (!stats.achievements.includes('quickGuess') && guesses <= 3) {
      stats.achievements.push('quickGuess');
      showModal('Achievement Unlocked: Quick Guess!');
    }
    if (!stats.achievements.includes('perfectGame') && guesses === 1) {
      stats.achievements.push('perfectGame');
      showModal('Achievement Unlocked: Perfect Game!');
    }
    if (!stats.achievements.includes('tenWins') && stats.wins >= 10) {
      stats.achievements.push('tenWins');
      showModal('Achievement Unlocked: Ten Wins!');
    }
    const hintsUsed = guessHistory.filter(g => g.name === 'Hint').length;
    if (!stats.achievements.includes('hintMaster') && hintsUsed >= 3) {
      stats.achievements.push('hintMaster');
      showModal('Achievement Unlocked: Hint Master!');
    }
    if (!stats.achievements.includes('noHints') && hintsUsed === 0) {
      stats.achievements.push('noHints');
      showModal('Achievement Unlocked: No Hints!');
    }
    if (!stats.achievements.includes('timedChallenge') && localStorage.getItem('timedMode') === 'true') {
      stats.achievements.push('timedChallenge');
      showModal('Achievement Unlocked: Timed Challenge!');
    }
  } else {
    stats.currentStreak = 0;
  }
  localStorage.setItem('gameStats', JSON.stringify(stats));
}

async function init() {
  const urlParams = new URLSearchParams(window.location.search);
  const customPlayerIndex = urlParams.get('pid');
  const data = await fetchFPLData();
  players = data.players;
  if (players.length === 0) {
    showModal('No valid players found. Please refresh or check data source.');
    return;
  }
  user = JSON.parse(localStorage.getItem('user')) || null;
  if (customPlayerIndex) {
    const index = parseInt(customPlayerIndex, 10);
    mysteryPlayer = players[index] || ensureValidMysteryPlayer(players);
  } else {
    mysteryPlayer = ensureValidMysteryPlayer(players);
  }
  setupAutocomplete();
  setupSilhouette();
  setupDailyTip();
  setupMobileMenu();
  setupSoundToggle();
  setupTimedMode();
  updateAuthLink();
}

function updateGuessCounter() {
  document.getElementById('guessCount').textContent = `${guesses}/${maxGuesses}`;
}

function showModal(message, showShare = false) {
  const modal = document.getElementById('modal');
  const result = document.getElementById('result');
  const shareBtn = document.getElementById('shareBtn');
  const tweetBtn = document.getElementById('tweetBtn');
  const closeGameBtn = document.getElementById('closeGameBtn');
  result.textContent = message;
  shareBtn.style.display = showShare ? 'inline-block' : 'none';
  tweetBtn.style.display = showShare ? 'inline-block' : 'none';
  closeGameBtn.style.display = showShare ? 'inline-block' : 'none';
  modal.style.display = 'block';
  modal.classList.add('active');
  if (showShare) {
    shareBtn.onclick = shareImage;
    tweetBtn.onclick = () => {
      const tweetText = encodeURIComponent(getShareText());
      window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
    };
    closeGameBtn.onclick = () => modal.style.display = 'none';
  }
  document.getElementById('modalClose').onclick = () => modal.style.display = 'none';
}

function submitGuess() {
  playSound('guess');
  const input = document.getElementById('playerInput');
  const guessName = input.value.trim();
  const guess = players.find(p => p.name.toLowerCase() === guessName.toLowerCase());
  if (!guess) {
    showModal('Invalid player name. Please try again.');
    input.value = '';
    document.getElementById('suggestions').style.display = 'none';
    return;
  }
  if (guesses >= maxGuesses) return;
  guesses++;
  guessHistory.push(guess);
  updateGuessCounter();
  const tbody = document.querySelector('#guessTable tbody');
  const row = document.createElement('tr');
  row.style.animationDelay = `${guesses * 0.1}s`;
  const fields = ['name', 'team', 'position', 'age', 'minutes', 'goals', 'assists', 'days_at_club'];
  fields.forEach(field => {
    const cell = document.createElement('td');
    if (field === 'team') {
      const img = document.createElement('img');
      img.src = `https://resources.premierleague.com/premierleague/badges/50/${guess.badgeId}.png`;
      img.alt = guess.team;
      img.classList.add('team-logo');
      cell.appendChild(img);
    } else {
      let cellText = guess[field].toString();
      if (['age', 'minutes', 'goals', 'assists', 'days_at_club'].includes(field)) {
        const diff = guess[field] - mysteryPlayer[field];
        if (diff !== 0) {
          const arrow = document.createElement('span');
          arrow.classList.add(diff < 0 ? 'arrow-up' : 'arrow-down');
          cell.appendChild(document.createTextNode(cellText + ' '));
          cell.appendChild(arrow);
        } else {
          cell.textContent = cellText;
        }
      } else {
        cell.textContent = cellText;
      }
    }
    if (field === 'name') {
      cell.classList.add(guess[field] === mysteryPlayer[field] ? 'green' : 'gray');
    } else if (field === 'age') {
      const diff = Math.abs(guess[field] - mysteryPlayer[field]);
      cell.classList.add(guess[field] === mysteryPlayer[field] ? 'green' : diff <= 5 ? 'yellow' : 'gray');
    } else if (field === 'minutes') {
      const diff = Math.abs(guess[field] - mysteryPlayer[field]);
      cell.classList.add(guess[field] === mysteryPlayer[field] ? 'green' : diff <= 500 ? 'yellow' : 'gray');
    } else if (field === 'goals' || field === 'assists') {
      const diff = Math.abs(guess[field] - mysteryPlayer[field]);
      cell.classList.add(guess[field] === mysteryPlayer[field] ? 'green' : diff <= 2 ? 'yellow' : 'gray');
    } else if (field === 'days_at_club') {
      const diff = Math.abs(guess[field] - mysteryPlayer[field]);
      cell.classList.add(guess[field] === mysteryPlayer[field] ? 'green' : diff <= 365 ? 'yellow' : 'gray');
    } else {
      cell.classList.add(guess[field] === mysteryPlayer[field] ? 'green' : 'gray');
    }
    row.appendChild(cell);
  });
  tbody.appendChild(row);
  updateBoundsFromGuess(guess); // Update bounds after each guess
  input.value = '';
  document.getElementById('suggestions').style.display = 'none';
  if (guess.name === mysteryPlayer.name) {
    if (user) {
      user.streak = (user.streak || 0) + 1;
      localStorage.setItem('user', JSON.stringify(user));
    }
    playSound('win');
    showModal(`You got it in ${guesses} guesses!`, true);
    input.disabled = true;
    document.querySelector('button[onclick="submitGuess()"]').disabled = true;
    revealImage();
    updateStats(true);
    clearInterval(timerInterval);
  } else if (guesses === maxGuesses) {
    if (user) {
      user.streak = 0;
      localStorage.setItem('user', JSON.stringify(user));
    }
    playSound('lose');
    showModal(`Game over! It was ${mysteryPlayer.name}.`, true);
    input.disabled = true;
    document.querySelector('button[onclick="submitGuess()"]').disabled = true;
    revealImage();
    updateStats(false);
    clearInterval(timerInterval);
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