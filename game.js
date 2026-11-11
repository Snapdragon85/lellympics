const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");


function resizeCanvas() {
    const scale = Math.min(
        window.innerWidth / 1000,
        window.innerHeight / 600
    );

    canvas.width = 1000;
    canvas.height = 600;

    canvas.style.width = `${1000 * scale}px`;
    canvas.style.height = `${600 * scale}px`;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

ctx.imageSmoothingEnabled = false;
const playerImage = new Image();
playerImage.src = "sprites/player.png";
const backgroundImage = new Image();
backgroundImage.src = "sprites/background.jpg";
const jumpingImage = new Image();
jumpingImage.src = "sprites/player_jumping.png";

const handImages = [];

for (let i = 0; i <= 5; i++) {
    const img = new Image();
    img.src = i === 0
        ? "sprites/hand.png"
        : `sprites/hand_${i}.png`;

    handImages.push(img);
}

let projectiles = [];
let shotCooldown = 5;

let damageCooldown = 0;
let gameOver = false;

let animationTime = 0;
let currentStretch = 1;

let aiming = false;
let selectedFinger = null;

let currentRoom = 0;
let transitioning = false;
let transitionProgress = 0;
let nextRoom = 0;

const handMenu = {
    size: 125
};


let coyoteTime = 0;
const coyoteDuration = 0.15;

const player = {
    x: 50,
    y: 50,
    width: 80,
    height: 80,
    vx: 0,
    vy: 0,
    grounded: false,
    gravityWeight: 0.3,
    facing: 1,
    hitbox: {
        x:25,
        y:0,
        width: 30,
        height: 80
    },
    health: 8,
    maxHealth: 8,
};

let platforms = [
    {
        x: 250,
        y: 400,
        width: 200,
        height: 20
    },
    {
        x: 550,
        y: 320,
        width: 150,
        height: 20
    },
    {
        x: 300,
        y: 250,
        width: 120,
        height: 20
    },
    {
        x: 0,
        y: 500,
        width: 1500,
        height: 110
    }
];

let enemies = [
    {
        x: 600,
        y: 400,
        width: 50,
        height: 50,
        health: 3,
        vx: 2,
        vy: 0,
        grounded: false,
        gravityWeight: 0.3
    }
];

const rooms = [
    {
        platforms: platforms,
        enemies: []
    },
    {
        platforms: [
            { x: 0, y: 500, width: 1000, height: 110 },
            { x: 200, y: 400, width: 200, height: 20 },
            { x: 600, y: 300, width: 200, height: 20 }
        ],
        enemies: [
            {
                x: 700,
                y: 250,
                width: 50,
                height: 50,
                health: 3,
                vx: 2,
                vy: 0,
                grounded: false,
                gravityWeight: 0.3
            }
        ]
    }
];

function drawPlayer() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (backgroundImage.complete && backgroundImage.naturalWidth > 0) {
        ctx.drawImage(
            backgroundImage,
            0, 0,
            canvas.width,
            canvas.height
        );
    }

    if (playerImage.complete && playerImage.naturalWidth > 0) {
        
        let currentImage = playerImage;

        if (!player.grounded) {
            currentImage = jumpingImage;
        }

        ctx.save();

        if (player.facing === -1) {
            ctx.scale(-1,1);
            ctx.drawImage(
                currentImage,
                -player.x - player.width,
                player.y + player.height - player.height * currentStretch,
                player.width,
                player.height * currentStretch
            );
        } else {
            ctx.drawImage(
                currentImage,
                player.x,
                player.y + player.height - player.height * currentStretch,
                player.width,
                player.height * currentStretch
        );
        }

        ctx.restore();
    }
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.strokeRect(
        player.x + player.hitbox.x,
        player.y + player.hitbox.y,
        player.hitbox.width,
        player.hitbox.height
    );

    ctx.fillStyle = "gray";   



    for (const platform of platforms) {
        ctx.fillStyle = "#22b14c";
        ctx.fillRect(
            platform.x,
            platform.y,
            platform.width,
            platform.height
        );

        ctx.shadowColor = "#277722";
        ctx.shadowBlur = 12;
        ctx.strokeStyle = "#277722";
        ctx.lineWidth = 5;
        ctx.strokeRect(
            platform.x,
            platform.y,
            platform.width,
            platform.height
        );
        ctx.shadowBlur = 0;

    }

    for (const enemy of enemies) {
        ctx.fillStyle = "#ff3333";
        ctx.fillRect(
            enemy.x,
            enemy.y,
            enemy.width,
            enemy.height
        );
        
        ctx.fillStyle = "#333333";
        ctx.fillRect(enemy.x, enemy.y - 12, enemy.width, 6);

        ctx.fillStyle = "#22ff66";
        ctx.fillRect(
            enemy.x,
            enemy.y - 12,
            enemy.width * (enemy.health / 3),
            6
        );
    }

    for (const projectile of projectiles) {
        ctx.fillStyle = "#22ffff";
        ctx.shadowColor = "#22ffff";
        ctx.shadowBlur = 15;

        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
    }


    if (aiming) {
        ctx.fillStyle = "#252540";
        ctx.beginPath();
        ctx.arc(
            player.x + player.width / 2,
            player.y + player.height / 2,
            handMenu.size,
            0,
            Math.PI * 2
        );
        ctx.fill();

        ctx.strokeStyle = "#22ffff";
        ctx.lineWidth = 4;
        ctx.stroke();
    }
    if (aiming) {
        const handToDraw = handImages[selectedFinger ?? 0];

        if (handToDraw.complete && handToDraw.naturalWidth > 0) {
            ctx.drawImage(
                handToDraw,
                player.x + player.width / 2 - 60,
                player.y + player.height / 2 - 60,
                120,
                120
            );
        }
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        for (let i = 1; i <= 5; i++) {
            const angle = -Math.PI / 2 + (i - 1) * Math.PI / 8;
            const x = player.x + player.width / 2 + Math.cos(angle) * 85;
            const y = player.y + player.height / 2 + Math.sin(angle) * 85;

            if (selectedFinger === i) {
                ctx.fillStyle = "rgba(34, 255, 255, 0.2)";
                ctx.strokeStyle = "#22ffff";
                ctx.lineWidth = 2;
                ctx.shadowColor = "#22ffff";
                ctx.shadowBlur = 12;

                ctx.fillRect(x - 15, y - 15, 30, 30);
                ctx.strokeRect(x - 15, y - 15, 30, 30);

                ctx.shadowBlur = 0;
            }

            ctx.fillStyle = selectedFinger === i ? "#22ffff" : "white";
            ctx.fillText(i, x, y);
        }
    }
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fillRect(0, 0, 1750, 100);
    ctx.strokeStyle = "#22ffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 1750, 100);

    ctx.fillStyle = "#333333";
    ctx.fillRect(20, 20, 150, 15);

    ctx.fillStyle = "#22ff66";
    ctx.fillRect(
        20,
        20,
        150 * (player.health / player.maxHealth),
        15
    );

    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 150, 15);

    if (transitioning) {
        const opacity = transitionProgress < 0.5
            ? transitionProgress * 2
            : (1 - transitionProgress) * 2;

        ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

drawPlayer();

const keys = {};

document.addEventListener("keydown", function(event) {
    if (gameOver) return;
    keys[event.key] = true;

    if (event.key === "ArrowUp" || event.key === "w") {
        if (player.grounded || coyoteTime > 0) {
            player.vy = -8;
            player.grounded = false;
            coyoteTime = 0;
        }
    }
    if (event.code === "KeyR" && !aiming && shotCooldown <= 0) {
        aiming = true;
        selectedFinger = null;
    }
    if (aiming && ["1", "2", "3", "4", "5"].includes(event.key)) {
        selectedFinger = Number(event.key);
    }
});

document.addEventListener("keyup", function(event) {
    keys[event.key] = false;
    if (gameOver) return;

    if (event.code === "KeyR" && aiming) {
        aiming = false;

        if (selectedFinger !== null) {
            const angles = [null, 90, 60, 45, 30, 0];
            const angle = angles[selectedFinger] * Math.PI / 180;

            projectiles.push({
                x: player.x + player.width / 2,
                y: player.y + player.height / 2,
                vx: Math.cos(angle) * 12 * player.facing,
                vy: -Math.sin(angle) * 12
            });
            shotCooldown = 1;
        }
    }
});

function gravity() {
    if (!player.grounded) {
        if (player.y + player.hitbox.y + player.hitbox.height < canvas.height) {
            player.vy += player.gravityWeight;
        }
    }
}

function switchRoom(roomNumber) {
    currentRoom = roomNumber;

    platforms = rooms[currentRoom].platforms;
    enemies = rooms[currentRoom].enemies.map(enemy => ({ ...enemy }));

    player.x = 50;
    player.y = 350;
    player.vx = 0;
    player.vy = 0;
}

function gameLoop() {
    if (gameOver) {
        drawPlayer();

        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#ff3333";
        ctx.font = "bold 60px Arial";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);

        requestAnimationFrame(gameLoop);
        return;
    }

    if (aiming) {
        drawPlayer();
        requestAnimationFrame(gameLoop);
        return;
    }
    if (shotCooldown > 0) {
        shotCooldown -= 1 / 60;
    }

    if (transitioning) {
        transitionProgress += 1 / 30;

        if (transitionProgress >= 0.5 && currentRoom !== nextRoom) {
            switchRoom(nextRoom);
        }

        if (transitionProgress >= 1) {
            transitioning = false;
            transitionProgress = 0;
        }
    }

    animationTime += 0.05;
    let targetStretch = 1;

    if (!player.grounded) {
        targetStretch = 1 + player.vy * 0.025;
    }

    targetStretch = Math.max(0.85, Math.min(1.15, targetStretch));

    currentStretch += (targetStretch - currentStretch) * 0.15;
    
    if (player.grounded) {
        coyoteTime = coyoteDuration;
    } else {
        coyoteTime -= 1 / 60;
    }
    player.grounded = false;
    gravity();

    if (keys["ArrowRight"] || keys["d"]) {
        player.vx = 8;
        player.facing = 1;
    }

    if (keys["ArrowLeft"] || keys["a"]) {
        player.vx = -8;
        player.facing = -1;
    }

    if (keys["ArrowDown"] || keys["s"]) {
        player.vy += 1;
    }
    if (!keys["ArrowRight"] && !keys["ArrowLeft"]) {
        player.vx *= 0.85;
    }
    if (
        !transitioning &&
        player.x + player.hitbox.x + player.hitbox.width >= canvas.width
    ) {
        nextRoom = currentRoom + 1;

        if (nextRoom < rooms.length) {
            transitioning = true;
            transitionProgress = 0;
        }
    }

    const previousX = player.x;
    const previousY = player.y;
    
    player.x += player.vx;
    player.y += player.vy;

    for (const projectile of projectiles) {
        projectile.x += projectile.vx;
        projectile.y += projectile.vy;
    }
    for (const projectile of projectiles) {
        for (const enemy of enemies) {
            if (
                projectile.x > enemy.x &&
                projectile.x < enemy.x + enemy.width &&
                projectile.y > enemy.y &&
                projectile.y < enemy.y + enemy.height
            ) {
                enemy.health--;
                projectile.hit = true;
            }
        }
    }

    projectiles = projectiles.filter(projectile => !projectile.hit);

    enemies = enemies.filter(enemy => enemy.health > 0);

    for (const enemy of enemies) {
        enemy.x += enemy.vx;

        if (enemy.x > 800 || enemy.x < 400) {
            enemy.vx *= -1;
        }
        if (!enemy.grounded) {
            enemy.vy += enemy.gravityWeight;
        }

        enemy.y += enemy.vy;
        enemy.grounded = false;
        for (const platform of platforms) {
            const enemyBottom = enemy.y + enemy.height;

            const overlapsX =
                enemy.x + enemy.width > platform.x &&
                enemy.x < platform.x + platform.width;

            if (
                overlapsX &&
                enemyBottom >= platform.y &&
                enemyBottom - enemy.vy <= platform.y &&
                enemy.vy > 0
            ) {
                enemy.y = platform.y - enemy.height;
                enemy.vy = 0;
                enemy.grounded = true;
            }
        }
    }

    for (const platform of platforms) {

        const hitboxLeft = player.x + player.hitbox.x;
        const hitboxRight = hitboxLeft + player.hitbox.width;
        const hitboxTop = player.y + player.hitbox.y;
        const hitboxBottom = hitboxTop + player.hitbox.height;

        const previousLeft = previousX + player.hitbox.x;
        const previousRight = previousLeft + player.hitbox.width;
        const previousTop = previousY + player.hitbox.y;
        const previousBottom = previousTop + player.hitbox.height;

        const overlapsX =
            hitboxRight > platform.x &&
            hitboxLeft < platform.x + platform.width;

        const overlapsY =
            hitboxBottom > platform.y &&
            hitboxTop < platform.y + platform.height;

        if (!overlapsX || !overlapsY) continue;

        const wasAbove = previousBottom <= platform.y;
        const wasBelow = previousTop >= platform.y + platform.height;
        const wasLeft = previousRight <= platform.x;
        const wasRight = previousLeft >= platform.x + platform.width;

        if (wasAbove && player.vy > 0) {
            player.y = platform.y - player.hitbox.y - player.hitbox.height;
            player.vy = 0;
            player.grounded = true;
        }
        else if (wasBelow && player.vy < 0) {
            player.y = platform.y + platform.height - player.hitbox.y;
            player.vy = 0;
        }
        else if (wasLeft && player.vx > 0) {
            player.x = platform.x - player.hitbox.x - player.hitbox.width;
            player.vx = 0;
        }
        else if (wasRight && player.vx < 0) {
            player.x = platform.x + platform.width - player.hitbox.x;
            player.vx = 0;
        }
    }

    if (damageCooldown > 0) {
        damageCooldown -= 1 / 60;
    }

    for (const enemy of enemies) {
        if (
            player.x + player.hitbox.x < enemy.x + enemy.width &&
            player.x + player.hitbox.x + player.hitbox.width > enemy.x &&
            player.y + player.hitbox.y < enemy.y + enemy.height &&
            player.y + player.hitbox.y + player.hitbox.height > enemy.y &&
            damageCooldown <= 0
        ) {
            player.health--;
            if (player.health <= 0) {
                gameOver = true;
                aiming = false;
                selectedFinger = null;
            }
            damageCooldown = 1;
        }
    }

    if (player.x < 0) {
        player.x = 0;
    }
    if (player.x + player.hitbox > canvas.width) {
        player.x = canvas.width - player.hitbox;
    }
    if (player.y < 0){
        player.y = 0;
    }
    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
        player.vy = 0;
        player.grounded = true;
    }

    drawPlayer();

    requestAnimationFrame(gameLoop);
}


gameLoop();
