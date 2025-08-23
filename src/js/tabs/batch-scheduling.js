// src/js/tabs/batch-scheduling.js

const BatchScheduling = {
    // 현재 페이지 상태
    currentPage: 1,
    
    // 배치 스케줄링 HTML 템플릿
    template: `
        <div class="content-panel">
            <h2>⏰ 배치 스케줄링 관리</h2>
            
            <!-- 스케줄링 상태 배너 -->
            <div id="schedulingStatusBanner" class="data-status-banner"></div>
            
            <!-- 컨트롤 섹션 -->
            <div class="controls scheduling-controls">
                <!-- 스케줄링 시작 버튼 -->
                <button class="btn btn-success" id="startSchedulingBtn">🚀 스케줄링 시작</button>
                
                <!-- 스케줄링 중지 버튼 -->
                <button class="btn btn-danger" id="stopSchedulingBtn">🛑 스케줄링 중지</button>
                
                <!-- 새로고침 버튼 -->
                <button class="btn btn-primary" id="refreshSchedulingBtn">🔄 새로고침</button>
                
                <!-- 상태 확인 버튼 -->
                <button class="btn btn-info" id="statusCheckBtn">📊 상태 확인</button>
                
                <!-- 전체 목록 버튼 -->
                <button class="btn btn-secondary" id="listAllJobsBtn">📋 전체 목록</button>
            </div>

            <!-- 탭 선택 -->
            <div class="scheduling-tabs">
                <button class="scheduling-tab active" id="running-jobs-tab">실행 중인 작업</button>
                <button class="scheduling-tab" id="execution-history-tab">실행 내역</button>
                <button class="scheduling-tab" id="all-jobs-tab">전체 작업</button>
            </div>
            
            <!-- 컨텐츠 영역 -->
            <div id="schedulingContent" class="scheduling-content"></div>
            
            <!-- 페이지네이션 -->
            <div id="schedulingPagination" class="pagination" style="display: none;"></div>
        </div>

        <!-- 스케줄링 시작 모달 -->
        <div id="startSchedulingModal" class="modal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🚀 배치 스케줄링 시작</h3>
                    <button class="btn btn-sm btn-danger" id="closeStartModalBtn">✕</button>
                </div>
                <div class="modal-body">
                    <form id="startSchedulingForm">
                        <div class="form-group">
                            <label>작업 이름 *</label>
                            <input type="text" id="schedulingJobName" class="form-control" 
                                   placeholder="예: match-sync-job" value="match-sync-job" required>
                            <small>고유한 작업 이름을 입력하세요</small>
                        </div>
                        
                        <div class="form-group">
                            <label>실행 주기 (초) *</label>
                            <input type="number" id="schedulingInterval" class="form-control" 
                                   min="60" max="86400" value="300" required>
                            <small>60초(1분) ~ 86400초(24시간) 사이의 값</small>
                        </div>
                        
                        <div class="form-group">
                            <label>동기화 타입 *</label>
                            <div class="checkbox-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" name="syncTypes" value="upcoming" checked>
                                    예정된 경기 (Upcoming)
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" name="syncTypes" value="inplay" checked>
                                    진행 중인 경기 (In-Play)
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" name="syncTypes" value="ended">
                                    종료된 경기 (Ended)
                                </label>
                            </div>
                            <small>동기화할 경기 타입을 선택하세요</small>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">스케줄링 시작</button>
                            <button type="button" class="btn btn-secondary" id="cancelStartBtn">취소</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- 중지 확인 모달 -->
        <div id="stopSchedulingModal" class="modal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🛑 배치 스케줄링 중지</h3>
                    <button class="btn btn-sm btn-danger" id="closeStopModalBtn">✕</button>
                </div>
                <div class="modal-body">
                    <div id="runningJobsList"></div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" id="cancelStopBtn">취소</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 상세 정보 모달 -->
        <div id="jobDetailModal" class="modal" style="display: none;">
            <div class="modal-content stats-modal-content">
                <div class="modal-header">
                    <h3 id="jobDetailTitle">📊 작업 상세 정보</h3>
                    <button class="btn btn-sm btn-danger" id="closeDetailModalBtn">✕</button>
                </div>
                <div class="modal-body" id="jobDetailBody">
                    <!-- 상세 정보가 동적으로 로드됨 -->
                </div>
            </div>
        </div>
    `,

    // 현재 활성 탭
    currentTab: 'running-jobs',

    // 렌더링
    async render() {
        console.log('⏰ 배치 스케줄링 관리 로드');
        
        Utils.renderContent(this.template);
        this.attachEventListeners();
        
        // 초기 데이터 로드
        await this.loadSchedulingStatus();
        await this.switchTab('running-jobs');
    },

    // 이벤트 리스너 등록
    attachEventListeners() {
        // 메인 버튼들
        document.getElementById('startSchedulingBtn').addEventListener('click', () => this.showStartModal());
        document.getElementById('stopSchedulingBtn').addEventListener('click', () => this.showStopModal());
        document.getElementById('refreshSchedulingBtn').addEventListener('click', () => this.refreshCurrentView());
        document.getElementById('statusCheckBtn').addEventListener('click', () => this.showStatusCheck());
        document.getElementById('listAllJobsBtn').addEventListener('click', () => this.switchTab('all-jobs'));

        // 탭 이벤트
        document.getElementById('running-jobs-tab').addEventListener('click', () => this.switchTab('running-jobs'));
        document.getElementById('execution-history-tab').addEventListener('click', () => this.switchTab('execution-history'));
        document.getElementById('all-jobs-tab').addEventListener('click', () => this.switchTab('all-jobs'));

        // 시작 모달 이벤트
        document.getElementById('closeStartModalBtn').addEventListener('click', () => this.hideStartModal());
        document.getElementById('cancelStartBtn').addEventListener('click', () => this.hideStartModal());
        document.getElementById('startSchedulingForm').addEventListener('submit', (e) => this.handleStartScheduling(e));

        // 중지 모달 이벤트
        document.getElementById('closeStopModalBtn').addEventListener('click', () => this.hideStopModal());
        document.getElementById('cancelStopBtn').addEventListener('click', () => this.hideStopModal());

        // 상세 모달 이벤트
        document.getElementById('closeDetailModalBtn').addEventListener('click', () => this.hideDetailModal());

        // 모달 외부 클릭 시 닫기
        ['startSchedulingModal', 'stopSchedulingModal', 'jobDetailModal'].forEach(modalId => {
            document.getElementById(modalId).addEventListener('click', (e) => {
                if (e.target.id === modalId) {
                    this[modalId === 'startSchedulingModal' ? 'hideStartModal' : 
                         modalId === 'stopSchedulingModal' ? 'hideStopModal' : 'hideDetailModal']();
                }
            });
        });
    },

    // 스케줄링 상태 로드
    async loadSchedulingStatus() {
        try {
            // 실행 중인 작업 수 확인
            const runningResponse = await CONFIG.api.get('/batch/list?status=running');
            const runningJobs = runningResponse.data.data || [];
            
            const banner = document.getElementById('schedulingStatusBanner');
            
            if (runningJobs.length > 0) {
                banner.className = 'data-status-banner success';
                banner.innerHTML = `
                    <div class="status-info">
                        <span class="status-icon">🟢</span>
                        <div class="status-details">
                            <strong>스케줄링 활성화</strong>
                            <br>
                            <small>현재 ${runningJobs.length}개의 작업이 실행 중입니다</small>
                        </div>
                    </div>
                `;
            } else {
                banner.className = 'data-status-banner warning';
                banner.innerHTML = `
                    <div class="status-info">
                        <span class="status-icon">🟡</span>
                        <div class="status-details">
                            <strong>스케줄링 비활성화</strong>
                            <br>
                            <small>실행 중인 작업이 없습니다</small>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('스케줄링 상태 로드 실패:', error);
            const banner = document.getElementById('schedulingStatusBanner');
            banner.className = 'data-status-banner error';
            banner.innerHTML = `
                <div class="status-info">
                    <span class="status-icon">❌</span>
                    <div class="status-details">
                        <strong>상태 확인 실패</strong>
                        <br>
                        <small>서버 연결을 확인하세요</small>
                    </div>
                </div>
            `;
        }
    },

    // 탭 전환
    async switchTab(tabType) {
        this.currentTab = tabType;
        
        // 탭 스타일 업데이트
        document.querySelectorAll('.scheduling-tab').forEach(tab => tab.classList.remove('active'));
        document.getElementById(tabType + '-tab').classList.add('active');
        
        // 해당 탭 컨텐츠 로드
        switch (tabType) {
            case 'running-jobs':
                await this.loadRunningJobs();
                break;
            case 'execution-history':
                await this.loadExecutionHistory();
                break;
            case 'all-jobs':
                await this.loadAllJobs();
                break;
        }
    },

    // 실행 중인 작업 로드
    async loadRunningJobs() {
        const container = document.getElementById('schedulingContent');
        container.innerHTML = Utils.createLoadingHTML('실행 중인 작업을 불러오는 중...');

        try {
            const response = await CONFIG.api.get('/batch/list?status=running');
            const jobs = response.data.data || [];
            
            if (jobs.length === 0) {
                container.innerHTML = this.createEmptyState('실행 중인 작업이 없습니다.', '새로운 스케줄링을 시작해보세요.');
                return;
            }

            container.innerHTML = `
                <div class="jobs-grid">
                    ${jobs.map(job => this.createRunningJobCard(job)).join('')}
                </div>
            `;
        } catch (error) {
            console.error('실행 중인 작업 로드 실패:', error);
            container.innerHTML = '<div class="error">실행 중인 작업을 불러올 수 없습니다.</div>';
        }
    },

    // 실행 내역 로드
    async loadExecutionHistory() {
        const container = document.getElementById('schedulingContent');
        container.innerHTML = Utils.createLoadingHTML('실행 내역을 불러오는 중...');

        try {
            const response = await CONFIG.api.get('/batch/list');
            const jobs = response.data.data || [];
            
            // 모든 실행 내역을 하나의 배열로 합치기
            const allExecutions = [];
            jobs.forEach(job => {
                if (job.executions && job.executions.length > 0) {
                    job.executions.forEach(execution => {
                        allExecutions.push({
                            ...execution,
                            jobName: job.name,
                            jobType: job.type,
                            jobDescription: job.description
                        });
                    });
                }
            });

            // 최신순으로 정렬
            allExecutions.sort((a, b) => new Date(b.executedAt) - new Date(a.executedAt));

            if (allExecutions.length === 0) {
                container.innerHTML = this.createEmptyState('실행 내역이 없습니다.', '작업이 실행되면 여기에 표시됩니다.');
                return;
            }

            // 페이징 처리 (최근 50개만)
            const recentExecutions = allExecutions.slice(0, 50);

            container.innerHTML = `
                <div class="execution-history-list">
                    <div class="history-header">
                        <h3>📋 최근 실행 내역 (최근 ${recentExecutions.length}개)</h3>
                        <small>총 ${allExecutions.length}개의 실행 기록이 있습니다</small>
                    </div>
                    ${recentExecutions.map(execution => this.createExecutionHistoryCard(execution)).join('')}
                </div>
            `;
        } catch (error) {
            console.error('실행 내역 로드 실패:', error);
            container.innerHTML = '<div class="error">실행 내역을 불러올 수 없습니다.</div>';
        }
    },

    // 전체 작업 로드
    async loadAllJobs() {
        const container = document.getElementById('schedulingContent');
        container.innerHTML = Utils.createLoadingHTML('전체 작업을 불러오는 중...');

        try {
            const response = await CONFIG.api.get('/batch/list');
            const jobs = response.data.data || [];
            
            if (jobs.length === 0) {
                container.innerHTML = this.createEmptyState('등록된 작업이 없습니다.', '새로운 배치 작업을 생성해보세요.');
                return;
            }

            // 상태별로 그룹화
            const runningJobs = jobs.filter(job => job.status === 'running');
            const stoppedJobs = jobs.filter(job => job.status === 'stopped');
            const errorJobs = jobs.filter(job => job.status === 'error');

            container.innerHTML = `
                <div class="all-jobs-container">
                    <div class="jobs-summary">
                        <div class="summary-card">
                            <h4>🟢 실행 중</h4>
                            <span class="count">${runningJobs.length}</span>
                        </div>
                        <div class="summary-card">
                            <h4>⚪ 중지됨</h4>
                            <span class="count">${stoppedJobs.length}</span>
                        </div>
                        <div class="summary-card">
                            <h4>🔴 오류</h4>
                            <span class="count">${errorJobs.length}</span>
                        </div>
                    </div>
                    <div class="all-jobs-list">
                        ${jobs.map(job => this.createJobCard(job)).join('')}
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('전체 작업 로드 실패:', error);
            container.innerHTML = '<div class="error">전체 작업을 불러올 수 없습니다.</div>';
        }
    },

    // 실행 중인 작업 카드 생성
    createRunningJobCard(job) {
        const nextExecution = job.nextExecutionAt ? new Date(job.nextExecutionAt).toLocaleString('ko-KR') : '알 수 없음';
        const lastExecution = job.lastExecutedAt ? new Date(job.lastExecutedAt).toLocaleString('ko-KR') : '없음';
        const successRate = job.executionCount > 0 ? Math.round((job.successCount / job.executionCount) * 100) : 0;
        
        return `
            <div class="job-card running-job">
                <div class="job-header">
                    <h3>🟢 ${job.name}</h3>
                    <div class="job-status running">실행 중</div>
                </div>
                <div class="job-info">
                    <p><strong>설명:</strong> ${job.description || '설명 없음'}</p>
                    <p><strong>실행 주기:</strong> ${job.config.intervalSeconds}초 (${Math.round(job.config.intervalSeconds / 60)}분)</p>
                    <p><strong>동기화 타입:</strong> ${job.config.syncTypes.join(', ')}</p>
                    <p><strong>다음 실행:</strong> ${nextExecution}</p>
                    <p><strong>마지막 실행:</strong> ${lastExecution}</p>
                </div>
                <div class="job-stats">
                    <div class="stat-item">
                        <span class="stat-label">총 실행</span>
                        <span class="stat-value">${job.executionCount}회</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">성공률</span>
                        <span class="stat-value">${successRate}%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">에러</span>
                        <span class="stat-value">${job.errorCount}회</span>
                    </div>
                </div>
                <div class="job-actions">
                    <button class="btn btn-info btn-sm" onclick="BatchScheduling.viewJobDetails('${job.name}')">상세 보기</button>
                    <button class="btn btn-danger btn-sm" onclick="BatchScheduling.stopJob('${job.name}')">중지</button>
                </div>
            </div>
        `;
    },

    // 실행 내역 카드 생성
    createExecutionHistoryCard(execution) {
        const executedTime = new Date(execution.executedAt).toLocaleString('ko-KR');
        const duration = execution.durationMs ? `${execution.durationMs}ms` : '알 수 없음';
        
        let statusClass = 'status-success';
        let statusIcon = '✅';
        let statusText = '성공';
        
        if (execution.result === 'error') {
            statusClass = 'status-error';
            statusIcon = '❌';
            statusText = '실패';
        } else if (execution.result === 'partial_success') {
            statusClass = 'status-warning';
            statusIcon = '⚠️';
            statusText = '부분 성공';
        }

        return `
            <div class="execution-card">
                <div class="execution-header">
                    <div class="execution-job">
                        <strong>${execution.jobName}</strong>
                        <small>${execution.jobDescription || ''}</small>
                    </div>
                    <div class="execution-status ${statusClass}">
                        ${statusIcon} ${statusText}
                    </div>
                </div>
                <div class="execution-info">
                    <div class="info-row">
                        <span class="info-label">실행 시간:</span>
                        <span class="info-value">${executedTime}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">소요 시간:</span>
                        <span class="info-value">${duration}</span>
                    </div>
                    ${execution.details ? `
                        <div class="info-row">
                            <span class="info-label">결과:</span>
                            <span class="info-value">${this.formatExecutionDetails(execution.details)}</span>
                        </div>
                    ` : ''}
                    ${execution.error ? `
                        <div class="execution-error">
                            <strong>오류:</strong> ${execution.error}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    // 작업 카드 생성 (전체 목록용)
    createJobCard(job) {
        const lastExecution = job.lastExecutedAt ? new Date(job.lastExecutedAt).toLocaleString('ko-KR') : '없음';
        const successRate = job.executionCount > 0 ? Math.round((job.successCount / job.executionCount) * 100) : 0;
        
        let statusClass = 'status-stopped';
        let statusIcon = '⚪';
        let statusText = '중지됨';
        
        if (job.status === 'running') {
            statusClass = 'status-running';
            statusIcon = '🟢';
            statusText = '실행 중';
        } else if (job.status === 'error') {
            statusClass = 'status-error';
            statusIcon = '🔴';
            statusText = '오류';
        }

        return `
            <div class="job-card ${job.status}">
                <div class="job-header">
                    <h3>${statusIcon} ${job.name}</h3>
                    <div class="job-status ${statusClass}">${statusText}</div>
                </div>
                <div class="job-info">
                    <p><strong>생성일:</strong> ${new Date(job.createdAt).toLocaleString('ko-KR')}</p>
                    <p><strong>마지막 실행:</strong> ${lastExecution}</p>
                    <p><strong>실행 주기:</strong> ${job.config.intervalSeconds}초</p>
                    <p><strong>동기화 타입:</strong> ${job.config.syncTypes.join(', ')}</p>
                </div>
                <div class="job-stats">
                    <div class="stat-item">
                        <span class="stat-label">총 실행</span>
                        <span class="stat-value">${job.executionCount}회</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">성공률</span>
                        <span class="stat-value">${successRate}%</span>
                    </div>
                </div>
                <div class="job-actions">
                    <button class="btn btn-info btn-sm" onclick="BatchScheduling.viewJobDetails('${job.name}')">상세 보기</button>
                    ${job.status === 'running' ? 
                        `<button class="btn btn-danger btn-sm" onclick="BatchScheduling.stopJob('${job.name}')">중지</button>` :
                        `<button class="btn btn-success btn-sm" onclick="BatchScheduling.restartJob('${job.name}')">재시작</button>`
                    }
                    <button class="btn btn-warning btn-sm" onclick="BatchScheduling.deleteJob('${job.name}')">삭제</button>
                </div>
            </div>
        `;
    },

    // 빈 상태 생성
    createEmptyState(title, description) {
        return `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <h3>${title}</h3>
                <p>${description}</p>
                <div class="empty-actions">
                    <button class="btn btn-primary" onclick="BatchScheduling.showStartModal()">스케줄링 시작</button>
                </div>
            </div>
        `;
    },

    // 실행 상세 정보 포맷팅
    formatExecutionDetails(details) {
        if (!details) return '상세 정보 없음';
        
        if (details.summary) {
            const s = details.summary;
            return `생성: ${s.totalCreated || 0}개, 업데이트: ${s.totalUpdated || 0}개`;
        }
        
        if (typeof details === 'string') return details;
        return JSON.stringify(details);
    },

    // 스케줄링 시작 모달 표시
    showStartModal() {
        document.getElementById('startSchedulingModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    },

    // 스케줄링 시작 모달 숨김
    hideStartModal() {
        document.getElementById('startSchedulingModal').style.display = 'none';
        document.body.style.overflow = 'auto';
    },

    // 스케줄링 중지 모달 표시
    async showStopModal() {
        try {
            // 실행 중인 작업 조회
            const response = await CONFIG.api.get('/batch/list?status=running');
            const runningJobs = response.data.data || [];
            
            const listContainer = document.getElementById('runningJobsList');
            
            if (runningJobs.length === 0) {
                listContainer.innerHTML = `
                    <div class="no-running-jobs">
                        <p>현재 실행 중인 작업이 없습니다.</p>
                    </div>
                `;
            } else {
                listContainer.innerHTML = `
                    <div class="running-jobs-list">
                        <h4>실행 중인 작업 목록:</h4>
                        ${runningJobs.map(job => `
                            <div class="running-job-item">
                                <div class="job-info">
                                    <strong>${job.name}</strong>
                                    <small>${job.description || ''}</small>
                                </div>
                                <button class="btn btn-danger btn-sm" onclick="BatchScheduling.stopJob('${job.name}')">중지</button>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            
            document.getElementById('stopSchedulingModal').style.display = 'flex';
            document.body.style.overflow = 'hidden';
        } catch (error) {
            console.error('실행 중인 작업 조회 실패:', error);
            Utils.showError('실행 중인 작업을 조회할 수 없습니다.');
        }
    },

    // 스케줄링 중지 모달 숨김
    hideStopModal() {
        document.getElementById('stopSchedulingModal').style.display = 'none';
        document.body.style.overflow = 'auto';
    },

    // 상세 모달 숨김
    hideDetailModal() {
        document.getElementById('jobDetailModal').style.display = 'none';
        document.body.style.overflow = 'auto';
    },

    // 스케줄링 시작 처리
    async handleStartScheduling(event) {
        event.preventDefault();
        
        const startBtn = event.target.querySelector('button[type="submit"]');
        const originalText = startBtn.textContent;
        
        try {
            startBtn.disabled = true;
            startBtn.textContent = '시작 중...';
            
            // 폼 데이터 수집
            const jobName = document.getElementById('schedulingJobName').value.trim();
            const intervalSeconds = parseInt(document.getElementById('schedulingInterval').value);
            const syncTypeCheckboxes = document.querySelectorAll('input[name="syncTypes"]:checked');
            const syncTypes = Array.from(syncTypeCheckboxes).map(cb => cb.value);
            
            if (!jobName) {
                Utils.showError('작업 이름을 입력해주세요.');
                return;
            }
            
            if (syncTypes.length === 0) {
                Utils.showError('동기화 타입을 최소 1개 이상 선택해주세요.');
                return;
            }
            
            // API 호출
            const response = await CONFIG.api.post('/batch/start', {
                name: jobName,
                intervalSeconds: intervalSeconds,
                syncTypes: syncTypes
            });
            
            if (response.data.success) {
                Utils.showSuccess(`배치 스케줄링 '${jobName}'이 성공적으로 시작되었습니다.`);
                this.hideStartModal();
                await this.loadSchedulingStatus();
                await this.refreshCurrentView();
            } else {
                Utils.showError(response.data.message || '스케줄링 시작에 실패했습니다.');
            }
            
        } catch (error) {
            console.error('스케줄링 시작 실패:', error);
            
            let errorMessage = '스케줄링 시작에 실패했습니다.';
            if (error.response?.status === 409) {
                errorMessage = '동일한 이름의 작업이 이미 실행 중입니다.';
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            
            Utils.showError(errorMessage);
        } finally {
            startBtn.disabled = false;
            startBtn.textContent = originalText;
        }
    },

    // 작업 중지
    async stopJob(jobName) {
        if (!confirm(`정말로 '${jobName}' 작업을 중지하시겠습니까?`)) {
            return;
        }
        
        try {
            const response = await CONFIG.api.post(`/batch/stop/${jobName}`);
            
            if (response.data.success) {
                Utils.showSuccess(`작업 '${jobName}'이 성공적으로 중지되었습니다.`);
                this.hideStopModal();
                await this.loadSchedulingStatus();
                await this.refreshCurrentView();
            } else {
                Utils.showError(response.data.message || '작업 중지에 실패했습니다.');
            }
        } catch (error) {
            console.error('작업 중지 실패:', error);
            Utils.showError(error.response?.data?.message || '작업 중지에 실패했습니다.');
        }
    },

    // 작업 재시작
    async restartJob(jobName) {
        if (!confirm(`'${jobName}' 작업을 다시 시작하시겠습니까?`)) {
            return;
        }
        
        try {
            // 기존 작업 정보를 가져와서 재시작
            const jobResponse = await CONFIG.api.get(`/batch/status/${jobName}`);
            const job = jobResponse.data.data.job;
            
            const response = await CONFIG.api.post('/batch/start', {
                name: jobName,
                intervalSeconds: job.config.intervalSeconds,
                syncTypes: job.config.syncTypes
            });
            
            if (response.data.success) {
                Utils.showSuccess(`작업 '${jobName}'이 성공적으로 재시작되었습니다.`);
                await this.loadSchedulingStatus();
                await this.refreshCurrentView();
            } else {
                Utils.showError(response.data.message || '작업 재시작에 실패했습니다.');
            }
        } catch (error) {
            console.error('작업 재시작 실패:', error);
            Utils.showError(error.response?.data?.message || '작업 재시작에 실패했습니다.');
        }
    },

    // 작업 삭제
    async deleteJob(jobName) {
        if (!confirm(`정말로 '${jobName}' 작업을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 모든 실행 기록도 함께 삭제됩니다.`)) {
            return;
        }
        
        try {
            const response = await CONFIG.api.delete(`/batch/delete/${jobName}`);
            
            if (response.data.success) {
                Utils.showSuccess(`작업 '${jobName}'이 성공적으로 삭제되었습니다.`);
                await this.loadSchedulingStatus();
                await this.refreshCurrentView();
            } else {
                Utils.showError(response.data.message || '작업 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('작업 삭제 실패:', error);
            Utils.showError(error.response?.data?.message || '작업 삭제에 실패했습니다.');
        }
    },

    // 작업 상세 정보 보기
    async viewJobDetails(jobName) {
        try {
            const response = await CONFIG.api.get(`/batch/status/${jobName}`);
            const data = response.data.data;
            
            document.getElementById('jobDetailTitle').textContent = `📊 ${jobName} 상세 정보`;
            document.getElementById('jobDetailBody').innerHTML = this.createJobDetailHTML(data);
            document.getElementById('jobDetailModal').style.display = 'flex';
            document.body.style.overflow = 'hidden';
        } catch (error) {
            console.error('작업 상세 정보 조회 실패:', error);
            Utils.showError('작업 상세 정보를 불러올 수 없습니다.');
        }
    },

    // 작업 상세 정보 HTML 생성
    createJobDetailHTML(data) {
        const job = data.job;
        const nextExecution = data.nextExecution ? new Date(data.nextExecution).toLocaleString('ko-KR') : '알 수 없음';
        const lastSuccess = data.statistics.lastSuccess ? new Date(data.statistics.lastSuccess).toLocaleString('ko-KR') : '없음';
        const lastError = data.statistics.lastError ? new Date(data.statistics.lastError).toLocaleString('ko-KR') : '없음';
        
        return `
            <div class="job-detail-content">
                <!-- 기본 정보 -->
                <div class="detail-section">
                    <h4>📋 기본 정보</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">작업 이름:</span>
                            <span class="detail-value">${job.name}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">설명:</span>
                            <span class="detail-value">${job.description || '설명 없음'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">타입:</span>
                            <span class="detail-value">${job.type}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">상태:</span>
                            <span class="detail-value status-${job.status}">${this.getStatusText(job.status)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">생성일:</span>
                            <span class="detail-value">${new Date(job.createdAt).toLocaleString('ko-KR')}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">실행 중:</span>
                            <span class="detail-value">${data.isRunning ? '예' : '아니오'}</span>
                        </div>
                    </div>
                </div>

                <!-- 설정 정보 -->
                <div class="detail-section">
                    <h4>⚙️ 설정</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">실행 주기:</span>
                            <span class="detail-value">${job.config.intervalSeconds}초 (${Math.round(job.config.intervalSeconds / 60)}분)</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">동기화 타입:</span>
                            <span class="detail-value">${job.config.syncTypes.join(', ')}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">자동 재시작:</span>
                            <span class="detail-value">${job.config.autoRestart !== false ? '활성화' : '비활성화'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">최대 재시도:</span>
                            <span class="detail-value">${job.config.maxRetries || 5}회</span>
                        </div>
                    </div>
                </div>

                <!-- 실행 정보 -->
                <div class="detail-section">
                    <h4>🕐 실행 정보</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">다음 실행:</span>
                            <span class="detail-value">${nextExecution}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">남은 시간:</span>
                            <span class="detail-value">${data.timeUntilNext}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">마지막 성공:</span>
                            <span class="detail-value">${lastSuccess}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">마지막 오류:</span>
                            <span class="detail-value">${lastError}</span>
                        </div>
                    </div>
                </div>

                <!-- 통계 -->
                <div class="detail-section">
                    <h4>📊 실행 통계</h4>
                    <div class="stats-cards">
                        <div class="stat-card">
                            <div class="stat-number">${data.statistics.totalExecutions}</div>
                            <div class="stat-label">총 실행 횟수</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${data.statistics.successRate}</div>
                            <div class="stat-label">성공률</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${data.statistics.averageDuration}</div>
                            <div class="stat-label">평균 실행 시간</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${job.errorCount}</div>
                            <div class="stat-label">오류 횟수</div>
                        </div>
                    </div>
                </div>

                <!-- 최근 실행 기록 -->
                <div class="detail-section">
                    <h4>📝 최근 실행 기록 (최근 10회)</h4>
                    <div class="recent-executions">
                        ${data.recentExecutions.length > 0 ? 
                            data.recentExecutions.map(execution => `
                                <div class="execution-item">
                                    <div class="execution-time">${new Date(execution.executedAt).toLocaleString('ko-KR')}</div>
                                    <div class="execution-result status-${execution.result.replace('_', '-')}">${this.getResultText(execution.result)}</div>
                                    <div class="execution-duration">${execution.duration}</div>
                                    ${execution.error ? `<div class="execution-error">오류: ${execution.error}</div>` : ''}
                                </div>
                            `).join('') : 
                            '<div class="no-executions">실행 기록이 없습니다.</div>'
                        }
                    </div>
                </div>
            </div>
        `;
    },

    // 상태 텍스트 반환
    getStatusText(status) {
        const statusTexts = {
            'running': '🟢 실행 중',
            'stopped': '⚪ 중지됨',
            'paused': '🟡 일시정지',
            'error': '🔴 오류'
        };
        return statusTexts[status] || status;
    },

    // 결과 텍스트 반환
    getResultText(result) {
        const resultTexts = {
            'success': '✅ 성공',
            'error': '❌ 실패',
            'partial_success': '⚠️ 부분 성공'
        };
        return resultTexts[result] || result;
    },

    // 상태 확인
    async showStatusCheck() {
        try {
            // 전체 상태 요약 정보 표시
            const response = await CONFIG.api.get('/batch/list');
            const jobs = response.data.data || [];
            
            const runningJobs = jobs.filter(j => j.status === 'running');
            const totalExecutions = jobs.reduce((sum, j) => sum + j.executionCount, 0);
            const totalErrors = jobs.reduce((sum, j) => sum + j.errorCount, 0);
            const averageSuccessRate = jobs.length > 0 ? 
                Math.round(jobs.reduce((sum, j) => sum + (j.executionCount > 0 ? (j.successCount / j.executionCount * 100) : 0), 0) / jobs.length) : 0;
            
            const statusInfo = `📊 배치 스케줄링 전체 상태

🟢 실행 중인 작업: ${runningJobs.length}개
📋 총 등록된 작업: ${jobs.length}개
🔄 총 실행 횟수: ${totalExecutions}회
❌ 총 오류 횟수: ${totalErrors}회
📈 평균 성공률: ${averageSuccessRate}%

${runningJobs.length > 0 ? '🔥 현재 활성 작업:\n' + runningJobs.map(j => `• ${j.name} (${j.config.intervalSeconds}초 주기)`).join('\n') : '⚠️ 현재 실행 중인 작업이 없습니다'}`;

            alert(statusInfo);
        } catch (error) {
            console.error('상태 확인 실패:', error);
            Utils.showError('상태 확인에 실패했습니다.');
        }
    },

    // 현재 뷰 새로고침
    async refreshCurrentView() {
        await this.loadSchedulingStatus();
        await this.switchTab(this.currentTab);
        Utils.showSuccess('새로고침이 완료되었습니다.');
    }
};