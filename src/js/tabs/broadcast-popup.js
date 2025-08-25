// src/js/tabs/broadcast-popup.js

const BroadcastPopup = {
    // 현재 중계 중인 경기 정보
    currentMatch: null,
    gameTimer: null,
    gameStartTime: null,
    currentTimeMode: 'auto-first',

    // HTML 템플릿
    getTemplate(matchTitle) {
        return `
            <div class="broadcast-modal" id="broadcastModal">
                <div class="broadcast-container">
                    <!-- 헤더 -->
                    <div class="broadcast-header">
                        <div class="match-title" id="matchTitle">${matchTitle}</div>
                        <button class="close-btn" onclick="BroadcastPopup.close()">&times;</button>
                    </div>

                    <!-- 메인 콘텐츠 -->
                    <div class="broadcast-content">
                        <!-- 1. 경기 시간 설정 -->
                        <div class="broadcast-section">
                            <div class="broadcast-section-title">
                                ⏰ 경기 시간 설정
                            </div>
                            <div style="margin-bottom: 15px;">
                                <label><strong>시간 모드:</strong></label>
                                <select id="timeMode" class="time-mode-select" onchange="BroadcastPopup.onTimeModeChange()">
                                    <option value="manual">수동</option>
                                    <option value="auto-first" selected>자동-전반</option>
                                    <option value="auto-second">자동-후반</option>
                                    <option value="auto-extra-first">자동-연전</option>
                                    <option value="auto-extra-second">자동-연후</option>
                                </select>
                            </div>
                            
                            <div id="manualToggleMenu" class="manual-toggle-menu disabled" style="margin-bottom: 15px;">
                                <label><strong>상태 선택:</strong></label>
                                <select id="manualStatus" class="manual-status-select" disabled>
                                    <option value="halftime">하프타임</option>
                                    <option value="extra-waiting">연장대기</option>
                                    <option value="penalty">승부차기</option>
                                    <option value="finished">종료</option>
                                    <option value="finished-extra">종료(연장)</option>
                                </select>
                            </div>
                            
                            <div style="margin-bottom: 15px;">
                                <div class="time-display auto-time" id="currentTime">자동-전반 0'</div>
                            </div>
                            
                            <div class="time-inputs-container" style="margin-bottom: 15px;">
                                <label><strong>시간 설정:</strong></label>
                                <div class="time-inputs-row">
                                    <div class="time-input-group">
                                        <label>날짜</label>
                                        <input type="date" class="date-input" id="timeDate" value="${new Date().toISOString().split('T')[0]}">
                                    </div>
                                    <div class="time-input-group">
                                        <label>시</label>
                                        <input type="number" class="time-input" id="timeHour" min="0" max="23" value="0">
                                    </div>
                                    <div class="time-input-group">
                                        <label>분</label>
                                        <input type="number" class="time-input" id="timeMin" min="0" max="59" value="0">
                                    </div>
                                    <div class="time-input-group">
                                        <label>초</label>
                                        <input type="number" class="time-input" id="timeSec" min="0" max="59" value="0">
                                    </div>
                                </div>
                            </div>
                            
                            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                                <button class="btn btn-primary" onclick="BroadcastPopup.saveServerTime()">서버 시간 저장</button>
                                <button class="btn btn-success" onclick="BroadcastPopup.saveInputTime()">입력 시간 저장</button>
                            </div>
                        </div>

                        <!-- 2. 경기 상태 설정 -->
                        <div class="broadcast-section">
                            <div class="broadcast-section-title">
                                🏃 경기 상태 설정
                            </div>
                            <div style="margin-bottom: 15px;">
                                <label><strong>경기 상태:</strong></label>
                                <select id="matchStatusSelect" class="match-status-select">
                                    <option value="before">경기전</option>
                                    <option value="playing" selected>경기중</option>
                                    <option value="finished">경기종료</option>
                                    <option value="delayed">경기지연</option>
                                    <option value="suspended">경기중지</option>
                                    <option value="suspend">서스펜드</option>
                                    <option value="rain-stop">우천중지</option>
                                    <option value="canceled">경기취소</option>
                                </select>
                            </div>
                            <div>
                                <button class="btn btn-primary" onclick="BroadcastPopup.saveMatchStatus()">저장</button>
                            </div>
                        </div>

                        <!-- 3. 스코어 관리 -->
                        <div class="broadcast-section">
                            <div class="broadcast-section-title">
                                ⚽ 스코어 관리
                            </div>
                            <div class="score-display">
                                <div class="team-score">
                                    <div class="team-name" id="homeTeamName">홈팀명</div>
                                    <input type="number" class="score-input" id="homeScore" value="0" min="0" max="20">
                                </div>
                                <div class="vs-text">VS</div>
                                <div class="team-score">
                                    <div class="team-name" id="awayTeamName">원정팀명</div>
                                    <input type="number" class="score-input" id="awayScore" value="0" min="0" max="20">
                                </div>
                            </div>
                            <div style="text-align: center;">
                                <button class="btn btn-success" onclick="BroadcastPopup.saveScore()">저장</button>
                            </div>
                        </div>

                        <!-- 4. 중계 문구 관리 (넓게) -->
                        <div class="broadcast-section full-width">
                            <div class="broadcast-section-title">
                                📢 중계 문구 관리
                            </div>
                            <textarea class="broadcast-text" id="broadcastText" placeholder="중계 문구를 입력하세요...

예) 15' 손흥민의 환상적인 골! 토트넘이 1-0으로 앞서갑니다!"></textarea>
                            <div class="image-upload">
                                <label for="imageFile">📷 이미지 첨부</label>
                                <input type="file" id="imageFile" accept="image/*" onchange="BroadcastPopup.previewImage(this)">
                                <div id="imagePreview" style="margin-top: 10px;"></div>
                            </div>
                            <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 15px;">
                                <button class="btn btn-primary" onclick="BroadcastPopup.saveBroadcastText()">저장</button>
                                <button class="btn btn-success" onclick="BroadcastPopup.sendPushNotification()">PUSH 발송 & 저장</button>
                                <button class="btn btn-warning" onclick="BroadcastPopup.clearBroadcastText()">초기화</button>
                            </div>
                        </div>

                        <!-- 5. 경기 기록 관리 -->
                        <div class="broadcast-section">
                            <div class="broadcast-section-title">
                                📊 경기 기록 관리
                            </div>
                            <div class="records-grid">
                                <div class="record-team">
                                    <div class="team-header">홈팀 (<span id="homeTeamRecord">홈팀명</span>)</div>
                                    <div class="stats-row">
                                        <span>경고</span>
                                        <input type="number" class="stat-input" id="homeYellow" value="0" min="0">
                                    </div>
                                    <div class="stats-row">
                                        <span>퇴장</span>
                                        <input type="number" class="stat-input" id="homeRed" value="0" min="0">
                                    </div>
                                    <div class="stats-row">
                                        <span>슈팅</span>
                                        <input type="number" class="stat-input" id="homeShoots" value="0" min="0">
                                    </div>
                                    <div class="stats-row">
                                        <span>유효슈팅</span>
                                        <input type="number" class="stat-input" id="homeShootsOnTarget" value="0" min="0">
                                    </div>
                                    <div class="stats-row">
                                        <span>점유율(%)</span>
                                        <input type="number" class="stat-input" id="homePossession" value="50" min="0" max="100">
                                    </div>
                                    <div class="stats-row">
                                        <span>오프사이드</span>
                                        <input type="number" class="stat-input" id="homeOffside" value="0" min="0">
                                    </div>
                                    <div class="stats-row">
                                        <span>파울</span>
                                        <input type="number" class="stat-input" id="homeFouls" value="0" min="0">
                                    </div>
                                    <div class="stats-row">
                                        <span>코너킥</span>
                                        <input type="number" class="stat-input" id="homeCorners" value="0" min="0">
                                    </div>
                                    <div class="stats-row">
                                        <span>프리킥</span>
                                        <input type="number" class="stat-input" id="homeFreeKicks" value="0" min="0">
                                    </div>
                                </div>
                                
                                <div class="record-team">
                                    <div class="team-header">원정팀 (<span id="awayTeamRecord">원정팀명</span>)</div>
                                    <div class="stats-row">
                                        <span>경고</span>
                                        <input type="number" class="stat-input" id="awayYellow" value="0" min="0">
                                    </div>
                                    <div class="stats-row">
                                        <span>퇴장</span>
                                        <input type="number" class="stat-input" id="awayRed" value="0" min="0">
                                    </div>
                                    <div class="stats-row">
                                        <span>슈팅</span>
                                        <input type="number" class="stat-input" id="awayShoots" value="0" min="0">
                                    </div>
                                    <div class="stats-row">
                                        <span>유효슈팅</span>
                                        <input type="number" class="stat-input" id="awayShootsOnTarget" value="0" min="0">
                                    </div>
                                    <div class="stats-row">
                                        <span>점유율(%)</span>
                                        <input type="number" class="stat-input" id="awayPossession" value="50" min="0" max="100">
                                    </div>
                                    <div class="stats-row">
                                        <span>오프사이드</span>
                                        <input type="number" class="stat-input" id="awayOffside" value="0" min="0">
                                    </div>
                                    <div class="stats-row">
                                        <span>파울</span>
                                        <input type="number" class="stat-input" id="awayFouls" value="0" min="0">
                                    </div>
                                    <div class="stats-row">
                                        <span>코너킥</span>
                                        <input type="number" class="stat-input" id="awayCorners" value="0" min="0">
                                    </div>
                                    <div class="stats-row">
                                        <span>프리킥</span>
                                        <input type="number" class="stat-input" id="awayFreeKicks" value="0" min="0">
                                    </div>
                                </div>
                            </div>
                            <div style="text-align: center; margin-top: 15px;">
                                <button class="btn btn-success" onclick="BroadcastPopup.saveRecords()">저장</button>
                            </div>
                        </div>

                        <!-- 6. 추가시간 관리 -->
                        <div class="broadcast-section full-width">
                            <div class="broadcast-section-title">
                                ⏱️ 추가시간 관리
                            </div>
                            <div class="extra-time-compact">
                                <div class="half-time">
                                    <label><strong>전반 추가시간</strong></label>
                                    <input type="number" class="extra-input" id="firstHalfExtra" value="0" min="0" max="15">
                                    <small>분</small>
                                </div>
                                <div class="half-time">
                                    <label><strong>후반 추가시간</strong></label>
                                    <input type="number" class="extra-input" id="secondHalfExtra" value="0" min="0" max="15">
                                    <small>분</small>
                                </div>
                                <div class="half-time">
                                    <label><strong>연장전 추가시간</strong></label>
                                    <input type="number" class="extra-input" id="extraTimeExtra" value="0" min="0" max="10">
                                    <small>분</small>
                                </div>
                            </div>
                            <div style="text-align: center; margin-top: 15px;">
                                <button class="btn btn-success" onclick="BroadcastPopup.saveExtraTime()">저장</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // 중계 팝업 열기
    open(matchTitle, matchId) {
        console.log('🔴 중계 시작:', matchTitle, matchId);
        
        // 경기 정보 저장
        this.currentMatch = { title: matchTitle, id: matchId };
        
        // 팀 이름 파싱
        const teams = matchTitle.split(' vs ');
        const homeTeam = teams[0] || '홈팀';
        const awayTeam = teams[1] || '원정팀';
        
        // 기존 모달 제거
        const existingModal = document.getElementById('broadcastModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // 새 모달 생성
        document.body.insertAdjacentHTML('beforeend', this.getTemplate(matchTitle));
        
        // 팀 이름 설정
        document.getElementById('homeTeamName').textContent = homeTeam;
        document.getElementById('awayTeamName').textContent = awayTeam;
        document.getElementById('homeTeamRecord').textContent = homeTeam;
        document.getElementById('awayTeamRecord').textContent = awayTeam;
        
        // 모달 표시
        document.getElementById('broadcastModal').classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // 초기화 및 데이터 로드
        this.init();
        this.loadMatchData(matchId);
    },

    // 중계 팝업 닫기
    close() {
        const modal = document.getElementById('broadcastModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
            
            // 타이머 정지
            if (this.gameTimer) {
                clearInterval(this.gameTimer);
                this.gameTimer = null;
            }
            
            // 모달 제거
            setTimeout(() => modal.remove(), 300);
        }
        
        this.currentMatch = null;
    },

    // 초기화
    init() {
        this.currentTimeMode = 'auto-first';
        this.onTimeModeChange();
        
        // 이벤트 리스너 등록
        this.attachEventListeners();
        
        console.log('🎯 중계 시스템 초기화 완료');
    },

    // 이벤트 리스너 등록
    attachEventListeners() {
        // 모달 외부 클릭시 닫기
        document.getElementById('broadcastModal').addEventListener('click', (e) => {
            if (e.target.id === 'broadcastModal') {
                this.close();
            }
        });
        
        // 키보드 단축키
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
            
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveAll();
            }
        });
    },

    // 경기 데이터 로드
    async loadMatchData(matchId) {
        try {
            // 실제로는 API에서 경기 정보 가져오기
            console.log('📡 경기 데이터 로드:', matchId);
            
            // 임시 데이터 (실제로는 API 응답으로 교체)
            const matchData = {
                homeScore: 0,
                awayScore: 0,
                status: 'playing',
                records: {
                    home: { yellow: 0, red: 0, shoots: 0, shootsOnTarget: 0, possession: 50, offside: 0, fouls: 0, corners: 0, freeKicks: 0 },
                    away: { yellow: 0, red: 0, shoots: 0, shootsOnTarget: 0, possession: 50, offside: 0, fouls: 0, corners: 0, freeKicks: 0 }
                },
                extraTime: { firstHalf: 0, secondHalf: 0, extraTime: 0 }
            };
            
            // UI 업데이트
            this.updateUIWithMatchData(matchData);
            
        } catch (error) {
            console.error('❌ 경기 데이터 로드 실패:', error);
            Utils.showError('경기 데이터를 불러올 수 없습니다.');
        }
    },

    // 경기 데이터로 UI 업데이트
    updateUIWithMatchData(data) {
        if (data.homeScore !== undefined) document.getElementById('homeScore').value = data.homeScore;
        if (data.awayScore !== undefined) document.getElementById('awayScore').value = data.awayScore;
        if (data.status) document.getElementById('matchStatusSelect').value = data.status;
        
        // 기록 데이터 업데이트
        if (data.records) {
            Object.keys(data.records.home || {}).forEach(key => {
                const element = document.getElementById(`home${key.charAt(0).toUpperCase() + key.slice(1)}`);
                if (element) element.value = data.records.home[key];
            });
            
            Object.keys(data.records.away || {}).forEach(key => {
                const element = document.getElementById(`away${key.charAt(0).toUpperCase() + key.slice(1)}`);
                if (element) element.value = data.records.away[key];
            });
        }
        
        // 추가시간 데이터 업데이트
        if (data.extraTime) {
            if (data.extraTime.firstHalf !== undefined) document.getElementById('firstHalfExtra').value = data.extraTime.firstHalf;
            if (data.extraTime.secondHalf !== undefined) document.getElementById('secondHalfExtra').value = data.extraTime.secondHalf;
            if (data.extraTime.extraTime !== undefined) document.getElementById('extraTimeExtra').value = data.extraTime.extraTime;
        }
    },

    // 시간 모드 변경
    onTimeModeChange() {
        const timeMode = document.getElementById('timeMode').value;
        const manualToggle = document.getElementById('manualToggleMenu');
        const manualStatusSelect = document.getElementById('manualStatus');
        const timeDisplay = document.getElementById('currentTime');
        
        this.currentTimeMode = timeMode;
        
        if (timeMode === 'manual') {
            manualToggle.classList.remove('disabled');
            manualStatusSelect.disabled = false;
            timeDisplay.textContent = '수동 - 하프타임';
            timeDisplay.className = 'time-display manual-time';
            
            if (this.gameTimer) {
                clearInterval(this.gameTimer);
                this.gameTimer = null;
            }
        } else {
            manualToggle.classList.add('disabled');
            manualStatusSelect.disabled = true;
            timeDisplay.className = 'time-display auto-time';
            
            this.startAutoTimeMode(timeMode);
        }
    },

    // 자동 시간 모드 시작
    startAutoTimeMode(mode) {
        this.gameStartTime = new Date();
        
        switch(mode) {
            case 'auto-first':
                break;
            case 'auto-second':
                this.gameStartTime = new Date(this.gameStartTime.getTime() - 45 * 60 * 1000);
                break;
            case 'auto-extra-first':
                this.gameStartTime = new Date(this.gameStartTime.getTime() - 90 * 60 * 1000);
                break;
            case 'auto-extra-second':
                this.gameStartTime = new Date(this.gameStartTime.getTime() - 105 * 60 * 1000);
                break;
        }
        
        if (this.gameTimer) clearInterval(this.gameTimer);
        this.gameTimer = setInterval(() => this.updateAutoTime(), 1000);
        
        console.log(`⏰ 자동 시간 시작: ${mode}`);
    },

    // 자동 시간 업데이트
    updateAutoTime() {
        if (!this.gameStartTime) return;
        
        const now = new Date();
        const elapsed = Math.floor((now - this.gameStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        
        let displayText;
        const timeMode = this.currentTimeMode;
        
        switch(timeMode) {
            case 'auto-first':
                displayText = `전반 ${Math.min(minutes, 45)}'`;
                break;
            case 'auto-second':
                displayText = `후반 ${Math.min(Math.max(minutes - 45, 0), 45)}'`;
                break;
            case 'auto-extra-first':
                displayText = `연장전반 ${Math.min(Math.max(minutes - 90, 0), 15)}'`;
                break;
            case 'auto-extra-second':
                displayText = `연장후반 ${Math.min(Math.max(minutes - 105, 0), 15)}'`;
                break;
            default:
                displayText = `${minutes}'`;
        }
        
        document.getElementById('currentTime').textContent = displayText;
    },

    // 서버 시간 저장
    async saveServerTime() {
        const now = new Date();
        const currentTime = now.toLocaleString('ko-KR');
        const currentDate = now.toISOString().split('T')[0];
        
        document.getElementById('timeDate').value = currentDate;
        
        try {
            // 실제 API 호출
            const response = await CONFIG.api.post(`/matches/${this.currentMatch.id}/time`, {
                type: 'server',
                time: now.toISOString()
            });
            
            if (response.data.success) {
                Utils.showSuccess(`서버 시간이 저장되었습니다: ${currentTime}`);
            }
        } catch (error) {
            console.error('서버 시간 저장 실패:', error);
            Utils.showError('서버 시간 저장에 실패했습니다.');
        }
    },

    // 입력 시간 저장
    async saveInputTime() {
        const date = document.getElementById('timeDate').value;
        const hour = parseInt(document.getElementById('timeHour').value) || 0;
        const minute = parseInt(document.getElementById('timeMin').value) || 0;
        const second = parseInt(document.getElementById('timeSec').value) || 0;
        
        const inputTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
        const fullDateTime = `${date} ${inputTime}`;
        
        try {
            // 실제 API 호출
            const response = await CONFIG.api.post(`/matches/${this.currentMatch.id}/time`, {
                type: 'manual',
                time: fullDateTime
            });
            
            if (response.data.success) {
                Utils.showSuccess(`입력 시간이 저장되었습니다: ${fullDateTime}`);
                
                // 수동 모드인 경우 시간 표시 업데이트
                if (this.currentTimeMode === 'manual') {
                    const manualStatus = document.getElementById('manualStatus').value;
                    let statusText = this.getStatusText(manualStatus);
                    document.getElementById('currentTime').textContent = `${statusText} - ${date} ${inputTime}`;
                }
            }
        } catch (error) {
            console.error('입력 시간 저장 실패:', error);
            Utils.showError('입력 시간 저장에 실패했습니다.');
        }
    },

    // 경기 상태 저장
    async saveMatchStatus() {
        const status = document.getElementById('matchStatusSelect').value;
        const statusText = document.getElementById('matchStatusSelect').selectedOptions[0].textContent;
        
        try {
            const response = await CONFIG.api.patch(`/matches/${this.currentMatch.id}/status`, { status });
            
            if (response.data.success) {
                Utils.showSuccess(`경기 상태가 저장되었습니다: ${statusText}`);
            }
        } catch (error) {
            console.error('경기 상태 저장 실패:', error);
            Utils.showError('경기 상태 저장에 실패했습니다.');
        }
    },

    // 스코어 저장
    async saveScore() {
        const homeScore = document.getElementById('homeScore').value;
        const awayScore = document.getElementById('awayScore').value;
        
        try {
            const response = await CONFIG.api.patch(`/matches/${this.currentMatch.id}/score`, {
                home: parseInt(homeScore),
                away: parseInt(awayScore)
            });
            
            if (response.data.success) {
                Utils.showSuccess(`스코어가 저장되었습니다: ${homeScore} - ${awayScore}`);
            }
        } catch (error) {
            console.error('스코어 저장 실패:', error);
            Utils.showError('스코어 저장에 실패했습니다.');
        }
    },

    // 중계 문구 저장
    async saveBroadcastText() {
        const text = document.getElementById('broadcastText').value;
        if (!text.trim()) {
            Utils.showError('중계 문구를 입력해주세요.');
            return;
        }
        
        try {
            const response = await CONFIG.api.post(`/matches/${this.currentMatch.id}/broadcast`, {
                message: text
            });
            
            if (response.data.success) {
                Utils.showSuccess('중계 문구가 저장되었습니다.');
            }
        } catch (error) {
            console.error('중계 문구 저장 실패:', error);
            Utils.showError('중계 문구 저장에 실패했습니다.');
        }
    },

    // PUSH 알림 발송
    async sendPushNotification() {
        const text = document.getElementById('broadcastText').value;
        if (!text.trim()) {
            Utils.showError('중계 문구를 입력해주세요.');
            return;
        }
        
        try {
            const formData = new FormData();
            formData.append('message', text);
            
            const imageFile = document.getElementById('imageFile').files[0];
            if (imageFile) {
                formData.append('image', imageFile);
            }
            
            const response = await CONFIG.api.post(`/matches/${this.currentMatch.id}/broadcast/push`, formData);
            
            if (response.data.success) {
                Utils.showSuccess('PUSH 알림이 발송되고 저장되었습니다!');
                document.getElementById('broadcastText').value = '';
                this.clearImage();
            }
        } catch (error) {
            console.error('PUSH 발송 실패:', error);
            Utils.showError('PUSH 발송에 실패했습니다.');
        }
    },

    // 중계 문구 초기화
    clearBroadcastText() {
        document.getElementById('broadcastText').value = '';
        this.clearImage();
    },

    // 경기 기록 저장
    async saveRecords() {
        const records = {
            home: this.getTeamRecords('home'),
            away: this.getTeamRecords('away')
        };
        
        // 점유율 자동 조정
        const homePossession = parseInt(records.home.possession);
        const awayPossession = parseInt(records.away.possession);
        
        if (homePossession + awayPossession !== 100) {
            const adjustment = 100 - homePossession;
            document.getElementById('awayPossession').value = adjustment;
            records.away.possession = adjustment;
        }
        
        try {
            const response = await CONFIG.api.put(`/matches/${this.currentMatch.id}/records`, records);
            
            if (response.data.success) {
                Utils.showSuccess('경기 기록이 저장되었습니다.');
            }
        } catch (error) {
            console.error('경기 기록 저장 실패:', error);
            Utils.showError('경기 기록 저장에 실패했습니다.');
        }
    },

    // 추가시간 저장
    async saveExtraTime() {
        const extraTimeData = {
            firstHalf: parseInt(document.getElementById('firstHalfExtra').value),
            secondHalf: parseInt(document.getElementById('secondHalfExtra').value),
            extraTime: parseInt(document.getElementById('extraTimeExtra').value)
        };
        
        try {
            const response = await CONFIG.api.patch(`/matches/${this.currentMatch.id}/extra-time`, extraTimeData);
            
            if (response.data.success) {
                Utils.showSuccess(`추가시간이 저장되었습니다.\n전반: +${extraTimeData.firstHalf}분\n후반: +${extraTimeData.secondHalf}분\n연장전: +${extraTimeData.extraTime}분`);
            }
        } catch (error) {
            console.error('추가시간 저장 실패:', error);
            Utils.showError('추가시간 저장에 실패했습니다.');
        }
    },

    // 전체 저장
    async saveAll() {
        console.log('💾 전체 데이터 저장 시작...');
        
        const allData = {
            timeMode: document.getElementById('timeMode').value,
            matchTime: document.getElementById('currentTime').textContent,
            dateTime: {
                date: document.getElementById('timeDate').value,
                hour: document.getElementById('timeHour').value,
                minute: document.getElementById('timeMin').value,
                second: document.getElementById('timeSec').value
            },
            status: document.getElementById('matchStatusSelect').value,
            score: {
                home: parseInt(document.getElementById('homeScore').value),
                away: parseInt(document.getElementById('awayScore').value)
            },
            records: {
                home: this.getTeamRecords('home'),
                away: this.getTeamRecords('away')
            },
            extraTime: {
                firstHalf: parseInt(document.getElementById('firstHalfExtra').value),
                secondHalf: parseInt(document.getElementById('secondHalfExtra').value),
                extraTime: parseInt(document.getElementById('extraTimeExtra').value)
            },
            timestamp: new Date().toISOString()
        };
        
        try {
            const response = await CONFIG.api.post(`/matches/${this.currentMatch.id}/broadcast/save-all`, allData);
            
            if (response.data.success) {
                Utils.showSuccess('모든 데이터가 저장되었습니다! (Ctrl+S)');
            }
        } catch (error) {
            console.error('전체 저장 실패:', error);
            Utils.showError('전체 저장에 실패했습니다.');
        }
    },

    // 유틸리티 함수들
    getTeamRecords(team) {
        return {
            yellow: parseInt(document.getElementById(`${team}Yellow`).value) || 0,
            red: parseInt(document.getElementById(`${team}Red`).value) || 0,
            shoots: parseInt(document.getElementById(`${team}Shoots`).value) || 0,
            shootsOnTarget: parseInt(document.getElementById(`${team}ShootsOnTarget`).value) || 0,
            possession: parseInt(document.getElementById(`${team}Possession`).value) || 0,
            offside: parseInt(document.getElementById(`${team}Offside`).value) || 0,
            fouls: parseInt(document.getElementById(`${team}Fouls`).value) || 0,
            corners: parseInt(document.getElementById(`${team}Corners`).value) || 0,
            freeKicks: parseInt(document.getElementById(`${team}FreeKicks`).value) || 0
        };
    },

    getStatusText(status) {
        const statusTexts = {
            'halftime': '하프타임',
            'extra-waiting': '연장대기',
            'penalty': '승부차기',
            'finished': '종료',
            'finished-extra': '종료(연장)'
        };
        return statusTexts[status] || status;
    },

    // 이미지 관련 함수들
    previewImage(input) {
        const preview = document.getElementById('imagePreview');
        
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                preview.innerHTML = `
                    <div style="position: relative; display: inline-block;">
                        <img src="${e.target.result}" style="max-width: 200px; max-height: 150px; border-radius: 8px; border: 2px solid #dee2e6;">
                        <button onclick="BroadcastPopup.clearImage()" style="position: absolute; top: -5px; right: -5px; background: #dc3545; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; font-size: 12px;">&times;</button>
                    </div>
                `;
            };
            
            reader.readAsDataURL(input.files[0]);
        }
    },

    clearImage() {
        document.getElementById('imagePreview').innerHTML = '';
        document.getElementById('imageFile').value = '';
    }
};