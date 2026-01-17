"""점성술 (Astrology) 분석 서비스 - Swiss Ephemeris 기반 정밀 계산"""

from datetime import datetime, timezone
from typing import Optional, List, Dict
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.astrology_models import (
    AstrologyRequest, AstrologyResponse,
    TransitRequest, TransitResponse,
    ZodiacSign, Planet, HouseSystem,
    PlanetPosition, Aspect, AspectType, HouseCusp
)
from services.swiss_ephemeris import get_ephemeris, SwissEphemeris


class AstrologyService:
    """점성술 분석 서비스 클래스 - Swiss Ephemeris 기반"""

    # 별자리 날짜 범위 (태양 별자리용 백업)
    ZODIAC_DATES = [
        (ZodiacSign.CAPRICORN, (1, 1), (1, 19)),
        (ZodiacSign.AQUARIUS, (1, 20), (2, 18)),
        (ZodiacSign.PISCES, (2, 19), (3, 20)),
        (ZodiacSign.ARIES, (3, 21), (4, 19)),
        (ZodiacSign.TAURUS, (4, 20), (5, 20)),
        (ZodiacSign.GEMINI, (5, 21), (6, 20)),
        (ZodiacSign.CANCER, (6, 21), (7, 22)),
        (ZodiacSign.LEO, (7, 23), (8, 22)),
        (ZodiacSign.VIRGO, (8, 23), (9, 22)),
        (ZodiacSign.LIBRA, (9, 23), (10, 22)),
        (ZodiacSign.SCORPIO, (10, 23), (11, 21)),
        (ZodiacSign.SAGITTARIUS, (11, 22), (12, 21)),
        (ZodiacSign.CAPRICORN, (12, 22), (12, 31)),
    ]

    # 별자리 순서
    ZODIAC_ORDER = [
        ZodiacSign.ARIES, ZodiacSign.TAURUS, ZodiacSign.GEMINI,
        ZodiacSign.CANCER, ZodiacSign.LEO, ZodiacSign.VIRGO,
        ZodiacSign.LIBRA, ZodiacSign.SCORPIO, ZodiacSign.SAGITTARIUS,
        ZodiacSign.CAPRICORN, ZodiacSign.AQUARIUS, ZodiacSign.PISCES
    ]

    # 별자리 문자열 -> Enum 매핑
    SIGN_NAME_TO_ENUM = {
        'aries': ZodiacSign.ARIES, 'taurus': ZodiacSign.TAURUS,
        'gemini': ZodiacSign.GEMINI, 'cancer': ZodiacSign.CANCER,
        'leo': ZodiacSign.LEO, 'virgo': ZodiacSign.VIRGO,
        'libra': ZodiacSign.LIBRA, 'scorpio': ZodiacSign.SCORPIO,
        'sagittarius': ZodiacSign.SAGITTARIUS, 'capricorn': ZodiacSign.CAPRICORN,
        'aquarius': ZodiacSign.AQUARIUS, 'pisces': ZodiacSign.PISCES
    }

    # 행성 문자열 -> Enum 매핑
    PLANET_NAME_TO_ENUM = {
        'sun': Planet.SUN, 'moon': Planet.MOON,
        'mercury': Planet.MERCURY, 'venus': Planet.VENUS,
        'mars': Planet.MARS, 'jupiter': Planet.JUPITER,
        'saturn': Planet.SATURN, 'uranus': Planet.URANUS,
        'neptune': Planet.NEPTUNE, 'pluto': Planet.PLUTO
    }

    # 아스펙트 문자열 -> Enum 매핑
    ASPECT_NAME_TO_ENUM = {
        'conjunction': AspectType.CONJUNCTION,
        'sextile': AspectType.SEXTILE,
        'square': AspectType.SQUARE,
        'trine': AspectType.TRINE,
        'opposition': AspectType.OPPOSITION
    }

    def __init__(self):
        """서비스 초기화 - Swiss Ephemeris 연결"""
        self.ephemeris: SwissEphemeris = get_ephemeris()
        self.use_swiss_ephemeris = self.ephemeris.initialized

    def create_natal_chart(self, request: AstrologyRequest) -> AstrologyResponse:
        """
        출생 차트 생성 - Swiss Ephemeris 기반 정밀 계산

        Swiss Ephemeris가 사용 가능한 경우 정밀 계산을 수행하고,
        그렇지 않은 경우 기존 근사 계산으로 폴백합니다.
        """
        if self.use_swiss_ephemeris:
            return self._create_natal_chart_precise(request)
        else:
            return self._create_natal_chart_fallback(request)

    def _create_natal_chart_precise(self, request: AstrologyRequest) -> AstrologyResponse:
        """Swiss Ephemeris를 사용한 정밀 출생 차트 생성"""

        # 출생 datetime 생성
        birth_dt = datetime(
            request.birth_year, request.birth_month, request.birth_day,
            request.birth_hour or 12, request.birth_minute or 0
        )

        # 하우스 시스템 결정
        house_system = getattr(request, 'house_system', 'placidus') or 'placidus'

        # Swiss Ephemeris로 전체 차트 계산
        chart_data = self.ephemeris.get_natal_chart(
            birth_datetime=birth_dt,
            latitude=request.latitude,
            longitude=request.longitude,
            house_system=house_system
        )

        # 행성 위치 변환
        planets = self._convert_planets(chart_data['planets'])

        # 하우스 변환
        houses = self._convert_houses(chart_data['houses'])

        # 아스펙트 변환
        aspects = self._convert_aspects(chart_data['aspects'])

        # 품위 변환
        dignities = chart_data['dignities']

        # 태양/달/상승 별자리 추출
        sun_pos = next((p for p in chart_data['planets'] if p['planet'] == 'sun'), None)
        moon_pos = next((p for p in chart_data['planets'] if p['planet'] == 'moon'), None)
        asc_data = chart_data['houses']['ascendant']

        sun_sign = self.SIGN_NAME_TO_ENUM.get(sun_pos['sign']) if sun_pos else ZodiacSign.ARIES
        moon_sign = self.SIGN_NAME_TO_ENUM.get(moon_pos['sign']) if moon_pos else ZodiacSign.ARIES
        rising_sign = self.SIGN_NAME_TO_ENUM.get(asc_data['sign']) if asc_data else ZodiacSign.ARIES

        # 해석 생성
        personality_summary = self._generate_personality_summary(sun_sign, moon_sign, rising_sign)
        life_themes = self._generate_life_themes(planets, houses)

        return AstrologyResponse(
            sun_sign=sun_sign,
            moon_sign=moon_sign,
            rising_sign=rising_sign,
            planets=planets,
            houses=houses,
            aspects=aspects,
            dignities=dignities,
            chart_svg=None,  # SVG는 별도 구현 가능
            personality_summary=personality_summary,
            life_themes=life_themes
        )

    def _convert_planets(self, ephemeris_planets: List[Dict]) -> List[PlanetPosition]:
        """Swiss Ephemeris 행성 데이터를 모델로 변환"""
        result = []

        for p in ephemeris_planets:
            planet_enum = self.PLANET_NAME_TO_ENUM.get(p['planet'].lower())
            if planet_enum is None:
                continue

            sign_enum = self.SIGN_NAME_TO_ENUM.get(p['sign'].lower(), ZodiacSign.ARIES)

            result.append(PlanetPosition(
                planet=planet_enum,
                sign=sign_enum,
                degree=p['longitude'],
                sign_degree=p['sign_degree'],
                house=p.get('house', 1),
                is_retrograde=p.get('is_retrograde', False)
            ))

        return result

    def _convert_houses(self, houses_data: Dict) -> List[HouseCusp]:
        """Swiss Ephemeris 하우스 데이터를 모델로 변환"""
        result = []

        for house in houses_data.get('houses', []):
            sign_enum = self.SIGN_NAME_TO_ENUM.get(house['sign'].lower(), ZodiacSign.ARIES)

            result.append(HouseCusp(
                house=house['house'],
                sign=sign_enum,
                degree=house['cusp']
            ))

        return result

    def _convert_aspects(self, ephemeris_aspects: List[Dict]) -> List[Aspect]:
        """Swiss Ephemeris 아스펙트 데이터를 모델로 변환"""
        result = []

        for asp in ephemeris_aspects:
            p1_enum = self.PLANET_NAME_TO_ENUM.get(asp['planet1'].lower())
            p2_enum = self.PLANET_NAME_TO_ENUM.get(asp['planet2'].lower())
            asp_enum = self.ASPECT_NAME_TO_ENUM.get(asp['aspect'].lower())

            if p1_enum and p2_enum and asp_enum:
                result.append(Aspect(
                    planet1=p1_enum,
                    planet2=p2_enum,
                    aspect_type=asp_enum,
                    degree=asp['angle'],
                    orb=asp['orb'],
                    is_applying=asp.get('is_applying', True)
                ))

        return result

    def _create_natal_chart_fallback(self, request: AstrologyRequest) -> AstrologyResponse:
        """기존 근사 계산 방식 (Swiss Ephemeris 미사용시 폴백)"""

        # 1. 태양 별자리 계산
        sun_sign = self._calculate_sun_sign(request.birth_month, request.birth_day)

        # 2. 달 별자리 계산 (간략화)
        moon_sign = self._calculate_moon_sign(request.birth_year, request.birth_month, request.birth_day)

        # 3. 상승 별자리 계산
        rising_sign = self._calculate_rising_sign(
            request.birth_hour, request.birth_minute,
            request.latitude, request.longitude
        )

        # 4. 행성 위치 계산
        planets = self._calculate_planet_positions(request)

        # 5. 하우스 계산
        houses = self._calculate_houses(request, rising_sign)

        # 6. 아스펙트 계산
        aspects = self._calculate_aspects(planets)

        # 7. 품위 (Dignities) 계산
        dignities = self._calculate_dignities(planets)

        # 8. 해석 생성
        personality_summary = self._generate_personality_summary(sun_sign, moon_sign, rising_sign)
        life_themes = self._generate_life_themes(planets, houses)

        return AstrologyResponse(
            sun_sign=sun_sign,
            moon_sign=moon_sign,
            rising_sign=rising_sign,
            planets=planets,
            houses=houses,
            aspects=aspects,
            dignities=dignities,
            chart_svg=None,
            personality_summary=personality_summary,
            life_themes=life_themes
        )

    def _calculate_sun_sign(self, month: int, day: int) -> ZodiacSign:
        """태양 별자리 계산"""
        for sign, (start_m, start_d), (end_m, end_d) in self.ZODIAC_DATES:
            if (month == start_m and day >= start_d) or (month == end_m and day <= end_d):
                return sign
        return ZodiacSign.CAPRICORN

    def _calculate_moon_sign(self, year: int, month: int, day: int) -> ZodiacSign:
        """달 별자리 계산 (간략화된 버전)"""
        # 실제로는 Swiss Ephemeris 사용
        # 여기서는 간략화된 근사값 사용
        from datetime import date
        base = date(2000, 1, 1)
        target = date(year, month, day)
        days = (target - base).days

        # 달은 약 2.5일마다 별자리 이동
        moon_index = int((days / 2.5) % 12)
        return self.ZODIAC_ORDER[moon_index]

    def _calculate_rising_sign(
        self, hour: int, minute: int,
        latitude: float, longitude: float
    ) -> ZodiacSign:
        """상승 별자리 계산 (간략화)"""
        # 실제로는 Swiss Ephemeris와 정확한 천문 계산 필요
        # 여기서는 시간 기반 근사값 사용

        # 2시간마다 별자리가 바뀐다고 가정
        sign_index = (hour // 2) % 12
        return self.ZODIAC_ORDER[sign_index]

    def _calculate_planet_positions(self, request: AstrologyRequest) -> List[PlanetPosition]:
        """행성 위치 계산"""
        positions = []

        # 태양 위치
        sun_sign = self._calculate_sun_sign(request.birth_month, request.birth_day)
        sun_degree = self._estimate_degree_in_sign(request.birth_month, request.birth_day)

        positions.append(PlanetPosition(
            planet=Planet.SUN,
            sign=sun_sign,
            degree=self.ZODIAC_ORDER.index(sun_sign) * 30 + sun_degree,
            sign_degree=sun_degree,
            house=1,  # 간략화
            is_retrograde=False
        ))

        # 달 위치
        moon_sign = self._calculate_moon_sign(request.birth_year, request.birth_month, request.birth_day)
        positions.append(PlanetPosition(
            planet=Planet.MOON,
            sign=moon_sign,
            degree=self.ZODIAC_ORDER.index(moon_sign) * 30 + 15,
            sign_degree=15,
            house=4,
            is_retrograde=False
        ))

        # 다른 행성들 (간략화된 근사값)
        other_planets = [
            (Planet.MERCURY, 0, 3, False),
            (Planet.VENUS, 1, 2, False),
            (Planet.MARS, 2, 6, False),
            (Planet.JUPITER, 3, 9, False),
            (Planet.SATURN, 4, 10, False),
            (Planet.URANUS, 5, 11, False),
            (Planet.NEPTUNE, 6, 12, False),
            (Planet.PLUTO, 7, 8, False),
        ]

        for planet, offset, house, retrograde in other_planets:
            sign_index = (self.ZODIAC_ORDER.index(sun_sign) + offset) % 12
            sign = self.ZODIAC_ORDER[sign_index]
            positions.append(PlanetPosition(
                planet=planet,
                sign=sign,
                degree=sign_index * 30 + 15,
                sign_degree=15,
                house=house,
                is_retrograde=retrograde
            ))

        return positions

    def _estimate_degree_in_sign(self, month: int, day: int) -> float:
        """별자리 내 위치 (도) 추정"""
        # 각 별자리는 약 30일
        return (day / 30.0) * 30

    def _calculate_houses(self, request: AstrologyRequest, rising_sign: ZodiacSign) -> List[HouseCusp]:
        """하우스 커스프 계산"""
        houses = []
        rising_index = self.ZODIAC_ORDER.index(rising_sign)

        for house_num in range(1, 13):
            sign_index = (rising_index + house_num - 1) % 12
            houses.append(HouseCusp(
                house=house_num,
                sign=self.ZODIAC_ORDER[sign_index],
                degree=sign_index * 30
            ))

        return houses

    def _calculate_aspects(self, planets: List[PlanetPosition]) -> List[Aspect]:
        """아스펙트 계산"""
        aspects = []
        aspect_angles = {
            AspectType.CONJUNCTION: (0, 8),
            AspectType.SEXTILE: (60, 6),
            AspectType.SQUARE: (90, 8),
            AspectType.TRINE: (120, 8),
            AspectType.OPPOSITION: (180, 8),
        }

        for i, p1 in enumerate(planets):
            for p2 in planets[i + 1:]:
                diff = abs(p1.degree - p2.degree)
                if diff > 180:
                    diff = 360 - diff

                for aspect_type, (angle, orb) in aspect_angles.items():
                    if abs(diff - angle) <= orb:
                        aspects.append(Aspect(
                            planet1=p1.planet,
                            planet2=p2.planet,
                            aspect_type=aspect_type,
                            degree=diff,
                            orb=abs(diff - angle),
                            is_applying=True
                        ))
                        break

        return aspects

    def _calculate_dignities(self, planets: List[PlanetPosition]) -> Dict:
        """행성 품위 계산"""
        dignities = {
            "domicile": [],  # 본좌 (홈)
            "exaltation": [],  # 고양
            "detriment": [],  # 손상
            "fall": []  # 쇠약
        }

        domicile_map = {
            Planet.SUN: ZodiacSign.LEO,
            Planet.MOON: ZodiacSign.CANCER,
            Planet.MERCURY: [ZodiacSign.GEMINI, ZodiacSign.VIRGO],
            Planet.VENUS: [ZodiacSign.TAURUS, ZodiacSign.LIBRA],
            Planet.MARS: [ZodiacSign.ARIES, ZodiacSign.SCORPIO],
            Planet.JUPITER: [ZodiacSign.SAGITTARIUS, ZodiacSign.PISCES],
            Planet.SATURN: [ZodiacSign.CAPRICORN, ZodiacSign.AQUARIUS],
        }

        for planet_pos in planets:
            if planet_pos.planet in domicile_map:
                home_signs = domicile_map[planet_pos.planet]
                if isinstance(home_signs, list):
                    if planet_pos.sign in home_signs:
                        dignities["domicile"].append(planet_pos.planet.value)
                else:
                    if planet_pos.sign == home_signs:
                        dignities["domicile"].append(planet_pos.planet.value)

        return dignities

    def _generate_personality_summary(
        self, sun: ZodiacSign, moon: ZodiacSign, rising: ZodiacSign
    ) -> str:
        """성격 요약 생성"""
        sun_traits = {
            ZodiacSign.ARIES: "리더십과 열정",
            ZodiacSign.TAURUS: "안정과 인내",
            ZodiacSign.GEMINI: "소통과 호기심",
            ZodiacSign.CANCER: "감성과 보호 본능",
            ZodiacSign.LEO: "자신감과 창의성",
            ZodiacSign.VIRGO: "분석력과 세심함",
            ZodiacSign.LIBRA: "조화와 공정함",
            ZodiacSign.SCORPIO: "열정과 통찰력",
            ZodiacSign.SAGITTARIUS: "모험심과 낙천성",
            ZodiacSign.CAPRICORN: "책임감과 야망",
            ZodiacSign.AQUARIUS: "독창성과 인도주의",
            ZodiacSign.PISCES: "직관과 공감능력"
        }

        return (
            f"태양이 {sun.value}에 위치하여 {sun_traits.get(sun, '')}이 핵심 자아입니다. "
            f"달이 {moon.value}에 있어 감정적으로는 {sun_traits.get(moon, '')}의 특성을 보입니다. "
            f"상승점이 {rising.value}이므로 첫인상은 {sun_traits.get(rising, '')}으로 나타납니다."
        )

    def _generate_life_themes(
        self, planets: List[PlanetPosition], houses: List[HouseCusp]
    ) -> List[str]:
        """인생 테마 생성"""
        themes = []

        # 태양 하우스에 따른 테마
        sun_pos = next((p for p in planets if p.planet == Planet.SUN), None)
        if sun_pos:
            house_themes = {
                1: "자아 실현", 2: "재물과 가치", 3: "소통과 학습",
                4: "가정과 뿌리", 5: "창조와 즐거움", 6: "건강과 봉사",
                7: "관계와 파트너십", 8: "변환과 공유 자원",
                9: "철학과 여행", 10: "커리어와 명예",
                11: "친구와 이상", 12: "영성과 무의식"
            }
            themes.append(house_themes.get(sun_pos.house, "자아 실현"))

        # 달 별자리에 따른 감정 테마
        moon_pos = next((p for p in planets if p.planet == Planet.MOON), None)
        if moon_pos:
            themes.append("정서적 안정")

        # 목성 위치에 따른 행운 영역
        jupiter_pos = next((p for p in planets if p.planet == Planet.JUPITER), None)
        if jupiter_pos:
            themes.append("확장과 성장")

        return themes

    def get_transit(self, request: TransitRequest) -> TransitResponse:
        """
        트랜짓 분석 - Swiss Ephemeris 기반 정밀 계산

        현재 행성 위치와 출생 차트의 상호작용을 분석합니다.
        """
        # 출생 차트 생성
        natal_chart = self.create_natal_chart(request.natal_chart)

        # 현재/지정된 날짜의 행성 위치 (Swiss Ephemeris 사용)
        current_planets = self._get_current_planet_positions_precise(request.transit_date)

        # 트랜짓 아스펙트 계산
        transit_aspects = self._calculate_transit_aspects(natal_chart.planets, current_planets)

        # 해석 생성
        interpretation = self._interpret_transits(transit_aspects, current_planets)
        highlights = self._get_transit_highlights(transit_aspects)

        return TransitResponse(
            date=request.transit_date,
            transiting_planets=current_planets,
            transit_aspects=transit_aspects,
            interpretation=interpretation,
            highlights=highlights
        )

    def _get_current_planet_positions_precise(self, date: datetime) -> List[PlanetPosition]:
        """Swiss Ephemeris를 사용한 정밀 행성 위치 계산"""
        if self.use_swiss_ephemeris:
            # Julian Day 계산
            jd = self.ephemeris.datetime_to_julian(date)

            # 모든 행성 위치 계산
            ephemeris_planets = self.ephemeris.get_all_planets(jd)

            # 모델로 변환
            return self._convert_planets(ephemeris_planets)
        else:
            # 폴백: 기존 근사 계산
            return self._get_current_planet_positions_fallback(date)

    def _get_current_planet_positions_fallback(self, date: datetime) -> List[PlanetPosition]:
        """현재 행성 위치 폴백 계산"""
        return self._calculate_planet_positions(
            AstrologyRequest(
                birth_year=date.year,
                birth_month=date.month,
                birth_day=date.day,
                birth_hour=12,
                birth_minute=0,
                latitude=37.5665,
                longitude=126.9780,
                timezone="Asia/Seoul"
            )
        )

    def _calculate_transit_aspects(
        self, natal: List[PlanetPosition], transit: List[PlanetPosition]
    ) -> List[Aspect]:
        """트랜짓 아스펙트 계산 - 네이탈 행성과 트랜짓 행성 간의 아스펙트"""
        aspects = []
        aspect_angles = {
            AspectType.CONJUNCTION: (0, 8),
            AspectType.SEXTILE: (60, 6),
            AspectType.SQUARE: (90, 8),
            AspectType.TRINE: (120, 8),
            AspectType.OPPOSITION: (180, 8),
        }

        # 네이탈과 트랜짓 간의 아스펙트만 계산
        for natal_planet in natal:
            for transit_planet in transit:
                diff = abs(natal_planet.degree - transit_planet.degree)
                if diff > 180:
                    diff = 360 - diff

                for aspect_type, (angle, orb) in aspect_angles.items():
                    orb_actual = abs(diff - angle)
                    if orb_actual <= orb:
                        aspects.append(Aspect(
                            planet1=transit_planet.planet,  # 트랜짓 행성
                            planet2=natal_planet.planet,     # 네이탈 행성
                            aspect_type=aspect_type,
                            degree=diff,
                            orb=orb_actual,
                            is_applying=True
                        ))
                        break

        # 오브(정확도)가 작은 순으로 정렬
        aspects.sort(key=lambda x: x.orb)
        return aspects[:15]  # 상위 15개

    def _interpret_transits(
        self, aspects: List[Aspect], current_planets: List[PlanetPosition] = None
    ) -> str:
        """트랜짓 해석 - 현재 행성 배치에 따른 상세 해석"""
        if not aspects:
            return "현재 특별한 행성 영향이 없는 안정적인 시기입니다. 내면의 성찰과 준비에 적합합니다."

        interpretation_parts = []

        # 역행 행성 확인
        if current_planets:
            retrograde_planets = [p for p in current_planets if p.is_retrograde]
            if retrograde_planets:
                retrograde_names = [p.planet.value for p in retrograde_planets[:3]]
                interpretation_parts.append(
                    f"현재 {', '.join(retrograde_names)}이(가) 역행 중으로, "
                    "과거를 돌아보고 재평가하는 시기입니다."
                )

        # 주요 아스펙트별 해석
        major_aspects = aspects[:5]
        positive_count = sum(1 for a in major_aspects if a.aspect_type in [AspectType.TRINE, AspectType.SEXTILE])
        challenging_count = sum(1 for a in major_aspects if a.aspect_type in [AspectType.SQUARE, AspectType.OPPOSITION])

        if positive_count > challenging_count:
            interpretation_parts.append(
                "전반적으로 조화로운 에너지가 흐르는 시기입니다. "
                "새로운 기회를 적극적으로 추구해 보세요."
            )
        elif challenging_count > positive_count:
            interpretation_parts.append(
                "도전적인 에너지가 활성화된 시기입니다. "
                "인내심을 가지고 성장의 기회로 삼으세요."
            )
        else:
            interpretation_parts.append(
                "균형 잡힌 에너지의 시기입니다. "
                "신중하게 결정하되 기회도 놓치지 마세요."
            )

        return " ".join(interpretation_parts)

    def _get_transit_highlights(self, aspects: List[Aspect]) -> List[str]:
        """트랜짓 하이라이트 - 주요 트랜짓 영향"""
        highlights = []

        # 행성별 해석 매핑
        planet_meanings = {
            Planet.SUN: "자아와 활력",
            Planet.MOON: "감정과 직관",
            Planet.MERCURY: "소통과 사고",
            Planet.VENUS: "사랑과 가치",
            Planet.MARS: "행동과 에너지",
            Planet.JUPITER: "확장과 행운",
            Planet.SATURN: "책임과 구조",
            Planet.URANUS: "변화와 혁신",
            Planet.NEPTUNE: "영감과 직관",
            Planet.PLUTO: "변환과 재생"
        }

        aspect_effects = {
            AspectType.CONJUNCTION: ("합", "강력한 결합 에너지"),
            AspectType.SEXTILE: ("육분", "기회와 조화"),
            AspectType.SQUARE: ("사각", "도전과 성장 기회"),
            AspectType.TRINE: ("삼합", "행운과 순조로운 흐름"),
            AspectType.OPPOSITION: ("충", "균형과 인식의 확장"),
        }

        for aspect in aspects[:5]:
            p1_meaning = planet_meanings.get(aspect.planet1, aspect.planet1.value)
            p2_meaning = planet_meanings.get(aspect.planet2, aspect.planet2.value)
            asp_name, asp_effect = aspect_effects.get(aspect.aspect_type, ("", ""))

            # 정확도에 따른 강도 표현
            if aspect.orb <= 2:
                strength = "매우 강력한"
            elif aspect.orb <= 5:
                strength = "강한"
            else:
                strength = "영향을 주는"

            highlight = (
                f"트랜짓 {aspect.planet1.value}({p1_meaning})가 "
                f"네이탈 {aspect.planet2.value}({p2_meaning})와 "
                f"{asp_name}({strength} {asp_effect})"
            )
            highlights.append(highlight)

        return highlights if highlights else ["현재 특별한 트랜짓 영향이 없는 안정적인 시기입니다."]
