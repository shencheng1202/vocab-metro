// Vocab Metro - English Vocabulary Learning Game
// Inspired by Mini Metro

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameState = 'start'; // start, playing, gameover, win
let score = 0;
let wordsDelivered = 0;
let totalWords = 20;
let lines = [];
let trains = [];
let particles = [];

// Line colors (Mini Metro style)
const lineColors = [
    '#ff6b6b', // Red
    '#4ecdc4', // Teal
    '#ffd93d', // Yellow
    '#6bcf7f', // Green
    '#a78bfa', // Purple
    '#ff8c42', // Orange
    '#00d4ff', // Cyan
    '#ff6b9d'  // Pink
];

// Vocabulary data
const vocabData = [
    { word: "Torment", sentence: "The guilt of his past mistakes continued to ________ him for decades, even after he apologized to those he had hurt and spent his life trying to make amends." },
    { word: "Indulgent", sentence: "My grandmother is always ________ with her grandchildren, spoiling them with sweet treats and letting them stay up late whenever they visit her countryside home." },
    { word: "Abandon", sentence: "When she realized the mission was impossible and all hope was lost, she chose to ________ the project that had consumed her years of hard work and dedication." },
    { word: "Intrigue", sentence: "The mysterious note left on the doorstep, with its cryptic symbols and handwritten message, continued to ________ the detective long after she finished her initial investigation." },
    { word: "Absurd", sentence: "It is ________ to believe that you can master a foreign language in just a week, no matter how many flashcards you memorize or apps you use." },
    { word: "Rite", sentence: "In many cultures, a coming-of-age ________ marks the moment when a young person transitions from childhood to adulthood, often with special ceremonies and traditions." },
    { word: "Catastrophe", sentence: "If we fail to address climate change and ignore the warnings of scientists, we will face an environmental ________ that will alter life on Earth for generations to come." },
    { word: "Reverie", sentence: "She fell into a peaceful ________ while staring out the window at the falling snow, imagining herself walking through a quiet forest and listening to the crunch of snow under her boots." },
    { word: "Perceptive", sentence: "The ________ teacher noticed the subtle change in her student's mood and realized he was struggling with anxiety, so she pulled him aside to talk and offer support." },
    { word: "Contemplate", sentence: "Every morning, the elderly poet sits by the lake to ________ the meaning of life and draw inspiration from the quiet beauty of nature around him." },
    { word: "Apparition", sentence: "As the moon rose over the old, abandoned castle, an eerie ________ appeared at the top of the tower, making the hikers freeze in fear and wonder if it was a trick of the light." },
    { word: "Discipline", sentence: "To become a professional athlete, you must have unwavering ________, following a strict training schedule and making sacrifices that most people are unwilling to make." },
    { word: "Trifle", sentence: "The argument started over a mere ________, a forgotten cup of coffee left on the counter, but it escalated quickly and left the two friends not speaking for weeks." },
    { word: "Console", sentence: "I tried to ________ my best friend after she lost her beloved pet, sitting with her for hours and reminding her of all the happy memories they had shared together." },
    { word: "Misfortune", sentence: "Though he faced great ________ when his business collapsed and he lost his home, he refused to give up and worked tirelessly to rebuild his life from the ground up." },
    { word: "Enlighten", sentence: "The wise professor used real-life stories and thought-provoking questions to ________ her students about the complexities of human behavior and social justice." },
    { word: "Tame", sentence: "It takes patience and gentle care to ________ a wild animal, as you must earn its trust slowly and never force it to do something it is afraid to attempt." },
    { word: "Condemn", sentence: "The international community was quick to ________ the unjust act of violence, as it violated basic human rights and broke the peace treaty all nations had signed." },
    { word: "Tedious", sentence: "Sorting through thousands of old documents and typing up handwritten notes is a ________ task, but it is essential for preserving the history of the small town." },
    { word: "Extraordinary", sentence: "The young musician gave an ________ performance at the concert hall, playing the piano with a passion and skill that left the entire audience standing and cheering." }
];

// Game entities
let hubs = [];
let stations = [];

// Mouse state
let mouse = { x: 0, y: 0, isDown: false };
let draggingLine = null;

// Resize canvas
function resizeCanvas() {
    const container = document.getElementById('gameContainer');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Utility functions
function distance(p1, p2) {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function getPointOnLine(line, t) {
    const points = line.points;
    if (points.length < 2) return points[0];
    
    const totalLength = line.totalLength;
    let currentDist = 0;
    
    for (let i = 0; i < points.length - 1; i++) {
        const segLength = distance(points[i], points[i + 1]);
        const segT = segLength / totalLength;
        
        if (currentDist / totalLength + segT >= t) {
            const localT = (t - currentDist / totalLength) / segT;
            return {
                x: lerp(points[i].x, points[i + 1].x, localT),
                y: lerp(points[i].y, points[i + 1].y, localT)
            };
        }
        currentDist += segLength;
    }
    
    return points[points.length - 1];
}

// Classes
class Hub {
    constructor(x, y, word, id) {
        this.x = x;
        this.y = y;
        this.word = word;
        this.id = id;
        this.radius = 25;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.hasWord = true;
    }

    update(deltaTime) {
        this.pulsePhase += deltaTime * 2;
    }

    draw(ctx) {
        // Glow effect
        const pulse = Math.sin(this.pulsePhase) * 0.3 + 0.7;
        ctx.shadowBlur = 20 * pulse;
        ctx.shadowColor = '#ff6b6b';
        
        // Outer ring
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 107, 107, ${0.5 * pulse})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Main circle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ff6b6b';
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // Word text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.word, this.x, this.y);
        
        // Label
        ctx.fillStyle = '#ff6b6b';
        ctx.font = '10px Arial';
        ctx.fillText('HUB', this.x, this.y - this.radius - 15);
    }
}

class Station {
    constructor(x, y, word, sentence, id) {
        this.x = x;
        this.y = y;
        this.word = word;
        this.sentence = sentence;
        this.id = id;
        this.radius = 20;
        this.patience = 100;
        this.maxPatience = 100;
        this.patienceDecay = 2; // per second
        this.completed = false;
        this.satisfied = false; // New: station is satisfied but not yet removed
        this.pulsePhase = 0;
        this.successTimer = 0; // New: 3-second success animation timer
        this.successPulsePhase = 0; // New: for glow animation
        this.fadeOutAlpha = 1; // New: for fade out effect
    }

    update(deltaTime) {
        // If satisfied (success animation phase)
        if (this.satisfied) {
            this.successTimer -= deltaTime;
            this.successPulsePhase += deltaTime * 4; // Faster pulse for success
            
            // Fade out in last 0.5 seconds
            if (this.successTimer < 0.5) {
                this.fadeOutAlpha = this.successTimer / 0.5;
            }
            
            // Remove station after animation
            if (this.successTimer <= 0) {
                this.completed = true;
                this.fadeOutAlpha = 0;
            }
            return;
        }
        
        // Normal gameplay
        if (this.completed) return;
        
        this.patience -= this.patienceDecay * deltaTime;
        this.pulsePhase += deltaTime * 3;
        
        if (this.patience <= 0) {
            gameOver();
        }
    }

    markSatisfied() {
        this.satisfied = true;
        this.successTimer = 3; // 3 seconds success animation
        this.fadeOutAlpha = 1;
    }

    drawSuccessState(ctx) {
        ctx.globalAlpha = this.fadeOutAlpha;
        
        // Calculate glow intensity (pulsing effect)
        const pulse = Math.sin(this.successPulsePhase) * 0.3 + 0.7;
        const glowSize = 20 + 15 * pulse;
        
        // Outer glow effect (gold/green success color)
        ctx.shadowBlur = glowSize;
        ctx.shadowColor = '#ffd700'; // Gold color
        
        // Success ring (growing)
        const ringProgress = 1 - (this.successTimer / 3); // 0 to 1
        const ringRadius = this.radius + 8 + ringProgress * 10;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 215, 0, ${0.8 * pulse})`;
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Main shape with success color
        ctx.beginPath();
        ctx.roundRect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2, 8);
        ctx.fillStyle = '#6bcf7f'; // Success green
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // Success checkmark
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✓', this.x, this.y);
        
        // Draw completed sentence tooltip
        this.drawCompletedTooltip(ctx);
        
        ctx.globalAlpha = 1;
    }

    draw(ctx) {
        // Completed and faded out
        if (this.completed) return;
        
        // Satisfied (success animation phase)
        if (this.satisfied) {
            this.drawSuccessState(ctx);
            return;
        }
        
        // Patience ring
        const patienceRatio = this.patience / this.maxPatience;
        const ringColor = patienceRatio > 0.5 ? '#6bcf7f' : patienceRatio > 0.25 ? '#ffd93d' : '#ff6b6b';
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * patienceRatio);
        ctx.strokeStyle = ringColor;
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Glow based on urgency
        if (patienceRatio < 0.25) {
            const pulse = Math.sin(this.pulsePhase) * 0.5 + 0.5;
            ctx.shadowBlur = 15 * pulse;
            ctx.shadowColor = '#ff6b6b';
        }
        
        // Main shape (rounded rectangle style)
        ctx.beginPath();
        ctx.roundRect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2, 8);
        ctx.fillStyle = '#ffd93d';
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // Word hint (first letter)
        ctx.fillStyle = '#1a1a2e';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.word[0] + '...', this.x, this.y);
        
        // Sentence tooltip on hover
        if (distance(mouse, this) < this.radius + 10) {
            this.drawTooltip(ctx);
        }
    }

    drawCompletedTooltip(ctx) {
        const maxWidth = 350;
        const padding = 12;
        const lineHeight = 20;
        
        // Replace blank with the word (highlighted)
        const completedSentence = this.sentence.replace('________', this.word);
        
        // Word wrap sentence
        const words = completedSentence.split(' ');
        let lines = [];
        let currentLine = '';
        
        ctx.font = 'bold 13px Arial';
        
        for (let word of words) {
            const testLine = currentLine + word + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine !== '') {
                lines.push(currentLine);
                currentLine = word + ' ';
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine);
        
        const tooltipWidth = maxWidth + padding * 2;
        const tooltipHeight = lines.length * lineHeight + padding * 2 + 25;
        
        let tx = this.x + 30;
        let ty = this.y - tooltipHeight / 2;
        
        // Keep on screen
        if (tx + tooltipWidth > canvas.width) tx = this.x - tooltipWidth - 30;
        if (ty < 0) ty = 10;
        if (ty + tooltipHeight > canvas.height) ty = canvas.height - tooltipHeight - 10;
        
        // Background with success styling
        ctx.fillStyle = 'rgba(107, 207, 127, 0.95)'; // Success green background
        ctx.strokeStyle = '#ffd700'; // Gold border
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(tx, ty, tooltipWidth, tooltipHeight, 10);
        ctx.fill();
        ctx.stroke();
        
        // Title
        ctx.fillStyle = '#1a1a2e';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('✓ Completed!', tx + padding, ty + padding + 14);
        
        // Completed sentence with word highlighted
        let currentY = ty + padding + 35;
        ctx.font = 'bold 13px Arial';
        
        lines.forEach((line) => {
            const lineWords = line.trim().split(' ');
            let currentX = tx + padding;
            
            lineWords.forEach((word) => {
                const cleanWord = word.replace(/[.,!?;:]$/, '');
                const isTargetWord = cleanWord.toLowerCase() === this.word.toLowerCase();
                
                if (isTargetWord) {
                    // Highlight the delivered word
                    ctx.fillStyle = '#1a1a2e';
                    ctx.font = 'bold 14px Arial';
                    
                    // Draw highlight background
                    const wordWidth = ctx.measureText(word + ' ').width;
                    ctx.fillStyle = '#ffd700'; // Gold highlight
                    ctx.fillRect(currentX - 2, currentY - 14, wordWidth, 18);
                    
                    // Draw word
                    ctx.fillStyle = '#1a1a2e';
                    ctx.fillText(word + ' ', currentX, currentY);
                    ctx.font = 'bold 13px Arial';
                } else {
                    ctx.fillStyle = '#1a1a2e';
                    ctx.fillText(word + ' ', currentX, currentY);
                }
                
                currentX += ctx.measureText(word + ' ').width;
            });
            
            currentY += lineHeight;
        });
    }

    drawTooltip(ctx) {
        const maxWidth = 300;
        const padding = 10;
        const lineHeight = 18;
        
        // Word wrap sentence
        const words = this.sentence.split(' ');
        let lines = [];
        let currentLine = '';
        
        ctx.font = '12px Arial';
        
        for (let word of words) {
            const testLine = currentLine + word + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine !== '') {
                lines.push(currentLine);
                currentLine = word + ' ';
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine);
        
        const tooltipWidth = maxWidth + padding * 2;
        const tooltipHeight = lines.length * lineHeight + padding * 2 + 20;
        
        let tx = this.x + 30;
        let ty = this.y - tooltipHeight / 2;
        
        // Keep on screen
        if (tx + tooltipWidth > canvas.width) tx = this.x - tooltipWidth - 30;
        if (ty < 0) ty = 10;
        if (ty + tooltipHeight > canvas.height) ty = canvas.height - tooltipHeight - 10;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.strokeStyle = '#ffd93d';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(tx, ty, tooltipWidth, tooltipHeight, 8);
        ctx.fill();
        ctx.stroke();
        
        // Word
        ctx.fillStyle = '#ffd93d';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Needs: ' + this.word, tx + padding, ty + padding + 12);
        
        // Sentence
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        lines.forEach((line, i) => {
            ctx.fillText(line, tx + padding, ty + padding + 30 + i * lineHeight);
        });
    }
}

class Line {
    constructor(color) {
        this.points = [];
        this.color = color;
        this.totalLength = 0;
        this.hubs = new Set();
        this.stations = new Set();
    }

    addPoint(x, y) {
        this.points.push({ x, y });
        this.calculateLength();
    }

    calculateLength() {
        this.totalLength = 0;
        for (let i = 0; i < this.points.length - 1; i++) {
            this.totalLength += distance(this.points[i], this.points[i + 1]);
        }
    }

    draw(ctx) {
        if (this.points.length < 2) return;
        
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.stroke();
        
        // Inner white line for style
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.stroke();
    }
}

class Train {
    constructor(line) {
        this.line = line;
        this.position = 0; // 0 to 1 along line
        this.speed = 0.15; // units per second
        this.direction = 1;
        this.carrying = null; // word being carried
        this.radius = 8;
        this.waitingTime = 0;
        this.state = 'moving'; // moving, loading, unloading
    }

    update(deltaTime) {
        if (this.state === 'moving') {
            this.position += (this.speed * deltaTime) * this.direction;
            
            // Reverse at ends
            if (this.position >= 1) {
                this.position = 1;
                this.direction = -1;
            } else if (this.position <= 0) {
                this.position = 0;
                this.direction = 1;
            }
            
            // Check for hub/station interactions
            this.checkInteractions();
        } else if (this.state === 'loading' || this.state === 'unloading') {
            this.waitingTime -= deltaTime;
            if (this.waitingTime <= 0) {
                this.state = 'moving';
            }
        }
    }

    checkInteractions() {
        const pos = getPointOnLine(this.line, this.position);
        
        // Check hubs to pick up words
        if (!this.carrying) {
            for (let hub of hubs) {
                if (distance(pos, hub) < 30 && hub.hasWord) {
                    this.carrying = hub.word;
                    hub.hasWord = false;
                    this.state = 'loading';
                    this.waitingTime = 0.5;
                    createParticles(hub.x, hub.y, '#ff6b6b');
                    return;
                }
            }
        }
        
        // Check stations to deliver words
        if (this.carrying) {
            for (let station of stations) {
                // Skip if station is already satisfied or completed
                if (station.satisfied || station.completed) continue;
                
                if (distance(pos, station) < 30 && station.word === this.carrying) {
                    // Mark station as satisfied (starts 3-second success animation)
                    station.markSatisfied();
                    
                    this.carrying = null;
                    this.state = 'unloading';
                    this.waitingTime = 0.5;
                    
                    // Award score based on remaining patience
                    score += Math.floor(station.patience) * 10;
                    wordsDelivered++;
                    
                    // Create success particles
                    createParticles(station.x, station.y, '#ffd700'); // Gold particles
                    createParticles(station.x, station.y, '#6bcf7f'); // Green particles
                    
                    // Replenish hub
                    for (let hub of hubs) {
                        if (hub.word === station.word) {
                            hub.hasWord = true;
                        }
                    }
                    
                    if (wordsDelivered >= totalWords) {
                        gameWin();
                    }
                    return;
                }
            }
        }
    }

    draw(ctx) {
        const pos = getPointOnLine(this.line, this.position);
        
        // Train body
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        
        ctx.strokeStyle = this.line.color;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Carrying indicator
        if (this.carrying) {
            ctx.fillStyle = '#6bcf7f';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.carrying.substring(0, 3), pos.x, pos.y - 15);
        }
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 100;
        this.vy = (Math.random() - 0.5) * 100;
        this.life = 1;
        this.decay = Math.random() * 0.5 + 0.5;
    }

    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.life -= this.decay * deltaTime;
    }

    draw(ctx) {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function createParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push(new Particle(x, y, color));
    }
}

// Initialize game entities
function initGame() {
    hubs = [];
    stations = [];
    lines = [];
    trains = [];
    particles = [];
    score = 0;
    wordsDelivered = 0;
    
    // Create hubs on left side
    const hubX = canvas.width * 0.15;
    const hubSpacing = canvas.height / (vocabData.length + 1);
    
    vocabData.forEach((data, i) => {
        const y = hubSpacing * (i + 1);
        hubs.push(new Hub(hubX, y, data.word, i));
    });
    
    // Create stations on right side (shuffled order)
    const stationX = canvas.width * 0.85;
    const shuffledIndices = [...Array(vocabData.length).keys()].sort(() => Math.random() - 0.5);
    
    shuffledIndices.forEach((originalIndex, i) => {
        const data = vocabData[originalIndex];
        const y = hubSpacing * (i + 1);
        stations.push(new Station(stationX, y, data.word, data.sentence, originalIndex));
    });
    
    updateUI();
}

// Input handling
canvas.addEventListener('mousedown', (e) => {
    if (gameState !== 'playing') return;
    
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.isDown = true;
    
    // Check if clicking on a hub or existing line
    let startPoint = null;
    let startColor = null;
    
    // Check hubs
    for (let hub of hubs) {
        if (distance(mouse, hub) < hub.radius + 10) {
            startPoint = { x: hub.x, y: hub.y };
            // Find or assign color
            const existingLine = lines.find(l => l.hubs.has(hub.id));
            startColor = existingLine ? existingLine.color : lineColors[lines.length % lineColors.length];
            break;
        }
    }
    
    // Check stations (exclude satisfied/completed stations)
    if (!startPoint) {
        for (let station of stations) {
            if (distance(mouse, station) < station.radius + 10 && !station.completed && !station.satisfied) {
                startPoint = { x: station.x, y: station.y };
                const existingLine = lines.find(l => l.stations.has(station.id));
                startColor = existingLine ? existingLine.color : lineColors[lines.length % lineColors.length];
                break;
            }
        }
    }
    
    // Check existing lines for extension
    if (!startPoint) {
        for (let line of lines) {
            for (let point of line.points) {
                if (distance(mouse, point) < 15) {
                    startPoint = point;
                    startColor = line.color;
                    draggingLine = { line, extending: true };
                    break;
                }
            }
            if (startPoint) break;
        }
    }
    
    if (startPoint && !draggingLine) {
        draggingLine = {
            points: [startPoint],
            color: startColor,
            fromHub: hubs.some(h => distance(startPoint, h) < 30)
        };
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mouseup', (e) => {
    if (!mouse.isDown || !draggingLine) {
        mouse.isDown = false;
        draggingLine = null;
        return;
    }
    
    const rect = canvas.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    
    // Check if ending on a valid target
    let endPoint = null;
    let endHub = null;
    let endStation = null;
    
    for (let hub of hubs) {
        if (distance({ x: endX, y: endY }, hub) < hub.radius + 10) {
            endPoint = { x: hub.x, y: hub.y };
            endHub = hub;
            break;
        }
    }
    
    if (!endPoint) {
        for (let station of stations) {
            if (distance({ x: endX, y: endY }, station) < station.radius + 10 && !station.completed && !station.satisfied) {
                endPoint = { x: station.x, y: station.y };
                endStation = station;
                break;
            }
        }
    }
    
    if (endPoint && draggingLine.points.length > 0) {
        const startPoint = draggingLine.points[0];
        
        // Don't connect to same point
        if (distance(startPoint, endPoint) > 10) {
            if (draggingLine.extending && draggingLine.line) {
                // Extend existing line
                draggingLine.line.addPoint(endPoint.x, endPoint.y);
                if (endHub) draggingLine.line.hubs.add(endHub.id);
                if (endStation) draggingLine.line.stations.add(endStation.id);
            } else {
                // Create new line
                const newLine = new Line(draggingLine.color);
                newLine.addPoint(startPoint.x, startPoint.y);
                newLine.addPoint(endPoint.x, endPoint.y);
                
                // Track connected entities
                for (let hub of hubs) {
                    if (distance(startPoint, hub) < 30 || distance(endPoint, hub) < 30) {
                        newLine.hubs.add(hub.id);
                    }
                }
                for (let station of stations) {
                    if (distance(startPoint, station) < 30 || distance(endPoint, station) < 30) {
                        newLine.stations.add(station.id);
                    }
                }
                
                lines.push(newLine);
                
                // Spawn a train on this line
                trains.push(new Train(newLine));
            }
            
            updateUI();
        }
    }
    
    mouse.isDown = false;
    draggingLine = null;
});

// Game loop
let lastTime = 0;

function gameLoop(currentTime) {
    const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;
    
    if (gameState === 'playing') {
        update(deltaTime);
    }
    
    render();
    
    requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
    // Limit deltaTime to prevent large jumps
    deltaTime = Math.min(deltaTime, 0.1);
    
    // Update hubs
    hubs.forEach(hub => hub.update(deltaTime));
    
    // Update stations (satisfied stations continue animating)
    stations.forEach(station => station.update(deltaTime));
    
    // Remove completed stations after fade out (optional optimization)
    // stations = stations.filter(s => !s.completed);
    
    // Update trains
    trains.forEach(train => train.update(deltaTime));
    
    // Update particles
    particles = particles.filter(p => {
        p.update(deltaTime);
        return p.life > 0;
    });
    
    updateUI();
}

function render() {
    // Clear canvas
    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid background
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 50;
    
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Draw lines
    lines.forEach(line => line.draw(ctx));
    
    // Draw dragging line
    if (draggingLine && draggingLine.points.length > 0) {
        ctx.strokeStyle = draggingLine.color;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.setLineDash([10, 5]);
        
        ctx.beginPath();
        ctx.moveTo(draggingLine.points[0].x, draggingLine.points[0].y);
        if (draggingLine.points.length > 1) {
            for (let i = 1; i < draggingLine.points.length; i++) {
                ctx.lineTo(draggingLine.points[i].x, draggingLine.points[i].y);
            }
        }
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
        
        ctx.setLineDash([]);
    }
    
    // Draw hubs
    hubs.forEach(hub => hub.draw(ctx));
    
    // Draw stations (draw satisfied ones last so they appear on top)
    const normalStations = stations.filter(s => !s.satisfied && !s.completed);
    const satisfiedStations = stations.filter(s => s.satisfied && !s.completed);
    
    normalStations.forEach(station => station.draw(ctx));
    satisfiedStations.forEach(station => station.draw(ctx));
    
    // Draw trains
    trains.forEach(train => train.draw(ctx));
    
    // Draw particles
    particles.forEach(p => p.draw(ctx));
}

function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('delivered').textContent = `${wordsDelivered}/${totalWords}`;
    document.getElementById('lines').textContent = lines.length;
}

function startGame() {
    document.getElementById('startScreen').style.display = 'none';
    gameState = 'playing';
    initGame();
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function restartGame() {
    document.getElementById('gameOverScreen').style.display = 'none';
    gameState = 'playing';
    initGame();
}

function gameOver() {
    gameState = 'gameover';
    document.getElementById('gameOverTitle').textContent = 'GAME OVER';
    document.getElementById('gameOverMessage').textContent = 'A station ran out of patience!';
    document.getElementById('finalScore').textContent = `Score: ${score}`;
    document.getElementById('gameOverScreen').style.display = 'flex';
}

function gameWin() {
    gameState = 'win';
    document.getElementById('gameOverTitle').textContent = 'VICTORY!';
    document.getElementById('gameOverMessage').textContent = 'You delivered all words successfully!';
    document.getElementById('finalScore').textContent = `Final Score: ${score}`;
    document.getElementById('gameOverScreen').style.display = 'flex';
}

// Initial render
resizeCanvas();
render();
