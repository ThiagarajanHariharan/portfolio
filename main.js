// Contribution Blaster Arcade Game & Tactical Nuke Engine

class ContributionBlaster {
    constructor() {
        this.container = document.getElementById('blaster-container');
        this.gridEl = document.getElementById('heatmap-grid');
        this.canvas = document.getElementById('blaster-canvas');
        this.gunSvg = document.getElementById('blaster-gun');
        this.scoreEl = document.getElementById('blaster-score');
        this.streakEl = document.getElementById('blaster-streak');
        this.autoBtn = document.getElementById('auto-blast-btn');
        this.soundBtn = document.getElementById('sound-toggle-btn');
        this.clearBtn = document.getElementById('clear-grid-btn');
        this.nukeBtn = document.getElementById('nuke-strike-btn');

        if (!this.container || !this.gridEl || !this.canvas || !this.gunSvg) return;

        this.ctx = this.canvas.getContext('2d');
        this.projectiles = [];
        this.missiles = [];
        this.particles = [];
        this.shockwaves = [];
        this.floatingTexts = [];
        this.targetLocks = [];

        this.score = 0;
        this.streak = 0;
        this.soundEnabled = true;
        this.autoBlastActive = false;
        this.nukeInProgress = false;
        this.autoBlastInterval = null;
        this.audioCtx = null;

        this.targetAngle = 0;
        this.currentAngle = 0;
        this.gunOrigin = { x: 0, y: 0 };

        this.init();
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.renderHeatmap();
        this.initAudio();
        this.bindEvents();
        this.loop();
    }

    initAudio() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
        } catch (e) {
            console.warn('Web Audio API not supported', e);
        }
    }

    resumeAudio() {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    playLaserSound() {
        if (!this.soundEnabled || !this.audioCtx) return;
        this.resumeAudio();
        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(880, this.audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(110, this.audioCtx.currentTime + 0.12);
            gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.12);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.12);
        } catch (e) {}
    }

    playRadarBeep() {
        if (!this.soundEnabled || !this.audioCtx) return;
        this.resumeAudio();
        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, this.audioCtx.currentTime);
            osc.frequency.setValueAtTime(1800, this.audioCtx.currentTime + 0.04);
            gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.08);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.08);
        } catch (e) {}
    }

    playRocketLaunchSound() {
        if (!this.soundEnabled || !this.audioCtx) return;
        this.resumeAudio();
        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(160, this.audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(450, this.audioCtx.currentTime + 0.35);
            gain.gain.setValueAtTime(0.25, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.4);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.4);
        } catch (e) {}
    }

    playHeavyExplosionSound() {
        if (!this.soundEnabled || !this.audioCtx) return;
        this.resumeAudio();
        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(150, this.audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(30, this.audioCtx.currentTime + 0.4);
            gain.gain.setValueAtTime(0.4, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.45);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.45);
        } catch (e) {}
    }

    playPopSound() {
        if (!this.soundEnabled || !this.audioCtx) return;
        this.resumeAudio();
        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sine';
            const notes = [523.25, 659.25, 783.99, 1046.50];
            const freq = notes[Math.floor(Math.random() * notes.length)];
            osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
            gain.gain.setValueAtTime(0.18, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.15);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.15);
        } catch (e) {}
    }

    resizeCanvas() {
        const rect = this.container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.gunOrigin = {
            x: rect.width / 2,
            y: rect.height - 35
        };
    }

    renderHeatmap() {
        this.gridEl.innerHTML = '';
        const weeks = 36;
        const days = 7;
        this.cells = [];

        for (let w = 0; w < weeks; w++) {
            const col = document.createElement('div');
            col.className = 'flex flex-col gap-1.5';
            for (let d = 0; d < days; d++) {
                const cell = document.createElement('div');
                cell.className = 'w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm bg-slate-800 transition-all duration-300 hover:scale-125 cursor-crosshair border border-slate-700/50 relative';
                cell.dataset.level = '0';
                cell.dataset.x = w;
                cell.dataset.y = d;
                
                // Initial realistic scatter
                if (Math.random() > 0.6) {
                    const level = Math.floor(Math.random() * 3) + 1;
                    this.applyCellLevel(cell, level);
                }

                col.appendChild(cell);
                this.cells.push(cell);
            }
            this.gridEl.appendChild(col);
        }
    }

    applyCellLevel(cell, level) {
        cell.dataset.level = level;
        cell.className = 'w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm transition-all duration-300 hover:scale-125 cursor-crosshair relative';
        if (level === 1) cell.classList.add('bg-emerald-900', 'border', 'border-emerald-800');
        else if (level === 2) cell.classList.add('bg-emerald-600', 'border', 'border-emerald-500', 'shadow-sm', 'shadow-emerald-500/50');
        else if (level === 3) cell.classList.add('bg-emerald-400', 'border', 'border-emerald-300', 'shadow-md', 'shadow-emerald-400');
        else if (level >= 4) cell.classList.add('bg-green-300', 'border', 'border-white', 'shadow-lg', 'shadow-green-300', 'animate-pulse');
    }

    bindEvents() {
        this.container.addEventListener('mousemove', (e) => {
            const rect = this.container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const dx = mouseX - this.gunOrigin.x;
            const dy = mouseY - this.gunOrigin.y;
            this.targetAngle = Math.atan2(dy, dx) + Math.PI / 2;
        });

        this.container.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            const rect = this.container.getBoundingClientRect();
            const targetX = e.clientX - rect.left;
            const targetY = e.clientY - rect.top;
            this.shoot(targetX, targetY);
        });

        if (this.nukeBtn) {
            this.nukeBtn.addEventListener('click', () => this.launchTacticalNuke());
        }

        if (this.autoBtn) {
            this.autoBtn.addEventListener('click', () => {
                this.autoBlastActive = !this.autoBlastActive;
                this.autoBtn.classList.toggle('bg-primary', this.autoBlastActive);
                this.autoBtn.classList.toggle('bg-slate-800', !this.autoBlastActive);
                this.autoBtn.textContent = this.autoBlastActive ? '⚡ Auto-Blast: ON' : '🎮 Auto-Blast: OFF';

                if (this.autoBlastActive) {
                    this.autoBlastInterval = setInterval(() => {
                        const randomCell = this.cells[Math.floor(Math.random() * this.cells.length)];
                        if (randomCell) {
                            const rect = randomCell.getBoundingClientRect();
                            const containerRect = this.container.getBoundingClientRect();
                            const targetX = rect.left + rect.width / 2 - containerRect.left;
                            const targetY = rect.top + rect.height / 2 - containerRect.top;
                            
                            const dx = targetX - this.gunOrigin.x;
                            const dy = targetY - this.gunOrigin.y;
                            this.targetAngle = Math.atan2(dy, dx) + Math.PI / 2;
                            this.shoot(targetX, targetY);
                        }
                    }, 240);
                } else {
                    clearInterval(this.autoBlastInterval);
                }
            });
        }

        if (this.soundBtn) {
            this.soundBtn.addEventListener('click', () => {
                this.soundEnabled = !this.soundEnabled;
                this.soundBtn.textContent = this.soundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
            });
        }

        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => {
                this.cells.forEach(cell => {
                    cell.dataset.level = '0';
                    cell.className = 'w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm bg-slate-800 transition-all duration-300 hover:scale-125 cursor-crosshair border border-slate-700/50 relative';
                });
                this.score = 0;
                this.streak = 0;
                this.updateStats();
            });
        }
    }

    shoot(targetX, targetY) {
        const angle = Math.atan2(targetY - this.gunOrigin.y, targetX - this.gunOrigin.x);
        const speed = 14;
        
        this.projectiles.push({
            x: this.gunOrigin.x,
            y: this.gunOrigin.y - 20,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            targetX,
            targetY,
            color: '#38bdf8',
            trail: []
        });

        this.gunSvg.classList.add('recoil-active');
        setTimeout(() => this.gunSvg.classList.remove('recoil-active'), 90);
        this.playLaserSound();
    }

    // 🚀 THE TACTICAL NUKE STRIKE SEQUENCE
    launchTacticalNuke() {
        if (this.nukeInProgress) return;
        this.nukeInProgress = true;
        this.nukeBtn.disabled = true;
        this.nukeBtn.classList.add('opacity-50', 'animate-pulse');

        // Step 1: Find all green contribution target boxes
        let targetCells = this.cells.filter(c => parseInt(c.dataset.level || '0') > 0);
        if (targetCells.length < 12) {
            // Pick a good cluster of 20 targets if heatmap is sparse
            targetCells = [];
            for (let i = 0; i < 24; i++) {
                targetCells.push(this.cells[Math.floor(Math.random() * this.cells.length)]);
            }
        }

        const containerRect = this.container.getBoundingClientRect();
        this.targetLocks = [];

        // Step 2: Target Painting Sequence (snapping [X] lock-ons with radar beeps)
        targetCells.forEach((cell, idx) => {
            setTimeout(() => {
                const cellRect = cell.getBoundingClientRect();
                const tx = cellRect.left + cellRect.width / 2 - containerRect.left;
                const ty = cellRect.top + cellRect.height / 2 - containerRect.top;

                this.targetLocks.push({
                    x: tx,
                    y: ty,
                    cell: cell,
                    scale: 1,
                    alpha: 1
                });
                this.playRadarBeep();
            }, idx * 45);
        });

        // Step 3: Launch Tactical Cruise Missiles after all targets are locked
        const launchDelay = targetCells.length * 45 + 300;
        setTimeout(() => {
            this.playRocketLaunchSound();
            
            // Multiple rocket battery launch points at the bottom
            targetCells.forEach((cell, idx) => {
                setTimeout(() => {
                    const cellRect = cell.getBoundingClientRect();
                    const tx = cellRect.left + cellRect.width / 2 - containerRect.left;
                    const ty = cellRect.top + cellRect.height / 2 - containerRect.top;
                    const startX = this.gunOrigin.x + (Math.random() * 120 - 60);
                    const startY = this.gunOrigin.y;

                    this.missiles.push({
                        startX,
                        startY,
                        x: startX,
                        y: startY,
                        targetX: tx,
                        targetY: ty,
                        cell: cell,
                        progress: 0,
                        speed: 0.035 + Math.random() * 0.015,
                        arcHeight: Math.random() * 140 + 80,
                        trail: []
                    });
                }, idx * 60);
            });
        }, launchDelay);

        // Reset Nuke button after volley completes
        setTimeout(() => {
            this.nukeInProgress = false;
            this.nukeBtn.disabled = false;
            this.nukeBtn.classList.remove('opacity-50', 'animate-pulse');
        }, launchDelay + targetCells.length * 60 + 1500);
    }

    spawnImpact(x, y, isCellHit = false) {
        const colors = ['#4ade80', '#22c55e', '#38bdf8', '#fbbf24', '#f43f5e'];
        for (let i = 0; i < 14; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 2;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 4 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 1,
                decay: Math.random() * 0.04 + 0.02
            });
        }

        if (isCellHit) {
            const badges = ['+10 Commits!', 'PR Merged! 🔥', 'Bug Squashed! 🐛', 'Streak x2! ⚡', 'Critical Fix! 🚀'];
            const text = badges[Math.floor(Math.random() * badges.length)];
            this.floatingTexts.push({
                x: x + (Math.random() * 20 - 10),
                y,
                text,
                alpha: 1,
                vy: -1.5,
                color: '#4ade80'
            });

            this.score += 50;
            this.streak += 1;
            this.updateStats();
            this.playPopSound();
        }
    }

    triggerNukeDetonation(x, y, cell) {
        // Heavy Screen Shake
        this.container.classList.add('shake-active');
        setTimeout(() => this.container.classList.remove('shake-active'), 350);

        // Shockwave Ring
        this.shockwaves.push({
            x,
            y,
            radius: 4,
            maxRadius: 40,
            alpha: 1,
            color: '#22c55e'
        });

        // Massive Fireball Particles
        const nukeColors = ['#ffffff', '#86efac', '#4ade80', '#22c55e', '#38bdf8', '#facc15', '#ef4444'];
        for (let i = 0; i < 28; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 7 + 3;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 6 + 3,
                color: nukeColors[Math.floor(Math.random() * nukeColors.length)],
                alpha: 1,
                decay: Math.random() * 0.03 + 0.015
            });
        }

        // Supercharge cell to Level 4 (Pulsing Emerald Neon)
        if (cell) {
            this.applyCellLevel(cell, 4);
        }

        // Mega Floating Text
        const nukeBadges = ['💥 TACTICAL STRIKE! +500 XP', '🔥 NUCLEAR STREAK!', '🚀 100% DEPLOYED!', '⚡ OVERLOAD!'];
        this.floatingTexts.push({
            x: x - 20,
            y: y - 10,
            text: nukeBadges[Math.floor(Math.random() * nukeBadges.length)],
            alpha: 1,
            vy: -2,
            color: '#facc15'
        });

        this.score += 500;
        this.streak += 5;
        this.updateStats();
        this.playHeavyExplosionSound();
    }

    updateStats() {
        if (this.scoreEl) this.scoreEl.textContent = this.score;
        if (this.streakEl) this.streakEl.textContent = this.streak;
    }

    loop() {
        requestAnimationFrame(() => this.loop());

        // Gun Rotation
        this.currentAngle += (this.targetAngle - this.currentAngle) * 0.2;
        this.gunSvg.style.transform = `rotate(${this.currentAngle * (180 / Math.PI)}deg)`;

        // Clear Canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Draw Target Lock-On Markers [ X ]
        for (let i = 0; i < this.targetLocks.length; i++) {
            const lock = this.targetLocks[i];
            this.ctx.save();
            this.ctx.strokeStyle = '#ef4444';
            this.ctx.lineWidth = 1.5;
            this.ctx.fillStyle = '#ef4444';
            this.ctx.font = 'bold 10px monospace';

            const size = 9;
            // Draw [ X ] brackets
            this.ctx.strokeRect(lock.x - size, lock.y - size, size * 2, size * 2);
            this.ctx.beginPath();
            this.ctx.moveTo(lock.x - 4, lock.y - 4);
            this.ctx.lineTo(lock.x + 4, lock.y + 4);
            this.ctx.moveTo(lock.x + 4, lock.y - 4);
            this.ctx.lineTo(lock.x - 4, lock.y + 4);
            this.ctx.stroke();

            this.ctx.fillText('TARGET', lock.x - 18, lock.y - 12);
            this.ctx.restore();
        }

        // 2. Update & Draw Tactical Missiles
        for (let i = this.missiles.length - 1; i >= 0; i--) {
            const m = this.missiles[i];
            m.progress += m.speed;

            // Parabolic Bezier trajectory
            const currentX = m.startX + (m.targetX - m.startX) * m.progress;
            const linearY = m.startY + (m.targetY - m.startY) * m.progress;
            const arcOffset = Math.sin(m.progress * Math.PI) * m.arcHeight;
            m.x = currentX;
            m.y = linearY - arcOffset;

            // Smoke & Thruster Trail
            m.trail.push({ x: m.x, y: m.y });
            if (m.trail.length > 10) m.trail.shift();

            // Draw Smoke Trail
            this.ctx.beginPath();
            for (let j = 0; j < m.trail.length; j++) {
                const pt = m.trail[j];
                this.ctx.lineTo(pt.x, pt.y);
            }
            this.ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();

            // Draw Missile Rocket Body
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(m.x, m.y, 4.5, 0, Math.PI * 2);
            this.ctx.fillStyle = '#f97316';
            this.ctx.shadowColor = '#ef4444';
            this.ctx.shadowBlur = 12;
            this.ctx.fill();
            this.ctx.restore();

            // Spawn engine sparks
            if (Math.random() > 0.4) {
                this.particles.push({
                    x: m.x,
                    y: m.y,
                    vx: (Math.random() - 0.5) * 2,
                    vy: Math.random() * 2 + 1,
                    size: Math.random() * 3 + 1,
                    color: '#facc15',
                    alpha: 0.8,
                    decay: 0.05
                });
            }

            // Impact check
            if (m.progress >= 1) {
                this.triggerNukeDetonation(m.targetX, m.targetY, m.cell);
                // Remove lock marker for this cell
                this.targetLocks = this.targetLocks.filter(l => l.cell !== m.cell);
                this.missiles.splice(i, 1);
            }
        }

        // 3. Update Standard Projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx;
            p.y += p.vy;

            p.trail.push({ x: p.x, y: p.y });
            if (p.trail.length > 5) p.trail.shift();

            this.ctx.beginPath();
            for (let j = 0; j < p.trail.length; j++) {
                const pt = p.trail[j];
                this.ctx.lineTo(pt.x, pt.y);
            }
            this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
            this.ctx.lineWidth = 4;
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.shadowColor = '#38bdf8';
            this.ctx.shadowBlur = 10;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;

            const containerRect = this.container.getBoundingClientRect();
            let hit = false;

            for (const cell of this.cells) {
                const cellRect = cell.getBoundingClientRect();
                const cellX = cellRect.left + cellRect.width / 2 - containerRect.left;
                const cellY = cellRect.top + cellRect.height / 2 - containerRect.top;

                const dist = Math.hypot(p.x - cellX, p.y - cellY);
                if (dist < 12) {
                    const currentLevel = parseInt(cell.dataset.level || '0');
                    const nextLevel = Math.min(currentLevel + 1, 4);
                    this.applyCellLevel(cell, nextLevel);
                    this.spawnImpact(cellX, cellY, true);
                    hit = true;
                    break;
                }
            }

            if (hit || p.y < 0 || p.x < 0 || p.x > this.canvas.width || p.y > this.canvas.height) {
                if (!hit) this.spawnImpact(p.x, p.y, false);
                this.projectiles.splice(i, 1);
            }
        }

        // 4. Update Shockwaves
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const sw = this.shockwaves[i];
            sw.radius += 2.5;
            sw.alpha -= 0.05;

            if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
                this.shockwaves.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(34, 197, 94, ${sw.alpha})`;
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
            this.ctx.restore();
        }

        // 5. Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const part = this.particles[i];
            part.x += part.vx;
            part.y += part.vy;
            part.alpha -= part.decay;

            if (part.alpha <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.globalAlpha = part.alpha;
            this.ctx.fillStyle = part.color;
            this.ctx.beginPath();
            this.ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }

        // 6. Update Floating Text Badges
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const t = this.floatingTexts[i];
            t.y += t.vy;
            t.alpha -= 0.02;

            if (t.alpha <= 0) {
                this.floatingTexts.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.globalAlpha = t.alpha;
            this.ctx.font = 'bold 12px Inter, sans-serif';
            this.ctx.fillStyle = t.color || '#4ade80';
            this.ctx.shadowColor = '#000';
            this.ctx.shadowBlur = 6;
            this.ctx.fillText(t.text, t.x, t.y);
            this.ctx.restore();
        }
    }
}

// Auto Initialize
document.addEventListener('DOMContentLoaded', () => {
    new ContributionBlaster();
});
