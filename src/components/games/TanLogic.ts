import { Card, Suit, Rank } from './TienLenLogic';

export type { Card, Suit, Rank };

export function createDeck(): Card[] {
    const suits: Suit[] = ['spades', 'clubs', 'diamonds', 'hearts'];
    const deck: Card[] = [];
    
    for (const suit of suits) {
        // In Tan, Ace is high, but maybe we can use standard ranks.
        // Let's use value: 2=2, 3=3 ... 10=10, J=11, Q=12, K=13, A=14.
        for (let rank = 2; rank <= 14; rank++) {
            let label = rank.toString();
            if (rank === 11) label = 'J';
            if (rank === 12) label = 'Q';
            if (rank === 13) label = 'K';
            if (rank === 14) label = 'A';
            
            deck.push({
                id: `${rank}_${suit}`,
                suit,
                rank: rank as Rank,
                value: rank,
                label
            });
        }
    }
    return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
    const newDeck = [...deck];
    for (let i = newDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
}

export interface TanTable {
    attacks: Card[];
    defenses: Card[]; // defenses[i] defends against attacks[i]
}

export function canDefend(attackCard: Card, defenseCard: Card, trumpSuit: Suit): boolean {
    if (defenseCard.suit === trumpSuit && attackCard.suit !== trumpSuit) {
        return true; // Trump beats non-trump
    }
    if (defenseCard.suit === attackCard.suit && defenseCard.value > attackCard.value) {
        return true; // Higher card of same suit
    }
    return false;
}

export function getBotDefense(attackCard: Card, hand: Card[], trumpSuit: Suit): Card | null {
    // Basic AI: find minimum card to beat attackCard
    let validDefenses = hand.filter(c => canDefend(attackCard, c, trumpSuit));
    if (validDefenses.length === 0) return null;
    
    // Sort logic: 
    // prefer non-trump over trump
    // inside same category, prefer lower value
    validDefenses.sort((a, b) => {
        const aIsTrump = a.suit === trumpSuit ? 1 : 0;
        const bIsTrump = b.suit === trumpSuit ? 1 : 0;
        if (aIsTrump !== bIsTrump) return aIsTrump - bIsTrump;
        return a.value - b.value;
    });
    
    return validDefenses[0];
}

export function getBotAttacks(hand: Card[], tableRanks: number[], maxAttacks: number): Card[] {
    // If it's first attack (tableRanks is empty), play lowest non-trump card or pairs
    // Since our AI is simple, we just return one card or matching ranks.
    if (tableRanks.length === 0) {
        const sortedHand = [...hand].sort((a, b) => a.value - b.value); // ignoring trump preference for simplicity, wait, we should prefer non-trump
        // Better:
        const sorted = [...hand].sort((a,b) => {
           // We need trump info here to sorting, assuming trump is not passed we can at least return the lowest card
           return a.value - b.value;
        });
        // Group by rank
        const groups: {rank: number, cards: Card[]}[] = [];
        sorted.forEach(c => {
            const g = groups.find(x => x.rank === c.rank);
            if (g) g.cards.push(c);
            else groups.push({rank: c.rank, cards: [c]});
        });
        // Return lowest valid group
        return groups[0].cards.slice(0, maxAttacks);
    } else {
        // Can only attack with cards that match ranks on table
        const matchingCards = hand.filter(c => tableRanks.includes(c.rank));
        if (matchingCards.length === 0) return [];
        // Group by rank
        const groups: {rank: number, cards: Card[]}[] = [];
        matchingCards.forEach(c => {
            const g = groups.find(x => x.rank === c.rank);
            if (g) g.cards.push(c);
            else groups.push({rank: c.rank, cards: [c]});
        });
        // Just return the first available group
        return groups[0].cards.slice(0, maxAttacks);
    }
}
