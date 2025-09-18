// src/js/tabs/users.js - 사용자 관리 모듈

const Users = {
    // 현재 페이지 상태
    currentPage: 1,
    currentFilters: {
        search: '',
        provider: '',
        status: '',
        chatStatus: '',
        hasSanctions: false,
        isCurrentlySuspended: false,
        isChatBanned: false
    },

    // 사용자 관리 HTML 템플릿
    template: `
        <div class="content-panel">
            <h2>👤 사용자 관리</h2>
            
            <!-- 검색 및 필터 영역 -->
            <div class="user-filters">
                <div class="filter-row">
                    <div class="filter-group">
                        <label>검색</label>
                        <input type="text" id="userSearch" class="form-control" placeholder="닉네임, 이름, 이메일로 검색">
                    </div>
                    
                    <div class="filter-group">
                        <label>소셜 제공자</label>
                        <select id="providerFilter" class="form-control">
                            <option value="">전체</option>
                            <option value="kakao">카카오</option>
                            <option value="google">구글</option>
                            <option value="apple">애플</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label>계정 상태</label>
                        <select id="statusFilter" class="form-control">
                            <option value="">전체</option>
                            <option value="active">활성</option>
                            <option value="suspended">정지</option>
                            <option value="permanently_suspended">영구정지</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label>채팅 상태</label>
                        <select id="chatStatusFilter" class="form-control">
                            <option value="">전체</option>
                            <option value="allowed">허용</option>
                            <option value="banned_1_day">1일 금지</option>
                            <option value="banned_1_week">1주일 금지</option>
                            <option value="banned_1_month">1개월 금지</option>
                            <option value="banned_permanent">영구 금지</option>
                        </select>
                    </div>
                </div>
                
                <div class="filter-row">
                    <div class="filter-checkboxes">
                        <label class="checkbox-label">
                            <input type="checkbox" id="hasSanctionsFilter">
                            <span>제재 이력 있는 사용자만</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="suspendedFilter">
                            <span>현재 정지 중인 사용자만</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="chatBannedFilter">
                            <span>현재 채팅 금지된 사용자만</span>
                        </label>
                    </div>
                    
                    <div class="filter-actions">
                        <button class="btn btn-primary" id="searchUsersBtn">🔍 검색</button>
                        <button class="btn btn-secondary" id="resetFiltersBtn">🔄 초기화</button>
                    </div>
                </div>
            </div>
            
            <!-- 사용자 목록 -->
            <div id="usersData" class="users-data">
                <div class="loading">사용자 데이터를 불러오는 중...</div>
            </div>
            
            <!-- 페이지네이션 -->
            <div id="usersPagination" class="pagination" style="display: none;"></div>
        </div>

        <!-- 사용자 상세 모달 -->
        <div id="userDetailModal" class="modal" style="display: none;">
            <div class="modal-content user-detail-modal">
                <div class="modal-header">
                    <h3 id="userDetailTitle">👤 사용자 상세 정보</h3>
                    <button class="btn btn-sm btn-danger" id="closeUserDetailBtn">✕</button>
                </div>
                <div class="modal-body" id="userDetailBody">
                    <!-- 상세 정보가 동적으로 로드됨 -->
                </div>
            </div>
        </div>

        <!-- 경고 처리 모달 -->
        <div id="warnModal" class="modal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>⚠️ 경고 처리</h3>
                    <button class="btn btn-sm btn-danger" id="closeWarnModalBtn">✕</button>
                </div>
                <div class="modal-body">
                    <form id="warnForm">
                        <div class="form-group">
                            <label>경고 사유 *</label>
                            <textarea id="warnReason" class="form-control" rows="4" 
                                     placeholder="경고 사유를 상세히 입력하세요 (10-1000자)" 
                                     minlength="10" maxlength="1000" required></textarea>
                            <small class="char-count">0/1000</small>
                        </div>
                        <div class="form-group">
                            <label>관리자 메모 (선택사항)</label>
                            <textarea id="warnAdminNote" class="form-control" rows="2" 
                                     placeholder="관리자용 메모"></textarea>
                        </div>
                        <div class="warn-info">
                            <p id="warnPreview"></p>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-warning">경고 처리</button>
                            <button type="button" class="btn btn-secondary" id="cancelWarnBtn">취소</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- 정지 처리 모달 -->
        <div id="suspendModal" class="modal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🚫 정지 처리</h3>
                    <button class="btn btn-sm btn-danger" id="closeSuspendModalBtn">✕</button>
                </div>
                <div class="modal-body">
                    <form id="suspendForm">
                        <div class="form-group">
                            <label>정지 기간 *</label>
                            <select id="suspendDuration" class="form-control" required>
                                <option value="">기간을 선택하세요</option>
                                <option value="1_day">1일</option>
                                <option value="1_week">1주일</option>
                                <option value="1_month">1개월</option>
                                <option value="3_months">3개월</option>
                                <option value="6_months">6개월</option>
                                <option value="1_year">1년</option>
                                <option value="permanent">영구 정지</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>정지 사유 *</label>
                            <textarea id="suspendReason" class="form-control" rows="4" 
                                     placeholder="정지 사유를 상세히 입력하세요 (10-1000자)" 
                                     minlength="10" maxlength="1000" required></textarea>
                            <small class="char-count">0/1000</small>
                        </div>
                        <div class="form-group">
                            <label>관리자 메모 (선택사항)</label>
                            <textarea id="suspendAdminNote" class="form-control" rows="2" 
                                     placeholder="관리자용 메모"></textarea>
                        </div>
                        <div class="suspend-warning" id="suspendWarning" style="display: none;">
                            <p>⚠️ <strong>영구 정지</strong>는 되돌릴 수 없는 조치입니다.</p>
                            <p>신중하게 검토 후 처리해주세요.</p>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-danger">정지 처리</button>
                            <button type="button" class="btn btn-secondary" id="cancelSuspendBtn">취소</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- 해제 처리 모달 -->
        <div id="releaseModal" class="modal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="releaseModalTitle">🔓 해제 처리</h3>
                    <button class="btn btn-sm btn-danger" id="closeReleaseModalBtn">✕</button>
                </div>
                <div class="modal-body">
                    <form id="releaseForm">
                        <div class="form-group">
                            <label>해제 사유 *</label>
                            <textarea id="releaseReason" class="form-control" rows="3" 
                                     placeholder="해제 사유를 입력하세요 (5-500자)" 
                                     minlength="5" maxlength="500" required></textarea>
                            <small class="char-count">0/500</small>
                        </div>
                        <div class="form-group">
                            <label>관리자 메모 (선택사항)</label>
                            <textarea id="releaseAdminNote" class="form-control" rows="2" 
                                     placeholder="관리자용 메모"></textarea>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-success" id="releaseSubmitBtn">해제 처리</button>
                            <button type="button" class="btn btn-secondary" id="cancelReleaseBtn">취소</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- 토큰 초기화 모달 -->
        <div id="resetTokenModal" class="modal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🔑 토큰 초기화</h3>
                    <button class="btn btn-sm btn-danger" id="closeResetTokenModalBtn">✕</button>
                </div>
                <div class="modal-body">
                    <div class="reset-token-warning">
                        <p>⚠️ <strong>토큰 초기화</strong>를 진행하면:</p>
                        <ul>
                            <li>사용자의 모든 Access Token과 Refresh Token이 무효화됩니다</li>
                            <li>사용자는 다음 API 호출 시 강제로 로그인 화면으로 이동합니다</li>
                            <li>계정 상태는 변경되지 않습니다 (재로그인 가능)</li>
                        </ul>
                    </div>
                    <form id="resetTokenForm">
                        <div class="form-group">
                            <label>초기화 사유 *</label>
                            <textarea id="resetTokenReason" class="form-control" rows="3" 
                                     placeholder="토큰 초기화 사유를 입력하세요 (5-500자)" 
                                     minlength="5" maxlength="500" required></textarea>
                            <small class="char-count">0/500</small>
                        </div>
                        <div class="form-group">
                            <label>관리자 메모 (선택사항)</label>
                            <textarea id="resetTokenAdminNote" class="form-control" rows="2" 
                                     placeholder="관리자용 메모"></textarea>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-warning">토큰 초기화</button>
                            <button type="button" class="btn btn-secondary" id="cancelResetTokenBtn">취소</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `,

    // 렌더링
    async render() {
        console.log('👤 사용자 관리 로드');
        
        Utils.renderContent(this.template);
        this.attachEventListeners();
        
        // 초기 데이터 로드
        await this.loadUsers();
    },

    // 이벤트 리스너 등록
    attachEventListeners() {
        // 검색 및 필터
        document.getElementById('searchUsersBtn').addEventListener('click', () => this.searchUsers());
        document.getElementById('resetFiltersBtn').addEventListener('click', () => this.resetFilters());
        
        // Enter 키로 검색
        document.getElementById('userSearch').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchUsers();
        });

        // 문자수 카운터
        this.setupCharCounters();

        // 모달 이벤트 리스너
        this.setupModalEventListeners();

        // 정지 기간 변경시 경고 표시
        document.getElementById('suspendDuration').addEventListener('change', (e) => {
            const warning = document.getElementById('suspendWarning');
            if (e.target.value === 'permanent') {
                warning.style.display = 'block';
            } else {
                warning.style.display = 'none';
            }
        });
    },

    // 문자수 카운터 설정
    setupCharCounters() {
        const textareas = [
            { id: 'warnReason', max: 1000 },
            { id: 'suspendReason', max: 1000 },
            { id: 'releaseReason', max: 500 },
            { id: 'resetTokenReason', max: 500 }
        ];

        textareas.forEach(({ id, max }) => {
            const textarea = document.getElementById(id);
            const counter = textarea.parentElement.querySelector('.char-count');
            
            textarea.addEventListener('input', () => {
                const count = textarea.value.length;
                counter.textContent = `${count}/${max}`;
                counter.style.color = count > max * 0.9 ? '#dc3545' : '#6c757d';
            });
        });
    },

    // 모달 이벤트 리스너 설정
    setupModalEventListeners() {
        // 사용자 상세 모달
        document.getElementById('closeUserDetailBtn').addEventListener('click', () => this.hideUserDetailModal());

        // 경고 모달
        document.getElementById('closeWarnModalBtn').addEventListener('click', () => this.hideWarnModal());
        document.getElementById('cancelWarnBtn').addEventListener('click', () => this.hideWarnModal());
        document.getElementById('warnForm').addEventListener('submit', (e) => this.handleWarn(e));

        // 정지 모달  
        document.getElementById('closeSuspendModalBtn').addEventListener('click', () => this.hideSuspendModal());
        document.getElementById('cancelSuspendBtn').addEventListener('click', () => this.hideSuspendModal());
        document.getElementById('suspendForm').addEventListener('submit', (e) => this.handleSuspend(e));

        // 해제 모달
        document.getElementById('closeReleaseModalBtn').addEventListener('click', () => this.hideReleaseModal());
        document.getElementById('cancelReleaseBtn').addEventListener('click', () => this.hideReleaseModal());
        document.getElementById('releaseForm').addEventListener('submit', (e) => this.handleRelease(e));

        // 토큰 초기화 모달
        document.getElementById('closeResetTokenModalBtn').addEventListener('click', () => this.hideResetTokenModal());
        document.getElementById('cancelResetTokenBtn').addEventListener('click', () => this.hideResetTokenModal());
        document.getElementById('resetTokenForm').addEventListener('submit', (e) => this.handleResetToken(e));

        // 모달 외부 클릭시 닫기
        ['userDetailModal', 'warnModal', 'suspendModal', 'releaseModal', 'resetTokenModal'].forEach(modalId => {
            document.getElementById(modalId).addEventListener('click', (e) => {
                if (e.target.id === modalId) {
                    this[`hide${modalId.charAt(0).toUpperCase() + modalId.slice(1, -5)}Modal`]();
                }
            });
        });
    },

    // 사용자 목록 로드
    async loadUsers() {
        const container = document.getElementById('usersData');
        container.innerHTML = '<div class="loading">사용자 데이터를 불러오는 중...</div>';

        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: 20,
                ...this.currentFilters
            });

            // 빈 값 제거
            for (const [key, value] of params.entries()) {
                if (!value || value === 'false') {
                    params.delete(key);
                }
            }

            const response = await CONFIG.api.get(`/admin/app-users?${params}`);
            const data = response.data.data;

            if (!data.users || data.users.length === 0) {
                container.innerHTML = this.createEmptyState();
                document.getElementById('usersPagination').style.display = 'none';
                return;
            }

            container.innerHTML = this.createUsersTable(data.users);
            this.renderPagination(data.pagination);

        } catch (error) {
            console.error('사용자 목록 로드 실패:', error);
            container.innerHTML = '<div class="error">사용자 데이터를 불러올 수 없습니다.</div>';
            document.getElementById('usersPagination').style.display = 'none';
        }
    },

    // 사용자 테이블 생성
    createUsersTable(users) {
        const tableRows = users.map(user => {
            const warningCount = user.warningCount || 0;
            const statusBadge = this.getStatusBadge(user.status);
            const chatStatusBadge = this.getChatStatusBadge(user.chatStatus, user.chatBannedUntil);
            const lastLogin = user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('ko-KR') : '없음';

            return `
                <tr data-user-id="${user.id}">
                    <td>${user.id}</td>
                    <td>
                        <div class="user-info">
                            <div class="user-name">${user.nickname || user.name}</div>
                            <div class="user-email">${user.email}</div>
                            <div class="user-provider">${this.getProviderText(user.provider)}</div>
                        </div>
                    </td>
                    <td>
                        <div class="status-badges">
                            ${statusBadge}
                            ${chatStatusBadge}
                        </div>
                    </td>
                    <td>
                        <div class="warning-count ${warningCount >= 3 ? 'danger' : warningCount >= 2 ? 'warning' : ''}">${warningCount}/4</div>
                    </td>
                    <td>${lastLogin}</td>
                    <td>
                        <div class="user-actions">
                            <button class="btn btn-sm btn-info" onclick="Users.showUserDetail(${user.id})">상세</button>
                            <button class="btn btn-sm btn-warning" onclick="Users.showWarnModal(${user.id}, ${warningCount})">경고</button>
                            <button class="btn btn-sm btn-danger" onclick="Users.showSuspendModal(${user.id})">정지</button>
                            <div class="dropdown">
                                <button class="btn btn-sm btn-secondary dropdown-toggle">더보기</button>
                                <div class="dropdown-menu">
                                    ${user.status === 'suspended' || user.status === 'permanently_suspended' ? 
                                        '<button onclick="Users.showReleaseModal(' + user.id + ', \'suspend\')">정지 해제</button>' : ''}
                                    ${user.chatStatus !== 'allowed' ? 
                                        '<button onclick="Users.showReleaseModal(' + user.id + ', \'chat\')">채팅 해제</button>' : ''}
                                    ${warningCount > 0 ? 
                                        '<button onclick="Users.showReleaseModal(' + user.id + ', \'warning\')">경고 리셋</button>' : ''}
                                    <button onclick="Users.showResetTokenModal(${user.id})">토큰 초기화</button>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        return `
            <div class="users-table-container">
                <table class="users-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>사용자 정보</th>
                            <th>상태</th>
                            <th>경고</th>
                            <th>마지막 로그인</th>
                            <th>관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>
        `;
    },

    // 빈 상태 생성
    createEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-icon">👥</div>
                <h3>사용자를 찾을 수 없습니다</h3>
                <p>검색 조건을 변경하거나 필터를 초기화해보세요.</p>
                <button class="btn btn-primary" onclick="Users.resetFilters()">필터 초기화</button>
            </div>
        `;
    },

    // 페이지네이션 렌더링
    renderPagination(pagination) {
        const container = document.getElementById('usersPagination');
        
        if (pagination.totalPages <= 1) {
            container.style.display = 'none';
            return;
        }

        const buttons = [];
        const current = pagination.page;
        const total = pagination.totalPages;

        // 이전 버튼
        if (current > 1) {
            buttons.push(`<button onclick="Users.goToPage(${current - 1})">‹</button>`);
        }

        // 페이지 번호들
        const start = Math.max(1, current - 2);
        const end = Math.min(total, current + 2);

        if (start > 1) {
            buttons.push(`<button onclick="Users.goToPage(1)">1</button>`);
            if (start > 2) {
                buttons.push(`<span>...</span>`);
            }
        }

        for (let i = start; i <= end; i++) {
            buttons.push(`<button class="${i === current ? 'active' : ''}" onclick="Users.goToPage(${i})">${i}</button>`);
        }

        if (end < total) {
            if (end < total - 1) {
                buttons.push(`<span>...</span>`);
            }
            buttons.push(`<button onclick="Users.goToPage(${total})">${total}</button>`);
        }

        // 다음 버튼
        if (current < total) {
            buttons.push(`<button onclick="Users.goToPage(${current + 1})">›</button>`);
        }

        container.innerHTML = buttons.join('');
        container.style.display = 'flex';
    },

    // 검색 실행
    searchUsers() {
        this.currentFilters = {
            search: document.getElementById('userSearch').value.trim(),
            provider: document.getElementById('providerFilter').value,
            status: document.getElementById('statusFilter').value,
            chatStatus: document.getElementById('chatStatusFilter').value,
            hasSanctions: document.getElementById('hasSanctionsFilter').checked,
            isCurrentlySuspended: document.getElementById('suspendedFilter').checked,
            isChatBanned: document.getElementById('chatBannedFilter').checked
        };
        
        this.currentPage = 1;
        this.loadUsers();
    },

    // 필터 초기화
    resetFilters() {
        document.getElementById('userSearch').value = '';
        document.getElementById('providerFilter').value = '';
        document.getElementById('statusFilter').value = '';
        document.getElementById('chatStatusFilter').value = '';
        document.getElementById('hasSanctionsFilter').checked = false;
        document.getElementById('suspendedFilter').checked = false;
        document.getElementById('chatBannedFilter').checked = false;
        
        this.currentFilters = {
            search: '', provider: '', status: '', chatStatus: '',
            hasSanctions: false, isCurrentlySuspended: false, isChatBanned: false
        };
        
        this.currentPage = 1;
        this.loadUsers();
    },

    // 페이지 이동
    goToPage(page) {
        this.currentPage = page;
        this.loadUsers();
    },

    // 사용자 상세 정보 표시
    async showUserDetail(userId) {
        try {
            const [userResponse, sanctionsResponse] = await Promise.all([
                CONFIG.api.get(`/admin/app-users/${userId}`),
                CONFIG.api.get(`/admin/app-users/${userId}/sanctions`)
            ]);

            const user = userResponse.data.data;
            const sanctions = sanctionsResponse.data.data;

            document.getElementById('userDetailTitle').textContent = `👤 ${user.nickname || user.name} 상세 정보`;
            document.getElementById('userDetailBody').innerHTML = this.createUserDetailHTML(user, sanctions);
            
            this.showUserDetailModal();
        } catch (error) {
            console.error('사용자 상세 정보 로드 실패:', error);
            Utils.showError('사용자 정보를 불러올 수 없습니다.');
        }
    },

    // 사용자 상세 정보 HTML 생성
    createUserDetailHTML(user, sanctions) {
        const createdAt = new Date(user.createdAt).toLocaleString('ko-KR');
        const lastLogin = user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('ko-KR') : '없음';
        const chatBannedUntil = user.chatBannedUntil ? new Date(user.chatBannedUntil).toLocaleString('ko-KR') : null;
        const suspendedUntil = user.suspendedUntil ? new Date(user.suspendedUntil).toLocaleString('ko-KR') : null;

        return `
            <div class="user-detail-content">
                <!-- 기본 정보 -->
                <div class="detail-section">
                    <h4>📋 기본 정보</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">사용자 ID:</span>
                            <span class="detail-value">${user.id}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">소셜 ID:</span>
                            <span class="detail-value">${user.socialId}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">소셜 제공자:</span>
                            <span class="detail-value">${this.getProviderText(user.provider)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">이메일:</span>
                            <span class="detail-value">${user.email}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">이름:</span>
                            <span class="detail-value">${user.name}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">닉네임:</span>
                            <span class="detail-value">${user.nickname}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">가입일:</span>
                            <span class="detail-value">${createdAt}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">마지막 로그인:</span>
                            <span class="detail-value">${lastLogin}</span>
                        </div>
                    </div>
                </div>

                <!-- 현재 상태 -->
                <div class="detail-section">
                    <h4>📊 현재 상태</h4>
                    <div class="status-overview">
                        <div class="status-card">
                            <div class="status-title">계정 상태</div>
                            <div class="status-badge ${user.status}">${this.getStatusText(user.status)}</div>
                            ${suspendedUntil ? `<div class="status-detail">해제: ${suspendedUntil}</div>` : ''}
                        </div>
                        <div class="status-card">
                            <div class="status-title">채팅 상태</div>
                            <div class="status-badge ${user.chatStatus}">${this.getChatStatusText(user.chatStatus)}</div>
                            ${chatBannedUntil ? `<div class="status-detail">해제: ${chatBannedUntil}</div>` : ''}
                        </div>
                        <div class="status-card">
                            <div class="status-title">경고 횟수</div>
                            <div class="warning-display ${user.warningCount >= 3 ? 'danger' : user.warningCount >= 2 ? 'warning' : ''}">${user.warningCount}/4</div>
                        </div>
                    </div>
                </div>

                <!-- 제재 이력 -->
                <div class="detail-section">
                    <h4>📝 제재 이력 (최근 20건)</h4>
                    ${sanctions.sanctions && sanctions.sanctions.length > 0 ? this.createSanctionsTable(sanctions.sanctions) : '<p class="no-sanctions">제재 이력이 없습니다.</p>'}
                    ${sanctions.summary ? `
                        <div class="sanctions-summary">
                            <h5>제재 요약</h5>
                            <div class="summary-grid">
                                <span>총 제재: ${sanctions.summary.totalSanctions}건</span>
                                <span>경고: ${sanctions.summary.warningCount}건</span>
                                <span>정지: ${sanctions.summary.suspendCount}건</span>
                                <span>토큰 초기화: ${sanctions.summary.tokenResetCount}건</span>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    // 제재 이력 테이블 생성
    createSanctionsTable(sanctions) {
        const rows = sanctions.map(sanction => {
            const createdAt = new Date(sanction.createdAt).toLocaleString('ko-KR');
            const endDate = sanction.endDate ? new Date(sanction.endDate).toLocaleString('ko-KR') : '-';
            const isActive = sanction.isActive ? '<span class="active-badge">활성</span>' : '';
            
            return `
                <tr>
                    <td>${this.getSanctionTypeText(sanction.type)}</td>
                    <td>${sanction.reason}</td>
                    <td>${createdAt}</td>
                    <td>${endDate}</td>
                    <td>${isActive}</td>
                </tr>
            `;
        }).join('');

        return `
            <div class="sanctions-table-container">
                <table class="sanctions-table">
                    <thead>
                        <tr>
                            <th>유형</th>
                            <th>사유</th>
                            <th>처리일</th>
                            <th>종료일</th>
                            <th>상태</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    },

    // 경고 모달 표시
    showWarnModal(userId, currentWarnings) {
        this.currentUserId = userId;
        
        const nextWarning = currentWarnings + 1;
        const nextPenalty = this.getWarningPenalty(nextWarning);
        
        document.getElementById('warnPreview').innerHTML = `
            <strong>현재 경고 횟수:</strong> ${currentWarnings}/4<br>
            <strong>처리 후:</strong> ${nextWarning}/4<br>
            <strong>처벌:</strong> ${nextPenalty}
        `;
        
        document.getElementById('warnReason').value = '';
        document.getElementById('warnAdminNote').value = '';
        
        this.showModal('warnModal');
    },

    // 정지 모달 표시
    showSuspendModal(userId) {
        this.currentUserId = userId;
        
        document.getElementById('suspendDuration').value = '';
        document.getElementById('suspendReason').value = '';
        document.getElementById('suspendAdminNote').value = '';
        document.getElementById('suspendWarning').style.display = 'none';
        
        this.showModal('suspendModal');
    },

    // 해제 모달 표시
    showReleaseModal(userId, type) {
        this.currentUserId = userId;
        this.currentReleaseType = type;
        
        const titles = {
            suspend: '🔓 정지 해제',
            chat: '💬 채팅 금지 해제',
            warning: '🔄 경고 리셋'
        };
        
        const placeholders = {
            suspend: '정지 해제 사유를 입력하세요',
            chat: '채팅 금지 해제 사유를 입력하세요',
            warning: '경고 리셋 사유를 입력하세요'
        };
        
        document.getElementById('releaseModalTitle').textContent = titles[type];
        document.getElementById('releaseReason').placeholder = placeholders[type];
        document.getElementById('releaseReason').value = '';
        document.getElementById('releaseAdminNote').value = '';
        
        const submitBtn = document.getElementById('releaseSubmitBtn');
        submitBtn.textContent = type === 'warning' ? '경고 리셋' : '해제 처리';
        
        this.showModal('releaseModal');
    },

    // 토큰 초기화 모달 표시
    showResetTokenModal(userId) {
        this.currentUserId = userId;
        
        document.getElementById('resetTokenReason').value = '';
        document.getElementById('resetTokenAdminNote').value = '';
        
        this.showModal('resetTokenModal');
    },

    // 경고 처리
    async handleWarn(event) {
        event.preventDefault();
        
        const reason = document.getElementById('warnReason').value.trim();
        const adminNote = document.getElementById('warnAdminNote').value.trim();
        
        if (!reason || reason.length < 10) {
            Utils.showError('경고 사유는 최소 10자 이상 입력해야 합니다.');
            return;
        }
        
        try {
            const data = { reason };
            if (adminNote) data.adminNote = adminNote;
            
            const response = await CONFIG.api.post(`/admin/app-users/${this.currentUserId}/warn`, data);
            
            if (response.data.success) {
                Utils.showSuccess(response.data.message || '경고 처리가 완료되었습니다.');
                this.hideWarnModal();
                await this.loadUsers();
            }
        } catch (error) {
            console.error('경고 처리 실패:', error);
            Utils.showError(error.response?.data?.message || '경고 처리에 실패했습니다.');
        }
    },

    // 정지 처리
    async handleSuspend(event) {
        event.preventDefault();
        
        const duration = document.getElementById('suspendDuration').value;
        const reason = document.getElementById('suspendReason').value.trim();
        const adminNote = document.getElementById('suspendAdminNote').value.trim();
        
        if (!duration || !reason || reason.length < 10) {
            Utils.showError('모든 필수 항목을 입력해주세요.');
            return;
        }
        
        if (duration === 'permanent') {
            if (!confirm('정말로 영구 정지를 처리하시겠습니까?\n이 조치는 되돌릴 수 없습니다.')) {
                return;
            }
        }
        
        try {
            const data = { duration, reason };
            if (adminNote) data.adminNote = adminNote;
            
            const response = await CONFIG.api.post(`/admin/app-users/${this.currentUserId}/suspend`, data);
            
            if (response.data.success) {
                Utils.showSuccess(response.data.message || '정지 처리가 완료되었습니다.');
                this.hideSuspendModal();
                await this.loadUsers();
            }
        } catch (error) {
            console.error('정지 처리 실패:', error);
            Utils.showError(error.response?.data?.message || '정지 처리에 실패했습니다.');
        }
    },

    // 해제 처리
    async handleRelease(event) {
        event.preventDefault();
        
        const reason = document.getElementById('releaseReason').value.trim();
        const adminNote = document.getElementById('releaseAdminNote').value.trim();
        
        if (!reason || reason.length < 5) {
            Utils.showError('해제 사유는 최소 5자 이상 입력해야 합니다.');
            return;
        }
        
        try {
            const data = { reason };
            if (adminNote) data.adminNote = adminNote;
            
            let endpoint;
            switch (this.currentReleaseType) {
                case 'suspend':
                    endpoint = `/admin/app-users/${this.currentUserId}/unsuspend`;
                    break;
                case 'chat':
                    endpoint = `/admin/app-users/${this.currentUserId}/unban-chat`;
                    break;
                case 'warning':
                    endpoint = `/admin/app-users/${this.currentUserId}/reset-warnings`;
                    break;
            }
            
            const response = await CONFIG.api.post(endpoint, data);
            
            if (response.data.success) {
                Utils.showSuccess(response.data.message || '해제 처리가 완료되었습니다.');
                this.hideReleaseModal();
                await this.loadUsers();
            }
        } catch (error) {
            console.error('해제 처리 실패:', error);
            Utils.showError(error.response?.data?.message || '해제 처리에 실패했습니다.');
        }
    },

    // 토큰 초기화 처리
    async handleResetToken(event) {
        event.preventDefault();
        
        const reason = document.getElementById('resetTokenReason').value.trim();
        const adminNote = document.getElementById('resetTokenAdminNote').value.trim();
        
        if (!reason || reason.length < 5) {
            Utils.showError('초기화 사유는 최소 5자 이상 입력해야 합니다.');
            return;
        }
        
        if (!confirm('정말로 토큰을 초기화하시겠습니까?\n사용자는 강제로 로그아웃됩니다.')) {
            return;
        }
        
        try {
            const data = { reason };
            if (adminNote) data.adminNote = adminNote;
            
            const response = await CONFIG.api.post(`/admin/app-users/${this.currentUserId}/reset-tokens`, data);
            
            if (response.data.success) {
                Utils.showSuccess(response.data.message || '토큰 초기화가 완료되었습니다.');
                this.hideResetTokenModal();
                await this.loadUsers();
            }
        } catch (error) {
            console.error('토큰 초기화 실패:', error);
            Utils.showError(error.response?.data?.message || '토큰 초기화에 실패했습니다.');
        }
    },

    // 모달 표시/숨김 메서드들
    showModal(modalId) {
        document.getElementById(modalId).style.display = 'flex';
        document.body.style.overflow = 'hidden';
    },

    hideUserDetailModal() {
        document.getElementById('userDetailModal').style.display = 'none';
        document.body.style.overflow = 'auto';
    },

    hideWarnModal() {
        document.getElementById('warnModal').style.display = 'none';
        document.body.style.overflow = 'auto';
    },

    hideSuspendModal() {
        document.getElementById('suspendModal').style.display = 'none';
        document.body.style.overflow = 'auto';
    },

    hideReleaseModal() {
        document.getElementById('releaseModal').style.display = 'none';
        document.body.style.overflow = 'auto';
    },

    hideResetTokenModal() {
        document.getElementById('resetTokenModal').style.display = 'none';
        document.body.style.overflow = 'auto';
    },

    // 유틸리티 메서드들
    getStatusBadge(status) {
        const badges = {
            active: '<span class="status-badge success">활성</span>',
            suspended: '<span class="status-badge danger">정지</span>',
            permanently_suspended: '<span class="status-badge danger">영구정지</span>'
        };
        return badges[status] || `<span class="status-badge">${status}</span>`;
    },

    getChatStatusBadge(chatStatus, chatBannedUntil) {
        if (chatStatus === 'allowed') {
            return '<span class="status-badge success">채팅 허용</span>';
        }
        
        const until = chatBannedUntil ? ` (${new Date(chatBannedUntil).toLocaleDateString('ko-KR')})` : '';
        const badges = {
            banned_1_day: `<span class="status-badge warning">1일 금지${until}</span>`,
            banned_1_week: `<span class="status-badge warning">1주일 금지${until}</span>`,
            banned_1_month: `<span class="status-badge danger">1개월 금지${until}</span>`,
            banned_permanent: '<span class="status-badge danger">영구 금지</span>'
        };
        
        return badges[chatStatus] || `<span class="status-badge">${chatStatus}</span>`;
    },

    getProviderText(provider) {
        const providers = {
            kakao: '카카오',
            google: '구글',
            apple: '애플'
        };
        return providers[provider] || provider;
    },

    getStatusText(status) {
        const statuses = {
            active: '활성',
            suspended: '정지',
            permanently_suspended: '영구정지'
        };
        return statuses[status] || status;
    },

    getChatStatusText(chatStatus) {
        const statuses = {
            allowed: '허용',
            banned_1_day: '1일 금지',
            banned_1_week: '1주일 금지',
            banned_1_month: '1개월 금지',
            banned_permanent: '영구 금지'
        };
        return statuses[chatStatus] || chatStatus;
    },

    getSanctionTypeText(type) {
        const types = {
            warning: '경고',
            suspend: '정지',
            reset_warnings: '경고 리셋',
            unsuspend: '정지 해제',
            unban_chat: '채팅 해제',
            reset_tokens: '토큰 초기화'
        };
        return types[type] || type;
    },

    getWarningPenalty(warningCount) {
        const penalties = {
            1: '채팅 금지 1일',
            2: '채팅 금지 1주일',
            3: '채팅 금지 1개월',
            4: '채팅 금지 영구'
        };
        return penalties[warningCount] || '알 수 없음';
    }
};