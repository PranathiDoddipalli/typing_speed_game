let timeLeft = 60;
let timeInterval;
let isTestActive = false;
let currentText = '';
let typedCharacters = 0;
let mistakes = 0;
let startTime;

const texts = [
    "The quick brown fox jumps over the lazy dog.",
    "Programming is the art of telling a computer what to do.",
    "Practice makes perfect, and typing is no exception.",
    "Success is not final, failure is not fatal.",
    "The only way to do great work is to love what you do.",
    "In the middle of difficulty lies opportunity.",
    "Stay hungry, stay foolish, keep learning.",
    "Code is like humor. When you have to explain it, it's bad.",
    "Life is what happens while you're busy making other plans.",
    "The future depends on what you do today."
];

const textDisplay = document.getElementById('text-display');
const inputField = document.getElementById('input-field');
const playerNameInput = document.getElementById('player-name');
const timeElement = document.getElementById('time');
const wpmElement = document.getElementById('wpm');
const accuracyElement = document.getElementById('accuracy');
const streakElement = document.getElementById('streak');
const progressBar = document.getElementById('progress-bar');
const startButton = document.querySelector('.difficulty-btn');
const resetButton = document.getElementById('reset-btn');

function getRandomText() {
    return texts[Math.floor(Math.random() * texts.length)];
}

function updateProgressBar() {
    const progress = (typedCharacters / currentText.length) * 100;
    progressBar.style.width = `${progress}%`;
}

function calculateWPM() {
    const timeElapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
    const wordsTyped = typedCharacters / 5; // assuming average word length of 5
    return Math.round(wordsTyped / timeElapsed);
}

function calculateAccuracy() {
    return Math.round(((typedCharacters - mistakes) / typedCharacters) * 100) || 0;
}

function updateStats() {
    if (isTestActive) {
        wpmElement.textContent = calculateWPM();
        accuracyElement.textContent = calculateAccuracy();
        updateProgressBar();
    }
}

function startTest() {
    if (!playerNameInput.value.trim()) {
        alert('Please enter your name first!');
        playerNameInput.focus();
        return;
    }

    isTestActive = true;
    startTime = Date.now();
    currentText = getRandomText();
    typedCharacters = 0;
    mistakes = 0;
    
    textDisplay.textContent = currentText;
    inputField.value = '';
    inputField.disabled = false;
    inputField.focus();
    
    startButton.disabled = true;
    resetButton.disabled = false;
    
    timeLeft = 60;
    updateTimer();
    timeInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    timeElement.textContent = timeLeft;
    if (timeLeft <= 0) {
        endTest();
    }
    timeLeft--;
}

function endTest() {
    isTestActive = false;
    clearInterval(timeInterval);
    
    const finalWPM = calculateWPM();
    const finalAccuracy = calculateAccuracy();
    
    inputField.disabled = true;
    startButton.disabled = false;
    
    // Save score
    const score = {
        name: playerNameInput.value,
        wpm: finalWPM,
        accuracy: finalAccuracy,
        date: new Date().toLocaleDateString()
    };
    
    saveScore(score);
    updateRankings();
    
    alert(`Test completed!\nWPM: ${finalWPM}\nAccuracy: ${finalAccuracy}%`);
}

function resetTest() {
    clearInterval(timeInterval);
    isTestActive = false;
    timeLeft = 60;
    typedCharacters = 0;
    mistakes = 0;
    
    timeElement.textContent = timeLeft;
    wpmElement.textContent = '0';
    accuracyElement.textContent = '0';
    streakElement.textContent = '0';
    progressBar.style.width = '0%';
    
    textDisplay.textContent = 'Type the text below when you\'re ready...';
    inputField.value = '';
    inputField.disabled = true;
    
    startButton.disabled = false;
    resetButton.disabled = true;
}

function saveScore(score) {
    let scores = JSON.parse(localStorage.getItem('typingScores')) || [];
    scores.push(score);
    scores.sort((a, b) => b.wpm - a.wpm);
    scores = scores.slice(0, 10); // Keep only top 10
    localStorage.setItem('typingScores', JSON.stringify(scores));
}

function updateRankings() {
    const scores = JSON.parse(localStorage.getItem('typingScores')) || [];
    const rankingsBody = document.getElementById('rankings-body');
    rankingsBody.innerHTML = '';
    
    scores.forEach((score, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${score.name}</td>
            <td>${score.wpm}</td>
            <td>${score.accuracy}%</td>
            <td>${score.date}</td>
        `;
        rankingsBody.appendChild(row);
    });
}

inputField.addEventListener('input', (e) => {
    if (!isTestActive) return;
    
    const inputValue = e.target.value;
    const currentChar = currentText[typedCharacters];
    
    if (inputValue[inputValue.length - 1] === currentChar) {
        typedCharacters++;
    } else {
        mistakes++;
    }
    
    if (typedCharacters === currentText.length) {
        currentText = getRandomText();
        textDisplay.textContent = currentText;
        inputField.value = '';
    }
    
    updateStats();
});

startButton.addEventListener('click', startTest);
resetButton.addEventListener('click', resetTest);

// Initialize rankings on page load
updateRankings();
