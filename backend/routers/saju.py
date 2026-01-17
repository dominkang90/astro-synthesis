"""사주 (四柱) API 라우터"""

from fastapi import APIRouter, HTTPException
from typing import Optional
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.saju_models import (
    SajuRequest, SajuResponse, SajuPillar,
    Element, TenGod, DaeunPeriod
)
from services.saju_service import SajuService

router = APIRouter()
saju_service = SajuService()


@router.post("/analyze", response_model=SajuResponse)
async def analyze_saju(request: SajuRequest):
    """
    사주팔자 분석

    - 생년월일시를 기반으로 사주팔자 계산
    - 오행 균형, 용신/기신, 십신 분석
    - 대운 및 세운(올해 운세) 제공
    """
    try:
        result = saju_service.analyze(request)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"분석 중 오류 발생: {str(e)}")


@router.get("/element/{element}")
async def get_element_info(element: Element):
    """
    오행 정보 조회

    - 특정 오행(목/화/토/금/수)의 상세 정보 반환
    """
    element_info = {
        Element.WOOD: {
            "korean": "목(木)",
            "direction": "동쪽",
            "season": "봄",
            "color": "청색/녹색",
            "organ": "간/담",
            "personality": "인자함, 성장, 창의성",
            "generates": "화(火)",
            "controls": "토(土)",
            "controlled_by": "금(金)"
        },
        Element.FIRE: {
            "korean": "화(火)",
            "direction": "남쪽",
            "season": "여름",
            "color": "적색",
            "organ": "심장/소장",
            "personality": "열정, 예절, 활동성",
            "generates": "토(土)",
            "controls": "금(金)",
            "controlled_by": "수(水)"
        },
        Element.EARTH: {
            "korean": "토(土)",
            "direction": "중앙",
            "season": "환절기",
            "color": "황색",
            "organ": "비장/위장",
            "personality": "신뢰, 안정, 중재",
            "generates": "금(金)",
            "controls": "수(水)",
            "controlled_by": "목(木)"
        },
        Element.METAL: {
            "korean": "금(金)",
            "direction": "서쪽",
            "season": "가을",
            "color": "백색",
            "organ": "폐/대장",
            "personality": "의리, 결단력, 정의",
            "generates": "수(水)",
            "controls": "목(木)",
            "controlled_by": "화(火)"
        },
        Element.WATER: {
            "korean": "수(水)",
            "direction": "북쪽",
            "season": "겨울",
            "color": "흑색",
            "organ": "신장/방광",
            "personality": "지혜, 유연성, 적응력",
            "generates": "목(木)",
            "controls": "화(火)",
            "controlled_by": "토(土)"
        }
    }

    return element_info.get(element)


@router.get("/yearly-fortune/{year}")
async def get_yearly_fortune(
    year: int,
    birth_year: int,
    birth_month: int,
    birth_day: int,
    gender: str
):
    """
    특정 연도 운세 (세운) 조회

    - 해당 연도의 천간/지지와 사주의 상호작용 분석
    """
    try:
        request = SajuRequest(
            birth_year=birth_year,
            birth_month=birth_month,
            birth_day=birth_day,
            gender=gender
        )
        fortune = saju_service.get_yearly_fortune(request, year)
        return {"year": year, "fortune": fortune}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/compatibility")
async def check_compatibility(
    person1_year: int,
    person1_month: int,
    person1_day: int,
    person1_gender: str,
    person2_year: int,
    person2_month: int,
    person2_day: int,
    person2_gender: str
):
    """
    궁합 분석

    - 두 사람의 사주를 비교하여 궁합 점수 및 해석 제공
    """
    try:
        compatibility = saju_service.check_compatibility(
            SajuRequest(
                birth_year=person1_year,
                birth_month=person1_month,
                birth_day=person1_day,
                gender=person1_gender
            ),
            SajuRequest(
                birth_year=person2_year,
                birth_month=person2_month,
                birth_day=person2_day,
                gender=person2_gender
            )
        )
        return compatibility
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
