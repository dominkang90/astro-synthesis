"""점성술 (Astrology) API 라우터"""

from fastapi import APIRouter, HTTPException
from typing import Optional
from datetime import datetime
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.astrology_models import (
    AstrologyRequest, AstrologyResponse,
    TransitRequest, TransitResponse,
    ZodiacSign, Planet, HouseSystem
)
from services.astrology_service import AstrologyService

router = APIRouter()
astrology_service = AstrologyService()


@router.post("/natal-chart", response_model=AstrologyResponse)
async def create_natal_chart(request: AstrologyRequest):
    """
    출생 차트 (Natal Chart) 생성

    - Swiss Ephemeris 기반 정밀 천문 계산
    - 행성 위치, 하우스, 아스펙트 분석
    - 성격 및 인생 테마 해석
    """
    try:
        result = astrology_service.create_natal_chart(request)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"차트 생성 중 오류: {str(e)}")


@router.post("/transit", response_model=TransitResponse)
async def get_transit(request: TransitRequest):
    """
    트랜짓 (운세) 분석

    - 현재 행성 위치와 출생 차트의 상호작용 분석
    - 특정 날짜의 운세 예측
    """
    try:
        result = astrology_service.get_transit(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/zodiac/{sign}")
async def get_zodiac_info(sign: ZodiacSign):
    """
    별자리 정보 조회

    - 특정 별자리의 상세 정보 반환
    """
    zodiac_info = {
        ZodiacSign.ARIES: {
            "korean": "양자리",
            "symbol": "♈",
            "element": "불",
            "modality": "활동궁",
            "ruling_planet": "화성",
            "date_range": "3/21 - 4/19",
            "traits": ["리더십", "용기", "열정", "독립적"],
            "compatible_signs": ["사자자리", "궁수자리", "쌍둥이자리"]
        },
        ZodiacSign.TAURUS: {
            "korean": "황소자리",
            "symbol": "♉",
            "element": "흙",
            "modality": "고정궁",
            "ruling_planet": "금성",
            "date_range": "4/20 - 5/20",
            "traits": ["안정", "인내", "실용적", "감각적"],
            "compatible_signs": ["처녀자리", "염소자리", "게자리"]
        },
        ZodiacSign.GEMINI: {
            "korean": "쌍둥이자리",
            "symbol": "♊",
            "element": "공기",
            "modality": "변동궁",
            "ruling_planet": "수성",
            "date_range": "5/21 - 6/20",
            "traits": ["호기심", "적응력", "소통", "다재다능"],
            "compatible_signs": ["천칭자리", "물병자리", "양자리"]
        },
        ZodiacSign.CANCER: {
            "korean": "게자리",
            "symbol": "♋",
            "element": "물",
            "modality": "활동궁",
            "ruling_planet": "달",
            "date_range": "6/21 - 7/22",
            "traits": ["감성적", "보호적", "직관적", "가정적"],
            "compatible_signs": ["전갈자리", "물고기자리", "황소자리"]
        },
        ZodiacSign.LEO: {
            "korean": "사자자리",
            "symbol": "♌",
            "element": "불",
            "modality": "고정궁",
            "ruling_planet": "태양",
            "date_range": "7/23 - 8/22",
            "traits": ["자신감", "창의성", "관대함", "카리스마"],
            "compatible_signs": ["양자리", "궁수자리", "쌍둥이자리"]
        },
        ZodiacSign.VIRGO: {
            "korean": "처녀자리",
            "symbol": "♍",
            "element": "흙",
            "modality": "변동궁",
            "ruling_planet": "수성",
            "date_range": "8/23 - 9/22",
            "traits": ["분석적", "세심함", "실용적", "겸손"],
            "compatible_signs": ["황소자리", "염소자리", "게자리"]
        },
        ZodiacSign.LIBRA: {
            "korean": "천칭자리",
            "symbol": "♎",
            "element": "공기",
            "modality": "활동궁",
            "ruling_planet": "금성",
            "date_range": "9/23 - 10/22",
            "traits": ["조화", "공정함", "외교적", "우아함"],
            "compatible_signs": ["쌍둥이자리", "물병자리", "사자자리"]
        },
        ZodiacSign.SCORPIO: {
            "korean": "전갈자리",
            "symbol": "♏",
            "element": "물",
            "modality": "고정궁",
            "ruling_planet": "명왕성/화성",
            "date_range": "10/23 - 11/21",
            "traits": ["열정적", "통찰력", "결단력", "비밀스러움"],
            "compatible_signs": ["게자리", "물고기자리", "처녀자리"]
        },
        ZodiacSign.SAGITTARIUS: {
            "korean": "궁수자리",
            "symbol": "♐",
            "element": "불",
            "modality": "변동궁",
            "ruling_planet": "목성",
            "date_range": "11/22 - 12/21",
            "traits": ["낙관적", "모험심", "철학적", "자유로움"],
            "compatible_signs": ["양자리", "사자자리", "천칭자리"]
        },
        ZodiacSign.CAPRICORN: {
            "korean": "염소자리",
            "symbol": "♑",
            "element": "흙",
            "modality": "활동궁",
            "ruling_planet": "토성",
            "date_range": "12/22 - 1/19",
            "traits": ["야망", "책임감", "인내심", "현실적"],
            "compatible_signs": ["황소자리", "처녀자리", "전갈자리"]
        },
        ZodiacSign.AQUARIUS: {
            "korean": "물병자리",
            "symbol": "♒",
            "element": "공기",
            "modality": "고정궁",
            "ruling_planet": "천왕성/토성",
            "date_range": "1/20 - 2/18",
            "traits": ["독창적", "인도주의", "독립적", "진보적"],
            "compatible_signs": ["쌍둥이자리", "천칭자리", "궁수자리"]
        },
        ZodiacSign.PISCES: {
            "korean": "물고기자리",
            "symbol": "♓",
            "element": "물",
            "modality": "변동궁",
            "ruling_planet": "해왕성/목성",
            "date_range": "2/19 - 3/20",
            "traits": ["직관적", "공감능력", "예술적", "영적"],
            "compatible_signs": ["게자리", "전갈자리", "황소자리"]
        }
    }

    return zodiac_info.get(sign)


@router.get("/planet/{planet}")
async def get_planet_info(planet: Planet):
    """
    행성 정보 조회

    - 특정 행성의 점성술적 의미 반환
    """
    planet_info = {
        Planet.SUN: {
            "korean": "태양",
            "symbol": "☉",
            "meaning": "자아, 정체성, 생명력",
            "rules": "사자자리",
            "cycle": "1년"
        },
        Planet.MOON: {
            "korean": "달",
            "symbol": "☽",
            "meaning": "감정, 본능, 무의식",
            "rules": "게자리",
            "cycle": "28일"
        },
        Planet.MERCURY: {
            "korean": "수성",
            "symbol": "☿",
            "meaning": "소통, 지성, 이동",
            "rules": "쌍둥이자리, 처녀자리",
            "cycle": "88일"
        },
        Planet.VENUS: {
            "korean": "금성",
            "symbol": "♀",
            "meaning": "사랑, 아름다움, 가치관",
            "rules": "황소자리, 천칭자리",
            "cycle": "225일"
        },
        Planet.MARS: {
            "korean": "화성",
            "symbol": "♂",
            "meaning": "행동, 에너지, 욕망",
            "rules": "양자리, 전갈자리",
            "cycle": "687일"
        },
        Planet.JUPITER: {
            "korean": "목성",
            "symbol": "♃",
            "meaning": "확장, 행운, 지혜",
            "rules": "궁수자리, 물고기자리",
            "cycle": "12년"
        },
        Planet.SATURN: {
            "korean": "토성",
            "symbol": "♄",
            "meaning": "제한, 책임, 구조",
            "rules": "염소자리, 물병자리",
            "cycle": "29년"
        },
        Planet.URANUS: {
            "korean": "천왕성",
            "symbol": "♅",
            "meaning": "혁신, 변화, 독창성",
            "rules": "물병자리",
            "cycle": "84년"
        },
        Planet.NEPTUNE: {
            "korean": "해왕성",
            "symbol": "♆",
            "meaning": "영감, 환상, 영성",
            "rules": "물고기자리",
            "cycle": "165년"
        },
        Planet.PLUTO: {
            "korean": "명왕성",
            "symbol": "♇",
            "meaning": "변환, 재생, 권력",
            "rules": "전갈자리",
            "cycle": "248년"
        }
    }

    return planet_info.get(planet)


@router.get("/house-systems")
async def get_house_systems():
    """
    사용 가능한 하우스 시스템 목록
    """
    return {
        "systems": [
            {"id": "placidus", "name": "플라시두스", "description": "가장 널리 사용되는 시스템"},
            {"id": "whole_sign", "name": "홀 사인", "description": "고전 점성술에서 사용"},
            {"id": "koch", "name": "코흐", "description": "플라시두스의 변형"},
            {"id": "regiomontanus", "name": "레지오몬타누스", "description": "호라리 점성술에 적합"},
            {"id": "equal", "name": "이퀄", "description": "ASC에서 30도씩 균등 분할"},
            {"id": "porphyry", "name": "포르피리", "description": "극지방에서도 안정적"}
        ],
        "default": "placidus"
    }
