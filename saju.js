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

    // ===== 상세 해석 템플릿 (Phase 1) =====

    // 일간(日干) 성격 해석 템플릿
    const DAY_MASTER_INTERPRETATION = {
        '甲': {
            personality: '큰 나무처럼 곧고 정직하며, 자신만의 원칙을 가진 리더형입니다. 한번 결정하면 꺾이지 않는 강한 의지를 가졌습니다.',
            strengths: ['리더십', '정직함', '추진력', '책임감'],
            weaknesses: ['고집', '융통성 부족', '타협 어려움'],
            advice: '유연함을 기르면 더 큰 성공을 이룰 수 있습니다. 타인의 의견에도 귀 기울여 보세요.'
        },
        '乙': {
            personality: '작은 풀처럼 유연하고 적응력이 뛰어납니다. 부드러움 속에 강인함이 있어 어떤 환경에서도 살아남습니다.',
            strengths: ['적응력', '유연성', '인내심', '섬세함'],
            weaknesses: ['우유부단', '의존성', '자기주장 부족'],
            advice: '자신의 의견을 더 적극적으로 표현하면 좋겠습니다. 당신의 생각도 소중합니다.'
        },
        '丙': {
            personality: '태양처럼 밝고 열정적입니다. 어디서든 주목받는 카리스마가 있으며, 주변을 환하게 밝히는 에너지를 가졌습니다.',
            strengths: ['열정', '긍정성', '사교성', '표현력'],
            weaknesses: ['조급함', '충동성', '지속력 부족'],
            advice: '끈기를 기르면 시작한 일을 더 잘 완수할 수 있습니다. 차분함도 당신의 무기가 될 수 있어요.'
        },
        '丁': {
            personality: '촛불처럼 섬세하고 따뜻합니다. 주변을 세심하게 배려하며, 조용하지만 깊은 영향력을 발휘합니다.',
            strengths: ['섬세함', '배려심', '통찰력', '집중력'],
            weaknesses: ['예민함', '소심함', '걱정 과다'],
            advice: '자신감을 가지세요. 당신의 섬세함은 큰 강점입니다. 걱정보다 행동이 답을 줄 때가 많습니다.'
        },
        '戊': {
            personality: '큰 산처럼 듬직하고 신뢰감이 있습니다. 주변에 안정감을 주며, 한번 맺은 인연을 오래 유지합니다.',
            strengths: ['신뢰감', '안정성', '포용력', '끈기'],
            weaknesses: ['변화 거부', '느린 행동', '고정관념'],
            advice: '가끔은 새로운 도전도 필요합니다. 안정 속에서도 작은 변화를 시도해보세요.'
        },
        '己': {
            personality: '비옥한 농토처럼 포용력이 있습니다. 실용적이고 현실적이며, 주변을 품어주는 넉넉함이 있습니다.',
            strengths: ['포용력', '실용성', '현실감각', '헌신'],
            weaknesses: ['자기희생', '우유부단', '의존성'],
            advice: '자신을 위한 시간도 챙기세요. 다른 사람을 돌보는 만큼 자신도 돌봐야 합니다.'
        },
        '庚': {
            personality: '단단한 바위나 쇠처럼 결단력이 있습니다. 의지가 강하고 목표를 향해 직진하는 실행력이 있습니다.',
            strengths: ['결단력', '의지력', '실행력', '정의감'],
            weaknesses: ['공격성', '완고함', '감정표현 부족'],
            advice: '때로는 부드러움도 힘입니다. 감정을 표현하는 연습을 하면 관계가 더 좋아질 거예요.'
        },
        '辛': {
            personality: '보석처럼 섬세하고 완벽주의적입니다. 아름다움을 추구하며, 높은 기준을 가지고 있습니다.',
            strengths: ['미적 감각', '완벽주의', '정교함', '품위'],
            weaknesses: ['까다로움', '비판적', '스트레스 취약'],
            advice: '완벽하지 않아도 괜찮습니다. 과정을 즐기면 결과도 더 좋아집니다.'
        },
        '壬': {
            personality: '큰 바다나 강처럼 지혜롭고 포용력이 있습니다. 어떤 상황에서도 흔들리지 않는 깊은 내면을 가졌습니다.',
            strengths: ['지혜', '포용력', '적응력', '창의성'],
            weaknesses: ['방향성 부족', '산만함', '깊이 부족'],
            advice: '목표를 명확히 하면 에너지를 더 효율적으로 쓸 수 있습니다. 집중할 방향을 정해보세요.'
        },
        '癸': {
            personality: '이슬이나 비처럼 직관적이고 감수성이 풍부합니다. 보이지 않는 것을 느끼는 영적 감각이 있습니다.',
            strengths: ['직관력', '감수성', '상상력', '공감능력'],
            weaknesses: ['현실 감각 부족', '감정 기복', '우울 경향'],
            advice: '현실에 발을 딛고 서세요. 당신의 직관은 현실과 만날 때 더 빛납니다.'
        }
    };

    // 십신 해석 템플릿
    const SIPSIN_INTERPRETATION = {
        '비견': {
            meaning: '나와 같은 오행, 같은 음양',
            influence: '경쟁심과 독립심이 강해집니다. 형제자매나 동료와의 관계에 영향을 줍니다.',
            positive: ['자립심', '경쟁력', '동지의식'],
            negative: ['독선', '고집', '분쟁'],
            career: '독립사업, 전문직, 경쟁이 필요한 분야'
        },
        '겁재': {
            meaning: '나와 같은 오행, 다른 음양',
            influence: '욕심과 추진력이 강해집니다. 재물 관리에 주의가 필요합니다.',
            positive: ['추진력', '승부욕', '모험심'],
            negative: ['투기성', '충동', '재물손실'],
            career: '투자, 영업, 모험적인 사업'
        },
        '식신': {
            meaning: '내가 생하는 오행, 같은 음양',
            influence: '표현력과 창의력이 풍부합니다. 먹는 것, 말하는 것과 관련됩니다.',
            positive: ['창의력', '표현력', '낙천성'],
            negative: ['게으름', '향락', '방종'],
            career: '요식업, 예술, 교육, 창작 분야'
        },
        '상관': {
            meaning: '내가 생하는 오행, 다른 음양',
            influence: '반항심과 개혁정신이 있습니다. 기존 질서에 도전합니다.',
            positive: ['혁신', '창조성', '언변'],
            negative: ['반항', '구설', '불안정'],
            career: '연예, 법률, 혁신적인 분야'
        },
        '편재': {
            meaning: '내가 극하는 오행, 같은 음양',
            influence: '투자 감각과 사업수완이 있습니다. 큰 재물을 다룹니다.',
            positive: ['사업수완', '활동성', '대인관계'],
            negative: ['투기', '바람기', '과소비'],
            career: '무역, 금융, 사업, 유통'
        },
        '정재': {
            meaning: '내가 극하는 오행, 다른 음양',
            influence: '안정적인 재물운이 있습니다. 성실한 노력으로 재산을 모읍니다.',
            positive: ['근면', '저축', '안정'],
            negative: ['인색', '소심', '융통성 부족'],
            career: '회계, 금융, 안정적인 직장'
        },
        '편관': {
            meaning: '나를 극하는 오행, 같은 음양',
            influence: '권력욕과 통제력이 있습니다. 강한 카리스마를 발휘합니다.',
            positive: ['리더십', '결단력', '추진력'],
            negative: ['폭력성', '횡포', '스트레스'],
            career: '군인, 경찰, 정치, 관리직'
        },
        '정관': {
            meaning: '나를 극하는 오행, 다른 음양',
            influence: '규율과 책임감이 강합니다. 사회적 명예를 중시합니다.',
            positive: ['책임감', '명예욕', '규율'],
            negative: ['경직', '체면', '스트레스'],
            career: '공무원, 대기업, 법조계'
        },
        '편인': {
            meaning: '나를 생하는 오행, 같은 음양',
            influence: '비범한 학문적 능력이 있습니다. 독창적인 사고를 합니다.',
            positive: ['창의성', '학문', '영성'],
            negative: ['고독', '편협', '비현실적'],
            career: '연구, 종교, 예술, 철학'
        },
        '정인': {
            meaning: '나를 생하는 오행, 다른 음양',
            influence: '학문과 지식에 대한 욕구가 강합니다. 어머니와의 인연이 깊습니다.',
            positive: ['지혜', '인자함', '학문'],
            negative: ['의존성', '게으름', '망상'],
            career: '교육, 학문, 의료, 상담'
        }
    };

    // 테마별 운세 매핑 (Phase 2)
    const THEMED_FORTUNE_MAP = {
        love: {
            name: '연애운',
            icon: '❤️',
            sipsinMale: ['정재', '편재'],
            sipsinFemale: ['정관', '편관'],
            elements: ['水', '火'],
            description: '연애와 결혼, 이성 관계에 대한 운세'
        },
        wealth: {
            name: '재물운',
            icon: '💰',
            sipsin: ['정재', '편재', '식신'],
            elements: ['土', '金'],
            description: '재물과 금전, 재산에 대한 운세'
        },
        career: {
            name: '사업운',
            icon: '💼',
            sipsin: ['식신', '상관', '편관', '정관'],
            elements: ['火', '木'],
            description: '사업과 직장, 승진에 대한 운세'
        },
        health: {
            name: '건강운',
            icon: '💪',
            sipsin: ['비견', '겁재', '정인', '편인'],
            elements: ['전체균형'],
            description: '건강과 체력, 정신건강에 대한 운세'
        },
        study: {
            name: '학업운',
            icon: '📚',
            sipsin: ['정인', '편인', '식신'],
            elements: ['水', '木'],
            description: '학업과 시험, 자격증에 대한 운세'
        }
    };

    // 일진(日辰) 계산을 위한 기준점
    const DAILY_PILLAR_BASE = {
        date: new Date(1900, 0, 1),
        ganjiIndex: 10 // 甲戌일
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

    // ===== Phase 1: 상세 해석 함수 =====

    /**
     * 상세 해석 생성
     * @param {Object} sajuResult - 사주 분석 결과
     * @returns {Object} 상세 해석
     */
    function generateDetailedInterpretation(sajuResult) {
        const dayGan = sajuResult.saju.day.cheongan.name;
        const dayMasterInterp = DAY_MASTER_INTERPRETATION[dayGan] || {};

        // 십신 분석
        const sipsinAnalysis = [];
        const sipsinPillars = ['year', 'month', 'hour'];
        sipsinPillars.forEach(pillar => {
            const ganSipsin = sajuResult.sipsin[pillar].cheongan;
            const jiSipsin = sajuResult.sipsin[pillar].jiji;

            if (SIPSIN_INTERPRETATION[ganSipsin]) {
                sipsinAnalysis.push({
                    pillar: pillar === 'year' ? '년주' : pillar === 'month' ? '월주' : '시주',
                    position: '천간',
                    sipsin: ganSipsin,
                    ...SIPSIN_INTERPRETATION[ganSipsin]
                });
            }
            if (SIPSIN_INTERPRETATION[jiSipsin]) {
                sipsinAnalysis.push({
                    pillar: pillar === 'year' ? '년주' : pillar === 'month' ? '월주' : '시주',
                    position: '지지',
                    sipsin: jiSipsin,
                    ...SIPSIN_INTERPRETATION[jiSipsin]
                });
            }
        });

        // 오행 균형 해석
        const elementBalance = interpretElementBalance(sajuResult.elementAnalysis);

        // 관계 해석
        const relationInterpretation = interpretRelations(sajuResult.relations);

        // 종합 운세 조언
        const overallAdvice = generateOverallAdvice(sajuResult);

        return {
            personality: {
                title: '성격 분석',
                dayMaster: {
                    gan: dayGan,
                    korean: sajuResult.saju.day.cheongan.korean,
                    ...dayMasterInterp
                }
            },
            sipsin: {
                title: '십신 분석',
                analysis: sipsinAnalysis
            },
            elementBalance: {
                title: '오행 분석',
                ...elementBalance
            },
            relations: {
                title: '관계 분석',
                ...relationInterpretation
            },
            advice: {
                title: '종합 조언',
                ...overallAdvice
            }
        };
    }

    /**
     * 오행 균형 해석
     */
    function interpretElementBalance(elementAnalysis) {
        const { distribution, strongest, weakest, yongsin } = elementAnalysis;

        const elementDescriptions = {
            '木': '목(木)은 성장, 발전, 창의력을 상징합니다.',
            '火': '화(火)는 열정, 표현력, 에너지를 상징합니다.',
            '土': '토(土)는 안정, 신뢰, 중재를 상징합니다.',
            '金': '금(金)은 결단력, 정의, 완성을 상징합니다.',
            '水': '수(水)는 지혜, 유연함, 소통을 상징합니다.'
        };

        // 균형도 계산
        const values = Object.values(distribution);
        const avg = values.reduce((a, b) => a + b, 0) / 5;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / 5;
        const balanceScore = Math.max(0, 100 - variance * 15);

        let balanceDescription = '';
        if (balanceScore >= 80) {
            balanceDescription = '오행이 매우 균형잡혀 있어 안정적인 삶을 살 수 있습니다.';
        } else if (balanceScore >= 60) {
            balanceDescription = '오행이 비교적 균형잡혀 있으나, 용신을 보충하면 더 좋습니다.';
        } else if (balanceScore >= 40) {
            balanceDescription = '오행의 편중이 있어 용신 보충이 필요합니다.';
        } else {
            balanceDescription = '오행의 불균형이 심해 적극적인 용신 보충이 필요합니다.';
        }

        return {
            distribution,
            balanceScore: Math.round(balanceScore),
            balanceDescription,
            strongestElement: {
                element: strongest.element,
                count: strongest.count,
                description: elementDescriptions[strongest.element],
                effect: `${strongest.element} 오행이 강해 관련된 특성이 두드러집니다.`
            },
            weakestElement: {
                element: weakest.element,
                count: weakest.count,
                description: elementDescriptions[weakest.element],
                effect: `${weakest.element} 오행이 약해 보충이 필요합니다.`
            },
            yongsin: {
                element: yongsin,
                description: elementDescriptions[yongsin],
                advice: `${yongsin} 오행과 관련된 색상, 방향, 음식 등을 활용하면 좋습니다.`
            }
        };
    }

    /**
     * 관계 해석
     */
    function interpretRelations(relations) {
        const goodRelationsInterpretation = [];
        const badRelationsInterpretation = [];

        // 천간합 해석
        relations.cheonganHap.forEach(rel => {
            goodRelationsInterpretation.push({
                type: '천간합',
                description: rel.desc,
                meaning: '서로 돕고 화합하는 관계로, 협력과 조화가 잘 됩니다.'
            });
        });

        // 육합 해석
        relations.yukhap.forEach(rel => {
            goodRelationsInterpretation.push({
                type: '육합',
                description: rel.desc,
                meaning: '깊은 인연과 결합의 기운이 있습니다.'
            });
        });

        // 삼합 해석
        relations.samhap.forEach(rel => {
            goodRelationsInterpretation.push({
                type: '삼합',
                description: rel.desc,
                meaning: rel.full ? '완전한 삼합으로 큰 힘이 됩니다.' : '반합으로 잠재적인 힘이 있습니다.'
            });
        });

        // 충 해석
        relations.chung.forEach(rel => {
            badRelationsInterpretation.push({
                type: '충',
                description: rel.desc,
                meaning: '대립과 갈등의 기운이 있어 변화가 많습니다.',
                advice: '변화를 두려워하지 말고 적극적으로 대응하세요.'
            });
        });

        // 형 해석
        relations.hyung.forEach(rel => {
            badRelationsInterpretation.push({
                type: '형',
                description: rel.desc,
                meaning: '마찰과 시련이 있을 수 있습니다.',
                advice: '인내심을 가지고 문제를 해결해 나가세요.'
            });
        });

        return {
            good: goodRelationsInterpretation,
            bad: badRelationsInterpretation,
            summary: relations.summary
        };
    }

    /**
     * 종합 조언 생성
     */
    function generateOverallAdvice(sajuResult) {
        const adviceList = [];
        const dayGan = sajuResult.saju.day.cheongan.name;
        const dayMasterInterp = DAY_MASTER_INTERPRETATION[dayGan];

        // 일간 기반 조언
        if (dayMasterInterp) {
            adviceList.push({
                category: '성격',
                advice: dayMasterInterp.advice
            });
        }

        // 용신 기반 조언
        const yongsin = sajuResult.elementAnalysis.yongsin;
        const yongsinAdvice = {
            '木': '동쪽 방향, 녹색 계열, 나무나 식물 관련 활동이 좋습니다.',
            '火': '남쪽 방향, 빨간색 계열, 열정적인 활동이 좋습니다.',
            '土': '중앙, 노란색/갈색 계열, 안정적인 활동이 좋습니다.',
            '金': '서쪽 방향, 흰색/금색 계열, 정리정돈 활동이 좋습니다.',
            '水': '북쪽 방향, 검정/파란색 계열, 지적 활동이 좋습니다.'
        };
        adviceList.push({
            category: '용신 활용',
            advice: yongsinAdvice[yongsin] || ''
        });

        // 12신살 기반 조언
        const sinsal = sajuResult.sinsal12;
        if (sinsal.badSinsal.length > sinsal.goodSinsal.length) {
            adviceList.push({
                category: '운세',
                advice: '현재 도전적인 시기이므로 신중하게 행동하고, 무리한 투자나 결정은 피하세요.'
            });
        } else {
            adviceList.push({
                category: '운세',
                advice: '좋은 기운이 많으니 적극적으로 기회를 잡으세요.'
            });
        }

        // 관계 기반 조언
        if (sajuResult.relations.chung.length > 0) {
            adviceList.push({
                category: '관계',
                advice: '사주에 충이 있어 변화가 많을 수 있습니다. 변화를 기회로 삼으세요.'
            });
        }

        // 행운의 색상/숫자
        const luckyColors = {
            '木': ['녹색', '청색'],
            '火': ['빨간색', '보라색'],
            '土': ['노란색', '갈색'],
            '金': ['흰색', '금색'],
            '水': ['검정색', '남색']
        };
        const luckyNumbers = {
            '木': [3, 8],
            '火': [2, 7],
            '土': [5, 10],
            '金': [4, 9],
            '水': [1, 6]
        };

        return {
            adviceList,
            luckyColors: luckyColors[yongsin] || [],
            luckyNumbers: luckyNumbers[yongsin] || [],
            luckyDirection: {
                '木': '동쪽',
                '火': '남쪽',
                '土': '중앙',
                '金': '서쪽',
                '水': '북쪽'
            }[yongsin] || ''
        };
    }

    // ===== Phase 2: 테마별 운세 함수 =====

    /**
     * 테마별 운세 계산
     * @param {Object} sajuResult - 사주 분석 결과
     * @param {string} theme - 테마 ('love', 'wealth', 'career', 'health', 'study')
     * @param {string} gender - 성별 ('male' 또는 'female')
     * @returns {Object} 테마별 운세
     */
    function calculateThemedFortune(sajuResult, theme, gender) {
        const themeConfig = THEMED_FORTUNE_MAP[theme];
        if (!themeConfig) return null;

        // 관련 십신 카운트
        const relatedSipsin = theme === 'love'
            ? (gender === 'male' ? themeConfig.sipsinMale : themeConfig.sipsinFemale)
            : themeConfig.sipsin;

        let sipsinCount = 0;
        let sipsinDetails = [];

        ['year', 'month', 'hour'].forEach(pillar => {
            const ganSipsin = sajuResult.sipsin[pillar].cheongan;
            const jiSipsin = sajuResult.sipsin[pillar].jiji;

            if (relatedSipsin && relatedSipsin.includes(ganSipsin)) {
                sipsinCount++;
                sipsinDetails.push({ pillar, position: '천간', sipsin: ganSipsin });
            }
            if (relatedSipsin && relatedSipsin.includes(jiSipsin)) {
                sipsinCount++;
                sipsinDetails.push({ pillar, position: '지지', sipsin: jiSipsin });
            }
        });

        // 관련 오행 분석
        let elementScore = 0;
        if (theme === 'health') {
            // 건강운은 오행 균형도로 계산
            const values = Object.values(sajuResult.elementAnalysis.distribution);
            const avg = values.reduce((a, b) => a + b, 0) / 5;
            const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / 5;
            elementScore = Math.max(0, 100 - variance * 10);
        } else {
            themeConfig.elements.forEach(element => {
                elementScore += (sajuResult.elementAnalysis.distribution[element] || 0) * 10;
            });
        }

        // 12신살 영향
        let sinsalBonus = 0;
        if (sajuResult.sinsal12.goodSinsal) {
            sinsalBonus = sajuResult.sinsal12.goodSinsal.length * 5 -
                          sajuResult.sinsal12.badSinsal.length * 3;
        }

        // 종합 점수 계산 (100점 만점)
        const baseScore = 50;
        const sipsinScore = sipsinCount * 8;
        const totalScore = Math.min(100, Math.max(0,
            baseScore + sipsinScore + elementScore / 4 + sinsalBonus
        ));

        // 등급 결정
        let grade, gradeDesc;
        if (totalScore >= 85) {
            grade = 'S';
            gradeDesc = '매우 좋음';
        } else if (totalScore >= 70) {
            grade = 'A';
            gradeDesc = '좋음';
        } else if (totalScore >= 55) {
            grade = 'B';
            gradeDesc = '보통';
        } else if (totalScore >= 40) {
            grade = 'C';
            gradeDesc = '주의';
        } else {
            grade = 'D';
            gradeDesc = '노력 필요';
        }

        // 상세 해석 생성
        const interpretation = generateThemeInterpretation(theme, sipsinDetails, totalScore, gender);

        return {
            theme: themeConfig.name,
            icon: themeConfig.icon,
            description: themeConfig.description,
            score: Math.round(totalScore),
            grade,
            gradeDesc,
            sipsinCount,
            sipsinDetails,
            interpretation,
            advice: generateThemeAdvice(theme, totalScore, sajuResult.elementAnalysis.yongsin)
        };
    }

    /**
     * 모든 테마 운세 계산
     */
    function calculateAllThemedFortunes(sajuResult, gender) {
        const themes = ['love', 'wealth', 'career', 'health', 'study'];
        const results = {};
        themes.forEach(theme => {
            results[theme] = calculateThemedFortune(sajuResult, theme, gender);
        });
        return results;
    }

    /**
     * 테마별 해석 생성
     */
    function generateThemeInterpretation(theme, sipsinDetails, score, gender) {
        const interpretations = {
            love: {
                high: '연애운이 매우 좋습니다. 좋은 인연을 만나거나 현재 관계가 더욱 깊어질 수 있습니다.',
                medium: '연애운이 평균적입니다. 적극적으로 노력하면 좋은 결과가 있을 것입니다.',
                low: '연애운에 주의가 필요합니다. 서두르지 말고 천천히 관계를 발전시키세요.'
            },
            wealth: {
                high: '재물운이 매우 좋습니다. 투자나 사업에서 좋은 성과를 기대할 수 있습니다.',
                medium: '재물운이 평균적입니다. 꾸준한 노력으로 안정적인 수입을 유지할 수 있습니다.',
                low: '재물운에 주의가 필요합니다. 과소비를 피하고 저축에 힘쓰세요.'
            },
            career: {
                high: '사업운이 매우 좋습니다. 승진이나 새로운 기회가 찾아올 수 있습니다.',
                medium: '사업운이 평균적입니다. 꾸준히 실력을 쌓으면 좋은 결과가 있을 것입니다.',
                low: '사업운에 주의가 필요합니다. 현재 위치에서 실력을 다지는 시간이 필요합니다.'
            },
            health: {
                high: '건강운이 매우 좋습니다. 활력이 넘치고 체력이 좋은 시기입니다.',
                medium: '건강운이 평균적입니다. 규칙적인 생활과 운동으로 건강을 유지하세요.',
                low: '건강에 주의가 필요합니다. 무리하지 말고 충분한 휴식을 취하세요.'
            },
            study: {
                high: '학업운이 매우 좋습니다. 집중력이 높아 좋은 성과를 거둘 수 있습니다.',
                medium: '학업운이 평균적입니다. 꾸준한 노력이 좋은 결과로 이어질 것입니다.',
                low: '학업에 집중이 어려운 시기입니다. 학습 환경을 개선하고 계획을 세워보세요.'
            }
        };

        const level = score >= 70 ? 'high' : score >= 45 ? 'medium' : 'low';
        return interpretations[theme]?.[level] || '해석을 준비 중입니다.';
    }

    /**
     * 테마별 조언 생성
     */
    function generateThemeAdvice(theme, score, yongsin) {
        const adviceMap = {
            love: {
                high: ['적극적으로 인연을 만들어보세요.', '현재 관계를 더욱 발전시킬 좋은 시기입니다.'],
                medium: ['진심을 다해 상대방을 대하세요.', '작은 관심과 배려가 큰 차이를 만듭니다.'],
                low: ['조급해하지 말고 자기 발전에 집중하세요.', '좋은 인연은 준비된 사람에게 찾아옵니다.']
            },
            wealth: {
                high: ['투자 기회를 적극적으로 살펴보세요.', '사업 확장을 고려해볼 좋은 시기입니다.'],
                medium: ['안정적인 재테크에 집중하세요.', '무리한 투자보다 꾸준한 저축이 좋습니다.'],
                low: ['불필요한 지출을 줄이세요.', '재정 계획을 다시 세워보세요.']
            },
            career: {
                high: ['새로운 도전을 시도해보세요.', '리더십을 발휘할 좋은 기회입니다.'],
                medium: ['현재 위치에서 전문성을 키우세요.', '네트워크를 넓히는 것이 도움이 됩니다.'],
                low: ['조용히 실력을 쌓는 시간이 필요합니다.', '급격한 변화보다 안정을 추구하세요.']
            },
            health: {
                high: ['운동량을 늘려 체력을 키우세요.', '건강할 때 건강을 지키는 습관을 들이세요.'],
                medium: ['규칙적인 생활 패턴을 유지하세요.', '스트레스 관리에 신경 쓰세요.'],
                low: ['무리한 활동은 자제하세요.', '정기 검진을 받아보세요.']
            },
            study: {
                high: ['어려운 과목에 도전해보세요.', '시험이나 자격증 취득에 좋은 시기입니다.'],
                medium: ['꾸준한 복습이 중요합니다.', '스터디 그룹을 활용해보세요.'],
                low: ['학습 환경을 개선해보세요.', '작은 목표부터 달성해나가세요.']
            }
        };

        const level = score >= 70 ? 'high' : score >= 45 ? 'medium' : 'low';
        return adviceMap[theme]?.[level] || [];
    }

    // ===== Phase 3: 기간별 운세 함수 =====

    /**
     * 일진(오늘의 운세) 계산
     * @param {Object} sajuResult - 사주 분석 결과
     * @param {Date} targetDate - 대상 날짜 (기본값: 오늘)
     * @returns {Object} 일진 운세
     */
    function calculateDailyFortune(sajuResult, targetDate = new Date()) {
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth() + 1;
        const day = targetDate.getDate();

        // 해당 일의 일주 계산
        const dailyPillar = calculateDayPillar(year, month, day);

        // 일간과의 관계 분석
        const daySipsin = calculateSipsin(sajuResult.saju.day, dailyPillar);

        // 12신살
        const dayJiji = sajuResult.saju.day.jiji.name;
        const sinsalTable = SINSAL_12[dayJiji];
        const dailySinsal = sinsalTable ? sinsalTable[dailyPillar.jiji.name] : null;

        // 충 관계 체크
        const hasChung = JIJI_CHUNG[sajuResult.saju.day.jiji.name] === dailyPillar.jiji.name;

        // 합 관계 체크
        const hapInfo = JIJI_YUKHAP[sajuResult.saju.day.jiji.name];
        const hasHap = hapInfo && hapInfo.pair === dailyPillar.jiji.name;

        // 점수 계산
        let score = 50;
        const sinsalInfo = SINSAL_DESC[dailySinsal];
        if (sinsalInfo) {
            score += sinsalInfo.good ? 15 : -10;
        }
        if (hasChung) score -= 15;
        if (hasHap) score += 20;

        // 십신 영향
        const goodSipsin = ['정재', '정관', '정인', '식신'];
        const badSipsin = ['상관', '겁재', '편관'];
        if (goodSipsin.includes(daySipsin.cheongan)) score += 10;
        if (badSipsin.includes(daySipsin.cheongan)) score -= 5;

        score = Math.max(0, Math.min(100, score));

        // 행운의 시간대
        const luckyHours = calculateLuckyHours(sajuResult, dailyPillar);

        return {
            date: targetDate,
            dateString: `${year}년 ${month}월 ${day}일`,
            pillar: dailyPillar,
            sipsin: daySipsin,
            sinsal: dailySinsal ? { name: dailySinsal, ...SINSAL_DESC[dailySinsal] } : null,
            hasChung,
            hasHap,
            score: Math.round(score),
            grade: score >= 70 ? 'A' : score >= 50 ? 'B' : 'C',
            interpretation: generateDailyInterpretation(daySipsin, dailySinsal, hasChung, hasHap),
            luckyHours,
            luckyColor: getLuckyColorForDay(dailyPillar),
            luckyNumber: getLuckyNumberForDay(dailyPillar)
        };
    }

    /**
     * 행운의 시간대 계산
     */
    function calculateLuckyHours(sajuResult, dailyPillar) {
        const yongsin = sajuResult.elementAnalysis.yongsin;
        const luckyHours = [];

        // 용신과 맞는 시간대 찾기
        for (let i = 0; i < 12; i++) {
            const jijiElement = JIJI[i].element;
            if (jijiElement === yongsin) {
                const startHour = (i * 2 + 23) % 24;
                const endHour = (startHour + 2) % 24;
                luckyHours.push({
                    jiji: JIJI[i].name,
                    jijiKorean: JIJI[i].korean,
                    timeRange: `${String(startHour).padStart(2, '0')}:00 - ${String(endHour).padStart(2, '0')}:00`
                });
            }
        }

        return luckyHours;
    }

    /**
     * 일일 해석 생성
     */
    function generateDailyInterpretation(sipsin, sinsal, hasChung, hasHap) {
        let interpretation = '';

        // 십신 기반 해석
        if (SIPSIN_INTERPRETATION[sipsin.cheongan]) {
            interpretation += SIPSIN_INTERPRETATION[sipsin.cheongan].influence + ' ';
        }

        // 신살 기반 해석
        if (sinsal && SINSAL_DESC[sinsal]) {
            interpretation += SINSAL_DESC[sinsal].desc + ' ';
        }

        // 충/합 해석
        if (hasChung) {
            interpretation += '변화와 움직임이 많은 날입니다. 중요한 결정은 신중하게 하세요.';
        } else if (hasHap) {
            interpretation += '조화와 협력이 잘 되는 날입니다. 인간관계에 좋은 시기입니다.';
        }

        return interpretation || '평온한 하루가 될 것입니다.';
    }

    /**
     * 일일 행운의 색상
     */
    function getLuckyColorForDay(dailyPillar) {
        const elementColors = {
            '木': { color: '녹색', hex: '#34c759' },
            '火': { color: '빨간색', hex: '#ff3b30' },
            '土': { color: '노란색', hex: '#ff9500' },
            '金': { color: '흰색', hex: '#c0c0c0' },
            '水': { color: '파란색', hex: '#007aff' }
        };
        return elementColors[dailyPillar.cheongan.element] || { color: '검정', hex: '#1d1d1f' };
    }

    /**
     * 일일 행운의 숫자
     */
    function getLuckyNumberForDay(dailyPillar) {
        const elementNumbers = {
            '木': [3, 8],
            '火': [2, 7],
            '土': [5, 10],
            '金': [4, 9],
            '水': [1, 6]
        };
        return elementNumbers[dailyPillar.cheongan.element] || [5];
    }

    /**
     * 월간 운세 계산
     * @param {Object} sajuResult - 사주 분석 결과
     * @param {number} year - 연도
     * @param {number} month - 월 (1-12)
     * @returns {Object} 월간 운세
     */
    function calculateMonthlyFortune(sajuResult, year, month) {
        // 월주 계산
        const yearPillar = calculateYearPillar(year, month, 15);
        const yearGanIndex = CHEONGAN.findIndex(g => g.name === yearPillar.cheongan.name);
        const monthPillar = calculateMonthPillar(year, month, 15, yearGanIndex);

        // 십신 분석
        const monthSipsin = calculateSipsin(sajuResult.saju.day, monthPillar);

        // 12신살
        const dayJiji = sajuResult.saju.day.jiji.name;
        const sinsalTable = SINSAL_12[dayJiji];
        const monthlySinsal = sinsalTable ? sinsalTable[monthPillar.jiji.name] : null;

        // 충/합 체크
        const hasChung = JIJI_CHUNG[sajuResult.saju.day.jiji.name] === monthPillar.jiji.name;
        const hapInfo = JIJI_YUKHAP[sajuResult.saju.day.jiji.name];
        const hasHap = hapInfo && hapInfo.pair === monthPillar.jiji.name;

        // 점수 계산
        let score = 50;
        const sinsalInfo = SINSAL_DESC[monthlySinsal];
        if (sinsalInfo) {
            score += sinsalInfo.good ? 15 : -10;
        }
        if (hasChung) score -= 15;
        if (hasHap) score += 20;

        // 좋은 날/나쁜 날 찾기
        const keyDates = findKeyDates(sajuResult, year, month);

        return {
            year,
            month,
            monthName: `${year}년 ${month}월`,
            pillar: monthPillar,
            sipsin: monthSipsin,
            sinsal: monthlySinsal ? { name: monthlySinsal, ...SINSAL_DESC[monthlySinsal] } : null,
            hasChung,
            hasHap,
            score: Math.round(Math.max(0, Math.min(100, score))),
            grade: score >= 70 ? 'A' : score >= 50 ? 'B' : 'C',
            keyDates,
            interpretation: generateMonthlyInterpretation(monthSipsin, monthlySinsal),
            advice: generateMonthlyAdvice(monthSipsin, score)
        };
    }

    /**
     * 핵심 날짜 찾기 (좋은 날/나쁜 날)
     */
    function findKeyDates(sajuResult, year, month) {
        const goodDates = [];
        const cautionDates = [];
        const daysInMonth = new Date(year, month, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            const fortune = calculateDailyFortune(sajuResult, new Date(year, month - 1, day));

            if (fortune.score >= 75) {
                goodDates.push({ day, score: fortune.score, reason: fortune.sinsal?.name || '좋은 기운' });
            } else if (fortune.score <= 35 || fortune.hasChung) {
                cautionDates.push({ day, score: fortune.score, reason: fortune.hasChung ? '충' : (fortune.sinsal?.name || '주의') });
            }
        }

        return {
            good: goodDates.slice(0, 5),
            caution: cautionDates.slice(0, 5)
        };
    }

    /**
     * 월간 해석 생성
     */
    function generateMonthlyInterpretation(sipsin, sinsal) {
        let interpretation = '';

        if (SIPSIN_INTERPRETATION[sipsin.cheongan]) {
            interpretation += `이번 달은 ${sipsin.cheongan}의 기운이 강합니다. `;
            interpretation += SIPSIN_INTERPRETATION[sipsin.cheongan].influence;
        }

        if (sinsal && SINSAL_DESC[sinsal]) {
            interpretation += ` ${SINSAL_DESC[sinsal].desc}`;
        }

        return interpretation || '평온한 한 달이 될 것입니다.';
    }

    /**
     * 월간 조언 생성
     */
    function generateMonthlyAdvice(sipsin, score) {
        const advice = [];

        if (score >= 70) {
            advice.push('적극적으로 활동하기 좋은 시기입니다.');
            advice.push('새로운 시작이나 중요한 결정에 좋습니다.');
        } else if (score >= 50) {
            advice.push('안정적으로 계획을 추진하세요.');
            advice.push('무리하지 않고 꾸준히 노력하면 좋은 결과가 있습니다.');
        } else {
            advice.push('신중하게 행동하는 것이 좋습니다.');
            advice.push('급한 결정보다는 준비 기간으로 활용하세요.');
        }

        return advice;
    }

    // ===== Phase 4: 궁합 분석 함수 =====

    /**
     * 궁합 분석
     * @param {Object} person1 - 첫 번째 사람 사주 결과
     * @param {Object} person2 - 두 번째 사람 사주 결과
     * @returns {Object} 궁합 분석 결과
     */
    function analyzeCompatibility(person1, person2) {
        // 1. 일주 궁합 (40%)
        const ilju = analyzeIljuCompatibility(person1.saju.day, person2.saju.day);

        // 2. 지지 궁합 (30%)
        const jiji = analyzeJijiCompatibility(person1.saju, person2.saju);

        // 3. 오행 보완도 (20%)
        const element = analyzeElementCompatibility(person1.elementAnalysis, person2.elementAnalysis);

        // 4. 십신 궁합 (10%)
        const sipsin = analyzeSipsinCompatibility(person1, person2);

        // 종합 점수 계산
        const totalScore = Math.round(
            ilju.score * 0.4 +
            jiji.score * 0.3 +
            element.score * 0.2 +
            sipsin.score * 0.1
        );

        // 등급 결정
        let grade, gradeDesc;
        if (totalScore >= 85) {
            grade = 'S';
            gradeDesc = '천생연분';
        } else if (totalScore >= 70) {
            grade = 'A';
            gradeDesc = '좋은 궁합';
        } else if (totalScore >= 55) {
            grade = 'B';
            gradeDesc = '무난한 궁합';
        } else if (totalScore >= 40) {
            grade = 'C';
            gradeDesc = '노력 필요';
        } else {
            grade = 'D';
            gradeDesc = '많은 노력 필요';
        }

        // 영역별 궁합
        const categoryCompatibility = analyzeCategoryCompatibility(person1, person2);

        // 조언 생성
        const advice = generateCompatibilityAdvice(ilju, jiji, element, totalScore);

        return {
            totalScore,
            grade,
            gradeDesc,
            breakdown: {
                ilju: { ...ilju, weight: 40 },
                jiji: { ...jiji, weight: 30 },
                element: { ...element, weight: 20 },
                sipsin: { ...sipsin, weight: 10 }
            },
            categoryCompatibility,
            goodPoints: collectGoodPoints(ilju, jiji, element),
            cautionPoints: collectCautionPoints(ilju, jiji, element),
            advice,
            interpretation: generateCompatibilityInterpretation(totalScore, ilju, jiji)
        };
    }

    /**
     * 일주 궁합 분석
     */
    function analyzeIljuCompatibility(day1, day2) {
        let score = 50;
        const details = [];

        // 천간 합 체크
        const ganHap = CHEONGAN_HAP[day1.cheongan.name];
        if (ganHap && ganHap.pair === day2.cheongan.name) {
            score += 30;
            details.push({ type: '천간합', good: true, desc: `${day1.cheongan.korean}-${day2.cheongan.korean} 천간합` });
        }

        // 오행 상생 체크
        const element1 = day1.cheongan.element;
        const element2 = day2.cheongan.element;
        const sangSaeng = {
            '木': '火', '火': '土', '土': '金', '金': '水', '水': '木'
        };
        if (sangSaeng[element1] === element2 || sangSaeng[element2] === element1) {
            score += 15;
            details.push({ type: '상생', good: true, desc: '일간이 서로 상생합니다' });
        }

        // 오행 상극 체크
        const sangKeuk = {
            '木': '土', '土': '水', '水': '火', '火': '金', '金': '木'
        };
        if (sangKeuk[element1] === element2 || sangKeuk[element2] === element1) {
            score -= 10;
            details.push({ type: '상극', good: false, desc: '일간이 서로 상극합니다' });
        }

        // 지지 합 체크
        const jiHap = JIJI_YUKHAP[day1.jiji.name];
        if (jiHap && jiHap.pair === day2.jiji.name) {
            score += 20;
            details.push({ type: '지지육합', good: true, desc: `${day1.jiji.korean}-${day2.jiji.korean} 육합` });
        }

        // 지지 충 체크
        if (JIJI_CHUNG[day1.jiji.name] === day2.jiji.name) {
            score -= 20;
            details.push({ type: '지지충', good: false, desc: `${day1.jiji.korean}-${day2.jiji.korean} 충` });
        }

        return {
            score: Math.max(0, Math.min(100, score)),
            details,
            summary: score >= 70 ? '일주 궁합이 좋습니다' : score >= 50 ? '일주 궁합이 보통입니다' : '일주 궁합에 주의가 필요합니다'
        };
    }

    /**
     * 지지 궁합 분석
     */
    function analyzeJijiCompatibility(saju1, saju2) {
        let score = 50;
        const goodRelations = [];
        const badRelations = [];

        const jijis1 = [saju1.year.jiji.name, saju1.month.jiji.name, saju1.day.jiji.name, saju1.hour.jiji.name];
        const jijis2 = [saju2.year.jiji.name, saju2.month.jiji.name, saju2.day.jiji.name, saju2.hour.jiji.name];

        // 모든 지지 조합 체크
        jijis1.forEach(j1 => {
            jijis2.forEach(j2 => {
                // 육합
                const hapInfo = JIJI_YUKHAP[j1];
                if (hapInfo && hapInfo.pair === j2) {
                    score += 8;
                    goodRelations.push(`${j1}-${j2} 육합`);
                }

                // 충
                if (JIJI_CHUNG[j1] === j2) {
                    score -= 8;
                    badRelations.push(`${j1}-${j2} 충`);
                }

                // 형
                const hyungTargets = JIJI_HYUNG[j1] || [];
                if (hyungTargets.includes(j2)) {
                    score -= 5;
                    badRelations.push(`${j1}-${j2} 형`);
                }

                // 해
                if (JIJI_HAE[j1] === j2) {
                    score -= 3;
                    badRelations.push(`${j1}-${j2} 해`);
                }
            });
        });

        // 삼합 체크
        JIJI_SAMHAP.forEach(samhap => {
            const matches1 = samhap.members.filter(m => jijis1.includes(m));
            const matches2 = samhap.members.filter(m => jijis2.includes(m));
            const totalMatches = new Set([...matches1, ...matches2]).size;

            if (totalMatches >= 2 && matches1.length > 0 && matches2.length > 0) {
                score += 10;
                goodRelations.push(`${samhap.name} 형성`);
            }
        });

        return {
            score: Math.max(0, Math.min(100, score)),
            goodRelations,
            badRelations,
            summary: goodRelations.length > badRelations.length ? '지지 관계가 좋습니다' : '지지 관계에 주의점이 있습니다'
        };
    }

    /**
     * 오행 보완도 분석
     */
    function analyzeElementCompatibility(elem1, elem2) {
        let score = 50;
        const complementary = [];

        // 서로의 약한 오행을 보완해주는지 체크
        Object.keys(elem1.distribution).forEach(element => {
            const count1 = elem1.distribution[element];
            const count2 = elem2.distribution[element];

            // 한쪽이 약하고 다른 쪽이 강하면 보완
            if (count1 <= 1 && count2 >= 3) {
                score += 10;
                complementary.push(`${element} 오행 보완 (1→2)`);
            }
            if (count2 <= 1 && count1 >= 3) {
                score += 10;
                complementary.push(`${element} 오행 보완 (2→1)`);
            }
        });

        // 용신 일치/보완
        if (elem1.yongsin === elem2.yongsin) {
            score += 5;
            complementary.push('용신 일치');
        }

        // 두 사람 합쳐서 오행 균형 체크
        const combined = {};
        Object.keys(elem1.distribution).forEach(element => {
            combined[element] = elem1.distribution[element] + elem2.distribution[element];
        });
        const values = Object.values(combined);
        const avg = values.reduce((a, b) => a + b, 0) / 5;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / 5;
        const balanceScore = Math.max(0, 30 - variance * 3);
        score += balanceScore;

        return {
            score: Math.max(0, Math.min(100, score)),
            complementary,
            combinedBalance: Math.round(100 - variance * 10),
            summary: complementary.length > 0 ? '서로의 부족한 부분을 보완해줍니다' : '오행 보완이 크지 않습니다'
        };
    }

    /**
     * 십신 궁합 분석
     */
    function analyzeSipsinCompatibility(person1, person2) {
        let score = 50;
        const details = [];

        // 서로에게 어떤 십신인지 분석
        const sipsin1to2 = calculateSipsin(person1.saju.day, person2.saju.day);
        const sipsin2to1 = calculateSipsin(person2.saju.day, person1.saju.day);

        // 좋은 십신 관계
        const goodSipsin = ['정재', '정관', '정인', '식신'];
        if (goodSipsin.includes(sipsin1to2.cheongan)) {
            score += 15;
            details.push(`1→2: ${sipsin1to2.cheongan} (좋음)`);
        }
        if (goodSipsin.includes(sipsin2to1.cheongan)) {
            score += 15;
            details.push(`2→1: ${sipsin2to1.cheongan} (좋음)`);
        }

        // 주의 필요한 십신 관계
        const cautionSipsin = ['겁재', '상관', '편관'];
        if (cautionSipsin.includes(sipsin1to2.cheongan)) {
            score -= 10;
            details.push(`1→2: ${sipsin1to2.cheongan} (주의)`);
        }
        if (cautionSipsin.includes(sipsin2to1.cheongan)) {
            score -= 10;
            details.push(`2→1: ${sipsin2to1.cheongan} (주의)`);
        }

        return {
            score: Math.max(0, Math.min(100, score)),
            sipsin1to2,
            sipsin2to1,
            details,
            summary: `상대를 ${sipsin1to2.cheongan}으로 보고, 상대는 나를 ${sipsin2to1.cheongan}으로 봅니다`
        };
    }

    /**
     * 영역별 궁합 분석
     */
    function analyzeCategoryCompatibility(person1, person2) {
        return {
            personality: {
                name: '성격 궁합',
                score: analyzePersonalityCompatibility(person1, person2),
                description: '두 사람의 성격이 얼마나 조화로운지'
            },
            financial: {
                name: '재물 궁합',
                score: analyzeFinancialCompatibility(person1, person2),
                description: '경제적 가치관과 재물 관리 스타일'
            },
            family: {
                name: '가정 궁합',
                score: analyzeFamilyCompatibility(person1, person2),
                description: '가정을 이루고 유지하는 능력'
            },
            communication: {
                name: '소통 궁합',
                score: analyzeCommunicationCompatibility(person1, person2),
                description: '의사소통과 이해력'
            }
        };
    }

    function analyzePersonalityCompatibility(p1, p2) {
        const elem1 = p1.saju.day.cheongan.element;
        const elem2 = p2.saju.day.cheongan.element;

        // 같은 원소면 이해도 높음
        if (elem1 === elem2) return 75;

        // 상생이면 좋음
        const sangSaeng = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
        if (sangSaeng[elem1] === elem2 || sangSaeng[elem2] === elem1) return 80;

        // 상극이면 낮음
        const sangKeuk = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };
        if (sangKeuk[elem1] === elem2 || sangKeuk[elem2] === elem1) return 50;

        return 65;
    }

    function analyzeFinancialCompatibility(p1, p2) {
        // 재성(정재, 편재)의 강도로 판단
        let score = 60;

        ['year', 'month', 'hour'].forEach(pillar => {
            const s1 = p1.sipsin[pillar].cheongan;
            const s2 = p2.sipsin[pillar].cheongan;

            if (['정재', '편재'].includes(s1)) score += 5;
            if (['정재', '편재'].includes(s2)) score += 5;
        });

        return Math.min(100, score);
    }

    function analyzeFamilyCompatibility(p1, p2) {
        // 인성과 관성의 조화로 판단
        let score = 60;

        const hasBothInsung = ['정인', '편인'].some(s =>
            p1.sipsin.month.cheongan === s || p2.sipsin.month.cheongan === s
        );
        if (hasBothInsung) score += 15;

        // 충이 없으면 가점
        if (JIJI_CHUNG[p1.saju.day.jiji.name] !== p2.saju.day.jiji.name) {
            score += 10;
        }

        return Math.min(100, score);
    }

    function analyzeCommunicationCompatibility(p1, p2) {
        // 식신, 상관의 존재로 판단
        let score = 60;

        ['year', 'month', 'hour'].forEach(pillar => {
            if (['식신', '상관'].includes(p1.sipsin[pillar].cheongan)) score += 5;
            if (['식신', '상관'].includes(p2.sipsin[pillar].cheongan)) score += 5;
        });

        // 지지 합이 있으면 소통 원활
        const hapInfo = JIJI_YUKHAP[p1.saju.day.jiji.name];
        if (hapInfo && hapInfo.pair === p2.saju.day.jiji.name) {
            score += 15;
        }

        return Math.min(100, score);
    }

    /**
     * 좋은 점 수집
     */
    function collectGoodPoints(ilju, jiji, element) {
        const points = [];

        ilju.details.filter(d => d.good).forEach(d => points.push(d.desc));
        jiji.goodRelations.forEach(r => points.push(r));
        element.complementary.forEach(c => points.push(c));

        return points;
    }

    /**
     * 주의점 수집
     */
    function collectCautionPoints(ilju, jiji, element) {
        const points = [];

        ilju.details.filter(d => !d.good).forEach(d => points.push(d.desc));
        jiji.badRelations.forEach(r => points.push(r));

        return points;
    }

    /**
     * 궁합 조언 생성
     */
    function generateCompatibilityAdvice(ilju, jiji, element, totalScore) {
        const advice = [];

        if (totalScore >= 70) {
            advice.push('두 분은 천생연분에 가까운 좋은 궁합입니다.');
            advice.push('서로의 장점을 살려주고 부족한 부분을 채워줄 수 있습니다.');
        } else if (totalScore >= 55) {
            advice.push('무난한 궁합으로, 노력하면 좋은 관계를 유지할 수 있습니다.');
            advice.push('서로의 차이점을 인정하고 이해하려는 노력이 필요합니다.');
        } else {
            advice.push('서로 다른 점이 많아 이해와 노력이 필요합니다.');
            advice.push('충돌이 있을 수 있지만, 그것이 성장의 기회가 될 수 있습니다.');
        }

        // 구체적 조언
        if (jiji.badRelations.length > 0) {
            advice.push('지지 관계에 충이 있으니 급격한 결정은 피하세요.');
        }

        if (element.complementary.length > 0) {
            advice.push('서로의 부족한 오행을 보완해주어 균형잡힌 관계입니다.');
        }

        return advice;
    }

    /**
     * 궁합 종합 해석 생성
     */
    function generateCompatibilityInterpretation(totalScore, ilju, jiji) {
        let interpretation = '';

        if (totalScore >= 80) {
            interpretation = '두 분은 매우 좋은 궁합을 가지고 있습니다. 서로를 깊이 이해하고 보완해주는 관계가 될 수 있습니다. ';
        } else if (totalScore >= 65) {
            interpretation = '두 분은 좋은 궁합입니다. 서로의 장단점을 이해하고 존중한다면 행복한 관계를 유지할 수 있습니다. ';
        } else if (totalScore >= 50) {
            interpretation = '두 분의 궁합은 보통입니다. 서로 다른 점이 있지만, 이해와 배려로 충분히 극복할 수 있습니다. ';
        } else {
            interpretation = '두 분은 서로 다른 기운을 가지고 있어 이해가 필요합니다. 하지만 다름을 인정하고 노력한다면 오히려 서로를 성장시킬 수 있습니다. ';
        }

        if (ilju.score >= 70) {
            interpretation += '특히 일주 궁합이 좋아 기본적인 케미가 잘 맞습니다.';
        }

        if (jiji.goodRelations.length > jiji.badRelations.length) {
            interpretation += ' 지지 관계도 좋아 함께하는 시간이 즐거울 것입니다.';
        }

        return interpretation;
    }

    // ===== 종합 해석 (AI 스타일 내러티브) =====

    /**
     * 종합 사주 해석 생성 (내러티브 스타일)
     * @param {Object} sajuResult - 사주 분석 결과
     * @returns {Object} 종합 해석
     */
    function generateFullInterpretation(sajuResult) {
        const dayGan = sajuResult.saju.day.cheongan;
        const dayMasterInterp = DAY_MASTER_INTERPRETATION[dayGan.name] || {};
        const yongsin = sajuResult.elementAnalysis.yongsin;
        const gisin = sajuResult.elementAnalysis.gisin;

        // 1. 타고난 성격과 기질
        const personalityNarrative = generatePersonalityNarrative(dayGan, dayMasterInterp, sajuResult);

        // 2. 인생의 흐름과 운세
        const lifeFlowNarrative = generateLifeFlowNarrative(sajuResult);

        // 3. 재물운과 직업운
        const wealthCareerNarrative = generateWealthCareerNarrative(sajuResult);

        // 4. 대인관계와 인연
        const relationshipNarrative = generateRelationshipNarrative(sajuResult);

        // 5. 건강운
        const healthNarrative = generateHealthNarrative(sajuResult);

        // 6. 종합 조언
        const overallAdviceNarrative = generateOverallAdviceNarrative(sajuResult);

        // 7. 올해의 운세
        const yearlyNarrative = generateYearlyNarrative(sajuResult);

        return {
            title: `${dayGan.korean}(${dayGan.name})일간 사주 종합 해석`,
            subtitle: `${sajuResult.birthInfo.year}년 ${sajuResult.birthInfo.month}월 ${sajuResult.birthInfo.day}일 ${sajuResult.birthInfo.hour || '시간미상'}시 생`,
            sections: [
                {
                    id: 'personality',
                    title: '🌟 타고난 성격과 기질',
                    icon: '🌟',
                    content: personalityNarrative
                },
                {
                    id: 'lifeflow',
                    title: '🌊 인생의 흐름',
                    icon: '🌊',
                    content: lifeFlowNarrative
                },
                {
                    id: 'wealth',
                    title: '💰 재물운과 직업운',
                    icon: '💰',
                    content: wealthCareerNarrative
                },
                {
                    id: 'relationship',
                    title: '💕 대인관계와 인연',
                    icon: '💕',
                    content: relationshipNarrative
                },
                {
                    id: 'health',
                    title: '💪 건강운',
                    icon: '💪',
                    content: healthNarrative
                },
                {
                    id: 'yearly',
                    title: '📅 올해의 운세',
                    icon: '📅',
                    content: yearlyNarrative
                },
                {
                    id: 'advice',
                    title: '✨ 종합 조언',
                    icon: '✨',
                    content: overallAdviceNarrative
                }
            ],
            summary: generateOneSentenceSummary(sajuResult),
            luckyInfo: generateLuckyInfo(yongsin)
        };
    }

    /**
     * 성격 내러티브 생성
     */
    function generatePersonalityNarrative(dayGan, dayMasterInterp, sajuResult) {
        const elementTraits = {
            '木': '나무처럼 위로 뻗어나가려는 성장의 기운을 가지고 있습니다. 새로운 것을 시작하고 발전시키는 데 재능이 있으며, 정의감이 강합니다.',
            '火': '불처럼 뜨거운 열정과 밝은 에너지를 가지고 있습니다. 표현력이 뛰어나고 주변을 밝게 만드는 힘이 있습니다.',
            '土': '땅처럼 묵직하고 안정적인 기운을 가지고 있습니다. 신뢰감을 주며 중재자 역할을 잘 합니다.',
            '金': '쇠처럼 단단하고 결단력 있는 기운을 가지고 있습니다. 완벽을 추구하며 정리정돈을 잘 합니다.',
            '水': '물처럼 유연하고 지혜로운 기운을 가지고 있습니다. 상황에 맞게 적응하며 깊은 통찰력을 가집니다.'
        };

        let narrative = `당신은 **${dayGan.korean}(${dayGan.name})일간**으로, ${dayGan.elementKr}(${dayGan.element}) 오행에 속합니다.\n\n`;
        narrative += elementTraits[dayGan.element] + '\n\n';

        if (dayMasterInterp.personality) {
            narrative += dayMasterInterp.personality + '\n\n';
        }

        // 강점과 약점
        if (dayMasterInterp.strengths && dayMasterInterp.strengths.length > 0) {
            narrative += `**주요 강점:** ${dayMasterInterp.strengths.join(', ')}\n`;
        }
        if (dayMasterInterp.weaknesses && dayMasterInterp.weaknesses.length > 0) {
            narrative += `**주의할 점:** ${dayMasterInterp.weaknesses.join(', ')}\n`;
        }

        // 십신으로 성격 보완 분석
        const sipsinPersonality = analyzeSipsinPersonality(sajuResult.sipsin);
        if (sipsinPersonality) {
            narrative += '\n' + sipsinPersonality;
        }

        return narrative;
    }

    /**
     * 십신으로 성격 분석
     */
    function analyzeSipsinPersonality(sipsin) {
        const sipsinTraits = {
            '비견': '독립심이 강하고 자존심이 높습니다.',
            '겁재': '경쟁심이 강하고 승부욕이 있습니다.',
            '식신': '먹는 것을 좋아하고 표현력이 풍부합니다.',
            '상관': '창의적이고 기존 틀을 깨는 것을 좋아합니다.',
            '편재': '사업 수완이 있고 돈의 흐름을 읽습니다.',
            '정재': '꾸준하게 저축하고 안정을 추구합니다.',
            '편관': '리더십이 있고 권위를 추구합니다.',
            '정관': '규율을 중시하고 책임감이 강합니다.',
            '편인': '독특한 학문이나 예술에 관심이 있습니다.',
            '정인': '학문을 좋아하고 어머니와의 인연이 깊습니다.'
        };

        let traits = [];
        ['year', 'month', 'hour'].forEach(pillar => {
            const ganSipsin = sipsin[pillar].cheongan;
            if (sipsinTraits[ganSipsin] && !traits.includes(sipsinTraits[ganSipsin])) {
                traits.push(sipsinTraits[ganSipsin]);
            }
        });

        if (traits.length > 0) {
            return '사주 구성상 ' + traits.slice(0, 2).join(' 또한 ');
        }
        return '';
    }

    /**
     * 인생 흐름 내러티브
     */
    function generateLifeFlowNarrative(sajuResult) {
        let narrative = '';

        // 12신살 기반 분석
        const sinsal = sajuResult.sinsal12;
        const goodCount = sinsal.goodSinsal.length;
        const badCount = sinsal.badSinsal.length;

        if (goodCount > badCount) {
            narrative += '전반적으로 **순탄한 인생 흐름**을 타고났습니다. 길신이 많아 어려움이 와도 잘 극복할 수 있는 힘이 있습니다.\n\n';
        } else if (badCount > goodCount) {
            narrative += '인생에서 **도전과 시련**이 있을 수 있지만, 이를 통해 더 강해지고 성장합니다. 어려움을 기회로 바꾸는 지혜가 필요합니다.\n\n';
        } else {
            narrative += '인생에 **좋은 일과 어려운 일이 균형**있게 찾아옵니다. 균형 잡힌 시각으로 삶을 바라보세요.\n\n';
        }

        // 대운 분석
        if (sajuResult.daeun && sajuResult.daeun.length > 0) {
            const currentYear = new Date().getFullYear();
            const currentDaeun = sajuResult.daeun.find(d =>
                currentYear >= d.startYear && currentYear <= d.endYear
            );

            if (currentDaeun) {
                narrative += `**현재 대운:** ${currentDaeun.pillar.korean}(${currentDaeun.pillar.name}) 대운 (${currentDaeun.startYear}~${currentDaeun.endYear}년)\n`;
                narrative += `이 시기는 ${currentDaeun.pillar.cheongan.elementKr} 기운이 강해지는 시기입니다.\n\n`;
            }
        }

        // 합/충 관계 분석
        const relations = sajuResult.relations;
        if (relations.samhap.length > 0 || relations.yukhap.length > 0) {
            narrative += '사주에 **합(合)**이 있어 주변 사람들과 조화롭게 지내며, 협력을 통해 좋은 결과를 얻을 수 있습니다.\n';
        }
        if (relations.chung.length > 0) {
            narrative += '사주에 **충(沖)**이 있어 변화가 많고 이동수가 있습니다. 변화를 두려워하지 말고 새로운 기회로 삼으세요.\n';
        }

        return narrative;
    }

    /**
     * 재물운/직업운 내러티브
     */
    function generateWealthCareerNarrative(sajuResult) {
        let narrative = '';
        const sipsin = sajuResult.sipsin;

        // 재성 분석
        let hasJaeSung = false;
        let hasGwanSung = false;
        let hasSikSang = false;

        ['year', 'month', 'hour'].forEach(pillar => {
            const gan = sipsin[pillar].cheongan;
            const ji = sipsin[pillar].jiji;

            if (['정재', '편재'].includes(gan) || ['정재', '편재'].includes(ji)) hasJaeSung = true;
            if (['정관', '편관'].includes(gan) || ['정관', '편관'].includes(ji)) hasGwanSung = true;
            if (['식신', '상관'].includes(gan) || ['식신', '상관'].includes(ji)) hasSikSang = true;
        });

        if (hasJaeSung) {
            narrative += '**재성(財星)**이 있어 재물을 다루는 능력이 있습니다. 돈의 흐름을 잘 읽고 재테크에 관심을 가지면 좋습니다.\n\n';
        } else {
            narrative += '재성이 약하므로 **꾸준한 저축과 안정적인 수입**에 집중하는 것이 좋습니다. 투기보다는 실력으로 승부하세요.\n\n';
        }

        if (hasGwanSung) {
            narrative += '**관성(官星)**이 있어 조직 생활에 적합하고 승진운이 있습니다. 공무원, 대기업, 전문직이 잘 맞습니다.\n';
        }

        if (hasSikSang) {
            narrative += '**식상(食傷)**이 있어 창의력과 표현력이 뛰어납니다. 예술, 요식업, 교육, 프리랜서가 잘 맞습니다.\n';
        }

        // 용신 기반 직업 추천
        const careerByYongsin = {
            '木': '교육, 의류, 출판, 가구, 인테리어, 환경 관련 분야',
            '火': 'IT, 엔터테인먼트, 광고, 미용, 요식업, 에너지 분야',
            '土': '부동산, 건설, 농업, 중개업, 보험, 공무원',
            '金': '금융, 자동차, 기계, 법률, 의료기기, 귀금속',
            '水': '무역, 물류, 여행, 수산업, 음료, 컨설팅'
        };

        const yongsin = sajuResult.elementAnalysis.yongsin;
        if (careerByYongsin[yongsin]) {
            narrative += `\n**추천 직업군:** ${careerByYongsin[yongsin]}`;
        }

        return narrative;
    }

    /**
     * 대인관계 내러티브
     */
    function generateRelationshipNarrative(sajuResult) {
        let narrative = '';
        const sipsin = sajuResult.sipsin;
        const dayGan = sajuResult.saju.day.cheongan;
        const gender = sajuResult.birthInfo.gender;

        // 비겁 분석 (형제/친구)
        let hasBiGyup = false;
        ['year', 'month', 'hour'].forEach(pillar => {
            if (['비견', '겁재'].includes(sipsin[pillar].cheongan)) hasBiGyup = true;
        });

        if (hasBiGyup) {
            narrative += '**비겁(比劫)**이 있어 형제나 친구와의 인연이 깊습니다. 경쟁 관계가 될 수도 있지만, 좋은 동지가 될 수도 있습니다.\n\n';
        }

        // 배우자 분석
        if (gender === 'male') {
            let hasJaeSungForSpouse = false;
            ['year', 'month', 'hour'].forEach(pillar => {
                if (['정재', '편재'].includes(sipsin[pillar].cheongan)) hasJaeSungForSpouse = true;
            });
            if (hasJaeSungForSpouse) {
                narrative += '남성의 경우 **재성**이 배우자를 나타내며, 사주에 재성이 있어 배우자 인연이 있습니다.\n';
            }
        } else {
            let hasGwanSungForSpouse = false;
            ['year', 'month', 'hour'].forEach(pillar => {
                if (['정관', '편관'].includes(sipsin[pillar].cheongan)) hasGwanSungForSpouse = true;
            });
            if (hasGwanSungForSpouse) {
                narrative += '여성의 경우 **관성**이 배우자를 나타내며, 사주에 관성이 있어 배우자 인연이 있습니다.\n';
            }
        }

        // 인성 분석 (부모/스승)
        let hasInSung = false;
        ['year', 'month', 'hour'].forEach(pillar => {
            if (['정인', '편인'].includes(sipsin[pillar].cheongan)) hasInSung = true;
        });

        if (hasInSung) {
            narrative += '\n**인성(印星)**이 있어 부모님이나 스승의 도움을 받을 수 있습니다. 학문적 성취도 기대됩니다.\n';
        }

        // 관계 조언
        const relations = sajuResult.relations;
        if (relations.yukhap.length > 0) {
            narrative += '\n육합이 있어 **이성 인연**이 좋고 사람들과 잘 어울립니다.';
        }

        return narrative || '대인관계는 균형 잡힌 편입니다. 진심을 다해 사람을 대하면 좋은 인연이 찾아옵니다.';
    }

    /**
     * 건강운 내러티브
     */
    function generateHealthNarrative(sajuResult) {
        const elementAnalysis = sajuResult.elementAnalysis;
        const weakest = elementAnalysis.weakest;

        const healthByElement = {
            '木': { organs: '간, 담, 눈, 근육', advice: '눈의 피로를 풀고 간 건강에 신경 쓰세요. 녹색 채소를 많이 섭취하세요.' },
            '火': { organs: '심장, 소장, 혀, 혈관', advice: '심장과 혈액순환에 주의하세요. 과로와 스트레스를 피하세요.' },
            '土': { organs: '위, 비장, 입, 근육', advice: '소화기 건강에 신경 쓰세요. 규칙적인 식사가 중요합니다.' },
            '金': { organs: '폐, 대장, 코, 피부', advice: '호흡기와 피부 건강에 주의하세요. 깨끗한 공기가 중요합니다.' },
            '水': { organs: '신장, 방광, 귀, 뼈', advice: '신장과 허리 건강에 신경 쓰세요. 수분 섭취가 중요합니다.' }
        };

        let narrative = '';

        // 약한 오행 기반 건강 조언
        if (weakest && healthByElement[weakest.element]) {
            const healthInfo = healthByElement[weakest.element];
            narrative += `**약한 오행(${weakest.element})** 기준 주의할 장기: ${healthInfo.organs}\n\n`;
            narrative += `💡 **건강 조언:** ${healthInfo.advice}\n`;
        }

        // 균형도 기반 조언
        const values = Object.values(elementAnalysis.distribution);
        const avg = values.reduce((a, b) => a + b, 0) / 5;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / 5;

        if (variance > 3) {
            narrative += '\n오행의 불균형이 있으므로 **균형 잡힌 생활 습관**이 특히 중요합니다.';
        } else {
            narrative += '\n오행이 비교적 균형 잡혀 **기본 체력은 좋은 편**입니다.';
        }

        return narrative;
    }

    /**
     * 올해 운세 내러티브
     */
    function generateYearlyNarrative(sajuResult) {
        const fortune = sajuResult.yearlyFortune;
        if (!fortune) return '올해 운세 정보를 계산 중입니다.';

        let narrative = `**${fortune.year}년은 ${fortune.pillar.korean}(${fortune.pillar.name})년**입니다.\n\n`;

        narrative += `올해의 십신: 천간 **${fortune.sipsin.cheongan}**, 지지 **${fortune.sipsin.jiji}**\n\n`;

        // 십신 해석
        if (SIPSIN_INTERPRETATION[fortune.sipsin.cheongan]) {
            narrative += SIPSIN_INTERPRETATION[fortune.sipsin.cheongan].influence + '\n\n';
        }

        // 신살 해석
        if (fortune.sinsal) {
            const sinsalGood = fortune.sinsal.good;
            narrative += `12운성: **${fortune.sinsal.name}** - ${fortune.sinsal.desc}\n`;
            if (sinsalGood) {
                narrative += '→ 긍정적인 기운이 함께합니다.\n';
            } else {
                narrative += '→ 신중하게 행동하는 것이 좋습니다.\n';
            }
        }

        // 충 여부
        if (fortune.hasChung) {
            narrative += '\n⚠️ 올해 사주와 **충**이 있어 변화가 많을 수 있습니다. 이사, 이직, 여행 등의 이동수가 있습니다.';
        }

        return narrative;
    }

    /**
     * 종합 조언 내러티브
     */
    function generateOverallAdviceNarrative(sajuResult) {
        const yongsin = sajuResult.elementAnalysis.yongsin;
        const dayMasterInterp = DAY_MASTER_INTERPRETATION[sajuResult.saju.day.cheongan.name] || {};

        let narrative = '';

        // 용신 활용법
        const yongsinAdvice = {
            '木': {
                direction: '동쪽',
                color: '녹색, 청색',
                number: '3, 8',
                season: '봄',
                food: '신맛 나는 음식, 녹색 채소',
                activity: '등산, 산책, 원예 활동'
            },
            '火': {
                direction: '남쪽',
                color: '빨간색, 보라색',
                number: '2, 7',
                season: '여름',
                food: '쓴맛 나는 음식, 빨간 과일',
                activity: '운동, 명상, 열정적인 취미'
            },
            '土': {
                direction: '중앙',
                color: '노란색, 갈색',
                number: '5, 10',
                season: '환절기',
                food: '단맛 나는 음식, 곡물',
                activity: '정원 가꾸기, 요리, 안정적인 취미'
            },
            '金': {
                direction: '서쪽',
                color: '흰색, 금색',
                number: '4, 9',
                season: '가을',
                food: '매운맛 나는 음식, 흰색 채소',
                activity: '음악, 정리정돈, 수집 취미'
            },
            '水': {
                direction: '북쪽',
                color: '검정색, 파란색',
                number: '1, 6',
                season: '겨울',
                food: '짠맛 나는 음식, 해산물',
                activity: '수영, 독서, 지적 활동'
            }
        };

        if (yongsinAdvice[yongsin]) {
            const advice = yongsinAdvice[yongsin];
            narrative += `**용신(${yongsin}) 활용법**\n`;
            narrative += `• 행운의 방향: ${advice.direction}\n`;
            narrative += `• 행운의 색상: ${advice.color}\n`;
            narrative += `• 행운의 숫자: ${advice.number}\n`;
            narrative += `• 좋은 계절: ${advice.season}\n`;
            narrative += `• 추천 음식: ${advice.food}\n`;
            narrative += `• 추천 활동: ${advice.activity}\n\n`;
        }

        // 일간 조언
        if (dayMasterInterp.advice) {
            narrative += `**성격 보완 조언**\n${dayMasterInterp.advice}\n\n`;
        }

        // 마무리 조언
        narrative += `**명심할 점**\n`;
        narrative += '사주는 타고난 기질과 흐름을 보여주지만, 운명은 노력으로 바꿀 수 있습니다. ';
        narrative += '용신을 활용하고 약점을 보완하면 더 나은 삶을 만들 수 있습니다.';

        return narrative;
    }

    /**
     * 한 문장 요약
     */
    function generateOneSentenceSummary(sajuResult) {
        const dayGan = sajuResult.saju.day.cheongan;
        const score = sajuResult.overallScore;
        const yongsin = sajuResult.elementAnalysis.yongsin;

        const elementChar = {
            '木': '성장하는', '火': '열정적인', '土': '안정적인', '金': '결단력 있는', '水': '지혜로운'
        };

        return `${elementChar[dayGan.element]} ${dayGan.elementKr} 기운의 ${dayGan.korean}일간으로, ` +
               `${yongsin} 오행을 보충하면 ${score.grade}등급(${score.score}점)의 운을 더욱 발휘할 수 있습니다.`;
    }

    /**
     * 행운 정보 생성
     */
    function generateLuckyInfo(yongsin) {
        const luckyData = {
            '木': { colors: ['녹색', '청색'], numbers: [3, 8], direction: '동쪽', element: '나무, 식물' },
            '火': { colors: ['빨간색', '보라색'], numbers: [2, 7], direction: '남쪽', element: '불, 빛' },
            '土': { colors: ['노란색', '갈색'], numbers: [5, 10], direction: '중앙', element: '흙, 도자기' },
            '金': { colors: ['흰색', '금색'], numbers: [4, 9], direction: '서쪽', element: '금속, 보석' },
            '水': { colors: ['검정색', '파란색'], numbers: [1, 6], direction: '북쪽', element: '물, 유리' }
        };

        return luckyData[yongsin] || luckyData['土'];
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

        // Phase 1: 상세 해석
        generateDetailedInterpretation,
        generateFullInterpretation,

        // Phase 2: 테마별 운세
        calculateThemedFortune,
        calculateAllThemedFortunes,

        // Phase 3: 기간별 운세
        calculateDailyFortune,
        calculateMonthlyFortune,

        // Phase 4: 궁합 분석
        analyzeCompatibility,

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
        JIJI_CHUNG,
        DAY_MASTER_INTERPRETATION,
        SIPSIN_INTERPRETATION,
        THEMED_FORTUNE_MAP
    };
})();

// ES Module export (Node.js 환경용)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SajuCalculator;
}
