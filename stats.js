const allAchievements = [
  { id: 'firstWin', name: 'First Win', description: 'Win your first game' },
  { id: 'streakMaster', name: 'Streak Master', description: 'Achieve a streak of 5 wins' },
  { id: 'quickGuess', name: 'Quick Guess', description: 'Win in 3 guesses or fewer' },
  { id: 'perfectGame', name: 'Perfect Game', description: 'Win in 1 guess' },
  { id: 'tenWins', name: 'Ten Wins', description: 'Win 10 games' },
  { id: 'hintMaster', name: 'Hint Master', description: 'Win a game after using 3 hints' },
  { id: 'noHints', name: 'No Hints', description: 'Win a game without using any hints' },
  { id: 'timedChallenge', name: 'Timed Challenge', description: 'Win a game in Timed Mode' },
  { id: 'veteran', name: 'Veteran', description: 'Play 50 games' },
  { id: 'goalScorer', name: 'Goal Scorer', description: 'Guess a player with 10+ goals' },
  { id: 'assistKing', name: 'Assist King', description: 'Guess a player with 10+ assists' }
];

function loadStats() {
  const stats = JSON.parse(localStorage.getItem('gameStats')) || {
    totalGames: 0,
    wins: 0,
    currentStreak: 0,
    maxStreak: 0,
    achievements: []
  };

  document.getElementById('totalGames').textContent = stats.totalGames;
  document.getElementById('wins').textContent = stats.wins;
  document.getElementById('winRate').textContent = stats.totalGames > 0 ? ((stats.wins / stats.totalGames) * 100).toFixed(1) + '%' : '0%';
  document.getElementById('currentStreak').textContent = stats.currentStreak;
  document.getElementById('maxStreak').textContent = stats.maxStreak;

  const achievementsList = document.getElementById('achievementsList');
  achievementsList.innerHTML = '';
  allAchievements.forEach(achievement => {
    const li = document.createElement('li');
    li.textContent = `${achievement.name}: ${achievement.description}`;
    li.classList.add(stats.achievements.includes(achievement.id) ? 'unlocked' : 'locked');
    achievementsList.appendChild(li);
  });

  // Reset stats button
  document.getElementById('resetStatsBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all stats? This cannot be undone.')) {
      localStorage.removeItem('gameStats');
      loadStats(); // Reload to reflect reset
    }
  });
}

document.addEventListener('DOMContentLoaded', loadStats);
  
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