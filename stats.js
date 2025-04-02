function loadStats() {
    const stats = JSON.parse(localStorage.getItem('gameStats')) || {
      totalGames: 0,
      wins: 0,
      totalGuesses: 0,
      longestStreak: 0,
      currentStreak: 0,
      guessDistribution: Array(8).fill(0),
      achievements: []
    };
  
    document.getElementById('totalGames').textContent = stats.totalGames;
    document.getElementById('winRate').textContent = stats.totalGames > 0 ? ((stats.wins / stats.totalGames) * 100).toFixed(1) + '%' : '0%';
    document.getElementById('avgGuesses').textContent = stats.wins > 0 ? (stats.totalGuesses / stats.wins).toFixed(1) : '0';
    document.getElementById('longestStreak').textContent = stats.longestStreak;
  
    const distribution = document.getElementById('guessDistribution');
    stats.guessDistribution.forEach((count, index) => {
      const bar = document.createElement('div');
      bar.classList.add('distribution-bar');
      const max = Math.max(...stats.guessDistribution, 1);
      bar.style.width = `${(count / max) * 100}%`;
      bar.textContent = count > 0 ? count : '';
      const label = document.createElement('span');
      label.textContent = `${index + 1}: `;
      const container = document.createElement('div');
      container.classList.add('distribution-row');
      container.appendChild(label);
      container.appendChild(bar);
      distribution.appendChild(container);
    });
  
    const achievementsList = document.getElementById('achievementsList');
    const allAchievements = [
      { id: 'firstWin', name: 'First Win', description: 'Win your first game' },
      { id: 'streakMaster', name: 'Streak Master', description: 'Achieve a streak of 5 wins' },
      { id: 'quickGuess', name: 'Quick Guess', description: 'Win in 3 guesses or fewer' }
    ];
    allAchievements.forEach(achievement => {
      const li = document.createElement('li');
      li.textContent = `${achievement.name}: ${achievement.description}`;
      if (!stats.achievements.includes(achievement.id)) {
        li.classList.add('locked');
      }
      achievementsList.appendChild(li);
    });
  
    setupSoundToggle();
    setupTimedModeToggle();
    updateAuthLink();
  }
  
  function setupSoundToggle() {
    const soundToggle = document.getElementById('soundToggle');
    const soundIcon = document.getElementById('soundIcon');
    const isSoundOn = localStorage.getItem('soundOn') !== 'false';
    soundIcon.src = isSoundOn ? 'assets/images/sound-on.png' : 'assets/images/sound-off.png';
    soundIcon.alt = isSoundOn ? 'Sound On' : 'Sound Off';
    soundToggle.addEventListener('click', () => {
      const newState = localStorage.getItem('soundOn') !== 'false';
      localStorage.setItem('soundOn', !newState);
      soundIcon.src = !newState ? 'assets/images/sound-on.png' : 'assets/images/sound-off.png';
      soundIcon.alt = !newState ? 'Sound On' : 'Sound Off';
    });
  }
  
  function setupTimedModeToggle() {
    const timedModeToggle = document.getElementById('timedModeToggle');
    const isTimedMode = localStorage.getItem('timedMode') === 'true';
    timedModeToggle.textContent = `Timed Mode: ${isTimedMode ? 'On' : 'Off'}`;
    timedModeToggle.addEventListener('click', () => {
      const newState = localStorage.getItem('timedMode') !== 'true';
      localStorage.setItem('timedMode', newState);
      timedModeToggle.textContent = `Timed Mode: ${newState ? 'On' : 'Off'}`;
    });
  }
  
  function updateAuthLink() {
    const authLink = document.getElementById('authLink');
    const user = JSON.parse(localStorage.getItem('user')) || null;
    if (user) {
      authLink.textContent = `Logout (${user.username})`;
      authLink.href = '#';
      authLink.onclick = () => {
        localStorage.removeItem('user');
        updateAuthLink();
      };
    } else {
      authLink.textContent = 'Login/Register';
      authLink.href = 'login.html';
    }
  }

  function setupSoundToggle() {
    const soundToggle = document.getElementById('soundToggle');
    const soundIcon = document.getElementById('soundIcon');
    const isSoundOn = localStorage.getItem('soundOn') !== 'false';
    soundIcon.src = isSoundOn ? 'assets/images/sound-on.svg' : 'assets/images/sound-off.svg';
    soundIcon.alt = isSoundOn ? 'Sound On' : 'Sound Off';
    soundIcon.classList.remove('sound-on', 'sound-off');
    soundIcon.classList.add(isSoundOn ? 'sound-on' : 'sound-off');
    soundToggle.addEventListener('click', () => {
      const newState = localStorage.getItem('soundOn') !== 'false';
      localStorage.setItem('soundOn', !newState);
      soundIcon.src = !newState ? 'assets/images/sound-on.svg' : 'assets/images/sound-off.svg';
      soundIcon.alt = !newState ? 'Sound On' : 'Sound Off';
      soundIcon.classList.remove('sound-on', 'sound-off');
      soundIcon.classList.add(!newState ? 'sound-on' : 'sound-off');
    });
  }
  
  window.onload = loadStats;