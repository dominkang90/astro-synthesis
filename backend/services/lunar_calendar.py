"""
만세력 (萬歲曆) 정밀 계산 모듈
음력 변환, 절기 계산, 한국 시간대 보정을 포함한 정밀 사주 계산
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple, Dict, List
import math

try:
    from lunardate import LunarDate
    LUNARDATE_AVAILABLE = True
except ImportError:
    LUNARDATE_AVAILABLE = False


class LunarCalendar:
    """만세력 정밀 계산 클래스"""

    # 천간 (天干) - 10개
    HEAVENLY_STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"]
    STEMS_HANJA = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"]

    # 지지 (地支) - 12개
    EARTHLY_BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"]
    BRANCHES_HANJA = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]

    # 지지 동물
    BRANCH_ANIMALS = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지"]

    # 오행 매핑
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

    # 절기 (24절기) - 태양 황경 기준
    SOLAR_TERMS = [
        ("소한", 285), ("대한", 300),   # 1월
        ("입춘", 315), ("우수", 330),   # 2월
        ("경칩", 345), ("춘분", 0),     # 3월
        ("청명", 15), ("곡우", 30),     # 4월
        ("입하", 45), ("소만", 60),     # 5월
        ("망종", 75), ("하지", 90),     # 6월
        ("소서", 105), ("대서", 120),   # 7월
        ("입추", 135), ("처서", 150),   # 8월
        ("백로", 165), ("추분", 180),   # 9월
        ("한로", 195), ("상강", 210),   # 10월
        ("입동", 225), ("소설", 240),   # 11월
        ("대설", 255), ("동지", 270),   # 12월
    ]

    # 절기 기준 월 (절입일 기준)
    # 인월(1월)은 입춘부터 시작
    MONTH_START_TERMS = {
        1: "입춘", 2: "경칩", 3: "청명", 4: "입하",
        5: "망종", 6: "소서", 7: "입추", 8: "백로",
        9: "한로", 10: "입동", 11: "대설", 12: "소한"
    }

    # 한국 서머타임 역사
    # (시작년, 종료년, DST 오프셋 분)
    KOREA_DST_HISTORY = [
        # 1948-1951: 서머타임 시행
        (1948, 1951, 60),
        # 1955-1960: 서머타임 시행
        (1955, 1960, 60),
        # 1987-1988: 서머타임 시행
        (1987, 1988, 60),
    ]

    # 한국 표준시 역사
    # (시작일, 종료일, UTC 오프셋 분)
    KOREA_TZ_HISTORY = [
        # 1908년 이전: 지방 평균시 (약 UTC+8:28)
        (datetime(1, 1, 1), datetime(1908, 3, 31), 508),
        # 1908-1912: 한국 표준시 (UTC+8:30)
        (datetime(1908, 4, 1), datetime(1912, 1, 1), 510),
        # 1912-1954: 일본 표준시 (UTC+9:00)
        (datetime(1912, 1, 1), datetime(1954, 3, 21), 540),
        # 1954-1961: 한국 표준시 (UTC+8:30)
        (datetime(1954, 3, 21), datetime(1961, 8, 10), 510),
        # 1961-현재: 한국 표준시 (UTC+9:00)
        (datetime(1961, 8, 10), datetime(2100, 1, 1), 540),
    ]

    def __init__(self):
        """만세력 초기화"""
        # 일진 기준일: 1900년 1월 1일 = 갑진일 (甲辰日)
        # 실제 역사적 기준: 갑자일 순환
        self.base_date = datetime(1900, 1, 1)
        self.base_stem_index = 0  # 갑
        self.base_branch_index = 4  # 진

    def solar_to_lunar(self, year: int, month: int, day: int) -> Dict:
        """
        양력을 음력으로 변환

        Args:
            year: 양력 년
            month: 양력 월
            day: 양력 일

        Returns:
            음력 날짜 정보 딕셔너리
        """
        if not LUNARDATE_AVAILABLE:
            return {
                'lunar_year': year,
                'lunar_month': month,
                'lunar_day': day,
                'is_leap_month': False,
                'available': False
            }

        try:
            lunar = LunarDate.fromSolarDate(year, month, day)
            return {
                'lunar_year': lunar.year,
                'lunar_month': lunar.month,
                'lunar_day': lunar.day,
                'is_leap_month': lunar.isLeapMonth,
                'available': True
            }
        except Exception as e:
            return {
                'lunar_year': year,
                'lunar_month': month,
                'lunar_day': day,
                'is_leap_month': False,
                'available': False,
                'error': str(e)
            }

    def lunar_to_solar(self, year: int, month: int, day: int, is_leap: bool = False) -> Dict:
        """
        음력을 양력으로 변환

        Args:
            year: 음력 년
            month: 음력 월
            day: 음력 일
            is_leap: 윤달 여부

        Returns:
            양력 날짜 정보 딕셔너리
        """
        if not LUNARDATE_AVAILABLE:
            return {
                'solar_year': year,
                'solar_month': month,
                'solar_day': day,
                'available': False
            }

        try:
            lunar = LunarDate(year, month, day, is_leap)
            solar = lunar.toSolarDate()
            return {
                'solar_year': solar.year,
                'solar_month': solar.month,
                'solar_day': solar.day,
                'available': True
            }
        except Exception as e:
            return {
                'solar_year': year,
                'solar_month': month,
                'solar_day': day,
                'available': False,
                'error': str(e)
            }

    def get_solar_term_dates(self, year: int) -> Dict[str, datetime]:
        """
        특정 연도의 24절기 날짜 계산

        Args:
            year: 연도

        Returns:
            절기명: datetime 딕셔너리
        """
        terms = {}

        for term_name, longitude in self.SOLAR_TERMS:
            dt = self._calculate_solar_term_date(year, longitude)
            terms[term_name] = dt

        return terms

    def _calculate_solar_term_date(self, year: int, target_longitude: float) -> datetime:
        """
        특정 태양 황경에 도달하는 날짜 계산 (근사)

        Args:
            year: 연도
            target_longitude: 목표 태양 황경 (도)

        Returns:
            해당 절기의 datetime
        """
        # 태양 황경을 기준으로 날짜 추정
        # 춘분(0도)은 약 3월 21일

        # 기준점: 춘분 (태양 황경 0도 ≈ 3월 21일)
        spring_equinox = datetime(year, 3, 21, 0, 0, 0)

        # 태양은 하루에 약 0.9856도 이동
        days_per_degree = 1 / 0.9856

        # 목표 황경까지의 각도 차이
        if target_longitude == 0:
            angle_diff = 0
        elif target_longitude > 0:
            angle_diff = target_longitude
        else:
            angle_diff = target_longitude + 360

        days_diff = angle_diff * days_per_degree

        result_date = spring_equinox + timedelta(days=days_diff)

        # 연도 조정
        if result_date.year != year:
            if result_date.year > year:
                result_date = result_date - timedelta(days=365)
            else:
                result_date = result_date + timedelta(days=365)

        return result_date

    def get_month_by_solar_term(self, year: int, month: int, day: int) -> int:
        """
        절기 기준으로 월(月) 결정

        사주에서는 양력 월이 아닌 절기 기준 월을 사용
        인월(寅月, 1월)은 입춘부터 시작

        Args:
            year: 양력 년
            month: 양력 월
            day: 양력 일

        Returns:
            절기 기준 월 (1-12, 1=인월)
        """
        target_date = datetime(year, month, day)
        terms = self.get_solar_term_dates(year)

        # 이전 연도 절기도 필요할 수 있음
        prev_year_terms = self.get_solar_term_dates(year - 1)

        # 절입일 목록 생성 (월 시작 절기만)
        entry_dates = []
        for saju_month, term_name in self.MONTH_START_TERMS.items():
            if term_name in terms:
                entry_dates.append((saju_month, terms[term_name]))
            elif term_name in prev_year_terms:
                entry_dates.append((saju_month, prev_year_terms[term_name]))

        # 날짜순 정렬
        entry_dates.sort(key=lambda x: x[1])

        # 해당 날짜의 월 결정
        result_month = 12  # 기본값
        for saju_month, entry_date in entry_dates:
            if target_date >= entry_date:
                result_month = saju_month
            else:
                break

        return result_month

    def calculate_year_pillar(self, year: int, month: int, day: int) -> Tuple[str, str]:
        """
        년주 (年柱) 계산

        사주의 년은 입춘 기준으로 바뀜

        Args:
            year: 양력 년
            month: 양력 월
            day: 양력 일

        Returns:
            (천간, 지지) 튜플
        """
        # 입춘 날짜 확인
        terms = self.get_solar_term_dates(year)
        ipchun = terms.get("입춘", datetime(year, 2, 4))

        target_date = datetime(year, month, day)

        # 입춘 이전이면 전년도 간지
        if target_date < ipchun:
            year = year - 1

        # 60갑자 계산 (기원전 4년이 갑자년)
        stem_index = (year - 4) % 10
        branch_index = (year - 4) % 12

        return (self.HEAVENLY_STEMS[stem_index], self.EARTHLY_BRANCHES[branch_index])

    def calculate_month_pillar(self, year: int, month: int, day: int) -> Tuple[str, str]:
        """
        월주 (月柱) 계산

        절기 기준 월과 년간에 따른 월간 계산

        Args:
            year: 양력 년
            month: 양력 월
            day: 양력 일

        Returns:
            (천간, 지지) 튜플
        """
        # 절기 기준 월
        saju_month = self.get_month_by_solar_term(year, month, day)

        # 년주의 천간
        year_stem, _ = self.calculate_year_pillar(year, month, day)
        year_stem_index = self.HEAVENLY_STEMS.index(year_stem)

        # 월간 계산 (년간에 따른 월간 시작점)
        # 갑/기년 -> 병인월 시작
        # 을/경년 -> 무인월 시작
        # 병/신년 -> 경인월 시작
        # 정/임년 -> 임인월 시작
        # 무/계년 -> 갑인월 시작
        month_stem_starts = [2, 4, 6, 8, 0]  # 병, 무, 경, 임, 갑
        month_stem_start = month_stem_starts[year_stem_index % 5]

        month_stem_index = (month_stem_start + saju_month - 1) % 10

        # 월지 (인월=1, 묘월=2, ...)
        month_branch_index = (saju_month + 1) % 12  # 인=2

        return (
            self.HEAVENLY_STEMS[month_stem_index],
            self.EARTHLY_BRANCHES[month_branch_index]
        )

    def calculate_day_pillar(self, year: int, month: int, day: int) -> Tuple[str, str]:
        """
        일주 (日柱) 계산

        정확한 일진 계산 (60갑자 순환)

        Args:
            year: 양력 년
            month: 양력 월
            day: 양력 일

        Returns:
            (천간, 지지) 튜플
        """
        target_date = datetime(year, month, day)
        days_diff = (target_date - self.base_date).days

        # 1900년 1월 1일 = 갑진일 (甲辰日)
        # 천간: 갑(0), 지지: 진(4)
        stem_index = (self.base_stem_index + days_diff) % 10
        branch_index = (self.base_branch_index + days_diff) % 12

        return (self.HEAVENLY_STEMS[stem_index], self.EARTHLY_BRANCHES[branch_index])

    def calculate_hour_pillar(self, day_stem: str, hour: int) -> Tuple[str, str]:
        """
        시주 (時柱) 계산

        Args:
            day_stem: 일간 (천간)
            hour: 시간 (0-23)

        Returns:
            (천간, 지지) 튜플
        """
        # 시지 계산
        # 자시(23-01), 축시(01-03), 인시(03-05), ...
        if hour == 23:
            branch_index = 0  # 자시
        else:
            branch_index = ((hour + 1) // 2) % 12

        # 시간 계산 (일간에 따른 시간 시작점)
        day_stem_index = self.HEAVENLY_STEMS.index(day_stem)
        hour_stem_starts = [0, 2, 4, 6, 8]  # 갑, 병, 무, 경, 임
        hour_stem_start = hour_stem_starts[day_stem_index % 5]

        stem_index = (hour_stem_start + branch_index) % 10

        return (self.HEAVENLY_STEMS[stem_index], self.EARTHLY_BRANCHES[branch_index])

    def apply_korea_timezone(
        self,
        dt: datetime,
        birth_location: str = "서울"
    ) -> datetime:
        """
        한국 역사적 시간대 보정

        Args:
            dt: 출생 datetime
            birth_location: 출생 지역

        Returns:
            보정된 datetime
        """
        # 현재 표준시(UTC+9)와의 차이 적용
        current_offset = 540  # 현재 KST

        for start, end, offset in self.KOREA_TZ_HISTORY:
            if start <= dt < end:
                # 과거 시간대와 현재의 차이
                offset_diff = current_offset - offset
                return dt + timedelta(minutes=offset_diff)

        return dt

    def check_dst(self, dt: datetime) -> bool:
        """
        서머타임 적용 여부 확인

        Args:
            dt: 확인할 datetime

        Returns:
            서머타임 적용 여부
        """
        year = dt.year
        month = dt.month

        for start_year, end_year, offset in self.KOREA_DST_HISTORY:
            if start_year <= year <= end_year:
                # 서머타임은 보통 4월-10월 적용
                if 4 <= month <= 10:
                    return True

        return False

    def get_full_saju(
        self,
        year: int,
        month: int,
        day: int,
        hour: Optional[int] = None,
        apply_timezone: bool = True
    ) -> Dict:
        """
        완전한 사주팔자 계산

        Args:
            year: 출생 양력 년
            month: 출생 양력 월
            day: 출생 양력 일
            hour: 출생 시간 (0-23, 없으면 시주 제외)
            apply_timezone: 한국 시간대 보정 적용 여부

        Returns:
            사주 정보 딕셔너리
        """
        # 시간대 보정
        if apply_timezone and hour is not None:
            dt = datetime(year, month, day, hour)
            dt = self.apply_korea_timezone(dt)
            year, month, day, hour = dt.year, dt.month, dt.day, dt.hour

        # 년주
        year_stem, year_branch = self.calculate_year_pillar(year, month, day)

        # 월주
        month_stem, month_branch = self.calculate_month_pillar(year, month, day)

        # 일주
        day_stem, day_branch = self.calculate_day_pillar(year, month, day)

        # 시주
        hour_pillar = None
        if hour is not None:
            hour_stem, hour_branch = self.calculate_hour_pillar(day_stem, hour)
            hour_pillar = {
                'stem': hour_stem,
                'branch': hour_branch,
                'stem_element': self.STEM_ELEMENTS[hour_stem],
                'branch_element': self.BRANCH_ELEMENTS[hour_branch],
                'full': f"{hour_stem}{hour_branch}"
            }

        # 음력 정보
        lunar_info = self.solar_to_lunar(year, month, day)

        # 년주 동물띠
        year_branch_index = self.EARTHLY_BRANCHES.index(year_branch)
        zodiac_animal = self.BRANCH_ANIMALS[year_branch_index]

        return {
            'year_pillar': {
                'stem': year_stem,
                'branch': year_branch,
                'stem_element': self.STEM_ELEMENTS[year_stem],
                'branch_element': self.BRANCH_ELEMENTS[year_branch],
                'full': f"{year_stem}{year_branch}",
                'animal': zodiac_animal
            },
            'month_pillar': {
                'stem': month_stem,
                'branch': month_branch,
                'stem_element': self.STEM_ELEMENTS[month_stem],
                'branch_element': self.BRANCH_ELEMENTS[month_branch],
                'full': f"{month_stem}{month_branch}"
            },
            'day_pillar': {
                'stem': day_stem,
                'branch': day_branch,
                'stem_element': self.STEM_ELEMENTS[day_stem],
                'branch_element': self.BRANCH_ELEMENTS[day_branch],
                'full': f"{day_stem}{day_branch}"
            },
            'hour_pillar': hour_pillar,
            'lunar_date': lunar_info,
            'solar_date': {
                'year': year,
                'month': month,
                'day': day,
                'hour': hour
            }
        }

    def get_element_summary(self, saju: Dict) -> Dict[str, int]:
        """
        오행 분포 계산

        Args:
            saju: get_full_saju() 결과

        Returns:
            오행별 개수 딕셔너리
        """
        elements = {
            'wood': 0, 'fire': 0, 'earth': 0, 'metal': 0, 'water': 0
        }

        pillars = ['year_pillar', 'month_pillar', 'day_pillar']
        if saju.get('hour_pillar'):
            pillars.append('hour_pillar')

        for pillar_name in pillars:
            pillar = saju.get(pillar_name)
            if pillar:
                elements[pillar['stem_element']] += 1
                elements[pillar['branch_element']] += 1

        return elements


# 싱글톤 인스턴스
_lunar_calendar_instance = None


def get_lunar_calendar() -> LunarCalendar:
    """만세력 싱글톤 인스턴스 반환"""
    global _lunar_calendar_instance
    if _lunar_calendar_instance is None:
        _lunar_calendar_instance = LunarCalendar()
    return _lunar_calendar_instance
