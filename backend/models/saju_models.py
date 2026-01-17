"""사주 (四柱) 관련 Pydantic 모델"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class Gender(str, Enum):
    """성별"""
    MALE = "male"
    FEMALE = "female"


class Element(str, Enum):
    """오행 (五行)"""
    WOOD = "wood"      # 목 (木)
    FIRE = "fire"      # 화 (火)
    EARTH = "earth"    # 토 (土)
    METAL = "metal"    # 금 (金)
    WATER = "water"    # 수 (水)


class HeavenlyStem(str, Enum):
    """천간 (天干)"""
    GAP = "갑"    # 甲
    EUL = "을"    # 乙
    BYEONG = "병"  # 丙
    JEONG = "정"   # 丁
    MU = "무"     # 戊
    GI = "기"     # 己
    GYEONG = "경"  # 庚
    SIN = "신"    # 辛
    IM = "임"     # 壬
    GYE = "계"    # 癸


class EarthlyBranch(str, Enum):
    """지지 (地支)"""
    JA = "자"     # 子 (쥐)
    CHUK = "축"   # 丑 (소)
    IN = "인"     # 寅 (호랑이)
    MYO = "묘"    # 卯 (토끼)
    JIN = "진"    # 辰 (용)
    SA = "사"     # 巳 (뱀)
    O = "오"      # 午 (말)
    MI = "미"     # 未 (양)
    SIN = "신"    # 申 (원숭이)
    YU = "유"     # 酉 (닭)
    SUL = "술"    # 戌 (개)
    HAE = "해"    # 亥 (돼지)


class SajuPillar(BaseModel):
    """사주 기둥 (년/월/일/시)"""
    stem: str = Field(..., description="천간")
    branch: str = Field(..., description="지지")
    stem_element: Element = Field(..., description="천간 오행")
    branch_element: Element = Field(..., description="지지 오행")


class SajuRequest(BaseModel):
    """사주 분석 요청"""
    birth_year: int = Field(..., ge=1900, le=2100, description="출생 연도")
    birth_month: int = Field(..., ge=1, le=12, description="출생 월")
    birth_day: int = Field(..., ge=1, le=31, description="출생 일")
    birth_hour: Optional[int] = Field(None, ge=0, le=23, description="출생 시 (0-23)")
    birth_minute: Optional[int] = Field(None, ge=0, le=59, description="출생 분")
    gender: Gender = Field(..., description="성별")
    is_lunar: bool = Field(False, description="음력 여부")
    location: Optional[str] = Field(None, description="출생 지역 (시간대 보정용)")

    class Config:
        json_schema_extra = {
            "example": {
                "birth_year": 1990,
                "birth_month": 5,
                "birth_day": 15,
                "birth_hour": 14,
                "birth_minute": 30,
                "gender": "male",
                "is_lunar": False,
                "location": "서울"
            }
        }


class TenGod(BaseModel):
    """십신 (十神)"""
    name: str = Field(..., description="십신 이름")
    korean_name: str = Field(..., description="한글 이름")
    meaning: str = Field(..., description="의미/해석")


class DaeunPeriod(BaseModel):
    """대운 기간"""
    start_age: int = Field(..., description="시작 나이")
    end_age: int = Field(..., description="종료 나이")
    stem: str = Field(..., description="천간")
    branch: str = Field(..., description="지지")
    element: Element = Field(..., description="주요 오행")
    interpretation: str = Field(..., description="해석")


class SajuResponse(BaseModel):
    """사주 분석 응답"""
    # 사주팔자
    year_pillar: SajuPillar = Field(..., description="년주")
    month_pillar: SajuPillar = Field(..., description="월주")
    day_pillar: SajuPillar = Field(..., description="일주")
    hour_pillar: Optional[SajuPillar] = Field(None, description="시주 (시간 입력 시)")

    # 오행 분석
    element_balance: dict = Field(..., description="오행 균형 (각 오행별 개수)")
    dominant_element: Element = Field(..., description="가장 강한 오행")
    weak_element: Element = Field(..., description="가장 약한 오행")

    # 용신/기신
    yongsin: Element = Field(..., description="용신 (필요한 오행)")
    gisin: Element = Field(..., description="기신 (피해야 할 오행)")

    # 십신
    ten_gods: List[TenGod] = Field(..., description="십신 분석")

    # 대운
    daeun: List[DaeunPeriod] = Field(..., description="대운 (10년 주기)")

    # 올해 운세
    yearly_fortune: str = Field(..., description="세운 (올해 운세)")

    # 종합 해석
    summary: str = Field(..., description="종합 해석")

    class Config:
        json_schema_extra = {
            "example": {
                "year_pillar": {"stem": "경", "branch": "오", "stem_element": "metal", "branch_element": "fire"},
                "month_pillar": {"stem": "신", "branch": "사", "stem_element": "metal", "branch_element": "fire"},
                "day_pillar": {"stem": "갑", "branch": "자", "stem_element": "wood", "branch_element": "water"},
                "hour_pillar": {"stem": "병", "branch": "인", "stem_element": "fire", "branch_element": "wood"},
                "element_balance": {"wood": 2, "fire": 3, "earth": 1, "metal": 2, "water": 1},
                "dominant_element": "fire",
                "weak_element": "earth",
                "yongsin": "water",
                "gisin": "fire",
                "ten_gods": [],
                "daeun": [],
                "yearly_fortune": "올해는 재물운이 상승하는 해입니다.",
                "summary": "화(火) 기운이 강한 사주로, 수(水) 기운의 보완이 필요합니다."
            }
        }
