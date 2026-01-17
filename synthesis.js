/**
 * Astro-Synthesis AHP 통합 해석 엔진 v1.0
 * 동서양 역학 결과를 AHP(계층화 분석법) 기반으로 통합
 */

const SynthesisEngine = (function() {
    'use strict';

    // ===== AHP 가중치 설정 =====

    // 분석 카테고리별 기본 가중치
    const DEFAULT_WEIGHTS = {
        // 동양 사주 가중치
        eastern: {
            elementBalance: 0.25,      // 오행 균형
            relations: 0.20,           // 합충 관계
            sinsal: 0.15,              // 12신살
            dayMaster: 0.20,           // 일간 분석
            daeun: 0.20                // 대운
        },
        // 서양 점성술 가중치
        western: {
            sunSign: 0.20,             // 태양 별자리
            moonSign: 0.15,            // 달 별자리
            ascendant: 0.20,           // 상승궁
            aspects: 0.25,             // 어스펙트
            elements: 0.20             // 원소 균형
        },
        // 동서양 통합 가중치 (질문 유형별)
        integration: {
            general: { eastern: 0.5, western: 0.5 },
            personality: { eastern: 0.4, western: 0.6 },  // 성격 - 점성술 우선
            timing: { eastern: 0.7, western: 0.3 },       // 시기/택일 - 사주 우선
            career: { eastern: 0.5, western: 0.5 },
            relationship: { eastern: 0.4, western: 0.6 },
            health: { eastern: 0.6, western: 0.4 },
            wealth: { eastern: 0.6, western: 0.4 }
        }
    };

    // 오행-원소 대응 매핑
    const ELEMENT_MAPPING = {
        '木': 'Air',    // 목 - 공기 (성장, 확장)
        '火': 'Fire',   // 화 - 불
        '土': 'Earth',  // 토 - 땅
        '金': 'Earth',  // 금 - 땅 (물질)
        '水': 'Water'   // 수 - 물
    };

    // 원소 특성
    const ELEMENT_TRAITS = {
        Fire: { traits: ['열정', '에너지', '리더십', '창의성'], positive: ['추진력', '자신감'], negative: ['조급함', '충동성'] },
        Earth: { traits: ['안정', '실용', '신뢰', '인내'], positive: ['끈기', '현실감각'], negative: ['고집', '완고함'] },
        Air: { traits: ['소통', '지성', '유연', '사교'], positive: ['적응력', '분석력'], negative: ['우유부단', '피상적'] },
        Water: { traits: ['직관', '감성', '공감', '치유'], positive: ['통찰력', '배려심'], negative: ['감정기복', '의존성'] }
    };

    // ===== 통합 분석 함수 =====

    /**
     * 동서양 분석 결과 통합
     * @param {Object} sajuResult - 사주 분석 결과
     * @param {Object} astroResult - 점성술 분석 결과
     * @param {string} queryType - 질문 유형 (general, personality, timing 등)
     * @returns {Object} 통합 분석 결과
     */
    function synthesize(sajuResult, astroResult, queryType = 'general') {
        const weights = DEFAULT_WEIGHTS.integration[queryType] || DEFAULT_WEIGHTS.integration.general;

        // 1. 개별 점수 정규화
        const easternScore = normalizeEasternScore(sajuResult);
        const westernScore = normalizeWesternScore(astroResult);

        // 2. 가중치 적용 통합 점수
        const integratedScore = calculateIntegratedScore(easternScore, westernScore, weights);

        // 3. 충돌 해결
        const conflictResolution = resolveConflicts(sajuResult, astroResult);

        // 4. 원소/오행 통합 분석
        const elementSynthesis = synthesizeElements(sajuResult.elementAnalysis, astroResult.elementAnalysis);

        // 5. 성격 프로필 생성
        const personalityProfile = generatePersonalityProfile(sajuResult, astroResult);

        // 6. 종합 해석 생성
        const interpretation = generateInterpretation(sajuResult, astroResult, elementSynthesis, conflictResolution);

        // 7. 통합 운세 흐름
        const fortuneFlow = synthesizeFortuneFlow(sajuResult, astroResult);

        // 8. 종합 등급 및 점수
        const overallGrade = calculateOverallGrade(integratedScore, conflictResolution);

        return {
            queryType,
            weights,
            scores: {
                eastern: easternScore,
                western: westernScore,
                integrated: integratedScore
            },
            conflictResolution,
            elementSynthesis,
            personalityProfile,
            interpretation,
            fortuneFlow,
            overallGrade,
            recommendations: generateRecommendations(elementSynthesis, personalityProfile),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 동양 사주 점수 정규화
     */
    function normalizeEasternScore(sajuResult) {
        const scores = {
            elementBalance: calculateElementBalance(sajuResult.elementAnalysis),
            relations: calculateRelationsScore(sajuResult.relations),
            sinsal: calculateSinsalScore(sajuResult.sinsal12),
            dayMaster: 70, // 일간 기본 점수
            daeun: calculateDaeunScore(sajuResult.daeun),
            gongmang: sajuResult.gongmang.hasGongmang ? -10 : 5
        };

        // 가중 평균
        let total = 0;
        let weightSum = 0;
        const weights = DEFAULT_WEIGHTS.eastern;

        for (const [key, weight] of Object.entries(weights)) {
            if (scores[key] !== undefined) {
                total += scores[key] * weight;
                weightSum += weight;
            }
        }

        return {
            detail: scores,
            overall: Math.round(total / weightSum),
            raw: sajuResult.overallScore
        };
    }

    /**
     * 서양 점성술 점수 정규화
     */
    function normalizeWesternScore(astroResult) {
        const aspectScore = calculateAspectScore(astroResult.aspects);
        const elementScore = calculateWesternElementScore(astroResult.elementAnalysis);

        const scores = {
            sunSign: 70, // 기본 점수
            moonSign: 70,
            ascendant: 70,
            aspects: aspectScore,
            elements: elementScore
        };

        // 가중 평균
        let total = 0;
        let weightSum = 0;
        const weights = DEFAULT_WEIGHTS.western;

        for (const [key, weight] of Object.entries(weights)) {
            if (scores[key] !== undefined) {
                total += scores[key] * weight;
                weightSum += weight;
            }
        }

        return {
            detail: scores,
            overall: Math.round(total / weightSum),
            raw: astroResult.score
        };
    }

    /**
     * 통합 점수 계산
     */
    function calculateIntegratedScore(easternScore, westernScore, weights) {
        const score = easternScore.overall * weights.eastern + westernScore.overall * weights.western;
        return Math.round(score);
    }

    /**
     * 오행 균형 점수
     */
    function calculateElementBalance(elementAnalysis) {
        const dist = Object.values(elementAnalysis.distribution);
        const avg = dist.reduce((a, b) => a + b, 0) / 5;
        const variance = dist.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / 5;

        // 분산이 낮을수록 균형 좋음
        return Math.max(0, Math.min(100, 100 - variance * 15));
    }

    /**
     * 합충 관계 점수
     */
    function calculateRelationsScore(relations) {
        const good = relations.summary.good;
        const bad = relations.summary.bad;
        return 50 + (good * 10) - (bad * 8);
    }

    /**
     * 신살 점수
     */
    function calculateSinsalScore(sinsal12) {
        const good = sinsal12.goodSinsal.length;
        const bad = sinsal12.badSinsal.length;
        return 50 + (good * 12) - (bad * 8);
    }

    /**
     * 대운 점수
     */
    function calculateDaeunScore(daeunList) {
        // 현재 대운의 긍정성 평가
        const currentYear = new Date().getFullYear();
        const currentDaeun = daeunList.find(d =>
            currentYear >= d.startYear && currentYear <= d.endYear
        );

        if (!currentDaeun) return 60;

        // 대운 천간/지지의 오행 조화 평가 (간략화)
        return 65; // 기본값
    }

    /**
     * 어스펙트 점수
     */
    function calculateAspectScore(aspects) {
        const positive = aspects.filter(a => a.aspect.effect === 'positive').length;
        const challenging = aspects.filter(a => a.aspect.effect === 'challenging').length;
        return 50 + (positive * 8) - (challenging * 5);
    }

    /**
     * 서양 원소 균형 점수
     */
    function calculateWesternElementScore(elementAnalysis) {
        const values = Object.values(elementAnalysis.elements);
        const avg = values.reduce((a, b) => a + b, 0) / 4;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / 4;
        return Math.max(0, Math.min(100, 100 - variance * 10));
    }

    /**
     * 동서양 충돌 해결
     */
    function resolveConflicts(sajuResult, astroResult) {
        const conflicts = [];
        const resolutions = [];

        // 1. 오행 vs 원소 비교
        const sajuDominant = sajuResult.elementAnalysis.strongest.element;
        const astroDominant = astroResult.elementAnalysis.dominant.element;
        const mappedElement = ELEMENT_MAPPING[sajuDominant];

        if (mappedElement !== astroDominant) {
            conflicts.push({
                type: 'element',
                eastern: sajuDominant,
                western: astroDominant,
                description: `사주 강점 오행(${sajuDominant})과 점성술 우세 원소(${astroDominant})가 다릅니다.`
            });

            resolutions.push({
                conflict: 'element',
                resolution: 'complementary',
                explanation: '두 시스템의 다른 강점은 보완적으로 작용합니다. ' +
                           `${sajuDominant}의 특성과 ${astroDominant}의 특성을 모두 활용하세요.`
            });
        }

        // 2. 전반적 점수 방향성 비교
        const sajuScore = sajuResult.overallScore.score;
        const astroScore = astroResult.score.score;
        const scoreDiff = Math.abs(sajuScore - astroScore);

        if (scoreDiff > 20) {
            conflicts.push({
                type: 'score_divergence',
                eastern: sajuScore,
                western: astroScore,
                description: `사주(${sajuScore}점)와 점성술(${astroScore}점) 점수 차이가 큽니다.`
            });

            const higher = sajuScore > astroScore ? 'eastern' : 'western';
            resolutions.push({
                conflict: 'score_divergence',
                resolution: 'prioritize',
                priority: higher,
                explanation: higher === 'eastern'
                    ? '시기적 운세와 실용적 판단은 사주를 참고하세요.'
                    : '성격적 특성과 잠재력은 점성술을 참고하세요.'
            });
        }

        return {
            hasConflicts: conflicts.length > 0,
            conflicts,
            resolutions,
            overallHarmony: conflicts.length === 0 ? 'high' :
                           conflicts.length === 1 ? 'medium' : 'needs_attention'
        };
    }

    /**
     * 오행/원소 통합 분석
     */
    function synthesizeElements(sajuElements, astroElements) {
        const synthesis = {
            dominant: {
                eastern: sajuElements.strongest,
                western: astroElements.dominant,
                combined: null
            },
            weak: {
                eastern: sajuElements.weakest,
                western: Object.entries(astroElements.elements)
                    .sort((a, b) => a[1] - b[1])[0]
            },
            balance: {
                eastern: calculateElementBalance(sajuElements),
                western: calculateWesternElementScore(astroElements)
            },
            recommendations: []
        };

        // 보완 원소 추천
        const weakEastern = synthesis.weak.eastern.element;
        const relatedTraits = ELEMENT_TRAITS[ELEMENT_MAPPING[weakEastern]] || ELEMENT_TRAITS.Earth;

        synthesis.recommendations = [
            {
                element: weakEastern,
                reason: `${weakEastern} 오행이 부족합니다.`,
                advice: `${relatedTraits.positive.join(', ')}을 키우면 좋습니다.`
            }
        ];

        return synthesis;
    }

    /**
     * 성격 프로필 생성
     */
    function generatePersonalityProfile(sajuResult, astroResult) {
        const profile = {
            coreTraits: [],
            strengths: [],
            challenges: [],
            socialStyle: '',
            workStyle: '',
            emotionalPattern: ''
        };

        // 일간 기반 특성 (동양)
        const dayMaster = sajuResult.dayMaster;
        profile.coreTraits.push({
            source: 'saju',
            trait: dayMaster.description,
            element: dayMaster.element
        });

        // 태양 별자리 기반 특성 (서양)
        const sunSign = astroResult.sunSign;
        profile.coreTraits.push({
            source: 'astrology',
            trait: `${sunSign.korean} - ${sunSign.element} 원소`,
            element: sunSign.element
        });

        // 강점 분석
        if (sajuResult.sinsal12.goodSinsal.length > 0) {
            profile.strengths.push(...sajuResult.sinsal12.goodSinsal.map(s => s.desc));
        }

        if (astroResult.positiveAspects.length > 0) {
            profile.strengths.push('긍정적인 행성 조화');
        }

        // 도전 요소
        if (sajuResult.sinsal12.badSinsal.length > 0) {
            profile.challenges.push(...sajuResult.sinsal12.badSinsal.map(s => s.desc));
        }

        if (sajuResult.gongmang.hasGongmang) {
            profile.challenges.push(sajuResult.gongmang.description);
        }

        // 사회적 스타일
        const socialElements = ['Air', '木'];
        const hasSocialElement = sajuResult.elementAnalysis.distribution['木'] >= 2 ||
                                astroResult.elementAnalysis.elements['Air'] >= 3;
        profile.socialStyle = hasSocialElement ? '사교적이고 소통을 즐김' : '신중하고 깊은 관계 선호';

        // 업무 스타일
        const workElements = ['Earth', '金', '土'];
        const hasWorkElement = sajuResult.elementAnalysis.distribution['金'] >= 2 ||
                              sajuResult.elementAnalysis.distribution['土'] >= 2;
        profile.workStyle = hasWorkElement ? '체계적이고 실용적인 접근' : '창의적이고 유연한 접근';

        // 감정 패턴
        const emotionalElements = ['Water', '水'];
        const hasEmotionalElement = sajuResult.elementAnalysis.distribution['水'] >= 2 ||
                                   astroResult.elementAnalysis.elements['Water'] >= 3;
        profile.emotionalPattern = hasEmotionalElement ? '감수성이 풍부하고 직관적' : '이성적이고 안정적';

        return profile;
    }

    /**
     * 종합 해석 생성
     */
    function generateInterpretation(sajuResult, astroResult, elementSynthesis, conflictResolution) {
        const interpretations = [];

        // 1. 기본 운세
        interpretations.push({
            category: '기본 운세',
            title: '종합 에너지 흐름',
            content: generateBasicFortune(sajuResult, astroResult)
        });

        // 2. 성격 분석
        interpretations.push({
            category: '성격',
            title: '타고난 기질',
            content: `${sajuResult.dayMaster.korean}(${sajuResult.dayMaster.name})일간의 ${sajuResult.dayMaster.description} ` +
                    `서양 점성술에서는 ${astroResult.sunSign.korean}의 ${astroResult.sunSign.element} 에너지가 중심입니다.`
        });

        // 3. 올해 운세
        interpretations.push({
            category: '올해 운세',
            title: `${new Date().getFullYear()}년 전망`,
            content: generateYearlyInterpretation(sajuResult.yearlyFortune, astroResult)
        });

        // 4. 보완점
        if (elementSynthesis.recommendations.length > 0) {
            interpretations.push({
                category: '보완점',
                title: '균형을 위한 조언',
                content: elementSynthesis.recommendations.map(r => r.advice).join(' ')
            });
        }

        return interpretations;
    }

    /**
     * 기본 운세 생성
     */
    function generateBasicFortune(sajuResult, astroResult) {
        const sajuGrade = sajuResult.overallScore.grade;
        const astroGrade = astroResult.score.grade;

        const gradeDescriptions = {
            'S': '매우 강한 긍정 에너지',
            'A': '좋은 에너지 흐름',
            'B': '안정적인 에너지',
            'C': '주의가 필요한 시기',
            'D': '신중한 접근 필요'
        };

        return `사주 분석 결과 ${gradeDescriptions[sajuGrade]}이며, ` +
               `점성술 분석 결과 ${gradeDescriptions[astroGrade]}입니다. ` +
               `동서양 역학이 ${sajuGrade === astroGrade ? '일치하여 확실한' : '보완적으로 작용하여 균형잡힌'} ` +
               `운세를 나타냅니다.`;
    }

    /**
     * 연간 해석 생성
     */
    function generateYearlyInterpretation(yearlyFortune, astroResult) {
        const fortune = yearlyFortune;
        let interpretation = `올해는 ${fortune.pillar.korean}년으로, `;

        interpretation += `${fortune.sipsin.cheongan}과 ${fortune.sipsin.jiji}의 기운이 작용합니다. `;

        if (fortune.sinsal) {
            interpretation += `${fortune.sinsal.name}의 운이 있어 ${fortune.sinsal.desc}. `;
        }

        if (fortune.hasChung) {
            interpretation += '일부 충돌 에너지가 있으니 중요한 결정은 신중하게 하세요. ';
        }

        return interpretation;
    }

    /**
     * 운세 흐름 통합
     */
    function synthesizeFortuneFlow(sajuResult, astroResult) {
        return {
            currentYear: {
                eastern: sajuResult.yearlyFortune,
                integrated: {
                    rating: sajuResult.yearlyFortune.sinsal?.good ? 'positive' : 'neutral',
                    focus: sajuResult.yearlyFortune.sipsin.cheongan
                }
            },
            fiveYear: sajuResult.fiveYearFortune.map(f => ({
                year: f.year,
                eastern: { pillar: f.pillar.korean, sinsal: f.sinsal?.name },
                rating: f.sinsal?.good ? 'good' : (f.hasChung ? 'caution' : 'neutral')
            })),
            currentDaeun: sajuResult.daeun.find(d => {
                const year = new Date().getFullYear();
                return year >= d.startYear && year <= d.endYear;
            })
        };
    }

    /**
     * 종합 등급 계산
     */
    function calculateOverallGrade(integratedScore, conflictResolution) {
        let adjustedScore = integratedScore;

        // 충돌이 많으면 점수 조정
        if (conflictResolution.overallHarmony === 'needs_attention') {
            adjustedScore -= 5;
        } else if (conflictResolution.overallHarmony === 'high') {
            adjustedScore += 5;
        }

        adjustedScore = Math.max(0, Math.min(100, adjustedScore));

        let grade, description;
        if (adjustedScore >= 85) {
            grade = 'S';
            description = '매우 조화로운 에너지입니다. 적극적인 도전이 좋습니다.';
        } else if (adjustedScore >= 70) {
            grade = 'A';
            description = '좋은 에너지 흐름입니다. 계획을 실행하기 좋은 때입니다.';
        } else if (adjustedScore >= 55) {
            grade = 'B';
            description = '안정적인 상태입니다. 꾸준한 노력이 결실을 맺습니다.';
        } else if (adjustedScore >= 40) {
            grade = 'C';
            description = '주의가 필요합니다. 신중한 판단이 중요합니다.';
        } else {
            grade = 'D';
            description = '재충전의 시기입니다. 내면 성장에 집중하세요.';
        }

        return {
            score: adjustedScore,
            grade,
            description,
            harmony: conflictResolution.overallHarmony
        };
    }

    /**
     * 추천 사항 생성
     */
    function generateRecommendations(elementSynthesis, personalityProfile) {
        const recommendations = [];

        // 오행 보완 추천
        if (elementSynthesis.recommendations.length > 0) {
            recommendations.push({
                category: '오행 보완',
                items: elementSynthesis.recommendations.map(r => ({
                    title: `${r.element} 보충`,
                    description: r.advice
                }))
            });
        }

        // 성격 기반 추천
        recommendations.push({
            category: '생활 조언',
            items: [
                {
                    title: '업무 스타일',
                    description: personalityProfile.workStyle
                },
                {
                    title: '대인 관계',
                    description: personalityProfile.socialStyle
                }
            ]
        });

        return recommendations;
    }

    // Public API
    return {
        synthesize,
        normalizeEasternScore,
        normalizeWesternScore,
        resolveConflicts,
        generatePersonalityProfile,

        // 설정
        DEFAULT_WEIGHTS,
        ELEMENT_MAPPING,
        ELEMENT_TRAITS
    };
})();

// ES Module export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SynthesisEngine;
}
