const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");


function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();

window.addEventListener("resize", resizeCanvas);
ctx.imageSmoothingEnabled = false;
const playerImage = new Image();
playerImage.src = "sprites/player.png";
const backgroundImage = new Image();
backgroundImage.src = "sprites/background.jpg";

let coyoteTime = 0;
const coyoteDuration = 0.15;

const player = {
    x: 50,
    y: 50,
    width: 60,
    height: 60,
    vx: 0,
    vy: 0,
    grounded: false,
    gravityWeight: 0.3
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
        y: (canvas.height - 10),
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
        ctx.drawImage(
            playerImage,
            player.x,
            player.y,
            player.width,
            player.height
        );
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
        if (player.y < canvas.height - player.height) {
            player .vy += player.gravityWeight;
        }
    }
}

function gameLoop() {
    if (player.grounded) {
        coyoteTime = coyoteDuration;
    } else {
        coyoteTime -= 1 / 60;
    }
    player.grounded = false;
    gravity();

    if (keys["ArrowRight"] || keys["d"]) {
        player.vx = 8;
    }

    if (keys["ArrowLeft"] || keys["a"]) {
        player.vx = -8;
    }

    if (keys["ArrowDown"] || keys["s"]) {
        player.vy += 1;
    }
    if (!keys["ArrowRight"] && !keys["ArrowLeft"]) {
        player.vx *= 0.85;
    }

    const previousY = player.y;
    
    player.x += player.vx;
    player.y += player.vy;

    for (const platform of platforms) {
        if (
            previousY + player.height <= platform.y &&
            player.y + player.height >= platform.y &&
            player.vy > 0 &&
            player.x + player.width > platform.x &&
            player.x < platform.x + platform.width
        ) {
            player.y = platform.y - player.height;
            player.vy = 0;
            player.grounded = true;
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
