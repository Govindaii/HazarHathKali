"""
🖐️ BaseHand - The foundation for all 1000 hands
Each specialized hand inherits from this base class
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime
from loguru import logger


class BaseHand(ABC):
    """
    Base class for all AI agent hands.
    
    Each hand represents one of Kali's 1000 hands, 
    specialized in a unique way of spreading positivity.
    """
    
    def __init__(
        self,
        name: str,
        category: str,
        description: str,
        content_types: list = None
    ):
        self.name = name
        self.category = category
        self.description = description
        self.content_types = content_types or ['text']
        self.is_active = False
        self.created_at = datetime.now()
        self.content_generated = 0
        
    def activate(self) -> None:
        """Activate this hand to start generating content."""
        self.is_active = True
        logger.info(f"🖐️ {self.name} hand activated")
        
    def deactivate(self) -> None:
        """Deactivate this hand."""
        self.is_active = False
        logger.info(f"✋ {self.name} hand deactivated")
    
    @abstractmethod
    def generate(self) -> Dict[str, Any]:
        """
        Generate positive content.
        
        Returns:
            Dict containing the generated content with keys:
            - 'type': Content type (text, image, audio, video)
            - 'content': The actual content or path to content
            - 'caption': Caption for social media
            - 'hashtags': List of relevant hashtags
            - 'platform_hints': Platform-specific suggestions
        """
        pass
    
    @abstractmethod
    def get_prompt(self) -> str:
        """
        Get the prompt for content generation.
        
        Returns:
            The prompt string to use for AI generation
        """
        pass
    
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics for this hand."""
        return {
            'name': self.name,
            'category': self.category,
            'is_active': self.is_active,
            'content_generated': self.content_generated,
            'uptime_seconds': (datetime.now() - self.created_at).seconds
        }
    
    def __repr__(self) -> str:
        status = "🟢" if self.is_active else "🔴"
        return f"{status} {self.name} ({self.category})"


class TextHand(BaseHand):
    """Base class for text-focused hands."""
    
    def __init__(self, name: str, category: str, description: str):
        super().__init__(name, category, description, content_types=['text'])
        self.prompts = []
        
    def add_prompts(self, prompts: list) -> None:
        """Add prompts to this hand's prompt library."""
        self.prompts.extend(prompts)


class ImageHand(BaseHand):
    """Base class for image-focused hands."""
    
    def __init__(self, name: str, category: str, description: str):
        super().__init__(name, category, description, content_types=['image'])
        self.style_prompts = []
        
    def add_style_prompts(self, prompts: list) -> None:
        """Add style prompts for image generation."""
        self.style_prompts.extend(prompts)


class AudioHand(BaseHand):
    """Base class for audio-focused hands."""
    
    def __init__(self, name: str, category: str, description: str):
        super().__init__(name, category, description, content_types=['audio'])


class MultiMediaHand(BaseHand):
    """Base class for hands that generate multiple content types."""
    
    def __init__(self, name: str, category: str, description: str):
        super().__init__(
            name, category, description, 
            content_types=['text', 'image', 'audio', 'video']
        )
