class AimLabs {
    constructor() {
        this.target = document.getElementById('target');
        this.scoreElement = document.getElementById('score');
        this.timerElement = document.getElementById('timer');
        this.accuracyElement = document.getElementById('accuracy');
        this.coinsElement = document.getElementById('coins');
        this.startButton = document.getElementById('startButton');
        this.resetButton = document.getElementById('resetButton');
        this.resumeButton = document.getElementById('resumeButton');
        this.quitButton = document.getElementById('quitButton');
        this.crosshair = document.querySelector('.crosshair');
        this.sensitivityInput = document.getElementById('sensitivity');
        this.sensitivityValue = document.getElementById('sensitivityValue');
        this.pauseMenu = document.querySelector('.pause-menu');
        this.shootSound = document.getElementById('shootSound');
        this.themeSwitch = document.getElementById('themeSwitch');
        
        this.score = 0;
        this.coins = 0;
        this.timeLeft = 30;
        this.gameInterval = null;
        this.isGameRunning = false;
        this.isPaused = false;
        this.shotsFired = 0;
        this.shotsHit = 0;
        this.isGameEnded = false;
        
        this.sensitivity = 0.5;
        this.mouseX = window.innerWidth / 2;
        this.mouseY = window.innerHeight / 2;
        
        this.gameContainer = document.querySelector('.game-container');
        this.containerRect = null;
        this.lastMousePosition = { x: 0, y: 0 };
        
        this.isPointerLocked = false;
        this.unlockedCrosshairs = ['default'];
        this.currentCrosshair = 'default';
        this.crosshairPrices = {
            'dot': 100,
            'circle': 250,
            'triangle': 400,
            'diamond': 550,
            'star': 1000
        };
        
        // Verifica se há um tema salvo
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        this.loadUserData();
        this.initializeEventListeners();
        this.initializeCrosshair();
        this.initializeSensitivity();
        this.setupCrosshairShop();
    }
    
    initializeEventListeners() {
        this.startButton.addEventListener('click', () => this.startGame());
        this.resetButton.addEventListener('click', () => this.resetGame());
        this.resumeButton.addEventListener('click', () => this.resumeGame());
        this.quitButton.addEventListener('click', () => this.quitGame());
        
        document.addEventListener('click', (e) => this.handleClick(e));
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('pointerlockchange', () => this.handlePointerLockChange());
        document.addEventListener('pointerlockerror', () => console.log('Erro ao travar o mouse'));
        
        this.themeSwitch.addEventListener('click', () => this.toggleTheme());
    }
    
    initializeSensitivity() {
        this.sensitivityInput.min = "0.1";
        this.sensitivityInput.max = "1.0";
        this.sensitivityInput.step = "0.1";
        this.sensitivityInput.value = this.sensitivity;
        this.sensitivityValue.textContent = this.sensitivity.toFixed(1);
    }
    
    updateSensitivity() {
        this.sensitivity = parseFloat(this.sensitivityInput.value);
        this.sensitivityValue.textContent = this.sensitivity.toFixed(1);
    }
    
    initializeCrosshair() {
        this.updateCrosshairPosition(this.mouseX, this.mouseY);
        this.crosshair.style.display = 'block';
    }
    
    handleKeyDown(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            if (this.isGameRunning) {
                if (this.isPaused) {
                    this.resumeGame();
                } else {
                    this.pauseGame();
                }
            }
        }
    }
    
    handlePointerLockChange() {
        this.isPointerLocked = document.pointerLockElement === this.gameContainer;
        if (!this.isPointerLocked && this.isGameRunning && !this.isPaused) {
            this.pauseGame();
        }
    }
    
    lockPointer() {
        this.gameContainer.requestPointerLock();
        this.isPointerLocked = true;
    }
    
    unlockPointer() {
        if (document.exitPointerLock) {
            document.exitPointerLock();
            this.isPointerLocked = false;
        }
    }
    
    handleMouseMove(e) {
        if (!this.isGameRunning || this.isPaused) {
            // Permite movimento livre do mouse quando não está jogando ou está pausado
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            this.updateCrosshairPosition(this.mouseX, this.mouseY);
            return;
        }
        
        if (!this.isPointerLocked) {
            this.lockPointer();
            return;
        }
        
        // Usa movementX e movementY quando o ponteiro está travado
        const deltaX = e.movementX * this.sensitivity;
        const deltaY = e.movementY * this.sensitivity;
        
        this.containerRect = this.gameContainer.getBoundingClientRect();
        
        let newX = this.mouseX + deltaX;
        let newY = this.mouseY + deltaY;
        
        // Limita o movimento dentro da área do jogo
        newX = Math.max(
            this.containerRect.left,
            Math.min(newX, this.containerRect.right)
        );
        newY = Math.max(
            this.containerRect.top,
            Math.min(newY, this.containerRect.bottom)
        );
        
        this.mouseX = newX;
        this.mouseY = newY;
        this.updateCrosshairPosition(this.mouseX, this.mouseY);
    }
    
    updateCrosshairPosition(x, y) {
        this.crosshair.style.left = `${x}px`;
        this.crosshair.style.top = `${y}px`;
    }
    
    handleClick(e) {
        if (!this.isGameRunning || this.isPaused || this.isGameEnded) return;
        
        this.shotsFired++;
        this.createShotEffect(this.mouseX, this.mouseY);
        this.playShootSound();
        
        const targetRect = this.target.getBoundingClientRect();
        if (this.isPointInRect(this.mouseX, this.mouseY, targetRect)) {
            this.handleTargetClick();
        }
        
        this.updateAccuracy();
    }
    
    playShootSound() {
        this.shootSound.volume = 0.2;
        this.shootSound.currentTime = 0;
        this.shootSound.play().catch(error => {
            console.log("Erro ao tocar som:", error);
        });
    }
    
    updateAccuracy() {
        const accuracy = this.shotsFired > 0 ? (this.shotsHit / this.shotsFired) * 100 : 0;
        this.accuracyElement.textContent = `${accuracy.toFixed(1)}%`;
    }
    
    isPointInRect(x, y, rect) {
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    }
    
    createShotEffect(x, y) {
        const effect = document.createElement('div');
        effect.className = 'shot-effect';
        effect.style.left = `${x}px`;
        effect.style.top = `${y}px`;
        
        this.gameContainer.appendChild(effect);
        
        setTimeout(() => {
            effect.remove();
        }, 200);
    }
    
    startGame() {
        if (this.isGameRunning || this.isGameEnded) return;
        
        this.isGameRunning = true;
        this.score = 0;
        this.hits = 0;
        this.misses = 0;
        this.timeLeft = 30;
        this.isPaused = false;
        this.isGameEnded = false;
        
        // Atualiza a interface
        this.updateScore();
        this.updateAccuracy();
        this.updateTimer();
        this.updateCrosshair();
        
        // Adiciona classe para esconder o cursor
        document.body.classList.add('game-running');
        
        // Inicia o timer
        this.timerInterval = setInterval(() => {
            if (this.timeLeft > 0 && !this.isPaused) {
                this.timeLeft--;
                this.updateTimer();
            } else if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
        
        // Inicia o movimento do alvo
        this.moveTarget();
        
        // Desabilita o botão de iniciar
        this.startButton.disabled = true;
    }
    
    pauseGame() {
        if (!this.isGameRunning || this.isPaused) return;
        
        this.isPaused = true;
        this.pauseMenu.style.display = 'flex';
        document.exitPointerLock();
        this.gameContainer.style.cursor = 'default';
        
        // Limpa o intervalo do jogo
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
            this.gameInterval = null;
        }
        
        // Remove a classe do body
        document.body.classList.remove('game-running');
    }
    
    resumeGame() {
        if (!this.isPaused) return;
        
        this.isPaused = false;
        this.pauseMenu.style.display = 'none';
        this.gameContainer.requestPointerLock();
        this.gameContainer.style.cursor = 'none';
        
        // Restaura o intervalo do jogo
        this.gameInterval = setInterval(() => {
            if (this.timeLeft > 0) {
                this.timeLeft--;
                this.timerElement.textContent = this.timeLeft;
                
                if (this.timeLeft <= 0) {
                    this.endGame();
                }
            }
        }, 1000);
        
        // Restaura a classe do body
        document.body.classList.add('game-running');
        
        // Atualiza a posição do mouse e da mira
        this.containerRect = this.gameContainer.getBoundingClientRect();
        this.mouseX = this.containerRect.left + this.containerRect.width / 2;
        this.mouseY = this.containerRect.top + this.containerRect.height / 2;
        this.updateCrosshairPosition(this.mouseX, this.mouseY);
        
        // Força o travamento do ponteiro
        this.lockPointer();
    }
    
    quitGame() {
        this.isGameRunning = false;
        this.isPaused = false;
        this.pauseMenu.style.display = 'none';
        document.exitPointerLock();
        this.gameContainer.style.cursor = 'default';
        this.resetGame();
    }
    
    handleTargetClick() {
        if (!this.isGameRunning) return;
        
        this.score++;
        this.shotsHit++;
        
        // Calcula a precisão atual
        const accuracy = (this.shotsHit / this.shotsFired) * 100;
        
        // Calcula as moedas baseado na precisão e pontuação
        this.coins = (accuracy * this.score) / 200;
        
        this.scoreElement.textContent = this.score;
        this.coinsElement.textContent = this.coins.toFixed(1);
        this.moveTarget();
    }
    
    moveTarget() {
        const containerRect = this.gameContainer.getBoundingClientRect();
        const targetSize = 50;
        
        const safeArea = {
            left: 50,
            top: 50,
            right: containerRect.width - targetSize - 50,
            bottom: containerRect.height - targetSize - 50
        };
        
        const randomX = Math.floor(Math.random() * (safeArea.right - safeArea.left)) + safeArea.left;
        const randomY = Math.floor(Math.random() * (safeArea.bottom - safeArea.top)) + safeArea.top;
        
        this.target.style.left = `${randomX}px`;
        this.target.style.top = `${randomY}px`;
    }
    
    endGame() {
        if (this.isGameEnded) return;
        
        this.isGameEnded = true;
        this.isGameRunning = false;
        this.startButton.disabled = false;
        
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
            this.gameInterval = null;
        }
        
        document.body.classList.remove('game-running');
        this.unlockPointer();
        
        const accuracy = this.shotsFired > 0 ? (this.shotsHit / this.shotsFired) * 100 : 0;
        const finalCoins = (accuracy * this.score) / 200;
        
        this.coins += finalCoins;
        this.updateCoins();
        this.saveUserData();
        
        // Cria e mostra a tela de resultados
        const resultsScreen = document.createElement('div');
        resultsScreen.className = 'pause-menu';
        resultsScreen.style.display = 'flex';
        
        resultsScreen.innerHTML = `
            <div class="pause-content">
                <h2>Fim de Jogo!</h2>
                <div style="margin: 20px 0; text-align: left;">
                    <div class="score-item">
                        <span class="label">Pontuação Final</span>
                        <span class="value">${this.score}</span>
                    </div>
                    <div class="score-item">
                        <span class="label">Precisão</span>
                        <span class="value">${accuracy.toFixed(1)}%</span>
                    </div>
                    <div class="score-item">
                        <span class="label">Moedas Ganhas</span>
                        <span class="value coins">
                            <div class="coin-icon"></div>
                            <span>${finalCoins.toFixed(1)}</span>
                        </span>
                    </div>
                </div>
                <div class="buttons">
                    <button onclick="window.location.reload()">Jogar Novamente</button>
                </div>
            </div>
        `;
        
        this.gameContainer.appendChild(resultsScreen);
    }
    
    resetGame() {
        this.score = 0;
        this.coins = 0;
        this.timeLeft = 30;
        this.shotsFired = 0;
        this.shotsHit = 0;
        this.isGameEnded = false;
        this.scoreElement.textContent = this.score;
        this.coinsElement.textContent = '0.0';
        this.timerElement.textContent = this.timeLeft;
        this.accuracyElement.textContent = '0%';
        this.startButton.disabled = false;
        this.isGameRunning = false;
        
        // Remove a tela de resultados se existir
        const resultsScreen = this.gameContainer.querySelector('.pause-menu');
        if (resultsScreen) {
            resultsScreen.remove();
        }
        
        this.containerRect = this.gameContainer.getBoundingClientRect();
        this.mouseX = this.containerRect.left + this.containerRect.width / 2;
        this.mouseY = this.containerRect.top + this.containerRect.height / 2;
        this.updateCrosshairPosition(this.mouseX, this.mouseY);
        
        document.body.classList.remove('game-running');
        this.unlockPointer();
        
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
            this.gameInterval = null;
        }
        
        this.moveTarget();
        this.saveUserData();
    }

    setupCrosshairShop() {
        const options = document.querySelectorAll('.crosshair-option');
        options.forEach(option => {
            option.addEventListener('click', () => {
                const crosshairType = option.dataset.crosshair;
                if (this.unlockedCrosshairs.includes(crosshairType)) {
                    this.selectCrosshair(crosshairType, option);
                } else {
                    this.purchaseCrosshair(crosshairType, option);
                }
            });
        });
    }

    selectCrosshair(type, option) {
        document.querySelectorAll('.crosshair-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        this.currentCrosshair = type;
        this.updateCrosshair();
        this.saveUserData();
    }

    purchaseCrosshair(type, option) {
        const price = this.crosshairPrices[type];
        if (this.coins >= price) {
            this.coins -= price;
            this.unlockedCrosshairs.push(type);
            this.updateCoins();
            this.selectCrosshair(type, option);
            option.querySelector('.price').textContent = 'Desbloqueado';
            this.saveUserData();
        } else {
            alert('Moedas insuficientes!');
        }
    }

    updateCrosshair() {
        const crosshair = document.querySelector('.crosshair');
        crosshair.className = 'crosshair';
        crosshair.classList.add(`crosshair-${this.currentCrosshair}`);
    }

    updateCoins() {
        document.getElementById('coins').textContent = this.coins.toFixed(1);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    }

    loadUserData() {
        // Carrega dados salvos do localStorage
        const savedData = localStorage.getItem('aimLabsData');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.coins = data.coins || 0;
            this.unlockedCrosshairs = data.unlockedCrosshairs || ['default'];
            this.currentCrosshair = data.currentCrosshair || 'default';
            
            // Atualiza a interface
            this.updateCoins();
            this.updateCrosshair();
            
            // Atualiza a loja de miras
            const options = document.querySelectorAll('.crosshair-option');
            options.forEach(option => {
                const crosshairType = option.dataset.crosshair;
                if (this.unlockedCrosshairs.includes(crosshairType)) {
                    option.classList.add('selected');
                    option.querySelector('.price').textContent = 'Desbloqueado';
                } else {
                    option.classList.remove('selected');
                    option.querySelector('.price').innerHTML = `
                        <div class="coin-mini">N</div>
                        <span>${this.crosshairPrices[crosshairType]}</span>
                    `;
                }
            });
        }
    }

    saveUserData() {
        // Salva dados no localStorage
        const data = {
            coins: this.coins,
            unlockedCrosshairs: this.unlockedCrosshairs,
            currentCrosshair: this.currentCrosshair
        };
        localStorage.setItem('aimLabsData', JSON.stringify(data));
    }
}

window.addEventListener('load', () => {
    new AimLabs();
}); 