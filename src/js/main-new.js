// src/js/main-new.js (사용자 관리 탭 추가된 버전)

const App = {
    // 탭 매핑 (사용자 관리 탭 추가)
    tabs: {
        'nav-football': typeof FootballSchedule !== 'undefined' ? FootballSchedule : null,
        'nav-scheduling': typeof BatchScheduling !== 'undefined' ? BatchScheduling : null,
        'nav-users': typeof Users !== 'undefined' ? Users : null, // 🆕 사용자 관리 탭 추가
        'nav-countries': typeof Countries !== 'undefined' ? Countries : null,
        'nav-sports': typeof SportsCategories !== 'undefined' ? SportsCategories : null,
        'nav-leagues': typeof Leagues !== 'undefined' ? Leagues : null,
        'nav-teams': typeof Teams !== 'undefined' ? Teams : null,
        'nav-players': typeof Players !== 'undefined' ? Players : null
    },

    // 현재 활성 탭
    currentTab: 'nav-football',

    // 앱 초기화
    async init() {
        console.log('🚀 MatchNow 앱 초기화 (사용자 관리 포함)');
        
        // 필수 객체들 확인
        if (typeof CONFIG === 'undefined') {
            console.error('❌ CONFIG 객체가 없습니다. config.js가 로드되지 않았을 수 있습니다.');
            return;
        }
        
        if (typeof API === 'undefined') {
            console.error('❌ API 객체가 없습니다. api.js가 로드되지 않았을 수 있습니다.');
            return;
        }
        
        if (typeof Utils === 'undefined') {
            console.error('❌ Utils 객체가 없습니다. utils.js가 로드되지 않았을 수 있습니다.');
            return;
        }
        
        // 🔐 인증 체크
        console.log('🔐 인증 상태 체크 시작');
        const token = localStorage.getItem('adminToken');
        if (!token) {
            console.log('❌ 토큰 없음 - 로그인 페이지로 리다이렉트');
            window.location.href = '/admin/pages/login.html';
            return;
        }
        console.log('✅ 토큰 존재 - 앱 초기화 계속');
        
        // 사용자 정보 표시
        this.updateUserInfo();
        
        // 네비게이션 이벤트 리스너 등록
        this.attachNavListeners();
        
        // API 연결 테스트
        console.log('🔌 API 연결 테스트 중...');
        try {
            const betsApiConnected = await API.testBetsApiConnection();
            if (!betsApiConnected) {
                Utils.showError('BetsAPI 연결에 실패했습니다. 백엔드 설정을 확인해주세요.');
            }
        } catch (error) {
            console.error('API 연결 테스트 실패:', error);
            Utils.showError('API 연결 테스트 중 오류가 발생했습니다.');
        }
        
        // 초기 탭 로드 (축구경기일정)
        await this.switchTab('nav-football');
        
        // 공통 데이터 로드
        try {
            await API.loadSelectOptions();
        } catch (error) {
            console.error('공통 데이터 로드 실패:', error);
            Utils.showError('공통 데이터 로드에 실패했습니다.');
        }
        
        console.log('✅ 앱 초기화 완료');
    },

    // 사용자 정보 업데이트
    updateUserInfo() {
        const userStr = localStorage.getItem('adminUser');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                const userInfoEl = document.getElementById('userInfo');
                if (userInfoEl) {
                    userInfoEl.textContent = `Logged in as ${user.name || 'Admin'}`;
                }
            } catch (error) {
                console.error('사용자 정보 파싱 실패:', error);
            }
        }
    },

    // 네비게이션 이벤트 리스너 등록
    attachNavListeners() {
        // 기존 탭들
        const tabMappings = {
            'tab-dashboard': 'nav-dashboard',
            'tab-football-schedule': 'nav-football',
            'tab-batch-scheduling': 'nav-scheduling',
            'tab-users': 'nav-users', // 🆕 사용자 관리 탭
            'tab-countries': 'nav-countries',
            'tab-sports': 'nav-sports',
            'tab-leagues': 'nav-leagues',
            'tab-teams': 'nav-teams',
            'tab-players': 'nav-players'
        };

        Object.keys(tabMappings).forEach(tabId => {
            const tabElement = document.getElementById(tabId);
            if (tabElement) {
                tabElement.addEventListener('click', () => this.switchTab(tabMappings[tabId]));
            } else {
                console.warn(`⚠️ 탭 요소를 찾을 수 없습니다: ${tabId}`);
            }
        });

        // 사용자 관리 탭 확인
        if (typeof Users !== 'undefined') {
            console.log('✅ Users 모듈 로드 완료');
        } else {
            console.warn('⚠️ Users 모듈이 로드되지 않았습니다.');
        }
    },

    // 탭 전환
    async switchTab(navId) {
        console.log('🔄 탭 전환:', navId);
        
        // 네비게이션 스타일 업데이트
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // 탭 ID 매핑 (역방향)
        const reverseMapping = {
            'nav-dashboard': 'tab-dashboard',
            'nav-football': 'tab-football-schedule',
            'nav-scheduling': 'tab-batch-scheduling',
            'nav-users': 'tab-users', // 🆕 사용자 관리
            'nav-countries': 'tab-countries',
            'nav-sports': 'tab-sports',
            'nav-leagues': 'tab-leagues',
            'nav-teams': 'tab-teams',
            'nav-players': 'tab-players'
        };

        const activeTabId = reverseMapping[navId];
        if (activeTabId) {
            const activeTab = document.getElementById(activeTabId);
            if (activeTab) {
                activeTab.classList.add('active');
            }
        }
        
        // 현재 탭 업데이트
        this.currentTab = navId;
        
        // 대시보드 처리 (별도 모듈 없음)
        if (navId === 'nav-dashboard') {
            await this.renderDashboard();
            return;
        }
        
        // 해당 탭 모듈 실행
        const tabModule = this.tabs[navId];
        if (tabModule && typeof tabModule.render === 'function') {
            try {
                await tabModule.render();
                console.log('✅ 탭 렌더링 완료:', navId);
            } catch (error) {
                console.error('❌ 탭 렌더링 실패:', navId, error);
                if (typeof Utils !== 'undefined' && Utils.showError) {
                    Utils.showError('페이지를 불러올 수 없습니다.');
                }
            }
        } else {
            // 모듈이 없는 경우 준비 중 메시지 표시
            if (typeof Utils !== 'undefined' && Utils.renderContent) {
                const moduleName = this.getTabModuleName(navId);
                Utils.renderContent(`
                    <div class="content-panel">
                        <div class="loading">
                            <h3>🚧 준비 중인 기능입니다</h3>
                            <p>해당 기능은 현재 개발 중입니다.</p>
                            <p>모듈 상태: ${tabModule ? '로드됨' : '미로드'}</p>
                            <p>모듈 이름: ${moduleName}</p>
                        </div>
                    </div>
                `);
            }
        }
    },

    // 대시보드 렌더링 (간단한 통계)
    async renderDashboard() {
        console.log('📊 대시보드 렌더링');
        
        try {
            const dashboardData = await API.loadDashboardData();
            
            Utils.renderContent(`
                <div class="content-panel">
                    <h2>📊 대시보드</h2>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <h3>${dashboardData.countries}</h3>
                            <p>국가</p>
                        </div>
                        <div class="stat-card">
                            <h3>${dashboardData.sports}</h3>
                            <p>스포츠 카테고리</p>
                        </div>
                        <div class="stat-card">
                            <h3>${dashboardData.leagues}</h3>
                            <p>리그</p>
                        </div>
                        <div class="stat-card">
                            <h3>${dashboardData.teams}</h3>
                            <p>팀</p>
                        </div>
                        <div class="stat-card">
                            <h3>${dashboardData.players}</h3>
                            <p>선수</p>
                        </div>
                    </div>
                    
                    <div style="margin-top: 30px; text-align: center;">
                        <h3>🎯 주요 기능</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 20px;">
                            <div class="feature-card" onclick="App.switchTab('nav-football')">
                                <h4>⚽ 축구 경기 관리</h4>
                                <p>실시간 경기 데이터 동기화</p>
                            </div>
                            <div class="feature-card" onclick="App.switchTab('nav-users')">
                                <h4>👤 사용자 관리</h4>
                                <p>사용자 제재 및 관리</p>
                            </div>
                            <div class="feature-card" onclick="App.switchTab('nav-scheduling')">
                                <h4>⏰ 배치 스케줄링</h4>
                                <p>자동 동기화 관리</p>
                            </div>
                        </div>
                    </div>
                </div>
            `);
            
            // 기능 카드 스타일 추가
            const style = document.createElement('style');
            style.textContent = `
                .feature-card {
                    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                    border-radius: 12px;
                    padding: 20px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: 2px solid transparent;
                }
                .feature-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                    border-color: #667eea;
                }
                .feature-card h4 {
                    color: #495057;
                    margin-bottom: 10px;
                }
                .feature-card p {
                    color: #6c757d;
                    margin: 0;
                }
            `;
            document.head.appendChild(style);
            
        } catch (error) {
            console.error('대시보드 데이터 로드 실패:', error);
            Utils.renderContent(`
                <div class="content-panel">
                    <h2>📊 대시보드</h2>
                    <div class="error">대시보드 데이터를 불러올 수 없습니다.</div>
                </div>
            `);
        }
    },

    // 탭 모듈 이름 반환
    getTabModuleName(navId) {
        const moduleNames = {
            'nav-dashboard': 'Dashboard',
            'nav-football': 'FootballSchedule',
            'nav-scheduling': 'BatchScheduling',
            'nav-users': 'Users', // 🆕 사용자 관리
            'nav-countries': 'Countries',
            'nav-sports': 'SportsCategories',
            'nav-leagues': 'Leagues',
            'nav-teams': 'Teams',
            'nav-players': 'Players'
        };
        return moduleNames[navId] || navId;
    },

    // 페이지 새로고침
    refresh() {
        if (this.currentTab === 'nav-dashboard') {
            this.renderDashboard();
        } else {
            const tabModule = this.tabs[this.currentTab];
            if (tabModule && typeof tabModule.render === 'function') {
                tabModule.render();
            }
        }
    }
};

// DOM 로드 완료 시 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM 로드 완료 - 앱 초기화 시작 (사용자 관리 포함)');
    
    // 모듈 로드 상태 확인
    const modules = [
        { name: 'FootballSchedule', obj: typeof FootballSchedule !== 'undefined' },
        { name: 'BatchScheduling', obj: typeof BatchScheduling !== 'undefined' },
        { name: 'Users', obj: typeof Users !== 'undefined' }, // 🆕 사용자 관리 모듈 확인
        { name: 'Countries', obj: typeof Countries !== 'undefined' },
        { name: 'SportsCategories', obj: typeof SportsCategories !== 'undefined' },
        { name: 'Leagues', obj: typeof Leagues !== 'undefined' },
        { name: 'Teams', obj: typeof Teams !== 'undefined' },
        { name: 'Players', obj: typeof Players !== 'undefined' }
    ];
    
    modules.forEach(module => {
        if (module.obj) {
            console.log(`✅ ${module.name} 모듈 로드됨`);
        } else {
            console.warn(`⚠️ ${module.name} 모듈이 로드되지 않았습니다.`);
        }
    });
    
    App.init().catch(error => {
        console.error('❌ 앱 초기화 실패:', error);
    });
});

// 전역 함수로 노출 (필요한 경우)
window.App = App;