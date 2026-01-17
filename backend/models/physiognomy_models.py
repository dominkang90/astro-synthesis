"""관상 (Physiognomy) 관련 Pydantic 모델"""

from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class FaceRegion(str, Enum):
    """관상 12궁 (얼굴 부위)"""
    MYEONGGUNG = "명궁"       # 命宮 - 미간
    JAEBAEKKUNG = "재백궁"    # 財帛宮 - 코
    HYEONGJE = "형제궁"       # 兄弟宮 - 눈썹
    JEONTAK = "전택궁"        # 田宅宮 - 눈두덩
    NAMBUK = "남녀궁"         # 男女宮 - 눈 아래
    NOHBOK = "노복궁"         # 奴僕宮 - 턱 아래
    CHEOYI = "처첩궁"         # 妻妾宮 - 눈꼬리
    JILAK = "질액궁"          # 疾厄宮 - 콧등
    CHEONIYI = "천이궁"       # 遷移宮 - 관자놀이
    GWALLOK = "관록궁"        # 官祿宮 - 이마 중앙
    BOKDEOK = "복덕궁"        # 福德宮 - 이마 측면
    BUMO = "부모궁"           # 父母宮 - 이마 양옆


class FaceShape(str, Enum):
    """얼굴형"""
    OVAL = "oval"          # 계란형
    ROUND = "round"        # 둥근형
    SQUARE = "square"      # 각진형
    HEART = "heart"        # 하트형
    LONG = "long"          # 긴 형
    DIAMOND = "diamond"    # 마름모형


class PhysiognomyRequest(BaseModel):
    """관상 분석 요청"""
    image_base64: str = Field(..., description="Base64 인코딩된 얼굴 이미지")
    consent_biometric: bool = Field(..., description="생체정보 처리 동의 (필수)")

    class Config:
        json_schema_extra = {
            "example": {
                "image_base64": "data:image/jpeg;base64,/9j/4AAQ...",
                "consent_biometric": True
            }
        }


class FaceLandmarks(BaseModel):
    """얼굴 랜드마크 (468개 포인트 요약)"""
    face_detected: bool = Field(..., description="얼굴 감지 여부")
    face_count: int = Field(..., description="감지된 얼굴 수")

    # 주요 비율
    face_width_height_ratio: float = Field(..., description="얼굴 가로/세로 비율")
    eye_distance_ratio: float = Field(..., description="눈 간격 비율")
    nose_length_ratio: float = Field(..., description="코 길이 비율")
    mouth_width_ratio: float = Field(..., description="입 너비 비율")
    forehead_ratio: float = Field(..., description="이마 비율")
    chin_ratio: float = Field(..., description="턱 비율")


class RegionAnalysis(BaseModel):
    """부위별 분석"""
    region: FaceRegion
    score: float = Field(..., ge=0, le=100, description="점수 (0-100)")
    interpretation: str = Field(..., description="해석")
    advice: Optional[str] = Field(None, description="조언")


class PhysiognomyResponse(BaseModel):
    """관상 분석 응답"""
    # 기본 분석
    face_shape: FaceShape = Field(..., description="얼굴형")
    landmarks: FaceLandmarks = Field(..., description="얼굴 랜드마크 분석")

    # 12궁 분석
    region_analyses: List[RegionAnalysis] = Field(..., description="12궁 분석 결과")

    # 종합 점수
    overall_score: float = Field(..., ge=0, le=100, description="종합 관상 점수")

    # 강점/약점
    strengths: List[str] = Field(..., description="관상학적 강점")
    weaknesses: List[str] = Field(..., description="관상학적 약점")

    # 운세 예측
    fortune_prediction: dict = Field(..., description="분야별 운세 예측")

    # 종합 해석
    summary: str = Field(..., description="종합 해석")

    # 주의사항
    disclaimer: str = Field(
        default="본 분석은 통계적 참고 자료이며, 의학적/법적 조언을 대체하지 않습니다.",
        description="면책 조항"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "face_shape": "oval",
                "landmarks": {
                    "face_detected": True,
                    "face_count": 1,
                    "face_width_height_ratio": 0.75,
                    "eye_distance_ratio": 0.3,
                    "nose_length_ratio": 0.33,
                    "mouth_width_ratio": 0.4,
                    "forehead_ratio": 0.33,
                    "chin_ratio": 0.2
                },
                "region_analyses": [],
                "overall_score": 72.5,
                "strengths": ["넓은 이마 - 지혜와 관록", "균형 잡힌 코 - 재물운"],
                "weaknesses": ["짧은 턱 - 말년 운 보완 필요"],
                "fortune_prediction": {
                    "재물운": 75,
                    "관계운": 70,
                    "건강운": 80,
                    "사업운": 72
                },
                "summary": "전체적으로 균형 잡힌 관상으로 안정적인 인생이 예상됩니다."
            }
        }
