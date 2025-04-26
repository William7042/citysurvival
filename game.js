
//Game timer
let gameTimer = {
    totalTime: 120, //2 minutes in seconds
    timeRemaining: 120,
    lastUpdateTime: Date.now(),
    gameOver: false,
    
    update: function() {
        const currentTime = Date.now();
        const deltaTime = (currentTime - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = currentTime;
        
        if (!this.gameOver) {
            this.timeRemaining -= deltaTime;
            
            if (this.timeRemaining <= 0) {
                this.timeRemaining = 0;
                this.gameOver = true;
                // Store the money before redirecting
                localStorage.setItem('playerMoney', money);
                console.log("Game time is up!");
                window.location.href = 'update.html';
            }
        }
    },
    draw: function() {
        //Draw timer background
        ctx.fillStyle = 'rgba(10, 10, 24, 0.8)';
        ctx.fillRect(canvas.width / 2 - 100, 10, 200, 40);
        
        //Draw timer border
        ctx.strokeStyle = 'rgba(0, 194, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(canvas.width / 2 - 100, 10, 200, 40);
        
        //calculate minutes and seconds
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = Math.floor(this.timeRemaining % 60);
        
        //Format time as MM:SS
        const timeString = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        
        //Draw timer text with pulsing effect for last 30 seconds
        if (this.timeRemaining <= 30) {
            const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 200);
            ctx.fillStyle = `rgba(255, 51, 102, ${pulse})`;
        } else {
            ctx.fillStyle = '#00c2ff';
        }
        
        ctx.font = 'bold 24px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText(timeString, canvas.width / 2, 37);
    }
};//game setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const moneyCounter = document.getElementById('moneyCounter');

//set canvas to window size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
//after the npcImages declarations, add:
const playerSprites = {
    standing: new Image(),
    running: new Image(),
    facing:'right'
};

//load player sprites
playerSprites.standing.src = 'stand.gif';
playerSprites.running.src = 'running.gif';

//game state variables
let money = 0;
let dialogOpen = false;
let currentNPC = null;
let currentDialogText = "";
let currentTask = null;
let tasksCompleted = 0;
let minigameActive = false;
let currentMinigame = null;
let mouseX = 0;
let mouseY = 0;

//camera position
const camera = {
    x: 0
};

//world bounds
const worldBounds = {
    min: -10000,
    max: 10000
};

//player object
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height * 0.75-75,
    width: 125,
    height: 200,
    speed: 5,
    facingRight: true,
    walkCycle: 0,
    walkSpeed: 0.2,
    jumping: false,
    jumpVelocity: 0,
    jumpStrength: -15,
    gravity: 0.8,
    onGround: true,
    floorY: canvas.height * 0.75 - 75
};

//load city 
const cityLayers = [];
for (let i = 1; i <= 11; i++) {
    const img = new Image();
    img.src = `${i}.png`;
    cityLayers.push({
        img: img,
        speed: 0.1 + (i * 0.02),
        y: 0,
        height: canvas.height
    });
}

//MINIGAMESSS_________________________________________

//mechanic: among us wires
const wireRepairGame = {
    wires: [],
    targets: [],
    connections: [],
    connectedWires: 0,
    totalWires: 5,
    selectedWire: null,
    completed: false,
    success: false,
    
    init: function() {
        this.wires = [];
        this.targets = [];
        this.connections = [];
        this.connectedWires = 0;
        this.selectedWire = null;
        this.completed = false;
        this.success = false;
        
        const colors = ['#ff3366', '#00ffaa', '#4488ff', '#ffaa00', '#ff00b3'];
        const startY = canvas.height * 0.3;
        
        for (let i = 0; i < this.totalWires; i++) {
            this.wires.push({
                x: canvas.width * 0.3,
                y: startY + (i * 50),
                color: colors[i],
                connected: false,
                id: i
            });
            
            this.targets.push({
                x: canvas.width * 0.7,
                y: startY + (Math.random() * (this.totalWires - 1) * 50),
                color: colors[i],
                connected: false,
                id: i
            });
        }
    },
    
    handleClick: function(x, y) {
        if (this.completed) {
            if (x >= canvas.width * 0.4 && x <= canvas.width * 0.6 &&
                y >= canvas.height * 0.75 && y <= canvas.height * 0.75 + 40) {
                console.log("Wire repair continue clicked");
                return true;
            }
            return false;
        }
        
        for (const wire of this.wires) {
            if (!wire.connected && 
                x >= wire.x - 20 && x <= wire.x + 20 &&
                y >= wire.y - 10 && y <= wire.y + 10) {
                this.selectedWire = wire;
                return false;
            }
        }
        
        if (this.selectedWire) {
            for (const target of this.targets) {
                if (!target.connected &&
                    x >= target.x - 20 && x <= target.x + 20 &&
                    y >= target.y - 10 && y <= target.y + 10) {
                    
                    if (this.selectedWire.id === target.id) {
                        this.connections.push({
                            wireX: this.selectedWire.x,
                            wireY: this.selectedWire.y,
                            targetX: target.x,
                            targetY: target.y,
                            color: this.selectedWire.color
                        });
                        
                        this.selectedWire.connected = true;
                        target.connected = true;
                        this.connectedWires++;
                        
                        if (this.connectedWires >= this.totalWires) {
                            this.completed = true;
                            this.success = true;
                        }
                    }
                    
                    this.selectedWire = null;
                    return false;
                }
            }
            
            this.selectedWire = null;
        }
        
        return false;
    },
    
    draw: function() {
        //background panel
        ctx.fillStyle = 'rgba(10, 10, 24, 0.9)';
        ctx.fillRect(canvas.width * 0.2, canvas.height * 0.2, canvas.width * 0.6, canvas.height * 0.6);
        
        //border
        ctx.strokeStyle = 'rgba(0, 194, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(canvas.width * 0.2, canvas.height * 0.2, canvas.width * 0.6, canvas.height * 0.6);
        
        //inner glow
        const gradient = ctx.createLinearGradient(
            canvas.width * 0.2, canvas.height * 0.2, 
            canvas.width * 0.8, canvas.height * 0.8
        );
        gradient.addColorStop(0, "rgba(0, 194, 255, 0.1)");
        gradient.addColorStop(0.5, "rgba(123, 0, 255, 0.05)");
        gradient.addColorStop(1, "rgba(255, 0, 179, 0.1)");
        ctx.fillStyle = gradient;
        ctx.fillRect(canvas.width * 0.205, canvas.height * 0.205, canvas.width * 0.59, canvas.height * 0.59);
        
        //title
        ctx.fillStyle = '#00c2ff';
        ctx.font = 'bold 28px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText("Repair the Hover-Car Wiring System", canvas.width * 0.5, canvas.height * 0.25);
        
        //instructions
        ctx.fillStyle = '#e0e0ff';
        ctx.font = '16px "Exo 2"';
        ctx.fillText("Connect the matching colored wires", canvas.width * 0.5, canvas.height * 0.28);
        
        //connections
        ctx.lineWidth = 5;
        for (const conn of this.connections) {
            //glow effect
            ctx.shadowBlur = 10;
            ctx.shadowColor = conn.color;
            
            ctx.strokeStyle = conn.color;
            ctx.beginPath();
            ctx.moveTo(conn.wireX, conn.wireY);
            ctx.lineTo(conn.targetX, conn.targetY);
            ctx.stroke();
            
            //reset shadow
            ctx.shadowBlur = 0;
        }

        //wires
        for (const wire of this.wires) {
            //glow effect
            ctx.shadowBlur = wire === this.selectedWire ? 15 : 5;
            ctx.shadowColor = wire.color;
            
            ctx.fillStyle = wire.color;
            ctx.fillRect(wire.x - 20, wire.y - 5, 40, 10);
            
            if (wire === this.selectedWire) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.strokeRect(wire.x - 22, wire.y - 7, 44, 14);
            }
            
            //reset shadow
            ctx.shadowBlur = 0;
        }
        
        //targets
        for (const target of this.targets) {
            //glow effect
            ctx.shadowBlur = 5;
            ctx.shadowColor = target.color;
            
            ctx.fillStyle = target.color;
            ctx.fillRect(target.x - 20, target.y - 5, 40, 10);
            
            //reset shadow
            ctx.shadowBlur = 0;
        }
        
        if (this.completed) {
            //completion panel
            ctx.fillStyle = 'rgba(10, 10, 24, 0.9)';
            ctx.fillRect(canvas.width * 0.3, canvas.height * 0.4, canvas.width * 0.4, canvas.height * 0.2);
            
            //panel border
            ctx.strokeStyle = this.success ? 'rgba(0, 255, 170, 0.8)' : 'rgba(255, 51, 102, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(canvas.width * 0.3, canvas.height * 0.4, canvas.width * 0.4, canvas.height * 0.2);
            
            //completion message
            ctx.fillStyle = this.success ? '#00ffaa' : '#ff3366';
            ctx.font = 'bold 24px Orbitron';
            ctx.fillText(
                this.success ? "Wiring System Repaired!" : "System Malfunction!",
                canvas.width * 0.5, 
                canvas.height * 0.5
            );
            
            //continue button
            ctx.fillStyle = 'rgba(0, 194, 255, 0.3)';
            ctx.fillRect(canvas.width * 0.4, canvas.height * 0.75, canvas.width * 0.2, 40);
            
            ctx.strokeStyle = 'rgba(0, 194, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(canvas.width * 0.4, canvas.height * 0.75, canvas.width * 0.2, 40);
            
            ctx.fillStyle = '#e0e0ff';
            ctx.font = '18px Orbitron';
            ctx.fillText("Continue", canvas.width * 0.5, canvas.height * 0.75 + 25);
        }
    }
};

//hacker: code breaking game
const codeBreakingGame = {
    code: [],
    guess: [],
    attempts: 0,
    maxAttempts: 8,
    feedback: [],
    colors: ['#ff3366', '#00ffaa', '#4488ff', '#ffaa00', '#ff00b3', '#7b00ff'],
    codeLength: 4,
    completed: false,
    success: false,
    
    init: function() {
        this.code = [];
        this.guess = [];
        this.attempts = 0;
        this.feedback = [];
        this.completed = false;
        this.success = false;
        
        for (let i = 0; i < this.codeLength; i++) {
            this.code.push(Math.floor(Math.random() * this.colors.length));
            this.guess.push(0);
        }
        
        for (let i = 0; i < this.maxAttempts; i++) {
            this.feedback.push({
                guess: Array(this.codeLength).fill(0),
                correct: 0,
                wrongPosition: 0
            });
        }
    },
    
    handleClick: function(x, y) {
        if (this.completed) {
            if (x >= canvas.width * 0.4 && x <= canvas.width * 0.6 &&
                y >= canvas.height * 0.8 && y <= canvas.height * 0.8 + 40) {
                return true;
            }
            return false;
        }
        
        const selectorY = canvas.height * 0.7;
        const width = canvas.width * 0.6 / this.colors.length;
        
        for (let i = 0; i < this.colors.length; i++) {
            const selectorX = canvas.width * 0.2 + (i * width);
            
            if (x >= selectorX && x <= selectorX + width &&
                y >= selectorY && y <= selectorY + 30) {
                
                const activeSlot = this.guess.findIndex(g => g === -1);
                
                if (activeSlot >= 0) {
                    this.guess[activeSlot] = i;
                }
                
                return false;
            }
        }
        
        const slotY = canvas.height * 0.6;
        const slotWidth = canvas.width * 0.4 / this.codeLength;
        
        for (let i = 0; i < this.codeLength; i++) {
            const slotX = canvas.width * 0.3 + (i * slotWidth);
            
            if (x >= slotX && x <= slotX + slotWidth - 10 &&
                y >= slotY && y <= slotY + 30) {
                
                for (let j = 0; j < this.guess.length; j++) {
                    if (this.guess[j] === -1) {
                        this.guess[j] = 0;
                    }
                }
                
                this.guess[i] = -1;
                return false;
            }
        }
        
        if (x >= canvas.width * 0.7 && x <= canvas.width * 0.8 &&
            y >= canvas.height * 0.6 && y <= canvas.height * 0.6 + 30) {
            
            if (this.guess.indexOf(-1) === -1) {
                this.submitGuess();
            }
            
            return false;
        }
        
        return false;
    },
    
    submitGuess: function() {
        let correct = 0;
        let wrongPosition = 0;
        
        const codeCopy = [...this.code];
        const guessCopy = [...this.guess];
        
        for (let i = 0; i < this.codeLength; i++) {
            if (guessCopy[i] === codeCopy[i]) {
                correct++;
                codeCopy[i] = -1;
                guessCopy[i] = -2;
            }
        }
        
        for (let i = 0; i < this.codeLength; i++) {
            if (guessCopy[i] >= 0) {
                const colorIndex = codeCopy.indexOf(guessCopy[i]);
                if (colorIndex !== -1) {
                    wrongPosition++;
                    codeCopy[colorIndex] = -1;
                }
            }
        }
        
        this.feedback[this.attempts] = {
            guess: [...this.guess],
            correct: correct,
            wrongPosition: wrongPosition
        };
        
        this.attempts++;
        
        if (correct === this.codeLength) {
            this.completed = true;
            this.success = true;
        } else if (this.attempts >= this.maxAttempts) {
            this.completed = true;
            this.success = false;
        }
    },
    
    draw: function() {
        //background panel
        ctx.fillStyle = 'rgba(10, 10, 24, 0.9)';
        ctx.fillRect(canvas.width * 0.2, canvas.height * 0.2, canvas.width * 0.6, canvas.height * 0.6);
        
        //border
        ctx.strokeStyle = 'rgba(0, 255, 170, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(canvas.width * 0.2, canvas.height * 0.2, canvas.width * 0.6, canvas.height * 0.6);
        
        //inner glow
        const gradient = ctx.createLinearGradient(
            canvas.width * 0.2, canvas.height * 0.2, 
            canvas.width * 0.8, canvas.height * 0.8
        );
        gradient.addColorStop(0, "rgba(0, 255, 170, 0.1)");
        gradient.addColorStop(0.5, "rgba(123, 0, 255, 0.05)");
        gradient.addColorStop(1, "rgba(255, 0, 179, 0.1)");
        ctx.fillStyle = gradient;
        ctx.fillRect(canvas.width * 0.205, canvas.height * 0.205, canvas.width * 0.59, canvas.height * 0.59);
        
        //title
        ctx.fillStyle = '#00ffaa';
        ctx.font = 'bold 28px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText("Hack the Mainframe Security System", canvas.width * 0.5, canvas.height * 0.25);
        
        //instructions
        ctx.fillStyle = '#e0e0ff';
        ctx.font = 'bold 14px Orbitron';
        ctx.fillText("Guess the security code. Green dots = correct position, Yellow dots = wrong position", canvas.width * 0.5, canvas.height * 0.28);
        
        //previous guesses
        for (let i = 0; i < this.attempts; i++) {
            const y = canvas.height * 0.32 + (i * 30);
            
            //draw guess cells
            for (let j = 0; j < this.codeLength; j++) {
                const x = canvas.width * 0.3 + (j * 40);
                
                //glow effect
                ctx.shadowBlur = 5;
                ctx.shadowColor = this.colors[this.feedback[i].guess[j]];
                
                ctx.fillStyle = this.colors[this.feedback[i].guess[j]];
                ctx.fillRect(x, y, 30, 20);
                
                //reset shadow
                ctx.shadowBlur = 0;
            }
            
            //draw feedback indicators
            for (let j = 0; j < this.feedback[i].correct; j++) {
                //green dots for correct position
                ctx.fillStyle = '#00ffaa';
                ctx.beginPath();
                ctx.arc(canvas.width * 0.6 + (j * 15), y + 10, 5, 0, Math.PI * 2);
                ctx.fill();
                
                //glow effect
                ctx.shadowBlur = 5;
                ctx.shadowColor = '#00ffaa';
                ctx.strokeStyle = '#00ffaa';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
            
            for (let j = 0; j < this.feedback[i].wrongPosition; j++) {
                //yellow dots for wrong position
                ctx.fillStyle = '#ffaa00';
                ctx.beginPath();
                ctx.arc(canvas.width * 0.6 + ((this.feedback[i].correct + j) * 15), y + 10, 5, 0, Math.PI * 2);
                ctx.fill();
                
                //glow effect
                ctx.shadowBlur = 5;
                ctx.shadowColor = '#ffaa00';
                ctx.strokeStyle = '#ffaa00';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        }
        
        //draw current guess slots
        const slotY = canvas.height * 0.6;
        const slotWidth = canvas.width * 0.4 / this.codeLength;
        
        for (let i = 0; i < this.codeLength; i++) {
            const slotX = canvas.width * 0.3 + (i * slotWidth);
            
            //slot background
            ctx.fillStyle = this.guess[i] === -1 ? 'rgba(255, 255, 255, 0.2)' : 'rgba(40, 40, 70, 0.6)';
            ctx.fillRect(slotX, slotY, slotWidth - 10, 30);
            
            //slot border
            ctx.strokeStyle = this.guess[i] === -1 ? '#ffffff' : 'rgba(0, 194, 255, 0.5)';
            ctx.lineWidth = this.guess[i] === -1 ? 2 : 1;
            ctx.strokeRect(slotX, slotY, slotWidth - 10, 30);
            
            //selected color
            if (this.guess[i] >= 0) {
                //glow effect
                ctx.shadowBlur = 5;
                ctx.shadowColor = this.colors[this.guess[i]];
                
                ctx.fillStyle = this.colors[this.guess[i]];
                ctx.fillRect(slotX + 5, slotY + 5, slotWidth - 20, 20);
                
                //reset shadow
                ctx.shadowBlur = 0;
            }
        }
        
        //submit button
        ctx.fillStyle = 'rgba(0, 255, 170, 0.3)';
        ctx.fillRect(canvas.width * 0.7, canvas.height * 0.6, 140, 30);
        
        ctx.strokeStyle = 'rgba(0, 255, 170, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(canvas.width * 0.7, canvas.height * 0.6, 140, 30);
        
        ctx.fillStyle = '#e0e0ff';
        ctx.font = '16px Orbitron';
        ctx.fillText("Submit", canvas.width * 0.75, canvas.height * 0.6 + 20);
        
        //color selectors
        const selectorY = canvas.height * 0.7;
        const width = canvas.width * 0.6 / this.colors.length;
        
        for (let i = 0; i < this.colors.length; i++) {
            const selectorX = canvas.width * 0.2 + (i * width);
            
            //glow effect
            ctx.shadowBlur = 5;
            ctx.shadowColor = this.colors[i];
            
            ctx.fillStyle = this.colors[i];
            ctx.fillRect(selectorX, selectorY, width, 30);
            
            //reset shadow
            ctx.shadowBlur = 0;
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.strokeRect(selectorX, selectorY, width, 30);
        }
        
        if (this.completed) {
            //completion panel
            ctx.fillStyle = 'rgba(10, 10, 24, 0.9)';
            ctx.fillRect(canvas.width * 0.3, canvas.height * 0.4, canvas.width * 0.4, canvas.height * 0.2);
            
            //panel border
            ctx.strokeStyle = this.success ? 'rgba(0, 255, 170, 0.8)' : 'rgba(255, 51, 102, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(canvas.width * 0.3, canvas.height * 0.4, canvas.width * 0.4, canvas.height * 0.2);
            
            //completion message
            ctx.fillStyle = this.success ? '#00ffaa' : '#ff3366';
            ctx.font = 'bold 24px Orbitron';
            ctx.fillText(
                this.success ? "Access Granted!" : "Access Denied", 
                canvas.width * 0.5, 
                canvas.height * 0.5
            );
            
            if (!this.success) {
                ctx.fillStyle = '#e0e0ff';
                ctx.font = 'bold 22px Orbitron';
                ctx.fillText("The correct code was:", canvas.width * 0.5, canvas.height * 0.55);
                
                for (let i = 0; i < this.codeLength; i++) {
                    const x = canvas.width * 0.4 + (i * 40);
                    
                    //glow effect
                    ctx.shadowBlur = 5;
                    ctx.shadowColor = this.colors[this.code[i]];
                    
                    ctx.fillStyle = this.colors[this.code[i]];
                    ctx.fillRect(x, canvas.height * 0.58, 30, 20);
                    
                    //reset shadow
                    ctx.shadowBlur = 0;
                }
            }
            
            //continue button
            ctx.fillStyle = 'rgba(0, 194, 255, 0.3)';
            ctx.fillRect(canvas.width * 0.4, canvas.height * 0.8, canvas.width * 0.2, 40);
            
            ctx.strokeStyle = 'rgba(0, 194, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(canvas.width * 0.4, canvas.height * 0.8, canvas.width * 0.2, 40);
            
            ctx.fillStyle = '#e0e0ff';
            ctx.font = '18px Orbitron';
            ctx.fillText("Continue", canvas.width * 0.5, canvas.height * 0.8 + 25);
        }
    }
};

//vendor: package fitting game
const packageFittingGame = {
    grid: [],
    packages: [],
    gridWidth: 6,
    gridHeight: 6,
    cellSize: 40,
    draggedPackage: null,
    packageHover: null,
    packagePlaced: [],
    solutions: [],  
    completed: false,
    success: false,
    timeLimit: 90,
    timeRemaining: 90,
    lastUpdateTime: 0,
    placedCount: 0,
    totalPieces: 7,
    
    packageShapes: [
        { 
            shape: [
                [1, 0],
                [1, 0],
                [1, 1]
            ],
            color: '#ff3366'
        },
        { 
            shape: [
                [1, 1, 1],
                [0, 1, 0]
            ],
            color: '#00ffaa'
        },
        { 
            shape: [
                [1, 1, 0],
                [0, 1, 1]
            ],
            color: '#4488ff'
        },
        { 
            shape: [
                [1, 1],
                [1, 1]
            ],
            color: '#ffaa00'
        },
        { 
            shape: [
                [1],
                [1],
                [1],
                [1]
            ],
            color: '#7b00ff'
        },
        { 
            shape: [
                [0, 1],
                [0, 1],
                [1, 1]
            ],
            color: '#00c2ff'
        },
        { 
            shape: [
                [0, 1, 1],
                [1, 1, 0]
            ],
            color: '#ff00b3'
        }
    ],
    
    init: function() {
        this.grid = [];
        this.packages = [];
        this.packagePlaced = [];
        this.draggedPackage = null;
        this.packageHover = null;
        this.completed = false;
        this.success = false;
        this.timeRemaining = this.timeLimit;
        this.lastUpdateTime = Date.now();
        

        for (let y = 0; y < this.gridHeight; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                this.grid[y][x] = 0; //0 means empty
            }
        }
        

        const gridX = canvas.width / 2 - (this.gridWidth * this.cellSize) / 2;
        const gridY = canvas.height * 0.35;
        
        for (let i = 0; i < this.packageShapes.length; i++) {
            const packageDef = this.packageShapes[i];
            const width = packageDef.shape[0].length * this.cellSize;
            const height = packageDef.shape.length * this.cellSize;
            

            let x, y;
            if (i < 4) { 
                x = gridX - width - 20 - (i % 2) * (width + 10);
                y = gridY + (Math.floor(i / 2) * (height + 20));
            } else { 
                x = gridX + (this.gridWidth * this.cellSize) + 20 + ((i - 4) % 2) * (width + 10);
                y = gridY + (Math.floor((i - 4) / 2) * (height + 20));
            }
            
            this.packages.push({
                x: x,
                y: y,
                width: width,
                height: height,
                shape: packageDef.shape,
                color: packageDef.color,
                originalX: x,
                originalY: y,
                placed: false
            });
            
            this.packagePlaced.push(false);
        }
    },
    
    canPlacePackage: function(packageObj, gridX, gridY, offsetX, offsetY) {
        //check if a package can be placed at the given grid position
        for (let y = 0; y < packageObj.shape.length; y++) {
            for (let x = 0; x < packageObj.shape[0].length; x++) {
                if (packageObj.shape[y][x]) {
                    const gx = Math.floor((offsetX - gridX) / this.cellSize) + x;
                    const gy = Math.floor((offsetY - gridY) / this.cellSize) + y;
                    
                    //check bounds
                    if (gx < 0 || gx >= this.gridWidth || gy < 0 || gy >= this.gridHeight) {
                        return false;
                    }
                    
                    //check collision
                    if (this.grid[gy][gx]) {
                        return false;
                    }
                }
            }
        }
        return true;
    },
    
    placePackage: function(packageObj, gridX, gridY, offsetX, offsetY) {
        const gx = Math.floor((offsetX - gridX) / this.cellSize);
        const gy = Math.floor((offsetY - gridY) / this.cellSize);
        
        // Update grid with placed package
        for (let y = 0; y < packageObj.shape.length; y++) {
            for (let x = 0; x < packageObj.shape[0].length; x++) {
                if (packageObj.shape[y][x]) {
                    this.grid[gy + y][gx + x] = packageObj.color;
                }
            }
        }
        
        // Update package position
        packageObj.x = gridX + gx * this.cellSize;
        packageObj.y = gridY + gy * this.cellSize;
        packageObj.placed = true;
        
        // Increment counter and check completion
        this.placedCount++;
        console.log(`Placed piece ${this.placedCount} of ${this.totalPieces}`);
        
        // If all pieces placed, complete game immediately
        if (this.placedCount >= this.totalPieces) {
            this.completed = true;
            this.success = true;
            console.log("All pieces placed!");
            return true; // Signal to end minigame
        }
        
        return false;
    },
    
    
    update: function() {
        const currentTime = Date.now();
        const deltaTime = (currentTime - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = currentTime;
        
        if (!this.completed) {
            this.timeRemaining -= deltaTime;
            
            if (this.timeRemaining <= 0) {
                this.timeRemaining = 0;
                this.completed = true;
                //uccess if most packages are placed
                const placedCount = this.packagePlaced.filter(placed => placed).length;
                this.success = placedCount >= 5; //Need at least 5 out of 7 packages
            }
        }
    },
    
    handleMouseDown: function(x, y) {
        if (this.completed) return;
        
        //check if clicking on a package
        for (let i = this.packages.length - 1; i >= 0; i--) {
            const pkg = this.packages[i];
            
            if (!pkg.placed && this.isPointInPackage(x, y, pkg)) {
                this.draggedPackage = pkg;
                
                //Move package to the end of the array to draw it on top
                this.packages.splice(i, 1);
                this.packages.push(pkg);
                
                return;
            }
        }
    },
    
    handleMouseMove: function(x, y) {
        if (this.draggedPackage) {
            //update dragged package position
            this.draggedPackage.x = x - this.draggedPackage.width / 2;
            this.draggedPackage.y = y - this.draggedPackage.height / 2;
            
            //check if package is over the grid
            const gridX = canvas.width / 2 - (this.gridWidth * this.cellSize) / 2;
            const gridY = canvas.height * 0.35;
            
            //Highlight grid cells where package could be placed
            this.packageHover = {
                package: this.draggedPackage,
                valid: this.canPlacePackage(this.draggedPackage, gridX, gridY, x - this.draggedPackage.width / 2, y - this.draggedPackage.height / 2)
            };
        } else {
            this.packageHover = null;
        }
    },
    
    handleMouseUp: function() {
        if (this.draggedPackage) {
            const gridX = canvas.width / 2 - (this.gridWidth * this.cellSize) / 2;
            const gridY = canvas.height * 0.35;
            
            if (this.packageHover && this.packageHover.valid) {
                // Place package on grid and check if game should end
                if (this.placePackage(this.draggedPackage, gridX, gridY, this.draggedPackage.x, this.draggedPackage.y)) {
                    completeMinigame(); // End the minigame immediately
                }
            } else {
                this.draggedPackage.x = this.draggedPackage.originalX;
                this.draggedPackage.y = this.draggedPackage.originalY;
                this.draggedPackage.placed = false;
            }
            
            this.draggedPackage = null;
            this.packageHover = null;
        }
    },
    
    handleClick: function(x, y) {
        if (this.completed) {
            if (x >= canvas.width * 0.4 && x <= canvas.width * 0.6 &&
                y >= canvas.height * 0.8 && y <= canvas.height * 0.8 + 40) {
                console.log("Continue clicked");
                return true; 
            }
        }
        if (x >= canvas.width * 0.8 && x <= canvas.width * 0.8 + 80 &&
            y >= canvas.height * 0.7 && y <= canvas.height * 0.7 + 40) {
            console.log("Quit clicked");
            this.completed = true; 
            this.success = false;
            return true;
        }
        
        return false;
    },
    
    isPointInPackage: function(x, y, pkg) {
        //check if a point is within a package shape
        if (x < pkg.x || x > pkg.x + pkg.width || y < pkg.y || y > pkg.y + pkg.height) {
            return false;
        }
        
        //convert to local coordinates
        const localX = Math.floor((x - pkg.x) / this.cellSize);
        const localY = Math.floor((y - pkg.y) / this.cellSize);
        
        //Make sure localX and localY are valid indices
        if (localY < 0 || localY >= pkg.shape.length || 
            localX < 0 || localX >= pkg.shape[0].length) {
            return false;
        }
        
        //check if point is in a filled cell of the shape
        return pkg.shape[localY][localX] === 1;
    },
    
    draw: function() {
        //background panel
        ctx.fillStyle = 'rgba(10, 10, 24, 0.9)';
        ctx.fillRect(canvas.width * 0.2, canvas.height * 0.2, canvas.width * 0.6, canvas.height * 0.6);
        
        //border
        ctx.strokeStyle = 'rgba(255, 0, 179, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(canvas.width * 0.2, canvas.height * 0.2, canvas.width * 0.6, canvas.height * 0.6);
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        //quit button
        ctx.fillRect(canvas.width * 0.8, canvas.height * 0.7, 80, 40);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(canvas.width * 0.8, canvas.height * 0.7, 80, 40);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px Orbitron';
        ctx.fillText("Quit", canvas.width * 0.8 + 20, canvas.height * 0.7 + 25);
            //inner glow
        const gradient = ctx.createLinearGradient(
            canvas.width * 0.2, canvas.height * 0.2, 
            canvas.width * 0.8, canvas.height * 0.8
        );
        gradient.addColorStop(0, "rgba(255, 0, 179, 0.1)");
        gradient.addColorStop(0.5, "rgba(123, 0, 255, 0.05)");
        gradient.addColorStop(1, "rgba(0, 194, 255, 0.1)");
        ctx.fillStyle = gradient;
        ctx.fillRect(canvas.width * 0.205, canvas.height * 0.205, canvas.width * 0.59, canvas.height * 0.59);
        
        //title
        ctx.fillStyle = '#ff00b3';
        ctx.font = 'bold 28px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText("Fit the Packages into the Container", canvas.width * 0.5, canvas.height * 0.25);
        
        //timer and instructions
        ctx.fillStyle = this.timeRemaining < 10 ? '#ff3366' : '#e0e0ff';
        ctx.font = 'bold 22px Orbitron';
        ctx.fillText(`Time: ${Math.ceil(this.timeRemaining)}s   Packages: ${this.packagePlaced.filter(p => p).length}/${this.packages.length}`, canvas.width * 0.5, canvas.height * 0.29);
        
        //Draw grid container
        const gridX = canvas.width / 2 - (this.gridWidth * this.cellSize) / 2;
        const gridY = canvas.height * 0.35;
        
        //container outline with glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(255, 0, 179, 0.5)';
        ctx.strokeStyle = 'rgba(255, 0, 179, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(gridX - 2, gridY - 2, this.gridWidth * this.cellSize + 4, this.gridHeight * this.cellSize + 4);
        ctx.shadowBlur = 0;
        
        //container background
        ctx.fillStyle = 'rgba(26, 26, 46, 0.5)';
        ctx.fillRect(gridX, gridY, this.gridWidth * this.cellSize, this.gridHeight * this.cellSize);
        
        //grid lines
        ctx.strokeStyle = 'rgba(255, 0, 179, 0.3)';
        ctx.lineWidth = 1;
        
        //vertical lines
        for (let x = 0; x <= this.gridWidth; x++) {
            ctx.beginPath();
            ctx.moveTo(gridX + x * this.cellSize, gridY);
            ctx.lineTo(gridX + x * this.cellSize, gridY + this.gridHeight * this.cellSize);
            ctx.stroke();
        }
        
        //horizontal lines
        for (let y = 0; y <= this.gridHeight; y++) {
            ctx.beginPath();
            ctx.moveTo(gridX, gridY + y * this.cellSize);
            ctx.lineTo(gridX + this.gridWidth * this.cellSize, gridY + y * this.cellSize);
            ctx.stroke();
        }
        
        //draw placed packages in the grid
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (this.grid[y][x]) {
                    
                    ctx.fillStyle = this.grid[y][x];
                    ctx.fillRect(gridX + x * this.cellSize, gridY + y * this.cellSize, this.cellSize, this.cellSize);
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(gridX + x * this.cellSize, gridY + y * this.cellSize, this.cellSize, this.cellSize);
                }
            }
        }
        
        //draw packages 
        for (const pkg of this.packages) {
            if (pkg !== this.draggedPackage && !pkg.placed) {
                this.drawPackage(pkg);
            }
        }
        
        //draw hover effect for the package being placed
        if (this.packageHover) {
            const pkg = this.packageHover.package;
            const cellX = Math.floor((pkg.x - gridX) / this.cellSize) * this.cellSize + gridX;
            const cellY = Math.floor((pkg.y - gridY) / this.cellSize) * this.cellSize + gridY;
            
            //draw outline where package would be placed
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = this.packageHover.valid ? 'rgba(0, 255, 170, 0.5)' : 'rgba(255, 51, 102, 0.5)';
            
            for (let y = 0; y < pkg.shape.length; y++) {
                for (let x = 0; x < pkg.shape[0].length; x++) {
                    if (pkg.shape[y][x]) {
                        ctx.fillRect(
                            cellX + x * this.cellSize, 
                            cellY + y * this.cellSize, 
                            this.cellSize, 
                            this.cellSize
                        );
                    }
                }
            }
            ctx.globalAlpha = 1.0;
        }
        
        //draw the package being dragged on top
        if (this.draggedPackage) {
            this.drawPackage(this.draggedPackage);
        }
        
        //Instructions text
        ctx.fillStyle = '#e0e0ff';
        ctx.font = 'bold 22px Orbitron';
        ctx.fillText("Drag and drop the packages to fit them all in the container", canvas.width * 0.5, canvas.height * 0.65);
        
        if (this.completed) {
            //completion panel
            ctx.fillStyle = 'rgba(10, 10, 24, 0.9)';
            ctx.fillRect(canvas.width * 0.3, canvas.height * 0.4, canvas.width * 0.4, canvas.height * 0.2);
            
            //panel border
            ctx.strokeStyle = this.success ? 'rgba(0, 255, 170, 0.8)' : 'rgba(255, 51, 102, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(canvas.width * 0.3, canvas.height * 0.4, canvas.width * 0.4, canvas.height * 0.2);
            
            //completion message
            ctx.fillStyle = this.success ? '#00ffaa' : '#ff3366';
            ctx.font = 'bold 24px Orbitron';
            
            if (this.success) {
                ctx.fillText("Container Packed!", canvas.width * 0.5, canvas.height * 0.5);
            } else {
                ctx.fillText("Time's up!", canvas.width * 0.5, canvas.height * 0.5);
                ctx.font = 'bold 22px Orbitron';
                const placedCount = this.packagePlaced.filter(p => p).length;
                ctx.fillText(`You packed ${placedCount} out of ${this.packages.length} packages`, canvas.width * 0.5, canvas.height * 0.55);
            }
            
            //continue button
            ctx.fillStyle = 'rgba(0, 194, 255, 0.3)';
            ctx.fillRect(canvas.width * 0.4, canvas.height * 0.7, canvas.width * 0.2, 40);
            
            ctx.strokeStyle = 'rgba(0, 194, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(canvas.width * 0.4, canvas.height * 0.7, canvas.width * 0.2, 40);
            
            ctx.fillStyle = '#e0e0ff';
            ctx.font = '18px Orbitron';
            ctx.fillText("Continue", canvas.width * 0.5, canvas.height * 0.7 + 25);
        }
    },
    
    drawPackage: function(pkg) {
        //Draw a single package with its shape
        for (let y = 0; y < pkg.shape.length; y++) {
            for (let x = 0; x < pkg.shape[0].length; x++) {
                if (pkg.shape[y][x]) {
                    //Add glow effect
                    ctx.shadowBlur = pkg === this.draggedPackage ? 10 : 5;
                    ctx.shadowColor = pkg.color;
                    
                    //cell fill
                    ctx.fillStyle = pkg.color;
                    ctx.fillRect(
                        pkg.x + x * this.cellSize, 
                        pkg.y + y * this.cellSize, 
                        this.cellSize, 
                        this.cellSize
                    );
                    
                    //reset shadow
                    ctx.shadowBlur = 0;
                    
                    //cell border
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(
                        pkg.x + x * this.cellSize, 
                        pkg.y + y * this.cellSize, 
                        this.cellSize, 
                        this.cellSize
                    );
                }
            }
        }
    }
};

//scientist: pop the lock game
const popTheLockGame = {
    angle: 0,
    targetAngle: 45,
    targetWidth: 10,
    speed: 2,
    direction: 1,
    successCount: 0,
    requiredSuccess: 5,
    completed: false,
    success: false,
    lives: 3,
    level: 1,
    lastUpdateTime: 0,
    
    init: function() {
        this.angle = 0;
        this.targetAngle = 45;
        this.targetWidth = 10;
        this.speed = 2;
        this.direction = 1;
        this.successCount = 0;
        this.completed = false;
        this.success = false;
        this.lives = 3;
        this.level = 1;
        this.lastUpdateTime = Date.now();
        
        this.targetAngle = Math.floor(Math.random() * 320) + 20;
    },
    
    update: function() {
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastUpdateTime;
        this.lastUpdateTime = currentTime;
        
        this.angle += this.speed * this.direction * (deltaTime / 16);
        
        if (this.angle >= 360) {
            this.angle = 0;
        } else if (this.angle < 0) {
            this.angle = 359;
        }
    },
    
    handleClick: function(x, y) {
        if (this.completed) {
            if (x >= canvas.width * 0.4 && x <= canvas.width * 0.6 &&
                y >= canvas.height * 0.75 && y <= canvas.height * 0.75 + 40) {
                return true;
            }
            return false;
        }
        
        const targetStart = this.targetAngle - (this.targetWidth / 2);
        const targetEnd = this.targetAngle + (this.targetWidth / 2);
        
        let success = false;
        
        if (targetStart >= 0 && targetEnd <= 360) {
            success = this.angle >= targetStart && this.angle <= targetEnd;
        } else if (targetStart < 0) {
            success = (this.angle >= (targetStart + 360) || this.angle <= targetEnd);
        } else if (targetEnd > 360) {
            success = (this.angle >= targetStart || this.angle <= (targetEnd - 360));
        }
        
        if (success) {
            this.successCount++;
            
            this.level++;
            this.speed += 0.5;
            this.targetWidth = Math.max(4, this.targetWidth - 1);
            
            if (Math.random() > 0.5) {
                this.direction *= -1;
            }
            
            this.targetAngle = Math.floor(Math.random() * 320) + 20;
            
            if (this.successCount >= this.requiredSuccess) {
                this.completed = true;
                this.success = true;
            }
        } else {
            this.lives--;
            
            if (this.lives <= 0) {
                this.completed = true;
                this.success = false;
            }
        }
        
        return false;
    },
    
    draw: function() {
        //background panel
        ctx.fillStyle = 'rgba(10, 10, 24, 0.9)';
        ctx.fillRect(canvas.width * 0.2, canvas.height * 0.2, canvas.width * 0.6, canvas.height * 0.6);
        
        //border
        ctx.strokeStyle = 'rgba(0, 194, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(canvas.width * 0.2, canvas.height * 0.2, canvas.width * 0.6, canvas.height * 0.6);
        
        //inner glow
        const gradient = ctx.createLinearGradient(
            canvas.width * 0.2, canvas.height * 0.2, 
            canvas.width * 0.8, canvas.height * 0.8
        );
        gradient.addColorStop(0, "rgba(0, 194, 255, 0.1)");
        gradient.addColorStop(0.5, "rgba(123, 0, 255, 0.05)");
        gradient.addColorStop(1, "rgba(0, 255, 170, 0.1)");
        ctx.fillStyle = gradient;
        ctx.fillRect(canvas.width * 0.205, canvas.height * 0.205, canvas.width * 0.59, canvas.height * 0.59);
        
        //title
        ctx.fillStyle = '#00c2ff';
        ctx.font = 'bold 28px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText("Calibrate the Quantum Lock", canvas.width * 0.5, canvas.height * 0.25);
        
        //instructions
        ctx.fillStyle = '#e0e0ff';
        ctx.font = 'bold 22px Orbitron';
        ctx.fillText("Click when the pointer aligns with the target zone", canvas.width * 0.5, canvas.height * 0.3);
        
        //game stats
        ctx.fillText(`Level: ${this.level}   Lives: ${this.lives}   Success: ${this.successCount}/${this.requiredSuccess}`, canvas.width * 0.5, canvas.height * 0.35);
        
        //draw lock circle with glow
        const centerX = canvas.width * 0.5;
        const centerY = canvas.height * 0.5;
        const radius = canvas.width * 0.15;
        
        //main circle
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(0, 194, 255, 0.5)';
        ctx.strokeStyle = 'rgba(50, 50, 80, 0.7)';
        ctx.lineWidth = 15;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        //target area with glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)';
        ctx.lineWidth = 15;
        const targetStart = (this.targetAngle - (this.targetWidth / 2)) * (Math.PI / 180);
        const targetEnd = (this.targetAngle + (this.targetWidth / 2)) * (Math.PI / 180);
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, targetStart, targetEnd);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        //pointer line
        const pointerAngle = this.angle * (Math.PI / 180);
        const pointerX = centerX + Math.cos(pointerAngle) * radius;
        const pointerY = centerY + Math.sin(pointerAngle) * radius;
        
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#ffffff';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(pointerX, pointerY);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        //pointer cap with glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff3366';
        ctx.fillStyle = '#ff3366';
        ctx.beginPath();
        ctx.arc(pointerX, pointerY, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        if (this.completed) {
            //completion panel
            ctx.fillStyle = 'rgba(10, 10, 24, 0.9)';
            ctx.fillRect(canvas.width * 0.3, canvas.height * 0.45, canvas.width * 0.4, canvas.height * 0.2);
            
            //panel border
            ctx.strokeStyle = this.success ? 'rgba(0, 255, 170, 0.8)' : 'rgba(255, 51, 102, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(canvas.width * 0.3, canvas.height * 0.45, canvas.width * 0.4, canvas.height * 0.2);
            
            //completion message
            ctx.fillStyle = this.success ? '#00ffaa' : '#ff3366';
            ctx.font = 'bold 24px Orbitron';
            
            if (this.success) {
                ctx.fillText("Lock Calibrated!", canvas.width * 0.5, canvas.height * 0.55);
            } else {
                ctx.fillText("Calibration Failed!", canvas.width * 0.5, canvas.height * 0.55);
            }
            
            //continue button
            ctx.fillStyle = 'rgba(0, 194, 255, 0.3)';
            ctx.fillRect(canvas.width * 0.4, canvas.height * 0.75, canvas.width * 0.2, 40);
            
            ctx.strokeStyle = 'rgba(0, 194, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(canvas.width * 0.4, canvas.height * 0.75, canvas.width * 0.2, 40);
            
            ctx.fillStyle = '#e0e0ff';
            ctx.font = '18px Orbitron';
            ctx.fillText("Continue", canvas.width * 0.5, canvas.height * 0.75 + 25);
        }
    }
};

//trader: item valuation game
const itemValuationGame = {
    items: [],
    totalItems: 5,
    currentItem: 0,
    guessValue: 50,
    completed: false,
    success: false,
    score: 0,
    
    init: function() {
        this.items = [];
        this.currentItem = 0;
        this.guessValue = 50;
        this.completed = false;
        this.success = false;
        this.score = 0;
        
        //create random items
        const itemNames = [
            "Ancient Nano-Tech", "Quantum Crystal", "Holographic Memory Core",
            "Fusion Battery", "Neural Interface", "Time Displacement Coil",
            "Antimatter Container", "Bio-synthetic Organ", "Gravity Manipulator"
        ];
        
        for (let i = 0; i < this.totalItems; i++) {
            //Get random item name
            const nameIndex = Math.floor(Math.random() * itemNames.length);
            const name = itemNames[nameIndex];
            itemNames.splice(nameIndex, 1); //remove used name
            
            //random value between 10 and 90
            const value = 10 + Math.floor(Math.random() * 81);
            
            this.items.push({
                name: name,
                value: value,
                guessed: false,
                playerGuess: 0,
                points: 0
            });
        }
    },
    
    handleClick: function(x, y) {
        if (this.completed) {
            if (x >= canvas.width * 0.4 && x <= canvas.width * 0.6 &&
                y >= canvas.height * 0.8 && y <= canvas.height * 0.8 + 40) {
                return true;
            }
            return false;
        }
        
        //check if all items have been valued
        if (this.currentItem >= this.totalItems) {
            this.completed = true;
            this.success = this.score >= 30; //Need 30 out of 100 possible points
            return false;
        }
        
        //check if clicking on slider
        if (y >= canvas.height * 0.6 - 10 && y <= canvas.height * 0.6 + 10) {
            if (x >= canvas.width * 0.3 && x <= canvas.width * 0.7) {
                //update guess value based on position
                this.guessValue = Math.round(((x - canvas.width * 0.3) / (canvas.width * 0.4)) * 100);
                return false;
            }
        }
        
        //check if clicking submit button
        if (x >= canvas.width * 0.4 && x <= canvas.width * 0.6 &&
            y >= canvas.height * 0.7 && y <= canvas.height * 0.7 + 40) {
            
            //submit guess
            this.submitGuess();
            return false;
        }
        
        return false;
    },
    
    submitGuess: function() {
        const item = this.items[this.currentItem];
        item.guessed = true;
        item.playerGuess = this.guessValue;
        
        //calculate points based on how close the guess was
        const diff = Math.abs(item.value - item.playerGuess);
        if (diff <= 5) {
            item.points = 20; //Very close
        } else if (diff <= 15) {
            item.points = 10; //somewhat close
        } else if (diff <= 30) {
            item.points = 5; //Not too far
        } else {
            item.points = 0; //Way off
        }
        
        this.score += item.points;
        this.currentItem++;
        
        //reset guess for next item
        this.guessValue = 50;
        
        //check if all items have been valued
        if (this.currentItem >= this.totalItems) {
            this.completed = true;
            this.success = this.score >= 30; //Need 30 out of 100 possible points
        }
    },
    
    draw: function() {
        //background panel
        ctx.fillStyle = 'rgba(10, 10, 24, 0.9)';
        ctx.fillRect(canvas.width * 0.2, canvas.height * 0.2, canvas.width * 0.6, canvas.height * 0.6);
        
        //border
        ctx.strokeStyle = 'rgba(255, 170, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(canvas.width * 0.2, canvas.height * 0.2, canvas.width * 0.6, canvas.height * 0.6);
        
        //inner glow
        const gradient = ctx.createLinearGradient(
            canvas.width * 0.2, canvas.height * 0.2, 
            canvas.width * 0.8, canvas.height * 0.8
        );
        gradient.addColorStop(0, "rgba(255, 170, 0, 0.1)");
        gradient.addColorStop(0.5, "rgba(255, 51, 102, 0.05)");
        gradient.addColorStop(1, "rgba(255, 0, 179, 0.1)");
        ctx.fillStyle = gradient;
        ctx.fillRect(canvas.width * 0.205, canvas.height * 0.205, canvas.width * 0.59, canvas.height * 0.59);
        
        //title
        ctx.fillStyle = '#ffaa00';
        ctx.font = 'bold 28px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText("Appraise the Rare Artifacts", canvas.width * 0.5, canvas.height * 0.25);
        
        //If all items have been valued, show results
        if (this.completed) {
            ctx.fillStyle = '#e0e0ff';
            ctx.font = 'bold 22px Orbitron';
            ctx.fillText("Final Results:", canvas.width * 0.5, canvas.height * 0.35);
            
            //Draw item results
            for (let i = 0; i < this.totalItems; i++) {
                const item = this.items[i];
                const y = canvas.height * 0.4 + (i * 40);
                
                ctx.fillStyle = '#e0e0ff';
                ctx.textAlign = 'left';
                ctx.fillText(item.name, canvas.width * 0.25, y);
                
                ctx.textAlign = 'center';
                ctx.fillText(`Your guess: ${item.playerGuess}`, canvas.width * 0.5, y);
                
                ctx.textAlign = 'right';
                ctx.fillText(`Actual: ${item.value}`, canvas.width * 0.75, y);
            }
            
            //Draw total score
            ctx.fillStyle = this.success ? '#00ffaa' : '#ff3366';
            ctx.font = 'bold 24px Orbitron';
            ctx.textAlign = 'center';
            ctx.fillText(`Total Score: ${this.score} / 100`, canvas.width * 0.5, canvas.height * 0.7);
            ctx.fillStyle = 'rgba(0, 194, 255, 0.3)';
            ctx.fillRect(canvas.width * 0.4, canvas.height * 0.8, canvas.width * 0.2, 40);
            
            ctx.strokeStyle = 'rgba(0, 194, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(canvas.width * 0.4, canvas.height * 0.8, canvas.width * 0.2, 40);
            
            ctx.fillStyle = '#e0e0ff';
            ctx.font = '18px Orbitron';
            ctx.fillText("Continue", canvas.width * 0.5, canvas.height * 0.8 + 25);
            
            return;
        }
        
        //Draw current item
        if (this.currentItem < this.totalItems) {
            const item = this.items[this.currentItem];
            
            //Draw item name
            ctx.fillStyle = '#ffaa00';
            ctx.font = 'bold 22px Orbitron';
            ctx.fillText(item.name, canvas.width * 0.5, canvas.height * 0.4);
            
            //Draw item "image" (holographic projection effect)
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ffaa00';
            
            //Base shape
            ctx.fillStyle = 'rgba(255, 170, 0, 0.3)';
            ctx.beginPath();
            ctx.moveTo(canvas.width * 0.5, canvas.height * 0.45);
            ctx.lineTo(canvas.width * 0.55, canvas.height * 0.5);
            ctx.lineTo(canvas.width * 0.5, canvas.height * 0.55);
            ctx.lineTo(canvas.width * 0.45, canvas.height * 0.5);
            ctx.closePath();
            ctx.fill();
            
            //Holographic lines
            ctx.strokeStyle = 'rgba(255, 170, 0, 0.7)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.arc(
                    canvas.width * 0.5, 
                    canvas.height * 0.5, 
                    20 + i * 10, 
                    0, 
                    Math.PI * 2
                );
                ctx.stroke();
            }
            
            ctx.shadowBlur = 0;
            
            //Draw value slider
            ctx.fillStyle = 'rgba(30, 30, 50, 0.7)';
            ctx.fillRect(canvas.width * 0.3, canvas.height * 0.6 - 5, canvas.width * 0.4, 10);
            
            //Draw value markers
            ctx.fillStyle = '#e0e0ff';
            ctx.font = '14px "Exo 2"';
            ctx.textAlign = 'center';
            
            for (let i = 0; i <= 10; i++) {
                const x = canvas.width * 0.3 + (canvas.width * 0.4 * (i / 10));
                ctx.fillRect(x, canvas.height * 0.6 - 10, 2, 20);
                ctx.fillText(i * 10, x, canvas.height * 0.6 + 20);
            }
            
            //Draw slider position with glow
            const sliderX = canvas.width * 0.3 + (canvas.width * 0.4 * (this.guessValue / 100));
            
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ffaa00';
            ctx.fillStyle = '#ffaa00';
            ctx.beginPath();
            ctx.arc(sliderX, canvas.height * 0.6, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            //Draw current guess value
            ctx.fillStyle = '#e0e0ff';
            ctx.font = '18px "Exo 2"';
            ctx.fillText(`Your estimate: ${this.guessValue}`, canvas.width * 0.5, canvas.height * 0.65);
            
            //Draw submit button
            ctx.fillStyle = 'rgba(255, 170, 0, 0.3)';
            ctx.fillRect(canvas.width * 0.4, canvas.height * 0.7, canvas.width * 0.2, 40);
            
            ctx.strokeStyle = 'rgba(255, 170, 0, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(canvas.width * 0.4, canvas.height * 0.7, canvas.width * 0.2, 40);
            
            ctx.fillStyle = '#e0e0ff';
            ctx.font = '18px Orbitron';
            ctx.fillText("Submit", canvas.width * 0.5, canvas.height * 0.7 + 25);
        }
    }
};



//npcs with tasks
const npcs = [
    {
        id: 'mechanic',
        x: 200,
        y: canvas.height * 0.75 - 10,
        width: 40,
        height: 70,
        color: '#ff6600',
        name: 'Mechanic',
        dialog: "Hey there! I need help fixing my hover-car. The wiring system is completely messed up. Can you help me repair it for 50 credits?",
        task: {
            description: "Connect the matching wires to repair the hover-car",
            minigame: wireRepairGame,
            reward: 50
        }
    },
    {
        id: 'hacker',
        x: 600,
        y: canvas.height * 0.75 - 10,
        width: 40,
        height: 70,
        color: '#00ffaa',
        name: 'Hacker',
        dialog: "I need access to the mainframe. Can you help me crack the security system? 100 credits if you succeed.",
        task: {
            description: "Break the code by finding the correct color sequence",
            minigame: codeBreakingGame,
            reward: 100
        }
    },
    {
        id: 'vendor',
        x: 1000,
        y: canvas.height * 0.75 - 10,
        width: 40,
        height: 70,
        color: '#ff00b3',
        name: 'Vendor',
        dialog: "I need to fit these oddly shaped packages into the container. Can you help me organize them for 80 credits?",
        task: {
            description: "Carefully arrange all the packages to fit in the container",
            minigame: packageFittingGame,
            reward: 80
        }
    },
    {
        id: 'scientist',
        x: 1400,
        y: canvas.height * 0.75 - 10,
        width: 40,
        height: 70,
        color: '#00c2ff',
        name: 'Scientist',
        dialog: "The quantum lock on my lab is malfunctioning! Help me calibrate it for 150 credits!",
        task: {
            description: "Click when the spinning pointer aligns with the target zone",
            minigame: popTheLockGame,
            reward: 150
        }
    },
    {
        id: 'trader',
        x: -800,
        y: canvas.height * 0.75 - 10,
        width: 40,
        height: 70,
        color: '#ffcc00',
        name: 'Trader',
        dialog: "I've got rare items from the old world, but I can't remember their values. Help me appraise them for 120 credits!",
        task: {
            description: "Guess the value of each rare item as accurately as possible",
            minigame: itemValuationGame,
            reward: 120
        }
    }
];

//minigame management functions
function startMinigame(minigame) {
    minigameActive = true;
    currentMinigame = minigame;
    currentMinigame.init();
}

function completeMinigame() {
    if (currentTask && currentMinigame && currentMinigame.completed) {
        if (currentMinigame.success) {
            money += currentTask.reward;
            moneyCounter.textContent = money;
            currentDialogText = `Great job! You earned ${currentTask.reward} credits.`;
            tasksCompleted++;
            
            if (currentNPC) {
                currentNPC.taskCompleted = true;
            }
        } else {
            currentDialogText = "You failed the task. Better luck next time!";
        }
        
        minigameActive = false;
    }
}

function checkNPCInteraction() {
    if (dialogOpen) return;
    
    for (const npc of npcs) {
        if (npc.taskCompleted) continue;
        
        const screenX = npc.x - camera.x;
        const dx = Math.abs((player.x + player.width/2) - (screenX + npc.width/2));
        if (dx < 70) {
            dialogOpen = true;
            currentNPC = npc;
            currentDialogText = npc.dialog;
            break;
        }
    }
}

function drawCityLayers() {
    for (const layer of cityLayers) {
        try {
            const layerOffset = -(camera.x * layer.speed) % canvas.width;
            
            ctx.drawImage(layer.img, layerOffset, layer.y, canvas.width, layer.height);
            
            if (layerOffset < 0) {
                ctx.drawImage(layer.img, layerOffset + canvas.width, layer.y, canvas.width, layer.height);
            } else {
                ctx.drawImage(layer.img, layerOffset - canvas.width, layer.y, canvas.width, layer.height);
            }
        } catch (error) {}
    }
}

function update() {
    //update game timer
    gameTimer.update();
    
    if (!player.onGround) {
        player.jumpVelocity += player.gravity;
        player.y += player.jumpVelocity;
        
        if (player.y >= player.floorY) {
            player.y = player.floorY;
            player.onGround = true;
            player.jumping = false;
        }
    }
    
    let isMoving = false;
    
    if (!minigameActive) {
        if (keys['ArrowLeft'] || keys['a']) {
            player.facingRight = false;
            camera.x -= player.speed;
            isMoving = true;
        } else if (keys['ArrowRight'] || keys['d']) {
            player.facingRight = true;
            camera.x += player.speed;
            isMoving = true;
        }
    }
    
    if (isMoving) {
        player.walkCycle += player.walkSpeed;
        if (player.walkCycle > Math.PI * 2) {
            player.walkCycle = 0;
        }
    } else {
        player.walkCycle = 0;
    }
    
    if (minigameActive && currentMinigame && currentMinigame.update) {
        currentMinigame.update();
        
        if (currentMinigame.completed && !dialogOpen) {
            completeMinigame();
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawCityLayers();
    gameTimer.draw();

    //floor with glow
    const floorY = canvas.height * 0.85;
    const floorGradient = ctx.createLinearGradient(0, floorY, 0, canvas.height);
    floorGradient.addColorStop(0, 'rgba(15, 15, 30, 0.9)');
    floorGradient.addColorStop(1, 'rgba(10, 10, 18, 0.9)');
    ctx.fillStyle = floorGradient;
    ctx.fillRect(0, floorY, canvas.width, canvas.height - floorY);
    
    //floor details
    ctx.fillStyle = 'rgba(0, 194, 255, 0.3)';
    for (let i = 0; i < canvas.width; i += 100) {
        const offset = (i + camera.x) % 200;
        ctx.fillRect(i - offset, floorY, 50, 2);
    }
    
    //grid lines
    ctx.strokeStyle = 'rgba(0, 194, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    for (let i = 0; i < canvas.width; i += 80) {
        const offset = (i + camera.x * 0.5) % 160;
        ctx.moveTo(i - offset, floorY);
        ctx.lineTo(i - offset + 40, canvas.height);
    }
    
    ctx.stroke();
    
    //add glow to grid lines
    ctx.shadowBlur = 5;
    ctx.shadowColor = 'rgba(0, 194, 255, 0.3)';
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    //draw npcs
    for (const npc of npcs) {
        const screenX = npc.x - camera.x;
        if (screenX > -npc.width && screenX < canvas.width) {
            //glow effect
            ctx.shadowBlur = npc.taskCompleted ? 10 : 5;
            ctx.shadowColor = npc.color;
            
            //npc body
            ctx.fillStyle = npc.color;
            ctx.fillRect(screenX, npc.y, npc.width, npc.height);
            
            //npc head
            ctx.fillStyle = '#f0f0ff';
            ctx.beginPath();
            ctx.arc(screenX + npc.width/2, npc.y - 10, 15, 0, Math.PI * 2);
            ctx.fill();
            
            //reset shadow
            ctx.shadowBlur = 0;
            
            //npc name
            ctx.fillStyle = '#e0e0ff';
            ctx.font = '14px Orbitron';
            ctx.textAlign = 'center';
            ctx.textShadow = '0 0 5px rgba(0, 0, 0, 0.5)';
            ctx.fillText(npc.name, screenX + npc.width/2, npc.y - 25);
            
            //completed indicator
            if (npc.taskCompleted) {
                ctx.fillStyle = '#00ffaa';
                ctx.beginPath();
                ctx.arc(screenX + npc.width/2, npc.y - 40, 5, 0, Math.PI * 2);
                ctx.fill();
                
                //glow
                ctx.shadowBlur = 5;
                ctx.shadowColor = '#00ffaa';
                ctx.strokeStyle = '#00ffaa';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
            
            //interaction prompt
            const dx = Math.abs((player.x + player.width/2) - (screenX + npc.width/2));
            if (dx < 70 && !npc.taskCompleted && !dialogOpen) {
                ctx.fillStyle = '#ffffff';
                ctx.font = '12px "Exo 2"';
                ctx.shadowBlur = 3;
                ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                ctx.fillText("Press E to talk", screenX + npc.width/2, npc.y - 45);
                ctx.shadowBlur = 0;
            }
        }
    }
    
    if (!minigameActive) {
        // Draw player sprite
        ctx.save();
        
        // Handle sprite flipping
        if (!player.facingRight) {
            ctx.scale(-1, 1);
            ctx.translate(-2 * player.x - player.width, 0);
        }
        
        // Choose which sprite to draw
        const currentSprite = (keys['ArrowLeft'] || keys['ArrowRight'] || 
                             keys['a'] || keys['d']) ? 
                             playerSprites.running : 
                             playerSprites.standing;
        
        // Draw the sprite
        if (currentSprite) {
            ctx.drawImage(
                currentSprite,
                player.x,
                player.y,
                player.width,
                player.height
            );
        }
        
        ctx.restore();
        
        // Jump effect particles (keep this if you want)
        if (!player.onGround) {
            ctx.fillStyle = 'rgba(0, 194, 255, 0.6)';
            for (let i = 0; i < 5; i++) {
                const size = 3 + Math.random() * 5;
                const offsetX = Math.random() * player.width;
                const offsetY = Math.random() * 10 + 5;
                ctx.beginPath();
                ctx.arc(
                    player.x + offsetX, 
                    player.y + player.height + offsetY, 
                    size, 
                    0, 
                    Math.PI * 2
                );
                ctx.fill();
            }
        }
    }   
    
    //draw dialog
    if (dialogOpen && currentNPC && !minigameActive) {
        const dialogWidth = canvas.width * 0.6;
        const dialogHeight = canvas.height * 0.3;
        const dialogX = canvas.width/2 - dialogWidth/2;
        const dialogY = canvas.height * 0.6;
        
        //dialog background with glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = currentNPC.color;
        
        //dialog box
        ctx.fillStyle = 'rgba(10, 10, 24, 0.85)';
        ctx.fillRect(dialogX, dialogY, dialogWidth, dialogHeight);
        
        //dialog border
        ctx.strokeStyle = currentNPC.color;
        ctx.lineWidth = 3;
        ctx.strokeRect(dialogX, dialogY, dialogWidth, dialogHeight);
        
        //reset shadow
        ctx.shadowBlur = 0;
        
        //inner glow
        const gradient = ctx.createLinearGradient(dialogX, dialogY, dialogX + dialogWidth, dialogY + dialogHeight);
        gradient.addColorStop(0, "rgba(" + parseInt(currentNPC.color.slice(1, 3), 16) + ", " + 
                                      parseInt(currentNPC.color.slice(3, 5), 16) + ", " + 
                                      parseInt(currentNPC.color.slice(5, 7), 16) + ", 0.1)");
        gradient.addColorStop(1, "rgba(10, 10, 24, 0.05)");
        ctx.fillStyle = gradient;
        ctx.fillRect(dialogX + 3, dialogY + 3, dialogWidth - 6, dialogHeight - 6);
        
        //npc name
        ctx.fillStyle = currentNPC.color;
        ctx.font = 'bold 20px Orbitron';
        ctx.textAlign = 'left';
        ctx.shadowBlur = 5;
        ctx.shadowColor = currentNPC.color;
        ctx.fillText(currentNPC.name, dialogX + 20, dialogY + 30);
        ctx.shadowBlur = 0;
        
        //dialog text
        ctx.fillStyle = '#e0e0ff';
        ctx.font = '16px "Exo 2"';
        
        const maxWidth = dialogWidth - 40;
        const words = currentDialogText.split(' ');
        let line = '';
        let y = dialogY + 60;
        
        for (const word of words) {
            const testLine = line + word + ' ';
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth) {
                ctx.fillText(line, dialogX + 20, y);
                line = word + ' ';
                y += 25;
            } else {
                line = testLine;
            }
        }
        
        ctx.fillText(line, dialogX + 20, y);
        
        //start mini-game button
        if (currentTask && currentTask.minigame && !currentMinigame) {
            //button background with glow
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(0, 194, 255, 0.7)';
            
            //button background
            ctx.fillStyle = 'rgba(0, 194, 255, 0.3)';
            ctx.fillRect(dialogX + (dialogWidth/2) - 100, dialogY + dialogHeight - 50, 200, 40);
            
            //button border
            ctx.strokeStyle = 'rgba(0, 194, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(dialogX + (dialogWidth/2) - 100, dialogY + dialogHeight - 50, 200, 40);
            
            //reset shadow
            ctx.shadowBlur = 0;
            
            //button text
            ctx.fillStyle = '#e0e0ff';
            ctx.font = '18px Orbitron';
            ctx.textAlign = 'center';
            ctx.fillText("Start Mini-Game", dialogX + (dialogWidth/2), dialogY + dialogHeight - 25);
        }
    }
    
    //draw active minigame
    if (minigameActive && currentMinigame) {
        currentMinigame.draw();
    }
    
    //draw minimap
    const mapWidth = 150;
    const mapHeight = 30;
    const mapX = canvas.width - mapWidth - 10;
    const mapY = 10;
    
    //map background with glow
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0, 194, 255, 0.3)';
    
    ctx.fillStyle = 'rgba(10, 10, 24, 0.7)';
    ctx.fillRect(mapX, mapY, mapWidth, mapHeight);
    
    //map border
    ctx.strokeStyle = 'rgba(0, 194, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(mapX, mapY, mapWidth, mapHeight);
    
    //reset shadow
    ctx.shadowBlur = 0;
    
    //draw player position
    const totalWorldWidth = worldBounds.max - worldBounds.min;
    const playerPosRatio = (camera.x - worldBounds.min) / totalWorldWidth;
    const playerMapX = mapX + (playerPosRatio * mapWidth);
    
    ctx.fillStyle = '#ff3366';
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#ff3366';
    ctx.beginPath();
    ctx.arc(playerMapX, mapY + mapHeight/2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    //draw npc positions
    for (const npc of npcs) {
        const npcPosRatio = (npc.x - worldBounds.min) / totalWorldWidth;
        const npcMapX = mapX + (npcPosRatio * mapWidth);
        
        if (npcMapX >= mapX && npcMapX <= mapX + mapWidth) {
            ctx.fillStyle = npc.taskCompleted ? '#00ffaa' : npc.color;
            ctx.beginPath();
            ctx.arc(npcMapX, mapY + mapHeight/2, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    //completion message
    if (tasksCompleted >= npcs.length) {
        //background panel with glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(0, 255, 170, 0.5)';
        
        ctx.fillStyle = 'rgba(10, 10, 24, 0.9)';
        ctx.fillRect(canvas.width/2 - 200, canvas.height/2 - 100, 400, 200);
        
        //panel border
        ctx.strokeStyle = 'rgba(0, 255, 170, 0.8)';
        ctx.lineWidth = 3;
        ctx.strokeRect(canvas.width/2 - 200, canvas.height/2 - 100, 400, 200);
        
        //reset shadow
        ctx.shadowBlur = 0;
        
        //completion text with glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0, 255, 170, 0.7)';
        
        ctx.fillStyle = '#00ffaa';
        ctx.font = 'bold 28px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText("Congratulations!", canvas.width/2, canvas.height/2 - 50);
        
        ctx.font = 'bold 20px Orbitron';
        ctx.fillText(`You've completed all tasks`, canvas.width/2, canvas.height/2);
        ctx.fillText(`and earned ${money} credits!`, canvas.width/2, canvas.height/2 + 50);
        
        ctx.shadowBlur = 0;
    }
}

//keyboard input
const keys = {};

window.addEventListener('keydown', function(e) {
    keys[e.key] = true;
    
    if (e.key === ' ' && player.onGround && !minigameActive) {
        player.jumping = true;
        player.onGround = false;
        player.jumpVelocity = player.jumpStrength;
    }
    
    if (e.key === 'e' && !dialogOpen && !minigameActive) {
        checkNPCInteraction();
    }
    
    if (minigameActive && currentMinigame && currentMinigame.handleKeyDown) {
        currentMinigame.handleKeyDown(e.key);
    }
    
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }
});

window.addEventListener('keyup', function(e) {
    keys[e.key] = false;
});

//mouse events 
window.addEventListener('mousedown', function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    if (minigameActive && currentMinigame) {
        if (currentMinigame === packageFittingGame) {
            currentMinigame.handleMouseDown(mouseX, mouseY);
        } else if (currentMinigame.handleClick) {
            const shouldContinue = currentMinigame.handleClick(mouseX, mouseY);
            if (shouldContinue) {
                completeMinigame();
            }
        }
    } else if (dialogOpen && currentTask && currentTask.minigame) {
        const dialogWidth = canvas.width * 0.6;
        const dialogHeight = canvas.height * 0.3;
        const dialogX = canvas.width/2 - dialogWidth/2;
        const dialogY = canvas.height * 0.6;
        
        if (mouseX >= dialogX + (dialogWidth/2) - 100 && 
            mouseX <= dialogX + (dialogWidth/2) + 100 &&
            mouseY >= dialogY + dialogHeight - 50 && 
            mouseY <= dialogY + dialogHeight - 10) {
            
            startMinigame(currentTask.minigame);
        }
    }
});

window.addEventListener('mousemove', function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    if (minigameActive && currentMinigame && currentMinigame.handleMouseMove) {
        currentMinigame.handleMouseMove(mouseX, mouseY);
    }
});

window.addEventListener('mouseup', function() {
    if (minigameActive && currentMinigame && currentMinigame.handleMouseUp) {
        currentMinigame.handleMouseUp();
    }
});

window.addEventListener('click', function(e) {
    if (dialogOpen && currentNPC && !minigameActive) {
        if (!currentTask) {
            currentTask = {...currentNPC.task};
            currentDialogText = currentTask.description;
        } else if (currentTask && currentMinigame && currentMinigame.completed) {
            dialogOpen = false;
            currentNPC = null;
            currentTask = null;
            currentMinigame = null;
            minigameActive = false;
        }
        
        const dialogWidth = canvas.width * 0.6;
        const dialogHeight = canvas.height * 0.3;
        const dialogX = canvas.width/2 - dialogWidth/2;
        const dialogY = canvas.height * 0.6;
        
        if (currentTask && currentTask.minigame && !minigameActive) {
            if (e.clientX >= dialogX + (dialogWidth/2) - 100 && 
                e.clientX <= dialogX + (dialogWidth/2) + 100 &&
                e.clientY >= dialogY + dialogHeight - 50 && 
                e.clientY <= dialogY + dialogHeight - 10) {
                
                startMinigame(currentTask.minigame);
            }
        }
    }
});

//window resize
window.addEventListener('resize', function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    player.floorY = canvas.height * 0.75 - 10;
    
    if (player.onGround) {
        player.y = player.floorY;
    }
    
    for (const npc of npcs) {
        npc.y = canvas.height * 0.75 - 10;
    }
});

//game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();