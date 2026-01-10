/**
 * Enemy AI
 * Generates enemy cards based on gimmicks
 */

/**
 * Generate enemy cards for battle
 * Takes into account current gimmick if any
 */
function generateEnemyCards(gimmick = null) {
    if (gimmick) {
        return gimmick.generateEnemyCards();
    }

    // Default: 3 random cards
    const cards = [];
    for (let i = 0; i < 3; i++) {
        cards.push(createRandomCard());
    }
    return cards;
}
