"""
📋 Hand Registry - Manages all 1000 hands
The registry keeps track of all available hands and their categories
"""

from typing import List, Dict, Type, Optional
from loguru import logger

from hands.base_hand import BaseHand
from hands.categories.nature import FlowerBeautyHand, SunriseSoulHand
from hands.categories.gratitude import ThankfulHeartHand
from hands.categories.motivation import RiseUpHand


class HandRegistry:
    """
    Registry for all 1000 hands (AI agents).
    
    The registry manages the creation and retrieval of hands
    across all categories.
    """
    
    def __init__(self):
        self._hands: Dict[str, BaseHand] = {}
        self._categories: Dict[str, List[str]] = {}
        
        # Register default hands
        self._register_default_hands()
        
    def _register_default_hands(self) -> None:
        """Register the default set of hands."""
        default_hands = [
            # Nature Category
            FlowerBeautyHand(),
            SunriseSoulHand(),
            
            # Gratitude Category
            ThankfulHeartHand(),
            
            # Motivation Category
            RiseUpHand(),
        ]
        
        for hand in default_hands:
            self.register(hand)
            
        logger.info(f"📋 Registered {len(self._hands)} default hands")
    
    def register(self, hand: BaseHand) -> None:
        """
        Register a hand in the registry.
        
        Args:
            hand: The hand instance to register
        """
        self._hands[hand.name] = hand
        
        # Add to category mapping
        if hand.category not in self._categories:
            self._categories[hand.category] = []
        self._categories[hand.category].append(hand.name)
        
    def get(self, name: str) -> Optional[BaseHand]:
        """Get a hand by name."""
        return self._hands.get(name)
    
    def get_by_category(self, category: str) -> List[BaseHand]:
        """Get all hands in a category."""
        hand_names = self._categories.get(category, [])
        return [self._hands[name] for name in hand_names]
    
    def get_hands(self, count: int) -> List[BaseHand]:
        """
        Get a specified number of hands.
        
        Args:
            count: Number of hands to retrieve
            
        Returns:
            List of hand instances
        """
        all_hands = list(self._hands.values())
        return all_hands[:min(count, len(all_hands))]
    
    def get_all_categories(self) -> List[str]:
        """Get list of all registered categories."""
        return list(self._categories.keys())
    
    def get_stats(self) -> Dict:
        """Get registry statistics."""
        return {
            'total_hands': len(self._hands),
            'categories': len(self._categories),
            'hands_per_category': {
                cat: len(hands) 
                for cat, hands in self._categories.items()
            }
        }
    
    def __len__(self) -> int:
        return len(self._hands)
    
    def __repr__(self) -> str:
        return f"HandRegistry({len(self._hands)} hands, {len(self._categories)} categories)"
