function loadStats() {
    const gameHistory = JSON.parse(localStorage.getItem('gameHistory')) || [];
    const user = JSON.parse(localStorage.getItem('user')) || {};
  
    const totalGames = gameHistory.length;
    const wins = gameHistory.filter(game => game.won).length;
    const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : 0;
    const winGuesses = gameHistory.filter(game => game.won).map(game => game.guesses);
    const avgGuesses = winGuesses.length > 0 ? (winGuesses.reduce((a, b) => a + b, 0) / winGuesses.length).toFixed(1) : 0;
    const longestStreak = user.longestStreak || 0;
  
    document.getElementById('totalGames').textContent = totalGames;
    document.getElementById('winRate').textContent = `${winRate}%`;
    document.getElementById('avgGuesses').textContent = avgGuesses;
    document.getElementById('longestStreak').textContent = longestStreak;
  
    const guessCounts = Array(8).fill(0);
    winGuesses.forEach(guess => {
      if (guess <= 8) guessCounts[guess - 1]++;
    });
  
    const ctx = document.getElementById('guessDistributionChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['1', '2', '3', '4', '5', '6', '7', '8'],
        datasets: [{
          label: 'Wins by Guess',
          data: guessCounts,
          backgroundColor: '#1d4ed8',
          borderColor: '#1e40af',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Number of Wins' } },
          x: { title: { display: true, text: 'Guesses' } }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
  
  function setupMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const topNav = document.querySelector('.top-nav');
    const footer = document.querySelector('footer');
  
    menuToggle.addEventListener('click', () => {
      topNav.classList.toggle('active');
      footer.classList.toggle('active');
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
  
  window.onload = () => {
    loadStats();
    setupMobileMenu();
    updateAuthLink();
  };