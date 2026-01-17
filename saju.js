/**
 * Astro-Synthesis 사주팔자 계산 모듈 v2.0
 * 만세력 기반 사주팔자, 십신, 대운, 12신살, 공망, 지장간 계산
 */

const SajuCalculator = (function() {
    'use strict';

    // ===== 기초 데이터 =====

    // 천간 (天干) - 10개
    const CHEONGAN = [
        { name: '甲', korean: '갑', element: '木', yin_yang: '양', elementKr: '목', number: 1 },
        { name: '乙', korean: '을', element: '木', yin_yang: '음', elementKr: '목', number: 2 },
        { name: '丙', korean: '병', element: '火', yin_yang: '양', elementKr: '화', number: 3 },
        { name: '丁', korean: '정', element: '火', yin_yang: '음', elementKr: '화', number: 4 },
        { name: '戊', korean: '무', element: '土', yin_yang: '양', elementKr: '토', number: 5 },
        { name: '己', korean: '기', element: '土', yin_yang: '음', elementKr: '토', number: 6 },
        { name: '庚', korean: '경', element: '金', yin_yang: '양', elementKr: '금', number: 7 },
        { name: '辛', korean: '신', element: '金', yin_yang: '음', elementKr: '금', number: 8 },
        { name: '壬', korean: '임', element: '水', yin_yang: '양', elementKr: '수', number: 9 },
        { name: '癸', korean: '계', element: '水', yin_yang: '음', elementKr: '수', number: 10 }
    ];

    // 지지 (地支) - 12개
    const JIJI = [
        { name: '子', korean: '자', element: '水', yin_yang: '양', animal: '쥐', elementKr: '수', number: 1 },
        { name: '丑', korean: '축', element: '土', yin_yang: '음', animal: '소', elementKr: '토', number: 2 },
        { name: '寅', korean: '인', element: '木', yin_yang: '양', animal: '호랑이', elementKr: '목', number: 3 },
        { name: '卯', korean: '묘', element: '木', yin_yang: '음', animal: '토끼', elementKr: '목', number: 4 },
        { name: '辰', korean: '진', element: '土', yin_yang: '양', animal: '용', elementKr: '토', number: 5 },
        { name: '巳', korean: '사', element: '火', yin_yang: '음', animal: '뱀', elementKr: '화', number: 6 },
        { name: '午', korean: '오', element: '火', yin_yang: '양', animal: '말', elementKr: '화', number: 7 },
        { name: '未', korean: '미', element: '土', yin_yang: '음', animal: '양', elementKr: '토', number: 8 },
        { name: '申', korean: '신', element: '金', yin_yang: '양', animal: '원숭이', elementKr: '금', number: 9 },
        { name: '酉', korean: '유', element: '金', yin_yang: '음', animal: '닭', elementKr: '금', number: 10 },
        { name: '戌', korean: '술', element: '土', yin_yang: '양', animal: '개', elementKr: '토', number: 11 },
        { name: '亥', korean: '해', element: '水', yin_yang: '음', animal: '돼지', elementKr: '수', number: 12 }
    ];

    // 지장간 (地藏干) - 각 지지에 숨어있는 천간
    const JIJANGGAN = {
        '子': [{ gan: '癸', ratio: 100 }],
        '丑': [{ gan: '己', ratio: 60 }, { gan: '癸', ratio: 30 }, { gan: '辛', ratio: 10 }],
        '寅': [{ gan: '甲', ratio: 60 }, { gan: '丙', ratio: 30 }, { gan: '戊', ratio: 10 }],
        '卯': [{ gan: '乙', ratio: 100 }],
        '辰': [{ gan: '戊', ratio: 60 }, { gan: '乙', ratio: 30 }, { gan: '癸', ratio: 10 }],
        '巳': [{ gan: '丙', ratio: 60 }, { gan: '戊', ratio: 30 }, { gan: '庚', ratio: 10 }],
        '午': [{ gan: '丁', ratio: 70 }, { gan: '己', ratio: 30 }],
        '未': [{ gan: '己', ratio: 60 }, { gan: '丁', ratio: 30 }, { gan: '乙', ratio: 10 }],
        '申': [{ gan: '庚', ratio: 60 }, { gan: '壬', ratio: 30 }, { gan: '戊', ratio: 10 }],
        '酉': [{ gan: '辛', ratio: 100 }],
        '戌': [{ gan: '戊', ratio: 60 }, { gan: '辛', ratio: 30 }, { gan: '丁', ratio: 10 }],
        '亥': [{ gan: '壬', ratio: 70 }, { gan: '甲', ratio: 30 }]
    };

    // 12신살 기준표 (일지 기준)
    const SINSAL_12 = {
        // 일지 -> 각 지지에 해당하는 신살
        '子': { '子': '제왕', '丑': '쇠', '寅': '병', '卯': '사', '辰': '묘', '巳': '절', '午': '태', '未': '양', '申': '장생', '酉': '목욕', '戌': '관대', '亥': '건록' },
        '丑': { '子': '건록', '丑': '제왕', '寅': '쇠', '卯': '병', '辰': '사', '巳': '묘', '午': '절', '未': '태', '申': '양', '酉': '장생', '戌': '목욕', '亥': '관대' },
        '寅': { '子': '관대', '丑': '건록', '寅': '제왕', '卯': '쇠', '辰': '병', '巳': '사', '午': '묘', '未': '절', '申': '태', '酉': '양', '戌': '장생', '亥': '목욕' },
        '卯': { '子': '목욕', '丑': '관대', '寅': '건록', '卯': '제왕', '辰': '쇠', '巳': '병', '午': '사', '未': '묘', '申': '절', '酉': '태', '戌': '양', '亥': '장생' },
        '辰': { '子': '장생', '丑': '목욕', '寅': '관대', '卯': '건록', '辰': '제왕', '巳': '쇠', '午': '병', '未': '사', '申': '묘', '酉': '절', '戌': '태', '亥': '양' },
        '巳': { '子': '양', '丑': '장생', '寅': '목욕', '卯': '관대', '辰': '건록', '巳': '제왕', '午': '쇠', '未': '병', '申': '사', '酉': '묘', '戌': '절', '亥': '태' },
        '午': { '子': '태', '丑': '양', '寅': '장생', '卯': '목욕', '辰': '관대', '巳': '건록', '午': '제왕', '未': '쇠', '申': '병', '酉': '사', '戌': '묘', '亥': '절' },
        '未': { '子': '절', '丑': '태', '寅': '양', '卯': '장생', '辰': '목욕', '巳': '관대', '午': '건록', '未': '제왕', '申': '쇠', '酉': '병', '戌': '사', '亥': '묘' },
        '申': { '子': '묘', '丑': '절', '寅': '태', '卯': '양', '辰': '장생', '巳': '목욕', '午': '관대', '未': '건록', '申': '제왕', '酉': '쇠', '戌': '병', '亥': '사' },
        '酉': { '子': '사', '丑': '묘', '寅': '절', '卯': '태', '辰': '양', '巳': '장생', '午': '목욕', '未': '관대', '申': '건록', '酉': '제왕', '戌': '쇠', '亥': '병' },
        '戌': { '子': '병', '丑': '사', '寅': '묘', '卯': '절', '辰': '태', '巳': '양', '午': '장생', '未': '목욕', '申': '관대', '酉': '건록', '戌': '제왕', '亥': '쇠' },
        '亥': { '子': '쇠', '丑': '병', '寅': '사', '卯': '묘', '辰': '절', '巳': '태', '午': '양', '未': '장생', '申': '목욕', '酉': '관대', '戌': '건록', '亥': '제왕' }
    };

    // 12신살 설명
    const SINSAL_DESC = {
        '장생': { meaning: '탄생/시작', good: true, desc: '새로운 시작, 성장의 기운' },
        '목욕': { meaning: '세척/정화', good: false, desc: '불안정, 변동의 시기' },
        '관대': { meaning: '성장/발전', good: true, desc: '성장과 발전, 사회진출' },
        '건록': { meaning: '왕성/전성', good: true, desc: '활동력 왕성, 독립' },
        '제왕': { meaning: '최고/정점', good: true, desc: '최고조, 권위와 명예' },
        '쇠': { meaning: '쇠퇴/감소', good: false, desc: '기운 약화, 주의 필요' },
        '병': { meaning: '병약/쇠약', good: false, desc: '건강 주의, 소극적 시기' },
        '사': { meaning: '죽음/끝', good: false, desc: '끝남, 마무리의 시기' },
        '묘': { meaning: '무덤/저장', good: false, desc: '숨김, 저장의 시기' },
        '절': { meaning: '단절/끊음', good: false, desc: '끊어짐, 인연 정리' },
        '태': { meaning: '잉태/준비', good: true, desc: '새로운 준비, 계획 단계' },
        '양': { meaning: '양육/성장', good: true, desc: '성장 준비, 잠재력 축적' }
    };

    // 공망 테이블 (일주 기준)
    const GONGMANG_TABLE = {
        // 갑자순 (갑자~계유)
        '甲子': ['戌', '亥'], '乙丑': ['戌', '亥'], '丙寅': ['戌', '亥'], '丁卯': ['戌', '亥'], '戊辰': ['戌', '亥'],
        '己巳': ['戌', '亥'], '庚午': ['戌', '亥'], '辛未': ['戌', '亥'], '壬申': ['戌', '亥'], '癸酉': ['戌', '亥'],
        // 갑술순 (갑술~계미)
        '甲戌': ['申', '酉'], '乙亥': ['申', '酉'], '丙子': ['申', '酉'], '丁丑': ['申', '酉'], '戊寅': ['申', '酉'],
        '己卯': ['申', '酉'], '庚辰': ['申', '酉'], '辛巳': ['申', '酉'], '壬午': ['申', '酉'], '癸未': ['申', '酉'],
        // 갑신순 (갑신~계사)
        '甲申': ['午', '未'], '乙酉': ['午', '未'], '丙戌': ['午', '未'], '丁亥': ['午', '未'], '戊子': ['午', '未'],
        '己丑': ['午', '未'], '庚寅': ['午', '未'], '辛卯': ['午', '未'], '壬辰': ['午', '未'], '癸巳': ['午', '未'],
        // 갑오순 (갑오~계묘)
        '甲午': ['辰', '巳'], '乙未': ['辰', '巳'], '丙申': ['辰', '巳'], '丁酉': ['辰', '巳'], '戊戌': ['辰', '巳'],
        '己亥': ['辰', '巳'], '庚子': ['辰', '巳'], '辛丑': ['辰', '巳'], '壬寅': ['辰', '巳'], '癸卯': ['辰', '巳'],
        // 갑진순 (갑진~계축)
        '甲辰': ['寅', '卯'], '乙巳': ['寅', '卯'], '丙午': ['寅', '卯'], '丁未': ['寅', '卯'], '戊申': ['寅', '卯'],
        '己酉': ['寅', '卯'], '庚戌': ['寅', '卯'], '辛亥': ['寅', '卯'], '壬子': ['寅', '卯'], '癸丑': ['寅', '卯'],
        // 갑인순 (갑인~계해)
        '甲寅': ['子', '丑'], '乙卯': ['子', '丑'], '丙辰': ['子', '丑'], '丁巳': ['子', '丑'], '戊午': ['子', '丑'],
        '己未': ['子', '丑'], '庚申': ['子', '丑'], '辛酉': ['子', '丑'], '壬戌': ['子', '丑'], '癸亥': ['子', '丑']
    };

    // 천간 합 (天干合)
    const CHEONGAN_HAP = {
        '甲': { pair: '己', result: '土' },
        '己': { pair: '甲', result: '土' },
        '乙': { pair: '庚', result: '金' },
        '庚': { pair: '乙', result: '金' },
        '丙': { pair: '辛', result: '水' },
        '辛': { pair: '丙', result: '水' },
        '丁': { pair: '壬', result: '木' },
        '壬': { pair: '丁', result: '木' },
        '戊': { pair: '癸', result: '火' },
        '癸': { pair: '戊', result: '火' }
    };

    // 지지 육합 (地支六合)
    const JIJI_YUKHAP = {
        '子': { pair: '丑', result: '土' },
        '丑': { pair: '子', result: '土' },
        '寅': { pair: '亥', result: '木' },
        '亥': { pair: '寅', result: '木' },
        '卯': { pair: '戌', result: '火' },
        '戌': { pair: '卯', result: '火' },
        '辰': { pair: '酉', result: '金' },
        '酉': { pair: '辰', result: '金' },
        '巳': { pair: '申', result: '水' },
        '申': { pair: '巳', result: '水' },
        '午': { pair: '未', result: '土' },
        '未': { pair: '午', result: '土' }
    };

    // 지지 삼합 (地支三合)
    const JIJI_SAMHAP = [
        { members: ['寅', '午', '戌'], result: '火', name: '화국' },
        { members: ['巳', '酉', '丑'], result: '金', name: '금국' },
        { members: ['申', '子', '辰'], result: '水', name: '수국' },
        { members: ['亥', '卯', '未'], result: '木', name: '목국' }
    ];

    // 지지 방합 (地支方合)
    const JIJI_BANGHAP = [
        { members: ['寅', '卯', '辰'], result: '木', name: '동방목국' },
        { members: ['巳', '午', '未'], result: '火', name: '남방화국' },
        { members: ['申', '酉', '戌'], result: '金', name: '서방금국' },
        { members: ['亥', '子', '丑'], result: '水', name: '북방수국' }
    ];

    // 지지 충 (地支沖) - 정반대 위치
    const JIJI_CHUNG = {
        '子': '午', '午': '子',
        '丑': '未', '未': '丑',
        '寅': '申', '申': '寅',
        '卯': '酉', '酉': '卯',
        '辰': '戌', '戌': '辰',
        '巳': '亥', '亥': '巳'
    };

    // 지지 형 (地支刑)
    const JIJI_HYUNG = {
        '寅': ['巳', '申'], '巳': ['寅', '申'], '申': ['寅', '巳'],  // 무은지형
        '丑': ['戌', '未'], '戌': ['丑', '未'], '未': ['丑', '戌'],  // 지세지형
        '子': ['卯'], '卯': ['子'],  // 무례지형
        '辰': ['辰'], '午': ['午'], '酉': ['酉'], '亥': ['亥']  // 자형
    };

    // 지지 파 (地支破)
    const JIJI_PA = {
        '子': '酉', '酉': '子',
        '丑': '辰', '辰': '丑',
        '寅': '亥', '亥': '寅',
        '卯': '午', '午': '卯',
        '巳': '申', '申': '巳',
        '未': '戌', '戌': '未'
    };

    // 지지 해 (地支害)
    const JIJI_HAE = {
        '子': '未', '未': '子',
        '丑': '午', '午': '丑',
        '寅': '巳', '巳': '寅',
        '卯': '辰', '辰': '卯',
        '申': '亥', '亥': '申',
        '酉': '戌', '戌': '酉'
    };

    // 60갑자 생성
    const SIXTY_GANJI = [];
    for (let i = 0; i < 60; i++) {
        SIXTY_GANJI.push({
            cheongan: CHEONGAN[i % 10],
            jiji: JIJI[i % 12],
            name: CHEONGAN[i % 10].name + JIJI[i % 12].name,
            korean: CHEONGAN[i % 10].korean + JIJI[i % 12].korean
        });
    }

    // 십신 (十神) 관계표
    const SIPSIN_TABLE = {
        // 일간 오행 -> 타 오행 -> 십신
        '木': { '木': '비겁', '火': '식상', '土': '재성', '金': '관성', '水': '인성' },
        '火': { '火': '비겁', '土': '식상', '金': '재성', '水': '관성', '木': '인성' },
        '土': { '土': '비겁', '金': '식상', '水': '재성', '木': '관성', '火': '인성' },
        '金': { '金': '비겁', '水': '식상', '木': '재성', '火': '관성', '土': '인성' },
        '水': { '水': '비겁', '木': '식상', '火': '재성', '土': '관성', '金': '인성' }
    };

    // 십신 세부 분류 (음양에 따라)
    const SIPSIN_DETAIL = {
        '비겁': { same: '비견', diff: '겁재' },
        '식상': { same: '식신', diff: '상관' },
        '재성': { same: '편재', diff: '정재' },
        '관성': { same: '편관', diff: '정관' },
        '인성': { same: '편인', diff: '정인' }
    };

    // 절기 데이터 (월별 절기 - 대략적인 날짜, 실제로는 매년 다름)
    // 각 월의 절기 시작일 (양력 기준 평균값)
    const JEOLGI_DATES = [
        { month: 1, name: '입춘', startMonth: 2, startDay: 4 },   // 인월 (1월)
        { month: 2, name: '경칩', startMonth: 3, startDay: 6 },   // 묘월 (2월)
        { month: 3, name: '청명', startMonth: 4, startDay: 5 },   // 진월 (3월)
        { month: 4, name: '입하', startMonth: 5, startDay: 6 },   // 사월 (4월)
        { month: 5, name: '망종', startMonth: 6, startDay: 6 },   // 오월 (5월)
        { month: 6, name: '소서', startMonth: 7, startDay: 7 },   // 미월 (6월)
        { month: 7, name: '입추', startMonth: 8, startDay: 8 },   // 신월 (7월)
        { month: 8, name: '백로', startMonth: 9, startDay: 8 },   // 유월 (8월)
        { month: 9, name: '한로', startMonth: 10, startDay: 9 },  // 술월 (9월)
        { month: 10, name: '입동', startMonth: 11, startDay: 8 }, // 해월 (10월)
        { month: 11, name: '대설', startMonth: 12, startDay: 7 }, // 자월 (11월)
        { month: 12, name: '소한', startMonth: 1, startDay: 6 }   // 축월 (12월)
    ];

    // 시간대별 지지 (시주 계산용)
    const TIME_JIJI = [
        { jiji: 0, start: 23, end: 1 },   // 子시 23:00-01:00
        { jiji: 1, start: 1, end: 3 },    // 丑시 01:00-03:00
        { jiji: 2, start: 3, end: 5 },    // 寅시 03:00-05:00
        { jiji: 3, start: 5, end: 7 },    // 卯시 05:00-07:00
        { jiji: 4, start: 7, end: 9 },    // 辰시 07:00-09:00
        { jiji: 5, start: 9, end: 11 },   // 巳시 09:00-11:00
        { jiji: 6, start: 11, end: 13 },  // 午시 11:00-13:00
        { jiji: 7, start: 13, end: 15 },  // 未시 13:00-15:00
        { jiji: 8, start: 15, end: 17 },  // 申시 15:00-17:00
        { jiji: 9, start: 17, end: 19 },  // 酉시 17:00-19:00
        { jiji: 10, start: 19, end: 21 }, // 戌시 19:00-21:00
        { jiji: 11, start: 21, end: 23 }  // 亥시 21:00-23:00
    ];

    // ===== 계산 함수 =====

    /**
     * 년주 계산
     * @param {number} year - 양력 연도
     * @param {number} month - 양력 월
     * @param {number} day - 양력 일
     * @returns {Object} 년주 간지 정보
     */
    function calculateYearPillar(year, month, day) {
        // 입춘 전이면 전년도로 계산
        let adjustedYear = year;

        // 입춘은 대략 2월 4일 (실제로는 매년 다름)
        if (month < 2 || (month === 2 && day < 4)) {
            adjustedYear = year - 1;
        }

        // 1984년 甲子년 기준 (갑자년)
        const baseYear = 1984;
        let yearIndex = ((adjustedYear - baseYear) % 60 + 60) % 60;

        return SIXTY_GANJI[yearIndex];
    }

    /**
     * 월주 계산
     * @param {number} year - 양력 연도
     * @param {number} month - 양력 월
     * @param {number} day - 양력 일
     * @param {number} yearGanIndex - 년간 인덱스
     * @returns {Object} 월주 간지 정보
     */
    function calculateMonthPillar(year, month, day, yearGanIndex) {
        // 절기 기준 월 계산
        let lunarMonth = getSolarTermMonth(month, day);

        // 월지 인덱스 (인월=0이 아닌, 자월=0 기준으로 변환)
        // 인월(1월)=2, 묘월(2월)=3, ... 축월(12월)=1
        const monthJijiIndex = (lunarMonth + 1) % 12;

        // 년상기월법 (年上起月法)
        // 갑기년 -> 병인월 시작, 을경년 -> 무인월 시작, ...
        const monthGanStart = [2, 4, 6, 8, 0]; // 병, 무, 경, 임, 갑
        const startGan = monthGanStart[yearGanIndex % 5];
        const monthGanIndex = (startGan + lunarMonth - 1) % 10;

        return {
            cheongan: CHEONGAN[monthGanIndex],
            jiji: JIJI[monthJijiIndex],
            name: CHEONGAN[monthGanIndex].name + JIJI[monthJijiIndex].name,
            korean: CHEONGAN[monthGanIndex].korean + JIJI[monthJijiIndex].korean,
            lunarMonth: lunarMonth
        };
    }

    /**
     * 절기 기준 월 계산
     */
    function getSolarTermMonth(month, day) {
        for (let i = 0; i < JEOLGI_DATES.length; i++) {
            const jeolgi = JEOLGI_DATES[i];
            const nextJeolgi = JEOLGI_DATES[(i + 1) % 12];

            // 현재 절기와 다음 절기 사이인지 확인
            if (month === jeolgi.startMonth) {
                if (day >= jeolgi.startDay) {
                    return jeolgi.month;
                }
            } else if (month === nextJeolgi.startMonth) {
                if (day < nextJeolgi.startDay) {
                    return jeolgi.month;
                }
            }
        }

        // 기본값: 해당 월에 맞는 절기월 반환
        for (const jeolgi of JEOLGI_DATES) {
            if (month === jeolgi.startMonth) {
                return jeolgi.month;
            }
        }

        // 1월 초 (소한 전)
        if (month === 1 && day < 6) {
            return 12; // 축월
        }

        return ((month + 10) % 12) + 1;
    }

    /**
     * 일주 계산
     * @param {number} year - 양력 연도
     * @param {number} month - 양력 월
     * @param {number} day - 양력 일
     * @returns {Object} 일주 간지 정보
     */
    function calculateDayPillar(year, month, day) {
        // 기준일: 1900년 1월 1일 = 甲戌일 (인덱스 10)
        const baseDate = new Date(1900, 0, 1);
        const targetDate = new Date(year, month - 1, day);

        const diffDays = Math.floor((targetDate - baseDate) / (1000 * 60 * 60 * 24));
        const dayIndex = ((diffDays + 10) % 60 + 60) % 60;

        return SIXTY_GANJI[dayIndex];
    }

    /**
     * 시주 계산
     * @param {number} hour - 시간 (0-23)
     * @param {number} dayGanIndex - 일간 인덱스
     * @returns {Object} 시주 간지 정보
     */
    function calculateHourPillar(hour, dayGanIndex) {
        // 시지 계산
        let hourJijiIndex;
        if (hour >= 23 || hour < 1) {
            hourJijiIndex = 0; // 子시
        } else {
            hourJijiIndex = Math.floor((hour + 1) / 2);
        }

        // 일상기시법 (日上起時法)
        // 갑기일 -> 갑자시 시작, 을경일 -> 병자시 시작, ...
        const hourGanStart = [0, 2, 4, 6, 8]; // 갑, 병, 무, 경, 임
        const startGan = hourGanStart[dayGanIndex % 5];
        const hourGanIndex = (startGan + hourJijiIndex) % 10;

        return {
            cheongan: CHEONGAN[hourGanIndex],
            jiji: JIJI[hourJijiIndex],
            name: CHEONGAN[hourGanIndex].name + JIJI[hourJijiIndex].name,
            korean: CHEONGAN[hourGanIndex].korean + JIJI[hourJijiIndex].korean
        };
    }

    /**
     * 십신 계산
     * @param {Object} dayPillar - 일주 정보
     * @param {Object} targetPillar - 대상 주 정보
     * @returns {Object} 십신 정보
     */
    function calculateSipsin(dayPillar, targetPillar) {
        const dayElement = dayPillar.cheongan.element;
        const dayYinYang = dayPillar.cheongan.yin_yang;

        // 천간 십신
        const ganElement = targetPillar.cheongan.element;
        const ganYinYang = targetPillar.cheongan.yin_yang;
        const ganCategory = SIPSIN_TABLE[dayElement][ganElement];
        const ganSipsin = dayYinYang === ganYinYang ?
            SIPSIN_DETAIL[ganCategory].same :
            SIPSIN_DETAIL[ganCategory].diff;

        // 지지 십신 (지지 본기 기준)
        const jiElement = targetPillar.jiji.element;
        const jiYinYang = targetPillar.jiji.yin_yang;
        const jiCategory = SIPSIN_TABLE[dayElement][jiElement];
        const jiSipsin = dayYinYang === jiYinYang ?
            SIPSIN_DETAIL[jiCategory].same :
            SIPSIN_DETAIL[jiCategory].diff;

        return {
            cheongan: ganSipsin,
            jiji: jiSipsin
        };
    }

    /**
     * 대운 계산
     * @param {Object} saju - 사주 정보
     * @param {string} gender - 성별 ('male' 또는 'female')
     * @param {number} birthYear - 출생 연도
     * @param {number} birthMonth - 출생 월
     * @param {number} birthDay - 출생 일
     * @returns {Array} 대운 배열
     */
    function calculateDaeun(saju, gender, birthYear, birthMonth, birthDay) {
        const yearGanYinYang = saju.year.cheongan.yin_yang;

        // 순행/역행 결정
        // 남자 양년생 또는 여자 음년생 -> 순행
        // 남자 음년생 또는 여자 양년생 -> 역행
        const isForward = (gender === 'male' && yearGanYinYang === '양') ||
                         (gender === 'female' && yearGanYinYang === '음');

        // 월주 기준 대운 시작
        const monthGanIndex = CHEONGAN.findIndex(g => g.name === saju.month.cheongan.name);
        const monthJijiIndex = JIJI.findIndex(j => j.name === saju.month.jiji.name);

        const daeunList = [];

        // 대운 시작 나이 계산 (절기까지의 일수 기준, 간략화)
        let startAge = calculateDaeunStartAge(birthYear, birthMonth, birthDay, isForward);

        for (let i = 0; i < 10; i++) {
            const direction = isForward ? 1 : -1;
            const ganIndex = ((monthGanIndex + (i + 1) * direction) % 10 + 10) % 10;
            const jijiIndex = ((monthJijiIndex + (i + 1) * direction) % 12 + 12) % 12;

            const age = startAge + (i * 10);
            const year = birthYear + age;

            daeunList.push({
                index: i + 1,
                cheongan: CHEONGAN[ganIndex],
                jiji: JIJI[jijiIndex],
                name: CHEONGAN[ganIndex].name + JIJI[jijiIndex].name,
                korean: CHEONGAN[ganIndex].korean + JIJI[jijiIndex].korean,
                startAge: age,
                endAge: age + 9,
                startYear: year,
                endYear: year + 9
            });
        }

        return daeunList;
    }

    /**
     * 대운 시작 나이 계산 (간략화 버전)
     */
    function calculateDaeunStartAge(year, month, day, isForward) {
        // 현재 절기와 다음/이전 절기까지의 일수 계산
        // 실제로는 정밀한 절기 데이터 필요, 여기서는 평균값 사용

        const currentJeolgi = JEOLGI_DATES.find(j => j.startMonth === month) ||
                             JEOLGI_DATES.find(j => j.startMonth === ((month % 12) + 1));

        let daysToJeolgi;
        if (isForward) {
            // 다음 절기까지의 일수
            daysToJeolgi = Math.abs(currentJeolgi.startDay - day) + 30;
        } else {
            // 이전 절기까지의 일수
            daysToJeolgi = Math.abs(day - 1) + 5;
        }

        // 3일 = 1세
        const startAge = Math.round(daysToJeolgi / 3);

        return Math.max(1, Math.min(startAge, 10));
    }

    /**
     * 오행 분석 (지장간 포함)
     * @param {Object} saju - 사주 정보
     * @returns {Object} 오행 분포
     */
    function analyzeElements(saju) {
        const elements = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
        const detailedElements = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
        const pillars = [saju.year, saju.month, saju.day, saju.hour];

        pillars.forEach(pillar => {
            // 천간 오행
            elements[pillar.cheongan.element]++;
            detailedElements[pillar.cheongan.element] += 1;

            // 지지 본기 오행
            elements[pillar.jiji.element]++;

            // 지장간 오행 (가중치 적용)
            const jijanggan = JIJANGGAN[pillar.jiji.name];
            if (jijanggan) {
                jijanggan.forEach(jj => {
                    const ganInfo = CHEONGAN.find(g => g.name === jj.gan);
                    if (ganInfo) {
                        detailedElements[ganInfo.element] += jj.ratio / 100;
                    }
                });
            }
        });

        // 가장 강한/약한 오행 찾기
        let strongest = { element: '', count: 0 };
        let weakest = { element: '', count: 8 };

        for (const [element, count] of Object.entries(elements)) {
            if (count > strongest.count) {
                strongest = { element, count };
            }
            if (count < weakest.count) {
                weakest = { element, count };
            }
        }

        return {
            distribution: elements,
            detailedDistribution: detailedElements,
            strongest,
            weakest,
            // 용신 추정 (가장 약한 오행을 보충)
            yongsin: weakest.element
        };
    }

    /**
     * 12신살 계산
     * @param {Object} saju - 사주 정보
     * @returns {Object} 12신살 분석
     */
    function calculate12Sinsal(saju) {
        const dayJiji = saju.day.jiji.name;
        const sinsalTable = SINSAL_12[dayJiji];

        if (!sinsalTable) {
            return { year: null, month: null, day: null, hour: null };
        }

        const result = {
            year: {
                name: sinsalTable[saju.year.jiji.name],
                ...SINSAL_DESC[sinsalTable[saju.year.jiji.name]]
            },
            month: {
                name: sinsalTable[saju.month.jiji.name],
                ...SINSAL_DESC[sinsalTable[saju.month.jiji.name]]
            },
            day: {
                name: '제왕',
                ...SINSAL_DESC['제왕']
            },
            hour: {
                name: sinsalTable[saju.hour.jiji.name],
                ...SINSAL_DESC[sinsalTable[saju.hour.jiji.name]]
            }
        };

        // 좋은/나쁜 신살 카운트
        const goodSinsal = [];
        const badSinsal = [];

        Object.entries(result).forEach(([pillar, info]) => {
            if (info && info.good) {
                goodSinsal.push({ pillar, ...info });
            } else if (info && !info.good) {
                badSinsal.push({ pillar, ...info });
            }
        });

        return {
            ...result,
            goodSinsal,
            badSinsal,
            summary: `길신 ${goodSinsal.length}개, 흉신 ${badSinsal.length}개`
        };
    }

    /**
     * 공망 계산
     * @param {Object} saju - 사주 정보
     * @returns {Object} 공망 분석
     */
    function calculateGongmang(saju) {
        const dayPillarName = saju.day.name;
        const gongmangJiji = GONGMANG_TABLE[dayPillarName] || [];

        const affectedPillars = [];
        const pillars = ['year', 'month', 'hour'];

        pillars.forEach(pillar => {
            const jijiName = saju[pillar].jiji.name;
            if (gongmangJiji.includes(jijiName)) {
                affectedPillars.push({
                    pillar,
                    pillarKr: pillar === 'year' ? '년지' : pillar === 'month' ? '월지' : '시지',
                    jiji: jijiName
                });
            }
        });

        const jijiKr = gongmangJiji.map(j => {
            const jiji = JIJI.find(ji => ji.name === j);
            return jiji ? `${j}(${jiji.korean})` : j;
        });

        return {
            gongmang: gongmangJiji,
            gongmangKr: jijiKr,
            affectedPillars,
            hasGongmang: affectedPillars.length > 0,
            description: affectedPillars.length > 0
                ? `${affectedPillars.map(p => p.pillarKr).join(', ')}에 공망이 있습니다.`
                : '사주에 공망이 없습니다.'
        };
    }

    /**
     * 지장간 분석
     * @param {Object} saju - 사주 정보
     * @returns {Object} 지장간 분석
     */
    function analyzeJijanggan(saju) {
        const result = {};
        const pillars = { year: '년지', month: '월지', day: '일지', hour: '시지' };

        Object.entries(pillars).forEach(([key, name]) => {
            const jijiName = saju[key].jiji.name;
            const jijanggan = JIJANGGAN[jijiName] || [];

            result[key] = {
                name,
                jiji: jijiName,
                jijanggan: jijanggan.map(jj => {
                    const ganInfo = CHEONGAN.find(g => g.name === jj.gan);
                    return {
                        gan: jj.gan,
                        korean: ganInfo ? ganInfo.korean : '',
                        element: ganInfo ? ganInfo.element : '',
                        elementKr: ganInfo ? ganInfo.elementKr : '',
                        ratio: jj.ratio,
                        type: jj.ratio >= 60 ? '본기' : jj.ratio >= 30 ? '중기' : '여기'
                    };
                })
            };
        });

        return result;
    }

    /**
     * 합/충/형/파/해 관계 분석
     * @param {Object} saju - 사주 정보
     * @returns {Object} 관계 분석
     */
    function analyzeRelations(saju) {
        const jijiList = [
            { name: saju.year.jiji.name, pillar: '년지' },
            { name: saju.month.jiji.name, pillar: '월지' },
            { name: saju.day.jiji.name, pillar: '일지' },
            { name: saju.hour.jiji.name, pillar: '시지' }
        ];

        const ganList = [
            { name: saju.year.cheongan.name, pillar: '년간' },
            { name: saju.month.cheongan.name, pillar: '월간' },
            { name: saju.day.cheongan.name, pillar: '일간' },
            { name: saju.hour.cheongan.name, pillar: '시간' }
        ];

        const relations = {
            cheonganHap: [],  // 천간합
            yukhap: [],       // 육합
            samhap: [],       // 삼합
            banghap: [],      // 방합
            chung: [],        // 충
            hyung: [],        // 형
            pa: [],           // 파
            hae: []           // 해
        };

        // 천간합 체크
        for (let i = 0; i < ganList.length; i++) {
            for (let j = i + 1; j < ganList.length; j++) {
                const hapInfo = CHEONGAN_HAP[ganList[i].name];
                if (hapInfo && hapInfo.pair === ganList[j].name) {
                    relations.cheonganHap.push({
                        pair: [ganList[i], ganList[j]],
                        result: hapInfo.result,
                        desc: `${ganList[i].pillar}-${ganList[j].pillar} 합 → ${hapInfo.result}`
                    });
                }
            }
        }

        // 육합 체크
        for (let i = 0; i < jijiList.length; i++) {
            for (let j = i + 1; j < jijiList.length; j++) {
                const hapInfo = JIJI_YUKHAP[jijiList[i].name];
                if (hapInfo && hapInfo.pair === jijiList[j].name) {
                    relations.yukhap.push({
                        pair: [jijiList[i], jijiList[j]],
                        result: hapInfo.result,
                        desc: `${jijiList[i].pillar}-${jijiList[j].pillar} 육합 → ${hapInfo.result}`
                    });
                }
            }
        }

        // 삼합 체크
        const jijiNames = jijiList.map(j => j.name);
        JIJI_SAMHAP.forEach(samhap => {
            const matches = samhap.members.filter(m => jijiNames.includes(m));
            if (matches.length >= 2) {
                relations.samhap.push({
                    members: matches,
                    full: matches.length === 3,
                    result: samhap.result,
                    name: samhap.name,
                    desc: matches.length === 3
                        ? `${samhap.name} 완성 (${matches.join('-')})`
                        : `${samhap.name} 반합 (${matches.join('-')})`
                });
            }
        });

        // 방합 체크
        JIJI_BANGHAP.forEach(banghap => {
            const matches = banghap.members.filter(m => jijiNames.includes(m));
            if (matches.length >= 2) {
                relations.banghap.push({
                    members: matches,
                    full: matches.length === 3,
                    result: banghap.result,
                    name: banghap.name,
                    desc: matches.length === 3
                        ? `${banghap.name} 완성`
                        : `${banghap.name} 반합`
                });
            }
        });

        // 충 체크
        for (let i = 0; i < jijiList.length; i++) {
            for (let j = i + 1; j < jijiList.length; j++) {
                if (JIJI_CHUNG[jijiList[i].name] === jijiList[j].name) {
                    relations.chung.push({
                        pair: [jijiList[i], jijiList[j]],
                        desc: `${jijiList[i].pillar}-${jijiList[j].pillar} 충`
                    });
                }
            }
        }

        // 형 체크
        for (let i = 0; i < jijiList.length; i++) {
            for (let j = i + 1; j < jijiList.length; j++) {
                const hyungTargets = JIJI_HYUNG[jijiList[i].name] || [];
                if (hyungTargets.includes(jijiList[j].name)) {
                    relations.hyung.push({
                        pair: [jijiList[i], jijiList[j]],
                        desc: `${jijiList[i].pillar}-${jijiList[j].pillar} 형`
                    });
                }
            }
        }

        // 파 체크
        for (let i = 0; i < jijiList.length; i++) {
            for (let j = i + 1; j < jijiList.length; j++) {
                if (JIJI_PA[jijiList[i].name] === jijiList[j].name) {
                    relations.pa.push({
                        pair: [jijiList[i], jijiList[j]],
                        desc: `${jijiList[i].pillar}-${jijiList[j].pillar} 파`
                    });
                }
            }
        }

        // 해 체크
        for (let i = 0; i < jijiList.length; i++) {
            for (let j = i + 1; j < jijiList.length; j++) {
                if (JIJI_HAE[jijiList[i].name] === jijiList[j].name) {
                    relations.hae.push({
                        pair: [jijiList[i], jijiList[j]],
                        desc: `${jijiList[i].pillar}-${jijiList[j].pillar} 해`
                    });
                }
            }
        }

        // 요약 생성
        const goodRelations = relations.cheonganHap.length + relations.yukhap.length +
                            relations.samhap.length + relations.banghap.length;
        const badRelations = relations.chung.length + relations.hyung.length +
                           relations.pa.length + relations.hae.length;

        return {
            ...relations,
            summary: {
                good: goodRelations,
                bad: badRelations,
                description: `합 ${goodRelations}개, 충/형/파/해 ${badRelations}개`
            }
        };
    }

    /**
     * 세운(년운) 계산
     * @param {number} targetYear - 분석할 연도
     * @param {Object} saju - 사주 정보
     * @returns {Object} 세운 분석
     */
    function calculateYearlyFortune(targetYear, saju) {
        const yearPillar = calculateYearPillar(targetYear, 2, 10); // 입춘 이후로 가정

        const dayPillar = saju.day;
        const sipsin = calculateSipsin(dayPillar, yearPillar);

        // 12신살
        const dayJiji = saju.day.jiji.name;
        const sinsalTable = SINSAL_12[dayJiji];
        const yearSinsal = sinsalTable ? sinsalTable[yearPillar.jiji.name] : null;

        // 충 관계 체크
        const hasChung = Object.values(saju).some(pillar =>
            JIJI_CHUNG[pillar.jiji.name] === yearPillar.jiji.name
        );

        return {
            year: targetYear,
            pillar: yearPillar,
            sipsin,
            sinsal: yearSinsal ? { name: yearSinsal, ...SINSAL_DESC[yearSinsal] } : null,
            hasChung,
            description: `${targetYear}년은 ${yearPillar.korean}년, ${sipsin.cheongan}/${sipsin.jiji}의 해입니다.`
        };
    }

    /**
     * 사주팔자 전체 계산
     * @param {Object} params - 입력 파라미터
     * @returns {Object} 사주 분석 결과
     */
    function calculate(params) {
        const { year, month, day, hour, gender } = params;

        // 사주 계산
        const yearPillar = calculateYearPillar(year, month, day);
        const yearGanIndex = CHEONGAN.findIndex(g => g.name === yearPillar.cheongan.name);

        const monthPillar = calculateMonthPillar(year, month, day, yearGanIndex);
        const dayPillar = calculateDayPillar(year, month, day);
        const dayGanIndex = CHEONGAN.findIndex(g => g.name === dayPillar.cheongan.name);

        const hourPillar = calculateHourPillar(hour, dayGanIndex);

        const saju = {
            year: yearPillar,
            month: monthPillar,
            day: dayPillar,
            hour: hourPillar
        };

        // 십신 계산
        const sipsin = {
            year: calculateSipsin(dayPillar, yearPillar),
            month: calculateSipsin(dayPillar, monthPillar),
            day: { cheongan: '일주', jiji: '일주' },
            hour: calculateSipsin(dayPillar, hourPillar)
        };

        // 대운 계산
        const daeun = calculateDaeun(saju, gender, year, month, day);

        // 오행 분석
        const elementAnalysis = analyzeElements(saju);

        // 12신살 분석
        const sinsal12 = calculate12Sinsal(saju);

        // 공망 분석
        const gongmang = calculateGongmang(saju);

        // 지장간 분석
        const jijanggan = analyzeJijanggan(saju);

        // 합/충/형/파/해 관계 분석
        const relations = analyzeRelations(saju);

        // 올해 세운
        const currentYear = new Date().getFullYear();
        const yearlyFortune = calculateYearlyFortune(currentYear, saju);

        // 향후 5년 세운
        const fiveYearFortune = [];
        for (let i = 0; i < 5; i++) {
            fiveYearFortune.push(calculateYearlyFortune(currentYear + i, saju));
        }

        // 일간 정보
        const dayMaster = {
            ...dayPillar.cheongan,
            description: getDayMasterDescription(dayPillar.cheongan.name)
        };

        // 종합 점수 계산
        const overallScore = calculateOverallScore(sinsal12, relations, elementAnalysis);

        return {
            saju,
            sipsin,
            daeun,
            elementAnalysis,
            sinsal12,
            gongmang,
            jijanggan,
            relations,
            yearlyFortune,
            fiveYearFortune,
            dayMaster,
            overallScore,
            birthInfo: { year, month, day, hour, gender },
            summary: generateSummary(saju, sipsin, elementAnalysis)
        };
    }

    /**
     * 종합 점수 계산
     * @param {Object} sinsal12 - 12신살 분석
     * @param {Object} relations - 관계 분석
     * @param {Object} elementAnalysis - 오행 분석
     * @returns {Object} 종합 점수
     */
    function calculateOverallScore(sinsal12, relations, elementAnalysis) {
        let score = 50; // 기본 점수

        // 12신살 점수 (길신 +5, 흉신 -5)
        score += sinsal12.goodSinsal.length * 5;
        score -= sinsal12.badSinsal.length * 3;

        // 관계 점수
        score += relations.summary.good * 8;
        score -= relations.summary.bad * 5;

        // 오행 균형 점수
        const distribution = Object.values(elementAnalysis.distribution);
        const avg = distribution.reduce((a, b) => a + b, 0) / 5;
        const variance = distribution.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / 5;
        const balanceScore = Math.max(0, 20 - variance * 5);
        score += balanceScore;

        // 점수 범위 조정 (0-100)
        score = Math.max(0, Math.min(100, Math.round(score)));

        // 등급 결정
        let grade, gradeDesc;
        if (score >= 85) {
            grade = 'S';
            gradeDesc = '매우 좋은 사주입니다.';
        } else if (score >= 70) {
            grade = 'A';
            gradeDesc = '좋은 사주입니다.';
        } else if (score >= 55) {
            grade = 'B';
            gradeDesc = '평균적인 사주입니다.';
        } else if (score >= 40) {
            grade = 'C';
            gradeDesc = '주의가 필요한 사주입니다.';
        } else {
            grade = 'D';
            gradeDesc = '보완이 필요한 사주입니다.';
        }

        return {
            score,
            grade,
            gradeDesc,
            breakdown: {
                sinsal: sinsal12.goodSinsal.length * 5 - sinsal12.badSinsal.length * 3,
                relations: relations.summary.good * 8 - relations.summary.bad * 5,
                balance: Math.round(balanceScore)
            }
        };
    }

    /**
     * 일간 설명
     */
    function getDayMasterDescription(gan) {
        const descriptions = {
            '甲': '큰 나무의 기운. 곧고 정직하며 리더십이 있습니다.',
            '乙': '작은 풀의 기운. 유연하고 적응력이 뛰어납니다.',
            '丙': '태양의 기운. 밝고 열정적이며 사교적입니다.',
            '丁': '촛불의 기운. 섬세하고 따뜻하며 배려심이 깊습니다.',
            '戊': '큰 산의 기운. 듬직하고 신뢰감이 있습니다.',
            '己': '농토의 기운. 포용력이 있고 실용적입니다.',
            '庚': '바위/쇠의 기운. 결단력이 있고 의지가 강합니다.',
            '辛': '보석의 기운. 섬세하고 완벽주의적 성향이 있습니다.',
            '壬': '큰 물의 기운. 지혜롭고 포용력이 있습니다.',
            '癸': '이슬/비의 기운. 직관적이고 감수성이 풍부합니다.'
        };
        return descriptions[gan] || '';
    }

    /**
     * 사주 요약 생성
     */
    function generateSummary(saju, sipsin, elementAnalysis) {
        const dayGan = saju.day.cheongan;
        const yongsin = elementAnalysis.yongsin;

        const elementNames = {
            '木': '목(木)', '火': '화(火)', '土': '토(土)',
            '金': '금(金)', '水': '수(水)'
        };

        return {
            dayMaster: `${dayGan.name}(${dayGan.korean})일간 - ${dayGan.elementKr} 오행`,
            yongsin: `용신: ${elementNames[yongsin]}`,
            strongest: `가장 강한 오행: ${elementNames[elementAnalysis.strongest.element]} (${elementAnalysis.strongest.count}개)`,
            weakest: `가장 약한 오행: ${elementNames[elementAnalysis.weakest.element]} (${elementAnalysis.weakest.count}개)`
        };
    }

    // Public API
    return {
        // 메인 계산 함수
        calculate,

        // 개별 계산 함수
        calculateYearPillar,
        calculateMonthPillar,
        calculateDayPillar,
        calculateHourPillar,
        calculateSipsin,
        calculateDaeun,

        // 분석 함수
        analyzeElements,
        calculate12Sinsal,
        calculateGongmang,
        analyzeJijanggan,
        analyzeRelations,
        calculateYearlyFortune,
        calculateOverallScore,

        // 데이터
        CHEONGAN,
        JIJI,
        SIXTY_GANJI,
        JIJANGGAN,
        SINSAL_DESC,
        GONGMANG_TABLE,
        CHEONGAN_HAP,
        JIJI_YUKHAP,
        JIJI_SAMHAP,
        JIJI_CHUNG
    };
})();

// ES Module export (Node.js 환경용)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SajuCalculator;
}
