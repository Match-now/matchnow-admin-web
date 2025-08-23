// src/js/main.js (배치 스케줄링 탭 추가)

const App = {
    // 탭 매핑
    tabs: {
        'tab-dashboard': typeof Dashboard !== 'undefined' ? Dashboard : null,
        'tab-football-schedule': typeof FootballSchedule !== 'undefined' ? FootballSchedule : null,
        'tab-batch-scheduling': typeof BatchScheduling !== 'undefined' ? BatchScheduling : null,
        'tab-countries': typeof Countries !== 'undefined' ? Countries : null,
        'tab-sports': typeof SportsCategories !== 'undefined' ? SportsCategories : null,
        'tab-leagues': typeof Leagues !== 'undefined' ? Leagues : null,
        'tab-teams': typeof Teams !== 'undefined' ? Teams : null,
        'tab-players': typeof Players !== 'undefined' ? Players : null
    },

    // 현재 활성 탭
    currentTab: 'tab-dashboard',

    // 앱 초기화
    async init() {
        console.log('🚀 MatchNow 앱 초기화');
        
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
        
        // 🔐 인증 체크 추가
        console.log('🔐 인증 상태 체크 시작');
        const token = localStorage.getItem('adminToken');
        if (!token) {
            console.log('❌ 토큰 없음 - 로그인 페이지로 리다이렉트');
            window.location.href = '/admin/pages/login.html';
            return;
        }
        console.log('✅ 토큰 존재 - 앱 초기화 계속');
        
        // 탭 이벤트 리스너 등록
        this.attachTabListeners();
        
        // API 연결 테스트
        console.log('🔌 API 연결 테스트 중...');
        try {
            // BetsAPI 연결 테스트
            const betsApiConnected = await API.testBetsApiConnection();
            if (!betsApiConnected) {
                Utils.showError('BetsAPI 연결에 실패했습니다. 백엔드 설정을 확인해주세요.');
            }
            
            // 배치 API 연결 테스트
            const batchApiConnected = await this.testBatchApiConnection();
            if (batchApiConnected) {
                console.log('✅ Batch API 연결 성공');
            } else {
                console.warn('⚠️ Batch API 연결 실패 - 스케줄링 기능이 제한될 수 있습니다.');
            }
            
        } catch (error) {
            console.error('API 연결 테스트 실패:', error);
            Utils.showError('API 연결 테스트 중 오류가 발생했습니다.');
        }
        
        // 초기 탭 로드
        await this.switchTab('tab-dashboard');
        
        // 공통 데이터 로드
        try {
            await API.loadSelectOptions();
        } catch (error) {
            console.error('공통 데이터 로드 실패:', error);
            Utils.showError('공통 데이터 로드에 실패했습니다.');
        }
        
        console.log('✅ 앱 초기화 완료');
    },

    // 배치 API 연결 테스트
    async testBatchApiConnection() {
        try {
            const response = await CONFIG.api.get('/batch/list');
            console.log('✅ Batch API 연결 성공:', response.data);
            return true;
        } catch (error) {
            console.error('❌ Batch API 연결 실패:', error);
            if (error.response?.status === 404) {
                console.error('💡 힌트: Batch API 모듈이 백엔드에 제대로 등록되지 않았을 수 있습니다.');
            }
            return false;
        }
    },

    // 탭 이벤트 리스너 등록
    attachTabListeners() {
        Object.keys(this.tabs).forEach(tabId => {
            const tabElement = document.getElementById(tabId);
            if (tabElement) {
                tabElement.addEventListener('click', () => this.switchTab(tabId));
            } else {
                console.warn(`⚠️ 탭 요소를 찾을 수 없습니다: ${tabId}`);
            }
        });
    },

    // 탭 전환
    async switchTab(tabId) {
        console.log('🔄 탭 전환:', tabId);
        
        // 탭 스타일 업데이트
        if (typeof Utils !== 'undefined' && Utils.switchTab) {
            Utils.switchTab(tabId);
        }
        
        // 현재 탭 업데이트
        this.currentTab = tabId;
        
        // 해당 탭 모듈 실행
        const tabModule = this.tabs[tabId];
        if (tabModule && typeof tabModule.render === 'function') {
            try {
                await tabModule.render();
                console.log('✅ 탭 렌더링 완료:', tabId);
            } catch (error) {
                console.error('❌ 탭 렌더링 실패:', tabId, error);
                if (typeof Utils !== 'undefined' && Utils.showError) {
                    Utils.showError('페이지를 불러올 수 없습니다.');
                }
            }
        } else {
            // 모듈이 없는 경우 준비 중 메시지 표시
            if (typeof Utils !== 'undefined' && Utils.renderContent) {
                const moduleName = this.getTabModuleName(tabId);
                Utils.renderContent(`
                    <div class="content-panel">
                        <div class="loading">
                            <h3>🚧 준비 중인 기능입니다</h3>
                            <p>해당 기능은 현재 개발 중입니다.</p>
                            <p>모듈 상태: ${tabModule ? '로드됨' : '미로드'}</p>
                            <p>모듈 이름: ${moduleName}</p>
                            ${tabId === 'tab-batch-scheduling' ? 
                                '<p><strong>💡 힌트:</strong> batch-scheduling.js 파일이 로드되지 않았을 수 있습니다.</p>' : ''
                            }
                        </div>
                    </div>
                `);
            }
        }
    },

    // 탭 모듈 이름 반환
    getTabModuleName(tabId) {
        const moduleNames = {
            'tab-dashboard': 'Dashboard',
            'tab-football-schedule': 'FootballSchedule', 
            'tab-batch-scheduling': 'BatchScheduling',
            'tab-countries': 'Countries',
            'tab-sports': 'SportsCategories',
            'tab-leagues': 'Leagues',
            'tab-teams': 'Teams',
            'tab-players': 'Players'
        };
        return moduleNames[tabId] || tabId;
    },

    // 페이지 새로고침
    refresh() {
        const tabModule = this.tabs[this.currentTab];
        if (tabModule && typeof tabModule.render === 'function') {
            tabModule.render();
        }
    }
};

// DOM 로드 완료 시 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM 로드 완료 - 앱 초기화 시작');
    
    // 배치 스케줄링 모듈 로드 확인
    if (typeof BatchScheduling !== 'undefined') {
        console.log('✅ BatchScheduling 모듈 로드됨');
    } else {
        console.warn('⚠️ BatchScheduling 모듈이 로드되지 않았습니다.');
    }
    
    App.init().catch(error => {
        console.error('❌ 앱 초기화 실패:', error);
    });
});

// 전역 함수로 노출 (필요한 경우)
window.App = App;

// 🆕 전역 배치 스케줄링 함수들 (HTML에서 직접 호출용)
window.BatchSchedulingGlobal = {
    // 작업 중지 (전역 함수)
    async stopJob(jobName) {
        if (typeof BatchScheduling !== 'undefined' && BatchScheduling.stopJob) {
            return await BatchScheduling.stopJob(jobName);
        } else {
            console.error('BatchScheduling 모듈을 찾을 수 없습니다.');
            Utils.showError('배치 스케줄링 모듈을 불러올 수 없습니다.');
        }
    },
    
    // 작업 상세 보기 (전역 함수)
    async viewJobDetails(jobName) {
        if (typeof BatchScheduling !== 'undefined' && BatchScheduling.viewJobDetails) {
            return await BatchScheduling.viewJobDetails(jobName);
        } else {
            console.error('BatchScheduling 모듈을 찾을 수 없습니다.');
            Utils.showError('배치 스케줄링 모듈을 불러올 수 없습니다.');
        }
    },
    
    // 작업 재시작 (전역 함수)
    async restartJob(jobName) {
        if (typeof BatchScheduling !== 'undefined' && BatchScheduling.restartJob) {
            return await BatchScheduling.restartJob(jobName);
        } else {
            console.error('BatchScheduling 모듈을 찾을 수 없습니다.');
            Utils.showError('배치 스케줄링 모듈을 불러올 수 없습니다.');
        }
    },
    
    // 작업 삭제 (전역 함수)
    async deleteJob(jobName) {
        if (typeof BatchScheduling !== 'undefined' && BatchScheduling.deleteJob) {
            return await BatchScheduling.deleteJob(jobName);
        } else {
            console.error('BatchScheduling 모듈을 찾을 수 없습니다.');
            Utils.showError('배치 스케줄링 모듈을 불러할 수 없습니다.');
        }
    }
};