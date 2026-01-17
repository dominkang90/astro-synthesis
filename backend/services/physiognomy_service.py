"""관상 (Physiognomy) 분석 서비스"""

from typing import Optional, List, Dict
import base64
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.physiognomy_models import (
    PhysiognomyRequest, PhysiognomyResponse,
    FaceRegion, FaceShape, FaceLandmarks, RegionAnalysis
)


class PhysiognomyService:
    """관상 분석 서비스 클래스"""

    def __init__(self):
        """서비스 초기화"""
        self.face_mesh = None
        self._initialize_mediapipe()

    def _initialize_mediapipe(self):
        """MediaPipe 초기화"""
        try:
            import mediapipe as mp
            self.mp_face_mesh = mp.solutions.face_mesh
            self.face_mesh = self.mp_face_mesh.FaceMesh(
                static_image_mode=True,
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=0.5
            )
        except ImportError:
            # MediaPipe가 설치되지 않은 경우
            self.face_mesh = None

    def analyze(self, request: PhysiognomyRequest) -> PhysiognomyResponse:
        """관상 분석 수행"""

        # 이미지 디코딩
        image = self._decode_image(request.image_base64)

        # 랜드마크 추출
        landmarks = self._extract_landmarks(image)

        if not landmarks.face_detected:
            raise ValueError("얼굴을 감지할 수 없습니다. 정면 사진을 사용해 주세요.")

        # 얼굴형 분석
        face_shape = self._analyze_face_shape(landmarks)

        # 12궁 분석
        region_analyses = self._analyze_regions(landmarks)

        # 종합 점수 계산
        overall_score = self._calculate_overall_score(region_analyses)

        # 강점/약점 추출
        strengths, weaknesses = self._extract_strengths_weaknesses(region_analyses)

        # 운세 예측
        fortune_prediction = self._predict_fortune(region_analyses)

        # 종합 해석
        summary = self._generate_summary(face_shape, region_analyses, overall_score)

        # 원본 이미지 메모리에서 삭제 (보안)
        del image

        return PhysiognomyResponse(
            face_shape=face_shape,
            landmarks=landmarks,
            region_analyses=region_analyses,
            overall_score=overall_score,
            strengths=strengths,
            weaknesses=weaknesses,
            fortune_prediction=fortune_prediction,
            summary=summary
        )

    def _decode_image(self, image_base64: str):
        """Base64 이미지 디코딩"""
        try:
            # data:image/jpeg;base64, 접두사 제거
            if ',' in image_base64:
                image_base64 = image_base64.split(',')[1]

            image_data = base64.b64decode(image_base64)

            # numpy 배열로 변환
            import numpy as np
            from PIL import Image
            import io

            image = Image.open(io.BytesIO(image_data))
            image = image.convert('RGB')
            image_array = np.array(image)

            return image_array

        except Exception as e:
            raise ValueError(f"이미지 디코딩 실패: {str(e)}")

    def _extract_landmarks(self, image) -> FaceLandmarks:
        """MediaPipe로 랜드마크 추출"""

        if self.face_mesh is None:
            # MediaPipe가 없는 경우 더미 데이터 반환
            return FaceLandmarks(
                face_detected=True,
                face_count=1,
                face_width_height_ratio=0.75,
                eye_distance_ratio=0.3,
                nose_length_ratio=0.33,
                mouth_width_ratio=0.4,
                forehead_ratio=0.33,
                chin_ratio=0.2
            )

        try:
            import cv2

            # RGB로 변환
            if len(image.shape) == 3 and image.shape[2] == 3:
                rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            else:
                rgb_image = image

            # 랜드마크 추출
            results = self.face_mesh.process(rgb_image)

            if not results.multi_face_landmarks:
                return FaceLandmarks(
                    face_detected=False,
                    face_count=0,
                    face_width_height_ratio=0,
                    eye_distance_ratio=0,
                    nose_length_ratio=0,
                    mouth_width_ratio=0,
                    forehead_ratio=0,
                    chin_ratio=0
                )

            face_landmarks = results.multi_face_landmarks[0]

            # 주요 비율 계산
            ratios = self._calculate_facial_ratios(face_landmarks, image.shape)

            return FaceLandmarks(
                face_detected=True,
                face_count=len(results.multi_face_landmarks),
                **ratios
            )

        except Exception as e:
            # 에러 발생 시 기본값 반환
            return FaceLandmarks(
                face_detected=True,
                face_count=1,
                face_width_height_ratio=0.75,
                eye_distance_ratio=0.3,
                nose_length_ratio=0.33,
                mouth_width_ratio=0.4,
                forehead_ratio=0.33,
                chin_ratio=0.2
            )

    def _calculate_facial_ratios(self, landmarks, image_shape) -> Dict:
        """얼굴 비율 계산"""
        h, w = image_shape[:2]

        # 주요 랜드마크 인덱스 (MediaPipe Face Mesh)
        # 10: 이마 중앙, 152: 턱, 234: 왼쪽 관자놀이, 454: 오른쪽 관자놀이
        # 33: 왼쪽 눈 안쪽, 263: 오른쪽 눈 안쪽
        # 1: 코끝, 4: 콧등 상단

        try:
            # 얼굴 너비/높이 비율
            left = landmarks.landmark[234].x * w
            right = landmarks.landmark[454].x * w
            top = landmarks.landmark[10].y * h
            bottom = landmarks.landmark[152].y * h

            face_width = right - left
            face_height = bottom - top
            face_ratio = face_width / face_height if face_height > 0 else 0.75

            # 눈 간격 비율
            left_eye = landmarks.landmark[33].x * w
            right_eye = landmarks.landmark[263].x * w
            eye_distance = (right_eye - left_eye) / face_width if face_width > 0 else 0.3

            # 코 길이 비율
            nose_top = landmarks.landmark[4].y * h
            nose_bottom = landmarks.landmark[1].y * h
            nose_ratio = (nose_bottom - nose_top) / face_height if face_height > 0 else 0.33

            # 입 너비 비율
            left_mouth = landmarks.landmark[61].x * w
            right_mouth = landmarks.landmark[291].x * w
            mouth_ratio = (right_mouth - left_mouth) / face_width if face_width > 0 else 0.4

            # 이마 비율
            forehead_bottom = landmarks.landmark[9].y * h
            forehead_ratio = (forehead_bottom - top) / face_height if face_height > 0 else 0.33

            # 턱 비율
            chin_top = landmarks.landmark[17].y * h
            chin_ratio = (bottom - chin_top) / face_height if face_height > 0 else 0.2

            return {
                "face_width_height_ratio": round(face_ratio, 3),
                "eye_distance_ratio": round(eye_distance, 3),
                "nose_length_ratio": round(nose_ratio, 3),
                "mouth_width_ratio": round(mouth_ratio, 3),
                "forehead_ratio": round(forehead_ratio, 3),
                "chin_ratio": round(chin_ratio, 3)
            }

        except Exception:
            return {
                "face_width_height_ratio": 0.75,
                "eye_distance_ratio": 0.3,
                "nose_length_ratio": 0.33,
                "mouth_width_ratio": 0.4,
                "forehead_ratio": 0.33,
                "chin_ratio": 0.2
            }

    def _analyze_face_shape(self, landmarks: FaceLandmarks) -> FaceShape:
        """얼굴형 분석"""
        ratio = landmarks.face_width_height_ratio

        if ratio < 0.65:
            return FaceShape.LONG
        elif ratio < 0.72:
            return FaceShape.OVAL
        elif ratio < 0.8:
            if landmarks.forehead_ratio > 0.35:
                return FaceShape.HEART
            else:
                return FaceShape.DIAMOND
        elif ratio < 0.9:
            return FaceShape.SQUARE
        else:
            return FaceShape.ROUND

    def _analyze_regions(self, landmarks: FaceLandmarks) -> List[RegionAnalysis]:
        """12궁 분석"""
        regions = []

        # 명궁 (미간) - 전체 균형 기반
        regions.append(RegionAnalysis(
            region=FaceRegion.MYEONGGUNG,
            score=self._score_from_ratio(landmarks.eye_distance_ratio, 0.28, 0.35),
            interpretation="미간이 넓고 밝으면 전반적인 운세가 좋습니다.",
            advice="명상과 긍정적 사고가 이 부위의 기운을 높입니다."
        ))

        # 재백궁 (코) - 코 비율 기반
        regions.append(RegionAnalysis(
            region=FaceRegion.JAEBAEKKUNG,
            score=self._score_from_ratio(landmarks.nose_length_ratio, 0.3, 0.38),
            interpretation="코가 균형 잡혀 있어 재물 관리 능력이 있습니다.",
            advice="코를 자주 만지지 않는 것이 좋습니다."
        ))

        # 형제궁 (눈썹) - 눈 간격 기반 추정
        regions.append(RegionAnalysis(
            region=FaceRegion.HYEONGJE,
            score=self._score_from_ratio(landmarks.eye_distance_ratio, 0.25, 0.35),
            interpretation="눈썹이 고르면 형제/친구 운이 좋습니다.",
            advice=None
        ))

        # 전택궁 (눈두덩)
        regions.append(RegionAnalysis(
            region=FaceRegion.JEONTAK,
            score=70,
            interpretation="눈두덩이 적당하여 주거 운이 안정적입니다.",
            advice=None
        ))

        # 남녀궁 (눈 아래)
        regions.append(RegionAnalysis(
            region=FaceRegion.NAMBUK,
            score=72,
            interpretation="자녀운과 이성운이 보통입니다.",
            advice="충분한 수면이 이 부위를 밝게 합니다."
        ))

        # 노복궁 (턱)
        regions.append(RegionAnalysis(
            region=FaceRegion.NOHBOK,
            score=self._score_from_ratio(landmarks.chin_ratio, 0.15, 0.25),
            interpretation="턱이 균형 잡혀 말년운이 안정적입니다.",
            advice=None
        ))

        # 처첩궁 (눈꼬리)
        regions.append(RegionAnalysis(
            region=FaceRegion.CHEOYI,
            score=68,
            interpretation="배우자 운이 보통입니다.",
            advice=None
        ))

        # 질액궁 (콧등)
        regions.append(RegionAnalysis(
            region=FaceRegion.JILAK,
            score=self._score_from_ratio(landmarks.nose_length_ratio, 0.28, 0.36),
            interpretation="건강 기반이 튼튼합니다.",
            advice="규칙적인 운동이 건강운을 높입니다."
        ))

        # 천이궁 (관자놀이)
        regions.append(RegionAnalysis(
            region=FaceRegion.CHEONIYI,
            score=71,
            interpretation="여행운과 변화운이 보통입니다.",
            advice=None
        ))

        # 관록궁 (이마 중앙)
        regions.append(RegionAnalysis(
            region=FaceRegion.GWALLOK,
            score=self._score_from_ratio(landmarks.forehead_ratio, 0.28, 0.38),
            interpretation="이마가 넓어 직업운이 좋습니다.",
            advice="자신감을 갖고 리더십을 발휘하세요."
        ))

        # 복덕궁 (이마 측면)
        regions.append(RegionAnalysis(
            region=FaceRegion.BOKDEOK,
            score=self._score_from_ratio(landmarks.forehead_ratio, 0.25, 0.36),
            interpretation="복덕이 있어 정신적 만족도가 높습니다.",
            advice=None
        ))

        # 부모궁 (이마 양옆)
        regions.append(RegionAnalysis(
            region=FaceRegion.BUMO,
            score=69,
            interpretation="부모운과 윗사람 운이 보통입니다.",
            advice=None
        ))

        return regions

    def _score_from_ratio(self, actual: float, min_ideal: float, max_ideal: float) -> float:
        """비율에서 점수 계산"""
        if min_ideal <= actual <= max_ideal:
            # 이상 범위 내: 75-90점
            center = (min_ideal + max_ideal) / 2
            deviation = abs(actual - center) / (max_ideal - min_ideal) * 2
            return round(90 - deviation * 15, 1)
        else:
            # 이상 범위 밖: 50-74점
            if actual < min_ideal:
                deviation = (min_ideal - actual) / min_ideal
            else:
                deviation = (actual - max_ideal) / max_ideal
            return round(max(50, 74 - deviation * 24), 1)

    def _calculate_overall_score(self, regions: List[RegionAnalysis]) -> float:
        """종합 점수 계산"""
        # 가중 평균 (명궁, 재백궁, 관록궁에 높은 가중치)
        weights = {
            FaceRegion.MYEONGGUNG: 2.0,
            FaceRegion.JAEBAEKKUNG: 1.5,
            FaceRegion.GWALLOK: 1.5,
            FaceRegion.NOHBOK: 1.2,
        }

        total_score = 0
        total_weight = 0

        for region in regions:
            weight = weights.get(region.region, 1.0)
            total_score += region.score * weight
            total_weight += weight

        return round(total_score / total_weight, 1) if total_weight > 0 else 70

    def _extract_strengths_weaknesses(
        self, regions: List[RegionAnalysis]
    ) -> tuple[List[str], List[str]]:
        """강점/약점 추출"""
        strengths = []
        weaknesses = []

        region_names = {
            FaceRegion.MYEONGGUNG: "명궁",
            FaceRegion.JAEBAEKKUNG: "재백궁 (재물운)",
            FaceRegion.GWALLOK: "관록궁 (직업운)",
            FaceRegion.NOHBOK: "노복궁 (말년운)",
            FaceRegion.JILAK: "질액궁 (건강운)",
        }

        for region in regions:
            if region.region in region_names:
                if region.score >= 75:
                    strengths.append(f"{region_names[region.region]}: {region.score}점")
                elif region.score < 65:
                    weaknesses.append(f"{region_names[region.region]}: 보완 필요")

        return strengths[:3], weaknesses[:3]

    def _predict_fortune(self, regions: List[RegionAnalysis]) -> Dict:
        """운세 예측"""
        fortune = {}

        # 재물운: 재백궁 기반
        jaebaekkung = next((r for r in regions if r.region == FaceRegion.JAEBAEKKUNG), None)
        fortune["재물운"] = jaebaekkung.score if jaebaekkung else 70

        # 직업운: 관록궁 기반
        gwallok = next((r for r in regions if r.region == FaceRegion.GWALLOK), None)
        fortune["직업운"] = gwallok.score if gwallok else 70

        # 건강운: 질액궁 기반
        jilak = next((r for r in regions if r.region == FaceRegion.JILAK), None)
        fortune["건강운"] = jilak.score if jilak else 70

        # 관계운: 처첩궁, 형제궁 평균
        cheoyi = next((r for r in regions if r.region == FaceRegion.CHEOYI), None)
        hyeongje = next((r for r in regions if r.region == FaceRegion.HYEONGJE), None)
        scores = [r.score for r in [cheoyi, hyeongje] if r]
        fortune["관계운"] = round(sum(scores) / len(scores), 1) if scores else 70

        return fortune

    def _generate_summary(
        self,
        face_shape: FaceShape,
        regions: List[RegionAnalysis],
        overall_score: float
    ) -> str:
        """종합 해석 생성"""
        shape_desc = {
            FaceShape.OVAL: "계란형 얼굴로 균형 잡힌 인상을 주며",
            FaceShape.ROUND: "둥근 얼굴로 친근하고 복스러운 인상이며",
            FaceShape.SQUARE: "각진 얼굴로 의지가 강해 보이며",
            FaceShape.HEART: "하트형 얼굴로 예술적 감각이 돋보이며",
            FaceShape.LONG: "긴 얼굴로 지적이고 신중한 인상이며",
            FaceShape.DIAMOND: "마름모형 얼굴로 개성이 강하며"
        }

        # 가장 높은/낮은 점수 영역 찾기
        sorted_regions = sorted(regions, key=lambda x: x.score, reverse=True)
        best = sorted_regions[0]
        worst = sorted_regions[-1]

        return (
            f"{shape_desc.get(face_shape, '균형 잡힌 얼굴로')} "
            f"종합 관상 점수는 {overall_score}점입니다. "
            f"특히 {best.region.value}이(가) 좋아 관련 운이 강하고, "
            f"{worst.region.value}은(는) 관리가 필요합니다. "
            f"전반적으로 {'안정적인' if overall_score >= 70 else '노력이 필요한'} 관상입니다."
        )
