/**
 * Astro-Synthesis AI 관상 분석 모듈 v1.0
 * MediaPipe Face Mesh 기반 468개 랜드마크 분석
 * 전통 관상학 12궁 이론 적용
 */

const PhysiognomyAnalyzer = (function() {
    'use strict';

    // ===== 관상학 12궁 (Twelve Palaces) =====
    const TWELVE_PALACES = {
        명궁: {
            name: '명궁 (命宮)',
            location: '미간 (양 눈썹 사이)',
            meaning: '전체적인 운명, 성격, 의지력',
            landmarks: [9, 10, 151, 108, 69], // 미간 중심부
            interpretation: {
                wide: '넓은 도량, 관대한 성격, 큰 뜻을 품음',
                narrow: '집중력이 강하고 꼼꼼함, 때로 걱정이 많음',
                smooth: '평탄한 인생 흐름, 좋은 운세',
                wrinkled: '고난을 통한 성장, 노력형 인생'
            }
        },
        재백궁: {
            name: '재백궁 (財帛宮)',
            location: '코 (특히 콧대와 코끝)',
            meaning: '재물운, 경제적 능력',
            landmarks: [1, 2, 4, 5, 195, 197], // 코 영역
            interpretation: {
                high: '재물을 모으는 능력이 뛰어남',
                wide: '씀씀이가 크나 돈이 잘 들어옴',
                pointed: '사업 수완이 좋음, 투자 감각',
                round: '안정적인 재물운, 저축형'
            }
        },
        형제궁: {
            name: '형제궁 (兄弟宮)',
            location: '눈썹',
            meaning: '형제/자매 관계, 친구운',
            landmarks: [70, 63, 105, 66, 107, 336, 296, 334, 293, 300], // 눈썹
            interpretation: {
                thick: '의리가 있고 사교성이 좋음',
                thin: '독립적이고 자기주도적',
                long: '넓은 인맥, 귀인의 도움',
                short: '가까운 사람과 깊은 관계'
            }
        },
        전택궁: {
            name: '전택궁 (田宅宮)',
            location: '눈꺼풀 (상안검)',
            meaning: '부동산운, 가정환경',
            landmarks: [157, 158, 159, 160, 161, 384, 385, 386, 387, 388], // 상안검
            interpretation: {
                wide: '부동산 복이 있음, 안정적 주거',
                narrow: '이동이 많은 삶, 유연한 거주',
                smooth: '가정 화목, 편안한 환경',
                puffy: '재물이 모이나 관리 필요'
            }
        },
        남녀궁: {
            name: '남녀궁 (男女宮)',
            location: '눈 아래 (와잠)',
            meaning: '자녀운, 이성운',
            landmarks: [111, 117, 118, 119, 120, 340, 346, 347, 348, 349], // 하안검/눈 밑
            interpretation: {
                full: '자녀복이 있음, 이성에게 인기',
                flat: '자녀와 깊은 유대, 진실된 관계',
                dark: '건강 관리 필요, 휴식 권장',
                bright: '활발한 이성운, 매력적'
            }
        },
        노복궁: {
            name: '노복궁 (奴僕宮)',
            location: '턱 양옆 (협)',
            meaning: '부하/조력자운, 말년운',
            landmarks: [177, 147, 187, 207, 401, 376, 411, 427], // 볼/턱 옆
            interpretation: {
                full: '좋은 협조자를 만남, 리더십',
                thin: '독립적 업무 스타일',
                round: '원만한 대인관계',
                angular: '카리스마, 강한 추진력'
            }
        },
        처첩궁: {
            name: '처첩궁 (妻妾宮)',
            location: '눈꼬리 (어미)',
            meaning: '배우자운, 결혼운',
            landmarks: [33, 133, 173, 263, 362, 398], // 눈꼬리
            interpretation: {
                upward: '좋은 배우자 인연, 행복한 결혼',
                downward: '배우자에게 헌신적',
                clear: '명확한 이성관, 좋은 인연',
                wrinkled: '다양한 경험을 통한 성숙'
            }
        },
        질액궁: {
            name: '질액궁 (疾厄宮)',
            location: '산근 (코와 눈 사이)',
            meaning: '건강운, 질병 관련',
            landmarks: [6, 168, 197, 195, 5], // 미간~코 시작
            interpretation: {
                high: '건강 체질, 회복력 좋음',
                low: '건강 관리에 신경 써야 함',
                wide: '정신적 건강 양호',
                narrow: '스트레스 관리 필요'
            }
        },
        천이궁: {
            name: '천이궁 (遷移宮)',
            location: '이마 양쪽 (천창)',
            meaning: '여행운, 이동운, 해외운',
            landmarks: [54, 103, 67, 109, 284, 332, 297, 338], // 이마 양옆
            interpretation: {
                full: '여행운 좋음, 해외 인연',
                flat: '안정적 정착, 내실 다지기',
                wide: '넓은 활동 범위',
                prominent: '사회적 진출 유리'
            }
        },
        관록궁: {
            name: '관록궁 (官祿宮)',
            location: '이마 중앙',
            meaning: '직업운, 사회적 성취',
            landmarks: [10, 151, 9, 8, 107, 336, 296, 69], // 이마 중앙
            interpretation: {
                high: '출세운 강함, 리더 자질',
                wide: '다양한 분야에서 성공',
                smooth: '순탄한 직장 생활',
                prominent: '권위와 명예 획득'
            }
        },
        복덕궁: {
            name: '복덕궁 (福德宮)',
            location: '이마 양쪽 위 (천창 위)',
            meaning: '타고난 복, 조상 음덕',
            landmarks: [21, 54, 103, 251, 284, 332], // 이마 상단 양옆
            interpretation: {
                full: '선천적 복이 있음, 귀인운',
                round: '복이 들어오는 상',
                flat: '자수성가형, 노력으로 복 창조',
                wide: '넓은 복덕, 여유로운 삶'
            }
        },
        부모궁: {
            name: '부모궁 (父母宮)',
            location: '이마 중앙 상단 (일각/월각)',
            meaning: '부모운, 윗사람 관계',
            landmarks: [10, 67, 69, 104, 108, 151, 297, 299, 333, 337], // 이마 상단 중앙
            interpretation: {
                prominent: '부모 덕이 있음, 윗사람 도움',
                smooth: '원만한 가정환경 출신',
                balanced: '균형 잡힌 부모 관계',
                high: '좋은 가문, 교육 환경'
            }
        }
    };

    // ===== 얼굴 비율 기준 =====
    const FACE_RATIOS = {
        // 삼정 (三停) - 얼굴을 세 부분으로 나눔
        upperThird: { name: '상정', meaning: '초년운 (이마)', ideal: 0.33 },
        middleThird: { name: '중정', meaning: '중년운 (눈~코)', ideal: 0.33 },
        lowerThird: { name: '하정', meaning: '말년운 (코~턱)', ideal: 0.33 },

        // 오악 (五嶽) - 다섯 산
        foreheadHeight: { name: '이마 높이', ideal: 0.3 },
        noseLength: { name: '코 길이', ideal: 0.33 },
        chinLength: { name: '턱 길이', ideal: 0.2 }
    };

    // ===== 관상 해석 데이터 =====
    const FEATURE_INTERPRETATIONS = {
        forehead: {
            high: { score: 85, meaning: '지혜롭고 사려 깊음, 학문적 성취 가능' },
            medium: { score: 70, meaning: '균형 잡힌 사고력, 실용적 지혜' },
            low: { score: 55, meaning: '행동력이 앞서는 타입, 실천가' }
        },
        eyebrows: {
            thick: { score: 80, meaning: '의지가 강하고 결단력 있음' },
            thin: { score: 65, meaning: '섬세하고 예술적 감각' },
            curved: { score: 75, meaning: '온화하고 사교적' },
            straight: { score: 70, meaning: '논리적이고 정직함' }
        },
        eyes: {
            large: { score: 80, meaning: '표현력이 풍부하고 감성적' },
            small: { score: 70, meaning: '관찰력이 뛰어나고 신중함' },
            wide_set: { score: 75, meaning: '포용력이 크고 대범함' },
            close_set: { score: 65, meaning: '집중력이 강하고 목표지향적' }
        },
        nose: {
            high: { score: 85, meaning: '자존심이 강하고 성취욕 높음' },
            wide: { score: 75, meaning: '재물운 좋고 안정적' },
            pointed: { score: 70, meaning: '예리하고 분석적' },
            round: { score: 80, meaning: '원만하고 복이 있음' }
        },
        mouth: {
            large: { score: 75, meaning: '적극적이고 사교적' },
            small: { score: 70, meaning: '신중하고 조심스러움' },
            thick_lips: { score: 80, meaning: '정이 많고 관대함' },
            thin_lips: { score: 65, meaning: '이성적이고 냉철함' }
        },
        chin: {
            prominent: { score: 80, meaning: '의지력이 강하고 끈기 있음' },
            rounded: { score: 75, meaning: '유연하고 적응력 좋음' },
            pointed: { score: 65, meaning: '섬세하고 예민함' },
            square: { score: 85, meaning: '리더십과 추진력' }
        },
        face_shape: {
            oval: { score: 85, meaning: '균형 잡힌 성격, 다재다능' },
            round: { score: 80, meaning: '친화력 좋고 낙천적' },
            square: { score: 75, meaning: '실용적이고 신뢰감 있음' },
            long: { score: 70, meaning: '사려 깊고 품위 있음' },
            heart: { score: 75, meaning: '창의적이고 이상적' }
        }
    };

    // ===== MediaPipe 초기화 =====
    let faceMesh = null;
    let isInitialized = false;

    /**
     * MediaPipe Face Mesh 초기화
     */
    async function initialize() {
        if (isInitialized) return true;

        try {
            // MediaPipe Face Mesh 로드 확인
            if (typeof FaceMesh === 'undefined') {
                console.error('MediaPipe Face Mesh가 로드되지 않았습니다.');
                return false;
            }

            faceMesh = new FaceMesh({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
                }
            });

            faceMesh.setOptions({
                maxNumFaces: 1,
                refineLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            isInitialized = true;
            console.log('MediaPipe Face Mesh 초기화 완료');
            return true;
        } catch (error) {
            console.error('MediaPipe 초기화 오류:', error);
            return false;
        }
    }

    /**
     * 이미지에서 얼굴 랜드마크 추출
     */
    async function extractLandmarks(imageElement) {
        return new Promise((resolve, reject) => {
            if (!faceMesh) {
                reject(new Error('Face Mesh가 초기화되지 않았습니다.'));
                return;
            }

            faceMesh.onResults((results) => {
                if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                    resolve(results.multiFaceLandmarks[0]);
                } else {
                    reject(new Error('얼굴을 감지하지 못했습니다.'));
                }
            });

            faceMesh.send({ image: imageElement });
        });
    }

    /**
     * 두 랜드마크 사이 거리 계산
     */
    function calculateDistance(landmarks, idx1, idx2) {
        const p1 = landmarks[idx1];
        const p2 = landmarks[idx2];
        return Math.sqrt(
            Math.pow(p2.x - p1.x, 2) +
            Math.pow(p2.y - p1.y, 2) +
            Math.pow((p2.z || 0) - (p1.z || 0), 2)
        );
    }

    /**
     * 얼굴 측정값 계산
     */
    function calculateMeasurements(landmarks) {
        const measurements = {};

        // 얼굴 전체 높이 (이마 상단 ~ 턱 끝)
        measurements.faceHeight = calculateDistance(landmarks, 10, 152);

        // 얼굴 너비 (양 광대)
        measurements.faceWidth = calculateDistance(landmarks, 234, 454);

        // 이마 높이 (헤어라인 ~ 눈썹)
        measurements.foreheadHeight = calculateDistance(landmarks, 10, 9);

        // 눈 사이 거리
        measurements.eyeDistance = calculateDistance(landmarks, 133, 362);

        // 눈 너비 (한쪽 눈)
        measurements.eyeWidth = calculateDistance(landmarks, 33, 133);

        // 코 길이
        measurements.noseLength = calculateDistance(landmarks, 6, 4);

        // 코 너비
        measurements.noseWidth = calculateDistance(landmarks, 48, 278);

        // 입 너비
        measurements.mouthWidth = calculateDistance(landmarks, 61, 291);

        // 입술 두께
        measurements.lipThickness = calculateDistance(landmarks, 0, 17);

        // 턱 너비
        measurements.jawWidth = calculateDistance(landmarks, 172, 397);

        // 턱 길이 (코 끝 ~ 턱 끝)
        measurements.chinLength = calculateDistance(landmarks, 4, 152);

        // 눈썹 길이
        measurements.eyebrowLength = calculateDistance(landmarks, 70, 105);

        // 삼정 비율 계산
        measurements.upperThird = measurements.foreheadHeight / measurements.faceHeight;
        measurements.middleThird = measurements.noseLength / measurements.faceHeight;
        measurements.lowerThird = measurements.chinLength / measurements.faceHeight;

        return measurements;
    }

    /**
     * 얼굴형 분석
     */
    function analyzeFaceShape(measurements) {
        const ratio = measurements.faceWidth / measurements.faceHeight;

        if (ratio > 0.85) {
            return { shape: 'round', korean: '원형', ...FEATURE_INTERPRETATIONS.face_shape.round };
        } else if (ratio > 0.75) {
            if (measurements.jawWidth / measurements.faceWidth > 0.7) {
                return { shape: 'square', korean: '각형', ...FEATURE_INTERPRETATIONS.face_shape.square };
            }
            return { shape: 'oval', korean: '계란형', ...FEATURE_INTERPRETATIONS.face_shape.oval };
        } else if (ratio > 0.65) {
            return { shape: 'long', korean: '장형', ...FEATURE_INTERPRETATIONS.face_shape.long };
        } else {
            return { shape: 'heart', korean: '역삼각형', ...FEATURE_INTERPRETATIONS.face_shape.heart };
        }
    }

    /**
     * 이마 분석
     */
    function analyzeForehead(measurements) {
        const ratio = measurements.foreheadHeight / measurements.faceHeight;

        if (ratio > 0.35) {
            return { type: 'high', korean: '높은 이마', ...FEATURE_INTERPRETATIONS.forehead.high };
        } else if (ratio > 0.28) {
            return { type: 'medium', korean: '보통 이마', ...FEATURE_INTERPRETATIONS.forehead.medium };
        } else {
            return { type: 'low', korean: '낮은 이마', ...FEATURE_INTERPRETATIONS.forehead.low };
        }
    }

    /**
     * 눈 분석
     */
    function analyzeEyes(measurements) {
        const eyeRatio = measurements.eyeDistance / measurements.faceWidth;
        const eyeSizeRatio = measurements.eyeWidth / measurements.faceWidth;

        let sizeType, positionType;

        if (eyeSizeRatio > 0.12) {
            sizeType = { type: 'large', korean: '큰 눈', ...FEATURE_INTERPRETATIONS.eyes.large };
        } else {
            sizeType = { type: 'small', korean: '작은 눈', ...FEATURE_INTERPRETATIONS.eyes.small };
        }

        if (eyeRatio > 0.35) {
            positionType = { type: 'wide_set', korean: '눈 사이 넓음', ...FEATURE_INTERPRETATIONS.eyes.wide_set };
        } else {
            positionType = { type: 'close_set', korean: '눈 사이 좁음', ...FEATURE_INTERPRETATIONS.eyes.close_set };
        }

        return {
            size: sizeType,
            position: positionType,
            combinedScore: Math.round((sizeType.score + positionType.score) / 2)
        };
    }

    /**
     * 코 분석
     */
    function analyzeNose(measurements) {
        const lengthRatio = measurements.noseLength / measurements.faceHeight;
        const widthRatio = measurements.noseWidth / measurements.faceWidth;

        let heightType, widthType;

        if (lengthRatio > 0.32) {
            heightType = { type: 'high', korean: '오똑한 코', ...FEATURE_INTERPRETATIONS.nose.high };
        } else {
            heightType = { type: 'average', korean: '보통 코', score: 70, meaning: '균형 잡힌 재물운' };
        }

        if (widthRatio > 0.22) {
            widthType = { type: 'wide', korean: '넓은 코', ...FEATURE_INTERPRETATIONS.nose.wide };
        } else {
            widthType = { type: 'narrow', korean: '좁은 코', ...FEATURE_INTERPRETATIONS.nose.pointed };
        }

        return {
            height: heightType,
            width: widthType,
            combinedScore: Math.round((heightType.score + widthType.score) / 2)
        };
    }

    /**
     * 입 분석
     */
    function analyzeMouth(measurements) {
        const widthRatio = measurements.mouthWidth / measurements.faceWidth;
        const thicknessRatio = measurements.lipThickness / measurements.faceHeight;

        let sizeType, lipType;

        if (widthRatio > 0.4) {
            sizeType = { type: 'large', korean: '큰 입', ...FEATURE_INTERPRETATIONS.mouth.large };
        } else {
            sizeType = { type: 'small', korean: '작은 입', ...FEATURE_INTERPRETATIONS.mouth.small };
        }

        if (thicknessRatio > 0.05) {
            lipType = { type: 'thick', korean: '두꺼운 입술', ...FEATURE_INTERPRETATIONS.mouth.thick_lips };
        } else {
            lipType = { type: 'thin', korean: '얇은 입술', ...FEATURE_INTERPRETATIONS.mouth.thin_lips };
        }

        return {
            size: sizeType,
            lips: lipType,
            combinedScore: Math.round((sizeType.score + lipType.score) / 2)
        };
    }

    /**
     * 턱 분석
     */
    function analyzeChin(measurements) {
        const lengthRatio = measurements.chinLength / measurements.faceHeight;
        const widthRatio = measurements.jawWidth / measurements.faceWidth;

        if (widthRatio > 0.75) {
            return { type: 'square', korean: '각진 턱', ...FEATURE_INTERPRETATIONS.chin.square };
        } else if (lengthRatio > 0.22) {
            return { type: 'prominent', korean: '돌출된 턱', ...FEATURE_INTERPRETATIONS.chin.prominent };
        } else if (widthRatio < 0.6) {
            return { type: 'pointed', korean: 'V라인 턱', ...FEATURE_INTERPRETATIONS.chin.pointed };
        } else {
            return { type: 'rounded', korean: '둥근 턱', ...FEATURE_INTERPRETATIONS.chin.rounded };
        }
    }

    /**
     * 삼정 분석 (초년/중년/말년운)
     */
    function analyzeThreeZones(measurements) {
        const zones = {
            upper: {
                name: '상정 (초년운)',
                ratio: measurements.upperThird,
                ideal: 0.33,
                interpretation: ''
            },
            middle: {
                name: '중정 (중년운)',
                ratio: measurements.middleThird,
                ideal: 0.33,
                interpretation: ''
            },
            lower: {
                name: '하정 (말년운)',
                ratio: measurements.lowerThird,
                ideal: 0.33,
                interpretation: ''
            }
        };

        // 해석 추가
        if (zones.upper.ratio > 0.36) {
            zones.upper.interpretation = '초년운이 강함, 어린 시절 좋은 환경';
            zones.upper.score = 85;
        } else if (zones.upper.ratio < 0.28) {
            zones.upper.interpretation = '자수성가형, 노력으로 성취';
            zones.upper.score = 65;
        } else {
            zones.upper.interpretation = '균형 잡힌 초년 운세';
            zones.upper.score = 75;
        }

        if (zones.middle.ratio > 0.36) {
            zones.middle.interpretation = '중년운이 강함, 30-50대 전성기';
            zones.middle.score = 85;
        } else if (zones.middle.ratio < 0.28) {
            zones.middle.interpretation = '중년기 노력 필요, 인내가 미덕';
            zones.middle.score = 65;
        } else {
            zones.middle.interpretation = '균형 잡힌 중년 운세';
            zones.middle.score = 75;
        }

        if (zones.lower.ratio > 0.36) {
            zones.lower.interpretation = '말년운이 강함, 노후 안정';
            zones.lower.score = 85;
        } else if (zones.lower.ratio < 0.28) {
            zones.lower.interpretation = '말년 건강관리 중요';
            zones.lower.score = 65;
        } else {
            zones.lower.interpretation = '균형 잡힌 말년 운세';
            zones.lower.score = 75;
        }

        return zones;
    }

    /**
     * 12궁 분석
     */
    function analyzeTwelvePalaces(landmarks, measurements) {
        const palaceResults = {};

        // 각 궁별로 간략화된 분석 (실제로는 랜드마크 기반 상세 분석 필요)
        Object.entries(TWELVE_PALACES).forEach(([key, palace]) => {
            // 해당 궁의 평균 위치 계산
            let avgY = 0;
            let count = 0;
            palace.landmarks.forEach(idx => {
                if (landmarks[idx]) {
                    avgY += landmarks[idx].y;
                    count++;
                }
            });
            avgY = avgY / count;

            // 위치 기반 간략 해석
            let score = 70;
            let interpretation = '';

            if (avgY < 0.3) {
                score = 80;
                interpretation = palace.interpretation.wide || palace.interpretation.high || '긍정적인 기운';
            } else if (avgY > 0.7) {
                score = 65;
                interpretation = palace.interpretation.narrow || palace.interpretation.low || '노력이 필요한 영역';
            } else {
                score = 75;
                interpretation = palace.interpretation.smooth || palace.interpretation.balanced || '균형 잡힌 상태';
            }

            palaceResults[key] = {
                name: palace.name,
                location: palace.location,
                meaning: palace.meaning,
                score: score,
                interpretation: interpretation
            };
        });

        return palaceResults;
    }

    /**
     * 종합 관상 점수 계산
     */
    function calculateOverallScore(analysis) {
        const scores = [
            analysis.faceShape.score,
            analysis.forehead.score,
            analysis.eyes.combinedScore,
            analysis.nose.combinedScore,
            analysis.mouth.combinedScore,
            analysis.chin.score,
            analysis.threeZones.upper.score,
            analysis.threeZones.middle.score,
            analysis.threeZones.lower.score
        ];

        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

        let grade, gradeDesc;
        if (avgScore >= 82) {
            grade = 'S';
            gradeDesc = '매우 좋은 관상입니다. 복이 많은 얼굴입니다.';
        } else if (avgScore >= 75) {
            grade = 'A';
            gradeDesc = '좋은 관상입니다. 긍정적인 기운이 있습니다.';
        } else if (avgScore >= 68) {
            grade = 'B';
            gradeDesc = '균형 잡힌 관상입니다. 안정적인 운세입니다.';
        } else if (avgScore >= 60) {
            grade = 'C';
            gradeDesc = '노력형 관상입니다. 성실함이 복을 부릅니다.';
        } else {
            grade = 'D';
            gradeDesc = '개선의 여지가 있습니다. 마음가짐이 중요합니다.';
        }

        return {
            score: Math.round(avgScore),
            grade: grade,
            gradeDesc: gradeDesc
        };
    }

    /**
     * 전체 관상 분석 실행
     */
    async function analyze(imageElement) {
        try {
            // 랜드마크 추출
            const landmarks = await extractLandmarks(imageElement);

            // 측정값 계산
            const measurements = calculateMeasurements(landmarks);

            // 각 부위별 분석
            const analysis = {
                faceShape: analyzeFaceShape(measurements),
                forehead: analyzeForehead(measurements),
                eyes: analyzeEyes(measurements),
                nose: analyzeNose(measurements),
                mouth: analyzeMouth(measurements),
                chin: analyzeChin(measurements),
                threeZones: analyzeThreeZones(measurements),
                twelvePalaces: analyzeTwelvePalaces(landmarks, measurements),
                measurements: measurements,
                landmarkCount: landmarks.length
            };

            // 종합 점수
            analysis.overallScore = calculateOverallScore(analysis);

            // 종합 해석
            analysis.summary = generateSummary(analysis);

            return analysis;

        } catch (error) {
            console.error('관상 분석 오류:', error);
            throw error;
        }
    }

    /**
     * 종합 해석 생성
     */
    function generateSummary(analysis) {
        const summaries = [];

        // 얼굴형 기반 요약
        summaries.push(`${analysis.faceShape.korean}의 얼굴형으로, ${analysis.faceShape.meaning}`);

        // 삼정 기반 요약
        const bestZone = Object.entries(analysis.threeZones)
            .sort((a, b) => b[1].score - a[1].score)[0];
        summaries.push(`${bestZone[1].name}이 특히 좋아 ${bestZone[1].interpretation}`);

        // 특징적인 부위
        if (analysis.forehead.score >= 80) {
            summaries.push(`${analysis.forehead.korean}로 ${analysis.forehead.meaning}`);
        }
        if (analysis.nose.combinedScore >= 80) {
            summaries.push(`코가 좋아 재물운이 있습니다.`);
        }
        if (analysis.chin.score >= 80) {
            summaries.push(`${analysis.chin.korean}으로 ${analysis.chin.meaning}`);
        }

        return {
            highlights: summaries,
            advice: generateAdvice(analysis)
        };
    }

    /**
     * 조언 생성
     */
    function generateAdvice(analysis) {
        const advice = [];

        // 약한 부분에 대한 조언
        if (analysis.threeZones.upper.score < 70) {
            advice.push('초년운을 보완하기 위해 학습과 자기계발에 투자하세요.');
        }
        if (analysis.threeZones.middle.score < 70) {
            advice.push('중년운을 강화하기 위해 인맥 관리와 건강에 신경 쓰세요.');
        }
        if (analysis.threeZones.lower.score < 70) {
            advice.push('말년운을 위해 저축과 건강 관리를 꾸준히 하세요.');
        }

        // 강한 부분 활용 조언
        if (analysis.forehead.score >= 80) {
            advice.push('높은 지혜를 학문이나 전문 분야에 활용하세요.');
        }
        if (analysis.eyes.combinedScore >= 80) {
            advice.push('뛰어난 통찰력을 대인관계나 사업에 활용하세요.');
        }

        if (advice.length === 0) {
            advice.push('균형 잡힌 관상입니다. 현재의 장점을 잘 유지하세요.');
        }

        return advice;
    }

    /**
     * 간략 분석 (MediaPipe 없이 비율만으로)
     * 캔버스에서 직접 측정한 값을 사용
     */
    function analyzeFromMeasurements(manualMeasurements) {
        // 수동 입력값으로 분석
        const measurements = {
            faceHeight: manualMeasurements.faceHeight || 1,
            faceWidth: manualMeasurements.faceWidth || 0.75,
            foreheadHeight: manualMeasurements.foreheadHeight || 0.3,
            eyeDistance: manualMeasurements.eyeDistance || 0.3,
            eyeWidth: manualMeasurements.eyeWidth || 0.1,
            noseLength: manualMeasurements.noseLength || 0.25,
            noseWidth: manualMeasurements.noseWidth || 0.15,
            mouthWidth: manualMeasurements.mouthWidth || 0.35,
            lipThickness: manualMeasurements.lipThickness || 0.05,
            jawWidth: manualMeasurements.jawWidth || 0.6,
            chinLength: manualMeasurements.chinLength || 0.2,
            upperThird: manualMeasurements.upperThird || 0.33,
            middleThird: manualMeasurements.middleThird || 0.33,
            lowerThird: manualMeasurements.lowerThird || 0.34
        };

        return {
            faceShape: analyzeFaceShape(measurements),
            forehead: analyzeForehead(measurements),
            eyes: analyzeEyes(measurements),
            nose: analyzeNose(measurements),
            mouth: analyzeMouth(measurements),
            chin: analyzeChin(measurements),
            threeZones: analyzeThreeZones(measurements),
            measurements: measurements
        };
    }

    // Public API
    return {
        initialize,
        analyze,
        analyzeFromMeasurements,
        extractLandmarks,
        calculateMeasurements,
        analyzeFaceShape,
        analyzeForehead,
        analyzeEyes,
        analyzeNose,
        analyzeMouth,
        analyzeChin,
        analyzeThreeZones,
        analyzeTwelvePalaces,
        calculateOverallScore,

        // 데이터
        TWELVE_PALACES,
        FACE_RATIOS,
        FEATURE_INTERPRETATIONS
    };
})();

// ES Module export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhysiognomyAnalyzer;
}
