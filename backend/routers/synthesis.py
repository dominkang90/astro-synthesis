"""통합 분석 (Synthesis) API 라우터"""

from fastapi import APIRouter, HTTPException
from typing import Optional
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.synthesis_models import (
    SynthesisRequest, SynthesisResponse,
    AnalysisWeight, QueryIntent, AHPScore
)
from services.synthesis_service import SynthesisService

router = APIRouter()
synthesis_service = SynthesisService()


@router.post("/analyze", response_model=SynthesisResponse)
async def analyze_synthesis(request: SynthesisRequest):
    """
    통합 역학 분석

    - 사주, 점성술, 관상을 AHP 알고리즘으로 통합
    - 상충되는 결과는 가중치에 따라 해결
    - 질문 의도에 따라 자동 가중치 조정

    **가중치 로직:**
    - 일반 운세: 사주(0.4), 점성술(0.4), 관상(0.2)
    - 심리/성격: 점성술(0.5), 사주(0.3), 관상(0.2)
    - 시기/택일: 사주(0.6), 점성술(0.3), 관상(0.1)
    - 재물: 사주(0.4), 점성술(0.3), 관상(0.3)
    """
    try:
        result = synthesis_service.analyze(request)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"분석 중 오류: {str(e)}")


@router.get("/weights/{intent}")
async def get_recommended_weights(intent: QueryIntent):
    """
    질문 의도별 권장 가중치 조회

    - AHP 분석에 사용되는 기본 가중치 반환
    """
    weights = {
        QueryIntent.GENERAL: {
            "saju": 0.4,
            "astrology": 0.4,
            "physiognomy": 0.2,
            "description": "일반적인 운세 분석"
        },
        QueryIntent.CAREER: {
            "saju": 0.4,
            "astrology": 0.35,
            "physiognomy": 0.25,
            "description": "직업/사업 관련 분석 - 관록궁 강조"
        },
        QueryIntent.RELATIONSHIP: {
            "saju": 0.35,
            "astrology": 0.45,
            "physiognomy": 0.2,
            "description": "연애/결혼 관련 분석 - 금성 위치 강조"
        },
        QueryIntent.FINANCE: {
            "saju": 0.4,
            "astrology": 0.3,
            "physiognomy": 0.3,
            "description": "재물/투자 관련 분석 - 재백궁 강조"
        },
        QueryIntent.HEALTH: {
            "saju": 0.35,
            "astrology": 0.35,
            "physiognomy": 0.3,
            "description": "건강 관련 분석 - 질액궁 강조"
        },
        QueryIntent.TIMING: {
            "saju": 0.6,
            "astrology": 0.35,
            "physiognomy": 0.05,
            "description": "시기/택일 분석 - 대운/세운 강조"
        },
        QueryIntent.PSYCHOLOGY: {
            "saju": 0.3,
            "astrology": 0.5,
            "physiognomy": 0.2,
            "description": "심리/성격 분석 - 달/수성 위치 강조"
        }
    }

    return weights.get(intent)


@router.post("/quick-analysis")
async def quick_analysis(
    birth_year: int,
    birth_month: int,
    birth_day: int,
    birth_hour: Optional[int] = None,
    gender: str = "male"
):
    """
    간편 분석 (사주 기반)

    - 최소 정보로 빠른 분석
    - 사주 분석만 수행 (점성술/관상 제외)
    """
    from models.saju_models import SajuRequest

    try:
        request = SynthesisRequest(
            saju_data=SajuRequest(
                birth_year=birth_year,
                birth_month=birth_month,
                birth_day=birth_day,
                birth_hour=birth_hour,
                gender=gender
            ),
            query_intent=QueryIntent.GENERAL
        )

        result = synthesis_service.quick_analyze(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ask")
async def ask_question(
    birth_year: int,
    birth_month: int,
    birth_day: int,
    gender: str,
    question: str,
    birth_hour: Optional[int] = None
):
    """
    질문 기반 분석

    - 자연어 질문을 분석하여 적절한 가중치 자동 적용
    - LLM을 활용한 맞춤형 답변 생성
    """
    from models.saju_models import SajuRequest

    # 질문 의도 자동 분류 (간단한 키워드 기반)
    intent = QueryIntent.GENERAL

    career_keywords = ["직장", "이직", "취업", "사업", "승진", "직업"]
    relationship_keywords = ["연애", "결혼", "이별", "배우자", "인연", "사랑"]
    finance_keywords = ["재물", "돈", "투자", "부동산", "주식", "사업"]
    health_keywords = ["건강", "질병", "아픔", "컨디션"]
    timing_keywords = ["언제", "시기", "때", "택일", "날짜"]

    question_lower = question.lower()

    if any(kw in question_lower for kw in career_keywords):
        intent = QueryIntent.CAREER
    elif any(kw in question_lower for kw in relationship_keywords):
        intent = QueryIntent.RELATIONSHIP
    elif any(kw in question_lower for kw in finance_keywords):
        intent = QueryIntent.FINANCE
    elif any(kw in question_lower for kw in health_keywords):
        intent = QueryIntent.HEALTH
    elif any(kw in question_lower for kw in timing_keywords):
        intent = QueryIntent.TIMING

    try:
        request = SynthesisRequest(
            saju_data=SajuRequest(
                birth_year=birth_year,
                birth_month=birth_month,
                birth_day=birth_day,
                birth_hour=birth_hour,
                gender=gender
            ),
            query_intent=intent,
            specific_question=question
        )

        result = synthesis_service.analyze_with_question(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ahp-explanation")
async def explain_ahp():
    """
    AHP (계층화 분석) 알고리즘 설명

    - 통합 분석에 사용되는 AHP 방법론 설명
    """
    return {
        "name": "AHP (Analytic Hierarchy Process)",
        "description": "계층화 분석법으로, 복잡한 의사결정 문제를 체계적으로 분석하는 방법",
        "how_it_works": [
            "1. 목표 설정: 통합 운세 분석",
            "2. 기준 수립: 사주, 점성술, 관상 각각의 분석 결과",
            "3. 가중치 부여: 질문 의도에 따른 동적 가중치",
            "4. 점수 계산: 각 기준별 점수 × 가중치",
            "5. 통합: 가중 합산으로 최종 결과 도출"
        ],
        "conflict_resolution": {
            "method": "가중치 기반 우선순위",
            "description": "상반된 결과 발생 시, 가중치가 높은 분석 결과를 우선 노출하고, 낮은 결과는 '보완적 조언'으로 제공"
        },
        "advantages": [
            "주관적 판단을 정량화",
            "일관성 있는 분석 결과",
            "질문 맥락에 맞는 유연한 해석"
        ]
    }
