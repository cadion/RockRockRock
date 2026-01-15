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
    if (boss) {
        if (boss.dynamicCards) {
            // Chaos 보스: 체력이 떨어질수록 카드 수 증가
            const hpRatio = gameState.currentBossHealth / gameState.maxBossHealth;
            if (hpRatio <= 0.5) {
                count = boss.baseCardCount + 2; // 50% 이하: +2
            } else if (hpRatio <= 0.75) {
                count = boss.baseCardCount + 1; // 75% 이하: +1
            } else {
                count = boss.baseCardCount; // 기본
            }
        } else if (boss.cardCount) {
            count = boss.cardCount;
        } else if (boss.baseCardCount) {
            count = boss.baseCardCount;
        }
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

    // Echo 기믹: 지난 라운드 모양 사용
    if (gimmick && gimmick.usePreviousShapes && gameState.previousShapes.length > 0) {
        for (let i = 0; i < Math.min(count, gameState.previousShapes.length); i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            cards.push({
                color,
                shape: gameState.previousShapes[i],
                id: `enemy-${i}-${Date.now()}`,
                hidden: false
            });
        }
        // 부족하면 무작위로 채움
        while (cards.length < count) {
            const shape = shapes[Math.floor(Math.random() * shapes.length)];
            const color = colors[Math.floor(Math.random() * colors.length)];
            cards.push({
                color,
                shape,
                id: `enemy-${cards.length}-${Date.now()}`,
                hidden: false
            });
        }
        return cards;
    }

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

        // 기믹: 안개/신속/사각지대 (카드 숨김)
        let hidden = false;
        if (gimmick && gimmick.hiddenIndex === i) {
            hidden = true; // fog
        }
        if (gimmick && gimmick.hideAllEnemyCards) {
            hidden = true; // haste
        }
        if (gimmick && gimmick.hideOddCards && i % 2 === 0) {
            hidden = true; // blindSide (0, 2, 4... = 1번째, 3번째, 5번째)
        }

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

    const gimmick = gameState.currentGimmick;
    const passives = gameState.passives;

    // 덱 크기 = gameState.deckSize (라이프사이클 훅으로 관리됨)
    const currentDeckSize = gameState.deckSize;

    // 핸드 크기 보너스
    let handBonus = passives.reduce((sum, p) => sum + (p.handSizeBonus || 0), 0);

    // perfectCycle 패시브: 덱의 가위,바위,보 비율이 동일하면 핸드 +1
    if (passives.some(p => p.id === 'perfectCycle')) {
        const rockCount = deck.filter(c => c.shape === 'rock').length;
        const paperCount = deck.filter(c => c.shape === 'paper').length;
        const scissorsCount = deck.filter(c => c.shape === 'scissors').length;
        if (rockCount === paperCount && paperCount === scissorsCount && rockCount > 0) {
            handBonus += 1;
        }
    }

    // 현재 덱에 있는 카드 수
    const currentCardCount = deck.length;

    // 기믹: heavy - 드로우 패널티
    let drawPenalty = 0;
    if (gimmick && gimmick.drawPenalty) {
        drawPenalty = gimmick.drawPenalty;
    }

    // 뽑아야 할 카드 수 = 덱 크기까지 채우기 (최소 5 + 보너스 - 패널티)
    const baseHandSize = Math.max(1, 5 + handBonus - drawPenalty);
    const drawCount = Math.min(
        Math.max(baseHandSize, currentDeckSize - (currentCardCount - baseHandSize)),
        currentCardCount,
        baseHandSize
    );

    const hand = deck.splice(0, drawCount);
    return hand;
}

// 가위바위보 기본 승패 판정 (1: 승, -1: 패, 0: 무)
function basicRPS(playerShape, enemyShape, gimmick = null) {
    // dimensionShift 기믹: 상성 역전
    if (gimmick && gimmick.reverseRPS) {
        if (playerShape === enemyShape) return 0;
        // 보 > 가위 > 바위 > 보
        if (
            (playerShape === 'paper' && enemyShape === 'scissors') ||
            (playerShape === 'scissors' && enemyShape === 'rock') ||
            (playerShape === 'rock' && enemyShape === 'paper')
        ) {
            return 1;
        }
        return -1;
    }

    // 기본 상성
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

    // passiveNull 기믹: 모든 패시브 무효화
    const passivesDisabled = gimmick && gimmick.disablePassives;

    // 1. lastStand 패시브 (마지막 슬롯이 바위라면 무조건 승리)
    if (!passivesDisabled && passives.some(p => p.id === 'lastStand') && index === totalCount - 1 && playerCard.shape === 'rock') {
        return { result: 1, reason: '최후의 일격!', passiveTriggered: 'lastStand' };
    }

    // 2. 조커 패시브 (보라색 무조건 승)
    if (!passivesDisabled && passives.some(p => p.id === 'joker') && playerCard.color === 'purple') {
        return { result: 1, reason: '조커 발동!', passiveTriggered: 'joker' };
    }

    // 3. 기믹: 부식 (바위가 가위에게 짐)
    if (gimmick && gimmick.rockLosesToScissors) {
        if (playerCard.shape === 'rock' && enemyCard.shape === 'scissors') {
            return { result: -1, reason: '부식! 바위가 무력화됨', gimmickTriggered: 'corrosion' };
        }
    }

    // 4. 빨간색/파란색/노란색 패시브 (같은 모양 = 승)
    if (playerCard.shape === enemyCard.shape) {
        if (!passivesDisabled && passives.some(p => p.id === 'redMatch') && playerCard.color === 'orange') {
            return { result: 1, reason: '붉은 심판!', passiveTriggered: 'redMatch' };
        }
        if (!passivesDisabled && passives.some(p => p.id === 'blueMatch') && playerCard.color === 'blue') {
            return { result: 1, reason: '푸른 심판!', passiveTriggered: 'blueMatch' };
        }
        if (!passivesDisabled && passives.some(p => p.id === 'yellowFlash') && playerCard.color === 'yellow') {
            return { result: 1, reason: '황금 빛!', passiveTriggered: 'yellowFlash' };
        }
    }

    // 5. 세 번째 카드 역전 (지는 모양 = 승)
    if (!passivesDisabled && passives.some(p => p.id === 'thirdReverse') && index === 2) {
        const basic = basicRPS(playerCard.shape, enemyCard.shape, gimmick);
        if (basic === -1) {
            return { result: 1, reason: '역전!', passiveTriggered: 'thirdReverse' };
        }
    }

    // 6. earlyBird 패시브 (첫 번째 카드가 비길 경우 승리)
    if (!passivesDisabled && passives.some(p => p.id === 'earlyBird') && index === 0) {
        const basic = basicRPS(playerCard.shape, enemyCard.shape, gimmick);
        if (basic === 0) {
            return { result: 1, reason: '기선 제압!', passiveTriggered: 'earlyBird' };
        }
    }

    // 7. monochrome 패시브 (덱에 색상이 2종류 이하라면 비기는 상황에서 승리)
    if (!passivesDisabled && passives.some(p => p.id === 'monochrome')) {
        const deckColors = new Set(gameState.deck.map(c => c.color));
        if (deckColors.size <= 2) {
            const basic = basicRPS(playerCard.shape, enemyCard.shape, gimmick);
            if (basic === 0) {
                return { result: 1, reason: '단색화!', passiveTriggered: 'monochrome' };
            }
        }
    }

    // 8. 기본 가위바위보
    const result = basicRPS(playerCard.shape, enemyCard.shape, gimmick);
    return { result, reason: null };
}

// 전체 전투 판정
export function resolveBattle() {
    const playerCards = gameState.playerCards;
    const enemyCards = gameState.enemyCards;
    const gimmick = gameState.currentGimmick;
    const passives = gameState.passives;
    const passivesDisabled = gimmick && gimmick.disablePassives;

    // 기믹: 모방 (첫 번째 적 카드가 플레이어 첫 카드 모양 복사)
    if (gimmick && gimmick.mimicFirst && playerCards.length > 0) {
        enemyCards[0] = {
            ...enemyCards[0],
            shape: playerCards[0].shape,
            mimicked: true
        };
    }

    // rainbowMaster 패시브: 필드에 5색이 모두 모이면 라운드 즉시 승리
    if (!passivesDisabled && passives.some(p => p.id === 'rainbowMaster')) {
        const fieldColors = new Set(playerCards.filter(c => c !== null).map(c => c.color));
        if (fieldColors.size >= 5) {
            return {
                results: playerCards.map(() => ({ result: 1, reason: '무지개 지배자!', passiveTriggered: 'rainbowMaster' })),
                wins: enemyCards.length,
                losses: 0,
                draws: 0,
                bonusWins: 0,
                totalWins: enemyCards.length,
                isVictory: true,
                triggeredPassives: ['rainbowMaster']
            };
        }
    }

    let wins = 0;
    let losses = 0;
    let draws = 0;
    const results = [];

    // 플레이어의 이번 라운드 모양 저장 (Echo 기믹용)
    gameState.previousShapes = playerCards.filter(c => c !== null).map(c => c.shape);

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
    let bonusWins = 0;
    if (!passivesDisabled && passives.some(p => p.id === 'redRush')) {
        const orangeCount = playerCards.filter(c => c && c.color === 'orange').length;
        if (orangeCount >= 3) {
            bonusWins = 1;
        }
    }

    // colorCollector 패시브 (필드에 3가지 색상 이상 배치 시 승점 +1)
    if (!passivesDisabled && passives.some(p => p.id === 'colorCollector')) {
        const fieldColors = new Set(playerCards.filter(c => c !== null).map(c => c.color));
        if (fieldColors.size >= 3) {
            bonusWins += 1;
        }
    }

    // 발동된 패시브 추적
    const triggeredPassives = [];
    results.forEach((r, i) => {
        if (r.passiveTriggered && !triggeredPassives.includes(r.passiveTriggered)) {
            triggeredPassives.push(r.passiveTriggered);
        }
    });

    if (bonusWins > 0) {
        if (!passivesDisabled && passives.some(p => p.id === 'redRush')) {
            triggeredPassives.push('redRush');
        }
        if (!passivesDisabled && passives.some(p => p.id === 'colorCollector')) {
            triggeredPassives.push('colorCollector');
        }
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
        let fieldCardsToDiscard = [...gameState.playerCards.filter(c => c !== null)];

        // 재활용 패시브: 흰색 필드 카드 1장 복구
        if (passives.some(p => p.id === 'recycle')) {
            const whiteIndex = fieldCardsToDiscard.findIndex(c => c.color === 'white');
            if (whiteIndex !== -1) {
                const whiteCard = fieldCardsToDiscard.splice(whiteIndex, 1)[0];
                gameState.deck.push(whiteCard);
            }
        }

        // whiteStabilize 패시브: 흰색 필드 카드는 모두 덱으로 복귀
        if (passives.some(p => p.id === 'whiteStabilize')) {
            const whiteCards = fieldCardsToDiscard.filter(c => c.color === 'white');
            whiteCards.forEach(card => {
                const idx = fieldCardsToDiscard.indexOf(card);
                if (idx !== -1) {
                    fieldCardsToDiscard.splice(idx, 1);
                    gameState.deck.push(card);
                }
            });
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

        // whiteStabilize 패시브: 흰색 핸드 카드는 모두 덱으로 복귀
        if (passives.some(p => p.id === 'whiteStabilize')) {
            const whiteCards = handCardsToDiscard.filter(c => c.color === 'white');
            whiteCards.forEach(card => {
                const idx = handCardsToDiscard.indexOf(card);
                if (idx !== -1) {
                    handCardsToDiscard.splice(idx, 1);
                    gameState.deck.push(card);
                }
            });
        }

        // 핸드 카드는 소멸
        gameState.discardPile.push(...handCardsToDiscard);
        discardedCount = handCardsToDiscard.length;

        // 필드 카드는 덱으로
        gameState.deck.push(...gameState.playerCards.filter(c => c !== null));
    }

    // shield 패시브: 패배 시 잃는 카드 수 -1 (최소 1)
    if (!battleResult.isVictory && passives.some(p => p.id === 'shield')) {
        discardedCount = Math.max(1, discardedCount - 1);
    }

    // blueShield 패시브: 필드에 파란색 2장 이상 시 패배 패널티 -1
    if (!battleResult.isVictory && passives.some(p => p.id === 'blueShield')) {
        const blueCount = gameState.playerCards.filter(c => c && c.color === 'blue').length;
        if (blueCount >= 2) {
            discardedCount = Math.max(1, discardedCount - 1);
        }
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

    // greenGrowth 패시브: 초록색 카드로 승리 시 같은 모양 카드 1장 획득
    if (passives.some(p => p.id === 'greenGrowth')) {
        for (let i = 0; i < battleResult.results.length; i++) {
            if (battleResult.results[i].result === 1 && gameState.playerCards[i]?.color === 'green') {
                const shape = gameState.playerCards[i].shape;
                const newCard = {
                    color: 'green',
                    shape,
                    id: `grow-${Date.now()}-${Math.random()}`
                };
                gameState.deck.push(newCard);
                break;
            }
        }
    }

    // colorCurse 기믹: 특정 색상 카드로 패배 시 해당 카드 영구 삭제
    if (!battleResult.isVictory && gimmick && gimmick.colorCurse) {
        const cursedColor = gimmick.cursedColor;
        if (cursedColor) {
            // 패배한 카드 중 cursedColor 카드 찾아서 영구 삭제
            for (let i = 0; i < battleResult.results.length; i++) {
                if (battleResult.results[i].result === -1 && gameState.playerCards[i]?.color === cursedColor) {
                    // 덱에서 해당 카드 제거
                    const cardToRemove = gameState.playerCards[i];
                    const deckIndex = gameState.deck.findIndex(c => c.id === cardToRemove.id);
                    if (deckIndex !== -1) {
                        gameState.deck.splice(deckIndex, 1);
                    }
                }
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

        cards.push({
            color,
            shape,
            id: `acq-${i}-${Date.now()}-${Math.random()}`
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
