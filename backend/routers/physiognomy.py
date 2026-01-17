"""관상 (Physiognomy) API 라우터"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import Optional
import base64
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.physiognomy_models import (
    PhysiognomyRequest, PhysiognomyResponse,
    FaceRegion, FaceShape
)
from services.physiognomy_service import PhysiognomyService

router = APIRouter()
physiognomy_service = PhysiognomyService()


@router.post("/analyze", response_model=PhysiognomyResponse)
async def analyze_face(request: PhysiognomyRequest):
    """
    관상 분석

    - Google MediaPipe 기반 468개 랜드마크 추출
    - 관상학 12궁 분석
    - 생체정보 별도 동의 필수

    **보안 정책:**
    - 원본 이미지는 분석 후 즉시 파기
    - 특징점 데이터만 처리에 사용
    """
    # 생체정보 동의 확인
    if not request.consent_biometric:
        raise HTTPException(
            status_code=400,
            detail="생체인식정보 처리에 대한 별도 동의가 필요합니다."
        )

    try:
        result = physiognomy_service.analyze(request)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"분석 중 오류: {str(e)}")


@router.post("/analyze-upload")
async def analyze_face_upload(
    file: UploadFile = File(...),
    consent_biometric: bool = False
):
    """
    관상 분석 (파일 업로드 방식)

    - 이미지 파일 직접 업로드
    - 지원 형식: JPEG, PNG
    """
    if not consent_biometric:
        raise HTTPException(
            status_code=400,
            detail="생체인식정보 처리에 대한 별도 동의가 필요합니다."
        )

    # 파일 형식 검증
    allowed_types = ["image/jpeg", "image/png", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 파일 형식입니다. 지원 형식: {', '.join(allowed_types)}"
        )

    try:
        # 파일 읽기 및 Base64 인코딩
        contents = await file.read()
        image_base64 = base64.b64encode(contents).decode('utf-8')

        request = PhysiognomyRequest(
            image_base64=f"data:{file.content_type};base64,{image_base64}",
            consent_biometric=consent_biometric
        )

        result = physiognomy_service.analyze(request)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # 메모리에서 이미지 데이터 삭제
        del contents
        del image_base64


@router.get("/regions")
async def get_face_regions():
    """
    관상 12궁 정보 조회

    - 각 부위(궁)의 의미와 해석 기준
    """
    regions = {
        "명궁": {
            "location": "미간",
            "meaning": "전체적인 운세, 성격의 중심",
            "good_sign": "넓고 맑으며 흠이 없음",
            "bad_sign": "좁거나 주름, 점이 있음"
        },
        "재백궁": {
            "location": "코",
            "meaning": "재물운, 자산 관리 능력",
            "good_sign": "코가 오똑하고 콧방울이 둥글고 두툼함",
            "bad_sign": "코가 휘거나 콧구멍이 보임"
        },
        "형제궁": {
            "location": "눈썹",
            "meaning": "형제/친구 관계, 사회적 인맥",
            "good_sign": "눈썹이 길고 정돈되어 있음",
            "bad_sign": "눈썹이 짧거나 끊어짐"
        },
        "전택궁": {
            "location": "눈두덩",
            "meaning": "부동산운, 가정환경",
            "good_sign": "눈두덩이 넓고 깨끗함",
            "bad_sign": "움푹 들어가거나 어두움"
        },
        "남녀궁": {
            "location": "눈 아래 (와잠)",
            "meaning": "자녀운, 이성관계",
            "good_sign": "볼록하고 혈색이 좋음",
            "bad_sign": "꺼지거나 어두움"
        },
        "노복궁": {
            "location": "턱 아래",
            "meaning": "부하/직원운, 말년운",
            "good_sign": "턱이 각지고 넓음",
            "bad_sign": "턱이 뾰족하거나 좁음"
        },
        "처첩궁": {
            "location": "눈꼬리",
            "meaning": "배우자운, 결혼생활",
            "good_sign": "눈꼬리가 올라가고 깨끗함",
            "bad_sign": "눈꼬리가 처지거나 주름이 많음"
        },
        "질액궁": {
            "location": "콧등 (산근)",
            "meaning": "건강운, 질병 저항력",
            "good_sign": "콧등이 높고 반듯함",
            "bad_sign": "콧등이 낮거나 꺾임"
        },
        "천이궁": {
            "location": "관자놀이",
            "meaning": "여행운, 이동/변화",
            "good_sign": "관자놀이가 넓고 볼록함",
            "bad_sign": "움푹 들어감"
        },
        "관록궁": {
            "location": "이마 중앙",
            "meaning": "직업운, 사회적 지위",
            "good_sign": "이마가 넓고 둥글며 빛남",
            "bad_sign": "이마가 좁거나 흉터가 있음"
        },
        "복덕궁": {
            "location": "이마 측면",
            "meaning": "복운, 정신적 만족",
            "good_sign": "이마 측면이 넓고 둥글음",
            "bad_sign": "울퉁불퉁하거나 좁음"
        },
        "부모궁": {
            "location": "이마 양옆 (일각/월각)",
            "meaning": "부모운, 윗사람과의 관계",
            "good_sign": "좌우 균형이 맞고 깨끗함",
            "bad_sign": "비대칭이거나 흉터가 있음"
        }
    }

    return regions


@router.get("/face-shapes")
async def get_face_shapes():
    """
    얼굴형 정보 조회

    - 각 얼굴형의 특징과 관상학적 의미
    """
    shapes = {
        "oval": {
            "korean": "계란형",
            "description": "가장 이상적인 얼굴형",
            "traits": "균형 잡힌 성격, 원만한 대인관계",
            "fortune": "전반적으로 좋은 운세"
        },
        "round": {
            "korean": "둥근형",
            "description": "볼이 풍성하고 턱이 둥근 형태",
            "traits": "낙천적, 사교적, 친화력",
            "fortune": "재물운이 좋고 인복이 많음"
        },
        "square": {
            "korean": "각진형",
            "description": "턱과 광대뼈가 각진 형태",
            "traits": "의지력, 실행력, 책임감",
            "fortune": "사업운이 좋고 리더십 발휘"
        },
        "heart": {
            "korean": "하트형",
            "description": "이마가 넓고 턱이 뾰족한 형태",
            "traits": "창의적, 예민함, 예술적 감각",
            "fortune": "예술/문화 분야에서 두각"
        },
        "long": {
            "korean": "긴형",
            "description": "얼굴이 세로로 긴 형태",
            "traits": "신중함, 지적 호기심, 분석력",
            "fortune": "학문/연구 분야에서 성공"
        },
        "diamond": {
            "korean": "마름모형",
            "description": "광대뼈가 넓고 이마와 턱이 좁은 형태",
            "traits": "독립적, 개성 강함, 카리스마",
            "fortune": "특수 분야에서 성공"
        }
    }

    return shapes
