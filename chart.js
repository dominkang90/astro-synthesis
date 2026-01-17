/**
 * Astro-Synthesis 차트 시각화 모듈 v1.0
 * SVG 기반 천궁도 및 사주팔자 차트 렌더링
 */

const ChartRenderer = (function() {
    'use strict';

    // ===== 다크 모드 감지 =====
    function isDarkMode() {
        return document.documentElement.getAttribute('data-theme') === 'dark';
    }

    // ===== 설정 =====
    function getConfig() {
        const dark = isDarkMode();
        return {
            // 천궁도 설정
            astroChart: {
                width: 400,
                height: 400,
                centerX: 200,
                centerY: 200,
                outerRadius: 180,
                innerRadius: 120,
                planetRadius: 90,
                colors: {
                    background: dark ? '#161b22' : '#f5f5f7',
                    zodiacRing: dark ? '#30363d' : '#e5e5ea',
                    houseLines: dark ? '#484f58' : '#d2d2d7',
                    fire: '#ff3b30',
                    earth: dark ? '#d4a574' : '#8b5a2b',
                    air: dark ? '#5ac8fa' : '#007aff',
                    water: '#34c759',
                    planets: dark ? '#f0f6fc' : '#1d1d1f',
                    text: dark ? '#f0f6fc' : '#1d1d1f',
                    textSecondary: dark ? '#8b949e' : '#8e8e93',
                    cardBg: dark ? '#0d1117' : '#ffffff',
                    aspects: {
                        trine: '#34c759',
                        sextile: dark ? '#5ac8fa' : '#007aff',
                        square: '#ff3b30',
                        opposition: '#ff9500',
                        conjunction: dark ? '#8b949e' : '#8e8e93'
                    }
                }
            },
            // 사주 차트 설정
            sajuChart: {
                width: 400,
                height: 200,
                colors: {
                    background: dark ? '#161b22' : '#f5f5f7',
                    text: dark ? '#f0f6fc' : '#1d1d1f',
                    textSecondary: dark ? '#8b949e' : '#8e8e93',
                    cardBg: dark ? '#0d1117' : '#ffffff',
                    wood: '#34c759',
                    fire: '#ff3b30',
                    earth: '#ff9500',
                    metal: dark ? '#e0e0e0' : '#c0c0c0',
                    water: dark ? '#5ac8fa' : '#007aff'
                }
            }
        };
    }

    // 기존 CONFIG 유지 (호환성)
    const CONFIG = getConfig();

    // 별자리 심볼
    const ZODIAC_SYMBOLS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
    const ZODIAC_NAMES = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
                         'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

    // 행성 심볼
    const PLANET_SYMBOLS = {
        Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂',
        Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇'
    };

    // 원소별 색상
    const ELEMENT_COLORS = {
        Fire: CONFIG.astroChart.colors.fire,
        Earth: CONFIG.astroChart.colors.earth,
        Air: CONFIG.astroChart.colors.air,
        Water: CONFIG.astroChart.colors.water
    };

    // 오행 색상
    const WUXING_COLORS = {
        '木': '#34c759',
        '火': '#ff3b30',
        '土': '#ff9500',
        '金': '#c0c0c0',
        '水': '#007aff'
    };

    // ===== 서양 점성술 천궁도 =====

    /**
     * 서양 점성술 차트 렌더링
     */
    function renderAstroChart(containerId, astroResult) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const config = getConfig();
        const { width, height, centerX, centerY, outerRadius, innerRadius, planetRadius, colors } = config.astroChart;

        // SVG 생성
        let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;

        // 배경
        svg += `<rect width="${width}" height="${height}" fill="${colors.background}" rx="12"/>`;

        // 외곽 원 (황도대)
        svg += `<circle cx="${centerX}" cy="${centerY}" r="${outerRadius}" fill="none" stroke="${colors.houseLines}" stroke-width="2"/>`;
        svg += `<circle cx="${centerX}" cy="${centerY}" r="${innerRadius}" fill="white" stroke="${colors.houseLines}" stroke-width="1"/>`;

        // 12 별자리 구역
        svg += renderZodiacSections(centerX, centerY, outerRadius, innerRadius, astroResult.ascendant.totalDegree);

        // 하우스 라인
        svg += renderHouseLines(centerX, centerY, innerRadius, outerRadius, astroResult.ascendant.totalDegree);

        // 행성 배치
        svg += renderPlanets(centerX, centerY, planetRadius, astroResult.planetPositions, astroResult.ascendant.totalDegree);

        // 어스펙트 라인
        svg += renderAspectLines(centerX, centerY, planetRadius, astroResult.aspects, astroResult.planetPositions, astroResult.ascendant.totalDegree);

        // 중앙 정보
        svg += renderCenterInfo(centerX, centerY, astroResult);

        svg += '</svg>';

        container.innerHTML = svg;
    }

    /**
     * 황도대 구역 렌더링
     */
    function renderZodiacSections(cx, cy, outerR, innerR, ascDegree) {
        const config = getConfig();
        const colors = config.astroChart.colors;
        let svg = '';
        const zodiacElements = ['Fire', 'Earth', 'Air', 'Water', 'Fire', 'Earth',
                               'Air', 'Water', 'Fire', 'Earth', 'Air', 'Water'];

        // 다크 모드용 원소 색상
        const elementColors = {
            Fire: colors.fire,
            Earth: colors.earth,
            Air: colors.air,
            Water: colors.water
        };

        for (let i = 0; i < 12; i++) {
            // 어센던트 기준으로 회전 (어센던트가 9시 방향)
            const startAngle = (i * 30 - ascDegree - 90) * Math.PI / 180;
            const endAngle = ((i + 1) * 30 - ascDegree - 90) * Math.PI / 180;

            const x1Outer = cx + outerR * Math.cos(startAngle);
            const y1Outer = cy + outerR * Math.sin(startAngle);
            const x2Outer = cx + outerR * Math.cos(endAngle);
            const y2Outer = cy + outerR * Math.sin(endAngle);
            const x1Inner = cx + innerR * Math.cos(startAngle);
            const y1Inner = cy + innerR * Math.sin(startAngle);
            const x2Inner = cx + innerR * Math.cos(endAngle);
            const y2Inner = cy + innerR * Math.sin(endAngle);

            // 별자리 구역 색상 (옅은 원소 색상)
            const elementColor = elementColors[zodiacElements[i]];

            svg += `<path d="M ${x1Inner} ${y1Inner} L ${x1Outer} ${y1Outer} A ${outerR} ${outerR} 0 0 1 ${x2Outer} ${y2Outer} L ${x2Inner} ${y2Inner} A ${innerR} ${innerR} 0 0 0 ${x1Inner} ${y1Inner}" fill="${elementColor}15" stroke="${colors.houseLines}" stroke-width="0.5"/>`;

            // 별자리 심볼
            const midAngle = ((i + 0.5) * 30 - ascDegree - 90) * Math.PI / 180;
            const symbolR = (outerR + innerR) / 2;
            const symbolX = cx + symbolR * Math.cos(midAngle);
            const symbolY = cy + symbolR * Math.sin(midAngle);

            svg += `<text x="${symbolX}" y="${symbolY}" text-anchor="middle" dominant-baseline="middle" font-size="16" fill="${elementColor}">${ZODIAC_SYMBOLS[i]}</text>`;
        }

        return svg;
    }

    /**
     * 하우스 라인 렌더링
     */
    function renderHouseLines(cx, cy, innerR, outerR, ascDegree) {
        const config = getConfig();
        const colors = config.astroChart.colors;
        let svg = '';

        for (let i = 0; i < 12; i++) {
            const angle = (i * 30 - ascDegree - 90) * Math.PI / 180;
            const x1 = cx + (innerR - 20) * Math.cos(angle);
            const y1 = cy + (innerR - 20) * Math.sin(angle);
            const x2 = cx + outerR * Math.cos(angle);
            const y2 = cy + outerR * Math.sin(angle);

            const isCardinal = i % 3 === 0;
            svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${colors.houseLines}" stroke-width="${isCardinal ? 2 : 1}"/>`;

            // 하우스 번호
            const houseAngle = ((i + 0.5) * 30 - ascDegree - 90) * Math.PI / 180;
            const houseR = innerR - 35;
            const houseX = cx + houseR * Math.cos(houseAngle);
            const houseY = cy + houseR * Math.sin(houseAngle);

            svg += `<text x="${houseX}" y="${houseY}" text-anchor="middle" dominant-baseline="middle" font-size="10" fill="#8e8e93">${i + 1}</text>`;
        }

        return svg;
    }

    /**
     * 행성 렌더링
     */
    function renderPlanets(cx, cy, planetR, planetPositions, ascDegree) {
        let svg = '';
        const planetOrder = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];

        // 행성 위치 계산 및 겹침 방지
        const positions = [];

        planetOrder.forEach(name => {
            const pos = planetPositions[name];
            if (!pos) return;

            let angle = (pos.totalDegree - ascDegree - 90) * Math.PI / 180;

            // 겹침 방지
            let adjustedR = planetR;
            positions.forEach(p => {
                const diff = Math.abs(pos.totalDegree - p.degree);
                if (diff < 10 || diff > 350) {
                    adjustedR -= 15;
                }
            });

            positions.push({ degree: pos.totalDegree, radius: adjustedR });

            const x = cx + adjustedR * Math.cos(angle);
            const y = cy + adjustedR * Math.sin(angle);

            // 행성 원
            svg += `<circle cx="${x}" cy="${y}" r="12" fill="white" stroke="${CONFIG.astroChart.colors.planets}" stroke-width="1"/>`;

            // 행성 심볼
            svg += `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="12" fill="${CONFIG.astroChart.colors.planets}">${PLANET_SYMBOLS[name]}</text>`;

            // 역행 표시
            if (pos.retrograde) {
                svg += `<text x="${x + 10}" y="${y - 8}" font-size="8" fill="${CONFIG.astroChart.colors.fire}">R</text>`;
            }
        });

        return svg;
    }

    /**
     * 어스펙트 라인 렌더링
     */
    function renderAspectLines(cx, cy, planetR, aspects, planetPositions, ascDegree) {
        let svg = '';

        aspects.slice(0, 10).forEach(asp => {
            const pos1 = planetPositions[asp.planet1];
            const pos2 = planetPositions[asp.planet2];
            if (!pos1 || !pos2) return;

            const angle1 = (pos1.totalDegree - ascDegree - 90) * Math.PI / 180;
            const angle2 = (pos2.totalDegree - ascDegree - 90) * Math.PI / 180;

            const x1 = cx + (planetR - 20) * Math.cos(angle1);
            const y1 = cy + (planetR - 20) * Math.sin(angle1);
            const x2 = cx + (planetR - 20) * Math.cos(angle2);
            const y2 = cy + (planetR - 20) * Math.sin(angle2);

            let color;
            switch (asp.aspect.name) {
                case 'Trine': color = CONFIG.astroChart.colors.aspects.trine; break;
                case 'Sextile': color = CONFIG.astroChart.colors.aspects.sextile; break;
                case 'Square': color = CONFIG.astroChart.colors.aspects.square; break;
                case 'Opposition': color = CONFIG.astroChart.colors.aspects.opposition; break;
                default: color = CONFIG.astroChart.colors.aspects.conjunction;
            }

            const dashArray = asp.aspect.effect === 'challenging' ? '4,4' : 'none';

            svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1" stroke-dasharray="${dashArray}" opacity="0.6"/>`;
        });

        return svg;
    }

    /**
     * 중앙 정보 렌더링
     */
    function renderCenterInfo(cx, cy, astroResult) {
        let svg = '';

        // 중앙 원
        svg += `<circle cx="${cx}" cy="${cy}" r="40" fill="white" stroke="${CONFIG.astroChart.colors.houseLines}" stroke-width="1"/>`;

        // 태양 별자리
        svg += `<text x="${cx}" y="${cy - 10}" text-anchor="middle" font-size="20" fill="${CONFIG.astroChart.colors.planets}">${astroResult.sunSign.symbol}</text>`;
        svg += `<text x="${cx}" y="${cy + 12}" text-anchor="middle" font-size="10" fill="#8e8e93">${astroResult.sunSign.korean}</text>`;

        return svg;
    }

    // ===== 동양 사주 차트 =====

    /**
     * 사주팔자 차트 렌더링
     */
    function renderSajuChart(containerId, sajuResult) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const { width, height } = CONFIG.sajuChart;
        const pillars = ['hour', 'day', 'month', 'year'];
        const pillarNames = ['시주', '일주', '월주', '년주'];
        const colWidth = width / 4;

        let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;

        // 배경
        svg += `<rect width="${width}" height="${height}" fill="#f5f5f7" rx="12"/>`;

        pillars.forEach((pillar, i) => {
            const x = i * colWidth;
            const pillarData = sajuResult.saju[pillar];

            // 주 이름
            svg += `<text x="${x + colWidth/2}" y="25" text-anchor="middle" font-size="12" fill="#8e8e93">${pillarNames[i]}</text>`;

            // 천간 (상단)
            const ganColor = WUXING_COLORS[pillarData.cheongan.element];
            svg += `<rect x="${x + 10}" y="40" width="${colWidth - 20}" height="50" fill="${ganColor}20" stroke="${ganColor}" stroke-width="2" rx="8"/>`;
            svg += `<text x="${x + colWidth/2}" y="60" text-anchor="middle" font-size="24" font-weight="600" fill="${ganColor}">${pillarData.cheongan.name}</text>`;
            svg += `<text x="${x + colWidth/2}" y="80" text-anchor="middle" font-size="12" fill="${ganColor}">${pillarData.cheongan.korean}</text>`;

            // 지지 (하단)
            const jiColor = WUXING_COLORS[pillarData.jiji.element];
            svg += `<rect x="${x + 10}" y="100" width="${colWidth - 20}" height="50" fill="${jiColor}20" stroke="${jiColor}" stroke-width="2" rx="8"/>`;
            svg += `<text x="${x + colWidth/2}" y="120" text-anchor="middle" font-size="24" font-weight="600" fill="${jiColor}">${pillarData.jiji.name}</text>`;
            svg += `<text x="${x + colWidth/2}" y="140" text-anchor="middle" font-size="12" fill="${jiColor}">${pillarData.jiji.korean}</text>`;

            // 십신 표시
            if (sajuResult.sipsin[pillar]) {
                const sipsin = sajuResult.sipsin[pillar];
                svg += `<text x="${x + colWidth/2}" y="170" text-anchor="middle" font-size="10" fill="#8e8e93">${sipsin.cheongan}</text>`;
                svg += `<text x="${x + colWidth/2}" y="185" text-anchor="middle" font-size="10" fill="#8e8e93">${sipsin.jiji}</text>`;
            }
        });

        svg += '</svg>';

        container.innerHTML = svg;
    }

    /**
     * 오행 분포 차트 렌더링
     */
    function renderElementChart(containerId, elementAnalysis) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const width = 300;
        const height = 200;
        const elements = ['木', '火', '土', '金', '水'];
        const barWidth = 40;
        const gap = 20;
        const maxHeight = 120;
        const startX = (width - (elements.length * barWidth + (elements.length - 1) * gap)) / 2;

        let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;

        // 배경
        svg += `<rect width="${width}" height="${height}" fill="#f5f5f7" rx="12"/>`;

        const maxCount = Math.max(...Object.values(elementAnalysis.distribution), 1);

        elements.forEach((element, i) => {
            const count = elementAnalysis.distribution[element];
            const barHeight = (count / maxCount) * maxHeight;
            const x = startX + i * (barWidth + gap);
            const y = 150 - barHeight;
            const color = WUXING_COLORS[element];
            const isYongsin = element === elementAnalysis.yongsin;

            // 바
            svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" rx="4" opacity="${isYongsin ? 1 : 0.7}"/>`;

            // 카운트
            svg += `<text x="${x + barWidth/2}" y="${y - 5}" text-anchor="middle" font-size="12" fill="${color}" font-weight="600">${count}</text>`;

            // 오행 이름
            svg += `<text x="${x + barWidth/2}" y="175" text-anchor="middle" font-size="14" fill="${color}">${element}</text>`;

            // 용신 표시
            if (isYongsin) {
                svg += `<text x="${x + barWidth/2}" y="195" text-anchor="middle" font-size="10" fill="#007aff">용신</text>`;
            }
        });

        svg += '</svg>';

        container.innerHTML = svg;
    }

    /**
     * 미니 천궁도 (간략화)
     */
    function renderMiniChart(containerId, astroResult) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const size = 150;
        const cx = size / 2;
        const cy = size / 2;
        const radius = 60;

        let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`;

        // 배경 원
        svg += `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="#f5f5f7" stroke="#e5e5ea" stroke-width="2"/>`;

        // 별자리 구역 (간략화)
        for (let i = 0; i < 12; i++) {
            const angle = (i * 30 - 90) * Math.PI / 180;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            svg += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#e5e5ea" stroke-width="0.5"/>`;
        }

        // 태양 위치
        const sunAngle = (astroResult.sunSign.startDegree + 15 - 90) * Math.PI / 180;
        const sunX = cx + (radius - 20) * Math.cos(sunAngle);
        const sunY = cy + (radius - 20) * Math.sin(sunAngle);
        svg += `<circle cx="${sunX}" cy="${sunY}" r="8" fill="#ff9500"/>`;
        svg += `<text x="${sunX}" y="${sunY}" text-anchor="middle" dominant-baseline="middle" font-size="8" fill="white">☉</text>`;

        // 중앙 별자리 심볼
        svg += `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-size="24" fill="#1d1d1f">${astroResult.sunSign.symbol}</text>`;

        svg += '</svg>';

        container.innerHTML = svg;
    }

    // Public API
    return {
        renderAstroChart,
        renderSajuChart,
        renderElementChart,
        renderMiniChart,
        CONFIG
    };
})();

// ES Module export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartRenderer;
}
