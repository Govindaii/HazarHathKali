"""
💪 Motivation Category Hands
Hands that spread positivity through motivational content
"""

from typing import Dict, Any
import random

from hands.base_hand import TextHand, ImageHand


class RiseUpHand(TextHand):
    """
    💪 RiseUp Hand
    Shares motivational quotes and uplifting stories.
    """
    
    MOTIVATION_QUOTES = [
        "You didn't come this far to only come this far. Keep going! 💪",
        "Your only limit is the one you set in your mind. Break free! 🦋",
        "Fall seven times, stand up eight. 🌟",
        "The comeback is always stronger than the setback. 🔥",
        "You are not a drop in the ocean. You are the entire ocean in a drop. 🌊",
        "Don't wait for opportunity. Create it. ⚡",
        "The best time to plant a tree was 20 years ago. The second best time is now. 🌱",
        "Your vibe attracts your tribe. Radiate positivity. ✨",
        "Difficult roads often lead to beautiful destinations. 🏔️",
        "You are stronger than you think, braver than you believe. 💎",
        "Stars can't shine without darkness. Your struggles are preparing you. ⭐",
        "Every expert was once a beginner. Start where you are. 🎯",
        "The only way to do great work is to love what you do. ❤️",
        "Your potential is endless. Go do what you were created to do. 🚀",
        "Believe you can and you're halfway there. 🙌",
    ]
    
    MORNING_MOTIVATION = [
        "Good morning, warrior! Today is your day to shine. ☀️",
        "Rise and grind! Your dreams won't achieve themselves. 💪",
        "New day, new strength, new thoughts. Let's go! 🔥",
        "Wake up with determination, go to bed with satisfaction. 🌙",
        "Today's goal: Be better than yesterday. That's it. 📈",
    ]
    
    def __init__(self):
        super().__init__(
            name="RiseUp",
            category="motivation",
            description="Shares motivational quotes and uplifting stories"
        )
        self.add_prompts(self.MOTIVATION_QUOTES + self.MORNING_MOTIVATION)
        
    def get_prompt(self) -> str:
        return random.choice(self.prompts)
    
    def generate(self) -> Dict[str, Any]:
        self.content_generated += 1
        quote = self.get_prompt()
        
        return {
            'type': 'text',
            'content': quote,
            'caption': quote,
            'hashtags': [
                '#Motivation', '#RiseUp', '#YouGotThis', 
                '#DailyInspiration', '#PositiveVibes', '#HazarHathKali'
            ],
            'platform_hints': {
                'instagram': {'use_carousel': False, 'bold_text': True},
                'twitter': {'retweet_friendly': True},
                'linkedin': {'professional_tone': True},
            },
            'image_prompt': f"Inspirational quote background, minimalist design, soft gradient, motivational vibes: '{quote[:50]}...'"
        }


class DreamChaserHand(ImageHand):
    """
    🌟 DreamChaser Hand
    Visual motivation through inspiring imagery.
    """
    
    VISUAL_PROMPTS = [
        "Person standing on mountain peak at sunrise, arms raised in victory, achievement",
        "Runner crossing finish line, determination, never give up mentality",
        "Seed breaking through concrete, resilience, unstoppable growth",
        "Phoenix rising from ashes, transformation, rebirth, new beginning",
        "Lighthouse standing strong in storm, guidance, hope in darkness",
        "Butterfly emerging from cocoon, beautiful transformation, patience",
        "Arrow being pulled back in bow, preparation for greatness, potential energy",
        "Small plant growing towards sunlight, purpose, reaching for goals",
        "Climber reaching for next hold, progress, one step at a time",
        "Ocean wave about to crest, power, momentum, timing",
    ]
    
    def __init__(self):
        super().__init__(
            name="DreamChaser",
            category="motivation",
            description="Visual motivation through inspiring imagery"
        )
        self.add_style_prompts(self.VISUAL_PROMPTS)
        
    def get_prompt(self) -> str:
        return random.choice(self.VISUAL_PROMPTS)
    
    def generate(self) -> Dict[str, Any]:
        self.content_generated += 1
        
        return {
            'type': 'image',
            'prompt': self.get_prompt(),
            'caption': "Your dreams are valid. Keep chasing them. 🌟",
            'hashtags': ['#DreamBig', '#NeverGiveUp', '#Motivation', '#Victory', '#HazarHathKali'],
            'platform_hints': {
                'instagram': {'format': 'square', 'filter': 'dramatic'},
            }
        }
