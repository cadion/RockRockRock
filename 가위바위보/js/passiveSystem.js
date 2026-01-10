/**
 * Passive System
 * Defines passive abilities and their effects
 */

// Passive types
const PASSIVE_TYPES = {
    ORANGE_SAME_WINS: 'orange_same_wins',  // 주황 카드는 동일 모양일때 이긴다
    BLUE_SAME_WINS: 'blue_same_wins',      // 파란 카드는 동일 모양일때 이긴다
    THIRD_REVERSE: 'third_reverse'         // 세번째 카드는 지는 모양일때 이긴다
};

/**
 * Passive definition class
 */
class Passive {
    constructor(type, name, description, icon) {
        this.id = `passive-${type}-${Date.now()}-${Math.random()}`;
        this.type = type;
        this.name = name;
        this.description = description;
        this.icon = icon;
    }

    /**
     * Apply passive effect to card comparison
     * Returns: 1 (force win), -1 (force lose), 0 (no effect), null (continue normal comparison)
     */
    applyEffect(playerCard, enemyCard, cardIndex, playerField) {
        switch (this.type) {
            case PASSIVE_TYPES.ORANGE_SAME_WINS:
                // Orange cards win when same shape
                if (playerCard.color === COLORS.ORANGE && playerCard.shape === enemyCard.shape) {
                    return 1;
                }
                return null;

            case PASSIVE_TYPES.BLUE_SAME_WINS:
                // Blue cards win when same shape
                if (playerCard.color === COLORS.BLUE && playerCard.shape === enemyCard.shape) {
                    return 1;
                }
                return null;

            case PASSIVE_TYPES.THIRD_REVERSE:
                // Third card (index 2) wins when it would normally lose
                if (cardIndex === 2) {
                    const normalResult = compareShapes(playerCard.shape, enemyCard.shape);
                    if (normalResult === -1) {
                        return 1; // Reverse the loss to a win
                    }
                }
                return null;

            default:
                return null;
        }
    }
}

/**
 * Get all available passives pool
 */
function getAllPassives() {
    return [
        new Passive(
            PASSIVE_TYPES.ORANGE_SAME_WINS,
            '주황 동형 승리',
            '주황 카드는 상대방과 동일한 모양일때 이긴다',
            '🟠'
        ),
        new Passive(
            PASSIVE_TYPES.BLUE_SAME_WINS,
            '파랑 동형 승리',
            '파란 카드는 상대방과 동일한 모양일때 이긴다',
            '🔵'
        ),
        new Passive(
            PASSIVE_TYPES.THIRD_REVERSE,
            '3번 역전',
            '세번째 카드는 상대방에게 지는 모양일 때 이긴다',
            '🔄'
        )
    ];
}

/**
 * Get random passives for selection
 */
function getRandomPassives(count = 2) {
    const allPassives = getAllPassives();
    const shuffled = shuffleArray(allPassives);
    return shuffled.slice(0, count);
}

/**
 * Apply all passive effects to a card comparison
 * Returns the result after applying passives, or null if no passive applies
 */
function applyPassiveEffects(playerCard, enemyCard, cardIndex, playerField, passives) {
    for (const passive of passives) {
        const result = passive.applyEffect(playerCard, enemyCard, cardIndex, playerField);
        if (result !== null) {
            return result;
        }
    }
    return null;
}
