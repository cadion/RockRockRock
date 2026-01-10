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
    deckSize: 15, // 덱 최대 크기 (핸드 드로우 기준)

    // 전투 관련
    enemyCards: [],
    playerCards: [], // 플레이어가 선택한 카드 (필드에 배치)
    selectedHandIndices: [], // 핸드에서 선택된 카드 인덱스들

    // 라운드 결과
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
        this.deckSize = 15;
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
    redMatch: {
        id: 'redMatch',
        name: '붉은 심판',
        icon: '🔴',
        desc: '빨간색 카드는 같은 모양일 때 승리합니다',
        color: '#e74c3c'
    },
    blueMatch: {
        id: 'blueMatch',
        name: '푸른 심판',
        icon: '🔵',
        desc: '파란색 카드는 같은 모양일 때 승리합니다',
        color: '#3498db'
    },
    thirdReverse: {
        id: 'thirdReverse',
        name: '역전의 용사',
        icon: '🔄',
        desc: '세 번째 카드는 지는 모양일 때 승리합니다',
        color: '#9b59b6'
    },
    redRush: {
        id: 'redRush',
        name: '빨간 맛',
        icon: '🍎',
        desc: '필드에 빨간색 카드가 3장 이상이면 승점 +1',
        color: '#c0392b'
    },
    flexibility: {
        id: 'flexibility',
        name: '유연함',
        icon: '🌊',
        desc: '보로 이기면 버려진 카드 1장 복구',
        color: '#2980b9'
    },
    recycle: {
        id: 'recycle',
        name: '재활용',
        icon: '♻️',
        desc: '버려질 흰색 카드 1장은 덱으로 돌아갑니다',
        color: '#95a5a6'
    },
    joker: {
        id: 'joker',
        name: '조커',
        icon: '🃏',
        desc: '보라색 카드는 무조건 승리 (모양 무시)',
        color: '#8e44ad'
    },
    bigHand: {
        id: 'bigHand',
        name: '큰 손',
        icon: '🖐️',
        desc: '핸드 크기가 1 증가합니다 (6장)',
        color: '#27ae60',
        handSizeBonus: 1
    },
    smallDeck: {
        id: 'smallDeck',
        name: '압축',
        icon: '📦',
        desc: '덱 크기가 1 감소합니다',
        color: '#e67e22',
        onApply: (state) => {
            state.deckSize -= 1;
        },
        onRemove: (state) => {
            state.deckSize += 1;
        }
    }
};

// 기믹 정의
export const GIMMICKS = {
    fourCards: {
        id: 'fourCards',
        name: '4연타',
        desc: '적이 패를 4개 냅니다',
        enemyCardCount: 4
    },
    twoCards: {
        id: 'twoCards',
        name: '가벼운 전투',
        desc: '적이 패를 2개만 냅니다',
        enemyCardCount: 2
    },
    greenOnly: {
        id: 'greenOnly',
        name: '초록 전염병',
        desc: '적이 초록색 패만 냅니다',
        enemyColor: 'green'
    },
    scissorsOnly: {
        id: 'scissorsOnly',
        name: '가위 바람',
        desc: '적이 가위만 냅니다',
        enemyShape: 'scissors'
    },
    fog: {
        id: 'fog',
        name: '안개',
        desc: '적의 가운데 패가 보이지 않습니다',
        hiddenIndex: 1 // 0-indexed
    },
    mimic: {
        id: 'mimic',
        name: '모방',
        desc: '적의 첫 번째 패가 당신의 선택을 따라합니다',
        mimicFirst: true
    },
    corrosion: {
        id: 'corrosion',
        name: '부식',
        desc: '이번 라운드, 바위는 가위에게 집니다',
        rockLosesToScissors: true
    },
    overload: {
        id: 'overload',
        name: '폭주',
        desc: '적이 패를 5개 냅니다! (핸드 전부 사용)',
        enemyCardCount: 5
    },
    reversal: {
        id: 'reversal',
        name: '역전의 대가',
        desc: '핸드 카드는 덱으로, 필드 카드는 소멸합니다',
        reversedDiscard: true
    },
    purpleAcquire: {
        id: 'purpleAcquire',
        name: '보라색 폭풍',
        desc: '카드 획득 시 보라색만 등장합니다',
        acquireColor: 'purple'
    },
    scissorsAcquire: {
        id: 'scissorsAcquire',
        name: '가위 세례',
        desc: '카드 획득 시 가위만 등장합니다',
        acquireShape: 'scissors'
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
        desc: '6장의 카드로 당신을 압박합니다',
        cardCount: 6,
        bgColor: '#1a0a0a',
        reward: 'rare_passive'
    },
    chaos: {
        id: 'chaos',
        name: '혼돈의 군주',
        desc: '7장의 카드와 예측 불가능한 패턴',
        cardCount: 7,
        bgColor: '#0a0a1a',
        reward: 'deck_purge'
    },
    mirror: {
        id: 'mirror',
        name: '거울의 마녀',
        desc: '당신의 모양을 그대로 따라합니다',
        cardCount: 5,
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
