const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');

let isPlaying = false;
let score = 0;
let gameFrame = 0;

const catSprite = new Image();
catSprite.src = 'assets/catspritesx4.gif'; 
const bgSprite = new Image();
bgSprite.src = 'assets/Scene-29.jpg';

const imgChicken = new Image(); imgChicken.src = 'assets/chicken.png';
const imgFish = new Image(); imgFish.src = 'assets/fish.png';
const imgBroom = new Image(); imgBroom.src = 'assets/broom.png';

const cat = {
    x: canvas.width / 2 - 50,
    y: canvas.height - 165,
    targetX: canvas.width / 2 - 50,
    width: 100,
    height: 100,
    speed: 8,
    frameX: 0,
    frameY: 1, 
    staggerFrames: 6,
    maxFrames: 6,
    facingRight: false,
    isMoving: false
};

const items = [];
const itemTypes = [
    { name: 'chicken', img: imgChicken, color: '#8FBC8F', points: 10, speed: 3 },
    { name: 'fish', img: imgFish, color: '#483D8B', points: 15, speed: 4 },
    { name: 'broom', img: imgBroom, color: '#CD5C5C', points: -10, speed: 3.5 }
];

canvas.addEventListener('mousemove', (e) => {
    if (!isPlaying) return;
    const rect = canvas.getBoundingClientRect();
    cat.targetX = e.clientX - rect.left - cat.width / 2;
});

document.addEventListener('keydown', (e) => {
    if (!isPlaying) return;
    if (e.key === 'ArrowLeft') cat.targetX -= 20;
    if (e.key === 'ArrowRight') cat.targetX += 20;
});

function checkCollision(rect1, rect2) {
    const hitbox = {
        x: rect1.x + 25,
        y: rect1.y + 25,
        width: rect1.width - 50,
        height: rect1.height - 30
    };
    return (
        hitbox.x < rect2.x + rect2.width &&
        hitbox.x + hitbox.width > rect2.x &&
        hitbox.y < rect2.y + rect2.height &&
        hitbox.y + hitbox.height > rect2.y
    );
}

function update() {
    if (!isPlaying) return;

    const distance = cat.targetX - cat.x;
    const deadZone = 5;

    if (Math.abs(distance) > deadZone) {
        cat.isMoving = true;
        cat.x += Math.sign(distance) * cat.speed;
        
        if (distance > 0) cat.facingRight = false;
        else cat.facingRight = true;
    } else {
        cat.isMoving = false;
    }

    if (cat.x < 0) cat.x = 0;
    if (cat.x + cat.width > canvas.width) cat.x = canvas.width - cat.width;

    if (cat.isMoving) {
        if (gameFrame % cat.staggerFrames === 0) {
            cat.frameX = (cat.frameX + 1) % cat.maxFrames;
        }
    } else {
        cat.frameX = 0;
    }

    gameFrame++;

    for (let i = 0; i < items.length; i++) {
        items[i].y += items[i].speed;
        if (checkCollision(cat, items[i])) {
            score += items[i].points;
            items.splice(i, 1);
            i--;
            continue;
        }
        if (items[i].y > canvas.height) {
            items.splice(i, 1);
            i--;
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (bgSprite.complete) {
        ctx.drawImage(bgSprite, 0, 0, canvas.width, canvas.height);
    }

    if (catSprite.complete && catSprite.naturalWidth !== 0) {
        const spriteW = catSprite.width / 6;
        const spriteH = catSprite.height / 3;
        
        ctx.save();
        if (!cat.facingRight) {
            ctx.translate(cat.x + cat.width, cat.y);
            ctx.scale(-1, 1);
            ctx.drawImage(catSprite, cat.frameX * spriteW, cat.frameY * spriteH, spriteW, spriteH, 0, 0, cat.width, cat.height);
        } else {
            ctx.drawImage(catSprite, cat.frameX * spriteW, cat.frameY * spriteH, spriteW, spriteH, cat.x, cat.y, cat.width, cat.height);
        }
        ctx.restore();
    }

    items.forEach(item => {
        if (item.img.complete && item.img.naturalWidth !== 0) {
            ctx.drawImage(item.img, item.x, item.y, item.width, item.height);
        } else {
            ctx.fillStyle = item.color;
            ctx.fillRect(item.x, item.y, item.width, item.height);
        }
    });

    ctx.fillStyle = 'white';
    ctx.font = 'bold 26px Arial';
    ctx.fillText('Рахунок: ' + score, 20, 40);
}

function spawnItem() {
    if (!isPlaying) return;
    const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
    items.push({
        x: Math.random() * (canvas.width - 40),
        y: -50,
        width: 40,
        height: 40,
        img: type.img,
        color: type.color,
        points: type.points,
        speed: type.speed
    });
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

startButton.addEventListener('click', () => {
    startScreen.style.display = 'none';
    isPlaying = true;
    score = 0;
    items.length = 0;
    setInterval(spawnItem, 1000);
});

gameLoop();