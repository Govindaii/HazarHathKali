"""
🌸 Nature Category Hands
Hands that spread positivity through the beauty of nature
"""

from typing import Dict, Any
import random

from hands.base_hand import ImageHand


class FlowerBeautyHand(ImageHand):
    """
    🌸 FlowerBeauty Hand
    Showcases the exquisite beauty found in flowers.
    """
    
    PROMPTS = [
        "A macro shot of morning dew drops on rose petals, golden hour lighting, ethereal beauty",
        "Vibrant sunflower field stretching to the horizon, blue sky, feeling of joy and hope",
        "Delicate cherry blossoms falling in slow motion, soft pink hues, peaceful atmosphere",
        "Lotus flower blooming in serene pond, spiritual awakening, inner peace",
        "Wildflower meadow at sunset, butterflies dancing, celebration of life",
        "Single red tulip standing tall after rain, resilience and beauty",
        "Lavender fields in Provence, purple waves of calm, aromatherapy for the soul",
        "Colorful dahlia close-up, sacred geometry in nature, mathematical beauty",
        "White jasmine flowers under moonlight, fragrance you can almost smell, romantic",
        "Marigold garland for worship, devotion and celebration, golden warmth",
    ]
    
    CAPTIONS = [
        "Nature's art needs no filter 🌸",
        "Stop and smell the beauty around you 🌺",
        "Every flower is a soul blossoming 🌷",
        "In a world of chaos, flowers still bloom 🌼",
        "Beauty is everywhere, just open your eyes 🌻",
        "Nature's daily reminder that magic exists ✨",
        "Petals of peace in a busy world 🕊️",
        "God's artwork on display, free for all 🎨",
        "Bloom where you are planted 🌱",
        "The earth laughs in flowers 💐",
    ]
    
    HASHTAGS = [
        "#FlowerPower", "#NatureBeauty", "#BloomDaily", 
        "#NatureLove", "#FlowerMagic", "#PetalPerfection",
        "#GardenOfEden", "#FloralWonder", "#NatureHeals",
        "#PositiveVibes", "#HazarHathKali"
    ]
    
    def __init__(self):
        super().__init__(
            name="FlowerBeauty",
            category="nature",
            description="Showcases the exquisite beauty found in flowers"
        )
        self.add_style_prompts(self.PROMPTS)
        
    def get_prompt(self) -> str:
        return random.choice(self.PROMPTS)
    
    def generate(self) -> Dict[str, Any]:
        self.content_generated += 1
        return {
            'type': 'image',
            'prompt': self.get_prompt(),
            'caption': random.choice(self.CAPTIONS),
            'hashtags': random.sample(self.HASHTAGS, 5),
            'platform_hints': {
                'instagram': {'format': 'square', 'filter': 'clarendon'},
                'twitter': {'add_alt_text': True},
            }
        }


class SunriseSoulHand(ImageHand):
    """
    🌅 SunriseSoul Hand
    Captures the magic of sunrises and sunsets.
    """
    
    PROMPTS = [
        "Breathtaking sunrise over mountains, new beginnings, hope rising with the sun",
        "Golden hour sunset on beach, silhouette of person meditating, inner peace",
        "Dramatic clouds painted in orange and pink, nature's masterpiece",
        "Sunrise through forest trees, rays of light like divine blessing",
        "Sunset reflection on calm lake, mirror of heaven on earth",
        "Dawn breaking over city skyline, new day, new possibilities",
        "Sun setting behind ancient temple, spirituality meets nature",
        "First light on snow-capped peaks, pristine beauty, fresh start",
        "Colorful tropical sunset with palm trees, paradise on earth",
        "Sun rays breaking through storm clouds, hope after difficulty",
    ]
    
    CAPTIONS = [
        "Every sunrise is an invitation to rise and shine ☀️",
        "The sun rises for everyone 🌅",
        "New day, new blessings, new possibilities ✨",
        "Even darkness must give way to light 🌄",
        "The sky is painting hope again 🎨",
        "Wake up and chase your dreams 💫",
        "Another chance to make it beautiful 🌇",
        "Sunrise state of mind 🧘",
        "Let the light in 🔆",
        "Tomorrow is a new canvas 🖼️",
    ]
    
    def __init__(self):
        super().__init__(
            name="SunriseSoul",
            category="nature",
            description="Captures the magic of sunrises and sunsets"
        )
        
    def get_prompt(self) -> str:
        return random.choice(self.PROMPTS)
    
    def generate(self) -> Dict[str, Any]:
        self.content_generated += 1
        return {
            'type': 'image',
            'prompt': self.get_prompt(),
            'caption': random.choice(self.CAPTIONS),
            'hashtags': ['#Sunrise', '#NewDay', '#Hope', '#NatureBeauty', '#HazarHathKali'],
            'platform_hints': {
                'instagram': {'format': 'landscape', 'time': 'morning'},
            }
        }
