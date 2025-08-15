// Game Configuration
const CONFIG = {
    CANVAS: {
        WIDTH: 800,
        HEIGHT: 500
    },
    PADDLE: {
        WIDTH: 10,
        HEIGHT: 100,
        SPEED: 6,
        AI_SPEED: 5
    },
    BALL: {
        SIZE: 16,
        INITIAL_SPEED: 5,
        MAX_SPEED: 12,
        SPEED_INCREMENT: 0.5
    },
    GAME: {
        WIN_SCORE: 11,
        FPS: 60,
        DIFFICULTY_LEVELS: {
            EASY: { speed: 3, accuracy: 0.7 },
            MEDIUM: { speed: 5, accuracy: 0.85 },
            HARD: { speed: 7, accuracy: 0.95 }
        }
    },
    COLORS: {
        BACKGROUND: '#000011',
        PADDLE: '#00ff41',
        BALL: '#ff6b35',
        TEXT: '#ffffff',
        NET: '#444444',
        PARTICLES: ['#ff6b35', '#00ff41', '#ffffff', '#ffeb3b']
    },
    AUDIO: {
        ENABLED: true
    }
};

// Audio System
class AudioManager {
    constructor() {
        this.enabled = CONFIG.AUDIO.ENABLED;
        this.sounds = {};
        this.createAudioContext();
    }

    createAudioContext() {
        if (!this.enabled) return;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    }

    createBeep(frequency, duration, type = 'sine') {
        if (!this.enabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    playPaddleHit() {
        this.createBeep(440, 0.1, 'square');
    }

    playWallHit() {
        this.createBeep(220, 0.1, 'sine');
    }

    playScore() {
        this.createBeep(660, 0.3, 'triangle');
    }

    playGameOver() {
        setTimeout(() => this.createBeep(330, 0.5, 'sawtooth'), 0);
        setTimeout(() => this.createBeep(220, 0.5, 'sawtooth'), 200);
        setTimeout(() => this.createBeep(165, 0.8, 'sawtooth'), 400);
    }
}

// Particle System
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.02;
        this.color = color;
        this.size = Math.random() * 4 + 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.life -= this.decay;
        this.size *= 0.98;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    createExplosion(x, y, count = 10) {
        for (let i = 0; i < count; i++) {
            const color = CONFIG.COLORS.PARTICLES[Math.floor(Math.random() * CONFIG.COLORS.PARTICLES.length)];
            this.particles.push(new Particle(x, y, color));
        }
    }

    update() {
        this.particles.forEach(particle => particle.update());
        this.particles = this.particles.filter(particle => !particle.isDead());
    }

    draw(ctx) {
        this.particles.forEach(particle => particle.draw(ctx));
    }
}

// Game Objects
class Paddle {
    constructor(x, y, isPlayer = false) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.PADDLE.WIDTH;
        this.height = CONFIG.PADDLE.HEIGHT;
        this.speed = isPlayer ? CONFIG.PADDLE.SPEED : CONFIG.PADDLE.AI_SPEED;
        this.isPlayer = isPlayer;
        this.glow = 0;
    }

    update(input) {
        if (this.isPlayer) {
            if (input.keys.ArrowUp || input.keys.KeyW) {
                this.y -= this.speed;
            }
            if (input.keys.ArrowDown || input.keys.KeyS) {
                this.y += this.speed;
            }
            if (input.mouse.y !== null) {
                this.y = input.mouse.y - this.height / 2;
            }
        }

        // Keep paddle within bounds
        this.y = Math.max(0, Math.min(CONFIG.CANVAS.HEIGHT - this.height, this.y));
        
        // Update glow effect
        this.glow = Math.max(0, this.glow - 0.1);
    }

    aiUpdate(ball, difficulty) {
        const center = this.y + this.height / 2;
        const ballCenter = ball.y + ball.size / 2;
        const diff = ballCenter - center;
        
        // Add some prediction for harder difficulties
        let targetY = ballCenter;
        if (difficulty.accuracy > 0.8 && ball.vx > 0) {
            const timeToReach = (this.x - ball.x) / ball.vx;
            targetY = ball.y + ball.vy * timeToReach;
        }
        
        // Add some randomness to make AI beatable
        if (Math.random() > difficulty.accuracy) {
            targetY += (Math.random() - 0.5) * 100;
        }
        
        const targetDiff = targetY - center;
        
        if (Math.abs(targetDiff) > 10) {
            this.y += Math.sign(targetDiff) * Math.min(difficulty.speed, Math.abs(targetDiff));
        }
    }

    hit() {
        this.glow = 1;
    }

    draw(ctx) {
        // Draw glow effect
        if (this.glow > 0) {
            ctx.save();
            ctx.shadowColor = CONFIG.COLORS.PADDLE;
            ctx.shadowBlur = 20 * this.glow;
            ctx.fillStyle = CONFIG.COLORS.PADDLE;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.restore();
        } else {
            ctx.fillStyle = CONFIG.COLORS.PADDLE;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    getBounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height
        };
    }
}

class Ball {
    constructor() {
        this.reset();
        this.trail = [];
        this.maxTrailLength = 10;
    }

    reset() {
        this.x = CONFIG.CANVAS.WIDTH / 2 - CONFIG.BALL.SIZE / 2;
        this.y = CONFIG.CANVAS.HEIGHT / 2 - CONFIG.BALL.SIZE / 2;
        this.size = CONFIG.BALL.SIZE;
        
        const angle = (Math.random() - 0.5) * Math.PI / 3; // Random angle within 60 degrees
        const direction = Math.random() > 0.5 ? 1 : -1;
        this.vx = Math.cos(angle) * CONFIG.BALL.INITIAL_SPEED * direction;
        this.vy = Math.sin(angle) * CONFIG.BALL.INITIAL_SPEED;
        
        this.trail = [];
    }

    update() {
        // Update trail
        this.trail.push({ x: this.x + this.size / 2, y: this.y + this.size / 2 });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        this.x += this.vx;
        this.y += this.vy;

        // Wall collision
        if (this.y <= 0 || this.y + this.size >= CONFIG.CANVAS.HEIGHT) {
            this.vy = -this.vy;
            return 'wall';
        }

        return null;
    }

    checkPaddleCollision(paddle) {
        const ballBounds = this.getBounds();
        const paddleBounds = paddle.getBounds();

        if (ballBounds.left < paddleBounds.right &&
            ballBounds.right > paddleBounds.left &&
            ballBounds.top < paddleBounds.bottom &&
            ballBounds.bottom > paddleBounds.top) {
            
            // Calculate hit position for spin effect
            const hitPos = (this.y + this.size / 2 - paddle.y) / paddle.height - 0.5;
            
            this.vx = -this.vx;
            this.vy += hitPos * 5; // Add spin based on hit position
            
            // Increase speed slightly
            const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (currentSpeed < CONFIG.BALL.MAX_SPEED) {
                const speedMultiplier = 1 + CONFIG.BALL.SPEED_INCREMENT / currentSpeed;
                this.vx *= speedMultiplier;
                this.vy *= speedMultiplier;
            }
            
            // Move ball out of paddle to prevent sticking
            if (this.vx > 0) {
                this.x = paddleBounds.right;
            } else {
                this.x = paddleBounds.left - this.size;
            }
            
            paddle.hit();
            return true;
        }
        return false;
    }

    draw(ctx) {
        // Draw trail
        ctx.save();
        for (let i = 0; i < this.trail.length; i++) {
            const alpha = i / this.trail.length * 0.5;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = CONFIG.COLORS.BALL;
            ctx.beginPath();
            const size = (i / this.trail.length) * this.size * 0.5;
            ctx.arc(this.trail[i].x, this.trail[i].y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // Draw ball with glow
        ctx.save();
        ctx.shadowColor = CONFIG.COLORS.BALL;
        ctx.shadowBlur = 15;
        ctx.fillStyle = CONFIG.COLORS.BALL;
        ctx.beginPath();
        ctx.arc(this.x + this.size / 2, this.y + this.size / 2, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    getBounds() {
        return {
            left: this.x,
            right: this.x + this.size,
            top: this.y,
            bottom: this.y + this.size
        };
    }

    isOutOfBounds() {
        return this.x < -this.size || this.x > CONFIG.CANVAS.WIDTH;
    }

    getScoringPlayer() {
        if (this.x < -this.size) return 'ai';
        if (this.x > CONFIG.CANVAS.WIDTH) return 'player';
        return null;
    }
}

// Input Manager
class InputManager {
    constructor(canvas) {
        this.keys = {};
        this.mouse = { x: null, y: null };
        this.canvas = canvas;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Mouse events
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.y = e.clientY - rect.top;
        });

        // Touch events for mobile
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            this.mouse.y = touch.clientY - rect.top;
        });
    }

    isPressed(key) {
        return !!this.keys[key];
    }
}

// Game States
const GAME_STATES = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over'
};

// Main Game Class
class PongGame {
    constructor() {
        this.canvas = document.getElementById('pong');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.canvas.width = CONFIG.CANVAS.WIDTH;
        this.canvas.height = CONFIG.CANVAS.HEIGHT;
        
        this.initializeGame();
        this.setupEventListeners();
        this.loadHighScores();
        
        this.gameLoop();
    }

    initializeGame() {
        this.state = GAME_STATES.MENU;
        this.difficulty = CONFIG.GAME.DIFFICULTY_LEVELS.MEDIUM;
        
        // Game objects
        this.player = new Paddle(10, CONFIG.CANVAS.HEIGHT / 2 - CONFIG.PADDLE.HEIGHT / 2, true);
        this.ai = new Paddle(CONFIG.CANVAS.WIDTH - CONFIG.PADDLE.WIDTH - 10, CONFIG.CANVAS.HEIGHT / 2 - CONFIG.PADDLE.HEIGHT / 2);
        this.ball = new Ball();
        
        // Game systems
        this.input = new InputManager(this.canvas);
        this.audio = new AudioManager();
        this.particles = new ParticleSystem();
        
        // Game state
        this.scores = { player: 0, ai: 0 };
        this.gameTime = 0;
        this.lastTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        
        // Visual effects
        this.screenShake = 0;
        this.gameMode = 'single'; // single, two-player
        this.highScores = [];
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    this.handleSpacePress();
                    break;
                case 'KeyP':
                    if (this.state === GAME_STATES.PLAYING) {
                        this.state = GAME_STATES.PAUSED;
                    } else if (this.state === GAME_STATES.PAUSED) {
                        this.state = GAME_STATES.PLAYING;
                    }
                    break;
                case 'KeyR':
                    if (this.state === GAME_STATES.GAME_OVER) {
                        this.resetGame();
                    }
                    break;
                case 'Digit1':
                case 'Digit2':
                case 'Digit3':
                    if (this.state === GAME_STATES.MENU) {
                        const difficulties = [CONFIG.GAME.DIFFICULTY_LEVELS.EASY, CONFIG.GAME.DIFFICULTY_LEVELS.MEDIUM, CONFIG.GAME.DIFFICULTY_LEVELS.HARD];
                        this.difficulty = difficulties[parseInt(e.code.slice(-1)) - 1];
                    }
                    break;
            }
        });
    }

    handleSpacePress() {
        switch (this.state) {
            case GAME_STATES.MENU:
                this.startGame();
                break;
            case GAME_STATES.GAME_OVER:
                this.resetGame();
                break;
            case GAME_STATES.PAUSED:
                this.state = GAME_STATES.PLAYING;
                break;
        }
    }

    startGame() {
        this.state = GAME_STATES.PLAYING;
        this.scores = { player: 0, ai: 0 };
        this.gameTime = 0;
        this.ball.reset();
    }

    resetGame() {
        this.state = GAME_STATES.MENU;
        this.scores = { player: 0, ai: 0 };
        this.gameTime = 0;
        this.ball.reset();
        this.particles.particles = [];
    }

    update(deltaTime) {
        if (this.state !== GAME_STATES.PLAYING) return;

        this.gameTime += deltaTime;
        
        // Update game objects
        this.player.update(this.input);
        this.ai.aiUpdate(this.ball, this.difficulty);
        
        const collision = this.ball.update();
        
        // Handle collisions
        if (collision === 'wall') {
            this.audio.playWallHit();
            this.particles.createExplosion(this.ball.x + this.ball.size / 2, this.ball.y + this.ball.size / 2, 5);
            this.screenShake = 5;
        }
        
        if (this.ball.checkPaddleCollision(this.player) || this.ball.checkPaddleCollision(this.ai)) {
            this.audio.playPaddleHit();
            this.particles.createExplosion(this.ball.x + this.ball.size / 2, this.ball.y + this.ball.size / 2, 8);
            this.screenShake = 8;
        }
        
        // Check for scoring
        if (this.ball.isOutOfBounds()) {
            const scorer = this.ball.getScoringPlayer();
            if (scorer) {
                this.scores[scorer]++;
                this.audio.playScore();
                this.particles.createExplosion(CONFIG.CANVAS.WIDTH / 2, CONFIG.CANVAS.HEIGHT / 2, 15);
                
                if (this.scores[scorer] >= CONFIG.GAME.WIN_SCORE) {
                    this.endGame(scorer);
                } else {
                    this.ball.reset();
                }
            }
        }
        
        // Update visual effects
        this.particles.update();
        this.screenShake = Math.max(0, this.screenShake - 0.5);
    }

    endGame(winner) {
        this.state = GAME_STATES.GAME_OVER;
        this.winner = winner;
        this.audio.playGameOver();
        
        // Save high score
        if (winner === 'player') {
            this.saveHighScore(this.scores.player, this.gameTime);
        }
    }

    draw() {
        // Apply screen shake
        this.ctx.save();
        if (this.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShake;
            const shakeY = (Math.random() - 0.5) * this.screenShake;
            this.ctx.translate(shakeX, shakeY);
        }
        
        // Clear canvas with gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS.HEIGHT);
        gradient.addColorStop(0, CONFIG.COLORS.BACKGROUND);
        gradient.addColorStop(1, '#000033');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, CONFIG.CANVAS.WIDTH, CONFIG.CANVAS.HEIGHT);
        
        // Draw center net
        this.drawCenterNet();
        
        if (this.state === GAME_STATES.PLAYING || this.state === GAME_STATES.PAUSED) {
            // Draw game objects
            this.player.draw(this.ctx);
            this.ai.draw(this.ctx);
            this.ball.draw(this.ctx);
            this.particles.draw(this.ctx);
            
            // Draw scores
            this.drawScores();
            
            // Draw pause overlay
            if (this.state === GAME_STATES.PAUSED) {
                this.drawPauseOverlay();
            }
        } else if (this.state === GAME_STATES.MENU) {
            this.drawMenu();
        } else if (this.state === GAME_STATES.GAME_OVER) {
            this.drawGameOver();
        }
        
        // Draw FPS counter
        this.drawFPS();
        
        this.ctx.restore();
    }

    drawCenterNet() {
        this.ctx.fillStyle = CONFIG.COLORS.NET;
        for (let i = 0; i < CONFIG.CANVAS.HEIGHT; i += 30) {
            this.ctx.fillRect(CONFIG.CANVAS.WIDTH / 2 - 2, i, 4, 20);
        }
    }

    drawScores() {
        this.ctx.fillStyle = CONFIG.COLORS.TEXT;
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        
        this.ctx.fillText(this.scores.player, CONFIG.CANVAS.WIDTH / 2 - 50, 60);
        this.ctx.fillText(this.scores.ai, CONFIG.CANVAS.WIDTH / 2 + 50, 60);
        
        // Draw game time
        this.ctx.font = '16px Arial';
        const minutes = Math.floor(this.gameTime / 60000);
        const seconds = Math.floor((this.gameTime % 60000) / 1000);
        this.ctx.fillText(`${minutes}:${seconds.toString().padStart(2, '0')}`, CONFIG.CANVAS.WIDTH / 2, 90);
    }

    drawMenu() {
        this.ctx.fillStyle = CONFIG.COLORS.TEXT;
        this.ctx.textAlign = 'center';
        
        this.ctx.font = 'bold 64px Arial';
        this.ctx.fillText('PONG', CONFIG.CANVAS.WIDTH / 2, 150);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Enhanced Edition', CONFIG.CANVAS.WIDTH / 2, 180);
        
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Press SPACE to Start', CONFIG.CANVAS.WIDTH / 2, 250);
        
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Controls:', CONFIG.CANVAS.WIDTH / 2, 300);
        this.ctx.fillText('Mouse or W/S keys to move paddle', CONFIG.CANVAS.WIDTH / 2, 320);
        this.ctx.fillText('P to pause, R to restart', CONFIG.CANVAS.WIDTH / 2, 340);
        
        this.ctx.fillText('Difficulty (1-3):', CONFIG.CANVAS.WIDTH / 2, 380);
        this.ctx.fillText('1: Easy  2: Medium  3: Hard', CONFIG.CANVAS.WIDTH / 2, 400);
        
        // Show high scores
        if (this.highScores.length > 0) {
            this.ctx.fillText('High Scores:', CONFIG.CANVAS.WIDTH / 2, 440);
            this.highScores.slice(0, 3).forEach((score, index) => {
                const time = Math.floor(score.time / 1000);
                this.ctx.fillText(`${index + 1}. Score: ${score.score} Time: ${time}s`, CONFIG.CANVAS.WIDTH / 2, 460 + index * 20);
            });
        }
    }

    drawGameOver() {
        // Draw semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, CONFIG.CANVAS.WIDTH, CONFIG.CANVAS.HEIGHT);
        
        this.ctx.fillStyle = CONFIG.COLORS.TEXT;
        this.ctx.textAlign = 'center';
        
        this.ctx.font = 'bold 48px Arial';
        this.ctx.fillText('GAME OVER', CONFIG.CANVAS.WIDTH / 2, 200);
        
        this.ctx.font = '32px Arial';
        const winnerText = this.winner === 'player' ? 'You Win!' : 'AI Wins!';
        this.ctx.fillStyle = this.winner === 'player' ? '#00ff41' : '#ff6b35';
        this.ctx.fillText(winnerText, CONFIG.CANVAS.WIDTH / 2, 250);
        
        this.ctx.fillStyle = CONFIG.COLORS.TEXT;
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Final Score: ${this.scores.player} - ${this.scores.ai}`, CONFIG.CANVAS.WIDTH / 2, 300);
        
        const gameTimeSeconds = Math.floor(this.gameTime / 1000);
        this.ctx.fillText(`Game Time: ${gameTimeSeconds} seconds`, CONFIG.CANVAS.WIDTH / 2, 330);
        
        this.ctx.font = '18px Arial';
        this.ctx.fillText('Press SPACE or R to play again', CONFIG.CANVAS.WIDTH / 2, 380);
    }

    drawPauseOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, CONFIG.CANVAS.WIDTH, CONFIG.CANVAS.HEIGHT);
        
        this.ctx.fillStyle = CONFIG.COLORS.TEXT;
        this.ctx.textAlign = 'center';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.fillText('PAUSED', CONFIG.CANVAS.WIDTH / 2, CONFIG.CANVAS.HEIGHT / 2);
        
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Press P to continue', CONFIG.CANVAS.WIDTH / 2, CONFIG.CANVAS.HEIGHT / 2 + 40);
    }

    drawFPS() {
        this.ctx.fillStyle = CONFIG.COLORS.TEXT;
        this.ctx.textAlign = 'left';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`FPS: ${this.fps}`, 10, CONFIG.CANVAS.HEIGHT - 10);
    }

    calculateFPS(currentTime) {
        this.frameCount++;
        if (currentTime - this.lastFpsUpdate >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFpsUpdate));
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
        }
    }

    loadHighScores() {
        const saved = localStorage.getItem('pongHighScores');
        this.highScores = saved ? JSON.parse(saved) : [];
    }

    saveHighScore(score, time) {
        this.highScores.push({ score, time, date: new Date().toISOString() });
        this.highScores.sort((a, b) => b.score - a.score);
        this.highScores = this.highScores.slice(0, 10); // Keep top 10
        localStorage.setItem('pongHighScores', JSON.stringify(this.highScores));
    }

    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.calculateFPS(currentTime);
        this.update(deltaTime);
        this.draw();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new PongGame();
});