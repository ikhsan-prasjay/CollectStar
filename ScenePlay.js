// Platform Game - Pure JavaScript with PROPERLY SIZED Sprite
        // Improved UI and Controls

        // Setup Canvas
        const canvas = document.getElementById('gameCanvas');
        canvas.width = 800;
        canvas.height = 600;

        const ctx = canvas.getContext('2d');

        // UI Elements
        const pauseBtn = document.getElementById('pauseBtn');
        const restartBtn = document.getElementById('restartBtn');
        const pauseIcon = document.getElementById('pauseIcon');
        const pauseText = document.getElementById('pauseText');
        const gameStatus = document.getElementById('gameStatus');
        const gameInfo = document.getElementById('gameInfo');
        const pauseOverlay = document.getElementById('pauseOverlay');

        // Assets - Images
        const assets = {
            sky: null,
            ground: null,
            star: null,
            dude: null
        };

        // Loading status
        let assetsLoaded = false;
        let loadedCount = 0;
        const totalAssets = 4;

        // Game variables
        let score = 0;
        let gameRunning = false;
        let isPaused = false;
        let instructionStartTime = null;

        // Player object - UKURAN DIPERBESAR AGAR TIDAK TERPOTONG
        const player = {
            x: 100,
            y: 400,
            width: 52,
            height: 64,
            velocityX: 0,
            velocityY: 0,
            onGround: false,
            speed: 170,
            jumpPower: 330,
            bounce: 0.2,
            currentFrame: 0,
            animationTimer: 0,
            facing: 'right'
        };

        // Platforms
        const platforms = [
            // Ground utama
            { x: 0, y: 550, width: 200, height: 70, type: 'ground' },
            { x: 200, y: 550, width: 200, height: 70, type: 'ground' },
            { x: 400, y: 550, width: 200, height: 70, type: 'ground' },
            { x: 600, y: 550, width: 200, height: 70, type: 'ground' },
            
            // Platform melayang
            { x: 150, y: 450, width: 120, height: 40, type: 'platform' },
            { x: 350, y: 350, width: 120, height: 40, type: 'platform' },
            { x: 550, y: 250, width: 120, height: 40, type: 'platform' },
            { x: 50, y: 200, width: 120, height: 40, type: 'platform' }
        ];

        // Stars array
        let stars = [];

        // Input handling
        const keys = {};
        document.addEventListener('keydown', (e) => {
            keys[e.code] = true;
            
            // Space bar untuk pause/resume
            if (e.code === 'Space' && gameRunning) {
                e.preventDefault();
                togglePause();
            }
        });

        document.addEventListener('keyup', (e) => {
            keys[e.code] = false;
        });

        // Physics constants
        const gravity = 300;
        const deltaTime = 1/60;

        // UI Functions
        function updateGameStatus() {
            if (!assetsLoaded) {
                gameStatus.textContent = 'Loading Assets...';
                gameInfo.textContent = `Loading: ${loadedCount}/${totalAssets}`;
            } else if (isPaused) {
                gameStatus.textContent = 'Game Paused';
                gameInfo.textContent = `Score: ${score} | Press SPACE or click Resume`;
            } else if (gameRunning) {
                gameStatus.textContent = `Score: ${score}`;
                gameInfo.textContent = 'Use ← → to move, ↑ to jump | Collect all stars!';
            } else {
                gameStatus.textContent = 'Ready to Play!';
                gameInfo.textContent = 'Game will start once assets are loaded...';
            }
        }

        function togglePause() {
            if (!gameRunning || !assetsLoaded) return;
            
            isPaused = !isPaused;
            
            if (isPaused) {
                pauseIcon.textContent = '▶️';
                pauseText.textContent = 'Resume';
                pauseBtn.classList.add('paused');
                pauseOverlay.classList.add('active');
            } else {
                pauseIcon.textContent = '⏸️';
                pauseText.textContent = 'Pause';
                pauseBtn.classList.remove('paused');
                pauseOverlay.classList.remove('active');
            }
            
            updateGameStatus();
        }

        function restartGame() {
            // Reset game state
            score = 0;
            isPaused = false;
            instructionStartTime = null;
            
            // Reset player
            player.x = 100;
            player.y = 400;
            player.velocityX = 0;
            player.velocityY = 0;
            player.onGround = false;
            player.currentFrame = 0;
            player.animationTimer = 0;
            player.facing = 'right';
            
            // Reset UI
            pauseIcon.textContent = '⏸️';
            pauseText.textContent = 'Pause';
            pauseBtn.classList.remove('paused');
            pauseOverlay.classList.remove('active');
            
            // Recreate stars
            createStars();
            
            updateGameStatus();
            
            console.log('Game restarted!');
        }

        // Event Listeners
        pauseBtn.addEventListener('click', togglePause);
        restartBtn.addEventListener('click', restartGame);

        // Asset loading function
        function loadAssets() {
            console.log('Loading assets...');
            updateGameStatus();
            
            // Load sky background
            assets.sky = new Image();
            assets.sky.onload = () => {
                loadedCount++;
                updateGameStatus();
                checkAllAssetsLoaded();
            };
            assets.sky.onerror = () => {
                console.log('Sky asset not found, using fallback');
                loadedCount++;
                updateGameStatus();
                checkAllAssetsLoaded();
            };
            assets.sky.src = 'assets/sky.png';

            // Load ground/platform
            assets.ground = new Image();
            assets.ground.onload = () => {
                loadedCount++;
                updateGameStatus();
                checkAllAssetsLoaded();
            };
            assets.ground.onerror = () => {
                console.log('Ground asset not found, using fallback');
                loadedCount++;
                updateGameStatus();
                checkAllAssetsLoaded();
            };
            assets.ground.src = 'assets/platform.png';

            // Load star
            assets.star = new Image();
            assets.star.onload = () => {
                loadedCount++;
                updateGameStatus();
                checkAllAssetsLoaded();
            };
            assets.star.onerror = () => {
                console.log('Star asset not found, using fallback');
                loadedCount++;
                updateGameStatus();
                checkAllAssetsLoaded();
            };
            assets.star.src = 'assets/star.png';

            // Load player sprite - DENGAN DETEKSI OTOMATIS UKURAN
            assets.dude = new Image();
            assets.dude.onload = () => {
                loadedCount++;
                console.log('Dude sprite loaded - Actual size:', assets.dude.width, 'x', assets.dude.height);
                
                // Deteksi otomatis ukuran frame berdasarkan sprite sheet
                const detectedFrameWidth = assets.dude.width / 8.8; // Asumsi 9 frame horizontal
                const detectedFrameHeight = assets.dude.height; // Asumsi 1 baris
                
                console.log('Auto-detected frame size:', detectedFrameWidth, 'x', detectedFrameHeight);
                console.log('Player will be scaled to fit properly');
                
                updateGameStatus();
                checkAllAssetsLoaded();
            };
            assets.dude.onerror = () => {
                console.log('Dude asset not found, using fallback');
                loadedCount++;
                updateGameStatus();
                checkAllAssetsLoaded();
            };
            assets.dude.src = 'assets/dude.png';
        }

        function checkAllAssetsLoaded() {
            if (loadedCount >= totalAssets) {
                assetsLoaded = true;
                gameRunning = true;
                console.log('All assets loaded, starting game...');
                updateGameStatus();
                init();
            }
        }

        // Initialize stars
        function createStars() {
            stars = [];
            for (let i = 0; i < 12; i++) {
                stars.push({
                    x: 12 + i * 65,
                    y: 0,
                    width: 50,
                    height: 37,
                    velocityY: 0,
                    collected: false,
                    bounce: Math.random() * 0.4 + 0.4
                });
            }
        }

        // Collision detection
        function isColliding(rect1, rect2) {
            return rect1.x < rect2.x + rect2.width &&
                   rect1.x + rect1.width > rect2.x &&
                   rect1.y < rect2.y + rect2.height &&
                   rect1.y + rect1.height > rect2.y;
        }

        // Update player with fixed animations
        function updatePlayer() {
            // Input dan animasi
            if (keys['ArrowLeft']) {
                player.velocityX = -player.speed;
                player.facing = 'left';
                player.animationTimer++;
                // Cycle through frames 0-3 for left animation
                if (player.animationTimer > 8) {
                    player.currentFrame = (player.currentFrame + 1) % 4; 
                    player.animationTimer = 0;
                }
            } else if (keys['ArrowRight']) {
                player.velocityX = player.speed;
                player.facing = 'right';
                player.animationTimer++;
                // Cycle through frames 0-3 (which will map to 5-8 for right animation)
                if (player.animationTimer > 8) {
                    player.currentFrame = (player.currentFrame + 1) % 4; 
                    player.animationTimer = 0;
                }
            } else {
                player.velocityX = 0;
                player.currentFrame = 0; // Reset to first animation frame
                player.animationTimer = 0;
            }

            if (keys['ArrowUp'] && player.onGround) {
                player.velocityY = -player.jumpPower;
                player.onGround = false;
            }

            // Fisika
            player.velocityY += gravity * deltaTime;

            // Update posisi
            player.x += player.velocityX * deltaTime;
            player.y += player.velocityY * deltaTime;

            // Batas kiri-kanan
            if (player.x < 0) {
                player.x = 0;
                player.velocityX = 0;
            }
            if (player.x + player.width > canvas.width) {
                player.x = canvas.width - player.width;
                player.velocityX = 0;
            }

            // Batas atas (penting!)
            if (player.y < 0) {
                player.y = 0;
                player.velocityY = 0;
            }

            // Collision dengan platform
            player.onGround = false;
            for (let platform of platforms) {
                if (isColliding(player, platform)) {
                    if (player.velocityY > 0 && player.y < platform.y) {
                        player.y = platform.y - player.height;
                        player.velocityY = -player.velocityY * player.bounce;
                        player.onGround = true;
                    }
                }
            }

            // Batas bawah
            if (player.y + player.height > canvas.height) {
                player.y = canvas.height - player.height;
                player.velocityY = 0;
                player.onGround = true;
            }
        }

        // Update stars
        function updateStars() {
            for (let star of stars) {
                if (!star.collected) {
                    star.velocityY += gravity * deltaTime * 0.5;
                    star.y += star.velocityY * deltaTime;

                    for (let platform of platforms) {
                        if (isColliding(star, platform) && star.velocityY > 0) {
                            star.y = platform.y - star.height;
                            star.velocityY = -star.velocityY * star.bounce;
                        }
                    }

                    if (star.y + star.height > canvas.height) {
                        star.y = canvas.height - star.height;
                        star.velocityY = -star.velocityY * star.bounce;
                    }

                    if (isColliding(player, star)) {
                        collectStar(star);
                    }
                }
            }
        }

        function collectStar(star) {
            star.collected = true;
            score += 10;
            updateGameStatus();
            
            let activeStars = stars.filter(s => !s.collected).length;
            if (activeStars === 0) {
                stars.forEach(function(star) {
                    star.collected = false;
                    star.y = 0;
                    star.velocityY = 0;
                });
            }
        }

        // Drawing functions
        function drawBackground() {
            if (assets.sky && assets.sky.complete && assets.sky.naturalHeight !== 0) {
                ctx.drawImage(assets.sky, 0, 0, canvas.width, canvas.height);
            } else {
                // Fallback gradient background
                const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#87CEEB');
                gradient.addColorStop(0.7, '#98FB98');
                gradient.addColorStop(1, '#228B22');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }

        function drawPlatforms() {
            for (let platform of platforms) {
                if (assets.ground && assets.ground.complete && assets.ground.naturalHeight !== 0) {
                    ctx.drawImage(assets.ground, 
                        platform.x, platform.y, 
                        platform.width, platform.height);
                } else {
                    // Fallback platform
                    if (platform.type === 'ground') {
                        ctx.fillStyle = '#8B4513';
                        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                        ctx.fillStyle = '#228B22';
                        ctx.fillRect(platform.x, platform.y, platform.width, 8);
                        ctx.strokeStyle = '#654321';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
                    } else {
                        ctx.fillStyle = '#CD853F';
                        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                        ctx.fillStyle = '#32CD32';
                        ctx.fillRect(platform.x, platform.y, platform.width, 6);
                        ctx.strokeStyle = '#8B7355';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
                    }
                }
            }
        }

        // FUNGSI DRAW PLAYER DENGAN UKURAN YANG BENAR
        function drawPlayer() {
            if (assets.dude && assets.dude.complete && assets.dude.naturalHeight !== 0) {
                // DETEKSI OTOMATIS UKURAN FRAME DARI SPRITE SHEET
                const spriteWidth = assets.dude.width;
                const spriteHeight = assets.dude.height;
                
                // Asumsi format sprite sheet standar (9 frame horizontal untuk dude.png)
                const totalFrames = 8.8;
                const frameWidth = Math.floor(spriteWidth / totalFrames);
                const frameHeight = spriteHeight;
                
                let frameX = 0;
                let frameY = 0;
                
                // Logika frame yang diperbaiki
                if (player.velocityX === 0) {
                    // Idle frame (frame 4 biasanya untuk idle di sprite dude.png)
                    frameX = 4 * frameWidth;
                    frameY = 0;
                } else if (player.facing === 'left') {
                    // Frame 0-3 untuk animasi kiri
                    frameX = player.currentFrame * frameWidth; // currentFrame will be 0-3
                    frameY = 0;
                } else { // player.facing === 'right'
                    // Frame 5-8 untuk animasi kanan
                    frameX = (5 + player.currentFrame) * frameWidth; // currentFrame will be 0-3, mapping to 5-8
                    frameY = 0;
                }
                
                // Pastikan tidak keluar batas
                if (frameX >= spriteWidth) {
                    frameX = 4 * frameWidth; // Default ke idle frame jika ada perhitungan salah
                }
                
                try {
                    // Gambar sprite dengan ukuran yang diperbesar dan proporsional
                    ctx.drawImage(
                        assets.dude,
                        frameX, frameY,
                        frameWidth, frameHeight,
                        player.x, player.y,
                        player.width, player.height
                    );
                    
                } catch (error) {
                    console.error('Error drawing sprite:', error);
                    drawFallbackPlayer();
                }
            } else {
                drawFallbackPlayer();
            }
        }

        // Fungsi fallback untuk player yang lebih besar
        function drawFallbackPlayer() {
            // Body utama
            ctx.fillStyle = '#FF6B6B';
            ctx.fillRect(player.x, player.y, player.width, player.height);
            
            // Head
            ctx.fillStyle = '#FFE4B5';
            ctx.fillRect(player.x + 8, player.y + 4, player.width - 16, 20);
            
            // Eyes
            ctx.fillStyle = '#000';
            if (player.facing === 'left') {
                ctx.fillRect(player.x + 10, player.y + 10, 3, 3);
                ctx.fillRect(player.x + 16, player.y + 10, 3, 3);
            } else {
                ctx.fillRect(player.x + player.width - 19, player.y + 10, 3, 3);
                ctx.fillRect(player.x + player.width - 13, player.y + 10, 3, 3);
            }
            
            // Body
            ctx.fillStyle = '#4169E1';
            ctx.fillRect(player.x + 6, player.y + 24, player.width - 12, 24);
            
            // Arms
            ctx.fillStyle = '#FFE4B5';
            ctx.fillRect(player.x + 2, player.y + 28, 8, 16);
            ctx.fillRect(player.x + player.width - 10, player.y + 28, 8, 16);
            
            // Legs
            ctx.fillStyle = '#000080';
            ctx.fillRect(player.x + 8, player.y + 48, 8, 16);
            ctx.fillRect(player.x + player.width - 16, player.y + 48, 8, 16);
            
            // Simple animation untuk fallback
            if (player.velocityX !== 0) {
                const offset = Math.sin(Date.now() * 0.01) * 2;
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(player.x + 6, player.y + player.height - 4, 12, 4);
                ctx.fillRect(player.x + player.width - 18, player.y + player.height - 4 + offset, 12, 4);
            }
        }

        function drawStars() {
            for (let star of stars) {
                if (!star.collected) {
                    if (assets.star && assets.star.complete && assets.star.naturalHeight !== 0) {
                        ctx.drawImage(assets.star, star.x, star.y, star.width, star.height);
                    } else {
                        // Fallback star
                        ctx.fillStyle = '#FFD700';
                        ctx.beginPath();
                        let centerX = star.x + star.width / 2;
                        let centerY = star.y + star.height / 2;
                        let radius = star.width / 3;
                        
                        for (let i = 0; i < 5; i++) {
                            let angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                            let x = centerX + Math.cos(angle) * radius;
                            let y = centerY + Math.sin(angle) * radius;
                            if (i === 0) ctx.moveTo(x, y);
                            else ctx.lineTo(x, y);
                        }
                        
                        ctx.closePath();
                        ctx.fill();
                        ctx.strokeStyle = '#FFA500';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            }
        }

        function drawScore() {
            ctx.fillStyle = '#000';
            ctx.font = '32px Arial';
            ctx.fillText('Score: ' + score, 16, 48);
            
            ctx.fillStyle = '#FFF';
            ctx.fillText('Score: ' + score, 14, 46);
        }

        function drawLoadingScreen() {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#FFF';
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Loading Assets...', canvas.width / 2, canvas.height / 2);
            
            const barWidth = 200;
            const barHeight = 20;
            const barX = (canvas.width - barWidth) / 2;
            const barY = canvas.height / 2 + 50;
            
            ctx.strokeStyle = '#FFF';
            ctx.strokeRect(barX, barY, barWidth, barHeight);
            
            ctx.fillStyle = '#0F0';
            const progress = loadedCount / totalAssets;
            ctx.fillRect(barX, barY, barWidth * progress, barHeight);
            
            ctx.textAlign = 'left';
        }

        function drawInstructions() {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(canvas.width - 240, 10, 220, 160);

            ctx.fillStyle = '#000';
            ctx.font = '14px Arial';
            ctx.fillText('← → : Bergerak', canvas.width - 230, 30);
            ctx.fillText('↑ : Melompat', canvas.width - 230, 50);
            ctx.fillText('SPACE : Pause/Resume', canvas.width - 230, 70);
            ctx.fillText('⭐ : Kumpulkan bintang!', canvas.width - 230, 90);
            ctx.fillText('', canvas.width - 230, 110);
            ctx.fillText('Sprite Info:', canvas.width - 230, 130);
            ctx.fillText(`Player: ${player.width}x${player.height}`, canvas.width - 230, 150);
        }

        function gameLoop() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (!instructionStartTime) {
                instructionStartTime = performance.now();
            }

            if (!assetsLoaded) {
                drawLoadingScreen();
                requestAnimationFrame(gameLoop);
                return;
            }

            if (!gameRunning || isPaused) {
                // Still draw the game when paused
                if (isPaused) {
                    drawBackground();
                    drawPlatforms();
                    drawStars();
                    drawPlayer();
                    drawScore();
                }
                requestAnimationFrame(gameLoop);
                return;
            }

            updatePlayer();
            updateStars();

            drawBackground();
            drawPlatforms();
            drawStars();
            drawPlayer();
            drawScore();

            // Tampilkan instruksi hanya selama 8 detik pertama
            if (performance.now() - instructionStartTime < 8000) {
                drawInstructions();
            }

            requestAnimationFrame(gameLoop);
        }

        function init() {
            createStars();
            updateGameStatus();
            console.log('Game initialized with improved UI controls!');
        }

loadAssets();
gameLoop();
