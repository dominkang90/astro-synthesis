/**
 * Astro-Synthesis API Client
 * 백엔드 API 연동 모듈
 */

// Vercel 배포 시 자동으로 상대 경로 사용
const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://127.0.0.1:8000'
    : '';

/**
 * API 클라이언트 클래스
 */
class AstroAPI {
    constructor(baseUrl = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    /**
     * 기본 fetch 래퍼
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, mergedOptions);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new APIError(
                    errorData.detail || `HTTP ${response.status}`,
                    response.status
                );
            }

            return await response.json();
        } catch (error) {
            if (error instanceof APIError) {
                throw error;
            }
            throw new APIError(`네트워크 오류: ${error.message}`, 0);
        }
    }

    // ===== 사주 API =====

    /**
     * 사주 분석
     * @param {Object} data - 출생 정보
     * @param {number} data.birth_year - 출생 년도
     * @param {number} data.birth_month - 출생 월
     * @param {number} data.birth_day - 출생 일
     * @param {number} [data.birth_hour] - 출생 시간 (0-23)
     * @param {string} data.gender - 성별 (male/female)
     */
    async analyzeSaju(data) {
        return this.request('/api/saju/analyze', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    /**
     * 특정 연도 운세 조회
     */
    async getYearlyFortune(year, birthData) {
        const params = new URLSearchParams({
            year,
            birth_year: birthData.birth_year,
            birth_month: birthData.birth_month,
            birth_day: birthData.birth_day,
            gender: birthData.gender,
        });

        return this.request(`/api/saju/yearly-fortune/${year}?${params}`);
    }

    /**
     * 궁합 분석
     */
    async checkCompatibility(person1, person2) {
        const params = new URLSearchParams({
            person1_year: person1.birth_year,
            person1_month: person1.birth_month,
            person1_day: person1.birth_day,
            person1_gender: person1.gender,
            person2_year: person2.birth_year,
            person2_month: person2.birth_month,
            person2_day: person2.birth_day,
            person2_gender: person2.gender,
        });

        return this.request(`/api/saju/compatibility?${params}`);
    }

    /**
     * 오행 정보 조회
     */
    async getElementInfo(element) {
        return this.request(`/api/saju/element/${element}`);
    }

    // ===== 점성술 API =====

    /**
     * 출생 차트 (Natal Chart) 생성
     * @param {Object} data - 출생 정보
     * @param {number} data.birth_year - 출생 년도
     * @param {number} data.birth_month - 출생 월
     * @param {number} data.birth_day - 출생 일
     * @param {number} data.birth_hour - 출생 시간
     * @param {number} data.birth_minute - 출생 분
     * @param {number} data.latitude - 출생지 위도
     * @param {number} data.longitude - 출생지 경도
     * @param {string} [data.timezone] - 시간대
     */
    async createNatalChart(data) {
        return this.request('/api/astrology/natal-chart', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    /**
     * 트랜짓 분석
     */
    async getTransit(natalChart, transitDate) {
        return this.request('/api/astrology/transit', {
            method: 'POST',
            body: JSON.stringify({
                natal_chart: natalChart,
                transit_date: transitDate,
            }),
        });
    }

    /**
     * 별자리 정보 조회
     */
    async getZodiacInfo(sign) {
        return this.request(`/api/astrology/zodiac/${sign}`);
    }

    /**
     * 행성 정보 조회
     */
    async getPlanetInfo(planet) {
        return this.request(`/api/astrology/planet/${planet}`);
    }

    /**
     * 하우스 시스템 목록
     */
    async getHouseSystems() {
        return this.request('/api/astrology/house-systems');
    }

    // ===== 관상 API =====

    /**
     * 관상 분석 (Base64 이미지)
     * @param {string} imageBase64 - Base64 인코딩된 이미지
     * @param {boolean} consentBiometric - 생체정보 동의 여부
     */
    async analyzePhysiognomy(imageBase64, consentBiometric = true) {
        return this.request('/api/physiognomy/analyze', {
            method: 'POST',
            body: JSON.stringify({
                image_base64: imageBase64,
                consent_biometric: consentBiometric,
            }),
        });
    }

    /**
     * 관상 분석 (파일 업로드)
     */
    async analyzePhysiognomyFile(file, consentBiometric = true) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('consent_biometric', consentBiometric);

        return this.request('/api/physiognomy/analyze-upload', {
            method: 'POST',
            body: formData,
            headers: {}, // FormData는 자동으로 Content-Type 설정
        });
    }

    /**
     * 관상 12궁 정보
     */
    async getFaceRegions() {
        return this.request('/api/physiognomy/regions');
    }

    /**
     * 얼굴형 정보
     */
    async getFaceShapes() {
        return this.request('/api/physiognomy/face-shapes');
    }

    // ===== 통합 분석 API =====

    /**
     * 통합 분석
     * @param {Object} data - 분석 요청 데이터
     */
    async analyzeSynthesis(data) {
        return this.request('/api/synthesis/analyze', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    /**
     * 간편 분석 (사주 기반)
     */
    async quickAnalysis(birthData) {
        return this.request('/api/quick', {
            method: 'POST',
            body: JSON.stringify({
                birth_year: birthData.birth_year,
                birth_month: birthData.birth_month,
                birth_day: birthData.birth_day,
                birth_hour: birthData.birth_hour,
                gender: birthData.gender || 'male',
                question: birthData.question
            }),
        });
    }

    /**
     * 질문 기반 분석
     */
    async askQuestion(birthData, question) {
        const params = new URLSearchParams({
            birth_year: birthData.birth_year,
            birth_month: birthData.birth_month,
            birth_day: birthData.birth_day,
            gender: birthData.gender,
            question: question,
        });

        if (birthData.birth_hour !== undefined) {
            params.append('birth_hour', birthData.birth_hour);
        }

        return this.request(`/api/synthesis/ask?${params}`, {
            method: 'POST',
        });
    }

    /**
     * 질문 의도별 가중치 조회
     */
    async getRecommendedWeights(intent) {
        return this.request(`/api/synthesis/weights/${intent}`);
    }

    // ===== 서버 상태 =====

    /**
     * 서버 상태 확인
     */
    async healthCheck() {
        return this.request('/health');
    }

    /**
     * API 정보
     */
    async getApiInfo() {
        return this.request('/');
    }
}

/**
 * API 에러 클래스
 */
class APIError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = 'APIError';
        this.statusCode = statusCode;
    }
}

/**
 * 결과 포맷팅 유틸리티
 */
const FormatUtils = {
    /**
     * 사주 결과를 HTML로 포맷팅
     */
    formatSajuResult(result) {
        const elementNames = {
            wood: '목(木)', fire: '화(火)', earth: '토(土)',
            metal: '금(金)', water: '수(水)'
        };

        return {
            pillars: {
                year: `${result.year_pillar.stem}${result.year_pillar.branch}`,
                month: `${result.month_pillar.stem}${result.month_pillar.branch}`,
                day: `${result.day_pillar.stem}${result.day_pillar.branch}`,
                hour: result.hour_pillar
                    ? `${result.hour_pillar.stem}${result.hour_pillar.branch}`
                    : '-',
            },
            elements: Object.entries(result.element_balance).map(([key, value]) => ({
                name: elementNames[key],
                count: value,
                percentage: Math.round((value / 8) * 100),
            })),
            yongsin: elementNames[result.yongsin],
            gisin: elementNames[result.gisin],
            dominant: elementNames[result.dominant_element],
            weak: elementNames[result.weak_element],
            summary: result.summary,
            yearlyFortune: result.yearly_fortune,
        };
    },

    /**
     * 점성술 결과를 HTML로 포맷팅
     */
    formatAstrologyResult(result) {
        const signNames = {
            aries: '양자리', taurus: '황소자리', gemini: '쌍둥이자리',
            cancer: '게자리', leo: '사자자리', virgo: '처녀자리',
            libra: '천칭자리', scorpio: '전갈자리', sagittarius: '궁수자리',
            capricorn: '염소자리', aquarius: '물병자리', pisces: '물고기자리'
        };

        return {
            sunSign: signNames[result.sun_sign] || result.sun_sign,
            moonSign: signNames[result.moon_sign] || result.moon_sign,
            risingSign: signNames[result.rising_sign] || result.rising_sign,
            planets: result.planets.map(p => ({
                name: p.planet,
                sign: signNames[p.sign] || p.sign,
                degree: `${Math.floor(p.sign_degree)}°`,
                house: p.house,
                retrograde: p.is_retrograde ? 'R' : '',
            })),
            aspects: result.aspects.slice(0, 5).map(a => ({
                planets: `${a.planet1} - ${a.planet2}`,
                type: a.aspect_type,
                orb: `${a.orb.toFixed(1)}°`,
            })),
            summary: result.personality_summary,
            themes: result.life_themes,
        };
    },

    /**
     * 오행 색상 반환
     */
    getElementColor(element) {
        const colors = {
            wood: '#34c759', // 녹색
            fire: '#ff3b30', // 적색
            earth: '#f5a623', // 황색
            metal: '#ffffff', // 백색
            water: '#007aff', // 청색
        };
        return colors[element] || '#8e8e93';
    },
};

// 전역 인스턴스 생성
const astroAPI = new AstroAPI();

// 전역 객체에 추가
window.AstroAPI = AstroAPI;
window.astroAPI = astroAPI;
window.FormatUtils = FormatUtils;
window.APIError = APIError;
