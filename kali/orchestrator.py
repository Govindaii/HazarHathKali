"""
🕉️ HazarHathKali Orchestrator
The God Agent that controls all 1000 hands
"""

import yaml
from pathlib import Path
from typing import List, Dict, Any
from loguru import logger
from datetime import datetime

from hands.base_hand import BaseHand
from hands.registry import HandRegistry


class HazarHathKali:
    """
    The God Agent - Orchestrates 1000 AI agents to spread positivity.
    
    Devi HazarHathKali controls each hand (agent) to create and share
    positive content across social media platforms.
    """
    
    def __init__(self, config_path: str = "config.yaml"):
        self.config = self._load_config(config_path)
        self.registry = HandRegistry()
        self.active_hands: List[BaseHand] = []
        self.created_at = datetime.now()
        
        logger.info("🕉️ HazarHathKali awakens...")
        logger.info(f"   Max Agents: {self.config['orchestrator']['max_agents']}")
        logger.info(f"   Active Agents: {self.config['orchestrator']['active_agents']}")
        
    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """Load configuration from YAML file."""
        config_file = Path(config_path)
        if not config_file.exists():
            raise FileNotFoundError(f"Config file not found: {config_path}")
        
        with open(config_file, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    
    def activate_hands(self, count: int = None) -> None:
        """
        Activate the specified number of hands (agents).
        
        Args:
            count: Number of hands to activate. If None, uses config default.
        """
        if count is None:
            count = self.config['orchestrator']['active_agents']
        
        logger.info(f"🖐️ Activating {count} hands...")
        
        # Get hands from registry
        self.active_hands = self.registry.get_hands(count)
        
        for hand in self.active_hands:
            hand.activate()
            logger.info(f"   ✅ {hand.name} activated")
    
    def generate_content(self) -> List[Dict[str, Any]]:
        """
        Generate content from all active hands.
        
        Returns:
            List of generated content items
        """
        content_items = []
        
        logger.info("🎨 Generating content from all hands...")
        
        for hand in self.active_hands:
            try:
                content = hand.generate()
                content_items.append({
                    'hand': hand.name,
                    'category': hand.category,
                    'content': content,
                    'timestamp': datetime.now().isoformat()
                })
                logger.info(f"   📝 {hand.name}: Content generated")
            except Exception as e:
                logger.error(f"   ❌ {hand.name}: Failed - {e}")
        
        return content_items
    
    def spread_positivity(self) -> None:
        """
        Main loop - Generate and post positive content.
        This is the core method that runs the God Agent.
        """
        logger.info("🕉️ Starting to spread positivity...")
        
        # Generate content
        content_items = self.generate_content()
        
        # Schedule posts (to be implemented with connectors)
        for item in content_items:
            logger.info(f"📤 Would post: {item['hand']} - {item['category']}")
        
        logger.info(f"✨ Generated {len(content_items)} pieces of positive content!")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get current orchestrator statistics."""
        return {
            'name': 'HazarHathKali',
            'version': '0.1.0',
            'active_hands': len(self.active_hands),
            'max_hands': self.config['orchestrator']['max_agents'],
            'uptime_seconds': (datetime.now() - self.created_at).seconds,
            'categories': [cat['name'] for cat in self.config['categories']]
        }


def main():
    """Main entry point for HazarHathKali."""
    logger.add("logs/kali_{time}.log", rotation="1 day")
    
    print("""
    ╔═══════════════════════════════════════════════════════════╗
    ║                                                           ║
    ║   🕉️  HAZARHATHKALI - 1000 HANDS OF POSITIVITY  🕉️       ║
    ║                                                           ║
    ║   "Algorithm ne brain rot diya,                           ║
    ║    Kali Maa 1000 haathon se positivity degi"              ║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
    """)
    
    # Initialize the God Agent
    kali = HazarHathKali()
    
    # Activate hands
    kali.activate_hands()
    
    # Start spreading positivity
    kali.spread_positivity()
    
    # Show stats
    stats = kali.get_stats()
    logger.info(f"📊 Stats: {stats}")


if __name__ == "__main__":
    main()
