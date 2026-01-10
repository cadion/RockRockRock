// ===== 게임 로직 =====
import { gameState, PASSIVES, shuffle } from './state.js';

// 모양 아이콘
export const SHAPE_ICONS = {
    rock: '✊',
    paper: '✋',
    scissors: '✌️'
};

// 적 카드 생성
export function generateEnemyCards() {
    const gimmick = gameState.currentGimmick;
    const boss = gameState.currentBoss;
    const modifier = gameState.nextRoundModifier;
    let count = 3;

    // 보스에 따른 카드 수 변경
    if (boss && boss.cardCount) {
        count = boss.cardCount;
    }
    // 기믹에 따른 카드 수 변경
    else if (gimmick && gimmick.enemyCardCount) {
        count = gimmick.enemyCardCount;
    }

    // 분기 선택 보너스 적용
    if (modifier && modifier.enemyCardBonus) {
        count = Math.max(2, count + modifier.enemyCardBonus);
    }

    // 모디파이어 소모
    gameState.nextRoundModifier = null;

    const shapes = ['rock', 'paper', 'scissors'];
    const colors = ['blue', 'yellow', 'orange', 'purple', 'white', 'green'];
    const cards = [];

    for (let i = 0; i < count; i++) {
        let shape = shapes[Math.floor(Math.random() * shapes.length)];
        let color = colors[Math.floor(Math.random() * colors.length)];

        // 기믹: 특정 모양만
        if (gimmick && gimmick.enemyShape) {
            shape = gimmick.enemyShape;
        }

        // 기믹: 특정 색상만
        if (gimmick && gimmick.enemyColor) {
            color = gimmick.enemyColor;
        }

        // 기믹: 안개 (가운데 카드 숨김)
        const hidden = gimmick && gimmick.hiddenIndex === i;

        cards.push({
            color,
            shape,
            id: `enemy-${i}-${Date.now()}`,
            hidden
        });
    }

    return cards;
}

// 핸드 드로우
export function drawHand() {
    const deck = gameState.deck;
    if (deck.length === 0) return [];

    // 덱 크기 = gameState.deckSize (라이프사이클 훅으로 관리됨)
    const currentDeckSize = gameState.deckSize;

    // 핸드 크기 보너스
    const handBonus = gameState.passives.reduce((sum, p) => sum + (p.handSizeBonus || 0), 0);

    // 현재 덱에 있는 카드 수
    const currentCardCount = deck.length;

    // 뽑아야 할 카드 수 = 덱 크기까지 채우기 (최소 5 + 보너스)
    const baseHandSize = 5 + handBonus;
    const drawCount = Math.min(
        Math.max(baseHandSize, currentDeckSize - (currentCardCount - baseHandSize)),
        currentCardCount,
        baseHandSize
    );

    const hand = deck.splice(0, drawCount);
    return hand;
}

// 가위바위보 기본 승패 판정 (1: 승, -1: 패, 0: 무)
function basicRPS(playerShape, enemyShape) {
    if (playerShape === enemyShape) return 0;

    if (
        (playerShape === 'rock' && enemyShape === 'scissors') ||
        (playerShape === 'paper' && enemyShape === 'rock') ||
        (playerShape === 'scissors' && enemyShape === 'paper')
    ) {
        return 1;
    }

    return -1;
}

// 단일 패 승패 판정 (패시브, 기믹 포함)
export function judgeCard(playerCard, enemyCard, index, totalCount) {
    const passives = gameState.passives;
    const gimmick = gameState.currentGimmick;

    // 1. 조커 패시브 (보라색 무조건 승)
    if (passives.some(p => p.id === 'joker') && playerCard.color === 'purple') {
        return { result: 1, reason: '조커 발동!', passiveTriggered: 'joker' };
    }

    // 2. 기믹: 부식 (바위가 가위에게 짐)
    if (gimmick && gimmick.rockLosesToScissors) {
        if (playerCard.shape === 'rock' && enemyCard.shape === 'scissors') {
            return { result: -1, reason: '부식! 바위가 무력화됨', gimmickTriggered: 'corrosion' };
        }
    }

    // 3. 빨간색/파란색 패시브 (같은 모양 = 승)
    if (playerCard.shape === enemyCard.shape) {
        if (passives.some(p => p.id === 'redMatch') && playerCard.color === 'orange') {
            return { result: 1, reason: '붉은 심판!', passiveTriggered: 'redMatch' };
        }
        if (passives.some(p => p.id === 'blueMatch') && playerCard.color === 'blue') {
            return { result: 1, reason: '푸른 심판!', passiveTriggered: 'blueMatch' };
        }
    }

    // 4. 세 번째 카드 역전 (지는 모양 = 승)
    if (passives.some(p => p.id === 'thirdReverse') && index === 2) {
        const basic = basicRPS(playerCard.shape, enemyCard.shape);
        if (basic === -1) {
            return { result: 1, reason: '역전!', passiveTriggered: 'thirdReverse' };
        }
    }

    // 5. 기본 가위바위보
    const result = basicRPS(playerCard.shape, enemyCard.shape);
    return { result, reason: null };
}

// 전체 전투 판정
export function resolveBattle() {
    const playerCards = gameState.playerCards;
    const enemyCards = gameState.enemyCards;
    const gimmick = gameState.currentGimmick;

    // 기믹: 모방 (첫 번째 적 카드가 플레이어 첫 카드 모양 복사)
    if (gimmick && gimmick.mimicFirst && playerCards.length > 0) {
        enemyCards[0] = {
            ...enemyCards[0],
            shape: playerCards[0].shape,
            mimicked: true
        };
    }

    let wins = 0;
    let losses = 0;
    let draws = 0;
    const results = [];

    for (let i = 0; i < enemyCards.length; i++) {
        const pCard = playerCards[i];
        const eCard = enemyCards[i];

        if (!pCard) {
            // 플레이어 카드 없으면 자동 패배
            results.push({ result: -1, reason: '카드 없음' });
            losses++;
            continue;
        }

        const judgment = judgeCard(pCard, eCard, i, enemyCards.length);
        results.push(judgment);

        if (judgment.result === 1) wins++;
        else if (judgment.result === -1) losses++;
        else draws++;
    }

    // 빨간 맛 패시브 (빨간색 3장 이상이면 +1 승점)
    // orange를 빨간으로 취급
    const passives = gameState.passives;
    let bonusWins = 0;
    if (passives.some(p => p.id === 'redRush')) {
        const orangeCount = playerCards.filter(c => c.color === 'orange').length;
        if (orangeCount >= 3) {
            bonusWins = 1;
        }
    }

    // 발동된 패시브 추적
    const triggeredPassives = [];

    // 결과에서 패시브 발동 확인
    results.forEach((r, i) => {
        if (r.passiveTriggered && !triggeredPassives.includes(r.passiveTriggered)) {
            triggeredPassives.push(r.passiveTriggered);
        }
    });

    if (bonusWins > 0) {
        triggeredPassives.push('redRush');
    }

    const totalWins = wins + bonusWins;
    const isVictory = totalWins > losses;

    return {
        results,
        wins,
        losses,
        draws,
        bonusWins,
        totalWins,
        isVictory,
        triggeredPassives
    };
}

// 라운드 종료 후 카드 처리
export function processEndOfRound(battleResult) {
    const passives = gameState.passives;
    const gimmick = gameState.currentGimmick;
    const isReversed = gimmick && gimmick.reversedDiscard;

    // 1. 핸드에 남은 카드 = 선택되지 않은 카드들
    const remainingHand = gameState.hand.filter((card, index) =>
        !gameState.selectedHandIndices.includes(index)
    );

    let discardedCount = 0;

    if (isReversed) {
        // 역전의 대가: 핸드 카드는 덱으로, 필드 카드는 소멸
        // 재활용 패시브: 흰색 필드 카드 1장 복구
        let fieldCardsToDiscard = [...gameState.playerCards.filter(c => c !== null)];

        if (passives.some(p => p.id === 'recycle')) {
            const whiteIndex = fieldCardsToDiscard.findIndex(c => c.color === 'white');
            if (whiteIndex !== -1) {
                const whiteCard = fieldCardsToDiscard.splice(whiteIndex, 1)[0];
                gameState.deck.push(whiteCard);
            }
        }

        // 핸드 카드는 덱으로
        gameState.deck.push(...remainingHand);

        // 필드 카드는 소멸 (discard pile로)
        gameState.discardPile.push(...fieldCardsToDiscard);
        discardedCount = fieldCardsToDiscard.length;

    } else {
        // 기본 동작: 핸드 카드 소멸, 필드 카드 복귀
        let handCardsToDiscard = [...remainingHand];

        // 재활용 패시브: 흰색 핸드 카드 1장 복구
        if (passives.some(p => p.id === 'recycle')) {
            const whiteIndex = handCardsToDiscard.findIndex(c => c.color === 'white');
            if (whiteIndex !== -1) {
                const whiteCard = handCardsToDiscard.splice(whiteIndex, 1)[0];
                gameState.deck.push(whiteCard);
            }
        }

        // 핸드 카드는 소멸
        gameState.discardPile.push(...handCardsToDiscard);
        discardedCount = handCardsToDiscard.length;

        // 필드 카드는 덱으로
        gameState.deck.push(...gameState.playerCards.filter(c => c !== null));
    }

    gameState.deck = shuffle(gameState.deck);
    gameState.hand = [];

    // 유연함 패시브: 보로 이기면 discardPile에서 1장 복구
    if (passives.some(p => p.id === 'flexibility')) {
        for (let i = 0; i < battleResult.results.length; i++) {
            if (battleResult.results[i].result === 1 && gameState.playerCards[i]?.shape === 'paper') {
                if (gameState.discardPile.length > 0) {
                    const recovered = gameState.discardPile.pop();
                    gameState.deck.push(recovered);
                }
                break;
            }
        }
    }

    gameState.lostCardsThisRound = discardedCount;
    gameState.playerCards = [];
    gameState.selectedHandIndices = [];

    return discardedCount;
}

// 카드 획득용 무작위 카드 생성
export function generateAcquisitionCards(count) {
    const gimmick = gameState.currentGimmick;

    // 기믹에 따른 색상/모양 제한
    let colors = ['blue', 'yellow', 'orange', 'purple', 'white'];
    let shapes = ['rock', 'paper', 'scissors'];

    if (gimmick?.acquireColor) {
        colors = [gimmick.acquireColor];
    }
    if (gimmick?.acquireShape) {
        shapes = [gimmick.acquireShape];
    }

    const cards = [];

    for (let i = 0; i < count; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];

        // 특수 카드 확률 (10% 골드, 5% 저주)
        let special = null;
        const rand = Math.random();
        if (rand < 0.05) {
            special = 'cursed';
        } else if (rand < 0.15) {
            special = 'gold';
        }

        cards.push({
            color,
            shape,
            id: `acq-${i}-${Date.now()}-${Math.random()}`,
            special
        });
    }

    return cards;
}

// 덱 상태 체크 (게임 오버 조건)
export function checkDeckHealth() {
    const deckSize = gameState.deck.length;
    if (deckSize < 5) {
        return { canContinue: false, reason: `덱에 카드가 ${deckSize}장밖에 남지 않았습니다!` };
    }
    return { canContinue: true };
}
