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

let animationTime = 0;
let currentStretch = 1;


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
    }
};

const platforms = [
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
        
        
        ctx.save();

        if (player.facing === -1) {
            ctx.scale(-1,1);
            ctx.drawImage(
                playerImage,
                -player.x - player.width,
                player.y + player.height - player.height * currentStretch,
                player.width,
                player.height * currentStretch
            );
        } else {
            ctx.drawImage(
                playerImage,
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

}

drawPlayer();

const keys = {};

document.addEventListener("keydown", function(event) {
    keys[event.key] = true;

    if (event.key === "ArrowUp" || event.key === "w") {
        if (player.grounded || coyoteTime > 0) {
            player.vy = -8;
            player.grounded = false;
            coyoteTime = 0;
        }
    }
});

document.addEventListener("keyup", function(event) {
    keys[event.key] = false;
});

function gravity() {
    if (!player.grounded) {
        if (player.y + player.hitbox.y + player.hitbox.height < canvas.height) {
            player.vy += player.gravityWeight;
        }
    }
}

function gameLoop() {
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

    const previousX = player.x;
    const previousY = player.y;
    
    player.x += player.vx;
    player.y += player.vy;

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

    if (player.x < 0) {
        player.x = 0;
    }
    if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
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
