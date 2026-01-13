// ===== 메인 게임 루프 =====
import './style.css';
import { gameState, getRandomPassives, getRandomGimmick, shuffle, PASSIVES, GIMMICKS, BOSSES } from './state.js';
import roundConfig from './roundConfig.json';
import {
  generateEnemyCards,
  drawHand,
  resolveBattle,
  processEndOfRound,
  generateAcquisitionCards,
  checkDeckHealth
} from './logic.js';
import {
  updateInfoBar,
  updateGimmickDisplay,
  renderEnemyCards,
  renderPlayerField,
  renderHand,
  updateActionButton,
  renderPassives,
  showBattleResult,
  showAcquireModal,
  showEventModal,
  showReplacePassiveModal,
  showGameoverModal,
  showGimmickModal,
  showDeckOverlay,
  burnRemainingHandCards,
  flyCardsToDeck,
  flyHandCardsToDeck,
  burnFieldCards,
  hideDeckOverlay,
  quickUpdateSelectionUI,
  showLogMessage,
  DOM
} from './ui.js';
import { audioManager } from './audioManager.js';
import { persistenceManager } from './persistence.js';

// ===== 패시브 추가/제거 헬퍼 =====
function addPassiveToState(passive) {
  if (passive.onApply) {
    passive.onApply(gameState);
  }
  gameState.passives.push(passive);
}

function removePassiveFromState(passiveId) {
  const removed = gameState.passives.find(p => p.id === passiveId);
  if (removed && removed.onRemove) {
    removed.onRemove(gameState);
  }
  gameState.passives = gameState.passives.filter(p => p.id !== passiveId);
  return removed;
}

// ===== 게임 초기화 =====
function initGame(loadSave = false) {
  if (loadSave) {
    const savedState = persistenceManager.loadGameState(PASSIVES, GIMMICKS, BOSSES);
    if (savedState) {
      // 상태 복구
      gameState.round = savedState.round;
      gameState.deck = savedState.deck;
      gameState.hand = savedState.hand;
      gameState.discardPile = savedState.discardPile;
      gameState.deckSize = savedState.deckSize;
      gameState.passives = savedState.passives;
      gameState.currentGimmick = savedState.currentGimmick;
      gameState.currentBoss = savedState.currentBoss;
      gameState.consecutiveWins = savedState.consecutiveWins;
      gameState.lastWinColors = savedState.lastWinColors;

      // 패시브 onApply 훅 다시 실행
      gameState.passives.forEach(p => {
        if (p.onApply) {
          p.onApply(gameState);
        }
      });
    }
  } else {
    gameState.reset();
    persistenceManager.clearGameState();
  }
  audioManager.playBGM('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'); // Placeholder BGM
  startRound();
}

// ===== 라운드 시작 =====
function startRound() {
  // 덱 체크
  const health = checkDeckHealth();
  if (!health.canContinue) {
    showGameoverModal(false, health.reason, initGame);
    return;
  }

  const roundStr = String(gameState.round);
  const roundData = roundConfig.rounds[roundStr];

  // 보스 체크 (roundConfig에 해당 라운드 boss가 있으면)
  if (roundData?.boss) {
    const bossId = roundData.boss[Math.floor(Math.random() * roundData.boss.length)];
    if (BOSSES[bossId]) {
      gameState.currentBoss = BOSSES[bossId];
      gameState.currentGimmick = null; // 보스전에는 기믹 없음

      // 보스 등장 알림
      showLogMessage(`⚔️ 보스 등장: ${BOSSES[bossId].name}!`, 'gimmick');

      // 배경색 변경
      document.body.style.background = BOSSES[bossId].bgColor;

      checkEventPhaseBeforeBattle(roundData);
      return;
    }
  } else {
    gameState.currentBoss = null;
    // 배경색 복원
    document.body.style.background = '';
  }

  // 기믹 체크 (roundConfig에 해당 라운드 gimmicks가 있으면)
  if (roundData?.gimmicks) {
    const gimmickId = roundData.gimmicks[Math.floor(Math.random() * roundData.gimmicks.length)];

    if (gimmickId === 'CLEAR') {
      // 기믹 해제
      gameState.currentGimmick = null;
      checkEventPhaseBeforeBattle(roundData);
    } else if (GIMMICKS[gimmickId]) {
      gameState.currentGimmick = GIMMICKS[gimmickId];
      showGimmickModal(gameState.currentGimmick, () => {
        checkEventPhaseBeforeBattle(roundData);
      });
    } else {
      checkEventPhaseBeforeBattle(roundData);
    }
  } else {
    checkEventPhaseBeforeBattle(roundData);
  }
}

// ===== 패시브 선택 (전투 전) =====
function checkEventPhaseBeforeBattle(roundData) {
  // roundConfig에 해당 라운드 passives가 있으면 패시브 선택
  if (roundData?.passives && roundData.passives.length > 0) {
    const passiveIds = roundData.passives;
    const currentPassiveIds = gameState.passives.map(p => p.id);
    const availablePassives = passiveIds
      .filter(id => PASSIVES[id] && !currentPassiveIds.includes(id))
      .map(id => PASSIVES[id]);

    if (availablePassives.length > 0) {
      // 2개까지 랜덤으로 선택하여 보여줌
      const options = shuffle(availablePassives).slice(0, 2);
      startEventPhaseWithOptions(options, () => {
        setupBattlePhase();
      });
    } else {
      setupBattlePhase();
    }
  } else {
    setupBattlePhase();
  }
}

function setupBattlePhase() {
  gameState.phase = 'battle';

  // 핸드 드로우
  gameState.hand = drawHand();

  // 적 카드 생성
  gameState.enemyCards = generateEnemyCards();

  // 플레이어 필드 초기화 (적 카드 수만큼 null로 채움)
  const enemyCount = gameState.enemyCards.length;
  gameState.playerCards = new Array(enemyCount).fill(null);
  gameState.selectedHandIndices = [];

  // UI 업데이트
  updateInfoBar();
  updateGimmickDisplay();
  renderEnemyCards();
  renderPlayerField(onFieldCardClick);
  renderHand(onHandCardClick);
  renderPassives();
  updateActionButton();

  // 제출 버튼 이벤트
  DOM.actionBtn().onclick = onSubmit;
}

// ===== 핸드 카드 클릭 =====
function onHandCardClick(handIndex) {
  const card = gameState.hand[handIndex];
  if (!card) return;

  // 이미 선택된 카드라면 선택 해제
  if (gameState.selectedHandIndices.includes(handIndex)) {
    deselectCard(card, handIndex);
  } else {
    // 비어있는 가장 왼쪽 슬롯 찾기
    const emptySlotIndex = gameState.playerCards.findIndex(c => c === null);
    if (emptySlotIndex !== -1) {
      gameState.selectedHandIndices.push(handIndex);
      gameState.playerCards[emptySlotIndex] = card;
    }
  }

  updateSelectionUI();
}

// ===== 필드 카드 클릭 (선택 취소) =====
function onFieldCardClick(cardId) {
  // cardId로 핸드에서 해당 카드의 인덱스 찾기
  const handIndex = gameState.hand.findIndex(c => c && c.id === cardId);
  if (handIndex === -1) return;

  const card = gameState.hand[handIndex];
  deselectCard(card, handIndex);
  updateSelectionUI();
}

// ===== 카드 선택 해제 =====
function deselectCard(card, handIndex) {
  // 필드에서 해당 카드 위치를 찾아서 null로 설정 (위치 유지)
  const fieldIndex = gameState.playerCards.findIndex(c => c && c.id === card.id);
  if (fieldIndex !== -1) {
    gameState.playerCards[fieldIndex] = null;
  }
  gameState.selectedHandIndices = gameState.selectedHandIndices.filter(i => i !== handIndex);
}

// ===== 선택 UI 업데이트 =====
function updateSelectionUI() {
  quickUpdateSelectionUI();
  rebindFieldClickEvents();
  updateActionButton();
}

// 필드 카드 클릭 이벤트 다시 바인딩
function rebindFieldClickEvents() {
  const container = DOM.playerCards();
  container.querySelectorAll('.card').forEach(el => {
    // 기존 이벤트 제거를 위해 clone
    if (!el.dataset.bound) {
      el.dataset.bound = 'true';
      el.addEventListener('click', () => onFieldCardClick(el.dataset.id));
    }
  });
}

// ===== 제출 =====
async function onSubmit() {
  const selectedIndices = [...gameState.selectedHandIndices];
  const gimmick = gameState.currentGimmick;
  const isReversed = gimmick && gimmick.reversedDiscard;

  if (isReversed) {
    // 역전의 대가: 핸드 카드가 먼저 덱으로 날아감
    await flyHandCardsToDeck(selectedIndices);
  } else {
    // 기본: 핸드 카드가 불타서 재가 됨
    await burnRemainingHandCards(selectedIndices);
  }

  // 전투 판정
  const battleResult = resolveBattle();

  // 패시브 발동 로그 표시
  const passiveNames = {
    joker: '🃏 조커 발동!',
    redMatch: '🔴 붉은 심판 발동!',
    blueMatch: '🔵 푸른 심판 발동!',
    thirdReverse: '🔄 역전의 용사 발동!',
    redRush: '🍎 빨간 맛 +1!'
  };

  battleResult.triggeredPassives?.forEach((id, i) => {
    setTimeout(() => {
      if (passiveNames[id]) {
        showLogMessage(passiveNames[id], 'passive');
      }
    }, i * 300);
  });

  // 결과 표시
  showBattleResult(battleResult, async () => {
    if (battleResult.isVictory) {
      if (isReversed) {
        // 역전의 대가: 필드 카드가 불타서 재가 됨
        await burnFieldCards();
      } else {
        // 기본: 필드 카드가 덱으로 날아감
        await flyCardsToDeck();
      }

      // 카드 처리 (로직)
      const lostCount = processEndOfRound(battleResult);

      // 다음 페이즈로
      if (lostCount > 0) {
        startAcquirePhase(lostCount);
      } else {
        nextRound();
      }
    } else {
      // 패배
      persistenceManager.updateStatsOnGameOver(gameState.round, false);
      persistenceManager.clearGameState();
      showGameoverModal(false, `${gameState.round}라운드에서 패배했습니다.`, initGame);
    }
  });
}

// ===== 카드 획득 페이즈 =====
function startAcquirePhase(lostCount) {
  gameState.phase = 'acquire';

  // 현재 덱 크기 (라이프사이클 훅으로 관리됨)
  const currentDeckSize = gameState.deckSize;

  // 현재 보유 카드 수
  const currentCardCount = gameState.deck.length;

  // 실제 획득해야 할 카드 수 = 덱 크기 - 현재 카드 수 (0 이상)
  const actualNeed = Math.max(0, currentDeckSize - currentCardCount);

  // 실제 획득할 카드 수는 lostCount와 actualNeed 중 작은 값
  const acquireCount = Math.min(lostCount, actualNeed);

  if (acquireCount <= 0) {
    // 획득할 필요 없음
    afterAcquirePhase();
    return;
  }

  // 4개 이하: acquireCount * 2개 중 acquireCount개 선택
  // 4개 초과: 8개 중 4개 선택을 반복

  if (acquireCount <= 4) {
    const options = generateAcquisitionCards(acquireCount * 2);
    showAcquireModal(options, acquireCount, (selected) => {
      gameState.deck.push(...selected);
      gameState.deck = shuffle(gameState.deck);
      afterAcquirePhase();
    });
  } else {
    // 반복 획득
    acquireMultiple(acquireCount);
  }
}

function acquireMultiple(remaining) {
  if (remaining <= 0) {
    afterAcquirePhase();
    return;
  }

  const selectCount = Math.min(4, remaining);
  const options = generateAcquisitionCards(8);

  showAcquireModal(options, selectCount, (selected) => {
    gameState.deck.push(...selected);
    gameState.deck = shuffle(gameState.deck);
    acquireMultiple(remaining - selectCount);
  });
}

// ===== 카드 획득 후 다음 라운드 =====
function afterAcquirePhase() {
  persistenceManager.saveGameState(gameState);
  nextRound();
}

// 패시브 선택 처리 공통 로직
function handlePassiveSelection(options, onComplete) {
  const showSelection = () => {
    showEventModal(options, (selected) => {
      if (selected) {
        // 패시브 3개 제한
        if (gameState.passives.length >= 3) {
          showReplacePassiveModal(gameState.passives, selected, (replaceId) => {
            removePassiveFromState(replaceId);
            addPassiveToState(selected);
            renderPassives();
            onComplete();
          }, () => {
            // 이전으로 돌아가기
            showSelection();
          });
        } else {
          addPassiveToState(selected);
          renderPassives();
          onComplete();
        }
      } else {
        onComplete();
      }
    });
  };

  showSelection();
}

function startEventPhase(onComplete) {
  gameState.phase = 'event';
  const currentPassiveIds = gameState.passives.map(p => p.id);
  const options = getRandomPassives(2, currentPassiveIds);
  handlePassiveSelection(options, onComplete);
}

// roundConfig에서 지정된 패시브 옵션으로 이벤트 페이즈 시작
function startEventPhaseWithOptions(options, onComplete) {
  gameState.phase = 'event';
  handlePassiveSelection(options, onComplete);
}

// ===== 다음 라운드 =====
function nextRound() {
  gameState.round++;

  // 무한 게임 (승리 조건 없음, 계속 진행)
  // 원한다면 여기에 승리 조건 추가 가능 (예: 50라운드 클리어)
  if (gameState.round > 50) {
    persistenceManager.updateStatsOnGameOver(gameState.round, true);
    persistenceManager.clearGameState();
    showGameoverModal(true, '50라운드를 클리어했습니다! 축하합니다!', initGame);
    return;
  }

  persistenceManager.saveGameState(gameState);
  startRound();
}

// ===== 시작 =====
document.addEventListener('DOMContentLoaded', () => {
  // 저장된 게임이 있으면 이어하기 여부 확인
  if (persistenceManager.hasSave()) {
    const resume = confirm('저장된 게임을 이어하시겠습니까?');
    initGame(resume);
  } else {
    initGame();
  }

  // 덱 보기 버튼 이벤트
  DOM.deckViewBtn().addEventListener('click', () => {
    audioManager.playSFX('cardSelect');
    showDeckOverlay();
  });

  // BGM 토글 버튼 이벤트
  DOM.bgmToggleBtn().addEventListener('click', () => {
    const isMuted = audioManager.toggleMute();
    DOM.bgmToggleBtn().textContent = isMuted ? '🔇' : '🔊';
  });
  DOM.deckCloseBtn().addEventListener('click', () => {
    audioManager.playSFX('cardSelect');
    hideDeckOverlay();
  });

  // 획득 모달에서 덱 보기 버튼
  DOM.acquireDeckBtn().addEventListener('click', showDeckOverlay);

  // 오버레이 바깥 클릭 시 닫기
  DOM.deckOverlay().addEventListener('click', (e) => {
    if (e.target === DOM.deckOverlay()) {
      hideDeckOverlay();
    }
  });
});

// ===== 치트 시스템 (콘솔용) =====
window.cheat = {
  // 상태 보기
  state: gameState,
  passives: PASSIVES,
  gimmicks: GIMMICKS,

  // 기믹 설정
  setGimmick(gimmickId) {
    if (GIMMICKS[gimmickId]) {
      gameState.currentGimmick = GIMMICKS[gimmickId];
      updateGimmickDisplay();
      console.log(`✅ 기믹 설정: ${GIMMICKS[gimmickId].name}`);
    } else {
      console.log('❌ 사용 가능한 기믹:', Object.keys(GIMMICKS).join(', '));
    }
  },

  // 패시브 추가
  addPassive(passiveId) {
    if (PASSIVES[passiveId]) {
      if (gameState.passives.length >= 3) {
        console.log('⚠️ 패시브가 이미 3개입니다. 먼저 removePassive로 제거하세요.');
        return;
      }
      const passive = PASSIVES[passiveId];
      addPassiveToState(passive);
      renderPassives();
      console.log(`✅ 패시브 추가: ${passive.name}`);
    } else {
      console.log('❌ 사용 가능한 패시브:', Object.keys(PASSIVES).join(', '));
    }
  },

  // 패시브 제거
  removePassive(passiveId) {
    const removed = removePassiveFromState(passiveId);
    if (removed) {
      renderPassives();
      console.log(`✅ 패시브 제거: ${removed.name}`);
    } else {
      console.log('❌ 현재 패시브:', gameState.passives.map(p => p.id).join(', '));
    }
  },

  // 패시브 초기화
  clearPassives() {
    // 각 패시브의 onRemove 훅 호출
    gameState.passives.forEach(p => {
      if (p.onRemove) {
        p.onRemove(gameState);
      }
    });
    gameState.passives = [];
    renderPassives();
    console.log('✅ 모든 패시브 제거됨');
  },

  // 라운드 설정
  setRound(round) {
    gameState.round = round;
    updateInfoBar();
    console.log(`✅ 라운드 설정: ${round}`);
  },

  // 도움말
  help() {
    console.log(`
🎮 치트 명령어 목록:

📋 상태 보기:
  cheat.state              - 현재 게임 상태
  cheat.passives           - 모든 패시브 목록
  cheat.gimmicks           - 모든 기믹 목록

⚡ 기믹 설정:
  cheat.setGimmick('reversal')    - 역전의 대가 기믹 적용

🔮 패시브 관리:
  cheat.addPassive('bigHand')     - 큰 손 패시브 추가
  cheat.removePassive('bigHand')  - 큰 손 패시브 제거
  cheat.clearPassives()           - 모든 패시브 제거

🔢 라운드:
  cheat.setRound(10)              - 10라운드로 설정

📦 사용 가능한 ID:
  기믹: ${Object.keys(GIMMICKS).join(', ')}
  패시브: ${Object.keys(PASSIVES).join(', ')}
    `);
  }
};

console.log('🎮 치트 사용법: cheat.help()');
