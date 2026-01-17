/**
 * Astro-Synthesis 서양 점성술 모듈 v1.0
 * 태양궁, 행성 위치, 하우스, 어스펙트 계산
 *
 * 참고: 정밀한 계산을 위해서는 Swiss Ephemeris 백엔드가 필요합니다.
 * 이 모듈은 프론트엔드용 간략화된 버전입니다.
 */

const AstrologyCalculator = (function() {
    'use strict';

    // ===== 기초 데이터 =====

    // 12 황도대 별자리 (Zodiac Signs)
    const ZODIAC_SIGNS = [
        { name: 'Aries', symbol: '♈', korean: '양자리', element: 'Fire', quality: 'Cardinal', ruler: 'Mars', startDegree: 0 },
        { name: 'Taurus', symbol: '♉', korean: '황소자리', element: 'Earth', quality: 'Fixed', ruler: 'Venus', startDegree: 30 },
        { name: 'Gemini', symbol: '♊', korean: '쌍둥이자리', element: 'Air', quality: 'Mutable', ruler: 'Mercury', startDegree: 60 },
        { name: 'Cancer', symbol: '♋', korean: '게자리', element: 'Water', quality: 'Cardinal', ruler: 'Moon', startDegree: 90 },
        { name: 'Leo', symbol: '♌', korean: '사자자리', element: 'Fire', quality: 'Fixed', ruler: 'Sun', startDegree: 120 },
        { name: 'Virgo', symbol: '♍', korean: '처녀자리', element: 'Earth', quality: 'Mutable', ruler: 'Mercury', startDegree: 150 },
        { name: 'Libra', symbol: '♎', korean: '천칭자리', element: 'Air', quality: 'Cardinal', ruler: 'Venus', startDegree: 180 },
        { name: 'Scorpio', symbol: '♏', korean: '전갈자리', element: 'Water', quality: 'Fixed', ruler: 'Pluto', startDegree: 210 },
        { name: 'Sagittarius', symbol: '♐', korean: '사수자리', element: 'Fire', quality: 'Mutable', ruler: 'Jupiter', startDegree: 240 },
        { name: 'Capricorn', symbol: '♑', korean: '염소자리', element: 'Earth', quality: 'Cardinal', ruler: 'Saturn', startDegree: 270 },
        { name: 'Aquarius', symbol: '♒', korean: '물병자리', element: 'Air', quality: 'Fixed', ruler: 'Uranus', startDegree: 300 },
        { name: 'Pisces', symbol: '♓', korean: '물고기자리', element: 'Water', quality: 'Mutable', ruler: 'Neptune', startDegree: 330 }
    ];

    // 행성 (Planets)
    const PLANETS = [
        { name: 'Sun', symbol: '☉', korean: '태양', type: 'luminary', orbitDays: 365.25 },
        { name: 'Moon', symbol: '☽', korean: '달', type: 'luminary', orbitDays: 27.32 },
        { name: 'Mercury', symbol: '☿', korean: '수성', type: 'inner', orbitDays: 87.97 },
        { name: 'Venus', symbol: '♀', korean: '금성', type: 'inner', orbitDays: 224.7 },
        { name: 'Mars', symbol: '♂', korean: '화성', type: 'outer', orbitDays: 686.98 },
        { name: 'Jupiter', symbol: '♃', korean: '목성', type: 'outer', orbitDays: 4332.59 },
        { name: 'Saturn', symbol: '♄', korean: '토성', type: 'outer', orbitDays: 10759.22 },
        { name: 'Uranus', symbol: '♅', korean: '천왕성', type: 'outer', orbitDays: 30688.5 },
        { name: 'Neptune', symbol: '♆', korean: '해왕성', type: 'outer', orbitDays: 60182 },
        { name: 'Pluto', symbol: '♇', korean: '명왕성', type: 'outer', orbitDays: 90560 }
    ];

    // 12 하우스 (Houses)
    const HOUSES = [
        { number: 1, name: 'Ascendant', korean: '1하우스 (상승궁)', meaning: '자아, 외모, 첫인상' },
        { number: 2, name: '2nd House', korean: '2하우스', meaning: '재물, 소유, 가치관' },
        { number: 3, name: '3rd House', korean: '3하우스', meaning: '소통, 형제, 단거리 여행' },
        { number: 4, name: 'IC', korean: '4하우스 (천저)', meaning: '가정, 뿌리, 내면' },
        { number: 5, name: '5th House', korean: '5하우스', meaning: '창조, 연애, 자녀' },
        { number: 6, name: '6th House', korean: '6하우스', meaning: '건강, 일상, 봉사' },
        { number: 7, name: 'Descendant', korean: '7하우스 (하강궁)', meaning: '파트너십, 결혼, 계약' },
        { number: 8, name: '8th House', korean: '8하우스', meaning: '변화, 공유자원, 심리' },
        { number: 9, name: '9th House', korean: '9하우스', meaning: '철학, 고등교육, 해외' },
        { number: 10, name: 'MC', korean: '10하우스 (천정)', meaning: '사회적 지위, 커리어' },
        { number: 11, name: '11th House', korean: '11하우스', meaning: '친구, 희망, 단체활동' },
        { number: 12, name: '12th House', korean: '12하우스', meaning: '무의식, 은둔, 영성' }
    ];

    // 메이저 어스펙트 (Major Aspects)
    const ASPECTS = [
        { name: 'Conjunction', symbol: '☌', angle: 0, orb: 10, nature: 'major', korean: '합', effect: 'neutral' },
        { name: 'Sextile', symbol: '⚹', angle: 60, orb: 6, nature: 'major', korean: '육분', effect: 'positive' },
        { name: 'Square', symbol: '□', angle: 90, orb: 8, nature: 'major', korean: '직각', effect: 'challenging' },
        { name: 'Trine', symbol: '△', angle: 120, orb: 8, nature: 'major', korean: '삼합', effect: 'positive' },
        { name: 'Opposition', symbol: '☍', angle: 180, orb: 10, nature: 'major', korean: '충', effect: 'challenging' }
    ];

    // 마이너 어스펙트
    const MINOR_ASPECTS = [
        { name: 'Semi-sextile', symbol: '⚺', angle: 30, orb: 2, nature: 'minor', korean: '반육분', effect: 'neutral' },
        { name: 'Quincunx', symbol: '⚻', angle: 150, orb: 3, nature: 'minor', korean: '인컨정션', effect: 'challenging' },
        { name: 'Semi-square', symbol: '∠', angle: 45, orb: 2, nature: 'minor', korean: '반직각', effect: 'challenging' },
        { name: 'Sesquiquadrate', symbol: '⚼', angle: 135, orb: 2, nature: 'minor', korean: '세스퀘어', effect: 'challenging' }
    ];

    // 태양 별자리 날짜 범위
    const SUN_SIGN_DATES = [
        { sign: 0, startMonth: 3, startDay: 21, endMonth: 4, endDay: 19 },   // Aries
        { sign: 1, startMonth: 4, startDay: 20, endMonth: 5, endDay: 20 },   // Taurus
        { sign: 2, startMonth: 5, startDay: 21, endMonth: 6, endDay: 20 },   // Gemini
        { sign: 3, startMonth: 6, startDay: 21, endMonth: 7, endDay: 22 },   // Cancer
        { sign: 4, startMonth: 7, startDay: 23, endMonth: 8, endDay: 22 },   // Leo
        { sign: 5, startMonth: 8, startDay: 23, endMonth: 9, endDay: 22 },   // Virgo
        { sign: 6, startMonth: 9, startDay: 23, endMonth: 10, endDay: 22 },  // Libra
        { sign: 7, startMonth: 10, startDay: 23, endMonth: 11, endDay: 21 }, // Scorpio
        { sign: 8, startMonth: 11, startDay: 22, endMonth: 12, endDay: 21 }, // Sagittarius
        { sign: 9, startMonth: 12, startDay: 22, endMonth: 1, endDay: 19 },  // Capricorn
        { sign: 10, startMonth: 1, startDay: 20, endMonth: 2, endDay: 18 },  // Aquarius
        { sign: 11, startMonth: 2, startDay: 19, endMonth: 3, endDay: 20 }   // Pisces
    ];

    // ===== 계산 함수 =====

    /**
     * 율리우스 적일 계산
     */
    function toJulianDay(year, month, day, hour = 12) {
        if (month <= 2) {
            year -= 1;
            month += 12;
        }
        const A = Math.floor(year / 100);
        const B = 2 - A + Math.floor(A / 4);
        return Math.floor(365.25 * (year + 4716)) +
               Math.floor(30.6001 * (month + 1)) +
               day + hour / 24 + B - 1524.5;
    }

    /**
     * J2000.0 이후 경과 일수
     */
    function daysSinceJ2000(year, month, day, hour = 12) {
        const jd = toJulianDay(year, month, day, hour);
        return jd - 2451545.0;
    }

    /**
     * 태양 위치 계산 (간략화)
     */
    function calculateSunPosition(year, month, day) {
        const d = daysSinceJ2000(year, month, day, 12);

        // 평균 황경
        let L = (280.46 + 0.9856474 * d) % 360;
        if (L < 0) L += 360;

        // 평균 근점 이각
        let g = (357.528 + 0.9856003 * d) % 360;
        if (g < 0) g += 360;
        const gRad = g * Math.PI / 180;

        // 황경 보정
        const eclipticLon = (L + 1.915 * Math.sin(gRad) + 0.02 * Math.sin(2 * gRad)) % 360;

        return eclipticLon;
    }

    /**
     * 달 위치 계산 (간략화)
     */
    function calculateMoonPosition(year, month, day, hour = 12) {
        const d = daysSinceJ2000(year, month, day, hour);

        // 달의 평균 황경
        let L = (218.316 + 13.176396 * d) % 360;
        if (L < 0) L += 360;

        // 평균 근점 이각
        let M = (134.963 + 13.064993 * d) % 360;
        if (M < 0) M += 360;
        const MRad = M * Math.PI / 180;

        // 평균 거리 이각
        let F = (93.272 + 13.229350 * d) % 360;
        if (F < 0) F += 360;
        const FRad = F * Math.PI / 180;

        // 황경 보정
        const eclipticLon = (L + 6.289 * Math.sin(MRad)) % 360;

        return eclipticLon < 0 ? eclipticLon + 360 : eclipticLon;
    }

    /**
     * 외행성 위치 계산 (간략화)
     * 실제 정밀 계산에는 Swiss Ephemeris 필요
     */
    function calculatePlanetPosition(planetIndex, year, month, day) {
        const planet = PLANETS[planetIndex];
        const d = daysSinceJ2000(year, month, day, 12);

        // 간략화된 계산 (기준점 + 평균 운동)
        const basePositions = {
            'Mercury': { L0: 252.25, n: 4.092317 },
            'Venus': { L0: 181.98, n: 1.602136 },
            'Mars': { L0: 355.43, n: 0.524039 },
            'Jupiter': { L0: 34.40, n: 0.083056 },
            'Saturn': { L0: 50.08, n: 0.033371 },
            'Uranus': { L0: 314.06, n: 0.011698 },
            'Neptune': { L0: 304.35, n: 0.005965 },
            'Pluto': { L0: 238.96, n: 0.003964 }
        };

        if (planet.name === 'Sun') {
            return calculateSunPosition(year, month, day);
        }
        if (planet.name === 'Moon') {
            return calculateMoonPosition(year, month, day);
        }

        const base = basePositions[planet.name];
        if (!base) return 0;

        let position = (base.L0 + base.n * d) % 360;
        if (position < 0) position += 360;

        return position;
    }

    /**
     * 황도 위치로부터 별자리 결정
     */
    function getZodiacSign(longitude) {
        const normalizedLon = ((longitude % 360) + 360) % 360;
        const signIndex = Math.floor(normalizedLon / 30);
        const degree = normalizedLon % 30;
        const minute = (degree % 1) * 60;

        return {
            sign: ZODIAC_SIGNS[signIndex],
            signIndex,
            degree: Math.floor(degree),
            minute: Math.floor(minute),
            totalDegree: normalizedLon,
            formatted: `${ZODIAC_SIGNS[signIndex].korean} ${Math.floor(degree)}° ${Math.floor(minute)}'`
        };
    }

    /**
     * 태양 별자리 계산
     */
    function calculateSunSign(month, day) {
        for (const dateRange of SUN_SIGN_DATES) {
            const { sign, startMonth, startDay, endMonth, endDay } = dateRange;

            // 염소자리 특별 처리 (연도 넘어감)
            if (sign === 9) {
                if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
                    return ZODIAC_SIGNS[sign];
                }
            } else {
                if ((month === startMonth && day >= startDay) ||
                    (month === endMonth && day <= endDay)) {
                    return ZODIAC_SIGNS[sign];
                }
            }
        }
        return ZODIAC_SIGNS[0]; // 기본값
    }

    /**
     * 어센던트(상승궁) 계산 (간략화)
     */
    function calculateAscendant(year, month, day, hour, minute, latitude, longitude) {
        // RAMC (Right Ascension of MC) 계산
        const d = daysSinceJ2000(year, month, day, hour + minute / 60);
        const LST = (100.46 + 0.985647 * d + longitude + (hour + minute / 60) * 15) % 360;

        // 황도 경사각 (약 23.4도)
        const obliquity = 23.4393;
        const oblRad = obliquity * Math.PI / 180;
        const latRad = latitude * Math.PI / 180;
        const lstRad = (LST * Math.PI / 180);

        // 어센던트 계산
        const y = -Math.cos(lstRad);
        const x = Math.sin(lstRad) * Math.cos(oblRad) + Math.tan(latRad) * Math.sin(oblRad);
        let asc = Math.atan2(y, x) * 180 / Math.PI;

        if (asc < 0) asc += 360;

        return asc;
    }

    /**
     * 하우스 커스프 계산 (Placidus - 간략화)
     */
    function calculateHouses(ascendant) {
        const houses = [];
        for (let i = 0; i < 12; i++) {
            const cusp = (ascendant + i * 30) % 360;
            houses.push({
                ...HOUSES[i],
                cusp: cusp,
                sign: getZodiacSign(cusp)
            });
        }
        return houses;
    }

    /**
     * 어스펙트 계산
     */
    function calculateAspects(planetPositions) {
        const aspects = [];
        const planetNames = Object.keys(planetPositions);

        for (let i = 0; i < planetNames.length; i++) {
            for (let j = i + 1; j < planetNames.length; j++) {
                const planet1 = planetNames[i];
                const planet2 = planetNames[j];
                const pos1 = planetPositions[planet1].totalDegree;
                const pos2 = planetPositions[planet2].totalDegree;

                let diff = Math.abs(pos1 - pos2);
                if (diff > 180) diff = 360 - diff;

                // 메이저 어스펙트 체크
                for (const aspect of ASPECTS) {
                    if (Math.abs(diff - aspect.angle) <= aspect.orb) {
                        aspects.push({
                            planet1: planet1,
                            planet2: planet2,
                            aspect: aspect,
                            exactAngle: diff,
                            orb: Math.abs(diff - aspect.angle),
                            applying: pos1 < pos2 // 간략화
                        });
                        break;
                    }
                }
            }
        }

        return aspects;
    }

    /**
     * 원소 균형 분석
     */
    function analyzeElements(planetPositions) {
        const elements = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
        const qualities = { Cardinal: 0, Fixed: 0, Mutable: 0 };

        Object.values(planetPositions).forEach(pos => {
            if (pos.sign) {
                elements[pos.sign.element]++;
                qualities[pos.sign.quality]++;
            }
        });

        // 가장 강한 원소 찾기
        let dominant = Object.entries(elements).sort((a, b) => b[1] - a[1])[0];
        let dominantQuality = Object.entries(qualities).sort((a, b) => b[1] - a[1])[0];

        const elementKorean = {
            Fire: '불', Earth: '땅', Air: '공기', Water: '물'
        };
        const qualityKorean = {
            Cardinal: '활동궁', Fixed: '고정궁', Mutable: '변통궁'
        };

        return {
            elements,
            qualities,
            dominant: {
                element: dominant[0],
                elementKr: elementKorean[dominant[0]],
                count: dominant[1]
            },
            dominantQuality: {
                quality: dominantQuality[0],
                qualityKr: qualityKorean[dominantQuality[0]],
                count: dominantQuality[1]
            }
        };
    }

    /**
     * 행성 역행 체크 (간략화)
     */
    function checkRetrograde(planet, year, month, day) {
        // 실제 역행 계산에는 정밀한 천문 데이터가 필요
        // 여기서는 간략화된 통계적 확률로 처리
        const retrogradeChance = {
            'Mercury': 0.19,  // 연간 약 3번, 각 3주
            'Venus': 0.07,    // 18개월마다 40일
            'Mars': 0.09,     // 2년마다 2달
            'Jupiter': 0.30,  // 연간 4개월
            'Saturn': 0.36,   // 연간 4.5개월
            'Uranus': 0.40,   // 연간 5개월
            'Neptune': 0.41,  // 연간 5개월
            'Pluto': 0.44     // 연간 5-6개월
        };

        // 고정된 시드로 일관된 결과 생성
        const seed = year * 10000 + month * 100 + day + planet.charCodeAt(0);
        const pseudoRandom = Math.sin(seed) * 10000;
        const rand = pseudoRandom - Math.floor(pseudoRandom);

        return rand < (retrogradeChance[planet] || 0);
    }

    /**
     * 전체 차트 계산
     */
    function calculate(params) {
        const { year, month, day, hour = 12, minute = 0, latitude = 37.5665, longitude = 126.9780 } = params;

        // 태양 별자리
        const sunSign = calculateSunSign(month, day);

        // 모든 행성 위치 계산
        const planetPositions = {};
        PLANETS.forEach((planet, index) => {
            const position = calculatePlanetPosition(index, year, month, day);
            const signInfo = getZodiacSign(position);
            const isRetrograde = checkRetrograde(planet.name, year, month, day);

            planetPositions[planet.name] = {
                ...signInfo,
                planet: planet,
                retrograde: isRetrograde
            };
        });

        // 어센던트
        const ascendantDegree = calculateAscendant(year, month, day, hour, minute, latitude, longitude);
        const ascendant = getZodiacSign(ascendantDegree);

        // 하우스
        const houses = calculateHouses(ascendantDegree);

        // 어스펙트
        const aspects = calculateAspects(planetPositions);

        // 원소 분석
        const elementAnalysis = analyzeElements(planetPositions);

        // 긍정/부정 어스펙트 분석
        const positiveAspects = aspects.filter(a => a.aspect.effect === 'positive');
        const challengingAspects = aspects.filter(a => a.aspect.effect === 'challenging');

        // 종합 점수 계산
        const score = calculateAstrologyScore(aspects, elementAnalysis);

        return {
            sunSign,
            moonSign: planetPositions['Moon'],
            ascendant,
            planetPositions,
            houses,
            aspects,
            positiveAspects,
            challengingAspects,
            elementAnalysis,
            score,
            birthInfo: { year, month, day, hour, minute, latitude, longitude }
        };
    }

    /**
     * 점성술 점수 계산
     */
    function calculateAstrologyScore(aspects, elementAnalysis) {
        let score = 50;

        // 긍정 어스펙트 가점
        aspects.forEach(a => {
            if (a.aspect.effect === 'positive') score += 5;
            if (a.aspect.effect === 'challenging') score -= 3;
        });

        // 원소 균형 점수
        const values = Object.values(elementAnalysis.elements);
        const avg = values.reduce((a, b) => a + b, 0) / 4;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / 4;
        score += Math.max(0, 15 - variance * 3);

        score = Math.max(0, Math.min(100, Math.round(score)));

        let grade, gradeDesc;
        if (score >= 80) {
            grade = 'S';
            gradeDesc = '매우 조화로운 차트입니다.';
        } else if (score >= 65) {
            grade = 'A';
            gradeDesc = '긍정적인 에너지가 강합니다.';
        } else if (score >= 50) {
            grade = 'B';
            gradeDesc = '균형 잡힌 차트입니다.';
        } else if (score >= 35) {
            grade = 'C';
            gradeDesc = '성장의 기회가 많습니다.';
        } else {
            grade = 'D';
            gradeDesc = '도전적인 에너지가 강합니다.';
        }

        return { score, grade, gradeDesc };
    }

    /**
     * 연간 운세 (트랜짓)
     */
    function calculateYearlyTransit(birthChart, targetYear) {
        const transits = {};
        const currentDate = new Date(targetYear, 6, 1); // 해당 연도 중반

        PLANETS.forEach((planet, index) => {
            const transitPosition = calculatePlanetPosition(index, targetYear, 7, 1);
            const transitSign = getZodiacSign(transitPosition);

            // 출생 차트와의 관계 분석
            const natalPosition = birthChart.planetPositions[planet.name];
            let diff = Math.abs(transitPosition - natalPosition.totalDegree);
            if (diff > 180) diff = 360 - diff;

            let aspect = null;
            for (const asp of ASPECTS) {
                if (Math.abs(diff - asp.angle) <= asp.orb) {
                    aspect = asp;
                    break;
                }
            }

            transits[planet.name] = {
                position: transitSign,
                aspectToNatal: aspect,
                isRetrograde: checkRetrograde(planet.name, targetYear, 7, 1)
            };
        });

        return {
            year: targetYear,
            transits,
            summary: generateTransitSummary(transits)
        };
    }

    /**
     * 트랜짓 요약 생성
     */
    function generateTransitSummary(transits) {
        const highlights = [];

        // 목성 트랜짓 (행운)
        if (transits['Jupiter'].aspectToNatal) {
            const asp = transits['Jupiter'].aspectToNatal;
            if (asp.effect === 'positive') {
                highlights.push({
                    type: 'positive',
                    desc: `목성 ${asp.korean}: 확장과 행운의 기회`
                });
            }
        }

        // 토성 트랜짓 (시련/성장)
        if (transits['Saturn'].aspectToNatal) {
            const asp = transits['Saturn'].aspectToNatal;
            highlights.push({
                type: asp.effect === 'positive' ? 'neutral' : 'challenging',
                desc: `토성 ${asp.korean}: ${asp.effect === 'positive' ? '안정과 성취' : '시련과 성장'}`
            });
        }

        return highlights;
    }

    // Public API
    return {
        calculate,
        calculateSunSign,
        calculateAscendant,
        calculateAspects,
        calculateYearlyTransit,
        getZodiacSign,
        analyzeElements,

        // 데이터
        ZODIAC_SIGNS,
        PLANETS,
        HOUSES,
        ASPECTS
    };
})();

// ES Module export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AstrologyCalculator;
}
