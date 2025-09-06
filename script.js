/**
 * Epidemic Spread Simulator - JavaScript Implementation
 * Interactive SIR Model with Canvas Animation and Real-time Charting
 * 
 * Author: GitHub Copilot
 * Features: HTML5 Canvas, Chart.js, Performance Optimization
 */

// ===== Global Variables =====
let canvas, ctx, chart;
let animationId = null;
let isRunning = false;
let people = [];
let simulationData = {
    days: [],
    healthy: [],
    infected: [],
    recovered: [],
    vaccinated: []
};

// Simulation parameters
let params = {
    population: 200,
    infectionRate: 2.5,
    recoveryRate: 0.1,
    vaccinationRate: 0.5,
    maskUsage: 60,
    simulationSpeed: 1.0
};

// Simulation state
let state = {
    day: 0,
    frameCount: 0,
    lastTime: 0,
    peakInfected: 0,
    fps: 0
};

// Performance optimization
const INFECTION_RADIUS = 15;
const PERSON_SIZE = 3;
const FPS_UPDATE_INTERVAL = 60;

// ===== Person Class =====
class Person {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2; // Random velocity X
        this.vy = (Math.random() - 0.5) * 2; // Random velocity Y
        this.status = 'healthy'; // healthy, infected, recovered, vaccinated
        this.infectionTime = 0;
        this.size = PERSON_SIZE;
        this.hasMask = Math.random() < (params.maskUsage / 100);
    }

    update() {
        // Update position
        this.x += this.vx * params.simulationSpeed;
        this.y += this.vy * params.simulationSpeed;

        // Bounce off walls
        if (this.x <= this.size || this.x >= canvas.width - this.size) {
            this.vx *= -1;
            this.x = Math.max(this.size, Math.min(canvas.width - this.size, this.x));
        }
        if (this.y <= this.size || this.y >= canvas.height - this.size) {
            this.vy *= -1;
            this.y = Math.max(this.size, Math.min(canvas.height - this.size, this.y));
        }

        // Update infection status
        if (this.status === 'infected') {
            this.infectionTime += params.simulationSpeed;
            
            // Recovery logic
            if (Math.random() < params.recoveryRate * params.simulationSpeed / 60) {
                this.status = 'recovered';
                this.infectionTime = 0;
            }
        }

        // Vaccination logic (only for healthy people)
        if (this.status === 'healthy' && Math.random() < (params.vaccinationRate / 100) * params.simulationSpeed / 60 / 100) {
            this.status = 'vaccinated';
        }
    }

    draw() {
        const colors = {
            healthy: '#4ecdc4',
            infected: '#ff6b6b',
            recovered: '#ffd93d',
            vaccinated: '#6c5ce7'
        };

        ctx.fillStyle = colors[this.status];
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Draw mask indicator (small white circle)
        if (this.hasMask && this.status !== 'recovered' && this.status !== 'vaccinated') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(this.x, this.y - this.size - 2, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    getDistance(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    canInfect(other) {
        return this.status === 'infected' && 
               other.status === 'healthy' && 
               this.getDistance(other) < INFECTION_RADIUS;
    }

    tryInfect(other) {
        if (!this.canInfect(other)) return false;

        // Calculate infection probability
        let infectionProb = params.infectionRate / 100 * params.simulationSpeed / 60;
        
        // Reduce infection probability based on mask usage
        const maskEffectiveness = 0.8; // 80% effectiveness when worn
        if (this.hasMask) infectionProb *= (1 - maskEffectiveness);
        if (other.hasMask) infectionProb *= (1 - maskEffectiveness);

        if (Math.random() < infectionProb) {
            other.status = 'infected';
            other.infectionTime = 0;
            return true;
        }
        return false;
    }
}

// ===== Initialization Functions =====
function initializeCanvas() {
    canvas = document.getElementById('simulation-canvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

function initializeChart() {
    const chartCanvas = document.getElementById('epidemic-chart');
    const chartCtx = chartCanvas.getContext('2d');

    chart = new Chart(chartCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Healthy',
                    data: [],
                    borderColor: '#4ecdc4',
                    backgroundColor: 'rgba(78, 205, 196, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Infected',
                    data: [],
                    borderColor: '#ff6b6b',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Recovered',
                    data: [],
                    borderColor: '#ffd93d',
                    backgroundColor: 'rgba(255, 217, 61, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Vaccinated',
                    data: [],
                    borderColor: '#6c5ce7',
                    backgroundColor: 'rgba(108, 92, 231, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff',
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(26, 26, 29, 0.9)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#3a3a3d',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Days',
                        color: '#b3b3b3'
                    },
                    ticks: {
                        color: '#b3b3b3'
                    },
                    grid: {
                        color: '#3a3a3d'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Number of People',
                        color: '#b3b3b3'
                    },
                    ticks: {
                        color: '#b3b3b3'
                    },
                    grid: {
                        color: '#3a3a3d'
                    }
                }
            },
            elements: {
                point: {
                    radius: 0,
                    hoverRadius: 5
                }
            }
        }
    });
}

function createPeople() {
    people = [];
    const margin = 20;
    
    for (let i = 0; i < params.population; i++) {
        const x = margin + Math.random() * (canvas.width - 2 * margin);
        const y = margin + Math.random() * (canvas.height - 2 * margin);
        people.push(new Person(x, y));
    }

    // Start with one infected person
    if (people.length > 0) {
        people[0].status = 'infected';
    }
}

// ===== Simulation Logic =====
function updateSimulation() {
    // Update all people
    people.forEach(person => person.update());

    // Check for infections
    for (let i = 0; i < people.length; i++) {
        if (people[i].status !== 'infected') continue;
        
        for (let j = 0; j < people.length; j++) {
            if (i === j) continue;
            people[i].tryInfect(people[j]);
        }
    }

    // Update statistics every 60 frames (approximately 1 second at 60 FPS)
    if (state.frameCount % Math.max(1, Math.floor(60 / params.simulationSpeed)) === 0) {
        updateStatistics();
        state.day++;
    }

    state.frameCount++;
}

function updateStatistics() {
    const counts = {
        healthy: 0,
        infected: 0,
        recovered: 0,
        vaccinated: 0
    };

    people.forEach(person => {
        counts[person.status]++;
    });

    // Update peak infected
    if (counts.infected > state.peakInfected) {
        state.peakInfected = counts.infected;
    }

    // Update UI
    document.getElementById('healthy-count').textContent = counts.healthy;
    document.getElementById('infected-count').textContent = counts.infected;
    document.getElementById('recovered-count').textContent = counts.recovered;
    document.getElementById('vaccinated-count').textContent = counts.vaccinated;
    document.getElementById('day-count').textContent = state.day;
    document.getElementById('peak-infected').textContent = state.peakInfected;

    // Update chart data
    simulationData.days.push(state.day);
    simulationData.healthy.push(counts.healthy);
    simulationData.infected.push(counts.infected);
    simulationData.recovered.push(counts.recovered);
    simulationData.vaccinated.push(counts.vaccinated);

    // Keep only last 200 data points for performance
    if (simulationData.days.length > 200) {
        simulationData.days.shift();
        simulationData.healthy.shift();
        simulationData.infected.shift();
        simulationData.recovered.shift();
        simulationData.vaccinated.shift();
    }

    updateChart();
}

function updateChart() {
    chart.data.labels = [...simulationData.days];
    chart.data.datasets[0].data = [...simulationData.healthy];
    chart.data.datasets[1].data = [...simulationData.infected];
    chart.data.datasets[2].data = [...simulationData.recovered];
    chart.data.datasets[3].data = [...simulationData.vaccinated];
    chart.update('none'); // No animation for better performance
}

// ===== Rendering =====
function render() {
    // Clear canvas
    ctx.fillStyle = '#0a0a0b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all people
    people.forEach(person => person.draw());

    // Draw infection radius for debugging (optional)
    if (false) { // Set to true for debugging
        ctx.strokeStyle = 'rgba(255, 107, 107, 0.2)';
        ctx.lineWidth = 1;
        people.forEach(person => {
            if (person.status === 'infected') {
                ctx.beginPath();
                ctx.arc(person.x, person.y, INFECTION_RADIUS, 0, Math.PI * 2);
                ctx.stroke();
            }
        });
    }
}

// ===== Animation Loop =====
function gameLoop(currentTime) {
    if (!isRunning) return;

    // Calculate FPS
    if (currentTime - state.lastTime >= 1000) {
        state.fps = Math.round(state.frameCount * 1000 / (currentTime - state.lastTime));
        if (state.frameCount % FPS_UPDATE_INTERVAL === 0) {
            document.getElementById('fps-display').textContent = state.fps;
        }
        state.lastTime = currentTime;
        state.frameCount = 0;
    }

    updateSimulation();
    render();

    animationId = requestAnimationFrame(gameLoop);
}

// ===== Control Functions =====
function startSimulation() {
    if (isRunning) return;
    
    isRunning = true;
    document.getElementById('start-pause-btn').innerHTML = '⏸️ Pause';
    state.lastTime = performance.now();
    animationId = requestAnimationFrame(gameLoop);
}

function pauseSimulation() {
    if (!isRunning) return;
    
    isRunning = false;
    document.getElementById('start-pause-btn').innerHTML = '▶️ Start';
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

function resetSimulation() {
    pauseSimulation();
    
    // Reset state
    state.day = 0;
    state.frameCount = 0;
    state.peakInfected = 0;
    
    // Clear simulation data
    simulationData.days = [];
    simulationData.healthy = [];
    simulationData.infected = [];
    simulationData.recovered = [];
    simulationData.vaccinated = [];
    
    // Recreate people
    createPeople();
    
    // Update statistics
    updateStatistics();
    
    // Clear chart
    chart.data.labels = [];
    chart.data.datasets.forEach(dataset => dataset.data = []);
    chart.update();
    
    // Re-render
    render();
}

// ===== Event Listeners =====
function setupEventListeners() {
    // Control sliders
    const sliders = {
        'population': (value) => {
            params.population = parseInt(value);
            document.getElementById('population-value').textContent = value;
            if (!isRunning) {
                createPeople();
                updateStatistics();
                render();
            }
        },
        'infection-rate': (value) => {
            params.infectionRate = parseFloat(value);
            document.getElementById('infection-rate-value').textContent = value;
        },
        'recovery-rate': (value) => {
            params.recoveryRate = parseFloat(value);
            document.getElementById('recovery-rate-value').textContent = parseFloat(value).toFixed(2);
        },
        'vaccination-rate': (value) => {
            params.vaccinationRate = parseFloat(value);
            document.getElementById('vaccination-rate-value').textContent = value + '%';
        },
        'mask-usage': (value) => {
            params.maskUsage = parseInt(value);
            document.getElementById('mask-usage-value').textContent = value + '%';
            // Update mask status for existing people
            people.forEach(person => {
                person.hasMask = Math.random() < (params.maskUsage / 100);
            });
        },
        'sim-speed': (value) => {
            params.simulationSpeed = parseFloat(value);
            document.getElementById('sim-speed-value').textContent = value + 'x';
        }
    };

    Object.keys(sliders).forEach(id => {
        const slider = document.getElementById(id);
        slider.addEventListener('input', (e) => sliders[id](e.target.value));
        // Initialize display values
        sliders[id](slider.value);
    });

    // Control buttons
    document.getElementById('start-pause-btn').addEventListener('click', () => {
        if (isRunning) {
            pauseSimulation();
        } else {
            startSimulation();
        }
    });

    document.getElementById('reset-btn').addEventListener('click', resetSimulation);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                if (isRunning) {
                    pauseSimulation();
                } else {
                    startSimulation();
                }
                break;
            case 'KeyR':
                if (e.ctrlKey) {
                    e.preventDefault();
                    resetSimulation();
                }
                break;
        }
    });
}

// ===== Initialization =====
function initialize() {
    initializeCanvas();
    initializeChart();
    setupEventListeners();
    createPeople();
    updateStatistics();
    render();
    
    console.log('🦠 Epidemic Spread Simulator initialized!');
    console.log('Controls: Spacebar = Start/Pause, Ctrl+R = Reset');
}

// ===== Start the application when DOM is loaded =====
document.addEventListener('DOMContentLoaded', initialize);
