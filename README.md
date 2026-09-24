# HazarHathKali: 1000 Hands of Positivity

HazarHathKali is a free website where you can chat with 1000 friendly AI helpers.

It is inspired by the Hazar Hath Kali temple murti. The Devi stands in the middle with a fan of 1000 hands behind her. Every hand is a small AI companion with its own name, personality and purpose. They are all there to lift your mood and give you a kinder alternative to endless scrolling.

**Open the website:** https://govindaii.github.io/HazarHathKali/

---

## How to use it

### 1. Get a free AI key (one time only)

The hands need an "API key" to talk. Think of it as a password that lets the website use an AI service. Google gives one away for free:

1. Go to **https://aistudio.google.com/apikey**
2. Sign in with your Google account.
3. Tap **Create API key**.
4. Copy the key. It is a long line of letters and numbers that starts with `AIza`.

### 2. Add your key to the website

1. Open the website.
2. A box called **"Give the hands a voice"** appears. If it doesn't, tap **Add API key** at the top right.
3. Choose **Google Gemini**.
4. Paste your key into the **API key** box.
5. Tap **Check key and connect**.

When the button at the top turns green, you are ready. Your key is saved only on your own phone or computer, and it is sent only to Google.

### 3. Pick a hand and start chatting

You can choose a hand in three ways:

- **Tap any hand** in the picture.
- **Tap the Devi** herself to get a random hand.
- **Scroll down to the list**. You can search for a word (like *chai*, *exam* or *sleep*) or pick a group (like *Humor* or *Wellness*).

A chat window opens. Type how you feel or what you need, then tap **Send**. You can also tap one of the ready-made questions.

### 4. Zoom in to see the hands

The picture has 1000 hands, so each one is small at first.

- **On a phone:** pinch with two fingers, or tap the **+** button.
- **On a computer:** scroll with your mouse wheel, or click **+**.
- **Drag** the picture to move around while zoomed in.
- Tap **Fit** to see the whole Devi again.

### Good to know

- **Your chats are saved** on your device. Open the same hand later and your conversation is still there.
- **Hands you have talked to** get a light ring around them in the picture.
- **Want to see how a hand thinks?** In any chat, tap **"See this hand's prompt"** to read its instructions.
- **Start a chat over:** open "See this hand's prompt" and tap **Clear conversation**.
- **Change or remove your key:** tap the button at the top right.
- **Other AI services:** you can also use a key from Anthropic Claude or OpenAI. Those are paid services.

> These hands are here to cheer you up. They are not doctors or therapists. If you are going through something serious, please talk to someone you trust. In India, you can call the free Tele-MANAS helpline on **14416** at any time. In an emergency, call **112**.

---

## The 1000 hands

There are 10 groups of hands, with 100 hands in each group. Every hand has a topic and a voice. For example, *Chai Friend* talks about small comforts like a warm friend, and *Exam Coach* helps you study like an energetic coach.

| Group | Some of the topics |
|-------|--------------------|
| Spirituality | Gita, Kabir, Buddha, Rumi, Silence |
| Science | Galaxies, the brain, space missions, light |
| Wellness | Breathing, sleep, calm, screen breaks |
| Nature | Sunrise, rain, lotus, mountains, rivers |
| Music | Ragas, tabla, flute, feel-good songs |
| Humor | Puns, family life, cricket, weddings |
| Gratitude | Mornings, family, chai, tiny joys |
| Motivation | Exams, careers, comebacks, first steps |
| Kindness | Strangers, elders, animals, being kind to yourself |
| Art | Rangoli, doodles, poems, mehendi |

The 10 voices are: **Poet, Friend, Guru, Coach, Child, Yogi, Storyteller, Healer, Jester and Scholar.**

---

## For developers

The whole website is in the `docs` folder. It is plain HTML, CSS and JavaScript, with no install or build step. To run it on your computer, open `docs/index.html` in a browser.

| File | What it does |
|------|--------------|
| `docs/index.html` | The page layout |
| `docs/styles.css` | Colours, fonts and layout |
| `docs/devi.js` | Draws the Devi and her 1000 hands, and handles zoom |
| `docs/hands.js` | The list of 1000 hands and the instructions (prompt) for each one |
| `docs/providers.js` | Talks to Google Gemini, Anthropic Claude and OpenAI |
| `docs/app.js` | Search, chat window and the API key box |

The website is published with GitHub Pages from the `docs` folder on the `main` branch (**Settings → Pages**).

---

## License

MIT License. Spread positivity freely.
