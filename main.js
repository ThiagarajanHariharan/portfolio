// Contribution Blaster Arcade Game & Real GitHub Heatmap Engine

class ContributionBlaster {
    constructor() {
        this.container = document.getElementById('blaster-container');
        this.gridEl = document.getElementById('heatmap-grid');
        this.canvas = document.getElementById('blaster-canvas');
        this.gunSvg = document.getElementById('blaster-gun');
        this.scoreEl = document.getElementById('blaster-score');
        this.streakEl = document.getElementById('blaster-streak');
        this.totalCommitsEl = document.getElementById('blaster-total-commits');
        this.autoBtn = document.getElementById('auto-blast-btn');
        this.replayBtn = document.getElementById('replay-timeline-btn');
        this.soundBtn = document.getElementById('sound-toggle-btn');
        this.clearBtn = document.getElementById('clear-grid-btn');
        this.nukeBtn = document.getElementById('nuke-strike-btn');
        this.tooltipEl = document.getElementById('blaster-tooltip');

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
        this.totalCommits = 521;
        this.soundEnabled = true;
        this.autoBlastActive = false;
        this.replayActive = false;
        this.nukeInProgress = false;
        this.autoBlastInterval = null;
        this.replayTimeout = null;
        this.audioCtx = null;

        this.targetAngle = 0;
        this.currentAngle = 0;
        this.gunOrigin = { x: 0, y: 0 };
        this.realContributions = null;
        this.cells = [];

        this.init();
    }

    async init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        await this.loadContributionData();
        this.renderHeatmap();
        this.initAudio();
        this.bindEvents();
        this.loop();
    }

    async loadContributionData() {
        try {
            const resp = await fetch('contributions.json');
            if (resp.ok) {
                this.realContributions = await resp.json();
                this.totalCommits = this.realContributions.totalContributions || 522;
            }
        } catch (e) {
            console.warn('Using fallback contribution generator', e);
        }
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
        this.cells = [];

        if (this.realContributions && this.realContributions.days) {
            // Render Real GitHub 53-Week Heatmap Matrix
            const days = this.realContributions.days;
            const weeksCount = this.realContributions.weeksCount || 53;
            
            // Group by week
            const weeksMap = {};
            for (const d of days) {
                if (!weeksMap[d.week]) weeksMap[d.week] = [];
                weeksMap[d.week].push(d);
            }

            for (let w = 0; w < weeksCount; w++) {
                const col = document.createElement('div');
                col.className = 'flex flex-col gap-1.5 shrink-0';
                const weekDays = weeksMap[w] || [];

                for (const d of weekDays) {
                    const cell = document.createElement('div');
                    cell.className = 'w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm transition-all duration-300 hover:scale-125 cursor-crosshair relative';
                    cell.dataset.date = d.date;
                    cell.dataset.count = d.count;
                    cell.dataset.level = d.level;
                    cell.dataset.originalLevel = d.level;

                    this.applyCellLevel(cell, d.level);

                    // Add Tooltip Hover Listeners
                    cell.addEventListener('mouseenter', (e) => this.showTooltip(e, d));
                    cell.addEventListener('mouseleave', () => this.hideTooltip());

                    col.appendChild(cell);
                    this.cells.push(cell);
                }
                this.gridEl.appendChild(col);
            }
        } else {
            // Fallback render
            for (let w = 0; w < 40; w++) {
                const col = document.createElement('div');
                col.className = 'flex flex-col gap-1.5 shrink-0';
                for (let d = 0; d < 7; d++) {
                    const cell = document.createElement('div');
                    cell.className = 'w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm bg-slate-800 transition-all duration-300 hover:scale-125 cursor-crosshair border border-slate-700/50 relative';
                    cell.dataset.level = '0';
                    if (Math.random() > 0.6) {
                        this.applyCellLevel(cell, Math.floor(Math.random() * 3) + 1);
                    }
                    col.appendChild(cell);
                    this.cells.push(cell);
                }
                this.gridEl.appendChild(col);
            }
        }

        if (this.totalCommitsEl) {
            this.totalCommitsEl.textContent = `${this.totalCommits} Commits in 2026`;
        }
    }

    applyCellLevel(cell, level) {
        cell.dataset.level = level;
        cell.className = 'w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm transition-all duration-300 hover:scale-125 cursor-crosshair relative';
        if (level === 0) cell.classList.add('bg-slate-800/80', 'border', 'border-slate-700/50');
        else if (level === 1) cell.classList.add('bg-emerald-900', 'border', 'border-emerald-800');
        else if (level === 2) cell.classList.add('bg-emerald-600', 'border', 'border-emerald-500', 'shadow-sm', 'shadow-emerald-500/50');
        else if (level === 3) cell.classList.add('bg-emerald-400', 'border', 'border-emerald-300', 'shadow-md', 'shadow-emerald-400');
        else if (level >= 4) cell.classList.add('bg-green-300', 'border', 'border-white', 'shadow-lg', 'shadow-green-300', 'animate-pulse');
    }

    showTooltip(e, data) {
        if (!this.tooltipEl) return;
        const rect = e.target.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        const countText = data.count === 1 ? '1 contribution' : `${data.count} contributions`;
        this.tooltipEl.innerHTML = `<strong>${countText}</strong> on ${data.date}`;
        this.tooltipEl.style.left = `${rect.left + rect.width / 2 - containerRect.left}px`;
        this.tooltipEl.style.top = `${rect.top - containerRect.top - 32}px`;
        this.tooltipEl.classList.remove('opacity-0');
        this.tooltipEl.classList.add('opacity-100');
    }

    hideTooltip() {
        if (!this.tooltipEl) return;
        this.tooltipEl.classList.add('opacity-0');
        this.tooltipEl.classList.remove('opacity-100');
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

        if (this.replayBtn) {
            this.replayBtn.addEventListener('click', () => this.toggleTimelineReplay());
        }

        if (this.autoBtn) {
            this.autoBtn.addEventListener('click', () => {
                this.autoBlastActive = !this.autoBlastActive;
                this.autoBtn.classList.toggle('bg-primary', this.autoBlastActive);
                this.autoBtn.classList.toggle('bg-slate-800', !this.autoBlastActive);
                this.autoBtn.textContent = this.autoBlastActive ? '⚡ Auto-Blast: ON' : '🎮 Auto-Blast: OFF';

                if (this.autoBlastActive) {
                    this.autoBlastInterval = setInterval(() => {
                        const activeCells = this.cells.filter(c => parseInt(c.dataset.count || '0') > 0);
                        const pool = activeCells.length > 0 ? activeCells : this.cells;
                        const randomCell = pool[Math.floor(Math.random() * pool.length)];
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
                    }, 220);
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
                    const orig = parseInt(cell.dataset.originalLevel || '0');
                    this.applyCellLevel(cell, orig);
                });
                this.score = 0;
                this.streak = 0;
                this.updateStats();
            });
        }
    }

    // ⏱️ TIMELINE REPLAY: Chronologically shoot real commit dates from Jan to Today
    toggleTimelineReplay() {
        if (this.replayActive) {
            this.replayActive = false;
            if (this.replayTimeout) clearTimeout(this.replayTimeout);
            this.replayBtn.textContent = '⏱️ Timeline Replay';
            this.replayBtn.classList.remove('bg-purple-600');
            return;
        }

        this.replayActive = true;
        this.replayBtn.textContent = '⏹️ Stop Replay';
        this.replayBtn.classList.add('bg-purple-600');

        // Reset grid to 0
        this.cells.forEach(c => this.applyCellLevel(c, 0));

        // Get all dates with actual commits
        const commitCells = this.cells.filter(c => parseInt(c.dataset.count || '0') > 0);
        let idx = 0;

        const playNext = () => {
            if (!this.replayActive || idx >= commitCells.length) {
                this.replayActive = false;
                this.replayBtn.textContent = '⏱️ Timeline Replay';
                this.replayBtn.classList.remove('bg-purple-600');
                return;
            }

            const cell = commitCells[idx];
            const rect = cell.getBoundingClientRect();
            const containerRect = this.container.getBoundingClientRect();
            const targetX = rect.left + rect.width / 2 - containerRect.left;
            const targetY = rect.top + rect.height / 2 - containerRect.top;

            const dx = targetX - this.gunOrigin.x;
            const dy = targetY - this.gunOrigin.y;
            this.targetAngle = Math.atan2(dy, dx) + Math.PI / 2;
            this.shoot(targetX, targetY);

            idx++;
            this.replayTimeout = setTimeout(playNext, 120);
        };

        playNext();
    }

    shoot(targetX, targetY) {
        const angle = Math.atan2(targetY - this.gunOrigin.y, targetX - this.gunOrigin.x);
        const speed = 15;
        
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

    // 🚀 TACTICAL NUKE: Specifically seek & detonate on top peak commit milestone days
    launchTacticalNuke() {
        if (this.nukeInProgress) return;
        this.nukeInProgress = true;
        this.nukeBtn.disabled = true;
        this.nukeBtn.classList.add('opacity-50', 'animate-pulse');

        // Find top peak commit milestone days (sorted by commit count descending)
        const sorted = [...this.cells].sort((a, b) => {
            return parseInt(b.dataset.count || '0') - parseInt(a.dataset.count || '0');
        });
        const peakTargets = sorted.slice(0, 18);

        const containerRect = this.container.getBoundingClientRect();
        this.targetLocks = [];

        // Target painting on milestone days
        peakTargets.forEach((cell, idx) => {
            setTimeout(() => {
                const cellRect = cell.getBoundingClientRect();
                const tx = cellRect.left + cellRect.width / 2 - containerRect.left;
                const ty = cellRect.top + cellRect.height / 2 - containerRect.top;

                this.targetLocks.push({
                    x: tx,
                    y: ty,
                    cell: cell,
                    date: cell.dataset.date,
                    count: cell.dataset.count
                });
                this.playRadarBeep();
            }, idx * 50);
        });

        // Launch ballistic cruise missiles
        const launchDelay = peakTargets.length * 50 + 300;
        setTimeout(() => {
            this.playRocketLaunchSound();
            
            peakTargets.forEach((cell, idx) => {
                setTimeout(() => {
                    const cellRect = cell.getBoundingClientRect();
                    const tx = cellRect.left + cellRect.width / 2 - containerRect.left;
                    const ty = cellRect.top + cellRect.height / 2 - containerRect.top;
                    const startX = this.gunOrigin.x + (Math.random() * 140 - 70);
                    const startY = this.gunOrigin.y;

                    this.missiles.push({
                        startX,
                        startY,
                        x: startX,
                        y: startY,
                        targetX: tx,
                        targetY: ty,
                        cell: cell,
                        date: cell.dataset.date,
                        count: cell.dataset.count,
                        progress: 0,
                        speed: 0.032 + Math.random() * 0.015,
                        arcHeight: Math.random() * 150 + 80,
                        trail: []
                    });
                }, idx * 60);
            });
        }, launchDelay);

        setTimeout(() => {
            this.nukeInProgress = false;
            this.nukeBtn.disabled = false;
            this.nukeBtn.classList.remove('opacity-50', 'animate-pulse');
        }, launchDelay + peakTargets.length * 60 + 1500);
    }

    spawnImpact(x, y, isCellHit = false, cell = null) {
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
            const count = cell ? parseInt(cell.dataset.count || '1') : 1;
            const date = cell ? cell.dataset.date : '';
            const text = count > 0 ? `+${count} Commits! 🔥` : '+10 XP! ✨';

            this.floatingTexts.push({
                x: x + (Math.random() * 20 - 10),
                y,
                text: date ? `${date}: ${text}` : text,
                alpha: 1,
                vy: -1.5,
                color: '#4ade80'
            });

            this.score += count * 50 + 10;
            this.streak += 1;
            this.updateStats();
            this.playPopSound();
        }
    }

    triggerNukeDetonation(x, y, cell, count, date) {
        this.container.classList.add('shake-active');
        setTimeout(() => this.container.classList.remove('shake-active'), 350);

        this.shockwaves.push({
            x,
            y,
            radius: 4,
            maxRadius: 45,
            alpha: 1,
            color: '#22c55e'
        });

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

        if (cell) {
            this.applyCellLevel(cell, 4);
        }

        const commitsCount = count ? parseInt(count) : 20;
        const text = date ? `💥 ${date}: +${commitsCount} COMMITS!` : `💥 PEAK MILESTONE! +${commitsCount} XP`;

        this.floatingTexts.push({
            x: x - 30,
            y: y - 10,
            text,
            alpha: 1,
            vy: -2,
            color: '#facc15'
        });

        this.score += commitsCount * 100 + 500;
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

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Draw Target Lock-On Markers [ X ]
        for (let i = 0; i < this.targetLocks.length; i++) {
            const lock = this.targetLocks[i];
            this.ctx.save();
            this.ctx.strokeStyle = '#ef4444';
            this.ctx.lineWidth = 1.5;
            this.ctx.fillStyle = '#ef4444';
            this.ctx.font = 'bold 9px monospace';

            const size = 9;
            this.ctx.strokeRect(lock.x - size, lock.y - size, size * 2, size * 2);
            this.ctx.beginPath();
            this.ctx.moveTo(lock.x - 4, lock.y - 4);
            this.ctx.lineTo(lock.x + 4, lock.y + 4);
            this.ctx.moveTo(lock.x + 4, lock.y - 4);
            this.ctx.lineTo(lock.x - 4, lock.y + 4);
            this.ctx.stroke();

            this.ctx.fillText(`${lock.count || '0'} COMMITS`, lock.x - 22, lock.y - 12);
            this.ctx.restore();
        }

        // 2. Update & Draw Tactical Missiles
        for (let i = this.missiles.length - 1; i >= 0; i--) {
            const m = this.missiles[i];
            m.progress += m.speed;

            const currentX = m.startX + (m.targetX - m.startX) * m.progress;
            const linearY = m.startY + (m.targetY - m.startY) * m.progress;
            const arcOffset = Math.sin(m.progress * Math.PI) * m.arcHeight;
            m.x = currentX;
            m.y = linearY - arcOffset;

            m.trail.push({ x: m.x, y: m.y });
            if (m.trail.length > 10) m.trail.shift();

            this.ctx.beginPath();
            for (let j = 0; j < m.trail.length; j++) {
                const pt = m.trail[j];
                this.ctx.lineTo(pt.x, pt.y);
            }
            this.ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();

            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(m.x, m.y, 4.5, 0, Math.PI * 2);
            this.ctx.fillStyle = '#f97316';
            this.ctx.shadowColor = '#ef4444';
            this.ctx.shadowBlur = 12;
            this.ctx.fill();
            this.ctx.restore();

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

            if (m.progress >= 1) {
                this.triggerNukeDetonation(m.targetX, m.targetY, m.cell, m.count, m.date);
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
                    this.spawnImpact(cellX, cellY, true, cell);
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
            this.ctx.font = 'bold 11px Inter, sans-serif';
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
