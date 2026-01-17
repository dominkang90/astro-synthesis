"""
Swiss Ephemeris 연동 모듈
pyswisseph를 활용한 정밀 천문 계산
"""

from datetime import datetime, timezone
from typing import Optional, List, Dict, Tuple
import math

try:
    import swisseph as swe
    SWISSEPH_AVAILABLE = True
except ImportError:
    SWISSEPH_AVAILABLE = False
    print("Warning: pyswisseph not installed. Using fallback calculations.")


class SwissEphemeris:
    """Swiss Ephemeris 기반 천문 계산 클래스"""

    # 행성 코드
    PLANETS = {
        'sun': swe.SUN if SWISSEPH_AVAILABLE else 0,
        'moon': swe.MOON if SWISSEPH_AVAILABLE else 1,
        'mercury': swe.MERCURY if SWISSEPH_AVAILABLE else 2,
        'venus': swe.VENUS if SWISSEPH_AVAILABLE else 3,
        'mars': swe.MARS if SWISSEPH_AVAILABLE else 4,
        'jupiter': swe.JUPITER if SWISSEPH_AVAILABLE else 5,
        'saturn': swe.SATURN if SWISSEPH_AVAILABLE else 6,
        'uranus': swe.URANUS if SWISSEPH_AVAILABLE else 7,
        'neptune': swe.NEPTUNE if SWISSEPH_AVAILABLE else 8,
        'pluto': swe.PLUTO if SWISSEPH_AVAILABLE else 9,
        'north_node': swe.TRUE_NODE if SWISSEPH_AVAILABLE else 11,
        'chiron': swe.CHIRON if SWISSEPH_AVAILABLE else 15,
    }

    # 하우스 시스템 코드
    HOUSE_SYSTEMS = {
        'placidus': b'P',
        'koch': b'K',
        'regiomontanus': b'R',
        'campanus': b'C',
        'equal': b'E',
        'whole_sign': b'W',
        'porphyry': b'O',
        'alcabitius': b'B',
        'morinus': b'M',
    }

    # 별자리 이름
    ZODIAC_SIGNS = [
        'aries', 'taurus', 'gemini', 'cancer',
        'leo', 'virgo', 'libra', 'scorpio',
        'sagittarius', 'capricorn', 'aquarius', 'pisces'
    ]

    # 아스펙트 각도와 허용 오브
    ASPECTS = {
        'conjunction': (0, 8),
        'sextile': (60, 6),
        'square': (90, 8),
        'trine': (120, 8),
        'opposition': (180, 8),
        'quincunx': (150, 3),
        'semi_sextile': (30, 2),
        'semi_square': (45, 2),
        'sesquiquadrate': (135, 2),
    }

    def __init__(self, ephe_path: Optional[str] = None):
        """
        Swiss Ephemeris 초기화

        Args:
            ephe_path: Ephemeris 데이터 파일 경로 (없으면 기본 경로 사용)
        """
        self.initialized = False

        if SWISSEPH_AVAILABLE:
            if ephe_path:
                swe.set_ephe_path(ephe_path)

            # Ephemeris 타입 설정 (Swiss Ephemeris 사용)
            swe.set_sid_mode(swe.SIDM_FAGAN_BRADLEY)  # Sidereal mode (옵션)

            self.initialized = True

    def datetime_to_julian(self, dt: datetime) -> float:
        """
        datetime을 Julian Day로 변환

        Args:
            dt: 변환할 datetime 객체

        Returns:
            Julian Day 숫자
        """
        if not SWISSEPH_AVAILABLE:
            # 간단한 근사 계산
            return self._approximate_julian_day(dt)

        # UTC로 변환
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)

        utc_dt = dt.astimezone(timezone.utc)

        # 시간을 소수점으로 변환
        hour_decimal = (
            utc_dt.hour +
            utc_dt.minute / 60.0 +
            utc_dt.second / 3600.0
        )

        # Julian Day 계산
        jd = swe.julday(
            utc_dt.year,
            utc_dt.month,
            utc_dt.day,
            hour_decimal
        )

        return jd

    def _approximate_julian_day(self, dt: datetime) -> float:
        """Julian Day 근사 계산 (fallback)"""
        a = (14 - dt.month) // 12
        y = dt.year + 4800 - a
        m = dt.month + 12 * a - 3

        jdn = dt.day + (153 * m + 2) // 5 + 365 * y + y // 4 - y // 100 + y // 400 - 32045

        hour_decimal = dt.hour + dt.minute / 60.0 + dt.second / 3600.0
        return jdn + (hour_decimal - 12) / 24.0

    def get_planet_position(
        self,
        planet: str,
        jd: float,
        flags: int = None
    ) -> Dict:
        """
        행성 위치 계산

        Args:
            planet: 행성 이름 (sun, moon, mercury, etc.)
            jd: Julian Day
            flags: 계산 플래그 (기본: SEFLG_SWIEPH | SEFLG_SPEED)

        Returns:
            행성 위치 정보 딕셔너리
        """
        if not SWISSEPH_AVAILABLE:
            return self._fallback_planet_position(planet, jd)

        if flags is None:
            flags = swe.FLG_SWIEPH | swe.FLG_SPEED

        planet_code = self.PLANETS.get(planet.lower())
        if planet_code is None:
            raise ValueError(f"Unknown planet: {planet}")

        try:
            # 행성 위치 계산
            result, ret_flag = swe.calc_ut(jd, planet_code, flags)

            longitude = result[0]  # 황경
            latitude = result[1]   # 황위
            distance = result[2]   # 거리 (AU)
            speed_long = result[3]  # 황경 속도 (도/일)
            speed_lat = result[4]   # 황위 속도
            speed_dist = result[5]  # 거리 변화율

            # 별자리 및 도수 계산
            sign_index = int(longitude / 30)
            sign_degree = longitude % 30

            # 역행 여부
            is_retrograde = speed_long < 0

            return {
                'planet': planet,
                'longitude': round(longitude, 4),
                'latitude': round(latitude, 4),
                'distance': round(distance, 6),
                'speed': round(speed_long, 4),
                'sign': self.ZODIAC_SIGNS[sign_index],
                'sign_index': sign_index,
                'sign_degree': round(sign_degree, 4),
                'is_retrograde': is_retrograde,
                'degree_minute': self._degree_to_dms(sign_degree)
            }

        except Exception as e:
            print(f"Error calculating position for {planet}: {e}")
            return self._fallback_planet_position(planet, jd)

    def _fallback_planet_position(self, planet: str, jd: float) -> Dict:
        """행성 위치 근사 계산 (fallback)"""
        # 매우 간략화된 근사
        base_positions = {
            'sun': 0, 'moon': 30, 'mercury': 10, 'venus': 20,
            'mars': 60, 'jupiter': 90, 'saturn': 120,
            'uranus': 150, 'neptune': 180, 'pluto': 210
        }

        # JD 2451545.0 = 2000-01-01 12:00 UTC (J2000.0)
        days_since_j2000 = jd - 2451545.0

        # 간단한 평균 운동
        mean_motions = {
            'sun': 0.9856, 'moon': 13.1764, 'mercury': 4.0923,
            'venus': 1.6021, 'mars': 0.5240, 'jupiter': 0.0831,
            'saturn': 0.0335, 'uranus': 0.0117, 'neptune': 0.0060,
            'pluto': 0.0040
        }

        base = base_positions.get(planet.lower(), 0)
        motion = mean_motions.get(planet.lower(), 1)
        longitude = (base + days_since_j2000 * motion) % 360

        sign_index = int(longitude / 30)
        sign_degree = longitude % 30

        return {
            'planet': planet,
            'longitude': round(longitude, 4),
            'latitude': 0,
            'distance': 1.0,
            'speed': motion,
            'sign': self.ZODIAC_SIGNS[sign_index],
            'sign_index': sign_index,
            'sign_degree': round(sign_degree, 4),
            'is_retrograde': False,
            'degree_minute': self._degree_to_dms(sign_degree)
        }

    def get_all_planets(self, jd: float) -> List[Dict]:
        """모든 주요 행성 위치 계산"""
        planets = ['sun', 'moon', 'mercury', 'venus', 'mars',
                   'jupiter', 'saturn', 'uranus', 'neptune', 'pluto']

        return [self.get_planet_position(p, jd) for p in planets]

    def calculate_houses(
        self,
        jd: float,
        latitude: float,
        longitude: float,
        house_system: str = 'placidus'
    ) -> Dict:
        """
        하우스 커스프 계산

        Args:
            jd: Julian Day
            latitude: 위도
            longitude: 경도
            house_system: 하우스 시스템 이름

        Returns:
            하우스 정보 딕셔너리
        """
        if not SWISSEPH_AVAILABLE:
            return self._fallback_houses(jd, latitude, longitude)

        hsys = self.HOUSE_SYSTEMS.get(house_system.lower(), b'P')

        try:
            # 하우스 계산
            cusps, ascmc = swe.houses(jd, latitude, longitude, hsys)

            # ASC, MC, ARMC, Vertex 추출
            asc = ascmc[0]
            mc = ascmc[1]
            armc = ascmc[2]
            vertex = ascmc[3]

            houses = []
            for i, cusp in enumerate(cusps[1:13], 1):  # cusps[0]은 더미
                sign_index = int(cusp / 30)
                sign_degree = cusp % 30

                houses.append({
                    'house': i,
                    'cusp': round(cusp, 4),
                    'sign': self.ZODIAC_SIGNS[sign_index],
                    'sign_degree': round(sign_degree, 4),
                    'degree_minute': self._degree_to_dms(sign_degree)
                })

            return {
                'house_system': house_system,
                'houses': houses,
                'ascendant': {
                    'longitude': round(asc, 4),
                    'sign': self.ZODIAC_SIGNS[int(asc / 30)],
                    'sign_degree': round(asc % 30, 4)
                },
                'midheaven': {
                    'longitude': round(mc, 4),
                    'sign': self.ZODIAC_SIGNS[int(mc / 30)],
                    'sign_degree': round(mc % 30, 4)
                },
                'vertex': {
                    'longitude': round(vertex, 4),
                    'sign': self.ZODIAC_SIGNS[int(vertex / 30)],
                    'sign_degree': round(vertex % 30, 4)
                }
            }

        except Exception as e:
            print(f"Error calculating houses: {e}")
            return self._fallback_houses(jd, latitude, longitude)

    def _fallback_houses(self, jd: float, latitude: float, longitude: float) -> Dict:
        """하우스 근사 계산 (fallback)"""
        # Local Sidereal Time 근사
        days_since_j2000 = jd - 2451545.0
        lst = (280.46061837 + 360.98564736629 * days_since_j2000 + longitude) % 360

        asc = lst  # 매우 단순화된 ASC
        mc = (lst + 270) % 360

        houses = []
        for i in range(1, 13):
            cusp = (asc + (i - 1) * 30) % 360
            sign_index = int(cusp / 30)

            houses.append({
                'house': i,
                'cusp': round(cusp, 4),
                'sign': self.ZODIAC_SIGNS[sign_index],
                'sign_degree': round(cusp % 30, 4),
                'degree_minute': self._degree_to_dms(cusp % 30)
            })

        return {
            'house_system': 'equal',
            'houses': houses,
            'ascendant': {
                'longitude': round(asc, 4),
                'sign': self.ZODIAC_SIGNS[int(asc / 30)],
                'sign_degree': round(asc % 30, 4)
            },
            'midheaven': {
                'longitude': round(mc, 4),
                'sign': self.ZODIAC_SIGNS[int(mc / 30)],
                'sign_degree': round(mc % 30, 4)
            },
            'vertex': {
                'longitude': 0,
                'sign': 'aries',
                'sign_degree': 0
            }
        }

    def calculate_aspects(
        self,
        planets: List[Dict],
        include_minor: bool = False
    ) -> List[Dict]:
        """
        행성 간 아스펙트 계산

        Args:
            planets: 행성 위치 목록
            include_minor: 마이너 아스펙트 포함 여부

        Returns:
            아스펙트 목록
        """
        aspects = []

        # 사용할 아스펙트 종류
        aspect_types = ['conjunction', 'sextile', 'square', 'trine', 'opposition']
        if include_minor:
            aspect_types.extend(['quincunx', 'semi_sextile', 'semi_square', 'sesquiquadrate'])

        for i, p1 in enumerate(planets):
            for p2 in planets[i + 1:]:
                # 두 행성 간 각도 차이
                diff = abs(p1['longitude'] - p2['longitude'])
                if diff > 180:
                    diff = 360 - diff

                # 각 아스펙트 타입 확인
                for aspect_name in aspect_types:
                    angle, orb = self.ASPECTS[aspect_name]
                    orb_actual = abs(diff - angle)

                    if orb_actual <= orb:
                        # 어플라잉 vs 세퍼레이팅
                        is_applying = self._is_applying(p1, p2, angle)

                        aspects.append({
                            'planet1': p1['planet'],
                            'planet2': p2['planet'],
                            'aspect': aspect_name,
                            'angle': angle,
                            'orb': round(orb_actual, 2),
                            'is_applying': is_applying,
                            'strength': self._aspect_strength(orb_actual, orb)
                        })
                        break  # 하나의 아스펙트만 기록

        # 강도 순으로 정렬
        aspects.sort(key=lambda x: x['orb'])

        return aspects

    def _is_applying(self, p1: Dict, p2: Dict, target_angle: float) -> bool:
        """아스펙트가 강해지는 중인지 확인"""
        current_diff = abs(p1['longitude'] - p2['longitude'])
        if current_diff > 180:
            current_diff = 360 - current_diff

        # 속도가 빠른 행성이 각도를 좁히고 있는지
        relative_speed = p1.get('speed', 0) - p2.get('speed', 0)

        if target_angle == 0:
            return current_diff > 0 and relative_speed > 0
        else:
            return current_diff < target_angle

    def _aspect_strength(self, orb_actual: float, orb_max: float) -> str:
        """아스펙트 강도 계산"""
        ratio = orb_actual / orb_max
        if ratio <= 0.25:
            return 'exact'
        elif ratio <= 0.5:
            return 'strong'
        elif ratio <= 0.75:
            return 'moderate'
        else:
            return 'weak'

    def calculate_dignities(self, planets: List[Dict]) -> Dict:
        """
        행성 품위 계산

        Args:
            planets: 행성 위치 목록

        Returns:
            품위 정보 딕셔너리
        """
        # 본좌 (Domicile)
        domicile = {
            'sun': ['leo'],
            'moon': ['cancer'],
            'mercury': ['gemini', 'virgo'],
            'venus': ['taurus', 'libra'],
            'mars': ['aries', 'scorpio'],
            'jupiter': ['sagittarius', 'pisces'],
            'saturn': ['capricorn', 'aquarius'],
            'uranus': ['aquarius'],
            'neptune': ['pisces'],
            'pluto': ['scorpio']
        }

        # 고양 (Exaltation)
        exaltation = {
            'sun': 'aries',
            'moon': 'taurus',
            'mercury': 'virgo',
            'venus': 'pisces',
            'mars': 'capricorn',
            'jupiter': 'cancer',
            'saturn': 'libra',
        }

        # 손상 (Detriment) - 본좌의 반대
        # 쇠약 (Fall) - 고양의 반대

        result = {
            'domicile': [],
            'exaltation': [],
            'detriment': [],
            'fall': []
        }

        for planet in planets:
            p_name = planet['planet'].lower()
            p_sign = planet['sign'].lower()

            # 본좌 체크
            if p_name in domicile and p_sign in domicile[p_name]:
                result['domicile'].append({
                    'planet': p_name,
                    'sign': p_sign,
                    'description': f"{p_name}이(가) {p_sign}에서 본좌에 있습니다."
                })

            # 고양 체크
            if p_name in exaltation and p_sign == exaltation[p_name]:
                result['exaltation'].append({
                    'planet': p_name,
                    'sign': p_sign,
                    'description': f"{p_name}이(가) {p_sign}에서 고양되어 있습니다."
                })

            # 손상 체크 (본좌의 반대 별자리)
            if p_name in domicile:
                opposite_signs = [self._opposite_sign(s) for s in domicile[p_name]]
                if p_sign in opposite_signs:
                    result['detriment'].append({
                        'planet': p_name,
                        'sign': p_sign,
                        'description': f"{p_name}이(가) {p_sign}에서 손상되어 있습니다."
                    })

            # 쇠약 체크 (고양의 반대 별자리)
            if p_name in exaltation:
                fall_sign = self._opposite_sign(exaltation[p_name])
                if p_sign == fall_sign:
                    result['fall'].append({
                        'planet': p_name,
                        'sign': p_sign,
                        'description': f"{p_name}이(가) {p_sign}에서 쇠약해 있습니다."
                    })

        return result

    def _opposite_sign(self, sign: str) -> str:
        """반대 별자리 반환"""
        idx = self.ZODIAC_SIGNS.index(sign.lower())
        return self.ZODIAC_SIGNS[(idx + 6) % 12]

    def _degree_to_dms(self, degree: float) -> str:
        """도수를 도/분/초 형식으로 변환"""
        d = int(degree)
        m = int((degree - d) * 60)
        s = int(((degree - d) * 60 - m) * 60)
        return f"{d}°{m}'{s}\""

    def get_natal_chart(
        self,
        birth_datetime: datetime,
        latitude: float,
        longitude: float,
        house_system: str = 'placidus'
    ) -> Dict:
        """
        완전한 출생 차트 생성

        Args:
            birth_datetime: 출생 일시
            latitude: 출생지 위도
            longitude: 출생지 경도
            house_system: 하우스 시스템

        Returns:
            완전한 차트 데이터
        """
        jd = self.datetime_to_julian(birth_datetime)

        # 행성 위치
        planets = self.get_all_planets(jd)

        # 하우스
        houses = self.calculate_houses(jd, latitude, longitude, house_system)

        # 행성이 속한 하우스 계산
        for planet in planets:
            planet['house'] = self._planet_in_house(
                planet['longitude'],
                houses['houses']
            )

        # 아스펙트
        aspects = self.calculate_aspects(planets, include_minor=False)

        # 품위
        dignities = self.calculate_dignities(planets)

        return {
            'birth_datetime': birth_datetime.isoformat(),
            'latitude': latitude,
            'longitude': longitude,
            'julian_day': jd,
            'house_system': house_system,
            'planets': planets,
            'houses': houses,
            'aspects': aspects,
            'dignities': dignities
        }

    def _planet_in_house(self, planet_longitude: float, houses: List[Dict]) -> int:
        """행성이 속한 하우스 계산"""
        for i, house in enumerate(houses):
            next_house = houses[(i + 1) % 12]

            cusp1 = house['cusp']
            cusp2 = next_house['cusp']

            # 경계 처리 (0도 / 360도)
            if cusp2 < cusp1:
                # 12궁에서 1궁으로 넘어가는 경우
                if planet_longitude >= cusp1 or planet_longitude < cusp2:
                    return house['house']
            else:
                if cusp1 <= planet_longitude < cusp2:
                    return house['house']

        return 1  # 기본값

    def close(self):
        """리소스 정리"""
        if SWISSEPH_AVAILABLE:
            swe.close()


# 싱글톤 인스턴스
_ephemeris_instance = None


def get_ephemeris() -> SwissEphemeris:
    """Swiss Ephemeris 싱글톤 인스턴스 반환"""
    global _ephemeris_instance
    if _ephemeris_instance is None:
        _ephemeris_instance = SwissEphemeris()
    return _ephemeris_instance
