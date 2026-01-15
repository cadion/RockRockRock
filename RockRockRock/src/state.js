// ===== 게임 상태 관리 =====

// 초기 덱 생성 (5색상 x 3모양 = 15장)
export function createInitialDeck() {
    const colors = ['blue', 'yellow', 'orange', 'purple', 'white'];
    const shapes = ['rock', 'paper', 'scissors'];
    const deck = [];

    for (const color of colors) {
        for (const shape of shapes) {
            deck.push({ color, shape, id: `${color}-${shape}-${Date.now()}-${Math.random()}` });
        }
    }

    return shuffle(deck);
}

// 배열 섞기
export function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// 게임 상태
export const gameState = {
    round: 1,
    deck: [],
    hand: [],
    discardPile: [], // 버려진 카드들 (복구용)
    passives: [],
    currentGimmick: null,
    currentBoss: null, // 현재 보스 (10라운드마다)
    currentBossHealth: 0, // 현재 보스 체력
    maxBossHealth: 0, // 최대 보스 체력
    bossTurnCount: 0, // 보스전 턴 카운트
    deckSize: 15, // 덱 최대 크기 (핸드 드로우 기준)
    previousShapes: [], // Echo 기믹용

    // 전투 관련
    enemyCards: [],
    playerCards: [], // 플레이어가 선택한 카드 (필드에 배치)
    selectedHandIndices: [], // 핸드에서 선택된 카드 인덱스들

    // export드 결과
    lostCardsThisRound: 0,

    // 콤보 시스템
    consecutiveWins: 0,
    lastWinColors: [],

    // 게임 진행 상태
    phase: 'battle', // 'battle', 'acquire', 'event', 'gimmick'
    nextRoundModifier: null, // 분기 선택 효과

    reset() {
        this.round = 1;
        this.deck = createInitialDeck();
        this.hand = [];
        this.discardPile = [];
        this.passives = [];
        this.currentGimmick = null;
        this.currentBoss = null;
        this.currentBossHealth = 0;
        this.maxBossHealth = 0;
        this.bossTurnCount = 0;
        this.deckSize = 15;
        this.previousShapes = [];
        this.enemyCards = [];
        this.playerCards = [];
        this.selectedHandIndices = [];
        this.lostCardsThisRound = 0;
        this.consecutiveWins = 0;
        this.lastWinColors = [];
        this.phase = 'battle';
        this.nextRoundModifier = null;
    }
};

// 패시브 정의
export const PASSIVES = {
    // TIER 1
    bigHand: {
        id: 'bigHand',
        name: '큰 손',
        icon: '🖐️',
        desc: '핸드 크기가 1 증가합니다 (6장)',
        color: '#27ae60',
        tier: 1,
        handSizeBonus: 1
    },
    smallDeck: {
        id: 'smallDeck',
        name: '압축',
        icon: '📦',
        desc: '덱 크기가 1 감소합니다',
        color: '#e67e22',
        tier: 1,
        onApply: (state) => {
            state.deckSize -= 1;
        },
        onRemove: (state) => {
            state.deckSize += 1;
        }
    },
    whiteStabilize: {
        id: 'whiteStabilize',
        name: '백색 안정',
        icon: '⚪',
        desc: '흰색 카드는 소멸 시 덱으로 복귀합니다',
        color: '#ecf0f1',
        tier: 1
    },
    earlyBird: {
        id: 'earlyBird',
        name: '기선 제압',
        icon: '🐦',
        desc: '첫 번째 카드가 비길 경우 승리로 간주',
        color: '#f39c12',
        tier: 1
    },
    shield: {
        id: 'shield',
        name: '방패',
        icon: '🛡️',
        desc: '전투 패배 시 잃는 카드 수 -1 (최소 1)',
        color: '#7f8c8d',
        tier: 1
    },
    deckSizer: {
        id: 'deckSizer',
        name: '적정 기술',
        icon: '📐',
        desc: '덱 크기가 1 증가합니다',
        color: '#16a085',
        tier: 1,
        onApply: (state) => {
            state.deckSize += 1;
        },
        onRemove: (state) => {
            state.deckSize -= 1;
        }
    },
    // TIER 2
    redMatch: {
        id: 'redMatch',
        name: '붉은 심판',
        icon: '🔴',
        desc: '빨간색 카드는 같은 모양일 때 승리합니다',
        color: '#e74c3c',
        tier: 2
    },
    blueMatch: {
        id: 'blueMatch',
        name: '푸른 심판',
        icon: '🔵',
        desc: '파란색 카드는 같은 모양일 때 승리합니다',
        color: '#3498db',
        tier: 2
    },
    redRush: {
        id: 'redRush',
        name: '빨간 맛',
        icon: '🍎',
        desc: '필드에 빨간색 카드가 3장 이상이면 승점 +1',
        color: '#c0392b',
        tier: 2
    },
    flexibility: {
        id: 'flexibility',
        name: '유연함',
        icon: '🌊',
        desc: '보로 이기면 버려진 카드 1장 복구',
        color: '#2980b9',
        tier: 2
    },
    recycle: {
        id: 'recycle',
        name: '재활용',
        icon: '♻️',
        desc: '버려질 흰색 카드 1장은 덱으로 돌아갑니다',
        color: '#95a5a6',
        tier: 2
    },
    blueShield: {
        id: 'blueShield',
        name: '푸른 방벽',
        icon: '💙',
        desc: '필드에 파란색 2장 이상 시 패배 패널티 -1',
        color: '#3498db',
        tier: 2
    },
    greenGrowth: {
        id: 'greenGrowth',
        name: '초록 성장',
        icon: '🌱',
        desc: '초록색 카드로 승리 시 같은 모양 카드 1장 획득',
        color: '#27ae60',
        tier: 2
    },
    yellowFlash: {
        id: 'yellowFlash',
        name: '황금 빛',
        icon: '✨',
        desc: '노란색 카드는 같은 모양일 때 승리합니다',
        color: '#f1c40f',
        tier: 2
    },
    colorCollector: {
        id: 'colorCollector',
        name: '색채 수집가',
        icon: '🎨',
        desc: '필드에 3가지 색상 이상 배치 시 승점 +1',
        color: '#9b59b6',
        tier: 2
    },
    // TIER 3
    thirdReverse: {
        id: 'thirdReverse',
        name: '역전의 용사',
        icon: '🔄',
        desc: '세 번째 카드는 지는 모양일 때 승리합니다',
        color: '#9b59b6',
        tier: 3
    },
    joker: {
        id: 'joker',
        name: '조커',
        icon: '🃏',
        desc: '보라색 카드는 무조건 승리 (모양 무시)',
        color: '#8e44ad',
        tier: 3
    },
    monochrome: {
        id: 'monochrome',
        name: '단색화',
        icon: '⬛',
        desc: '덱에 색상이 2종류 이하라면 비기는 상황에서 승리',
        color: '#34495e',
        tier: 3
    },
    perfectCycle: {
        id: 'perfectCycle',
        name: '완벽한 순환',
        icon: '🔁',
        desc: '덱의 가위,바위,보 비율이 동일하면 핸드 +1',
        color: '#1abc9c',
        tier: 3,
        handSizeBonus: 0 // 조건부로 활성화됨
    },
    lastStand: {
        id: 'lastStand',
        name: '최후의 일격',
        icon: '⚡',
        desc: '마지막 슬롯의 카드가 바위라면 무조건 승리',
        color: '#e67e22',
        tier: 3
    },
    rainbowMaster: {
        id: 'rainbowMaster',
        name: '무지개 지배자',
        icon: '🌈',
        desc: '필드에 5색이 모두 모이면 라운드 즉시 승리',
        color: '#e74c3c',
        tier: 3
    }
};

// 기믹 정의
export const GIMMICKS = {
    // TIER 1
    twoCards: {
        id: 'twoCards',
        name: '가벼운 전투',
        desc: '적이 패를 2개만 냅니다',
        tier: 1,
        enemyCardCount: 2
    },
    greenOnly: {
        id: 'greenOnly',
        name: '초록 전염병',
        desc: '적이 초록색 패만 냅니다',
        tier: 1,
        enemyColor: 'green'
    },
    scissorsOnly: {
        id: 'scissorsOnly',
        name: '가위 바람',
        desc: '적이 가위만 냅니다',
        tier: 1,
        enemyShape: 'scissors'
    },
    fog: {
        id: 'fog',
        name: '안개',
        desc: '적의 가운데 패가 보이지 않습니다',
        tier: 1,
        hiddenIndex: 1 // 0-indexed
    },
    static: {
        id: 'static',
        name: '정전기',
        desc: '필드에 놓은 카드를 취소할 수 없습니다',
        tier: 1,
        cannotDeselect: true
    },
    haste: {
        id: 'haste',
        name: '신속',
        desc: '제출 전까지 적의 카드가 보이지 않습니다',
        tier: 1,
        hideAllEnemyCards: true
    },
    heavy: {
        id: 'heavy',
        name: '무거운 짐',
        desc: '핸드 드로우 시 1장을 덜 뽑습니다',
        tier: 1,
        drawPenalty: 1
    },
    // TIER 2
    fourCards: {
        id: 'fourCards',
        name: '4연타',
        desc: '적이 패를 4개 냅니다',
        tier: 2,
        enemyCardCount: 4
    },
    mimic: {
        id: 'mimic',
        name: '모방',
        desc: '적의 첫 번째 패가 당신의 선택을 따라합니다',
        tier: 2,
        mimicFirst: true
    },
    corrosion: {
        id: 'corrosion',
        name: '부식',
        desc: '이번 라운드, 바위는 가위에게 집니다',
        tier: 2,
        rockLosesToScissors: true
    },
    reversal: {
        id: 'reversal',
        name: '역전의 대가',
        desc: '핸드 카드는 덱으로, 필드 카드는 소멸합니다',
        tier: 2,
        reversedDiscard: true
    },
    purpleAcquire: {
        id: 'purpleAcquire',
        name: '보라색폭풍',
        desc: '카드 획득 시 보라색만 등장합니다',
        tier: 2,
        acquireColor: 'purple'
    },
    scissorsAcquire: {
        id: 'scissorsAcquire',
        name: '가위 세례',
        desc: '카드 획득 시 가위만 등장합니다',
        tier: 2,
        acquireShape: 'scissors'
    },
    gravity: {
        id: 'gravity',
        name: '중력',
        desc: '특정 색상의 카드를 이번 라운드에 낼 수 없습니다',
        tier: 2,
        bannedColor: null // 라운드 시작 시 무작위 배정
    },
    chaosAcquire: {
        id: 'chaosAcquire',
        name: '혼돈의 획득',
        desc: '카드 획득 시 선택지 없이 무작위 획득',
        tier: 2,
        randomAcquire: true
    },
    blindSide: {
        id: 'blindSide',
        name: '사각지대',
        desc: '홀수 번째 적의 카드가 보이지 않습니다',
        tier: 2,
        hideOddCards: true
    },
    // TIER 3
    overload: {
        id: 'overload',
        name: '폭주',
        desc: '적이 패를 5개 냅니다! (핸드 전부 사용)',
        tier: 3,
        enemyCardCount: 5
    },
    passiveNull: {
        id: 'passiveNull',
        name: '침묵',
        desc: '모든 패시브 효과가 이번 라운드에 발동하지 않습니다',
        tier: 3,
        disablePassives: true
    },
    colorCurse: {
        id: 'colorCurse',
        name: '색상 저주',
        desc: '특정 색상 카드로 패배 시 해당 카드 영구 삭제',
        tier: 3,
        cursedColor: null // 라운드 시작 시 무작위 배정
    },
    echo: {
        id: 'echo',
        name: '메아리',
        desc: '적이 플레이어의 지난 라운드 모양을 그대로 냅니다',
        tier: 3,
        usePreviousShapes: true
    },
    dimensionShift: {
        id: 'dimensionShift',
        name: '차원 전이',
        desc: '상성 관계가 반대로 바뀝니다 (보 > 가위 > 바위 > 보)',
        tier: 3,
        reverseRPS: true
    }
};

// 무작위 패시브 2개 선택 (중복 제외)
export function getRandomPassives(count = 2, exclude = []) {
    const available = Object.values(PASSIVES).filter(p => !exclude.includes(p.id));
    return shuffle(available).slice(0, count);
}

// 무작위 기믹 1개 선택
export function getRandomGimmick() {
    const gimmicks = Object.values(GIMMICKS);
    return gimmicks[Math.floor(Math.random() * gimmicks.length)];
}

// 보스 정의
export const BOSSES = {
    guardian: {
        id: 'guardian',
        name: '수호자',
        desc: '6장의 카드로 당신을 압박합니다. 5턴 이내에 제압하지 못하면 패배합니다.',
        cardCount: 6,
        hp: 15,
        maxTurns: 5, // 5턴 이내에 제압해야 함
        bgColor: '#1a0a0a',
        reward: 'rare_passive'
    },
    chaos: {
        id: 'chaos',
        name: '혼돈의 군주',
        desc: '채력이 떨어질수록 취급하는 카드가 늘어납니다.',
        baseCardCount: 5, // 기본 카드 수
        hp: 20,
        dynamicCards: true, // 체력에 비례하여 카드 수 증가
        bgColor: '#0a0a1a',
        reward: 'deck_purge'
    },
    mirror: {
        id: 'mirror',
        name: '거울의 마녀',
        desc: '당신의 모양을 그대로 따라합니다.',
        cardCount: 5,
        hp: 12,
        mimicAll: true,
        bgColor: '#0a1a0a',
        reward: 'rare_passive'
    }
};


// 무작위 보스 1개 선택
export function getRandomBoss() {
    const bosses = Object.values(BOSSES);
    return bosses[Math.floor(Math.random() * bosses.length)];
}
