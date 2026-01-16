"""
🙏 Gratitude Category Hands
Hands that spread positivity through gratitude and thankfulness
"""

from typing import Dict, Any
import random

from hands.base_hand import TextHand


class ThankfulHeartHand(TextHand):
    """
    🙏 ThankfulHeart Hand
    Shares daily gratitude prompts and thankfulness reminders.
    """
    
    GRATITUDE_PROMPTS = [
        "Today, I am grateful for the simple gift of breathing freely.",
        "Thank you for the people who chose to stay when they could have left.",
        "Gratitude turns what we have into enough.",
        "The more you are grateful, the more beauty you see.",
        "Today's blessing: You woke up. Not everyone did.",
        "Be thankful for the difficult times. They have shown you how strong you are.",
        "Gratitude is the healthiest of all human emotions.",
        "What if you woke up tomorrow with only the things you thanked God for today?",
        "A grateful heart is a magnet for miracles.",
        "Thank you for this moment. It's all we truly have.",
        "Gratitude makes sense of our past, brings peace for today, and creates a vision for tomorrow.",
        "The secret to having it all is knowing you already do.",
        "Count your blessings, not your problems.",
        "Gratitude is not only the greatest of virtues but the parent of all others.",
        "When you are grateful, fear disappears and abundance appears.",
    ]
    
    QUESTION_PROMPTS = [
        "What are 3 things you're grateful for today? 🙏",
        "Who made you smile this week? Send them a thank you message! 💝",
        "What's a small thing you often take for granted? 🤔",
        "Name someone who believed in you when you didn't believe in yourself 💪",
        "What's the best thing that happened to you this month? ✨",
        "What challenge taught you the most this year? 🌱",
        "Who in your life deserves more appreciation? 💐",
        "What simple pleasure brought you joy today? ☕",
        "What are you looking forward to tomorrow? 🌅",
        "What part of your body are you grateful works well? 💪",
    ]
    
    def __init__(self):
        super().__init__(
            name="ThankfulHeart",
            category="gratitude",
            description="Shares daily gratitude prompts and thankfulness reminders"
        )
        self.add_prompts(self.GRATITUDE_PROMPTS + self.QUESTION_PROMPTS)
        
    def get_prompt(self) -> str:
        return random.choice(self.prompts)
    
    def generate(self) -> Dict[str, Any]:
        self.content_generated += 1
        
        # Mix of statements and questions
        if random.random() > 0.5:
            text = random.choice(self.GRATITUDE_PROMPTS)
        else:
            text = random.choice(self.QUESTION_PROMPTS)
            
        return {
            'type': 'text',
            'content': text,
            'caption': text,
            'hashtags': ['#Gratitude', '#Thankful', '#Blessed', '#PositiveVibes', '#HazarHathKali'],
            'platform_hints': {
                'instagram': {'use_story': True, 'background': 'gradient'},
                'twitter': {'add_thread': False},
                'linkedin': {'professional_tone': True},
            }
        }
