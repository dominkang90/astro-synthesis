"""
Astro-Synthesis Vercel Serverless API
AI 통합 역학 플랫폼 - Vercel 서버리스 함수
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum
import os
import json

# Google Gemini
import google.generativeai as genai

# Gemini API 설정
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI(
    title="Astro-Synthesis API",
    description="AI 통합 역학 플랫폼 - 사주, 점성술, 관상 분석 API",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===== Enums =====
class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"


class Element(str, Enum):
    WOOD = "wood"
    FIRE = "fire"
    EARTH = "earth"
    METAL = "metal"
    WATER = "water"


class QueryIntent(str, Enum):
    GENERAL = "general"
    CAREER = "career"
    RELATIONSHIP = "relationship"
    FINANCE = "finance"
    HEALTH = "health"
    TIMING = "timing"
    PSYCHOLOGY = "psychology"


# ===== Models =====
class SajuRequest(BaseModel):
    birth_year: int = Field(..., ge=1900, le=2100)
    birth_month: int = Field(..., ge=1, le=12)
    birth_day: int = Field(..., ge=1, le=31)
    birth_hour: Optional[int] = Field(None, ge=0, le=23)
    gender: str = Field(default="male")
    is_lunar: bool = Field(default=False)


class SajuPillar(BaseModel):
    stem: str
    branch: str
    stem_element: str
    branch_element: str


class QuickAnalysisRequest(BaseModel):
    birth_year: int
    birth_month: int
    birth_day: int
    birth_hour: Optional[int] = None
    gender: str = "male"
    question: Optional[str] = None


# ===== 사주 계산 엔진 =====
class SajuCalculator:
    """만세력 기반 사주 계산"""

    HEAVENLY_STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"]
    EARTHLY_BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"]

    STEM_ELEMENTS = {
        "갑": "wood", "을": "wood",
        "병": "fire", "정": "fire",
        "무": "earth", "기": "earth",
        "경": "metal", "신": "metal",
        "임": "water", "계": "water"
    }

    BRANCH_ELEMENTS = {
        "자": "water", "축": "earth",
        "인": "wood", "묘": "wood",
        "진": "earth", "사": "fire",
        "오": "fire", "미": "earth",
        "신": "metal", "유": "metal",
        "술": "earth", "해": "water"
    }

    BRANCH_ANIMALS = {
        "자": "쥐", "축": "소", "인": "호랑이", "묘": "토끼",
        "진": "용", "사": "뱀", "오": "말", "미": "양",
        "신": "원숭이", "유": "닭", "술": "개", "해": "돼지"
    }

    ELEMENT_KOREAN = {
        "wood": "목(木)", "fire": "화(火)", "earth": "토(土)",
        "metal": "금(金)", "water": "수(水)"
    }

    # 절기 기반 월 시작일 (근사값)
    SOLAR_TERMS = {
        1: 6, 2: 4, 3: 6, 4: 5, 5: 6, 6: 6,
        7: 7, 8: 8, 9: 8, 10: 8, 11: 7, 12: 7
    }

    def calculate_year_pillar(self, year: int, month: int, day: int) -> dict:
        """년주 계산 - 입춘 기준"""
        # 입춘 전이면 전년도
        if month < 2 or (month == 2 and day < 4):
            year -= 1

        stem_idx = (year - 4) % 10
        branch_idx = (year - 4) % 12

        stem = self.HEAVENLY_STEMS[stem_idx]
        branch = self.EARTHLY_BRANCHES[branch_idx]

        return {
            "stem": stem,
            "branch": branch,
            "stem_element": self.STEM_ELEMENTS[stem],
            "branch_element": self.BRANCH_ELEMENTS[branch],
            "animal": self.BRANCH_ANIMALS[branch]
        }

    def calculate_month_pillar(self, year: int, month: int, day: int) -> dict:
        """월주 계산 - 절기 기준"""
        # 절기 이전이면 전월
        if day < self.SOLAR_TERMS.get(month, 6):
            month -= 1
            if month == 0:
                month = 12
                year -= 1

        # 년간에 따른 월간 계산
        year_stem_idx = (year - 4) % 10
        month_stem_base = (year_stem_idx % 5) * 2
        month_stem_idx = (month_stem_base + month - 1) % 10
        month_branch_idx = (month + 1) % 12

        stem = self.HEAVENLY_STEMS[month_stem_idx]
        branch = self.EARTHLY_BRANCHES[month_branch_idx]

        return {
            "stem": stem,
            "branch": branch,
            "stem_element": self.STEM_ELEMENTS[stem],
            "branch_element": self.BRANCH_ELEMENTS[branch]
        }

    def calculate_day_pillar(self, year: int, month: int, day: int) -> dict:
        """일주 계산"""
        # 기준일: 1900년 1월 1일 = 갑자일
        from datetime import date
        base_date = date(1900, 1, 1)
        target_date = date(year, month, day)
        diff_days = (target_date - base_date).days

        stem_idx = diff_days % 10
        branch_idx = diff_days % 12

        stem = self.HEAVENLY_STEMS[stem_idx]
        branch = self.EARTHLY_BRANCHES[branch_idx]

        return {
            "stem": stem,
            "branch": branch,
            "stem_element": self.STEM_ELEMENTS[stem],
            "branch_element": self.BRANCH_ELEMENTS[branch]
        }

    def calculate_hour_pillar(self, day_stem: str, hour: int) -> dict:
        """시주 계산"""
        # 시간을 지지로 변환 (23-01:자, 01-03:축, ...)
        hour_branch_idx = ((hour + 1) // 2) % 12

        # 일간에 따른 시간 천간 계산
        day_stem_idx = self.HEAVENLY_STEMS.index(day_stem)
        hour_stem_base = (day_stem_idx % 5) * 2
        hour_stem_idx = (hour_stem_base + hour_branch_idx) % 10

        stem = self.HEAVENLY_STEMS[hour_stem_idx]
        branch = self.EARTHLY_BRANCHES[hour_branch_idx]

        return {
            "stem": stem,
            "branch": branch,
            "stem_element": self.STEM_ELEMENTS[stem],
            "branch_element": self.BRANCH_ELEMENTS[branch]
        }

    def analyze_elements(self, pillars: list) -> dict:
        """오행 분석"""
        element_count = {"wood": 0, "fire": 0, "earth": 0, "metal": 0, "water": 0}

        for pillar in pillars:
            if pillar:
                element_count[pillar["stem_element"]] += 1
                element_count[pillar["branch_element"]] += 1

        dominant = max(element_count, key=element_count.get)
        weak = min(element_count, key=element_count.get)

        # 용신 결정 (약한 오행 보완)
        generating_cycle = {
            "wood": "water", "fire": "wood", "earth": "fire",
            "metal": "earth", "water": "metal"
        }

        return {
            "balance": element_count,
            "dominant": dominant,
            "weak": weak,
            "yongsin": generating_cycle[weak],
            "gisin": dominant
        }

    def get_full_saju(self, year: int, month: int, day: int, hour: Optional[int] = None) -> dict:
        """전체 사주 계산"""
        year_pillar = self.calculate_year_pillar(year, month, day)
        month_pillar = self.calculate_month_pillar(year, month, day)
        day_pillar = self.calculate_day_pillar(year, month, day)

        hour_pillar = None
        if hour is not None:
            hour_pillar = self.calculate_hour_pillar(day_pillar["stem"], hour)

        pillars = [year_pillar, month_pillar, day_pillar, hour_pillar]
        elements = self.analyze_elements(pillars)

        return {
            "year_pillar": year_pillar,
            "month_pillar": month_pillar,
            "day_pillar": day_pillar,
            "hour_pillar": hour_pillar,
            "elements": elements
        }


# 계산기 인스턴스
saju_calc = SajuCalculator()


# ===== AI 해석 =====
async def get_ai_interpretation(saju_data: dict, question: Optional[str] = None) -> dict:
    """Gemini를 사용한 AI 해석"""

    if not GEMINI_API_KEY:
        return generate_fallback_interpretation(saju_data, question)

    try:
        model = genai.GenerativeModel('gemini-pro')

        prompt = f"""당신은 전문 역학가입니다. 다음 사주 정보를 바탕으로 운세를 분석해주세요.

## 사주 정보
- 년주: {saju_data['year_pillar']['stem']}{saju_data['year_pillar']['branch']}
- 월주: {saju_data['month_pillar']['stem']}{saju_data['month_pillar']['branch']}
- 일주: {saju_data['day_pillar']['stem']}{saju_data['day_pillar']['branch']}
{f"- 시주: {saju_data['hour_pillar']['stem']}{saju_data['hour_pillar']['branch']}" if saju_data.get('hour_pillar') else "- 시주: 미입력"}

## 오행 분석
- 오행 분포: {saju_data['elements']['balance']}
- 가장 강한 오행: {saju_data['elements']['dominant']}
- 가장 약한 오행: {saju_data['elements']['weak']}
- 용신(필요한 오행): {saju_data['elements']['yongsin']}

{f"## 질문: {question}" if question else ""}

다음 JSON 형식으로 응답해주세요:
{{
    "key_insight": "핵심 인사이트 (1-2문장)",
    "personality": "성격 특성 (2-3문장)",
    "fortune_2024": "2024년 운세 (2-3문장)",
    "career": "직업/재물 운 (2-3문장)",
    "relationship": "인간관계/연애 운 (2-3문장)",
    "advice": ["조언1", "조언2", "조언3"],
    "lucky_elements": {{
        "color": "행운의 색상",
        "direction": "행운의 방향",
        "number": "행운의 숫자"
    }}
    {f', "question_answer": "질문에 대한 답변"' if question else ""}
}}"""

        response = model.generate_content(prompt)

        # JSON 파싱 시도
        try:
            response_text = response.text
            # JSON 부분 추출
            start = response_text.find('{')
            end = response_text.rfind('}') + 1
            if start != -1 and end > start:
                json_str = response_text[start:end]
                return json.loads(json_str)
        except:
            pass

        return generate_fallback_interpretation(saju_data, question)

    except Exception as e:
        print(f"Gemini API Error: {e}")
        return generate_fallback_interpretation(saju_data, question)


def generate_fallback_interpretation(saju_data: dict, question: Optional[str] = None) -> dict:
    """AI 없이 기본 해석 생성"""

    elements = saju_data['elements']
    dominant = elements['dominant']
    yongsin = elements['yongsin']

    element_korean = {
        "wood": "목(木)", "fire": "화(火)", "earth": "토(土)",
        "metal": "금(金)", "water": "수(水)"
    }

    element_traits = {
        "wood": "창의적이고 성장 지향적",
        "fire": "열정적이고 활동적",
        "earth": "안정적이고 신뢰감 있는",
        "metal": "결단력 있고 정의로운",
        "water": "지혜롭고 유연한"
    }

    element_colors = {
        "wood": "녹색/청색", "fire": "빨간색/주황색",
        "earth": "노란색/갈색", "metal": "흰색/금색", "water": "검정색/파란색"
    }

    element_directions = {
        "wood": "동쪽", "fire": "남쪽", "earth": "중앙",
        "metal": "서쪽", "water": "북쪽"
    }

    element_numbers = {
        "wood": "3, 8", "fire": "2, 7", "earth": "5, 10",
        "metal": "4, 9", "water": "1, 6"
    }

    day_stem = saju_data['day_pillar']['stem']

    return {
        "key_insight": f"{element_korean[dominant]} 기운이 강한 사주로, {element_korean[yongsin]} 기운의 보완이 필요합니다.",
        "personality": f"일간 {day_stem}의 특성상 {element_traits[dominant]} 성격을 가지고 있습니다. 리더십이 있으며 목표 지향적입니다.",
        "fortune_2024": "2024년은 변화와 성장의 해입니다. 상반기에는 새로운 기회가 찾아올 수 있으며, 하반기에는 안정적인 발전이 기대됩니다.",
        "career": f"{element_korean[dominant]} 기운의 영향으로 창조적인 분야에서 성공 가능성이 높습니다. 꾸준한 노력이 결실을 맺을 것입니다.",
        "relationship": "대인관계에서 진정성이 중요한 시기입니다. 기존 인연을 소중히 하면서 새로운 만남에도 열린 마음을 가지세요.",
        "advice": [
            f"{element_korean[yongsin]} 기운을 보충하기 위해 관련 활동을 권장합니다",
            "무리한 결정보다는 신중한 판단이 필요합니다",
            "건강 관리에 특히 신경 쓰세요"
        ],
        "lucky_elements": {
            "color": element_colors[yongsin],
            "direction": element_directions[yongsin],
            "number": element_numbers[yongsin]
        },
        "question_answer": f"질문에 대해: 현재 운세를 고려할 때 신중하게 판단하시는 것이 좋겠습니다." if question else None
    }


# ===== API Endpoints =====

@app.get("/")
async def root():
    """API 루트"""
    return {
        "name": "Astro-Synthesis API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "사주분석": "/api/saju/analyze",
            "간편분석": "/api/quick",
            "건강체크": "/api/health"
        }
    }


@app.get("/api")
async def api_root():
    """API 정보"""
    return {"message": "Astro-Synthesis API v1.0", "status": "ok"}


@app.get("/api/health")
async def health_check():
    """서버 상태 확인"""
    return {
        "status": "healthy",
        "gemini_configured": bool(GEMINI_API_KEY),
        "timestamp": datetime.now().isoformat()
    }


@app.post("/api/saju/analyze")
async def analyze_saju(request: SajuRequest):
    """사주 분석"""
    try:
        saju_data = saju_calc.get_full_saju(
            request.birth_year,
            request.birth_month,
            request.birth_day,
            request.birth_hour
        )

        interpretation = await get_ai_interpretation(saju_data)

        return {
            "success": True,
            "data": {
                "saju": saju_data,
                "interpretation": interpretation,
                "generated_at": datetime.now().isoformat()
            },
            "disclaimer": "본 결과는 통계적 분석이며 의학적/법적 조언을 대체하지 않습니다."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/quick")
async def quick_analysis(request: QuickAnalysisRequest):
    """간편 분석"""
    try:
        saju_data = saju_calc.get_full_saju(
            request.birth_year,
            request.birth_month,
            request.birth_day,
            request.birth_hour
        )

        interpretation = await get_ai_interpretation(saju_data, request.question)

        # 간단한 응답 형식
        day_pillar = saju_data['day_pillar']
        elements = saju_data['elements']

        return {
            "success": True,
            "summary": {
                "day_master": f"{day_pillar['stem']}일간 ({saju_calc.ELEMENT_KOREAN[day_pillar['stem_element']]})",
                "dominant_element": saju_calc.ELEMENT_KOREAN[elements['dominant']],
                "yongsin": saju_calc.ELEMENT_KOREAN[elements['yongsin']],
                "key_insight": interpretation.get("key_insight", ""),
                "fortune": interpretation.get("fortune_2024", ""),
                "advice": interpretation.get("advice", [])[:2],
                "lucky": interpretation.get("lucky_elements", {})
            },
            "question_answer": interpretation.get("question_answer") if request.question else None,
            "disclaimer": "본 결과는 통계적 분석이며 의학적/법적 조언을 대체하지 않습니다."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/element/{element}")
async def get_element_info(element: Element):
    """오행 정보"""
    element_info = {
        Element.WOOD: {
            "korean": "목(木)", "direction": "동쪽", "season": "봄",
            "color": "청색/녹색", "organ": "간/담",
            "personality": "인자함, 성장, 창의성"
        },
        Element.FIRE: {
            "korean": "화(火)", "direction": "남쪽", "season": "여름",
            "color": "적색", "organ": "심장/소장",
            "personality": "열정, 예절, 활동성"
        },
        Element.EARTH: {
            "korean": "토(土)", "direction": "중앙", "season": "환절기",
            "color": "황색", "organ": "비장/위장",
            "personality": "신뢰, 안정, 중재"
        },
        Element.METAL: {
            "korean": "금(金)", "direction": "서쪽", "season": "가을",
            "color": "백색", "organ": "폐/대장",
            "personality": "의리, 결단력, 정의"
        },
        Element.WATER: {
            "korean": "수(水)", "direction": "북쪽", "season": "겨울",
            "color": "흑색", "organ": "신장/방광",
            "personality": "지혜, 유연성, 적응력"
        }
    }
    return element_info.get(element)


# Vercel handler
handler = app
