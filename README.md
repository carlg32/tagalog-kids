# Tagalog Kids

Interactive Tagalog learning webapp for primary schoolers (Grades 1-6, ages 7-12).

**Live Demo**: https://tagalogkids.dcrstreams.vip

---

## ✨ Current Features

### Core Learning Experience
- **Study → Easy Quiz → Hard Quiz** flow (minimal friction)
- **Dynamic word selection** with spaced repetition logic
- **Sound-click tracking** (practice is counted on 🔊 click, not slide view)
- **Mastery system**: 3 practices = mastered → 7-day cooldown
- **Parent Dashboard**: Exclude words your child already knows

### Vocabulary (20+ Categories)
- Greetings, Numbers, Colors, Food, Animals, Emotions, Time, Shapes, Family, Nature, School, and more
- Flexible schema with tags, difficulty levels, and cultural notes
- Support for parent-controlled exclusions

### UX Improvements
- Large, centered sound button for easy tapping
- "Back" button hidden on first item, "Next" hidden on last item
- Clean, kid-friendly design with CSS animations

---

## 🚀 Quick Start

```bash
cd D:/Projects/tagalog-kids
python -m http.server 8000
```

Then open: **http://localhost:8000**

---

## 👨‍👩‍👧 Parent Features

Access the **Parent Dashboard** from the main page to:
- View all available words by category
- Exclude words your child already knows
- See which words are mastered
- Search and manage vocabulary

---

## 🧠 AI Integration (In Progress)

- `teach-tagalog-kids` skill for daily lesson recommendations
- Learning records for pedagogical decisions
- Context-aware selection based on performance and exclusions

---

## 🛠 Tech Stack

- Pure static HTML/CSS/JS (no framework)
- localStorage for progress
- Google Cloud TTS for audio
- Vercel for deployment

---

## 📁 Project Structure

```
tagalog-kids/
├── index.html              # Main entry + config
├── lesson-v2.html          # Main lesson template
├── parent-dashboard.html   # Parent customization tool
├── js/
│   ├── slide-v2.js
│   └── word-selector.js
├── css/
├── data/                   # Structured word lists (JSON)
└── lesson-*.html           # Dedicated lesson pages
```

---

## 🔮 Roadmap

- [ ] Generate images + audio for all categories
- [ ] Full AI-driven daily lesson selection
- [ ] Voice input for pronunciation practice
- [ ] Gamification (badges, streaks, points)
- [ ] Multi-child support

---

**Built with ❤️ for Filipino families preserving their heritage language.**