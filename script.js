/**
 * ============================================
 * PISCINA SOLAR - SCRIPT PRINCIPAL
 * Projeto Integrador CEP - 3º Trimestre 2026
 * Tema: É possível aquecer a piscina da escola com energia solar?
 * ============================================
 *
 * Este arquivo contém toda a lógica interativa do site, incluindo:
 * - Gerenciamento de acessibilidade (temas, VLibras)
 * - Gerenciador de Tema (Modo Claro/Escuro) [NOVO]
 * - Gerenciador de Zoom Adaptativo (ícone cadeirante) [NOVO]
 * - Navegação e scroll suave
 * - Animações de entrada (Intersection Observer)
 * - Contadores animados
 * - Calculadora de dimensionamento energético
 * - Simulador de Corpo Negro (Lei de Wien e Stefan-Boltzmann)
 * - Simulador do Efeito Fotoelétrico
 * - Simulador de Perda Térmica Noturna
 */

// ============================================
// 1. UTILITÁRIOS GLOBAIS
// ============================================

/**
 * Seleciona um único elemento do DOM
 * @param {string} selector - Seletor CSS
 * @returns {HTMLElement|null}
 */
const $ = (selector) => document.querySelector(selector);

/**
 * Seleciona múltiplos elementos do DOM
 * @param {string} selector - Seletor CSS
 * @returns {NodeList}
 */
const $$ = (selector) => document.querySelectorAll(selector);

/**
 * Função debounce para otimizar performance em eventos de scroll/resize
 * @param {Function} func - Função a ser executada
 * @param {number} wait - Tempo de espera em milissegundos
 * @returns {Function}
 */
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

/**
 * Formata número com separadores de milhar e decimais (padrão pt-BR)
 * @param {number} num - Número a ser formatado
 * @returns {string}
 */
const formatNumber = (num) => {
    return num.toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 0 });
};

// ============================================
// 2. GERENCIADOR DE ACESSIBILIDADE
// ============================================

class AccessibilityManager {
    constructor() {
        this.toggle = $('#a11yToggle');
        this.menu = $('#a11yMenu');
        this.options = $$('.a11y-option');
        this.currentTheme = localStorage.getItem('accessibility-theme') || 'default';
        this.init();
    }

    init() {
        // Aplica tema salvo no carregamento
        if (this.currentTheme !== 'default') {
            document.documentElement.setAttribute('data-theme', this.currentTheme);
        }

        // Event listeners para o botão toggle
        this.toggle.addEventListener('click', () => this.toggleMenu());
        this.toggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggleMenu();
            }
        });

        // Event listeners para as opções de tema
        this.options.forEach(option => {
            option.addEventListener('click', () => {
                const theme = option.getAttribute('data-theme');
                this.setTheme(theme);
            });

            // Suporte a teclado para opções
            option.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const theme = option.getAttribute('data-theme');
                    this.setTheme(theme);
                }
            });
        });

        // Fecha menu ao clicar fora
        document.addEventListener('click', (e) => {
            if (!this.toggle.contains(e.target) && !this.menu.contains(e.target)) {
                this.closeMenu();
            }
        });

        // Fecha menu com tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.menu.classList.contains('active')) {
                this.closeMenu();
                this.toggle.focus();
            }
        });
    }

    toggleMenu() {
        const isOpen = this.menu.classList.contains('active');
        if (isOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    openMenu() {
        this.menu.classList.add('active');
        this.toggle.setAttribute('aria-expanded', 'true');
        this.menu.setAttribute('aria-hidden', 'false');

        // Foca no primeiro item do menu para acessibilidade por teclado
        const firstOption = this.menu.querySelector('.a11y-option');
        if (firstOption) {
            setTimeout(() => firstOption.focus(), 100);
        }
    }

    closeMenu() {
        this.menu.classList.remove('active');
        this.toggle.setAttribute('aria-expanded', 'false');
        this.menu.setAttribute('aria-hidden', 'true');
    }

    setTheme(theme) {
        if (theme === 'reset') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.removeItem('accessibility-theme');
            this.currentTheme = 'default';
        } else {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('accessibility-theme', theme);
            this.currentTheme = theme;
        }

        // Feedback visual e fecha o menu
        this.closeMenu();

        // Anuncia mudança para leitores de tela (opcional, mas boa prática)
        this.announceChange(theme);
    }

    announceChange(theme) {
        const announcements = {
            'high-contrast': 'Modo alto contraste ativado',
            'dyslexia': 'Fonte para dislexia ativada',
            'large-text': 'Texto grande ativado',
            'reduce-motion': 'Animações reduzidas ativadas',
            'reset': 'Configurações restauradas ao padrão'
        };

        if (announcements[theme]) {
            // Cria um elemento temporário para o screen reader
            const announcement = document.createElement('div');
            announcement.setAttribute('role', 'status');
            announcement.setAttribute('aria-live', 'polite');
            announcement.className = 'sr-only';
            announcement.textContent = announcements[theme];
            document.body.appendChild(announcement);

            setTimeout(() => {
                document.body.removeChild(announcement);
            }, 1000);
        }
    }
}

// ============================================
// 3. GERENCIADOR DE TEMA (MODO CLARO/ESCURO) [NOVO]
// ============================================

class ThemeManager {
    constructor() {
        this.toggle = $('#themeToggle');
        this.currentTheme = localStorage.getItem('color-theme') || 'light';
        this.init();
    }

    init() {
        // Aplica o tema salvo ao carregar a página
        if (this.currentTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        }

        // Event listener para o botão de alternância
        this.toggle.addEventListener('click', () => this.toggleTheme());
        this.toggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }

    toggleTheme() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        if (isDark) {
            // Muda para modo claro
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('color-theme', 'light');
            this.currentTheme = 'light';
            this.announce('Modo claro ativado');
        } else {
            // Muda para modo escuro
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('color-theme', 'dark');
            this.currentTheme = 'dark';
            this.announce('Modo escuro ativado');
        }
    }

    announce(message) {
        const el = document.createElement('div');
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        el.className = 'sr-only';
        el.textContent = message;
        document.body.appendChild(el);
        setTimeout(() => document.body.removeChild(el), 1000);
    }
}

// ============================================
// 4. GERENCIADOR DE ZOOM ADAPTATIVO [NOVO]
// ============================================

class ZoomManager {
    constructor() {
        this.toggle = $('#zoomToggle');
        this.menu = $('#zoomMenu');
        this.zoomOutBtn = $('#zoomOut');
        this.zoomResetBtn = $('#zoomReset');
        this.zoomInBtn = $('#zoomIn');
        this.zoomValueDisplay = $('#zoomValue');

        this.zoomLevel = parseFloat(localStorage.getItem('zoom-level')) || 1;
        this.zoomStep = 0.1;
        this.minZoom = 0.7;
        this.maxZoom = 1.5;

        this.init();
    }

    init() {
        // Aplica o zoom salvo ao carregar
        if (this.zoomLevel !== 1) {
            this.applyZoom(this.zoomLevel, false);
        }

        // Toggle do menu
        this.toggle.addEventListener('click', () => this.toggleMenu());
        this.toggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggleMenu();
            }
        });

        // Botões de zoom
        this.zoomOutBtn.addEventListener('click', () => this.decreaseZoom());
        this.zoomResetBtn.addEventListener('click', () => this.resetZoom());
        this.zoomInBtn.addEventListener('click', () => this.increaseZoom());

        // Fecha o menu ao clicar fora
        document.addEventListener('click', (e) => {
            if (!this.toggle.contains(e.target) && !this.menu.contains(e.target)) {
                this.closeMenu();
            }
        });

        // Fecha com tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.menu.classList.contains('active')) {
                this.closeMenu();
                this.toggle.focus();
            }
        });

        // Atalhos de teclado nativos (Ctrl/Cmd + +/-)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
                e.preventDefault();
                this.increaseZoom();
            } else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
                e.preventDefault();
                this.decreaseZoom();
            } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
                e.preventDefault();
                this.resetZoom();
            }
        });

        // Recalcula no resize da janela para evitar cortes
        window.addEventListener('resize', debounce(() => {
            if (this.zoomLevel !== 1) {
                this.applyZoom(this.zoomLevel, false);
            }
        }, 200));
    }

    toggleMenu() {
        const isOpen = this.menu.classList.contains('active');
        isOpen ? this.closeMenu() : this.openMenu();
    }

    openMenu() {
        this.menu.classList.add('active');
        this.toggle.setAttribute('aria-expanded', 'true');
        this.menu.setAttribute('aria-hidden', 'false');
    }

    closeMenu() {
        this.menu.classList.remove('active');
        this.toggle.setAttribute('aria-expanded', 'false');
        this.menu.setAttribute('aria-hidden', 'true');
    }

    increaseZoom() {
        const newZoom = Math.min(this.zoomLevel + this.zoomStep, this.maxZoom);
        this.applyZoom(newZoom);
    }

    decreaseZoom() {
        const newZoom = Math.max(this.zoomLevel - this.zoomStep, this.minZoom);
        this.applyZoom(newZoom);
    }

    resetZoom() {
        this.applyZoom(1);
    }

    applyZoom(level, save = true) {
        this.zoomLevel = level;

        // Atualiza o display do menu
        this.zoomValueDisplay.textContent = `${Math.round(level * 100)}%`;

        // Aplica o scale no body
        document.body.style.transform = `scale(${level})`;
        document.body.style.transformOrigin = 'top left';

        // COMPENSAÇÃO DE LARGURA: Evita que o conteúdo vaze para a direita (scroll horizontal)
        const inverseWidth = 100 / level;
        document.body.style.width = `${inverseWidth}%`;

        // COMPENSAÇÃO DE ALTURA: Evita espaço em branco no final da página
        const viewportHeight = window.innerHeight;
        const scaledHeight = viewportHeight / level;
        document.body.style.minHeight = `${scaledHeight}px`;

        if (save) {
            localStorage.setItem('zoom-level', level);
            this.announce(`Zoom ajustado para ${Math.round(level * 100)}%`);
        }
    }

    announce(message) {
        const el = document.createElement('div');
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        el.className = 'sr-only';
        el.textContent = message;
        document.body.appendChild(el);
        setTimeout(() => document.body.removeChild(el), 1000);
    }
}

// ============================================
// 5. GERENCIADOR DE NAVEGAÇÃO
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
        // Efeito de scroll no header
        window.addEventListener('scroll', debounce(() => {
            this.handleScroll();
        }, 100));

        // Toggle do menu mobile
        this.mobileToggle.addEventListener('click', () => this.toggleMobileMenu());

        // Scroll suave para links internos
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetElement = $(targetId);

                if (targetElement) {
                    const headerHeight = this.header.offsetHeight;
                    const targetPosition = targetElement.offsetTop - headerHeight;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });

                    // Fecha menu mobile se estiver aberto
                    if (this.mainNav.classList.contains('active')) {
                        this.closeMobileMenu();
                    }
                }
            });
        });

        // Atualiza link ativo baseado na posição do scroll
        window.addEventListener('scroll', debounce(() => {
            this.updateActiveLink();
        }, 100));

        // Botão voltar ao topo
        this.backToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    handleScroll() {
        const scrollY = window.scrollY;

        // Adiciona classe scrolled ao header
        if (scrollY > 50) {
            this.header.classList.add('scrolled');
        } else {
            this.header.classList.remove('scrolled');
        }

        // Mostra/esconde botão voltar ao topo
        if (scrollY > 500) {
            this.backToTop.classList.add('visible');
        } else {
            this.backToTop.classList.remove('visible');
        }
    }

    toggleMobileMenu() {
        const isOpen = this.mainNav.classList.contains('active');
        if (isOpen) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }

    openMobileMenu() {
        this.mainNav.classList.add('active');
        this.mobileToggle.classList.add('active');
        this.mobileToggle.setAttribute('aria-expanded', 'true');
    }

    closeMobileMenu() {
        this.mainNav.classList.remove('active');
        this.mobileToggle.classList.remove('active');
        this.mobileToggle.setAttribute('aria-expanded', 'false');
    }

    updateActiveLink() {
        const scrollPosition = window.scrollY + 200;

        this.navLinks.forEach(link => {
            const sectionId = link.getAttribute('href');
            const section = $(sectionId);

            if (section) {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;

                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    this.navLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                }
            }
        });
    }
}

// ============================================
// 6. ANIMAÇÃO DE CONTADORES
// ============================================

class CounterAnimation {
    constructor() {
        this.counters = $$('.stat-number');
        this.observed = false;
        this.init();
    }

    init() {
        // Intersection Observer para animar quando visível
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.observed) {
                    this.animateCounters();
                    this.observed = true;
                }
            });
        }, { threshold: 0.5 });

        const heroStats = $('.hero-stats');
        if (heroStats) {
            observer.observe(heroStats);
        }
    }

    animateCounters() {
        this.counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'));
            const duration = 2000; // 2 segundos
            const increment = target / (duration / 16); // 60fps
            let current = 0;

            const updateCounter = () => {
                current += increment;
                if (current < target) {
                    counter.textContent = Math.floor(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target;
                }
            };

            updateCounter();
        });
    }
}

// ============================================
// 7. ANIMAÇÃO DE REVEAL (SCROLL)
// ============================================

class RevealAnimation {
    constructor() {
        this.elements = $$('[data-reveal]');
        this.init();
    }

    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    // Para de observar após revelar (performance)
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        this.elements.forEach(element => {
            observer.observe(element);
        });
    }
}

// ============================================
// 8. CALCULADORA DE ENERGIA
// ============================================

class EnergyCalculator {
    constructor() {
        this.form = $('#energyForm');
        this.results = $('#calcResults');

        // Constantes físicas e econômicas
        this.SPECIFIC_HEAT_WATER = 4.186; // kJ/kg·°C
        this.DENSITY_WATER = 1000; // kg/m³
        this.THERMAL_EFFICIENCY = 0.80; // 80%
        this.PV_EFFICIENCY = 0.18; // 18%
        this.HEAT_LOSS_FACTOR = 1.20; // 20% de perdas
        this.COST_THERMAL_PER_M2 = 800; // R$/m²
        this.COST_PV_PER_M2 = 1500; // R$/m²
        this.ELECTRICITY_COST = 0.80; // R$/kWh
        this.SOLAR_IRRADIANCE = 5.5; // kWh/m²/dia (média Brasil)

        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.calculate();
        });
    }

    calculate() {
        // Obtém valores do formulário
        const length = parseFloat($('#poolLength').value);
        const width = parseFloat($('#poolWidth').value);
        const depth = parseFloat($('#poolDepth').value);
        const targetTemp = parseFloat($('#targetTemp').value);
        const initialTemp = parseFloat($('#initialTemp').value);
        const heatingTime = parseFloat($('#heatingTime').value);

        // Validação
        if (!this.validateInputs(length, width, depth, targetTemp, initialTemp, heatingTime)) {
            return;
        }

        // Cálculos
        const volume = length * width * depth; // m³
        const volumeLiters = volume * 1000; // litros
        const mass = volume * this.DENSITY_WATER; // kg
        const deltaT = targetTemp - initialTemp; // °C

        // Energia necessária (Q = m * c * ΔT)
        const energyKJ = mass * this.SPECIFIC_HEAT_WATER * deltaT;
        const energyKWh = (energyKJ / 3600) * this.HEAT_LOSS_FACTOR; // Considera perdas

        // Potência necessária
        const powerKW = energyKWh / heatingTime;

        // Área de coletores térmicos necessários
        const thermalArea = energyKWh / (this.SOLAR_IRRADIANCE * this.THERMAL_EFFICIENCY);

        // Área de painéis fotovoltaicos necessários
        const pvArea = energyKWh / (this.SOLAR_IRRADIANCE * this.PV_EFFICIENCY);

        // Custos estimados
        const thermalCost = thermalArea * this.COST_THERMAL_PER_M2;
        const pvCost = pvArea * this.COST_PV_PER_M2;

        // Economia anual (considerando 6 meses de uso)
        const monthlyUsage = energyKWh * 30; // 30 dias
        const annualUsage = monthlyUsage * 6; // 6 meses
        const annualSavings = annualUsage * this.ELECTRICITY_COST;

        // Exibe resultados
        this.displayResults({
            volume: volumeLiters,
            energy: energyKWh,
            power: powerKW,
            thermalArea: thermalArea,
            pvArea: pvArea,
            thermalCost: thermalCost,
            pvCost: pvCost,
            savings: annualSavings
        });
    }

    validateInputs(length, width, depth, targetTemp, initialTemp, heatingTime) {
        if (targetTemp <= initialTemp) {
            alert('A temperatura desejada deve ser maior que a temperatura inicial!');
            return false;
        }

        if (heatingTime <= 0) {
            alert('O tempo de aquecimento deve ser maior que zero!');
            return false;
        }

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

        // Scroll suave até os resultados
        setTimeout(() => {
            this.results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }
}

// ============================================
// 9. SIMULADOR DE CORPO NEGRO
// ============================================

class BlackBodySimulator {
    constructor() {
        this.canvas = $('#blackBodyCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.tempSlider = $('#bbTemp');
        this.tempValue = $('#bbTempValue');
        this.peakDisplay = $('#bbPeak');
        this.colorDisplay = $('#bbColor');
        this.powerDisplay = $('#bbPower');

        // Constantes físicas
        this.WIEN_CONSTANT = 2898000; // nm·K
        this.STEFAN_BOLTZMANN = 5.67e-8; // W/m²·K⁴

        this.init();
    }

    init() {
        this.tempSlider.addEventListener('input', () => this.update());
        this.update();
    }

    update() {
        const temperature = parseInt(this.tempSlider.value);
        this.tempValue.textContent = `${temperature} K`;

        // Calcula pico de emissão (Lei de Wien)
        const peakWavelength = this.WIEN_CONSTANT / temperature;
        this.peakDisplay.textContent = `${peakWavelength.toFixed(0)} nm`;

        // Calcula potência emitida (Lei de Stefan-Boltzmann)
        const power = this.STEFAN_BOLTZMANN * Math.pow(temperature, 4);
        this.powerDisplay.textContent = `${formatNumber(power)} W/m²`;

        // Determina cor predominante
        const color = this.wavelengthToColor(peakWavelength);
        this.colorDisplay.textContent = color.name;

        // Desenha simulação
        this.draw(temperature, peakWavelength, color.rgb);
    }

    wavelengthToColor(wavelength) {
        let r, g, b;
        let name;

        if (wavelength >= 380 && wavelength < 440) {
            r = -(wavelength - 440) / (440 - 380);
            g = 0;
            b = 1;
            name = 'Violeta';
        } else if (wavelength >= 440 && wavelength < 490) {
            r = 0;
            g = (wavelength - 440) / (490 - 440);
            b = 1;
            name = 'Azul';
        } else if (wavelength >= 490 && wavelength < 510) {
            r = 0;
            g = 1;
            b = -(wavelength - 510) / (510 - 490);
            name = 'Ciano';
        } else if (wavelength >= 510 && wavelength < 580) {
            r = (wavelength - 510) / (580 - 510);
            g = 1;
            b = 0;
            name = 'Verde';
        } else if (wavelength >= 580 && wavelength < 645) {
            r = 1;
            g = -(wavelength - 645) / (645 - 580);
            b = 0;
            name = 'Amarelo';
        } else if (wavelength >= 645 && wavelength <= 780) {
            r = 1;
            g = 0;
            b = 0;
            name = 'Vermelho';
        } else if (wavelength < 380) {
            r = 0.5;
            g = 0;
            b = 0.5;
            name = 'Ultravioleta';
        } else {
            r = 0.5;
            g = 0;
            b = 0;
            name = 'Infravermelho';
        }

        return {
            name: name,
            rgb: `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`
        };
    }

    draw(temperature, peakWavelength, color) {
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Limpa canvas
        this.ctx.fillStyle = '#1f252f';
        this.ctx.fillRect(0, 0, width, height);

        // Desenha espectro de fundo
        const gradient = this.ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#8B00FF'); // Violeta
        gradient.addColorStop(0.17, '#0000FF'); // Azul
        gradient.addColorStop(0.33, '#00FFFF'); // Ciano
        gradient.addColorStop(0.5, '#00FF00'); // Verde
        gradient.addColorStop(0.67, '#FFFF00'); // Amarelo
        gradient.addColorStop(0.83, '#FF0000'); // Vermelho
        gradient.addColorStop(1, '#8B0000'); // Vermelho escuro

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, height - 40, width, 40);

        // Desenha curva de Planck (simplificada)
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();

        const maxIntensity = this.STEFAN_BOLTZMANN * Math.pow(temperature, 4);

        for (let x = 0; x < width; x++) {
            const wavelength = 200 + (x / width) * 1800; // 200nm a 2000nm
            const intensity = this.planckDistribution(wavelength * 1e-9, temperature);
            const normalizedIntensity = intensity / maxIntensity;
            const y = height - 60 - (normalizedIntensity * (height - 100));

            if (x === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }

        this.ctx.stroke();

        // Desenha marcador do pico
        const peakX = ((peakWavelength - 200) / 1800) * width;
        const peakIntensity = this.planckDistribution(peakWavelength * 1e-9, temperature);
        const normalizedPeak = peakIntensity / maxIntensity;
        const peakY = height - 60 - (normalizedPeak * (height - 100));

        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(peakX, peakY, 8, 0, Math.PI * 2);
        this.ctx.fill();

        // Label do pico
        this.ctx.fillStyle = '#e8f1f9';
        this.ctx.font = '14px Inter';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`λ_max = ${peakWavelength.toFixed(0)} nm`, peakX, peakY - 15);

        // Labels dos eixos
        this.ctx.fillStyle = '#e0d7ef';
        this.ctx.font = '12px Inter';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Comprimento de onda (nm)', 10, height - 10);
        this.ctx.save();
        this.ctx.translate(15, height / 2);
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.fillText('Intensidade', 0, 0);
        this.ctx.restore();
    }

    planckDistribution(wavelength, temperature) {
        const h = 6.626e-34; // Constante de Planck
        const c = 3e8; // Velocidade da luz
        const k = 1.381e-23; // Constante de Boltzmann

        const numerator = 2 * h * Math.pow(c, 2);
        const denominator = Math.pow(wavelength, 5) * (Math.exp((h * c) / (wavelength * k * temperature)) - 1);

        return numerator / denominator;
    }
}

// ============================================
// 10. SIMULADOR DO EFEITO FOTOELÉTRICO
// ============================================

class PhotoelectricSimulator {
    constructor() {
        this.canvas = $('#photoelectricCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.freqSlider = $('#peFreq');
        this.freqValue = $('#peFreqValue');
        this.intensitySlider = $('#peIntensity');
        this.intensityValue = $('#peIntensityValue');
        this.photonEnergyDisplay = $('#peEnergy');
        this.statusDisplay = $('#peStatus');

        // Constantes
        this.PLANCK_CONSTANT = 4.136e-15; // eV·s
        this.WORK_FUNCTION = 2.3; // eV (Sódio)

        this.photons = [];
        this.electrons = [];
        this.animationId = null;

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

        // Calcula energia do fóton (E = hf)
        const photonEnergy = this.PLANCK_CONSTANT * frequency * 1e14;
        this.photonEnergyDisplay.textContent = `${photonEnergy.toFixed(2)} eV`;

        // Verifica se há emissão de elétrons
        const canEmit = photonEnergy > this.WORK_FUNCTION;

        if (canEmit) {
            const kineticEnergy = photonEnergy - this.WORK_FUNCTION;
            this.statusDisplay.textContent = `Emitindo! Ec = ${kineticEnergy.toFixed(2)} eV`;
            this.statusDisplay.style.color = '#10B981';
        } else {
            this.statusDisplay.textContent = 'Sem emissão (energia insuficiente)';
            this.statusDisplay.style.color = '#EF4444';
        }

        // Atualiza partículas
        this.updateParticles(frequency, intensity, canEmit);
    }

    updateParticles(frequency, intensity, canEmit) {
        // Adiciona novos fótons
        const photonCount = Math.floor(intensity / 20);
        for (let i = 0; i < photonCount; i++) {
            if (Math.random() < 0.1) {
                this.photons.push({
                    x: 50,
                    y: 100 + Math.random() * 100,
                    speed: 3 + Math.random() * 2,
                    frequency: frequency
                });
            }
        }

        // Limita quantidade de partículas para performance
        if (this.photons.length > 50) {
            this.photons = this.photons.slice(-50);
        }

        if (this.electrons.length > 30) {
            this.electrons = this.electrons.slice(-30);
        }
    }

    animate() {
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Limpa canvas
        this.ctx.fillStyle = '#1f252f';
        this.ctx.fillRect(0, 0, width, height);

        // Desenha placa metálica
        this.ctx.fillStyle = '#57449a';
        this.ctx.fillRect(250, 80, 20, 140);

        // Desenha coletor
        this.ctx.fillStyle = '#e0d7ef';
        this.ctx.fillRect(400, 80, 20, 140);

        // Desenha fonte de luz
        const frequency = parseFloat(this.freqSlider.value);
        const color = this.frequencyToColor(frequency);
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(50, 150, 30, 0, Math.PI * 2);
        this.ctx.fill();

        // Atualiza e desenha fótons
        this.photons.forEach((photon, index) => {
            photon.x += photon.speed;

            // Desenha fóton
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(photon.x, photon.y, 4, 0, Math.PI * 2);
            this.ctx.fill();

            // Verifica colisão com placa
            if (photon.x >= 250) {
                this.photons.splice(index, 1);

                // Gera elétron se energia suficiente
                const photonEnergy = this.PLANCK_CONSTANT * photon.frequency * 1e14;
                if (photonEnergy > this.WORK_FUNCTION) {
                    this.electrons.push({
                        x: 270,
                        y: photon.y,
                        speed: 2 + Math.random() * 2,
                        life: 100
                    });
                }
            }
        });

        // Atualiza e desenha elétrons
        this.electrons.forEach((electron, index) => {
            electron.x += electron.speed;
            electron.life--;

            // Desenha elétron
            this.ctx.fillStyle = '#10B981';
            this.ctx.beginPath();
            this.ctx.arc(electron.x, electron.y, 5, 0, Math.PI * 2);
            this.ctx.fill();

            // Remove elétron se saiu da tela ou expirou
            if (electron.x > width || electron.life <= 0) {
                this.electrons.splice(index, 1);
            }
        });

        // Labels
        this.ctx.fillStyle = '#e8f1f9';
        this.ctx.font = '12px Inter';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Fonte de Luz', 50, 200);
        this.ctx.fillText('Placa Metálica', 260, 240);
        this.ctx.fillText('Coletor', 410, 240);

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    frequencyToColor(frequency) {
        // frequency em 10^14 Hz
        const wavelength = 300 / frequency; // nm (aproximado)

        if (wavelength < 380) return '#8B00FF'; // UV
        if (wavelength < 450) return '#0000FF'; // Azul
        if (wavelength < 495) return '#00FFFF'; // Ciano
        if (wavelength < 570) return '#00FF00'; // Verde
        if (wavelength < 590) return '#FFFF00'; // Amarelo
        if (wavelength < 620) return '#FFA500'; // Laranja
        return '#FF0000'; // Vermelho
    }
}

// ============================================
// 11. SIMULADOR DE PERDA TÉRMICA
// ============================================

class HeatLossSimulator {
    constructor() {
        this.canvas = $('#heatLossCanvas');
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
        const useCover = this.thermalCoverCheckbox.checked;

        this.initialTempValue.textContent = `${initialTemp}°C`;
        this.ambientTempValue.textContent = `${ambientTemp}°C`;

        // Simula perda de temperatura ao longo de 8 horas
        const hours = 8;
        const timeStep = 0.5; // horas
        const tempsWithoutCover = [initialTemp];
        const tempsWithCover = [initialTemp];

        // Coeficientes de perda de calor
        const heatLossCoeffWithout = 0.08; // 8% por hora sem capa
        const heatLossCoeffWith = 0.02; // 2% por hora com capa

        // Simula perda sem capa
        let currentTemp = initialTemp;
        for (let t = 0; t < hours; t += timeStep) {
            const deltaT = currentTemp - ambientTemp;
            const loss = deltaT * heatLossCoeffWithout * timeStep;
            currentTemp -= loss;
            tempsWithoutCover.push(Math.max(currentTemp, ambientTemp));
        }

        // Simula perda com capa
        currentTemp = initialTemp;
        for (let t = 0; t < hours; t += timeStep) {
            const deltaT = currentTemp - ambientTemp;
            const loss = deltaT * heatLossCoeffWith * timeStep;
            currentTemp -= loss;
            tempsWithCover.push(Math.max(currentTemp, ambientTemp));
        }

        // Atualiza
