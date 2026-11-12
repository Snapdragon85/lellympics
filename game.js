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
const bossImage = new Image();
bossImage.src = "sprites/evilell.png";
const bossLaughSound = new Audio("sounds/boss_laugh.mp3");
const jumpSound = new Audio("sounds/jump.mp3");
const shootSound = new Audio("sounds/shoot.mp3");


const handImages = [];

for (let i = 0; i <= 5; i++) {
    const img = new Image();
    img.src = i === 0
        ? "sprites/hand.png"
        : `sprites/hand_${i}.png`;

    handImages.push(img);
}

let gameStarted = false;

let projectiles = [];
let shotCooldown = 5;

let damageCooldown = 0;
let gameOver = false;
let gameWon = false;

let animationTime = 0;
let currentStretch = 1;

let aiming = false;
let selectedFinger = null;

let currentRoom = 0;
let transitioning = false;
let transitionProgress = 0;
let nextRoom = 0;

let bossAttack = null;
let bossAttackPhase = "idle";
let bossAttackTimer = 0;
let lastBossAttack = null;

let bossDamageCooldown = 0;
let bossLaughTimer = 0;

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
    },
    {
        platforms: [
            { x: 0, y: 500, width: 1000, height: 110 },
            { x: 150, y: 400, width: 200, height: 20 },
            { x: 650, y: 400, width: 200, height: 20 },
            { x: 400, y: 300, width: 200, height: 20}
        ],
        enemies: [
            {
                x: 700,
                y: 350,
                width: 255,
                height: 150,
                health: 20,
                vx: 0,
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
    if (!gameStarted) {
        ctx.fillStyle = "#080d20";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.textAlign = "center";

        ctx.shadowColor = "#00ffff";
        ctx.shadowBlur = 25;
        ctx.fillStyle = "#00ffff";
        ctx.font = "bold 80px Arial";
        ctx.fillText("LELL-WORLD", canvas.width / 2, 250);
        ctx.font = "bold 20px Arial"
        ctx.fillText("REVENGE OF THE THIRD QUADRANT", canvas.width / 2, 290);

        ctx.shadowBlur = 0;
        ctx.fillStyle = "white";
        ctx.font = "28px Arial";
        ctx.fillText("Press ENTER to Play", canvas.width / 2, 370);

        return;
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
        if (currentRoom === 2 && enemy === enemies[0]) {
            if (bossImage.complete && bossImage.naturalWidth > 0) {
                ctx.drawImage(
                    bossImage,
                    enemy.x,
                    enemy.y,
                    255,
                    150
                );
            }
        } else {
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
        

    }
    if (currentRoom === 2 && bossAttack === "sin" && bossAttackPhase === "active") {
        ctx.save();

        ctx.strokeStyle = "#22ffff";
        ctx.lineWidth = 5;
        ctx.shadowColor = "#22ffff";
        ctx.shadowBlur = 20;

        ctx.beginPath();

        for (let x = 0; x <= canvas.width; x += 5) {
            const y = 300 - Math.sin(x * 0.03) * 100;

            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        
        ctx.stroke();
        ctx.restore();
    }
    if (
        currentRoom === 2 &&
        bossAttack === "sin" &&
        bossAttackPhase === "warning"
    ) {
        ctx.save();

        ctx.strokeStyle = "#22ffff";
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 10]);

        ctx.globalAlpha = Math.sin(Date.now() * 0.015) > 0 ? 1 : 0.2;

        ctx.strokeRect(0, 200, canvas.width, 200);

        ctx.restore();
    }
    if (
        currentRoom === 2 &&
        bossAttack === "tan" &&
        bossAttackPhase === "warning"
    ) {
        ctx.save();

        ctx.strokeStyle = "#ffcc33";
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 10]);
        ctx.globalAlpha = Math.sin(Date.now() * 0.015) > 0 ? 1 : 0.2;

        ctx.strokeRect(50, 0, 200, canvas.height);
        ctx.strokeRect(400, 0, 200, canvas.height);
        ctx.strokeRect(750, 0, 200, canvas.height);

        ctx.restore();
    }
    if (
        currentRoom === 2 &&
        bossAttack === "tan" &&
        bossAttackPhase === "active"
    ) {
        ctx.save();

        ctx.strokeStyle = "#ffcc33";
        ctx.lineWidth = 5;
        ctx.shadowColor = "#ffcc33";
        ctx.shadowBlur = 20;

        const centers = [150, 500, 850];

        for (const center of centers) {
            ctx.save();

            ctx.beginPath();
            ctx.rect(center - 100, 0, 200, canvas.height);
            ctx.clip();

            ctx.beginPath();

            for (let x = center - 99; x <= center + 99; x += 1) {
                const y = 300 - Math.tan((x - center) * Math.PI / 200) * 100;

                if (x === center - 99) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }

            ctx.stroke();
            ctx.restore();
        }

        ctx.restore();
    }
    if (
        currentRoom === 2 &&
        bossAttack === "csc" &&
        bossAttackPhase === "warning"
    ) {
        ctx.save();

        ctx.strokeStyle = "#bb66ff";
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 10]);
        ctx.globalAlpha = Math.sin(Date.now() * 0.015) > 0 ? 1 : 0.2;

        ctx.strokeRect(0, 0, canvas.width, 120);
        ctx.strokeRect(0, canvas.height - 120, canvas.width, 120);

        ctx.restore();
    }
    if (
        currentRoom === 2 &&
        bossAttack === "csc" &&
        bossAttackPhase === "active"
    ) {
        ctx.save();
        ctx.strokeStyle = "#bb66ff";
        ctx.lineWidth = 5;
        ctx.shadowColor = "#bb66ff";
        ctx.shadowBlur = 20;

        ctx.beginPath();
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.clip();

        ctx.beginPath();

        let drawing = false;

        for (let x = 0; x <= canvas.width; x += 1) {
            const sinValue = Math.sin((x - 100) * 0.05);

            // Cosecant is undefined where sine is zero
            if (Math.abs(sinValue) < 0.56) {
                drawing = false;
                continue;
            }

            const y = 300 - (180 / sinValue);

            if (!drawing) {
                ctx.moveTo(x, y);
                drawing = true;
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();
        ctx.restore();
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

    ctx.fillStyle = "#333333";
    ctx.fillRect(20, 65, 150, 10);

    const cooldownProgress = Math.max(
        0,
        Math.min(1, 1 - shotCooldown / 0.5)
    );

    ctx.fillStyle = "#22ffff";
    ctx.fillRect(
        20,
        65,
        150 * cooldownProgress,
        10
    );
    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.textAlign = "left";
    ctx.fillText("SHOT READY", 20, 60);

    ctx.strokeStyle = "white";
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 65, 150, 10);

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
    if (currentRoom === 2 && enemies.length > 0) {
        const boss = enemies[0];

        // Background
        ctx.fillStyle = "#333333";
        ctx.fillRect(250, 25, 500, 20);

        // Health
        ctx.fillStyle = "#ff3333";
        ctx.fillRect(
            250,
            25,
            500 * (boss.health / 20),
            20
        );

        // Border
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.strokeRect(250, 25, 500, 20);

        // Label
        ctx.fillStyle = "white";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText("BOSS", 500, 17);
    }
    if (gameWon) {
        ctx.fillStyle = "white";
        ctx.font = "60px Arial";
        ctx.textAlign = "center";
        ctx.fillText("YOU WIN!", canvas.width / 2, canvas.height / 2);
    }
    if (currentRoom === 0) {
        ctx.save();

        ctx.fillStyle = "white";
        ctx.font = "24px Arial";
        ctx.textAlign = "center";
        ctx.shadowColor = "#00ffff";
        ctx.shadowBlur = 12;

        ctx.fillText("Press R to shoot", canvas.width / 2, 100);

        ctx.restore();
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
            jumpSound.currentTime = 0;
            jumpSound.play();
        }
    }
    if (event.code === "KeyR" && !aiming && shotCooldown <= 0) {
        aiming = true;
        selectedFinger = null;
    }
    if (aiming && ["1", "2", "3", "4", "5"].includes(event.key)) {
        selectedFinger = Number(event.key);
    }
    if (event.code === "Enter" && !gameStarted) {
        gameStarted = true;
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
            shootSound.currentTime = 0;
            shootSound.play();
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

function chooseBossAttack() {
    const attacks = ["sin", "tan", "csc"];

    const availableAttacks = attacks.filter(
        attack => attack !== lastBossAttack
    );

    bossAttack = availableAttacks[
        Math.floor(Math.random() * availableAttacks.length)
    ];

    lastBossAttack = bossAttack;
    bossAttackPhase = "warning";
    bossAttackTimer = 0;
}


function gameLoop() {
    if (currentRoom === 2) {
        console.log("Attack:", bossAttack, "Phase:", bossAttackPhase);
    }
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
    if (currentRoom === 2 && enemies.length > 0) {
    bossAttackTimer += 1 / 60;

    if (bossAttackPhase === "idle" && bossAttackTimer >= 2) {
            chooseBossAttack();
        }

        else if (bossAttackPhase === "warning" && bossAttackTimer >= 1) {
            bossAttackPhase = "active";
            bossAttackTimer = 0;
        }

        else if (bossAttackPhase === "active" && bossAttackTimer >= 2) {
            bossAttackPhase = "recovery";
            bossAttackTimer = 0;
        }

        else if (bossAttackPhase === "recovery" && bossAttackTimer >= 1) {
            bossAttackPhase = "idle";
            bossAttack = null;
            bossAttackTimer = 0;
        }
    }
    if (
        currentRoom === 2 &&
        bossAttack === "sin" &&
        bossAttackPhase === "active" &&
        bossDamageCooldown <= 0
    ) {
        const playerCenterX =
            player.x + player.hitbox.x + player.hitbox.width / 2;

        const playerCenterY =
            player.y + player.hitbox.y + player.hitbox.height / 2;

        const waveY = 300 - Math.sin(playerCenterX * 0.01) * 100;

        if (Math.abs(playerCenterY - waveY) < 45) {
            player.health -= 2;
            bossDamageCooldown = 1;
        }
    }
    if (
        currentRoom === 2 &&
        bossAttack === "tan" &&
        bossAttackPhase === "active" &&
        bossDamageCooldown <= 0
    ) {
        const playerCenterX =
            player.x + player.hitbox.x + player.hitbox.width / 2;

        const playerCenterY =
            player.y + player.hitbox.y + player.hitbox.height / 2;

        const centers = [150, 500, 850];

        for (const center of centers) {
            if (Math.abs(playerCenterX - center) < 100) {
                const graphY =
                    300 - Math.tan((playerCenterX - center) * Math.PI / 200) * 100;

                if (Math.abs(playerCenterY - graphY) < 45) {
                    player.health -= 2;
                    bossDamageCooldown = 1;
                    break;
                }
            }
        }
    }
    if (
        currentRoom === 2 &&
        bossAttack === "csc" &&
        bossAttackPhase === "active" &&
        bossDamageCooldown <= 0
    ) {
        const playerCenterX =
            player.x + player.hitbox.x + player.hitbox.width / 2;
        const playerCenterY =
            player.y + player.hitbox.y + player.hitbox.height / 2;

        const sinValue = Math.sin((playerCenterX - 100) * 0.015);

        if (Math.abs(sinValue) >= 0.56) {
            const graphY = 300 - (180 / sinValue);

            if (
                graphY >= 0 &&
                graphY <= canvas.height &&
                Math.abs(playerCenterY - graphY) < 45
            ) {
                player.health -= 2;
                bossDamageCooldown = 1;
            }
        }
    }
    if (currentRoom === 2) {
        bossLaughTimer += 1 / 60;

        if (bossLaughTimer >= 10) {
            bossLaughSound.play();
            bossLaughTimer = 0;
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
                if (currentRoom === 2 && enemy.health <= 0) {
                    gameWon = true;
                }
            }
        }
    }

    projectiles = projectiles.filter(projectile => !projectile.hit);

    enemies = enemies.filter(enemy => enemy.health > 0);

    for (const enemy of enemies) {
        if (currentRoom === 2 && enemy === enemies[0]) {
            let targetX = 700;
            let targetY = 350;

            if (bossAttack === "sin") {
                targetX = 650;
                targetY = 200;
            }
            else if (bossAttack === "tan") {
                targetX = 450;
                targetY = 50;
            }
            else if (bossAttack === "csc") {
                targetX = 450;
                targetY = -200;
            }

            enemy.x += (targetX - enemy.x) * 0.04;
            enemy.y += (targetY - enemy.y) * 0.04;

            continue;
        }
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
    if (bossDamageCooldown > 0) {
        bossDamageCooldown -= 1 / 60;
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
