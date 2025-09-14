// src/js/common/config.js (HTTPS 포트 제거 버전)
const CONFIG = {
    // 환경별 API URL 설정 (HTTPS에서 포트 제거)
    API_BASE: (() => {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        
        console.log(`🌐 현재 프로토콜: ${protocol}, 호스트: ${hostname}`);
        
        // 개발 환경 감지 (localhost인 경우만)
        const isDev = hostname === 'localhost' || hostname === '127.0.0.1';
        
        if (isDev) {
            // 개발 환경 - HTTP에서만 포트 사용
            return `${protocol}//${hostname}:4011/api/v1`;
        } else {
            // 프로덕션 환경 - HTTPS는 포트 없이
            if (protocol === 'https:') {
                return `https://${hostname}/api/v1`;
            } else {
                // HTTP인 경우 (혹시 모를 경우를 대비)
                return `http://${hostname}:4011/api/v1`;
            }
        }
    })(),
    
    TIMEOUT: 10000,
    
    // 전역 상태
    state: {
        countriesData: [],
        sportsData: [],
        currentMatchType: 'upcoming',
        currentPage: 1
    },
    
    // API 인스턴스 (axios가 로드된 후 생성)
    api: null
};

// Axios 인스턴스 생성
if (typeof axios !== 'undefined') {
    CONFIG.api = axios.create({
        baseURL: CONFIG.API_BASE,
        timeout: CONFIG.TIMEOUT,
        headers: { 'Content-Type': 'application/json' }
    });
    
    // 디버그용 로깅
    console.log('🌐 프론트엔드 API Base URL:', CONFIG.API_BASE);
    console.log('🔧 Axios 설정:', CONFIG.api.defaults);
    
    // 환경별 URL 확인 로그
    if (CONFIG.API_BASE.includes(':4011')) {
        console.log('🔧 개발 환경: HTTP + 포트 4011 사용');
    } else {
        console.log('🚀 프로덕션 환경: HTTPS + 기본 포트 사용');
    }
} else {
    console.warn('⚠️ Axios가 로드되지 않았습니다. config.js가 axios보다 먼저 로드되었을 수 있습니다.');
}