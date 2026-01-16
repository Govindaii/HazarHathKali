/**
 * HAZARHATHKALI - Node Graph Visualization
 * ComfyUI-style node network for 1000 Hands
 */

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    categories: [
        { id: 'nature', name: 'NATURE', icon: '🌸', color: '#00ff41', count: 100 },
        { id: 'gratitude', name: 'GRATITUDE', icon: '🙏', color: '#00ffff', count: 100 },
        { id: 'motivation', name: 'MOTIVATION', icon: '💪', color: '#ffd700', count: 100 },
        { id: 'art', name: 'ART', icon: '🎨', color: '#ff69b4', count: 100 },
        { id: 'wellness', name: 'WELLNESS', icon: '🧘', color: '#9370db', count: 100 },
        { id: 'kindness', name: 'KINDNESS', icon: '💝', color: '#ff6347', count: 100 },
        { id: 'humor', name: 'HUMOR', icon: '😊', color: '#98fb98', count: 100 },
        { id: 'spirituality', name: 'SPIRITUALITY', icon: '🕉️', color: '#dda0dd', count: 100 },
        { id: 'science', name: 'SCIENCE', icon: '🌌', color: '#87ceeb', count: 100 },
        { id: 'music', name: 'MUSIC', icon: '🎵', color: '#f0e68c', count: 100 }
    ],
    handsPerCategory: 100,
    totalHands: 1000
};

// ============================================
// STATE
// ============================================
let state = {
    activeHands: 0,
    contentGenerated: 0,
    nodes: [],
    connections: [],
    zoom: 1,
    pan: { x: 0, y: 0 }
};

// ============================================
// CANVAS SETUP
// ============================================
const canvas = document.getElementById('nodeCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    initializeNodes();
    drawGraph();
}

window.addEventListener('resize', resizeCanvas);

// ============================================
// NODE GENERATION
// ============================================
function initializeNodes() {
    state.nodes = [];
    state.connections = [];
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Central Kali node
    state.nodes.push({
        id: 'kali',
        type: 'central',
        x: centerX,
        y: centerY,
        radius: 40,
        color: '#00ff41',
        label: 'KALI',
        active: true
    });
    
    // Category nodes (10 categories in a circle around Kali)
    const categoryRadius = Math.min(canvas.width, canvas.height) * 0.3;
    CONFIG.categories.forEach((cat, i) => {
        const angle = (i / CONFIG.categories.length) * Math.PI * 2 - Math.PI / 2;
        const x = centerX + Math.cos(angle) * categoryRadius;
        const y = centerY + Math.sin(angle) * categoryRadius;
        
        state.nodes.push({
            id: cat.id,
            type: 'category',
            x: x,
            y: y,
            radius: 25,
            color: cat.color,
            label: cat.name,
            icon: cat.icon,
            active: false,
            hands: []
        });
        
        // Connection from Kali to category
        state.connections.push({
            from: 'kali',
            to: cat.id,
            active: false
        });
        
        // Hand nodes (smaller nodes around each category)
        const handRadius = 80;
        const handsToShow = 10; // Show only 10 per category for performance
        for (let j = 0; j < handsToShow; j++) {
            const handAngle = angle + ((j - handsToShow/2) / handsToShow) * 0.8;
            const hx = x + Math.cos(handAngle) * handRadius;
            const hy = y + Math.sin(handAngle) * handRadius;
            
            const handId = `${cat.id}_hand_${j}`;
            state.nodes.push({
                id: handId,
                type: 'hand',
                x: hx,
                y: hy,
                radius: 6,
                color: cat.color,
                categoryId: cat.id,
                active: false
            });
            
            // Connection from category to hand
            state.connections.push({
                from: cat.id,
                to: handId,
                active: false
            });
        }
    });
}

// ============================================
// DRAWING FUNCTIONS
// ============================================
function drawGraph() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(state.pan.x, state.pan.y);
    ctx.scale(state.zoom, state.zoom);
    
    // Draw connections first
    drawConnections();
    
    // Draw nodes
    drawNodes();
    
    ctx.restore();
    
    // Request next frame for animation
    requestAnimationFrame(drawGraph);
}

function drawConnections() {
    state.connections.forEach(conn => {
        const fromNode = state.nodes.find(n => n.id === conn.from);
        const toNode = state.nodes.find(n => n.id === conn.to);
        
        if (!fromNode || !toNode) return;
        
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        
        if (conn.active) {
            ctx.strokeStyle = toNode.color || '#00ff41';
            ctx.lineWidth = 2;
            ctx.shadowColor = toNode.color || '#00ff41';
            ctx.shadowBlur = 10;
        } else {
            ctx.strokeStyle = 'rgba(0, 255, 65, 0.15)';
            ctx.lineWidth = 1;
            ctx.shadowBlur = 0;
        }
        
        ctx.stroke();
        
        // Draw data flow animation on active connections
        if (conn.active) {
            drawDataFlow(fromNode, toNode, toNode.color);
        }
    });
}

function drawDataFlow(from, to, color) {
    const time = Date.now() / 1000;
    const progress = (time % 1);
    
    const x = from.x + (to.x - from.x) * progress;
    const y = from.y + (to.y - from.y) * progress;
    
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fill();
}

function drawNodes() {
    // Draw hand nodes first (smallest)
    state.nodes.filter(n => n.type === 'hand').forEach(drawHandNode);
    
    // Draw category nodes
    state.nodes.filter(n => n.type === 'category').forEach(drawCategoryNode);
    
    // Draw central node last (on top)
    state.nodes.filter(n => n.type === 'central').forEach(drawCentralNode);
}

function drawCentralNode(node) {
    const time = Date.now() / 1000;
    const pulseSize = Math.sin(time * 2) * 5;
    
    // Outer glow
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius + 20 + pulseSize, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 255, 65, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Middle ring
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius + 10, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 255, 65, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Main circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    
    const gradient = ctx.createRadialGradient(
        node.x, node.y, 0,
        node.x, node.y, node.radius
    );
    gradient.addColorStop(0, '#004d15');
    gradient.addColorStop(1, '#001a05');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    ctx.strokeStyle = '#00ff41';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00ff41';
    ctx.shadowBlur = 20;
    ctx.stroke();
    ctx.shadowBlur = 0;
}

function drawCategoryNode(node) {
    // Glow effect if active
    if (node.active) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 8, 0, Math.PI * 2);
        ctx.strokeStyle = node.color + '40';
        ctx.lineWidth = 4;
        ctx.stroke();
    }
    
    // Main circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    
    const gradient = ctx.createRadialGradient(
        node.x, node.y, 0,
        node.x, node.y, node.radius
    );
    gradient.addColorStop(0, node.color + '40');
    gradient.addColorStop(1, '#0a0f0a');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    ctx.strokeStyle = node.active ? node.color : node.color + '60';
    ctx.lineWidth = 2;
    if (node.active) {
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 15;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Label
    ctx.fillStyle = node.active ? node.color : '#666';
    ctx.font = '10px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText(node.label, node.x, node.y + node.radius + 15);
}

function drawHandNode(node) {
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    
    if (node.active) {
        ctx.fillStyle = node.color;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 10;
    } else {
        ctx.fillStyle = node.color + '30';
        ctx.shadowBlur = 0;
    }
    
    ctx.fill();
    ctx.shadowBlur = 0;
}

// ============================================
// INTERACTION FUNCTIONS
// ============================================
function activateAllHands() {
    logToConsole('[SYSTEM] Activating all 1000 hands...', 'system');
    
    let delay = 0;
    CONFIG.categories.forEach((cat, i) => {
        setTimeout(() => {
            activateCategory(cat.id);
            logToConsole(`[OK] ${cat.name} hands activated (${cat.count} agents)`, 'success');
        }, delay);
        delay += 200;
    });
    
    setTimeout(() => {
        state.activeHands = CONFIG.totalHands;
        updateStatusBar();
        logToConsole('[COMPLETE] All 1000 hands are now ONLINE', 'success');
    }, delay);
}

function activateCategory(categoryId) {
    // Activate category node
    const catNode = state.nodes.find(n => n.id === categoryId);
    if (catNode) catNode.active = true;
    
    // Activate connection from Kali
    const conn = state.connections.find(c => c.to === categoryId);
    if (conn) conn.active = true;
    
    // Activate all hand nodes in this category
    state.nodes
        .filter(n => n.type === 'hand' && n.categoryId === categoryId)
        .forEach(hand => {
            hand.active = true;
            // Activate connection to hand
            const handConn = state.connections.find(c => c.to === hand.id);
            if (handConn) handConn.active = true;
        });
    
    // Update category list UI
    const catElement = document.querySelector(`[data-category="${categoryId}"]`);
    if (catElement) catElement.classList.add('active');
}

function generateContent() {
    if (state.activeHands === 0) {
        logToConsole('[ERROR] No hands active. Activate hands first!', 'error');
        return;
    }
    
    logToConsole('[SYSTEM] Generating positive content...', 'system');
    
    const contentTypes = ['IMAGE', 'TEXT', 'QUOTE', 'MEME'];
    const samples = [
        { type: 'IMAGE', preview: 'Sunrise over mountains, golden light...', hand: 'SunriseSoul' },
        { type: 'TEXT', preview: 'Gratitude turns what we have into enough.', hand: 'ThankfulHeart' },
        { type: 'QUOTE', preview: 'You didn\'t come this far to only come this far!', hand: 'RiseUp' },
        { type: 'IMAGE', preview: 'Dewdrops on rose petals, ethereal beauty...', hand: 'FlowerBeauty' },
    ];
    
    const content = samples[Math.floor(Math.random() * samples.length)];
    addContentToFeed(content);
    
    state.contentGenerated++;
    document.getElementById('contentCount').textContent = state.contentGenerated;
    
    logToConsole(`[OK] Content generated by ${content.hand}`, 'success');
}

function resetSystem() {
    logToConsole('[SYSTEM] Resetting all systems...', 'system');
    
    state.activeHands = 0;
    state.contentGenerated = 0;
    
    // Deactivate all nodes
    state.nodes.forEach(n => n.active = n.type === 'central');
    state.connections.forEach(c => c.active = false);
    
    // Update UI
    updateStatusBar();
    document.querySelectorAll('.category-item').forEach(el => el.classList.remove('active'));
    
    logToConsole('[OK] System reset complete', 'success');
}

// ============================================
// UI FUNCTIONS
// ============================================
function initializeCategoryList() {
    const list = document.getElementById('categoryList');
    list.innerHTML = '';
    
    CONFIG.categories.forEach(cat => {
        const item = document.createElement('div');
        item.className = 'category-item';
        item.dataset.category = cat.id;
        item.innerHTML = `
            <span class="category-icon">${cat.icon}</span>
            <span class="category-name">${cat.name}</span>
            <span class="category-count">${cat.count}</span>
        `;
        item.addEventListener('click', () => {
            activateCategory(cat.id);
            state.activeHands += cat.count;
            updateStatusBar();
            logToConsole(`[OK] ${cat.name} activated (${cat.count} hands)`, 'success');
        });
        list.appendChild(item);
    });
}

function updateStatusBar() {
    document.getElementById('activeHands').textContent = `${state.activeHands} / 1000`;
    
    // Update stats
    const perCategory = Math.floor(state.activeHands / 10);
    document.getElementById('statNature').textContent = state.activeHands > 0 ? perCategory : 0;
    document.getElementById('statGratitude').textContent = state.activeHands > 100 ? perCategory : 0;
    document.getElementById('statMotivation').textContent = state.activeHands > 200 ? perCategory : 0;
    document.getElementById('statArt').textContent = state.activeHands > 300 ? perCategory : 0;
}

function logToConsole(message, type = 'info') {
    const console = document.getElementById('console');
    const line = document.createElement('div');
    line.className = `console-line ${type}`;
    line.textContent = message;
    console.appendChild(line);
    console.scrollTop = console.scrollHeight;
}

function addContentToFeed(content) {
    const feed = document.getElementById('contentFeed');
    const item = document.createElement('div');
    item.className = 'content-item';
    item.innerHTML = `
        <div class="content-type">${content.type}</div>
        <div class="content-preview">${content.preview}</div>
        <div class="content-hand">${content.hand}</div>
    `;
    feed.insertBefore(item, feed.firstChild);
    
    // Keep only last 5 items
    while (feed.children.length > 5) {
        feed.removeChild(feed.lastChild);
    }
}

function updateClock() {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour12: false });
    document.getElementById('currentTime').textContent = time;
}

// Zoom controls
function zoomIn() {
    state.zoom = Math.min(state.zoom * 1.2, 3);
}

function zoomOut() {
    state.zoom = Math.max(state.zoom / 1.2, 0.5);
}

function resetZoom() {
    state.zoom = 1;
    state.pan = { x: 0, y: 0 };
}

// ============================================
// INITIALIZATION
// ============================================
function init() {
    resizeCanvas();
    initializeCategoryList();
    updateStatusBar();
    
    // Start clock
    updateClock();
    setInterval(updateClock, 1000);
    
    // Initial console messages
    setTimeout(() => logToConsole('[INFO] Click categories to activate hands', 'info'), 1000);
    setTimeout(() => logToConsole('[INFO] Or use ACTIVATE ALL HANDS button', 'info'), 2000);
    
    console.log('🕉️ HazarHathKali Dashboard initialized');
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
