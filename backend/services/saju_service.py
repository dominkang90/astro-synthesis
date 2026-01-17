"""사주 (四柱) 분석 서비스 - 만세력 기반 정밀 계산"""

from datetime import datetime
from typing import Optional, List, Dict
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.saju_models import (
    SajuRequest, SajuResponse, SajuPillar,
    Element, TenGod, DaeunPeriod
)
from services.lunar_calendar import get_lunar_calendar, LunarCalendar


class SajuService:
    """사주 분석 서비스 클래스 - 만세력 기반 정밀 계산"""

    # 천간 (天干)
    HEAVENLY_STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"]

    # 지지 (地支)
    EARTHLY_BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"]

    # 천간 오행 매핑
    STEM_ELEMENTS = {
        "갑": Element.WOOD, "을": Element.WOOD,
        "병": Element.FIRE, "정": Element.FIRE,
        "무": Element.EARTH, "기": Element.EARTH,
        "경": Element.METAL, "신": Element.METAL,
        "임": Element.WATER, "계": Element.WATER
    }

    # 지지 오행 매핑
    BRANCH_ELEMENTS = {
        "자": Element.WATER, "축": Element.EARTH,
        "인": Element.WOOD, "묘": Element.WOOD,
        "진": Element.EARTH, "사": Element.FIRE,
        "오": Element.FIRE, "미": Element.EARTH,
        "신": Element.METAL, "유": Element.METAL,
        "술": Element.EARTH, "해": Element.WATER
    }

    # 오행 상생 관계
    GENERATING = {
        Element.WOOD: Element.FIRE,
        Element.FIRE: Element.EARTH,
        Element.EARTH: Element.METAL,
        Element.METAL: Element.WATER,
        Element.WATER: Element.WOOD
    }

    # 오행 상극 관계
    CONTROLLING = {
        Element.WOOD: Element.EARTH,
        Element.FIRE: Element.METAL,
        Element.EARTH: Element.WATER,
        Element.METAL: Element.WOOD,
        Element.WATER: Element.FIRE
    }

    def __init__(self):
        """서비스 초기화 - 만세력 엔진 연결"""
        self.lunar_calendar: LunarCalendar = get_lunar_calendar()
        self.use_precise_calculation = True

    def analyze(self, request: SajuRequest) -> SajuResponse:
        """
        사주 분석 수행 - 만세력 기반 정밀 계산

        절기 기준 월주, 정밀 일주 계산을 사용합니다.
        """
        if self.use_precise_calculation:
            return self._analyze_precise(request)
        else:
            return self._analyze_fallback(request)

    def _analyze_precise(self, request: SajuRequest) -> SajuResponse:
        """만세력 기반 정밀 사주 분석"""

        # 1. 만세력으로 사주팔자 계산
        saju_data = self.lunar_calendar.get_full_saju(
            year=request.birth_year,
            month=request.birth_month,
            day=request.birth_day,
            hour=request.birth_hour,
            apply_timezone=True
        )

        # 2. 모델로 변환
        year_pillar = self._convert_to_pillar(saju_data['year_pillar'])
        month_pillar = self._convert_to_pillar(saju_data['month_pillar'])
        day_pillar = self._convert_to_pillar(saju_data['day_pillar'])

        hour_pillar = None
        if saju_data['hour_pillar']:
            hour_pillar = self._convert_to_pillar(saju_data['hour_pillar'])

        # 3. 오행 균형 분석
        element_balance = self._analyze_element_balance(year_pillar, month_pillar, day_pillar, hour_pillar)
        dominant_element = max(element_balance, key=element_balance.get)
        weak_element = min(element_balance, key=element_balance.get)

        # 4. 용신/기신 결정
        day_master_element = self.STEM_ELEMENTS[day_pillar.stem]
        yongsin = self._determine_yongsin(day_master_element, element_balance)
        gisin = self.CONTROLLING[yongsin]

        # 5. 십신 분석
        ten_gods = self._analyze_ten_gods(day_pillar.stem, year_pillar, month_pillar, hour_pillar)

        # 6. 대운 계산
        daeun = self._calculate_daeun(request.gender, month_pillar, request.birth_year)

        # 7. 세운 (올해 운세)
        current_year = datetime.now().year
        yearly_fortune = self._get_yearly_fortune(day_pillar, current_year)

        # 8. 종합 해석
        summary = self._generate_summary(day_master_element, element_balance, yongsin)

        # 9. 음력 정보 추가
        lunar_info = saju_data.get('lunar_date', {})

        return SajuResponse(
            year_pillar=year_pillar,
            month_pillar=month_pillar,
            day_pillar=day_pillar,
            hour_pillar=hour_pillar,
            element_balance=element_balance,
            dominant_element=dominant_element,
            weak_element=weak_element,
            yongsin=yongsin,
            gisin=gisin,
            ten_gods=ten_gods,
            daeun=daeun,
            yearly_fortune=yearly_fortune,
            summary=summary
        )

    def _convert_to_pillar(self, pillar_data: Dict) -> SajuPillar:
        """만세력 데이터를 SajuPillar 모델로 변환"""
        stem = pillar_data['stem']
        branch = pillar_data['branch']

        return SajuPillar(
            stem=stem,
            branch=branch,
            stem_element=self.STEM_ELEMENTS[stem],
            branch_element=self.BRANCH_ELEMENTS[branch]
        )

    def _analyze_fallback(self, request: SajuRequest) -> SajuResponse:
        """기존 근사 계산 방식 (폴백)"""

        # 1. 사주팔자 계산
        year_pillar = self._calculate_year_pillar(request.birth_year)
        month_pillar = self._calculate_month_pillar(request.birth_year, request.birth_month)
        day_pillar = self._calculate_day_pillar(request.birth_year, request.birth_month, request.birth_day)

        hour_pillar = None
        if request.birth_hour is not None:
            hour_pillar = self._calculate_hour_pillar(day_pillar.stem, request.birth_hour)

        # 2. 오행 균형 분석
        element_balance = self._analyze_element_balance(year_pillar, month_pillar, day_pillar, hour_pillar)
        dominant_element = max(element_balance, key=element_balance.get)
        weak_element = min(element_balance, key=element_balance.get)

        # 3. 용신/기신 결정
        day_master_element = self.STEM_ELEMENTS[day_pillar.stem]
        yongsin = self._determine_yongsin(day_master_element, element_balance)
        gisin = self.CONTROLLING[yongsin]

        # 4. 십신 분석
        ten_gods = self._analyze_ten_gods(day_pillar.stem, year_pillar, month_pillar, hour_pillar)

        # 5. 대운 계산
        daeun = self._calculate_daeun(request.gender, month_pillar, request.birth_year)

        # 6. 세운 (올해 운세)
        current_year = datetime.now().year
        yearly_fortune = self._get_yearly_fortune(day_pillar, current_year)

        # 7. 종합 해석
        summary = self._generate_summary(day_master_element, element_balance, yongsin)

        return SajuResponse(
            year_pillar=year_pillar,
            month_pillar=month_pillar,
            day_pillar=day_pillar,
            hour_pillar=hour_pillar,
            element_balance=element_balance,
            dominant_element=dominant_element,
            weak_element=weak_element,
            yongsin=yongsin,
            gisin=gisin,
            ten_gods=ten_gods,
            daeun=daeun,
            yearly_fortune=yearly_fortune,
            summary=summary
        )

    def _calculate_year_pillar(self, year: int) -> SajuPillar:
        """년주 계산"""
        # 1984년이 갑자년 기준
        stem_index = (year - 4) % 10
        branch_index = (year - 4) % 12

        stem = self.HEAVENLY_STEMS[stem_index]
        branch = self.EARTHLY_BRANCHES[branch_index]

        return SajuPillar(
            stem=stem,
            branch=branch,
            stem_element=self.STEM_ELEMENTS[stem],
            branch_element=self.BRANCH_ELEMENTS[branch]
        )

    def _calculate_month_pillar(self, year: int, month: int) -> SajuPillar:
        """월주 계산"""
        # 년간에 따른 월간 시작점
        year_stem_index = (year - 4) % 10

        # 월간 계산 (인월이 1월)
        month_stem_start = (year_stem_index * 2 + 2) % 10
        stem_index = (month_stem_start + month - 1) % 10

        # 월지 (인월=1월, 묘월=2월, ...)
        branch_index = (month + 1) % 12

        stem = self.HEAVENLY_STEMS[stem_index]
        branch = self.EARTHLY_BRANCHES[branch_index]

        return SajuPillar(
            stem=stem,
            branch=branch,
            stem_element=self.STEM_ELEMENTS[stem],
            branch_element=self.BRANCH_ELEMENTS[branch]
        )

    def _calculate_day_pillar(self, year: int, month: int, day: int) -> SajuPillar:
        """일주 계산 (간략화된 버전)"""
        # 실제로는 만세력 데이터를 사용해야 함
        # 여기서는 간략화된 계산 사용

        from datetime import date

        # 기준일: 1900년 1월 1일 = 갑진일
        base_date = date(1900, 1, 1)
        target_date = date(year, month, day)
        days_diff = (target_date - base_date).days

        stem_index = (days_diff + 0) % 10  # 갑 기준
        branch_index = (days_diff + 4) % 12  # 진 기준

        stem = self.HEAVENLY_STEMS[stem_index]
        branch = self.EARTHLY_BRANCHES[branch_index]

        return SajuPillar(
            stem=stem,
            branch=branch,
            stem_element=self.STEM_ELEMENTS[stem],
            branch_element=self.BRANCH_ELEMENTS[branch]
        )

    def _calculate_hour_pillar(self, day_stem: str, hour: int) -> SajuPillar:
        """시주 계산"""
        # 시지 계산 (23-01시=자시, 01-03시=축시, ...)
        branch_index = ((hour + 1) // 2) % 12

        # 일간에 따른 시간 시작점
        day_stem_index = self.HEAVENLY_STEMS.index(day_stem)
        stem_start = (day_stem_index * 2) % 10
        stem_index = (stem_start + branch_index) % 10

        stem = self.HEAVENLY_STEMS[stem_index]
        branch = self.EARTHLY_BRANCHES[branch_index]

        return SajuPillar(
            stem=stem,
            branch=branch,
            stem_element=self.STEM_ELEMENTS[stem],
            branch_element=self.BRANCH_ELEMENTS[branch]
        )

    def _analyze_element_balance(
        self,
        year: SajuPillar,
        month: SajuPillar,
        day: SajuPillar,
        hour: Optional[SajuPillar]
    ) -> Dict[str, int]:
        """오행 균형 분석"""
        balance = {
            Element.WOOD: 0,
            Element.FIRE: 0,
            Element.EARTH: 0,
            Element.METAL: 0,
            Element.WATER: 0
        }

        pillars = [year, month, day]
        if hour:
            pillars.append(hour)

        for pillar in pillars:
            balance[pillar.stem_element] += 1
            balance[pillar.branch_element] += 1

        return {k.value: v for k, v in balance.items()}

    def _determine_yongsin(self, day_master: Element, balance: Dict[str, int]) -> Element:
        """용신 결정 (간략화)"""
        # 일간이 강하면 설기하는 오행, 약하면 생해주는 오행
        day_master_count = balance.get(day_master.value, 0)
        total = sum(balance.values())

        if day_master_count >= total / 5 * 1.5:  # 일간이 강함
            # 설기: 일간이 생하는 오행
            return self.GENERATING[day_master]
        else:  # 일간이 약함
            # 일간을 생해주는 오행
            for elem, generates in self.GENERATING.items():
                if generates == day_master:
                    return elem
            return day_master

    def _analyze_ten_gods(
        self,
        day_stem: str,
        year: SajuPillar,
        month: SajuPillar,
        hour: Optional[SajuPillar]
    ) -> List[TenGod]:
        """십신 분석"""
        ten_gods = []
        day_element = self.STEM_ELEMENTS[day_stem]

        # 각 기둥의 천간에 대한 십신 분석
        for pillar, pillar_name in [(year, "년간"), (month, "월간")]:
            other_element = self.STEM_ELEMENTS[pillar.stem]
            god = self._get_ten_god(day_element, other_element)
            ten_gods.append(TenGod(
                name=god["name"],
                korean_name=god["korean"],
                meaning=f"{pillar_name}의 {god['korean']}: {god['meaning']}"
            ))

        return ten_gods

    def _get_ten_god(self, day_element: Element, other_element: Element) -> Dict:
        """십신 판별"""
        ten_god_map = {
            "same": {"name": "비겁", "korean": "비견/겁재", "meaning": "형제, 경쟁자, 동료"},
            "generates_me": {"name": "인성", "korean": "정인/편인", "meaning": "학문, 어머니, 보호"},
            "i_generate": {"name": "식상", "korean": "식신/상관", "meaning": "표현, 재능, 자녀"},
            "controls_me": {"name": "관성", "korean": "정관/편관", "meaning": "직장, 명예, 규율"},
            "i_control": {"name": "재성", "korean": "정재/편재", "meaning": "재물, 아버지, 현실"}
        }

        if day_element == other_element:
            return ten_god_map["same"]
        elif self.GENERATING.get(other_element) == day_element:
            return ten_god_map["generates_me"]
        elif self.GENERATING.get(day_element) == other_element:
            return ten_god_map["i_generate"]
        elif self.CONTROLLING.get(other_element) == day_element:
            return ten_god_map["controls_me"]
        elif self.CONTROLLING.get(day_element) == other_element:
            return ten_god_map["i_control"]

        return ten_god_map["same"]

    def _calculate_daeun(self, gender: str, month_pillar: SajuPillar, birth_year: int) -> List[DaeunPeriod]:
        """대운 계산"""
        daeun_list = []

        # 대운 시작 나이 (간략화: 보통 3-10세 사이 시작)
        start_age = 5

        # 양남음녀 순행, 음남양녀 역행
        year_stem_index = (birth_year - 4) % 10
        is_yang_year = year_stem_index % 2 == 0
        is_male = gender.lower() == "male"

        forward = (is_yang_year and is_male) or (not is_yang_year and not is_male)

        month_stem_index = self.HEAVENLY_STEMS.index(month_pillar.stem)
        month_branch_index = self.EARTHLY_BRANCHES.index(month_pillar.branch)

        for i in range(8):  # 8개 대운
            if forward:
                stem_index = (month_stem_index + i + 1) % 10
                branch_index = (month_branch_index + i + 1) % 12
            else:
                stem_index = (month_stem_index - i - 1) % 10
                branch_index = (month_branch_index - i - 1) % 12

            stem = self.HEAVENLY_STEMS[stem_index]
            branch = self.EARTHLY_BRANCHES[branch_index]

            daeun_list.append(DaeunPeriod(
                start_age=start_age + (i * 10),
                end_age=start_age + (i * 10) + 9,
                stem=stem,
                branch=branch,
                element=self.STEM_ELEMENTS[stem],
                interpretation=f"{stem}{branch} 대운: {self.STEM_ELEMENTS[stem].value} 기운이 강해지는 시기"
            ))

        return daeun_list

    def _get_yearly_fortune(self, day_pillar: SajuPillar, year: int) -> str:
        """올해 운세 (세운)"""
        year_pillar = self._calculate_year_pillar(year)
        day_element = self.STEM_ELEMENTS[day_pillar.stem]
        year_element = self.STEM_ELEMENTS[year_pillar.stem]

        if year_element == day_element:
            return f"{year}년은 비견의 해로, 경쟁과 협력이 공존하는 한 해입니다. 자기 주도적인 활동이 유리합니다."
        elif self.GENERATING.get(year_element) == day_element:
            return f"{year}년은 인성의 해로, 학습과 성장에 좋은 시기입니다. 새로운 지식을 습득하세요."
        elif self.GENERATING.get(day_element) == year_element:
            return f"{year}년은 식상의 해로, 창의력과 표현력이 빛나는 시기입니다. 재능을 발휘하세요."
        elif self.CONTROLLING.get(year_element) == day_element:
            return f"{year}년은 관성의 해로, 책임감과 규율이 중요한 시기입니다. 승진이나 인정의 기회가 있습니다."
        else:
            return f"{year}년은 재성의 해로, 재물운이 활성화되는 시기입니다. 실질적인 이익을 추구하세요."

    def _generate_summary(self, day_master: Element, balance: Dict[str, int], yongsin: Element) -> str:
        """종합 해석 생성"""
        element_names = {
            "wood": "목(木)", "fire": "화(火)", "earth": "토(土)",
            "metal": "금(金)", "water": "수(水)"
        }

        dominant = max(balance, key=balance.get)
        weak = min(balance, key=balance.get)

        return (
            f"일간 {element_names[day_master.value]} 기운을 가진 사주입니다. "
            f"전체적으로 {element_names[dominant]} 기운이 강하고 "
            f"{element_names[weak]} 기운이 부족합니다. "
            f"용신은 {element_names[yongsin.value]}으로, "
            f"이 기운을 보충하면 운세가 더욱 좋아집니다."
        )

    def get_yearly_fortune(self, request: SajuRequest, year: int) -> str:
        """특정 연도 운세 조회"""
        day_pillar = self._calculate_day_pillar(
            request.birth_year, request.birth_month, request.birth_day
        )
        return self._get_yearly_fortune(day_pillar, year)

    def check_compatibility(self, person1: SajuRequest, person2: SajuRequest) -> Dict:
        """궁합 분석"""
        p1_day = self._calculate_day_pillar(person1.birth_year, person1.birth_month, person1.birth_day)
        p2_day = self._calculate_day_pillar(person2.birth_year, person2.birth_month, person2.birth_day)

        p1_element = self.STEM_ELEMENTS[p1_day.stem]
        p2_element = self.STEM_ELEMENTS[p2_day.stem]

        score = 70  # 기본 점수
        analysis = []

        # 상생 관계
        if self.GENERATING.get(p1_element) == p2_element:
            score += 15
            analysis.append("상생 관계로 서로 돕는 좋은 궁합입니다.")
        elif self.GENERATING.get(p2_element) == p1_element:
            score += 15
            analysis.append("상생 관계로 서로 돕는 좋은 궁합입니다.")

        # 같은 오행
        if p1_element == p2_element:
            score += 10
            analysis.append("같은 오행으로 서로를 잘 이해합니다.")

        # 상극 관계
        if self.CONTROLLING.get(p1_element) == p2_element:
            score -= 10
            analysis.append("상극 관계가 있어 갈등 조절이 필요합니다.")
        elif self.CONTROLLING.get(p2_element) == p1_element:
            score -= 10
            analysis.append("상극 관계가 있어 갈등 조절이 필요합니다.")

        return {
            "score": min(100, max(0, score)),
            "person1_day_pillar": f"{p1_day.stem}{p1_day.branch}",
            "person2_day_pillar": f"{p2_day.stem}{p2_day.branch}",
            "analysis": analysis,
            "summary": "좋은 궁합입니다." if score >= 70 else "노력이 필요한 궁합입니다."
        }
