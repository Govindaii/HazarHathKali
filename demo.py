# -*- coding: utf-8 -*-
"""
HazarHathKali Demo - Simple Runner
Quick demo to show what the God Agent does
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

print("""
======================================================================
    HAZARHATHKALI - 1000 HANDS OF POSITIVITY
======================================================================
    
    "Algorithm ne brain rot diya,
     Kali Maa 1000 haathon se positivity degi"
    
======================================================================
""")

import random
sys.path.insert(0, '.')

# Sample prompts from our hands
NATURE_PROMPTS = [
    "[FLOWER] A macro shot of morning dew drops on rose petals, golden hour lighting",
    "[SUNRISE] Breathtaking sunrise over mountains, new beginnings, hope rising",
    "[SUNFLOWER] Vibrant sunflower field stretching to the horizon, feeling of joy",
]

GRATITUDE_PROMPTS = [
    "[GRATITUDE] Today, I am grateful for the simple gift of breathing freely.",
    "[GRATITUDE] Gratitude turns what we have into enough.",
    "[GRATITUDE] What are 3 things you're grateful for today?",
]

MOTIVATION_PROMPTS = [
    "[MOTIVATION] You didn't come this far to only come this far. Keep going!",
    "[MOTIVATION] Your only limit is the one you set in your mind. Break free!",
    "[MOTIVATION] The comeback is always stronger than the setback.",
]

CAPTIONS = {
    'nature': ["Nature's art needs no filter", "Beauty is everywhere", "The sun rises for everyone"],
    'gratitude': ["Count your blessings", "Grateful heart = Abundant life"],
    'motivation': ["Rise and grind!", "You got this!", "Chase your dreams!"],
}

HASHTAGS = ["#HazarHathKali", "#PositiveVibes", "#SpreadLove", "#CyberGods", "#1000Hands"]

print("=" * 70)
print("  ACTIVATING SAMPLE HANDS (AI AGENTS)")
print("=" * 70)

hands = [
    ("FlowerBeauty", "nature", NATURE_PROMPTS),
    ("SunriseSoul", "nature", NATURE_PROMPTS),
    ("ThankfulHeart", "gratitude", GRATITUDE_PROMPTS),
    ("RiseUp", "motivation", MOTIVATION_PROMPTS),
]

for name, category, prompts in hands:
    print(f"\n   [OK] {name} ({category}) - ACTIVATED")

print("\n" + "=" * 70)
print("  GENERATING POSITIVE CONTENT")
print("=" * 70)

for name, category, prompts in hands:
    prompt = random.choice(prompts)
    caption = random.choice(CAPTIONS[category])
    tags = " ".join(random.sample(HASHTAGS, 3))
    
    print(f"\n{'-' * 70}")
    print(f"  HAND: {name}")
    print(f"  Category: {category}")
    print(f"{'-' * 70}")
    print(f"\n  CONTENT:")
    print(f"    {prompt}")
    print(f"\n  CAPTION: {caption}")
    print(f"  HASHTAGS: {tags}")
    print(f"\n  PLATFORMS: Instagram, LinkedIn, Twitter")

print("\n" + "=" * 70)
print("  STATS")
print("=" * 70)
print("""
   Active Hands:      4 of 1000
   Content Generated: 4 pieces
   Categories:        nature, gratitude, motivation
   
   Mission: Counter doom scrolling with positivity
   Status:  Kali Maa spreading joy through 1000 hands!
""")

print("=" * 70)
print("  HAZARHATHKALI - Spreading Positivity to the World!")
print("=" * 70)

print("""

HOW IT WORKS:
=============

1. ORCHESTRATOR (kali/orchestrator.py)
   - This is the "God Agent" - HazarHathKali herself
   - Controls all 1000 hands (AI agents)
   - Schedules content and manages platforms

2. HANDS (hands/categories/*.py)
   - Each "hand" is a specialized AI agent
   - FlowerBeauty: Shows beauty in flowers
   - SunriseSoul: Captures magical sunrises
   - ThankfulHeart: Shares gratitude prompts
   - RiseUp: Motivational quotes & stories

3. PROMPTS (prompts/templates.yaml)
   - Database of positive content templates
   - Image generation prompts
   - Captions and hashtags

4. CONNECTORS (connectors/*.py)
   - Connect to Instagram, Twitter, LinkedIn
   - Auto-post content to multiple platforms

5. GENERATORS (generators/*.py)
   - Use Gemini API for text generation
   - Use ComfyUI/Stable Diffusion for images
   - Your RTX 4090 will generate beautiful art!

GOAL: Fight doom scrolling with 1000 AI agents
      spreading positivity across social media!
""")
