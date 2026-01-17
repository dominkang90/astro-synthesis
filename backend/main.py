"""
Astro-Synthesis Backend API
AI 통합 역학 플랫폼 - FastAPI 서버
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from routers import saju, astrology, physiognomy, synthesis


@asynccontextmanager
async def lifespan(app: FastAPI):
    """앱 시작/종료 시 실행되는 이벤트"""
    # Startup
    print("Astro-Synthesis API Server Started")
    yield
    # Shutdown
    print("Server Shutdown")


app = FastAPI(
    title="Astro-Synthesis API",
    description="AI 통합 역학 플랫폼 - 사주, 점성술, 관상 분석 API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(saju.router, prefix="/api/saju", tags=["사주 (四柱)"])
app.include_router(astrology.router, prefix="/api/astrology", tags=["점성술 (Astrology)"])
app.include_router(physiognomy.router, prefix="/api/physiognomy", tags=["관상 (Physiognomy)"])
app.include_router(synthesis.router, prefix="/api/synthesis", tags=["통합 분석 (Synthesis)"])


@app.get("/")
async def root():
    """API 루트 엔드포인트"""
    return {
        "name": "Astro-Synthesis API",
        "version": "1.0.0",
        "description": "AI 통합 역학 플랫폼",
        "endpoints": {
            "사주": "/api/saju",
            "점성술": "/api/astrology",
            "관상": "/api/physiognomy",
            "통합분석": "/api/synthesis"
        }
    }


@app.get("/health")
async def health_check():
    """서버 상태 확인"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
