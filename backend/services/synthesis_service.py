"""통합 분석 (Synthesis) 서비스"""

from datetime import datetime
from typing import Optional, List, Dict
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.synthesis_models import (
    SynthesisRequest, SynthesisResponse,
    AnalysisWeight, QueryIntent, AHPScore,
    ConflictResolution, FortuneCategory
)
from models.saju_models import SajuResponse, Element
from models.astrology_models import AstrologyResponse
from models.physiognomy_models import PhysiognomyResponse

from services.saju_service import SajuService
from services.astrology_service import AstrologyService
from services.physiognomy_service import PhysiognomyService


class SynthesisService:
    """통합 분석 서비스 클래스"""

    # 질문 의도별 가중치
    INTENT_WEIGHTS = {
        QueryIntent.GENERAL: AnalysisWeight(saju_weight=0.4, astrology_weight=0.4, physiognomy_weight=0.2),
        QueryIntent.CAREER: AnalysisWeight(saju_weight=0.4, astrology_weight=0.35, physiognomy_weight=0.25),
        QueryIntent.RELATIONSHIP: AnalysisWeight(saju_weight=0.35, astrology_weight=0.45, physiognomy_weight=0.2),
        QueryIntent.FINANCE: AnalysisWeight(saju_weight=0.4, astrology_weight=0.3, physiognomy_weight=0.3),
        QueryIntent.HEALTH: AnalysisWeight(saju_weight=0.35, astrology_weight=0.35, physiognomy_weight=0.3),
        QueryIntent.TIMING: AnalysisWeight(saju_weight=0.6, astrology_weight=0.35, physiognomy_weight=0.05),
        QueryIntent.PSYCHOLOGY: AnalysisWeight(saju_weight=0.3, astrology_weight=0.5, physiognomy_weight=0.2),
    }

    def __init__(self):
        """서비스 초기화"""
        self.saju_service = SajuService()
        self.astrology_service = AstrologyService()
        self.physiognomy_service = PhysiognomyService()

    def analyze(self, request: SynthesisRequest) -> SynthesisResponse:
        """통합 분석 수행"""

        # 1. 가중치 결정
        weights = request.custom_weights or self.INTENT_WEIGHTS.get(
            request.query_intent,
            self.INTENT_WEIGHTS[QueryIntent.GENERAL]
        )

        # 2. 개별 분석 수행
        saju_result = self.saju_service.analyze(request.saju_data)

        astrology_result = None
        if request.astrology_data:
            astrology_result = self.astrology_service.create_natal_chart(request.astrology_data)

        physiognomy_result = None
        if request.physiognomy_data:
            physiognomy_result = self.physiognomy_service.analyze(request.physiognomy_data)

        # 3. AHP 점수 계산
        ahp_scores = self._calculate_ahp_scores(
            saju_result, astrology_result, physiognomy_result, weights
        )

        # 4. 상충 해결
        conflict_resolution = self._resolve_conflicts(
            saju_result, astrology_result, physiognomy_result, weights
        )

        # 5. 카테고리별 운세
        fortune_categories = self._generate_fortune_categories(
            saju_result, astrology_result, physiognomy_result, request.query_intent
        )

        # 6. 핵심 인사이트 생성
        key_insight = self._generate_key_insight(
            saju_result, astrology_result, request.query_intent
        )

        # 7. 상세 해석
        detailed_interpretation = self._generate_detailed_interpretation(
            saju_result, astrology_result, physiognomy_result, weights
        )

        # 8. 조언 및 주의사항
        advice = self._generate_advice(saju_result, astrology_result, request.query_intent)
        cautions = self._generate_cautions(saju_result)

        # 9. 행운의 요소
        lucky_elements = self._generate_lucky_elements(saju_result)

        # 10. 질문 답변 (있는 경우)
        question_answer = None
        if request.specific_question:
            question_answer = self._answer_question(
                request.specific_question, saju_result, astrology_result, request.query_intent
            )

        return SynthesisResponse(
            saju_result=saju_result,
            astrology_result=astrology_result,
            physiognomy_result=physiognomy_result,
            ahp_scores=ahp_scores,
            applied_weights=weights,
            conflict_resolution=conflict_resolution,
            fortune_categories=fortune_categories,
            key_insight=key_insight,
            detailed_interpretation=detailed_interpretation,
            advice=advice,
            cautions=cautions,
            lucky_elements=lucky_elements,
            question_answer=question_answer,
            generated_at=datetime.now()
        )

    def _calculate_ahp_scores(
        self,
        saju: SajuResponse,
        astrology: Optional[AstrologyResponse],
        physiognomy: Optional[PhysiognomyResponse],
        weights: AnalysisWeight
    ) -> AHPScore:
        """AHP 점수 계산"""

        # 사주 점수 (오행 균형 기반)
        element_balance = saju.element_balance
        balance_variance = self._calculate_variance(list(element_balance.values()))
        saju_score = max(50, 100 - balance_variance * 10)

        # 점성술 점수
        astrology_score = None
        if astrology:
            # 아스펙트 기반 점수 (간략화)
            positive_aspects = len([a for a in astrology.aspects if a.aspect_type.value in ['trine', 'sextile']])
            total_aspects = len(astrology.aspects)
            astrology_score = 70 + (positive_aspects / max(total_aspects, 1)) * 30 if total_aspects else 70

        # 관상 점수
        physiognomy_score = None
        if physiognomy:
            physiognomy_score = physiognomy.overall_score

        # 가중 합산
        total_weight = weights.saju_weight
        weighted_sum = saju_score * weights.saju_weight

        if astrology_score is not None:
            weighted_sum += astrology_score * weights.astrology_weight
            total_weight += weights.astrology_weight

        if physiognomy_score is not None:
            weighted_sum += physiognomy_score * weights.physiognomy_weight
            total_weight += weights.physiognomy_weight

        weighted_total = weighted_sum / total_weight if total_weight > 0 else saju_score

        # 신뢰도 계산 (사용된 데이터 소스 수 기반)
        sources_used = 1 + (1 if astrology else 0) + (1 if physiognomy else 0)
        confidence = 0.5 + (sources_used / 3) * 0.5

        return AHPScore(
            saju_score=round(saju_score, 1),
            astrology_score=round(astrology_score, 1) if astrology_score else None,
            physiognomy_score=round(physiognomy_score, 1) if physiognomy_score else None,
            weighted_total=round(weighted_total, 1),
            confidence=round(confidence, 2)
        )

    def _calculate_variance(self, values: List[float]) -> float:
        """분산 계산"""
        if not values:
            return 0
        mean = sum(values) / len(values)
        return sum((x - mean) ** 2 for x in values) / len(values)

    def _resolve_conflicts(
        self,
        saju: SajuResponse,
        astrology: Optional[AstrologyResponse],
        physiognomy: Optional[PhysiognomyResponse],
        weights: AnalysisWeight
    ) -> ConflictResolution:
        """상충 해결"""

        has_conflict = False
        conflict_description = None
        resolution_method = None
        primary_source = None

        # 사주와 점성술 간 상충 체크 (간략화)
        if astrology:
            # 예: 사주에서 재물운이 나쁜데 점성술에서 목성이 좋으면 상충
            saju_finance = saju.element_balance.get("metal", 0)
            astro_jupiter_strong = any(
                p.planet.value == "jupiter" and p.house in [2, 5, 9]
                for p in astrology.planets
            )

            if saju_finance < 2 and astro_jupiter_strong:
                has_conflict = True
                conflict_description = "사주에서는 재물운이 약하나 점성술에서는 목성이 강합니다."
                resolution_method = "가중치가 높은 분석을 우선하고 낮은 것은 보완적 조언으로 처리"
                primary_source = "사주" if weights.saju_weight > weights.astrology_weight else "점성술"

        return ConflictResolution(
            has_conflict=has_conflict,
            conflict_description=conflict_description,
            resolution_method=resolution_method,
            primary_source=primary_source
        )

    def _generate_fortune_categories(
        self,
        saju: SajuResponse,
        astrology: Optional[AstrologyResponse],
        physiognomy: Optional[PhysiognomyResponse],
        intent: QueryIntent
    ) -> List[FortuneCategory]:
        """카테고리별 운세 생성"""

        categories = []

        # 재물운
        finance_score = 70 + (saju.element_balance.get("metal", 0) * 5)
        categories.append(FortuneCategory(
            category="재물운",
            score=min(100, finance_score),
            trend="상승" if finance_score > 75 else "유지",
            saju_interpretation=f"재성({saju.element_balance.get('metal', 0)}개) 기반 재물운",
            astrology_interpretation="목성 트랜짓에 따른 확장 가능성" if astrology else None,
            combined_interpretation="재물 관리에 신중을 기하면 안정적인 재정 상태 유지 가능"
        ))

        # 직업운
        career_score = 70 + (saju.element_balance.get("earth", 0) * 5)
        categories.append(FortuneCategory(
            category="직업운",
            score=min(100, career_score),
            trend="상승" if career_score > 75 else "유지",
            saju_interpretation=f"관성과 인성의 균형에 따른 직업 안정도",
            astrology_interpretation="토성 위치에 따른 책임감 발현" if astrology else None,
            combined_interpretation="꾸준한 노력이 인정받는 시기"
        ))

        # 관계운
        relationship_score = 70 + (saju.element_balance.get("fire", 0) * 4)
        categories.append(FortuneCategory(
            category="관계운",
            score=min(100, relationship_score),
            trend="상승" if relationship_score > 75 else "유지",
            saju_interpretation="식상의 기운에 따른 표현력과 소통",
            astrology_interpretation="금성 위치에 따른 매력도" if astrology else None,
            combined_interpretation="적극적인 소통이 관계 개선의 열쇠"
        ))

        # 건강운
        health_score = 70 + (saju.element_balance.get("water", 0) * 4)
        categories.append(FortuneCategory(
            category="건강운",
            score=min(100, health_score),
            trend="유지",
            saju_interpretation="오행 균형에 따른 기본 건강 상태",
            astrology_interpretation=None,
            combined_interpretation="규칙적인 생활과 적당한 운동 권장"
        ))

        return categories

    def _generate_key_insight(
        self,
        saju: SajuResponse,
        astrology: Optional[AstrologyResponse],
        intent: QueryIntent
    ) -> str:
        """핵심 인사이트 생성"""

        element_names = {
            "wood": "목(木)", "fire": "화(火)", "earth": "토(土)",
            "metal": "금(金)", "water": "수(水)"
        }

        yongsin_name = element_names.get(saju.yongsin.value, saju.yongsin.value)

        if intent == QueryIntent.CAREER:
            return f"용신 {yongsin_name}의 기운을 활용하면 직업적 성장에 유리합니다. 올해는 특히 새로운 도전의 기회가 있습니다."
        elif intent == QueryIntent.RELATIONSHIP:
            return f"관계에서 {yongsin_name}의 기운을 가진 사람과의 만남이 좋습니다. 소통에 더 집중하세요."
        elif intent == QueryIntent.FINANCE:
            return f"재물운에서 {yongsin_name}이 중요합니다. 해당 기운이 강한 시기에 투자하면 유리합니다."
        elif intent == QueryIntent.TIMING:
            return f"{yongsin_name}의 기운이 강한 달(월)에 중요한 결정을 내리는 것이 좋습니다."
        else:
            return f"전반적으로 {yongsin_name}의 기운을 보충하면 운세가 더욱 좋아집니다. {saju.yearly_fortune}"

    def _generate_detailed_interpretation(
        self,
        saju: SajuResponse,
        astrology: Optional[AstrologyResponse],
        physiognomy: Optional[PhysiognomyResponse],
        weights: AnalysisWeight
    ) -> str:
        """상세 통합 해석 생성"""

        parts = [saju.summary]

        if astrology:
            parts.append(f"점성술적으로 {astrology.personality_summary}")

        if physiognomy:
            parts.append(f"관상학적으로 {physiognomy.summary}")

        parts.append(
            f"AHP 분석 결과, 사주({weights.saju_weight*100:.0f}%), "
            f"점성술({weights.astrology_weight*100:.0f}%), "
            f"관상({weights.physiognomy_weight*100:.0f}%)의 가중치가 적용되었습니다."
        )

        return " ".join(parts)

    def _generate_advice(
        self,
        saju: SajuResponse,
        astrology: Optional[AstrologyResponse],
        intent: QueryIntent
    ) -> List[str]:
        """실천 조언 생성"""

        advice = []

        # 용신 기반 조언
        element_advice = {
            Element.WOOD: "동쪽 방향이 좋고, 녹색 계열을 활용하세요.",
            Element.FIRE: "남쪽 방향이 좋고, 빨간색 계열을 활용하세요.",
            Element.EARTH: "중앙이 좋고, 노란색/갈색 계열을 활용하세요.",
            Element.METAL: "서쪽 방향이 좋고, 흰색/금색 계열을 활용하세요.",
            Element.WATER: "북쪽 방향이 좋고, 검정색/파란색 계열을 활용하세요."
        }

        advice.append(element_advice.get(saju.yongsin, ""))

        # 의도별 추가 조언
        if intent == QueryIntent.CAREER:
            advice.append("새로운 기술이나 지식을 습득하는 데 투자하세요.")
            advice.append("네트워킹을 통해 기회를 넓히세요.")
        elif intent == QueryIntent.RELATIONSHIP:
            advice.append("상대방의 이야기에 더 귀 기울이세요.")
            advice.append("작은 것에 감사하는 마음을 표현하세요.")
        elif intent == QueryIntent.FINANCE:
            advice.append("충동적인 지출을 자제하세요.")
            advice.append("장기적인 투자 관점을 유지하세요.")

        return [a for a in advice if a]

    def _generate_cautions(self, saju: SajuResponse) -> List[str]:
        """주의사항 생성"""

        cautions = []

        # 기신 기반 주의사항
        element_cautions = {
            Element.WOOD: "과도한 확장이나 무리한 도전은 피하세요.",
            Element.FIRE: "성급한 결정이나 감정적 대응을 자제하세요.",
            Element.EARTH: "완고함이나 변화에 대한 저항을 줄이세요.",
            Element.METAL: "지나친 비판이나 완벽주의를 경계하세요.",
            Element.WATER: "우유부단함이나 과도한 걱정을 줄이세요."
        }

        cautions.append(element_cautions.get(saju.gisin, ""))

        # 약한 오행 관련 주의
        weak_element = saju.weak_element
        if weak_element:
            weak_cautions = {
                "wood": "간/담 건강에 주의하세요.",
                "fire": "심장/소장 건강에 주의하세요.",
                "earth": "비장/위장 건강에 주의하세요.",
                "metal": "폐/대장 건강에 주의하세요.",
                "water": "신장/방광 건강에 주의하세요."
            }
            cautions.append(weak_cautions.get(weak_element, ""))

        return [c for c in cautions if c]

    def _generate_lucky_elements(self, saju: SajuResponse) -> Dict[str, str]:
        """행운의 요소 생성"""

        lucky = {}

        element_lucky = {
            Element.WOOD: {"색상": "청색/녹색", "방향": "동쪽", "숫자": "3, 8", "계절": "봄"},
            Element.FIRE: {"색상": "적색/주황색", "방향": "남쪽", "숫자": "2, 7", "계절": "여름"},
            Element.EARTH: {"색상": "황색/갈색", "방향": "중앙", "숫자": "5, 10", "계절": "환절기"},
            Element.METAL: {"색상": "백색/금색", "방향": "서쪽", "숫자": "4, 9", "계절": "가을"},
            Element.WATER: {"색상": "흑색/남색", "방향": "북쪽", "숫자": "1, 6", "계절": "겨울"}
        }

        lucky = element_lucky.get(saju.yongsin, element_lucky[Element.WATER])

        return lucky

    def _answer_question(
        self,
        question: str,
        saju: SajuResponse,
        astrology: Optional[AstrologyResponse],
        intent: QueryIntent
    ) -> str:
        """특정 질문에 대한 답변 생성"""

        # 키워드 기반 간단한 답변 생성
        if "언제" in question or "시기" in question:
            return f"용신 {saju.yongsin.value}의 기운이 강한 시기가 좋습니다. 대운을 참고하여 결정하세요."
        elif "이직" in question or "직장" in question:
            return f"현재 운세를 보면 {saju.yearly_fortune} 신중하게 결정하시기 바랍니다."
        elif "결혼" in question or "연애" in question:
            return "올해는 관계에 있어 소통이 중요한 해입니다. 서로의 이야기에 귀 기울이세요."
        elif "투자" in question or "돈" in question:
            return "무리한 투자보다는 안정적인 재테크를 권장합니다. 용신에 맞는 시기에 결정하세요."
        else:
            return f"질문에 대해: {saju.yearly_fortune} 더 구체적인 질문을 주시면 상세한 답변을 드릴 수 있습니다."

    def quick_analyze(self, request: SynthesisRequest) -> Dict:
        """간편 분석 (사주만)"""
        saju_result = self.saju_service.analyze(request.saju_data)

        return {
            "summary": saju_result.summary,
            "yearly_fortune": saju_result.yearly_fortune,
            "yongsin": saju_result.yongsin.value,
            "element_balance": saju_result.element_balance,
            "pillars": {
                "year": f"{saju_result.year_pillar.stem}{saju_result.year_pillar.branch}",
                "month": f"{saju_result.month_pillar.stem}{saju_result.month_pillar.branch}",
                "day": f"{saju_result.day_pillar.stem}{saju_result.day_pillar.branch}",
                "hour": f"{saju_result.hour_pillar.stem}{saju_result.hour_pillar.branch}" if saju_result.hour_pillar else None
            }
        }

    def analyze_with_question(self, request: SynthesisRequest) -> Dict:
        """질문 기반 분석"""
        result = self.analyze(request)

        return {
            "question": request.specific_question,
            "answer": result.question_answer,
            "key_insight": result.key_insight,
            "advice": result.advice,
            "lucky_elements": result.lucky_elements
        }
