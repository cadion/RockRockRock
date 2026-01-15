import { gameState, PASSIVES } from './state.js';
import { SHAPE_ICONS, judgeCard } from './logic.js';
import { audioManager } from './audioManager.js';
import { persistenceManager } from './persistence.js';

// DOM 요소 캐싱
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

export const DOM = {
    roundNum: () => $('#round-num'),
    deckCount: () => $('#deck-count'),
    gimmickDisplay: () => $('#gimmick-display'),
    gimmickText: () => $('#gimmick-text'),
    enemyCards: () => $('#enemy-cards'),
    playerCards: () => $('#player-cards'),
    handCards: () => $('#hand-cards'),
    actionBtn: () => $('#action-btn'),
    passiveList: () => $('#passive-list'),
    battleResult: () => $('#battle-result'),
    resultText: () => $('#result-text'),

    // 모달
    acquireModal: () => $('#acquire-modal'),
    acquireInfo: () => $('#acquire-info'),
    acquireCards: () => $('#acquire-cards'),
    acquireBtn: () => $('#acquire-btn'),

    eventModal: () => $('#event-modal'),
    eventPassives: () => $('#event-passives'),
    eventSkipBtn: () => $('#event-skip-btn'),

    gameoverTitle: () => $('#gameover-title'),
    gameoverText: () => $('#gameover-text'),
    restartBtn: () => $('#restart-btn'),

    gimmickAnnounceText: () => $('#gimmick-announce-text'),
    gimmickOkBtn: () => $('#gimmick-ok-btn'),

    // 덱 보기
    deckTotalCount: () => $('#deck-total-count'),
    deckCardList: () => $('#deck-card-list'),

    // 덱 통계
    statRock: () => $('#stat-rock'),
    statPaper: () => $('#stat-paper'),
    statScissors: () => $('#stat-scissors'),

    // 전투 로그
    battleLog: () => $('#battle-log'),

    // 분기 선택 모달
    branchModal: () => $('#branch-modal'),
    branchOptions: () => $('#branch-options'),

    // Modals
    acquireModal: () => $('#acquire-modal'),
    eventModal: () => $('#event-modal'),
    gameoverModal: () => $('#gameover-modal'),
    gimmickModal: () => $('#gimmick-modal'),

    // Buttons
    actionBtn: () => $('#action-btn'),
    deckViewBtn: () => $('#deck-view-btn'),
    deckCloseBtn: () => $('#deck-close-btn'),
    acquireDeckBtn: () => $('#acquire-deck-btn'),
    acquireBtn: () => $('#acquire-btn'), // Moved from acquire modal section
    bgmToggleBtn: () => $('#bgm-toggle'),

    // Overlays
    deckOverlay: () => $('#deck-overlay'),

    // 보스 HP
    bossHpContainer: () => $('#boss-hp-container'),
    bossName: () => $('#boss-name'),
    bossHpCurrent: () => $('#boss-hp-current'),
    bossHpMax: () => $('#boss-hp-max'),
    bossHpFill: () => $('#boss-hp-fill'),
};

// 전투 로그 메시지 표시
export function showLogMessage(text, type = 'passive') {
    const container = DOM.battleLog();
    const msg = document.createElement('div');
    msg.className = `log-message ${type}`;
    msg.textContent = text;
    container.appendChild(msg);

    // 2초 후 제거
    setTimeout(() => {
        if (msg.parentNode) {
            msg.remove();
        }
    }, 2000);
}

// 분기 선택 옵션 정의
const BRANCH_OPTIONS = [
    {
        id: 'safe',
        icon: '🛡️',
        title: '안전한 길',
        desc: '다음 라운드 적 카드 -1, 획득 선택지 감소',
        type: 'safe',
        modifier: { enemyCardBonus: -1, acquireBonus: -1 }
    },
    {
        id: 'danger',
        icon: '⚔️',
        title: '위험한 길',
        desc: '다음 라운드 적 카드 +1, 획득 선택지 증가',
        type: 'danger',
        modifier: { enemyCardBonus: 1, acquireBonus: 2 }
    },
    {
        id: 'mystery',
        icon: '🔮',
        title: '신비의 길',
        desc: '무작위 효과 적용',
        type: 'mystery',
        modifier: { mystery: true }
    }
];

// 분기 선택 모달 표시
export function showBranchModal(onSelect) {
    const modal = DOM.branchModal();
    const container = DOM.branchOptions();

    // 옵션 2개 랜덤 선택
    const shuffled = [...BRANCH_OPTIONS].sort(() => Math.random() - 0.5);
    const options = shuffled.slice(0, 2);

    container.innerHTML = options.map(opt => `
        <div class="branch-option ${opt.type}" data-id="${opt.id}">
            <span class="option-icon">${opt.icon}</span>
            <span class="option-title">${opt.title}</span>
            <div class="option-desc">${opt.desc}</div>
        </div>
    `).join('');

    container.querySelectorAll('.branch-option').forEach(el => {
        el.addEventListener('click', () => {
            const selected = options.find(o => o.id === el.dataset.id);
            modal.classList.add('hidden');
            onSelect(selected);
        });
    });

    modal.classList.remove('hidden');
}

// 라운드/덱 정보 업데이트 (핸드 포함)
export function updateInfoBar() {
    DOM.roundNum().textContent = gameState.round;
    // 덱 + 핸드 = 총 보유 카드
    const totalCards = gameState.deck.length + gameState.hand.length;
    DOM.deckCount().textContent = totalCards;

    // 가위/바위/보 개수 계산
    const allCards = [...gameState.deck, ...gameState.hand];
    const scissorsCount = allCards.filter(c => c.shape === 'scissors').length;
    const rockCount = allCards.filter(c => c.shape === 'rock').length;
    const paperCount = allCards.filter(c => c.shape === 'paper').length;

    // 개수 업데이트
    const scissorsEl = $('#scissors-count span');
    const rockEl = $('#rock-count span');
    const paperEl = $('#paper-count span');

    if (scissorsEl) scissorsEl.textContent = scissorsCount;
    if (rockEl) rockEl.textContent = rockCount;
    if (paperEl) paperEl.textContent = paperCount;

    // 최고 기록 표시
    const bestEl = $('.best-info span');
    if (bestEl) {
        const bestRound = persistenceManager.getBestRound();
        bestEl.textContent = bestRound > 0 ? bestRound : '-';
    }
}

// 기믹 표시
export function updateGimmickDisplay() {
    const display = DOM.gimmickDisplay();
    const text = DOM.gimmickText();

    if (gameState.currentGimmick) {
        display.classList.remove('hidden');
        text.textContent = gameState.currentGimmick.desc;
    } else {
        display.classList.add('hidden');
    }
}

// 보스 HP 바 업데이트
export function updateBossHPBar() {
    const container = DOM.bossHpContainer();
    const bossNameEl = DOM.bossName();
    const currentHpEl = DOM.bossHpCurrent();
    const maxHpEl = DOM.bossHpMax();
    const fillEl = DOM.bossHpFill();

    if (gameState.currentBoss && gameState.maxBossHealth > 0) {
        container.classList.remove('hidden');
        bossNameEl.textContent = gameState.currentBoss.name;
        currentHpEl.textContent = Math.max(0, gameState.currentBossHealth);
        maxHpEl.textContent = gameState.maxBossHealth;

        const hpPercentage = Math.max(0, (gameState.currentBossHealth / gameState.maxBossHealth) * 100);
        fillEl.style.width = `${hpPercentage}%`;
    } else {
        container.classList.add('hidden');
    }
}

// 카드 HTML 생성
export function createCardHTML(card, options = {}) {
    const {
        isEnemy = false,
        isPlaced = false,
        isSelected = false,
        showResult = false,
        result = null,
        index = -1,
        slotNumber = null
    } = options;

    const classes = ['card', card.color];
    if (isEnemy) classes.push('enemy-card');
    if (isPlaced) classes.push('placed');
    if (isSelected) classes.push('selected');
    if (card.hidden) classes.push('hidden-card');

    let resultBadge = '';
    if (showResult && result !== null) {
        const badgeClass = result === 1 ? 'win' : result === -1 ? 'lose' : 'draw';
        const badgeIcon = result === 1 ? '✓' : result === -1 ? '✗' : '−';
        resultBadge = `<div class="result-badge ${badgeClass}">${badgeIcon}</div>`;
    }

    // 슬롯 번호 뱃지 (선택된 핸드 카드용)
    let slotBadge = '';
    if (slotNumber !== null) {
        slotBadge = `<div class="slot-badge">${slotNumber}</div>`;
    }

    const shapeIcon = card.hidden ? '?' : SHAPE_ICONS[card.shape];

    return `
    <div class="${classes.join(' ')}" data-id="${card.id}" data-index="${index}">
      <span class="shape">${shapeIcon}</span>
      ${resultBadge}
      ${slotBadge}
    </div>
  `;
}

// 적 카드 렌더링
export function renderEnemyCards() {
    const container = DOM.enemyCards();
    container.innerHTML = gameState.enemyCards.map((card, i) =>
        createCardHTML(card, { isEnemy: true, index: i })
    ).join('');
}

// 내 필드 렌더링 (슬롯 + 선택된 카드 + 승패 미리보기)
export function renderPlayerField(onFieldCardClick) {
    const container = DOM.playerCards();
    const enemyCount = gameState.enemyCards.length;

    let html = '';
    for (let i = 0; i < enemyCount; i++) {
        const card = gameState.playerCards[i];
        const enemyCard = gameState.enemyCards[i];

        if (card) {
            // 승패 미리보기 계산 (숨겨진 적 카드는 제외)
            let previewResult = null;
            if (enemyCard && !enemyCard.hidden) {
                const judgment = judgeCard(card, enemyCard, i, enemyCount);
                previewResult = judgment.result;
            }
            html += createCardHTML(card, {
                isPlaced: true,
                index: i,
                showResult: previewResult !== null,
                result: previewResult
            });
        } else {
            html += `<div class="card-slot">${i + 1}</div>`;
        }
    }

    container.innerHTML = html;

    // 필드 카드 클릭 시 선택 취소
    if (onFieldCardClick) {
        container.querySelectorAll('.card').forEach((el) => {
            const cardId = el.dataset.id;
            el.addEventListener('click', () => onFieldCardClick(cardId));
        });
    }
}

// 핸드 렌더링
export function renderHand(onCardClick) {
    const container = DOM.handCards();

    container.innerHTML = gameState.hand.map((card, i) => {
        const isSelected = gameState.selectedHandIndices.includes(i);
        // 선택된 카드의 슬롯 번호 찾기
        let slotNumber = null;
        if (isSelected) {
            const fieldIndex = gameState.playerCards.findIndex(c => c && c.id === card.id);
            if (fieldIndex !== -1) {
                slotNumber = fieldIndex + 1;
            }
        }
        return createCardHTML(card, { isSelected, index: i, slotNumber });
    }).join('');

    // 클릭 이벤트 바인딩
    container.querySelectorAll('.card').forEach((el, i) => {
        el.addEventListener('click', () => {
            audioManager.playSFX('cardSelect');
            onCardClick(i);
        });
    });
}

// 빠른 선택 UI 업데이트 (DOM 재생성 없이 클래스만 변경)
export function quickUpdateSelectionUI() {
    const handContainer = DOM.handCards();
    const fieldContainer = DOM.playerCards();

    // 핸드 카드 업데이트
    const handCards = handContainer.querySelectorAll('.card');
    handCards.forEach((el, i) => {
        const isSelected = gameState.selectedHandIndices.includes(i);

        // selected 클래스 토글
        if (isSelected) {
            el.classList.add('selected');
        } else {
            el.classList.remove('selected');
        }

        // 슬롯 번호 뱃지 업데이트
        let existingBadge = el.querySelector('.slot-badge');
        if (isSelected) {
            const fieldIndex = gameState.playerCards.findIndex(c => c && c.id === gameState.hand[i].id);
            const slotNumber = fieldIndex + 1;
            if (existingBadge) {
                existingBadge.textContent = slotNumber;
            } else {
                const badge = document.createElement('div');
                badge.className = 'slot-badge';
                badge.textContent = slotNumber;
                el.appendChild(badge);
            }
        } else {
            if (existingBadge) {
                existingBadge.remove();
            }
        }
    });

    // 필드 카드 업데이트
    const fieldSlots = fieldContainer.querySelectorAll('.card-slot, .card');
    fieldSlots.forEach((el, i) => {
        const card = gameState.playerCards[i];
        const enemyCard = gameState.enemyCards[i];

        if (card) {
            // 슬롯에 카드가 있으면 카드로 교체
            if (el.classList.contains('card-slot')) {
                const cardEl = document.createElement('div');
                cardEl.className = `card ${card.color} placed`;
                cardEl.dataset.id = card.id;

                // 승패 미리보기
                let resultBadge = '';
                if (enemyCard && !enemyCard.hidden) {
                    const judgment = judgeCard(card, enemyCard, i, gameState.enemyCards.length);
                    const badgeClass = judgment.result === 1 ? 'win' : judgment.result === -1 ? 'lose' : 'draw';
                    const badgeIcon = judgment.result === 1 ? '✓' : judgment.result === -1 ? '✗' : '−';
                    resultBadge = `<div class="result-badge ${badgeClass}">${badgeIcon}</div>`;
                }

                cardEl.innerHTML = `<span class="shape">${SHAPE_ICONS[card.shape]}</span>${resultBadge}`;
                el.replaceWith(cardEl);
            }
        } else {
            // 슬롯이 비어있으면 빈 슬롯으로 교체
            if (!el.classList.contains('card-slot')) {
                const slot = document.createElement('div');
                slot.className = 'card-slot';
                slot.innerHTML = '<span class="slot-num">' + (i + 1) + '</span>';
                el.replaceWith(slot);
            }
        }
    });
}

// 액션 버튼 업데이트
export function updateActionButton() {
    const btn = DOM.actionBtn();
    const enemyCount = gameState.enemyCards.length;
    // null이 아닌 카드만 카운트
    const selectedCount = gameState.playerCards.filter(c => c !== null).length;

    if (selectedCount === enemyCount) {
        btn.disabled = false;
        btn.textContent = '제출하기!';
    } else {
        btn.disabled = true;
        btn.textContent = `카드 선택 (${selectedCount}/${enemyCount})`;
    }
}

// 패시브 렌더링
export function renderPassives() {
    const container = DOM.passiveList();

    if (gameState.passives.length === 0) {
        container.innerHTML = '<span style="color: var(--text-secondary); font-size: 12px;">패시브 없음</span>';
        return;
    }

    container.innerHTML = gameState.passives.map(p => `
    <div class="passive-emblem" style="background: ${p.color};">
      ${p.icon}
      <div class="passive-tooltip">${p.name}: ${p.desc}</div>
    </div>
  `).join('');
}

// 전투 결과 표시
export function showBattleResult(battleResult, onComplete) {
    const container = DOM.battleResult();
    const text = DOM.resultText();

    // 각 카드에 결과 뱃지 표시
    const playerCardEls = DOM.playerCards().querySelectorAll('.card');
    const enemyCardEls = DOM.enemyCards().querySelectorAll('.card');

    battleResult.results.forEach((r, i) => {
        const pCard = playerCardEls[i];
        const eCard = enemyCardEls[i];

        if (pCard) {
            const badgeClass = r.result === 1 ? 'win' : r.result === -1 ? 'lose' : 'draw';
            const badgeIcon = r.result === 1 ? '✓' : r.result === -1 ? '✗' : '−';
            pCard.insertAdjacentHTML('beforeend', `<div class="result-badge ${badgeClass} pop-in">${badgeIcon}</div>`);
        }

        if (eCard) {
            const badgeClass = r.result === 1 ? 'lose' : r.result === -1 ? 'win' : 'draw';
            const badgeIcon = r.result === 1 ? '✗' : r.result === -1 ? '✓' : '−';
            eCard.insertAdjacentHTML('beforeend', `<div class="result-badge ${badgeClass} pop-in">${badgeIcon}</div>`);
        }
    });

    // 기믹 모방 시 적 첫 카드 업데이트
    if (gameState.currentGimmick?.mimicFirst && gameState.enemyCards[0]?.mimicked) {
        const firstEnemyCard = enemyCardEls[0];
        if (firstEnemyCard) {
            firstEnemyCard.querySelector('.shape').textContent = SHAPE_ICONS[gameState.enemyCards[0].shape];
        }
    }

    // 결과 텍스트
    container.classList.remove('hidden', 'win', 'lose');

    let resultMessage = '';
    if (battleResult.isVictory) {
        container.classList.add('win');
        resultMessage = `🎉 승리! (${battleResult.totalWins}승 ${battleResult.losses}패)`;
        if (battleResult.bonusWins > 0) {
            resultMessage += ` [빨간 맛 +${battleResult.bonusWins}]`;
        }

        // 효과 추가 (Juice)
        audioManager.playSFX('win');
        triggerConfetti();
    } else {
        container.classList.add('lose');
        resultMessage = `💀 패배... (${battleResult.wins}승 ${battleResult.losses}패)`;

        // 효과 추가 (Shake)
        audioManager.playSFX('lose');
        triggerScreenShake();
    }

    text.textContent = resultMessage;

    setTimeout(() => {
        container.classList.add('hidden');
        onComplete();
    }, 2000);
}

// ===== 효과 도우미 =====

export function triggerConfetti() {
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ffffff']
        });
    }
}

export function triggerScreenShake() {
    const container = $('#game-container');
    container.classList.add('shake');
    setTimeout(() => {
        container.classList.remove('shake');
    }, 500);
}

// 카드 획득 모달
export function showAcquireModal(cards, selectCount, onConfirm) {
    const modal = DOM.acquireModal();
    const info = DOM.acquireInfo();
    const container = DOM.acquireCards();
    const btn = DOM.acquireBtn();

    info.textContent = `${cards.length}장 중 ${selectCount}장을 선택하세요`;

    let selectedIndices = [];

    // 초기 렌더링 (한 번만)
    container.innerHTML = cards.map((card, i) => {
        return createCardHTML(card, { isSelected: false, index: i });
    }).join('');

    // 클릭 이벤트 바인딩 (한 번만)
    const cardElements = container.querySelectorAll('.card');
    cardElements.forEach((el, i) => {
        el.addEventListener('click', () => {
            if (selectedIndices.includes(i)) {
                selectedIndices = selectedIndices.filter(idx => idx !== i);
                el.classList.remove('selected');
            } else if (selectedIndices.length < selectCount) {
                selectedIndices.push(i);
                el.classList.add('selected');
            }
            btn.disabled = selectedIndices.length !== selectCount;
        });
    });

    btn.disabled = true;
    modal.classList.remove('hidden');

    const handleConfirm = () => {
        btn.removeEventListener('click', handleConfirm);
        modal.classList.add('hidden');
        const selectedCards = selectedIndices.map(i => cards[i]);
        onConfirm(selectedCards);
    };

    btn.addEventListener('click', handleConfirm);
}

// 이벤트 모달 (패시브 선택)
export function showEventModal(passives, onSelect) {
    const modal = DOM.eventModal();
    const container = DOM.eventPassives();
    const skipBtn = DOM.eventSkipBtn();

    let selectedId = null;

    const render = () => {
        container.innerHTML = passives.map(p => `
      <div class="passive-choice ${selectedId === p.id ? 'selected' : ''}" data-id="${p.id}">
        <span class="icon">${p.icon}</span>
        <span class="name">${p.name}</span>
        <span class="desc">${p.desc}</span>
      </div>
    `).join('');

        container.querySelectorAll('.passive-choice').forEach(el => {
            el.addEventListener('click', () => {
                selectedId = el.dataset.id;
                render();
                // 선택 후 바로 적용
                cleanup();
                const selected = passives.find(p => p.id === selectedId);
                onSelect(selected);
            });
        });
    };

    const cleanup = () => {
        modal.classList.add('hidden');
    };

    skipBtn.onclick = () => {
        cleanup();
        onSelect(null);
    };

    render();
    modal.classList.remove('hidden');
}

// 패시브 교체 모달 (간단히 선택)
export function showReplacePassiveModal(currentPassives, newPassive, onReplace, onBack) {
    const modal = DOM.eventModal();
    const container = DOM.eventPassives();
    const skipBtn = DOM.eventSkipBtn();

    skipBtn.textContent = '이전으로';
    skipBtn.style.display = '';

    container.innerHTML = `
    <p style="margin-bottom: 16px;">교체할 패시브를 선택하세요</p>
    <p style="margin-bottom: 16px; font-size: 14px; color: var(--text-secondary);">새 패시브: ${newPassive.icon} ${newPassive.name}</p>
    ${currentPassives.map(p => `
      <div class="passive-choice" data-id="${p.id}">
        <span class="icon">${p.icon}</span>
        <span class="name">${p.name}</span>
        <span class="desc">${p.desc}</span>
      </div>
    `).join('')}
  `;

    container.querySelectorAll('.passive-choice').forEach(el => {
        el.addEventListener('click', () => {
            modal.classList.add('hidden');
            skipBtn.textContent = '건너뛰기';
            onReplace(el.dataset.id);
        });
    });

    skipBtn.onclick = () => {
        modal.classList.add('hidden');
        skipBtn.textContent = '건너뛰기';
        if (onBack) {
            onBack();
        }
    };

    modal.classList.remove('hidden');
}

// 게임 오버 모달
export function showGameoverModal(isWin, message, onRestart) {
    const modal = DOM.gameoverModal();
    const title = DOM.gameoverTitle();
    const text = DOM.gameoverText();
    const btn = DOM.restartBtn();

    title.textContent = isWin ? '🎊 축하합니다!' : '💀 게임 오버';
    title.style.color = isWin ? 'var(--success)' : 'var(--danger)';
    text.textContent = message;

    modal.classList.remove('hidden');

    btn.onclick = () => {
        modal.classList.add('hidden');
        onRestart();
    };
}

// 기믹 발표 모달
export function showGimmickModal(gimmick, onOk) {
    const modal = DOM.gimmickModal();
    const text = DOM.gimmickAnnounceText();
    const btn = DOM.gimmickOkBtn();

    text.textContent = gimmick.desc;
    modal.classList.remove('hidden');

    btn.onclick = () => {
        modal.classList.add('hidden');
        onOk();
    };
}

// 덱 오버레이 표시
export function showDeckOverlay() {
    const overlay = DOM.deckOverlay();
    const countEl = DOM.deckTotalCount();
    const listEl = DOM.deckCardList();

    // 버려진 카드 ID 목록
    const discardedIds = gameState.discardPile.map(c => c.id);

    // 전체 카드 = 덱 + 핸드 (버려진 카드 제외)
    const allCards = [...gameState.deck, ...gameState.hand].filter(
        card => !discardedIds.includes(card.id)
    );
    const handIds = gameState.hand.map(c => c.id);

    countEl.textContent = allCards.length;

    // 카드 정렬: 색상별, 모양별
    const colorOrder = ['blue', 'yellow', 'orange', 'purple', 'white'];
    const shapeOrder = ['rock', 'paper', 'scissors'];

    allCards.sort((a, b) => {
        const colorDiff = colorOrder.indexOf(a.color) - colorOrder.indexOf(b.color);
        if (colorDiff !== 0) return colorDiff;
        return shapeOrder.indexOf(a.shape) - shapeOrder.indexOf(b.shape);
    });

    listEl.innerHTML = allCards.map(card => {
        const isInHand = handIds.includes(card.id);
        const classes = ['card', card.color];
        if (isInHand) classes.push('in-hand');

        return `
            <div class="${classes.join(' ')}" data-id="${card.id}">
                <span class="shape">${SHAPE_ICONS[card.shape]}</span>
            </div>
        `;
    }).join('');

    // 통계 계산
    const rockCount = allCards.filter(c => c.shape === 'rock').length;
    const paperCount = allCards.filter(c => c.shape === 'paper').length;
    const scissorsCount = allCards.filter(c => c.shape === 'scissors').length;

    DOM.statRock().textContent = rockCount;
    DOM.statPaper().textContent = paperCount;
    DOM.statScissors().textContent = scissorsCount;

    overlay.classList.remove('hidden');
}

// 덱 오버레이 숨기기
export function hideDeckOverlay() {
    DOM.deckOverlay().classList.add('hidden');
}

// ===== 애니메이션 유틸리티 =====

// 핸드에 남은 카드들 불태우기
export function burnRemainingHandCards(selectedIndices) {
    return new Promise((resolve) => {
        const container = DOM.handCards();
        const cards = container.querySelectorAll('.card');
        let burnCount = 0;
        let totalToBurn = 0;

        cards.forEach((card, index) => {
            if (!selectedIndices.includes(index)) {
                totalToBurn++;

                // 약간의 딜레이를 줘서 순차적으로 불타게
                setTimeout(() => {
                    card.classList.add('burning');

                    // 재 파티클 생성
                    createAshParticles(card);

                    burnCount++;
                    if (burnCount === totalToBurn) {
                        // 모든 카드가 불탄 후 resolve
                        setTimeout(resolve, 800);
                    }
                }, index * 100);
            }
        });

        // 불태울 카드가 없으면 바로 resolve
        if (totalToBurn === 0) {
            resolve();
        }
    });
}

// 재 파티클 생성
function createAshParticles(cardEl) {
    const rect = cardEl.getBoundingClientRect();
    const container = cardEl.parentElement;

    for (let i = 0; i < 8; i++) {
        const ash = document.createElement('div');
        ash.className = 'ash-particle';
        ash.style.left = `${rect.left - container.getBoundingClientRect().left + Math.random() * 60}px`;
        ash.style.top = `${rect.top - container.getBoundingClientRect().top + 40 + Math.random() * 20}px`;
        ash.style.animationDelay = `${Math.random() * 0.3}s`;
        container.appendChild(ash);

        // 파티클 제거
        setTimeout(() => ash.remove(), 1000);
    }
}

// 필드 카드들을 덱 버튼으로 날려보내기
export function flyCardsToDeck() {
    return new Promise((resolve) => {
        const playerCardsContainer = DOM.playerCards();
        const cards = playerCardsContainer.querySelectorAll('.card');
        const deckBtn = DOM.deckViewBtn();
        const deckRect = deckBtn.getBoundingClientRect();

        if (cards.length === 0) {
            resolve();
            return;
        }

        let flyCount = 0;

        cards.forEach((card, index) => {
            const cardRect = card.getBoundingClientRect();

            // 카드를 fixed position으로 복제
            const flyingCard = card.cloneNode(true);
            flyingCard.style.position = 'fixed';
            flyingCard.style.left = `${cardRect.left}px`;
            flyingCard.style.top = `${cardRect.top}px`;
            flyingCard.style.width = `${cardRect.width}px`;
            flyingCard.style.height = `${cardRect.height}px`;
            flyingCard.style.margin = '0';
            flyingCard.style.zIndex = '3000';

            document.body.appendChild(flyingCard);

            // 원본 카드 숨기기
            card.style.visibility = 'hidden';

            // 딜레이를 주고 날아가기 시작
            setTimeout(() => {
                // 목표 위치로 이동
                flyingCard.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                flyingCard.style.left = `${deckRect.left + deckRect.width / 2 - 30}px`;
                flyingCard.style.top = `${deckRect.top + deckRect.height / 2 - 40}px`;
                flyingCard.style.transform = 'scale(0.3) rotate(360deg)';
                flyingCard.style.opacity = '0';

                // 덱 버튼 펄스 효과
                setTimeout(() => {
                    deckBtn.classList.add('absorbing');
                    setTimeout(() => deckBtn.classList.remove('absorbing'), 300);
                }, 400);

                // 날아간 카드 제거
                setTimeout(() => {
                    flyingCard.remove();
                    flyCount++;
                    if (flyCount === cards.length) {
                        resolve();
                    }
                }, 500);
            }, index * 100);
        });
    });
}

// (역전의 대가) 핸드에 남은 카드들을 덱으로 날려보내기
export function flyHandCardsToDeck(selectedIndices) {
    return new Promise((resolve) => {
        const container = DOM.handCards();
        const cards = container.querySelectorAll('.card');
        const deckBtn = DOM.deckViewBtn();
        const deckRect = deckBtn.getBoundingClientRect();

        let flyCount = 0;
        let totalToFly = 0;

        // 선택되지 않은 카드만 날아감
        cards.forEach((card, index) => {
            if (!selectedIndices.includes(index)) {
                totalToFly++;
            }
        });

        if (totalToFly === 0) {
            resolve();
            return;
        }

        cards.forEach((card, index) => {
            if (!selectedIndices.includes(index)) {
                const cardRect = card.getBoundingClientRect();

                // 카드 복제
                const flyingCard = card.cloneNode(true);
                flyingCard.classList.remove('selected');
                flyingCard.style.position = 'fixed';
                flyingCard.style.left = `${cardRect.left}px`;
                flyingCard.style.top = `${cardRect.top}px`;
                flyingCard.style.width = `${cardRect.width}px`;
                flyingCard.style.height = `${cardRect.height}px`;
                flyingCard.style.margin = '0';
                flyingCard.style.zIndex = '3000';
                flyingCard.style.opacity = '1';

                document.body.appendChild(flyingCard);
                card.style.visibility = 'hidden';

                setTimeout(() => {
                    flyingCard.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                    flyingCard.style.left = `${deckRect.left + deckRect.width / 2 - 30}px`;
                    flyingCard.style.top = `${deckRect.top + deckRect.height / 2 - 40}px`;
                    flyingCard.style.transform = 'scale(0.3) rotate(360deg)';
                    flyingCard.style.opacity = '0';

                    setTimeout(() => {
                        deckBtn.classList.add('absorbing');
                        setTimeout(() => deckBtn.classList.remove('absorbing'), 300);
                    }, 400);

                    setTimeout(() => {
                        flyingCard.remove();
                        flyCount++;
                        if (flyCount === totalToFly) {
                            resolve();
                        }
                    }, 500);
                }, index * 80);
            }
        });
    });
}

// (역전의 대가) 필드 카드들 불태우기
export function burnFieldCards() {
    return new Promise((resolve) => {
        const container = DOM.playerCards();
        const cards = container.querySelectorAll('.card');

        if (cards.length === 0) {
            resolve();
            return;
        }

        let burnCount = 0;

        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('burning');
                createAshParticlesForField(card);

                burnCount++;
                if (burnCount === cards.length) {
                    setTimeout(resolve, 800);
                }
            }, index * 100);
        });
    });
}

// 필드용 재 파티클 생성
function createAshParticlesForField(cardEl) {
    const rect = cardEl.getBoundingClientRect();

    for (let i = 0; i < 8; i++) {
        const ash = document.createElement('div');
        ash.className = 'ash-particle';
        ash.style.position = 'fixed';
        ash.style.left = `${rect.left + Math.random() * rect.width}px`;
        ash.style.top = `${rect.top + rect.height / 2 + Math.random() * 20}px`;
        ash.style.animationDelay = `${Math.random() * 0.3}s`;
        document.body.appendChild(ash);

        setTimeout(() => ash.remove(), 1000);
    }
}
