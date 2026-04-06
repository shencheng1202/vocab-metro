// Vocab Metro - English Vocabulary Learning Game
// Level-Based Progression System

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameState = 'start'; // start, playing, levelComplete, gameover, win
let currentLevel = 1;
let score = 0;
let wordsDeliveredInLevel = 0;
let totalWordsDelivered = 0;
let lines = [];
let trains = [];
let particles = [];
let penaltyTexts = []; // Floating penalty text effects
let hoveredStation = null;

// Global game timer (30 minutes = 1800 seconds)
let globalGameTime = 1800; // 30 minutes in seconds
const maxGameTime = 1800;
const PENALTY_TIME = 180; // 3 minutes penalty for incorrect delivery

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

// HARDCODED DEFAULT: Default vocabulary data (20 words) with detailed etymology hints
// This is hardcoded to avoid CORS issues when running as a static file
const defaultVocabData = [
    { word: "Torment", sentence: "The guilt of his past mistakes continued to ________ him for decades, even after he apologized to those he had hurt and spent his life trying to make amends.", hint: "torquere (to twist) + ment (noun suffix)" },
    { word: "Indulgent", sentence: "My grandmother is always ________ with her grandchildren, spoiling them with sweet treats and letting them stay up late whenever they visit her countryside home.", hint: "in (into) + dulge (to sweeten) + ent (adjective suffix)" },
    { word: "Abandon", sentence: "When she realized the mission was impossible and all hope was lost, she chose to ________ the project that had consumed her years of hard work and dedication.", hint: "a (intensive) + bandon (to bind)" },
    { word: "Intrigue", sentence: "The mysterious note left on the doorstep, with its cryptic symbols and handwritten message, continued to ________ the detective long after she finished her initial investigation.", hint: "in (into) + trigue (from French intriguer), root from Latin tricari (to trick)" },
    { word: "Absurd", sentence: "It is ________ to believe that you can master a foreign language in just a week, no matter how many flashcards you memorize or apps you use.", hint: "ab (away) + surdus (deaf, stupid)" },
    { word: "Rite", sentence: "In many cultures, a coming-of-age ________ marks the moment when a young person transitions from childhood to adulthood, often with special ceremonies and traditions.", hint: "from Latin ritus (custom, ceremony), no separable affixes" },
    { word: "Catastrophe", sentence: "If we fail to address climate change and ignore the warnings of scientists, we will face an environmental ________ that will alter life on Earth for generations to come.", hint: "cata (down) + strophe (turn)" },
    { word: "Reverie", sentence: "She fell into a peaceful ________ while staring out the window at the falling snow, imagining herself walking through a quiet forest and listening to the crunch of snow under her boots.", hint: "re (back) + ver (to wander) + ie (noun suffix)" },
    { word: "Perceptive", sentence: "The ________ teacher noticed the subtle change in her student's mood and realized he was struggling with anxiety, so she pulled him aside to talk and offer support.", hint: "per (through) + capere (to take, seize) + tive (adjective suffix)" },
    { word: "Contemplate", sentence: "Every morning, the elderly poet sits by the lake to ________ the meaning of life and draw inspiration from the quiet beauty of nature around him.", hint: "con (intensive) + templum (space for observing omens) + ate (verb suffix)" },
    { word: "Apparition", sentence: "As the moon rose over the old, abandoned castle, an eerie ________ appeared at the top of the tower, making the hikers freeze in fear and wonder if it was a trick of the light.", hint: "ap (intensive) + parere (to appear) + ition (noun suffix)" },
    { word: "Discipline", sentence: "To become a professional athlete, you must have unwavering ________, following a strict training schedule and making sacrifices that most people are unwilling to make.", hint: "dis (intensive) + cipline (from Latin disciplina), root from discere (to learn)" },
    { word: "Trifle", sentence: "The argument started over a mere ________, a forgotten cup of coffee left on the counter, but it escalated quickly and left the two friends not speaking for weeks.", hint: "from French trufle (little trinket), no separable affixes" },
    { word: "Console", sentence: "I tried to ________ my best friend after she lost her beloved pet, sitting with her for hours and reminding her of all the happy memories they had shared together.", hint: "con (together) + solari (to comfort)" },
    { word: "Misfortune", sentence: "Though he faced great ________ when his business collapsed and he lost his home, he refused to give up and worked tirelessly to rebuild his life from the ground up.", hint: "mis (bad) + fortune (luck), from Latin fortuna (chance)" },
    { word: "Enlighten", sentence: "The wise professor used real-life stories and thought-provoking questions to ________ her students about the complexities of human behavior and social justice.", hint: "en (to cause to be) + light (light) + en (verb suffix)" },
    { word: "Tame", sentence: "It takes patience and gentle care to ________ a wild animal, as you must earn its trust slowly and never force it to do something it is afraid to attempt.", hint: "from Old English tam (subdued), no separable affixes" },
    { word: "Condemn", sentence: "The international community was quick to ________ the unjust act of violence, as it violated basic human rights and broke the peace treaty all nations had signed.", hint: "con (intensive) + damnare (to judge, condemn)" },
    { word: "Tedious", sentence: "Sorting through thousands of old documents and typing up handwritten notes is a ________ task, but it is essential for preserving the history of the small town.", hint: "taedere (to weary) + ious (adjective suffix)" },
    { word: "Extraordinary", sentence: "The young musician gave an ________ performance at the concert hall, playing the piano with a passion and skill that left the entire audience standing and cheering.", hint: "extra (beyond) + ordinary (common), from Latin ordinarius (regular)" }
];

// Active vocabulary data - starts with default, can be overridden by upload
let allVocabData = [...defaultVocabData];

// Current level vocabulary - dynamically generated based on active data
let currentVocabData = [];

// Dynamic level data - recalculated based on vocabulary size
let levelData = [];
let totalLevels = 5; // Default, will be recalculated for custom data

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
        this.radius = 22;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.hasWord = true;
    }

    update(deltaTime) {
        this.pulsePhase += deltaTime * 2;
    }

    draw(ctx) {
        // Glow effect
        const pulse = Math.sin(this.pulsePhase) * 0.3 + 0.7;
        ctx.shadowBlur = 15 * pulse;
        ctx.shadowColor = '#ff6b6b';
        
        // Main circle - clean, minimal
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ff6b6b';
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // Word text - clean small font
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.word, this.x, this.y);
    }
}

class Station {
    constructor(x, y, word, sentence, id) {
        this.x = x;
        this.y = y;
        this.word = word; // Hidden answer - not displayed in UI
        this.sentence = sentence;
        this.id = id;
        this.radius = 18;
        // Extended for ~30 minute gameplay: 7.5 minutes per level, ~1.875 minutes per word
        this.patience = 450; // 7.5 minutes in seconds (450s)
        this.maxPatience = 450;
        this.patienceDecay = 0.5; // Slower decay for prolonged gameplay
        this.completed = false;
        this.satisfied = false;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.successTimer = 0;
        this.successPulsePhase = 0;
        this.fadeOutAlpha = 1;
        this.hoverPhase = 0;
        // Error feedback effects
        this.errorFlashTimer = 0;
        this.errorShakeTimer = 0;
        this.shakeOffset = { x: 0, y: 0 };
    }

    triggerErrorFeedback() {
        this.errorFlashTimer = 0.5; // 0.5 seconds red flash
        this.errorShakeTimer = 0.5; // 0.5 seconds shake
    }

    update(deltaTime) {
        // Update error feedback timers
        if (this.errorFlashTimer > 0) {
            this.errorFlashTimer -= deltaTime;
        }
        if (this.errorShakeTimer > 0) {
            this.errorShakeTimer -= deltaTime;
            // Calculate shake offset
            this.shakeOffset.x = (Math.random() - 0.5) * 6;
            this.shakeOffset.y = (Math.random() - 0.5) * 6;
        } else {
            this.shakeOffset.x = 0;
            this.shakeOffset.y = 0;
        }
        
        if (this.satisfied) {
            this.successTimer -= deltaTime;
            this.successPulsePhase += deltaTime * 4;
            
            if (this.successTimer < 0.5) {
                this.fadeOutAlpha = this.successTimer / 0.5;
            }
            
            if (this.successTimer <= 0) {
                this.completed = true;
                this.fadeOutAlpha = 0;
            }
            return;
        }
        
        if (this.completed) return;
        
        this.patience -= this.patienceDecay * deltaTime;
        this.pulsePhase += deltaTime * 3;
        
        // Check hover
        const isHovered = distance(mouse, this) < this.radius + 10;
        if (isHovered) {
            this.hoverPhase = Math.min(this.hoverPhase + deltaTime * 5, 1);
            hoveredStation = this;
        } else {
            this.hoverPhase = Math.max(this.hoverPhase - deltaTime * 5, 0);
        }
        
        if (this.patience <= 0) {
            gameOver();
        }
    }

    markSatisfied() {
        this.satisfied = true;
        this.successTimer = 2;
        this.fadeOutAlpha = 1;
    }

    draw(ctx) {
        if (this.completed) return;
        
        if (this.satisfied) {
            this.drawSuccessState(ctx);
            return;
        }
        
        // Apply shake offset for error feedback
        const drawX = this.x + this.shakeOffset.x;
        const drawY = this.y + this.shakeOffset.y;
        
        const patienceRatio = this.patience / this.maxPatience;
        const ringColor = patienceRatio > 0.5 ? '#6bcf7f' : patienceRatio > 0.25 ? '#ffd93d' : '#ff6b6b';
        
        // Error flash effect (red glow)
        if (this.errorFlashTimer > 0) {
            const flashIntensity = this.errorFlashTimer / 0.5;
            ctx.shadowBlur = 30 * flashIntensity;
            ctx.shadowColor = '#ff0000';
        }
        // Hover glow effect
        else if (this.hoverPhase > 0) {
            ctx.shadowBlur = 20 * this.hoverPhase;
            ctx.shadowColor = '#00d4ff';
        }
        // Urgency glow for low patience
        else if (patienceRatio < 0.25) {
            const pulse = Math.sin(this.pulsePhase) * 0.5 + 0.5;
            ctx.shadowBlur = 15 * pulse;
            ctx.shadowColor = '#ff6b6b';
        }
        
        // Patience ring - visual representation of remaining time
        ctx.beginPath();
        ctx.arc(drawX, drawY, this.radius + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * patienceRatio);
        ctx.strokeStyle = this.errorFlashTimer > 0 ? '#ff3333' : ringColor;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Time indicator text (minutes remaining)
        const minutesLeft = Math.ceil(this.patience / 60);
        ctx.fillStyle = this.errorFlashTimer > 0 ? '#ff3333' : ringColor;
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${minutesLeft}m`, drawX, drawY + this.radius + 15);
        
        // Main shape - speech bubble style (red tint during error)
        ctx.fillStyle = this.errorFlashTimer > 0 ? '#ff6666' : '#ffd93d';
        this.drawSpeechBubble(ctx, drawX, drawY, this.radius);
        
        ctx.shadowBlur = 0;
        
        // Question mark icon (X during error)
        ctx.fillStyle = '#1a1a2e';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (this.errorFlashTimer > 0) {
            ctx.fillText('✗', drawX, drawY - 1);
        } else {
            ctx.fillText('?', drawX, drawY - 1);
        }
    }
    
    drawSpeechBubble(ctx, x, y, r) {
        ctx.beginPath();
        // Main circle
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        // Small tail
        ctx.beginPath();
        ctx.moveTo(x + r * 0.6, y + r * 0.6);
        ctx.lineTo(x + r * 1.2, y + r * 1.2);
        ctx.lineTo(x + r * 0.2, y + r * 0.9);
        ctx.closePath();
        ctx.fill();
    }

    drawSuccessState(ctx) {
        ctx.globalAlpha = this.fadeOutAlpha;
        
        const pulse = Math.sin(this.successPulsePhase) * 0.3 + 0.7;
        const glowSize = 15 + 10 * pulse;
        
        ctx.shadowBlur = glowSize;
        ctx.shadowColor = '#ffd700';
        
        const ringProgress = 1 - (this.successTimer / 2);
        const ringRadius = this.radius + 5 + ringProgress * 8;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 215, 0, ${0.8 * pulse})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.fillStyle = '#6bcf7f';
        this.drawSpeechBubble(ctx, this.x, this.y, this.radius);
        
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✓', this.x, this.y);
        
        ctx.globalAlpha = 1;
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
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.stroke();
        
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
        this.position = 0;
        this.speed = 0.08; // Slower train speed for ~30 minute gameplay
        this.direction = 1;
        this.carrying = null;
        this.radius = 7;
        this.waitingTime = 0;
        this.state = 'moving';
    }

    update(deltaTime) {
        if (this.state === 'moving') {
            this.position += (this.speed * deltaTime) * this.direction;
            
            if (this.position >= 1) {
                this.position = 1;
                this.direction = -1;
            } else if (this.position <= 0) {
                this.position = 0;
                this.direction = 1;
            }
            
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
        
        if (!this.carrying) {
            for (let hub of hubs) {
                if (distance(pos, hub) < 30 && hub.hasWord) {
                    this.carrying = hub.word;
                    hub.hasWord = false;
                    this.state = 'loading';
                    this.waitingTime = 0.3;
                    createParticles(hub.x, hub.y, '#ff6b6b');
                    return;
                }
            }
        }
        
        if (this.carrying) {
            for (let station of stations) {
                if (station.satisfied || station.completed) continue;
                
                // Check if train is at this station
                if (distance(pos, station) < 30) {
                    // Check if word matches
                    if (station.word === this.carrying) {
                        // CORRECT delivery
                        station.markSatisfied();
                        
                        this.carrying = null;
                        this.state = 'unloading';
                        this.waitingTime = 0.3;
                        
                        score += Math.floor(station.patience) * 10;
                        wordsDeliveredInLevel++;
                        totalWordsDelivered++;
                        
                        createParticles(station.x, station.y, '#ffd700');
                        createParticles(station.x, station.y, '#6bcf7f');
                        
                        for (let hub of hubs) {
                            if (hub.word === station.word) {
                                hub.hasWord = true;
                            }
                        }
                        
                        // ABSOLUTE RULE: Line destruction on EVERY delivery attempt
                        // This is unconditional - happens on 1st try or 10th try, CORRECT or INCORRECT
                        // A drawn line must NEVER persist after train finishes its journey
                        
                        // DESTROY: Remove the transit line (ABSOLUTE - no exceptions)
                        const lineIndex = lines.indexOf(this.line);
                        if (lineIndex > -1) {
                            lines.splice(lineIndex, 1);
                        }
                        
                        // DESTROY: Remove the train
                        const trainIndex = trains.indexOf(this);
                        if (trainIndex > -1) {
                            trains.splice(trainIndex, 1);
                        }
                        
                        // DESTROY: Remove the Word Hub (yellow ball) on correct delivery
                        const hubIndex = hubs.findIndex(h => h.word === station.word);
                        if (hubIndex > -1) {
                            hubs.splice(hubIndex, 1);
                        }
                        
                        // Check if level is complete (all words in current level delivered)
                        // Dynamic: handles any number of words (1-4) in the final level
                        if (wordsDeliveredInLevel >= currentVocabData.length) {
                            // Clear all visual entities immediately
                            hubs = [];
                            stations = [];
                            lines = [];
                            trains = [];
                            // Show level complete screen after a short delay
                            setTimeout(() => {
                                levelComplete();
                            }, 500);
                        }
                        return;
                    } else {
                        // INCORRECT delivery - apply penalty AND destroy line only
                        // Word Hub and Station remain on the map
                        this.handleIncorrectDelivery(station);
                        return;
                    }
                }
            }
        }
    }

    handleIncorrectDelivery(station) {
        // ABSOLUTE RULE: Line destruction on EVERY delivery attempt
        // This applies to INCORRECT deliveries as well - line is destroyed immediately
        // Word Hub and Station remain on the map for retry, but line is GONE
        
        // Store the wrong word before clearing it
        const wrongWord = this.carrying;
        
        // Consume the incorrect word
        this.carrying = null;
        this.state = 'unloading';
        this.waitingTime = 0.5;
        
        // CRITICAL FIX: Reset hasWord flag so hub can be used again
        // This allows infinite retry attempts from the same hub
        for (let hub of hubs) {
            if (hub.word === wrongWord) {
                hub.hasWord = true; // Reset so train can pick it up again
            }
        }
        
        // STRICT: Apply exactly 3-minute (180 seconds) penalty to global timer
        globalGameTime = Math.max(0, globalGameTime - PENALTY_TIME);
        
        // ABSOLUTE DESTRUCTION: Remove the transit line (unconditional)
        // This happens on EVERY attempt - line never persists after delivery
        const lineIndex = lines.indexOf(this.line);
        if (lineIndex > -1) {
            lines.splice(lineIndex, 1);
        }
        
        // DESTROY: Remove the train
        const trainIndex = trains.indexOf(this);
        if (trainIndex > -1) {
            trains.splice(trainIndex, 1);
        }
        
        // Trigger visual feedback on station
        station.triggerErrorFeedback();
        
        // Create floating penalty text
        createPenaltyText(station.x, station.y - 30, '-3 Minutes');
        
        // Create red particles for error
        createParticles(station.x, station.y, '#ff0000');
        createParticles(station.x, station.y, '#ff6666');
        
        // Check if game time dropped to zero
        if (globalGameTime <= 0) {
            globalGameTime = 0;
            gameOver();
        }
    }

    draw(ctx) {
        const pos = getPointOnLine(this.line, this.position);
        
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        
        ctx.strokeStyle = this.line.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        if (this.carrying) {
            ctx.fillStyle = '#6bcf7f';
            ctx.font = 'bold 9px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.carrying.substring(0, 3), pos.x, pos.y - 12);
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

// Penalty text effect for incorrect deliveries
class PenaltyText {
    constructor(x, y, text) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.vy = -30; // Float upward
        this.life = 1;
        this.decay = 0.8;
        this.shakePhase = 0;
    }

    update(deltaTime) {
        this.y += this.vy * deltaTime;
        this.life -= this.decay * deltaTime;
        this.shakePhase += deltaTime * 20;
    }

    draw(ctx) {
        ctx.globalAlpha = Math.max(0, this.life);
        
        // Shake effect
        const shakeX = Math.sin(this.shakePhase) * 3;
        
        // Red glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff0000';
        
        // Draw text
        ctx.fillStyle = '#ff3333';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.text, this.x + shakeX, this.y);
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
}

function createParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function createPenaltyText(x, y, text) {
    penaltyTexts.push(new PenaltyText(x, y, text));
}

// Parse uploaded text file into vocabulary data
function parseVocabFile(text) {
    const vocabData = [];
    const lines = text.split('\n').filter(line => line.trim() !== '');
    
    for (const line of lines) {
        // Parse format: "Word: XXX, Sentence: YYY, Hint: ZZZ"
        const wordMatch = line.match(/Word:\s*([^,]+)/i);
        const sentenceMatch = line.match(/Sentence:\s*(.+?)(?=,\s*Hint:|$)/i);
        const hintMatch = line.match(/Hint:\s*(.+)$/i);
        
        if (wordMatch && sentenceMatch) {
            vocabData.push({
                word: wordMatch[1].trim(),
                sentence: sentenceMatch[1].trim(),
                hint: hintMatch ? hintMatch[1].trim() : 'No hint available'
            });
        }
    }
    
    return vocabData;
}

// Generate level data dynamically based on vocabulary size
function generateLevelData(vocabArray) {
    const levels = [];
    const wordsPerLevel = 4;
    
    for (let i = 0; i < vocabArray.length; i += wordsPerLevel) {
        levels.push(vocabArray.slice(i, i + wordsPerLevel));
    }
    
    return levels;
}

// Handle file upload from user
function handleFileUpload(event) {
    const file = event.target.files[0];
    const statusEl = document.getElementById('uploadStatus');
    
    if (!file) return;
    
    if (!file.name.endsWith('.txt')) {
        statusEl.textContent = '❌ Please upload a .txt file';
        statusEl.className = 'error';
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const text = e.target.result;
        const parsedData = parseVocabFile(text);
        
        if (parsedData.length === 0) {
            statusEl.textContent = '❌ No valid vocabulary found in file';
            statusEl.className = 'error';
            return;
        }
        
        if (parsedData.length < 4) {
            statusEl.textContent = '❌ Need at least 4 words for a level';
            statusEl.className = 'error';
            return;
        }
        
        // Override default vocabulary with custom data
        allVocabData = [...parsedData]; // Create a copy to avoid reference issues
        
        // Generate dynamic level data
        levelData = generateLevelData(allVocabData);
        totalLevels = levelData.length;
        
        console.log(`Loaded ${parsedData.length} words, ${totalLevels} levels`);
        
        statusEl.textContent = `✅ Loaded ${parsedData.length} words, ${totalLevels} levels`;
        statusEl.className = '';
        
        // Auto-start game after short delay
        setTimeout(() => {
            startGame();
        }, 1000);
    };
    
    reader.onerror = function() {
        statusEl.textContent = '❌ Error reading file';
        statusEl.className = 'error';
    };
    
    reader.readAsText(file);
}

// Initialize level - clean map with dynamic number of word-sentence pairs
function initLevel(level) {
    console.log('initLevel called:', level);
    currentLevel = level;
    currentVocabData = levelData[level - 1]; // Get words for this level
    
    console.log('currentVocabData:', currentVocabData);
    
    // Safety check: ensure currentVocabData exists
    if (!currentVocabData || currentVocabData.length === 0) {
        console.error('No vocabulary data for level', level);
        gameWin();
        return;
    }
    
    wordsDeliveredInLevel = 0;
    console.log('Creating', currentVocabData.length, 'hubs and stations');
    
    // Clear the map completely
    hubs = [];
    stations = [];
    lines = [];
    trains = [];
    particles = [];
    hoveredStation = null;
    
    // Create hubs on left side - spacious layout (adapts to any number of words)
    const hubX = canvas.width * 0.2;
    const hubSpacing = canvas.height / (currentVocabData.length + 1);
    
    currentVocabData.forEach((data, i) => {
        const y = hubSpacing * (i + 1);
        hubs.push(new Hub(hubX, y, data.word, i));
    });
    
    // Create stations on right side (shuffled order for challenge)
    const stationX = canvas.width * 0.8;
    const shuffledIndices = [...Array(currentVocabData.length).keys()].sort(() => Math.random() - 0.5);
    
    shuffledIndices.forEach((originalIndex, i) => {
        const data = currentVocabData[originalIndex];
        const y = hubSpacing * (i + 1);
        stations.push(new Station(stationX, y, data.word, data.sentence, originalIndex));
    });
    
    updateUI();
    console.log('initLevel complete, hubs:', hubs.length, 'stations:', stations.length);
}

// Input handling
canvas.addEventListener('mousedown', (e) => {
    if (gameState !== 'playing') return;
    
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.isDown = true;
    
    let startPoint = null;
    let startColor = null;
    let selectedHub = null;
    
    // STRICT 1-TO-1 RULE: Check if hub already has an active line
    for (let hub of hubs) {
        if (distance(mouse, hub) < hub.radius + 10) {
            // Check if this hub already has an active line
            const existingLine = lines.find(l => l.hubs.has(hub.id));
            if (existingLine) {
                // Hub already has a line - BLOCK new drawing attempt
                // Player must wait for current train to finish
                return;
            }
            // Hub is free - allow drawing
            startPoint = { x: hub.x, y: hub.y };
            selectedHub = hub;
            startColor = lineColors[lines.length % lineColors.length];
            break;
        }
    }
    
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
            fromHub: selectedHub !== null
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
        
        if (distance(startPoint, endPoint) > 10) {
            if (draggingLine.extending && draggingLine.line) {
                draggingLine.line.addPoint(endPoint.x, endPoint.y);
                if (endHub) draggingLine.line.hubs.add(endHub.id);
                if (endStation) draggingLine.line.stations.add(endStation.id);
            } else {
                const newLine = new Line(draggingLine.color);
                newLine.addPoint(startPoint.x, startPoint.y);
                newLine.addPoint(endPoint.x, endPoint.y);
                
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
    deltaTime = Math.min(deltaTime, 0.1);
    
    // Update global game timer
    if (gameState === 'playing') {
        globalGameTime -= deltaTime;
        if (globalGameTime <= 0) {
            globalGameTime = 0;
            gameOver();
        }
    }
    
    hoveredStation = null;
    
    hubs.forEach(hub => hub.update(deltaTime));
    stations.forEach(station => station.update(deltaTime));
    trains.forEach(train => train.update(deltaTime));
    
    particles = particles.filter(p => {
        p.update(deltaTime);
        return p.life > 0;
    });
    
    // Update penalty texts
    penaltyTexts = penaltyTexts.filter(pt => {
        pt.update(deltaTime);
        return pt.life > 0;
    });
    
    updateUI();
    updateInfoPanel();
}

function render() {
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
    
    lines.forEach(line => line.draw(ctx));
    
    if (draggingLine && draggingLine.points.length > 0) {
        ctx.strokeStyle = draggingLine.color;
        ctx.lineWidth = 5;
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
    
    hubs.forEach(hub => hub.draw(ctx));
    
    const normalStations = stations.filter(s => !s.satisfied && !s.completed);
    const satisfiedStations = stations.filter(s => s.satisfied && !s.completed);
    
    normalStations.forEach(station => station.draw(ctx));
    satisfiedStations.forEach(station => station.draw(ctx));
    
    trains.forEach(train => train.draw(ctx));
    particles.forEach(p => p.draw(ctx));
    
    // Draw penalty texts on top
    penaltyTexts.forEach(pt => pt.draw(ctx));
    
    // Draw etymology hint bar at bottom
    drawEtymologyHintBar(ctx);
}

function updateUI() {
    const scoreEl = document.getElementById('score');
    const levelEl = document.getElementById('level');
    const deliveredEl = document.getElementById('delivered');
    const linesEl = document.getElementById('lines');
    const totalProgressEl = document.getElementById('totalProgress');
    const progressBarEl = document.getElementById('progressBar');
    
    if (scoreEl) scoreEl.textContent = score;
    if (levelEl) levelEl.textContent = `${currentLevel}/${totalLevels}`;
    if (deliveredEl) {
        const totalInLevel = currentVocabData ? currentVocabData.length : 4;
        deliveredEl.textContent = `${wordsDeliveredInLevel}/${totalInLevel}`;
    }
    if (linesEl) linesEl.textContent = lines.length;
    if (totalProgressEl) totalProgressEl.textContent = `${totalWordsDelivered}/20`;
    
    // Update progress bar if it exists
    if (progressBarEl) {
        const progressPercent = (totalWordsDelivered / 20) * 100;
        progressBarEl.style.width = `${progressPercent}%`;
    }
    
    // Update global timer display
    const timerElement = document.getElementById('globalTimer');
    if (timerElement) {
        const minutes = Math.floor(globalGameTime / 60);
        const seconds = Math.floor(globalGameTime % 60);
        timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Change color when time is low
        if (globalGameTime < 300) { // Less than 5 minutes
            timerElement.style.color = '#ff6b6b';
        } else if (globalGameTime < 600) { // Less than 10 minutes
            timerElement.style.color = '#ffd93d';
        } else {
            timerElement.style.color = '#6bcf7f';
        }
    }
    
    // Update total progress display
    const totalWords = allVocabData.length;
    if (totalProgressEl) {
        totalProgressEl.textContent = `${totalWordsDelivered}/${totalWords}`;
    }
}

function updateInfoPanel() {
    const panel = document.getElementById('infoPanel');
    const sentenceText = document.getElementById('sentenceText');
    
    if (hoveredStation && !hoveredStation.satisfied && !hoveredStation.completed) {
        panel.style.opacity = '1';
        // Show sentence with blank - NO answer hint displayed
        sentenceText.textContent = hoveredStation.sentence;
    } else {
        panel.style.opacity = '0';
    }
}

// Draw etymology hint bar at bottom of screen - styled like game stats
function drawEtymologyHintBar(ctx) {
    if (gameState !== 'playing' || !currentVocabData || currentVocabData.length === 0) return;
    
    const wordCount = currentVocabData.length;
    // Dynamic height based on word count
    const barHeight = wordCount <= 2 ? 60 : (wordCount <= 4 ? 90 : 110);
    const barY = canvas.height - barHeight - 10;
    const padding = 20;
    const availableWidth = canvas.width - padding * 2;
    
    // Draw background matching stat-box style
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(padding, barY, availableWidth, barHeight);
    
    // Draw border matching stat-box style (cyan border like Level/Time)
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(padding, barY, availableWidth, barHeight);
    
    // Draw title like stat-box h3
    ctx.fillStyle = '#00d4ff';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('ETYMOLOGY HINTS', canvas.width / 2, barY + 6);
    
    // Dynamic layout: 2 columns, rows based on word count
    const colWidth = availableWidth / 2;
    const rowHeight = wordCount <= 2 ? 25 : 35;
    const startY = barY + 25;
    
    ctx.fillStyle = '#fff';
    ctx.font = '11px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    currentVocabData.forEach((data, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const x = padding + 15 + col * colWidth;
        const y = startY + row * rowHeight;
        
        // Word in bold
        ctx.font = 'bold 11px Arial';
        ctx.fillStyle = '#ffd93d';
        ctx.fillText(data.word + ':', x, y);
        
        // Hint text
        const wordWidth = ctx.measureText(data.word + ': ').width;
        ctx.font = '11px Arial';
        ctx.fillStyle = '#ccc';
        
        // Wrap hint text if too long
        const hintText = data.hint;
        const maxHintWidth = colWidth - 30;
        
        if (ctx.measureText(hintText).width > maxHintWidth) {
            // Truncate with ellipsis
            let truncated = hintText;
            while (ctx.measureText(truncated + '...').width > maxHintWidth && truncated.length > 10) {
                truncated = truncated.slice(0, -1);
            }
            ctx.fillText(truncated + '...', x + wordWidth, y);
        } else {
            ctx.fillText(hintText, x + wordWidth, y);
        }
    });
}

function startGame() {
    console.log('startGame called');
    
    // CRITICAL FIX: Ensure default data is loaded if no custom data uploaded
    // This prevents the game from failing when clicking 'PLAY DEFAULT DATA'
    if (!allVocabData || allVocabData.length === 0) {
        console.log('Loading default vocab data');
        allVocabData = [...defaultVocabData];
    }
    
    console.log('allVocabData length:', allVocabData.length);
    
    // Always regenerate level data from current allVocabData
    levelData = generateLevelData(allVocabData);
    totalLevels = levelData.length;
    
    console.log('Generated levels:', totalLevels);
    
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('uploadStatus').textContent = ''; // Clear upload status
    gameState = 'playing';
    currentLevel = 1;
    score = 0;
    totalWordsDelivered = 0;
    wordsDeliveredInLevel = 0;
    globalGameTime = maxGameTime; // Reset global timer to 30 minutes
    penaltyTexts = []; // Clear any penalty texts
    
    // Clear any existing canvas elements
    hubs = [];
    stations = [];
    lines = [];
    trains = [];
    particles = [];
    
    initLevel(1);
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function levelComplete() {
    gameState = 'levelComplete';
    
    const summary = document.getElementById('levelSummary');
    const levelWords = currentVocabData; // Words from current level
    
    document.getElementById('completedLevelNum').textContent = currentLevel;
    
    let summaryHTML = '<h4>Words Learned in This Level:</h4><ul>';
    levelWords.forEach(data => {
        // Show the completed sentence with the word filled in
        const completedSentence = data.sentence.replace('________', `<strong style="color: #ffd93d;">${data.word}</strong>`);
        summaryHTML += `<li><strong>${data.word}</strong>: ${completedSentence}</li>`;
    });
    summaryHTML += '</ul>';
    
    summary.innerHTML = summaryHTML;
    
    document.getElementById('levelCompleteScreen').style.display = 'flex';
}

function nextLevel() {
    document.getElementById('levelCompleteScreen').style.display = 'none';
    
    // Check if all levels are complete
    if (currentLevel >= totalLevels) {
        // All words completed - show victory screen
        gameWin();
    } else {
        // Advance to next level with new set of words
        gameState = 'playing';
        initLevel(currentLevel + 1);
    }
}

function restartGame() {
    document.getElementById('gameOverScreen').style.display = 'none';
    gameState = 'playing';
    currentLevel = 1;
    score = 0;
    totalWordsDelivered = 0;
    wordsDeliveredInLevel = 0;
    globalGameTime = maxGameTime; // Reset global timer
    penaltyTexts = []; // Clear penalty texts
    
    // Clear all canvas elements
    hubs = [];
    stations = [];
    lines = [];
    trains = [];
    particles = [];
    
    initLevel(1);
}

function gameOver() {
    gameState = 'gameover';
    document.getElementById('gameOverTitle').textContent = 'GAME OVER';
    
    // Check if game over was due to time running out
    if (globalGameTime <= 0) {
        document.getElementById('gameOverMessage').textContent = 'Time ran out! Too many incorrect deliveries.';
    } else {
        document.getElementById('gameOverMessage').textContent = 'A station ran out of patience!';
    }
    
    document.getElementById('finalScore').textContent = `Score: ${score}`;
    document.getElementById('gameOverScreen').style.display = 'flex';
}

function gameWin() {
    gameState = 'win';
    document.getElementById('gameOverTitle').textContent = '🎉 VICTORY!';
    document.getElementById('gameOverMessage').textContent = `You completed all ${totalLevels} levels and mastered 20 vocabulary words!`;
    document.getElementById('finalScore').textContent = `Final Score: ${score}`;
    document.getElementById('gameOverScreen').style.display = 'flex';
}

// Initial render
resizeCanvas();
render();
