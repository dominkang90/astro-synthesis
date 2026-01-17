"""점성술 (Astrology) 관련 Pydantic 모델"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ZodiacSign(str, Enum):
    """황도 12궁"""
    ARIES = "aries"          # 양자리
    TAURUS = "taurus"        # 황소자리
    GEMINI = "gemini"        # 쌍둥이자리
    CANCER = "cancer"        # 게자리
    LEO = "leo"              # 사자자리
    VIRGO = "virgo"          # 처녀자리
    LIBRA = "libra"          # 천칭자리
    SCORPIO = "scorpio"      # 전갈자리
    SAGITTARIUS = "sagittarius"  # 궁수자리
    CAPRICORN = "capricorn"  # 염소자리
    AQUARIUS = "aquarius"    # 물병자리
    PISCES = "pisces"        # 물고기자리


class Planet(str, Enum):
    """행성"""
    SUN = "sun"          # 태양
    MOON = "moon"        # 달
    MERCURY = "mercury"  # 수성
    VENUS = "venus"      # 금성
    MARS = "mars"        # 화성
    JUPITER = "jupiter"  # 목성
    SATURN = "saturn"    # 토성
    URANUS = "uranus"    # 천왕성
    NEPTUNE = "neptune"  # 해왕성
    PLUTO = "pluto"      # 명왕성


class HouseSystem(str, Enum):
    """하우스 시스템"""
    PLACIDUS = "placidus"
    WHOLE_SIGN = "whole_sign"
    KOCH = "koch"
    REGIOMONTANUS = "regiomontanus"
    EQUAL = "equal"
    PORPHYRY = "porphyry"


class AspectType(str, Enum):
    """아스펙트 종류"""
    CONJUNCTION = "conjunction"  # 합 (0°)
    OPPOSITION = "opposition"    # 충 (180°)
    TRINE = "trine"             # 삼합 (120°)
    SQUARE = "square"           # 사각 (90°)
    SEXTILE = "sextile"         # 육합 (60°)


class AstrologyRequest(BaseModel):
    """점성술 차트 요청"""
    birth_year: int = Field(..., ge=1900, le=2100)
    birth_month: int = Field(..., ge=1, le=12)
    birth_day: int = Field(..., ge=1, le=31)
    birth_hour: int = Field(..., ge=0, le=23)
    birth_minute: int = Field(..., ge=0, le=59)
    latitude: float = Field(..., ge=-90, le=90, description="출생지 위도")
    longitude: float = Field(..., ge=-180, le=180, description="출생지 경도")
    timezone: str = Field("Asia/Seoul", description="시간대")
    house_system: HouseSystem = Field(HouseSystem.PLACIDUS, description="하우스 시스템")

    class Config:
        json_schema_extra = {
            "example": {
                "birth_year": 1990,
                "birth_month": 5,
                "birth_day": 15,
                "birth_hour": 14,
                "birth_minute": 30,
                "latitude": 37.5665,
                "longitude": 126.9780,
                "timezone": "Asia/Seoul",
                "house_system": "placidus"
            }
        }


class PlanetPosition(BaseModel):
    """행성 위치"""
    planet: Planet
    sign: ZodiacSign
    degree: float = Field(..., ge=0, lt=360, description="황경 (도)")
    sign_degree: float = Field(..., ge=0, lt=30, description="별자리 내 위치 (도)")
    house: int = Field(..., ge=1, le=12, description="하우스")
    is_retrograde: bool = Field(False, description="역행 여부")


class Aspect(BaseModel):
    """아스펙트 (행성 간 각도)"""
    planet1: Planet
    planet2: Planet
    aspect_type: AspectType
    degree: float = Field(..., description="실제 각도")
    orb: float = Field(..., description="오브 (허용 오차)")
    is_applying: bool = Field(..., description="적용 중 여부")


class HouseCusp(BaseModel):
    """하우스 커스프"""
    house: int = Field(..., ge=1, le=12)
    sign: ZodiacSign
    degree: float


class AstrologyResponse(BaseModel):
    """점성술 차트 응답"""
    # 기본 정보
    sun_sign: ZodiacSign = Field(..., description="태양 별자리")
    moon_sign: ZodiacSign = Field(..., description="달 별자리")
    rising_sign: ZodiacSign = Field(..., description="상승 별자리 (ASC)")

    # 행성 위치
    planets: List[PlanetPosition] = Field(..., description="행성 위치 목록")

    # 하우스
    houses: List[HouseCusp] = Field(..., description="하우스 커스프")

    # 아스펙트
    aspects: List[Aspect] = Field(..., description="메이저 아스펙트 목록")

    # Dignities (행성 위계)
    dignities: dict = Field(..., description="행성 품위 (domicile, exaltation, etc.)")

    # 차트 SVG
    chart_svg: Optional[str] = Field(None, description="천궁도 SVG")

    # 해석
    personality_summary: str = Field(..., description="성격 요약")
    life_themes: List[str] = Field(..., description="주요 인생 테마")

    class Config:
        json_schema_extra = {
            "example": {
                "sun_sign": "taurus",
                "moon_sign": "scorpio",
                "rising_sign": "virgo",
                "planets": [],
                "houses": [],
                "aspects": [],
                "dignities": {},
                "chart_svg": None,
                "personality_summary": "태양이 황소자리에 위치하여 안정을 추구하는 성향입니다.",
                "life_themes": ["재물", "관계", "자아실현"]
            }
        }


class TransitRequest(BaseModel):
    """트랜짓 (운세) 요청"""
    natal_chart: AstrologyRequest = Field(..., description="출생 차트 정보")
    transit_date: datetime = Field(..., description="조회할 날짜")


class TransitResponse(BaseModel):
    """트랜짓 (운세) 응답"""
    date: datetime
    transiting_planets: List[PlanetPosition]
    transit_aspects: List[Aspect] = Field(..., description="트랜짓 아스펙트 (현재 행성 vs 출생 행성)")
    interpretation: str = Field(..., description="트랜짓 해석")
    highlights: List[str] = Field(..., description="주요 영향")
