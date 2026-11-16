/**
 * ============================================
 * PISCINA SOLAR - SCRIPT PRINCIPAL
 * Projeto Integrador CEP - 3º Trimestre 2026
 * ============================================
 */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => { clearTimeout(timeout); func(...args); };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const formatNumber = (num) => num.toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 0 });

// ============================================
// 1. GERENCIADOR DE ACESSIBILIDADE
// ============================================
class AccessibilityManager {
    constructor() {
        this.toggle = $('#a11yToggle');
        if (!this.toggle) return;
        this.menu = $('#a11yMenu');
        this.options = $$('.a11y-option');
        this.currentTheme = localStorage.getItem('accessibility-theme') || 'default';
        this.init();
    }
    init() {
        if (this.currentTheme !== 'default') {
            document.documentElement.setAttribute('data-theme', this.currentTheme);
        }
        this.toggle.addEventListener('click', () => this.toggleMenu());
        this.toggle.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.toggleMenu(); } });
        this.options.forEach(option => {
            option.addEventListener('click', () => this.setTheme(option.getAttribute('data-theme')));
            option.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.setTheme(option.getAttribute('data-theme')); } });
        });
        document.addEventListener('click', (e) => { if (!this.toggle.contains(e.target) && !this.menu.contains(e.target)) this.closeMenu(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.menu.classList.contains('active')) { this.closeMenu(); this.toggle.focus(); } });
    }
    toggleMenu() { this.menu.classList.contains('active') ? this.closeMenu() : this.openMenu(); }
    openMenu() { this.menu.classList.add('active'); this.toggle.setAttribute('aria-expanded', 'true'); this.menu.setAttribute('aria-hidden', 'false'); const first = this.menu.querySelector('.a11y-option'); if (first) setTimeout(() => first.focus(), 100); }
    closeMenu() { this.menu.classList.remove('active'); this.toggle.setAttribute('aria-expanded', 'false'); this.menu.setAttribute('aria-hidden', 'true'); }
    setTheme(theme) {
        if (theme === 'reset') { document.documentElement.removeAttribute('data-theme'); localStorage.removeItem('accessibility-theme'); this.currentTheme = 'default'; }
        else { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('accessibility-theme', theme); this.currentTheme = theme; }
        this.closeMenu();
        const announcements = { 'high-contrast': 'Modo alto contraste ativado', 'dyslexia': 'Fonte para dislexia ativada', 'large-text': 'Texto grande ativado', 'reduce-motion': 'Animações reduzidas ativadas', 'reset': 'Configurações restauradas ao padrão' };
        if (announcements[theme]) { const el = document.createElement('div'); el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); el.className = 'sr-only'; el.textContent = announcements[theme]; document.body.appendChild(el); setTimeout(() => document.body.removeChild(el), 1000); }
    }
}

// ============================================
// 2. GERENCIADOR DE TEMA (CLARO/ESCURO)
// ============================================
class ThemeManager {
    constructor() {
        this.toggle = $('#themeToggle');
        if (!this.toggle) return; // Segurança: não quebra se o botão não existir no HTML
        this.init();
    }
    init() {
        const savedTheme = localStorage.getItem('color-theme');
        if (savedTheme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
        
        this.toggle.addEventListener('click', () => this.toggleTheme());
        this.toggle.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.toggleTheme(); } });
    }
    toggleTheme() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) { 
            document.documentElement.removeAttribute('data-theme'); 
            localStorage.setItem('color-theme', 'light'); 
        } else { 
            document.documentElement.setAttribute('data-theme', 'dark'); 
            localStorage.setItem('color-theme', 'dark'); 
        }
    }
}

// ============================================
// 3. GERENCIADOR DE ZOOM (SEM BUG DE LAYOUT)
// ============================================
class ZoomManager {
    constructor() {
        this.toggle = $('#zoomToggle');
        if (!this.toggle) return; // Segurança
        this.menu = $('#zoomMenu');
        this.zoomOutBtn = $('#zoomOut');
        this.zoomResetBtn = $('#zoomReset');
        this.zoomInBtn = $('#zoomIn');
        this.zoomValueDisplay = $('#zoomValue');
        this.zoomLevel = parseFloat(localStorage.getItem('zoom-level')) || 1;
        this.zoomStep = 0.1;
        this.minZoom = 0.8;
        this.maxZoom = 1.5;
        this.init();
    }
    init() {
        if (this.zoomLevel !== 1) this.applyZoom(this.zoomLevel, false);
        
        this.toggle.addEventListener('click', () => this.toggleMenu());
        this.toggle.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.toggleMenu(); } });
        this.zoomOutBtn.addEventListener('click', () => this.decreaseZoom());
        this.zoomResetBtn.addEventListener('click', () => this.resetZoom());
        this.zoomInBtn.addEventListener('click', () => this.increaseZoom());
        
        document.addEventListener('click', (e) => { if (!this.toggle.contains(e.target) && !this.menu.contains(e.target)) this.closeMenu(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.menu.classList.contains('active')) { this.closeMenu(); this.toggle.focus(); } });
        
        // Atalhos de teclado
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) { e.preventDefault(); this.increaseZoom(); }
            else if ((e.ctrlKey || e.metaKey) && e.key === '-') { e.preventDefault(); this.decreaseZoom(); }
            else if ((e.ctrlKey || e.metaKey) && e.key === '0') { e.preventDefault(); this.resetZoom(); }
        });
    }
    toggleMenu() { this.menu.classList.contains('active') ? this.closeMenu() : this.openMenu(); }
    openMenu() { this.menu.classList.add('active'); this.toggle.setAttribute('aria-expanded', 'true'); this.menu.setAttribute('aria-hidden', 'false'); }
    closeMenu() { this.menu.classList.remove('active'); this.toggle.setAttribute('aria-expanded', 'false'); this.menu.setAttribute('aria-hidden', 'true'); }
    increaseZoom() { this.applyZoom(Math.min(this.zoomLevel + this.zoomStep, this.maxZoom)); }
    decreaseZoom() { this.applyZoom(Math.max(this.zoomLevel - this.zoomStep, this.minZoom)); }
    resetZoom() { this.applyZoom(1); }
    
    applyZoom(level, save = true) {
        this.zoomLevel = level;
        if (this.zoomValueDisplay) this.zoomValueDisplay.textContent = `${Math.round(level * 100)}%`;
        
        // CORREÇÃO DO BUG DO ESPAÇO EM BRANCO:
        // Em vez de usar transform: scale() no body (que quebra o layout e cria espaço branco),
        // nós ajustamos o tamanho da fonte base do HTML. Como todo o site usa 'rem',
        // tudo aumenta proporcionalmente sem quebrar o fluxo do documento!
        if (level === 1) {
            document.documentElement.style.fontSize = '';
        } else {
            document.documentElement.style.fontSize = `${16 * level}px`;
        }
        
        if (save) localStorage.setItem('zoom-level', level);
    }
}

// ============================================
// 4. NAVEGAÇÃO
// ============================================
class NavigationManager {
    constructor() {
        this.header = $('.site-header');
        this.mobileToggle = $('#mobileMenuToggle');
        this.mainNav = $('#mainNav');
        this.navLinks = $$('.nav-link');
        this.backToTop = $('#backToTop');
        this.init();
    }
    init() {
        window.addEventListener('scroll', debounce(() => this.handleScroll(), 100));
        if (this.mobileToggle) this.mobileToggle.addEventListener('click', () => this.toggleMobileMenu());
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = $(link.getAttribute('href'));
                if (target) {
                    window.scrollTo({ top: target.offsetTop - this.header.offsetHeight, behavior: 'smooth' });
                    if (this.mainNav.classList.contains('active')) this.closeMobileMenu();
                }
            });
        });
        window.addEventListener('scroll', debounce(() => this.updateActiveLink(), 100));
        if (this.backToTop) this.backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }
    handleScroll() {
        const scrollY = window.scrollY;
        if (scrollY > 50) this.header.classList.add('scrolled'); else this.header.classList.remove('scrolled');
        if (this.backToTop) {
            if (scrollY > 500) this.backToTop.classList.add('visible'); else this.backToTop.classList.remove('visible');
        }
    }
    toggleMobileMenu() { this.mainNav.classList.contains('active') ? this.closeMobileMenu() : this.openMobileMenu(); }
    openMobileMenu() { this.mainNav.classList.add('active'); if(this.mobileToggle) this.mobileToggle.classList.add('active'); if(this.mobileToggle) this.mobileToggle.setAttribute('aria-expanded', 'true'); }
    closeMobileMenu() { this.mainNav.classList.remove('active'); if(this.mobileToggle) this.mobileToggle.classList.remove('active'); if(this.mobileToggle) this.mobileToggle.setAttribute('aria-expanded', 'false'); }
    updateActiveLink() {
        const scrollPos = window.scrollY + 200;
        this.navLinks.forEach(link => {
            const section = $(link.getAttribute('href'));
            if (section && scrollPos >= section.offsetTop && scrollPos < section.offsetTop + section.offsetHeight) {
                this.navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
    }
}

// ============================================
// 5. CONTADORES
// ============================================
class CounterAnimation {
    constructor() { this.counters = $$('.stat-number'); this.observed = false; this.init(); }
    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => { if (entry.isIntersecting && !this.observed) { this.animateCounters(); this.observed = true; } });
        }, { threshold: 0.5 });
        const heroStats = $('.hero-stats'); if (heroStats) observer.observe(heroStats);
    }
    animateCounters() {
        this.counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'));
            const duration = 2000;
            const increment = target / (duration / 16);
            let current = 0;
            const update = () => { current += increment; if (current < target) { counter.textContent = Math.floor(current); requestAnimationFrame(update); } else counter.textContent = target; };
            update();
        });
    }
}

// ============================================
// 6. REVEAL
// ============================================
class RevealAnimation {
    constructor() { this.elements = $$('[data-reveal]'); this.init(); }
    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('revealed'); observer.unobserve(entry.target); } });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
        this.elements.forEach(el => observer.observe(el));
    }
}

// ============================================
// 7. CALCULADORA
// ============================================
class EnergyCalculator {
    constructor() {
        this.form = $('#energyForm');
        if (!this.form) return;
        this.results = $('#calcResults');
        this.SPECIFIC_HEAT_WATER = 4.186;
        this.DENSITY_WATER = 1000;
        this.THERMAL_EFFICIENCY = 0.80;
        this.PV_EFFICIENCY = 0.18;
        this.HEAT_LOSS_FACTOR = 1.20;
        this.COST_THERMAL_PER_M2 = 800;
        this.COST_PV_PER_M2 = 1500;
        this.ELECTRICITY_COST = 0.80;
        this.SOLAR_IRRADIANCE = 5.5;
        this.init();
    }
    init() { this.form.addEventListener('submit', (e) => { e.preventDefault(); this.calculate(); }); }
    calculate() {
        const length = parseFloat($('#poolLength').value);
        const width = parseFloat($('#poolWidth').value);
        const depth = parseFloat($('#poolDepth').value);
        const targetTemp = parseFloat($('#targetTemp').value);
        const initialTemp = parseFloat($('#initialTemp').value);
        const heatingTime = parseFloat($('#heatingTime').value);
        if (!this.validateInputs(targetTemp, initialTemp, heatingTime)) return;
        const volume = length * width * depth;
        const volumeLiters = volume * 1000;
        const mass = volume * this.DENSITY_WATER;
        const deltaT = targetTemp - initialTemp;
        const energyKJ = mass * this.SPECIFIC_HEAT_WATER * deltaT;
        const energyKWh = (energyKJ / 3600) * this.HEAT_LOSS_FACTOR;
        const powerKW = energyKWh / heatingTime;
        const thermalArea = energyKWh / (this.SOLAR_IRRADIANCE * this.THERMAL_EFFICIENCY);
        const pvArea = energyKWh / (this.SOLAR_IRRADIANCE * this.PV_EFFICIENCY);
        const thermalCost = thermalArea * this.COST_THERMAL_PER_M2;
        const pvCost = pvArea * this.COST_PV_PER_M2;
        const monthlyUsage = energyKWh * 30;
        const annualUsage = monthlyUsage * 6;
        const annualSavings = annualUsage * this.ELECTRICITY_COST;
        this.displayResults({ volume: volumeLiters, energy: energyKWh, power: powerKW, thermalArea, pvArea, thermalCost, pvCost, savings: annualSavings });
    }
    validateInputs(targetTemp, initialTemp, heatingTime) {
        if (targetTemp <= initialTemp) { alert('A temperatura desejada deve ser maior que a temperatura inicial!'); return false; }
        if (heatingTime <= 0) { alert('O tempo de aquecimento deve ser maior que zero!'); return false; }
        return true;
    }
    displayResults(data) {
        $('#resVolume').textContent = formatNumber(data.volume);
        $('#resEnergy').textContent = formatNumber(data.energy);
        $('#resPower').textContent = formatNumber(data.power);
        $('#resThermalArea').textContent = formatNumber(data.thermalArea);
        $('#resPVArea').textContent = formatNumber(data.pvArea);
        $('#resThermalCost').textContent = formatNumber(data.thermalCost);
        $('#resPVCost').textContent = formatNumber(data.pvCost);
        $('#resSavings').textContent = formatNumber(data.savings);
        this.results.hidden = false;
        setTimeout(() => this.results.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    }
}

// ============================================
// 8. SIMULADOR CORPO NEGRO
// ============================================
class BlackBodySimulator {
    constructor() {
        this.canvas = $('#blackBodyCanvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.tempSlider = $('#bbTemp');
        this.tempValue = $('#bbTempValue');
        this.peakDisplay = $('#bbPeak');
        this.colorDisplay = $('#bbColor');
        this.powerDisplay = $('#bbPower');
        this.WIEN_CONSTANT = 2898000;
        this.STEFAN_BOLTZMANN = 5.67e-8;
        this.init();
    }
    init() { this.tempSlider.addEventListener('input', () => this.update()); this.update(); }
    update() {
        const temperature = parseInt(this.tempSlider.value);
        this.tempValue.textContent = `${temperature} K`;
        const peakWavelength = this.WIEN_CONSTANT / temperature;
        this.peakDisplay.textContent = `${peakWavelength.toFixed(0)} nm`;
        const power = this.STEFAN_BOLTZMANN * Math.pow(temperature, 4);
        this.powerDisplay.textContent = `${formatNumber(power)} W/m²`;
        const color = this.wavelengthToColor(peakWavelength);
        this.colorDisplay.textContent = color.name;
        this.draw(temperature, peakWavelength, color.rgb);
    }
    wavelengthToColor(wavelength) {
        let r, g, b, name;
        if (wavelength >= 380 && wavelength < 440) { r = -(wavelength - 440) / (440 - 380); g = 0; b = 1; name = 'Violeta'; }
        else if (wavelength >= 440 && wavelength < 490) { r = 0; g = (wavelength - 440) / (490 - 440); b = 1; name = 'Azul'; }
        else if (wavelength >= 490 && wavelength < 510) { r = 0; g = 1; b = -(wavelength - 510) / (510 - 490); name = 'Ciano'; }
        else if (wavelength >= 510 && wavelength < 580) { r = (wavelength - 510) / (580 - 510); g = 1; b = 0; name = 'Verde'; }
        else if (wavelength >= 580 && wavelength < 645) { r = 1; g = -(wavelength - 645) / (645 - 580); b = 0; name = 'Amarelo'; }
        else if (wavelength >= 645 && wavelength <= 780) { r = 1; g = 0; b = 0; name = 'Vermelho'; }
        else if (wavelength < 380) { r = 0.5; g = 0; b = 0.5; name = 'Ultravioleta'; }
        else { r = 0.5; g = 0; b = 0; name = 'Infravermelho'; }
        return { name, rgb: `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})` };
    }
    draw(temperature, peakWavelength, color) {
        const width = this.canvas.width; const height = this.canvas.height;
        this.ctx.fillStyle = '#1f252f'; this.ctx.fillRect(0, 0, width, height);
        const gradient = this.ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#8B00FF'); gradient.addColorStop(0.17, '#0000FF'); gradient.addColorStop(0.33, '#00FFFF');
        gradient.addColorStop(0.5, '#00FF00'); gradient.addColorStop(0.67, '#FFFF00'); gradient.addColorStop(0.83, '#FF0000'); gradient.addColorStop(1, '#8B0000');
        this.ctx.fillStyle = gradient; this.ctx.fillRect(0, height - 40, width, 40);
        this.ctx.strokeStyle = color; this.ctx.lineWidth = 3; this.ctx.beginPath();
        const maxIntensity = this.STEFAN_BOLTZMANN * Math.pow(temperature, 4);
        for (let x = 0; x < width; x++) {
            const wavelength = 200 + (x / width) * 1800;
            const intensity = this.planckDistribution(wavelength * 1e-9, temperature);
            const normalizedIntensity = intensity / maxIntensity;
            const y = height - 60 - (normalizedIntensity * (height - 100));
            if (x === 0) this.ctx.moveTo(x, y); else this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();
        const peakX = ((peakWavelength - 200) / 1800) * width;
        const peakIntensity = this.planckDistribution(peakWavelength * 1e-9, temperature);
        const normalizedPeak = peakIntensity / maxIntensity;
        const peakY = height - 60 - (normalizedPeak * (height - 100));
        this.ctx.fillStyle = color; this.ctx.beginPath(); this.ctx.arc(peakX, peakY, 8, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.fillStyle = '#e8f1f9'; this.ctx.font = '14px Inter'; this.ctx.textAlign = 'center';
        this.ctx.fillText(`λ_max = ${peakWavelength.toFixed(0)} nm`, peakX, peakY - 15);
        this.ctx.fillStyle = '#e0d7ef'; this.ctx.font = '12px Inter'; this.ctx.textAlign = 'left';
        this.ctx.fillText('Comprimento de onda (nm)', 10, height - 10);
        this.ctx.save(); this.ctx.translate(15, height / 2); this.ctx.rotate(-Math.PI / 2);
        this.ctx.fillText('Intensidade', 0, 0); this.ctx.restore();
    }
    planckDistribution(wavelength, temperature) {
        const h = 6.626e-34, c = 3e8, k = 1.381e-23;
        const numerator = 2 * h * Math.pow(c, 2);
        const denominator = Math.pow(wavelength, 5) * (Math.exp((h * c) / (wavelength * k * temperature)) - 1);
        return numerator / denominator;
    }
}

// ============================================
// 9. SIMULADOR EFEITO FOTOELÉTRICO
// ============================================
class PhotoelectricSimulator {
    constructor() {
        this.canvas = $('#photoelectricCanvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.freqSlider = $('#peFreq');
        this.freqValue = $('#peFreqValue');
        this.intensitySlider = $('#peIntensity');
        this.intensityValue = $('#peIntensityValue');
        this.photonEnergyDisplay = $('#peEnergy');
        this.statusDisplay = $('#peStatus');
        this.PLANCK_CONSTANT = 4.136e-15;
        this.WORK_FUNCTION = 2.3;
        this.photons = [];
        this.electrons = [];
        this.init();
    }
    init() {
        this.freqSlider.addEventListener('input', () => this.update());
        this.intensitySlider.addEventListener('input', () => this.update());
        this.update();
        this.animate();
    }
    update() {
        const frequency = parseFloat(this.freqSlider.value);
        const intensity = parseInt(this.intensitySlider.value);
        this.freqValue.textContent = `${frequency.toFixed(1)} × 10¹⁴ Hz`;
        this.intensityValue.textContent = `${intensity}%`;
        const photonEnergy = this.PLANCK_CONSTANT * frequency * 1e14;
        this.photonEnergyDisplay.textContent = `${photonEnergy.toFixed(2)} eV`;
        const canEmit = photonEnergy > this.WORK_FUNCTION;
        if (canEmit) { const kineticEnergy = photonEnergy - this.WORK_FUNCTION; this.statusDisplay.textContent = `Emitindo! Ec = ${kineticEnergy.toFixed(2)} eV`; this.statusDisplay.style.color = '#10B981'; }
        else { this.statusDisplay.textContent = 'Sem emissão (energia insuficiente)'; this.statusDisplay.style.color = '#EF4444'; }
        this.updateParticles(frequency, intensity, canEmit);
    }
    updateParticles(frequency, intensity, canEmit) {
        const photonCount = Math.floor(intensity / 20);
        for (let i = 0; i < photonCount; i++) { if (Math.random() < 0.1) this.photons.push({ x: 50, y: 100 + Math.random() * 100, speed: 3 + Math.random() * 2, frequency }); }
        if (this.photons.length > 50) this.photons = this.photons.slice(-50);
        if (this.electrons.length > 30) this.electrons = this.electrons.slice(-30);
    }
    animate() {
        const width = this.canvas.width; const height = this.canvas.height;
        this.ctx.fillStyle = '#1f252f'; this.ctx.fillRect(0, 0, width, height);
        this.ctx.fillStyle = '#57449a'; this.ctx.fillRect(250, 80, 20, 140);
        this.ctx.fillStyle = '#e0d7ef'; this.ctx.fillRect(400, 80, 20, 140);
        const frequency = parseFloat(this.freqSlider.value);
        const color = this.frequencyToColor(frequency);
        this.ctx.fillStyle = color; this.ctx.beginPath(); this.ctx.arc(50, 150, 30, 0, Math.PI * 2); this.ctx.fill();
        this.photons.forEach((photon, index) => {
            photon.x += photon.speed;
            this.ctx.fillStyle = color; this.ctx.beginPath(); this.ctx.arc(photon.x, photon.y, 4, 0, Math.PI * 2); this.ctx.fill();
            if (photon.x >= 250) {
                this.photons.splice(index, 1);
                const photonEnergy = this.PLANCK_CONSTANT * photon.frequency * 1e14;
                if (photonEnergy > this.WORK_FUNCTION) this.electrons.push({ x: 270, y: photon.y, speed: 2 + Math.random() * 2, life: 100 });
            }
        });
        this.electrons.forEach((electron, index) => {
            electron.x += electron.speed; electron.life--;
            this.ctx.fillStyle = '#10B981'; this.ctx.beginPath(); this.ctx.arc(electron.x, electron.y, 5, 0, Math.PI * 2); this.ctx.fill();
            if (electron.x > width || electron.life <= 0) this.electrons.splice(index, 1);
        });
        this.ctx.fillStyle = '#e8f1f9'; this.ctx.font = '12px Inter'; this.ctx.textAlign = 'center';
        this.ctx.fillText('Fonte de Luz', 50, 200);
        this.ctx.fillText('Placa Metálica', 260, 240);
        this.ctx.fillText('Coletor', 410, 240);
        requestAnimationFrame(() => this.animate());
    }
    frequencyToColor(frequency) {
        const wavelength = 300 / frequency;
        if (wavelength < 380) return '#8B00FF';
        if (wavelength < 450) return '#0000FF';
        if (wavelength < 495) return '#00FFFF';
        if (wavelength < 570) return '#00FF00';
        if (wavelength < 590) return '#FFFF00';
        if (wavelength < 620) return '#FFA500';
        return '#FF0000';
    }
}

// ============================================
// 10. SIMULADOR PERDA TÉRMICA
// ============================================
class HeatLossSimulator {
    constructor() {
        this.canvas = $('#heatLossCanvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.initialTempSlider = $('#hlInitial');
        this.initialTempValue = $('#hlInitialValue');
        this.ambientTempSlider = $('#hlAmbient');
        this.ambientTempValue = $('#hlAmbientValue');
        this.thermalCoverCheckbox = $('#hlCover');
        this.tempWithoutCoverDisplay = $('#hlWithout');
        this.tempWithCoverDisplay = $('#hlWith');
        this.energySavedDisplay = $('#hlSaved');
        this.init();
    }
    init() {
        this.initialTempSlider.addEventListener('input', () => this.update());
        this.ambientTempSlider.addEventListener('input', () => this.update());
        this.thermalCoverCheckbox.addEventListener('change', () => this.update());
        this.update();
    }
    update() {
        const initialTemp = parseFloat(this.initialTempSlider.value);
        const ambientTemp = parseFloat(this.ambientTempSlider.value);
        this.initialTempValue.textContent = `${initialTemp}°C`;
        this.ambientTempValue.textContent = `${ambientTemp}°C`;
        const hours = 8, timeStep = 0.5;
        const tempsWithoutCover = [initialTemp];
        const tempsWithCover = [initialTemp];
        const heatLossCoeffWithout = 0.08;
        const heatLossCoeffWith = 0.02;
        let currentTemp = initialTemp;
        for (let t = 0; t < hours; t += timeStep) { const deltaT = currentTemp - ambientTemp; currentTemp -= deltaT * heatLossCoeffWithout * timeStep; tempsWithoutCover.push(Math.max(currentTemp, ambientTemp)); }
        currentTemp = initialTemp;
        for (let t = 0; t < hours; t += timeStep) { const deltaT = currentTemp - ambientTemp; currentTemp -= deltaT * heatLossCoeffWith * timeStep; tempsWithCover.push(Math.max(currentTemp, ambientTemp)); }
        const finalTempWithout = tempsWithoutCover[tempsWithoutCover.length - 1];
        const finalTempWith = tempsWithCover[tempsWithCover.length - 1];
        this.tempWithoutCoverDisplay.textContent = `${finalTempWithout.toFixed(1)}°C`;
        this.tempWithCoverDisplay.textContent = `${finalTempWith.toFixed(1)}°C`;
        const energySaved = ((finalTempWith - finalTempWithout) / (initialTemp - ambientTemp)) * 100;
        this.energySavedDisplay.textContent = `${Math.max(0, energySaved).toFixed(0)}%`;
        this.draw(tempsWithoutCover, tempsWithCover, hours);
    }
    draw(tempsWithoutCover, tempsWithCover, hours) {
        const width = this.canvas.width; const height = this.canvas.height; const padding = 50;
        this.ctx.fillStyle = '#1f252f'; this.ctx.fillRect(0, 0, width, height);
        const maxTemp = Math.max(...tempsWithoutCover, ...tempsWithCover);
        const minTemp = Math.min(...tempsWithoutCover, ...tempsWithCover);
        const tempRange = maxTemp - minTemp;
        this.ctx.strokeStyle = '#2a3140'; this.ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padding + (i / 5) * (height - 2 * padding);
            this.ctx.beginPath(); this.ctx.moveTo(padding, y); this.ctx.lineTo(width - padding, y); this.ctx.stroke();
            const temp = maxTemp - (i / 5) * tempRange;
            this.ctx.fillStyle = '#e0d7ef'; this.ctx.font = '11px Inter'; this.ctx.textAlign = 'right';
            this.ctx.fillText(`${temp.toFixed(1)}°C`, padding - 5, y + 4);
        }
        for (let i = 0; i <= 8; i++) {
            const x = padding + (i / 8) * (width - 2 * padding);
            this.ctx.fillStyle = '#e0d7ef'; this.ctx.font = '11px Inter'; this.ctx.textAlign = 'center';
            this.ctx.fillText(`${i}h`, x, height - padding + 20);
        }
        this.ctx.strokeStyle = '#EF4444'; this.ctx.lineWidth = 3; this.ctx.beginPath();
        tempsWithoutCover.forEach((temp, index) => { const x = padding + (index / (tempsWithoutCover.length - 1)) * (width - 2 * padding); const y = padding + ((maxTemp - temp) / tempRange) * (height - 2 * padding); if (index === 0) this.ctx.moveTo(x, y); else this.ctx.lineTo(x, y); });
        this.ctx.stroke();
        this.ctx.strokeStyle = '#10B981'; this.ctx.lineWidth = 3; this.ctx.beginPath();
        tempsWithCover.forEach((temp, index) => { const x = padding + (index / (tempsWithCover.length - 1)) * (width - 2 * padding); const y = padding + ((maxTemp - temp) / tempRange) * (height - 2 * padding); if (index === 0) this.ctx.moveTo(x, y); else this.ctx.lineTo(x, y); });
        this.ctx.stroke();
        this.ctx.fillStyle = '#EF4444'; this.ctx.fillRect(width - 150, 20, 20, 3);
        this.ctx.fillStyle = '#e8f1f9'; this.ctx.font = '12px Inter'; this.ctx.textAlign = 'left';
        this.ctx.fillText('Sem capa térmica', width - 125, 25);
        this.ctx.fillStyle = '#10B981'; this.ctx.fillRect(width - 150, 40, 20, 3);
        this.ctx.fillStyle = '#e8f1f9';
        this.ctx.fillText('Com capa térmica', width - 125, 45);
        this.ctx.fillStyle = '#e0d7ef'; this.ctx.font = '12px Inter'; this.ctx.textAlign = 'center';
        this.ctx.fillText('Tempo (horas)', width / 2, height - 10);
        this.ctx.save(); this.ctx.translate(15, height / 2); this.ctx.rotate(-Math.PI / 2);
        this.ctx.fillText('Temperatura (°C)', 0, 0); this.ctx.restore();
    }
}

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    new AccessibilityManager();
    new ThemeManager();
    new ZoomManager();
    new NavigationManager();
    new CounterAnimation();
    new RevealAnimation();
    new EnergyCalculator();
    new BlackBodySimulator();
    new PhotoelectricSimulator();
    new HeatLossSimulator();
});
