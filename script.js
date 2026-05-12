const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const walkImage = new Image(); walkImage.src = 'assets/WALK.png';
const runImage = new Image(); runImage.src = 'assets/RUN.png';
const idleImage = new Image(); idleImage.src = 'assets/IDLE.png';
const jumpImage = new Image(); jumpImage.src = 'assets/JUMP.png';
const runJumpImage = new Image(); runJumpImage.src = 'assets/RUN_JUMP.png';
const sleepImage = new Image(); sleepImage.src = 'assets/SLEEP.png';
const wakeImage = new Image(); wakeImage.src = 'assets/WAKE.png';
const lickImage = new Image(); lickImage.src = 'assets/LICK.png';

const itemImages = [];
const itemData = [
    { src: 'assets/canned_food.png', points: 1, weight: 60 },
    { src: 'assets/sushi.png', points: 2, weight: 25 },
    { src: 'assets/shrimp.png', points: 3, weight: 10 },
    { src: 'assets/steak.png', points: 5, weight: 5 }
];

itemData.forEach(data => {
    const img = new Image();
    img.src = data.src;
    itemImages.push(img);
});

const cat = {
    x: window.innerWidth / 2,
    y: 0, sourceWidth: 0, sourceHeight: 0, width: 0, height: 0,
    walkSpeed: 2.5, runSpeed: 7, dx: 0, dy: 0,
    gravity: 0.35, jumpForce: -10, isJumping: false,
    frameX: 0, frameTimer: 0,
    walkFrames: 12, runFrames: 8, idleFrames: 8, jumpFrames: 3, runJumpFrames: 3,
    sleepFrames: 8, wakeFrames: 2, lickFrames: 15,
    walkInterval: 6, runInterval: 5, idleInterval: 15, jumpInterval: 12,
    runJumpInterval: 20, sleepInterval: 20, wakeInterval: 10, lickInterval: 10,
    facingLeft: true, scale: 4, isRunning: false, currentImg: sleepImage
};

const items = [];
let score = 0;
let itemSpawnTimer = 0;
let itemSpawnInterval = 160;

// Змінні для таймера
let startTime = 0;
let elapsedTime = 0;

let imagesLoaded = 0;
const gameImages = [walkImage, runImage, idleImage, jumpImage, runJumpImage, sleepImage, wakeImage, lickImage];
const totalImages = gameImages.length + itemData.length;

let gameState = 'MENU';

const startScreen = document.getElementById('start-screen');
const uiLayer = document.getElementById('ui-layer');
const startBtn = document.getElementById('start-btn');

startBtn.addEventListener('click', () => {
    if (gameState !== 'MENU') return;
    startScreen.classList.add('fade-out');
    gameState = 'WAKING';
    cat.frameX = 0;
});

function init() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        resizeCanvas();
        gameLoop();
    }
}

gameImages.forEach(img => { img.onload = init; });
itemImages.forEach(img => { img.onload = init; });

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.imageSmoothingEnabled = false;
    
    if (idleImage.height > 0) {
        cat.sourceHeight = idleImage.height;
        cat.height = cat.sourceHeight * cat.scale;
        if (!cat.isJumping) {
            cat.y = canvas.height - 20 - cat.height;
        }
    }
}

window.addEventListener('resize', resizeCanvas);

const keys = {
    ArrowLeft: false, ArrowRight: false, a: false, d: false,
    Control: false, Space: false
};

window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
    if (e.code === 'Space') keys.Space = true;
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
    if (e.code === 'Space') keys.Space = false;
});

function createItem() {
    let totalWeight = 0;
    for (let i = 0; i < itemData.length; i++) totalWeight += itemData[i].weight;

    let randomNum = Math.random() * totalWeight;
    let selectedIndex = 0;
    for (let i = 0; i < itemData.length; i++) {
        randomNum -= itemData[i].weight;
        if (randomNum <= 0) { selectedIndex = i; break; }
    }

    const img = itemImages[selectedIndex];
    const itemScale = 3;
    const item = {
        img: img, points: itemData[selectedIndex].points,
        x: Math.random() * (canvas.width - img.width * itemScale),
        y: -img.height * itemScale,
        width: img.width * itemScale, height: img.height * itemScale,
        speed: 0.8 + Math.random() * 0.7
    };
    items.push(item);
}

function updateItems() {
    itemSpawnTimer++;
    if (itemSpawnTimer >= itemSpawnInterval) {
        createItem();
        itemSpawnTimer = 0;
    }
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i]; item.y += item.speed;
        if (item.y > canvas.height) { items.splice(i, 1); continue; }
        if (cat.x < item.x + item.width && cat.x + cat.width > item.x &&
            cat.y < item.y + item.height && cat.y + cat.height > item.y) {
            score += item.points; items.splice(i, 1);
        }
    }
}

function drawItems() {
    items.forEach(item => { ctx.drawImage(item.img, item.x, item.y, item.width, item.height); });
}

function formatTime(ms) {
    let seconds = Math.floor(ms / 1000);
    let minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function drawUI() {
    if (gameState !== 'PLAYING') return;
    ctx.fillStyle = 'black'; 
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Очки: ' + score, 20, 40);
    
    // Відображення таймера
    ctx.fillText('Час: ' + formatTime(elapsedTime), 20, 75);
}

function update() {
    const floorY = canvas.height - 20 - cat.height;

    if (gameState === 'MENU') {
        cat.currentImg = sleepImage;
        const totalFrames = cat.sleepFrames || 1;
        cat.sourceWidth = cat.currentImg.width / totalFrames;
        cat.sourceHeight = cat.currentImg.height;
        cat.width = cat.sourceWidth * cat.scale;
        cat.height = cat.sourceHeight * cat.scale;
        cat.x = (canvas.width - cat.width) / 2;
        cat.y = canvas.height - 20 - cat.height;

        cat.frameTimer++;
        if (cat.frameTimer >= cat.sleepInterval) {
            cat.frameX = (cat.frameX + 1) % totalFrames;
            cat.frameTimer = 0;
        }
        return;
    }

    if (gameState === 'WAKING') {
        cat.currentImg = wakeImage;
        const totalFrames = cat.wakeFrames || 1;
        cat.sourceWidth = cat.currentImg.width / totalFrames;
        cat.sourceHeight = cat.currentImg.height;
        cat.width = cat.sourceWidth * cat.scale;
        cat.height = cat.sourceHeight * cat.scale;
        cat.x = (canvas.width - cat.width) / 2;
        cat.y = canvas.height - 20 - cat.height;

        cat.frameTimer++;
        if (cat.frameTimer >= cat.wakeInterval) {
            if (cat.frameX < totalFrames - 1) {
                cat.frameX++;
            } else {
                gameState = 'LICKING';
                cat.frameX = 0;
            }
            cat.frameTimer = 0;
        }
        return;
    }

    if (gameState === 'LICKING') {
        cat.currentImg = lickImage;
        const totalFrames = cat.lickFrames || 1;
        cat.sourceWidth = cat.currentImg.width / totalFrames;
        cat.sourceHeight = cat.currentImg.height;
        cat.width = cat.sourceWidth * cat.scale;
        cat.height = cat.sourceHeight * cat.scale;
        cat.x = (canvas.width - cat.width) / 2;
        cat.y = canvas.height - 20 - cat.height;

        cat.frameTimer++;
        if (cat.frameTimer >= cat.lickInterval) {
            if (cat.frameX < totalFrames - 1) {
                cat.frameX++;
            } else {
                gameState = 'PLAYING';
                startScreen.style.display = 'none';
                score = 0;
                items.length = 0;
                cat.x = (canvas.width - cat.width) / 2;
                cat.facingLeft = true;
                cat.frameX = 0;
                // Запуск відліку часу
                startTime = Date.now();
            }
            cat.frameTimer = 0;
        }
        return;
    }

    if (gameState === 'PLAYING') {
        // Оновлення таймера
        elapsedTime = Date.now() - startTime;

        cat.isRunning = keys.Control;
        let isMoving = false;

        if (keys.ArrowLeft || keys.a) {
            cat.dx = -(cat.isRunning ? cat.runSpeed : cat.walkSpeed);
            cat.facingLeft = true; isMoving = true;
        } else if (keys.ArrowRight || keys.d) {
            cat.dx = (cat.isRunning ? cat.runSpeed : cat.walkSpeed);
            cat.facingLeft = false; isMoving = true;
        } else { cat.dx = 0; isMoving = false; }

        if (keys.Space && !cat.isJumping) {
            cat.dy = cat.jumpForce; cat.isJumping = true; cat.frameX = 0;
        }

        cat.x += cat.dx; cat.y += cat.dy; cat.dy += cat.gravity;

        if (cat.x < 0) cat.x = 0;
        if (cat.x + cat.width > canvas.width) cat.x = canvas.width - cat.width;

        let nextImg; let totalFrames; let currentInterval;

        if (cat.isJumping) {
            if (cat.isRunning) {
                nextImg = runJumpImage; totalFrames = cat.runJumpFrames; currentInterval = cat.runJumpInterval;
            } else {
                nextImg = jumpImage; totalFrames = cat.jumpFrames; currentInterval = cat.jumpInterval;
            }
        } else if (isMoving) {
            nextImg = cat.isRunning ? runImage : walkImage;
            totalFrames = cat.isRunning ? cat.runFrames : cat.walkFrames;
            currentInterval = cat.isRunning ? cat.runInterval : cat.walkInterval;
        } else {
            nextImg = idleImage; totalFrames = cat.idleFrames; currentInterval = cat.idleInterval;
        }

        if (cat.currentImg !== nextImg) {
            cat.currentImg = nextImg; cat.frameX = 0; cat.frameTimer = 0;
        }

        cat.sourceWidth = cat.currentImg.width / totalFrames;
        cat.sourceHeight = cat.currentImg.height;
        cat.width = cat.sourceWidth * cat.scale;
        cat.height = cat.sourceHeight * cat.scale;

        if (cat.y >= floorY) { cat.y = floorY; cat.dy = 0; cat.isJumping = false; }

        cat.frameTimer++;
        if (cat.frameTimer >= currentInterval) {
            if (cat.isJumping) {
                if (cat.frameX < totalFrames - 1) cat.frameX++;
            } else {
                cat.frameX = (cat.frameX + 1) % totalFrames;
            }
            cat.frameTimer = 0;
        }
        updateItems();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (gameState === 'PLAYING') drawItems();

    ctx.save();
    if (cat.facingLeft) {
        ctx.drawImage(cat.currentImg, cat.frameX * cat.sourceWidth, 0,
            cat.sourceWidth, cat.sourceHeight, cat.x, cat.y, cat.width, cat.height);
    } else {
        ctx.translate(cat.x + cat.width / 2, cat.y + cat.height / 2);
        ctx.scale(-1, 1);
        ctx.drawImage(cat.currentImg, cat.frameX * cat.sourceWidth, 0,
            cat.sourceWidth, cat.sourceHeight, -cat.width / 2, -cat.height / 2, cat.width, cat.height);
    }
    ctx.restore();
    drawUI();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}