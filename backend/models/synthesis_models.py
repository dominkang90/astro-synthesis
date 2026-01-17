"""통합 분석 (Synthesis) 관련 Pydantic 모델"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum

from .saju_models import SajuRequest, SajuResponse, Element
from .astrology_models import AstrologyRequest, AstrologyResponse, ZodiacSign
from .physiognomy_models import PhysiognomyRequest, PhysiognomyResponse


class AnalysisWeight(BaseModel):
    """분석 가중치 (AHP 기반)"""
    saju_weight: float = Field(0.4, ge=0, le=1, description="사주 가중치")
    astrology_weight: float = Field(0.4, ge=0, le=1, description="점성술 가중치")
    physiognomy_weight: float = Field(0.2, ge=0, le=1, description="관상 가중치")


class QueryIntent(str, Enum):
    """질문 의도 (가중치 자동 조정용)"""
    GENERAL = "general"            # 일반 운세
    CAREER = "career"              # 직업/사업
    RELATIONSHIP = "relationship"  # 연애/결혼
    FINANCE = "finance"            # 재물/투자
    HEALTH = "health"              # 건강
    TIMING = "timing"              # 시기/택일
    PSYCHOLOGY = "psychology"      # 심리/성격


class SynthesisRequest(BaseModel):
    """통합 분석 요청"""
    # 필수: 사주 정보
    saju_data: SajuRequest = Field(..., description="사주 입력 데이터")

    # 선택: 점성술 정보 (위치 정보 필요)
    astrology_data: Optional[AstrologyRequest] = Field(None, description="점성술 입력 데이터")

    # 선택: 관상 정보 (사진 필요)
    physiognomy_data: Optional[PhysiognomyRequest] = Field(None, description="관상 입력 데이터")

    # 질문 의도 (가중치 자동 조정)
    query_intent: QueryIntent = Field(QueryIntent.GENERAL, description="질문 의도")

    # 사용자 정의 가중치 (선택)
    custom_weights: Optional[AnalysisWeight] = Field(None, description="사용자 정의 가중치")

    # 특정 질문 (LLM 해석용)
    specific_question: Optional[str] = Field(None, description="구체적인 질문")

    class Config:
        json_schema_extra = {
            "example": {
                "saju_data": {
                    "birth_year": 1990,
                    "birth_month": 5,
                    "birth_day": 15,
                    "birth_hour": 14,
                    "birth_minute": 30,
                    "gender": "male",
                    "is_lunar": False
                },
                "query_intent": "career",
                "specific_question": "올해 이직을 해도 될까요?"
            }
        }


class ConflictResolution(BaseModel):
    """상충 해결 정보"""
    has_conflict: bool = Field(..., description="상충 존재 여부")
    conflict_description: Optional[str] = Field(None, description="상충 내용")
    resolution_method: Optional[str] = Field(None, description="해결 방법")
    primary_source: Optional[str] = Field(None, description="우선 적용된 소스")


class AHPScore(BaseModel):
    """AHP (계층화 분석) 점수"""
    saju_score: float = Field(..., ge=0, le=100)
    astrology_score: Optional[float] = Field(None, ge=0, le=100)
    physiognomy_score: Optional[float] = Field(None, ge=0, le=100)
    weighted_total: float = Field(..., ge=0, le=100, description="가중 합산 점수")
    confidence: float = Field(..., ge=0, le=1, description="신뢰도")


class FortuneCategory(BaseModel):
    """운세 카테고리별 결과"""
    category: str = Field(..., description="카테고리 이름")
    score: float = Field(..., ge=0, le=100, description="점수")
    trend: str = Field(..., description="추세 (상승/유지/하락)")
    saju_interpretation: str = Field(..., description="사주 기반 해석")
    astrology_interpretation: Optional[str] = Field(None, description="점성술 기반 해석")
    combined_interpretation: str = Field(..., description="통합 해석")


class SynthesisResponse(BaseModel):
    """통합 분석 응답"""
    # 개별 분석 결과
    saju_result: SajuResponse = Field(..., description="사주 분석 결과")
    astrology_result: Optional[AstrologyResponse] = Field(None, description="점성술 분석 결과")
    physiognomy_result: Optional[PhysiognomyResponse] = Field(None, description="관상 분석 결과")

    # AHP 점수
    ahp_scores: AHPScore = Field(..., description="AHP 분석 점수")

    # 적용된 가중치
    applied_weights: AnalysisWeight = Field(..., description="적용된 가중치")

    # 상충 해결
    conflict_resolution: ConflictResolution = Field(..., description="상충 해결 정보")

    # 카테고리별 운세
    fortune_categories: List[FortuneCategory] = Field(..., description="분야별 운세")

    # 핵심 인사이트
    key_insight: str = Field(..., description="핵심 인사이트 (가장 중요한 메시지)")

    # 상세 해석
    detailed_interpretation: str = Field(..., description="상세 통합 해석")

    # 조언
    advice: List[str] = Field(..., description="실천 조언 목록")

    # 주의 사항
    cautions: List[str] = Field(..., description="주의해야 할 사항")

    # 행운의 요소
    lucky_elements: Dict[str, str] = Field(..., description="행운의 요소 (색상, 방향, 숫자 등)")

    # 질문에 대한 답변 (있는 경우)
    question_answer: Optional[str] = Field(None, description="특정 질문에 대한 답변")

    # 면책 조항
    disclaimer: str = Field(
        default="본 결과는 통계적 분석이며 의학적/법적 조언을 대체하지 않습니다.",
        description="면책 조항"
    )

    # 생성 시각
    generated_at: datetime = Field(default_factory=datetime.now, description="분석 생성 시각")

    class Config:
        json_schema_extra = {
            "example": {
                "saju_result": {},
                "ahp_scores": {
                    "saju_score": 75,
                    "astrology_score": 72,
                    "weighted_total": 73.8,
                    "confidence": 0.85
                },
                "applied_weights": {
                    "saju_weight": 0.6,
                    "astrology_weight": 0.3,
                    "physiognomy_weight": 0.1
                },
                "conflict_resolution": {
                    "has_conflict": False
                },
                "fortune_categories": [],
                "key_insight": "올해는 변화와 성장의 해입니다. 특히 상반기에 중요한 기회가 있습니다.",
                "detailed_interpretation": "사주의 재성과 점성술의 목성 트랜짓이 동시에 활성화되어...",
                "advice": ["새로운 도전을 두려워하지 마세요", "3월에 중요한 결정을 내리세요"],
                "cautions": ["무리한 투자는 피하세요"],
                "lucky_elements": {
                    "색상": "파란색",
                    "방향": "동쪽",
                    "숫자": "3, 8"
                }
            }
        }
