# Rosebud Goal App - Implementation Plan

## Overview
A ruthlessly goal-focused AI coaching app that leverages every major change-work methodology to drive you toward your goals. Persistent memory, AI-driven accountability, and escalating notifications. The AI dynamically selects the right framework for the moment — the user never picks modalities, the coach just knows what you need.

## Tech Stack
- **Mobile**: Expo (React Native) → Android
- **Web/Desktop**: React + Vite (shared components with mobile)
- **Database/Backend**: Convex (real-time, serverless)
- **AI**: Anthropic Claude API
- **Notifications**: Expo Push Notifications (mobile) + Web Push API (browser) + Twilio SMS (fallback)
- **Language**: TypeScript throughout
- **Monorepo**: pnpm workspaces

## Project Structure
```
/
├── packages/
│   ├── shared/              # Shared types, utils, AI prompt templates
│   │   ├── src/
│   │   │   ├── types/       # Goal, Session, User types
│   │   │   ├── prompts/     # AI system prompts & frameworks
│   │   │   │   ├── core.ts          # Base coaching personality
│   │   │   │   ├── frameworks.ts    # All 20+ modality definitions
│   │   │   │   └── mentors.ts       # Council of Mentors templates
│   │   │   └── utils/       # Shared helpers
│   │   └── package.json
│   ├── web/                 # React + Vite web app
│   │   ├── src/
│   │   │   ├── components/  # UI components
│   │   │   ├── pages/       # Route pages
│   │   │   ├── hooks/       # React hooks
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   └── mobile/              # Expo React Native app
│       ├── app/             # Expo Router file-based routing
│       ├── components/      # Mobile components
│       ├── package.json
│       └── app.json
├── convex/                  # Convex backend (shared by web + mobile)
│   ├── schema.ts            # Database schema
│   ├── goals.ts             # Goal CRUD + progress tracking
│   ├── sessions.ts          # Coaching session mutations/queries
│   ├── memory.ts            # Persistent memory system
│   ├── notifications.ts     # Notification scheduling + logic
│   ├── ai.ts                # Claude API integration (Convex action)
│   └── crons.ts             # Scheduled notification checks
├── pnpm-workspace.yaml
├── package.json
├── convex.json
└── .env.local               # API keys (not committed)
```

## AI Framework Toolbelt (20+ Modalities)

The AI coach has all of these at its disposal and dynamically selects 1-2 per conversation based on what the user needs in the moment.

### Therapeutic / Psychological
| Framework | When AI Uses It | Key Techniques |
|---|---|---|
| **CBT** | Distorted thinking, catastrophizing, negative self-talk | Identify cognitive distortions, thought records, behavioral experiments |
| **ACT** | Resistance to action, emotional avoidance | Values clarification, defusion, committed action despite discomfort |
| **IFS (Parts Work)** | Self-sabotage, inner conflict, procrastination | "What part of you is resisting? What is it protecting?" |
| **NLP** | Building new patterns, anchoring confidence | Anchoring peak states, reframing, modeling, swish pattern |
| **Self-Hypnosis** | Evening routines, deep identity work, visualization | Guided visualization scripts, subconscious reprogramming |
| **Motivational Interviewing** | Ambivalence, "I want to but..." | Explore both sides without judgment, evoke change talk |
| **Solution-Focused** | Stuck in problem-mode, can't see path forward | Miracle question, scaling, exception finding |
| **Shadow Work** | Deep blocks, recurring patterns, self-sabotage | Surface unconscious beliefs, integrate rejected parts |

### Performance / Productivity
| Framework | When AI Uses It | Key Techniques |
|---|---|---|
| **Atomic Habits** | Building new behaviors, breaking bad ones | Habit stacking, 2-minute rule, identity-based habits, environment design |
| **Essentialism** | Overwhelm, too many goals, scattered focus | "What's the ONE thing? Say no to everything else" |
| **80/20 (Pareto)** | Inefficient effort, busy but not productive | "Which 20% of actions drive 80% of results?" |
| **Fear Setting** | Procrastination from fear, avoidance | Define worst case, realize it's survivable, define cost of inaction |
| **Implementation Intentions** | Good intentions but no follow-through | "When [trigger], I will [action]" — 2-3x follow-through increase |
| **Deep Work / Flow** | Distraction, shallow work, lack of focus | Structured focus blocks, elimination of distractions |

### Mindset / Spiritual
| Framework | When AI Uses It | Key Techniques |
|---|---|---|
| **Christianity / Faith** | Fear, doubt, need for surrender | Scripture, prayer prompts, "God didn't bring you this far to leave you" |
| **Manifestation** | Limiting beliefs about possibility | Visualization, affirmations, "act as if", identity shifting |
| **Surrender / Radical Acceptance** | Overcontrol, anxiety, forcing outcomes | Let go of the how, trust the process, accept what is |
| **Stoicism** | External frustrations, things outside control | Focus on what you control, memento mori urgency, amor fati |
| **Growth Mindset** | Fixed mindset, fear of failure | Reframe failure as data, effort over talent, "yet" |
| **Gratitude** | Scarcity mindset, negativity bias | Reframe to abundance, acknowledge progress |
| **Breathwork** | In-the-moment anxiety, procrastination paralysis | Box breathing, 4-7-8, physiological sigh |
| **Positive Psychology** | Burnout, lost motivation | PERMA model, build on strengths, savor wins |

### Identity / Strategic
| Framework | When AI Uses It | Key Techniques |
|---|---|---|
| **Future Self (Benjamin Hardy)** | Disconnected from goals, lack of urgency | "Who is the person who already achieved this? What would they do RIGHT NOW?" |
| **Council of Mentors** | Need perspective, stuck in own viewpoint | "How would [chosen mentor] think about this? What would they tell you?" |
| **Direct Accountability** | Excuses, rationalization, BS | Pattern callout, confrontation with care, "you said this same thing last week" |

### How Framework Selection Works
The AI evaluates:
1. What emotion/state the user is expressing
2. What has worked for this user before (from memory)
3. What hasn't worked (avoid repeating failed approaches)
4. The urgency/timeline of the goal
5. Whether this is a thinking problem, feeling problem, or action problem

## Council of Mentors Feature

Users define their personal advisory board — real people, historical figures, fictional characters, anyone whose perspective they value. The AI can then:
- Role-play a mentor's perspective: "Let's ask your council. What would [Mentor] say about this?"
- Offer contrasting views: "Your board is split — [Mentor A] would say push harder, [Mentor B] would say step back. What resonates?"
- Users can add/remove mentors anytime

### Database: MentorBoard
- `_id`, `userId`
- `mentors[]` ({ name, description, perspective, keyPhrases })
- Example: { name: "Jocko Willink", description: "Extreme ownership, discipline", perspective: "No excuses. Own it. What's the next action?", keyPhrases: ["Good.", "Discipline equals freedom"] }

## Database Schema (Convex)

### Users
- `_id`, `name`, `email`, `phone` (for SMS), `timezone`
- `notificationPreferences` (push, sms, quiet hours)
- `createdAt`

### Goals
- `_id`, `userId`, `title`, `description`
- `category` (health, career, spiritual, relationship, financial, etc.)
- `deadline`, `status` (active, completed, abandoned)
- `milestones[]` (sub-goals with deadlines)
- `createdAt`, `updatedAt`

### Sessions (Coaching Conversations)
- `_id`, `userId`, `goalId` (optional - can be general)
- `messages[]` ({ role, content, timestamp, framework })
- `frameworks[]` (which modalities were used this session)
- `insights[]` (AI-extracted key insights)
- `actionItems[]` (concrete next steps extracted)
- `createdAt`

### Memory (Persistent Context)
- `_id`, `userId`
- `category` (belief, pattern, breakthrough, resistance, value, trigger, preference)
- `content` (the actual memory/insight)
- `source` (which session it came from)
- `relevanceScore` (how important/recurring)
- `frameworkEffectiveness` (which frameworks worked/didn't for this user)
- `createdAt`, `lastReferencedAt`

### MentorBoard (Council of Mentors)
- `_id`, `userId`
- `mentors[]` ({ name, description, perspective, keyPhrases })

### CheckIns (Progress Tracking)
- `_id`, `userId`, `goalId`
- `type` (daily, milestone, weekly_review)
- `mood`, `energy`, `confidence` (1-10 scales)
- `blockers`, `wins`, `reflections`
- `createdAt`

### NotificationQueue
- `_id`, `userId`, `type` (push, sms, web)
- `message`, `scheduledFor`, `sentAt`
- `escalationLevel` (1-5, increases if ignored)
- `relatedGoalId`

## Core Features (Build Order)

### Phase 1: Foundation
1. **Project scaffolding** - Monorepo, Convex, Expo, Vite, shared package
2. **Convex schema** - All tables defined
3. **Basic auth** - Simple personal auth (this is just for you)
4. **Goal CRUD** - Create, edit, delete, view goals with milestones

### Phase 2: AI Coaching Engine
5. **Claude integration** - Convex action that calls Anthropic API
6. **System prompt engineering** - Core personality + all 20+ frameworks as a reference guide
7. **Chat interface** - Real-time conversation with the AI coach
8. **Framework selection logic** - AI dynamically picks the right tool based on context
9. **Council of Mentors** - Define your advisory board, AI role-plays their perspectives

### Phase 3: Persistent Memory
10. **Memory extraction** - After each session, AI extracts key insights/patterns
11. **Memory retrieval** - Before each session, relevant memories are injected into context
12. **Pattern recognition** - AI identifies recurring blocks, excuses, breakthroughs
13. **Framework tracking** - Track which modalities work best for you over time
14. **Memory dashboard** - View your accumulated insights, patterns, and framework effectiveness

### Phase 4: Ruthless Accountability
15. **Scheduled check-ins** - Daily morning intention, evening review
16. **AI-driven nudges** - AI decides when to push based on patterns
17. **Escalation system**:
    - Level 1: Gentle web/push notification
    - Level 2: Direct push ("You said X was important. What happened?")
    - Level 3: Confrontational push ("You've avoided this for 3 days. What are you afraid of?")
    - Level 4: SMS ("I noticed you're ghosting your goals. We need to talk.")
    - Level 5: SMS nuclear ("You committed to [goal] by [date]. [X] days left. Open the app NOW.")
18. **Web Push Notifications** - Service worker for browser notifications
19. **Mobile Push Notifications** - Expo push notifications
20. **SMS via Twilio** - Last resort accountability
21. **Implementation Intentions** - Notification-driven "When X, I will Y" reminders

### Phase 5: Polish
22. **Dashboard** - Goal progress, streaks, mood trends, upcoming milestones
23. **Future Self visualization** - Dedicated section for future self identity work
24. **Weekly review** - Automated weekly summary + planning session
25. **Dark mode**
26. **Mobile-optimized UX** - Smooth, fast, thumb-friendly

## AI Coaching Personality

The AI coach is:
- **Warm but unrelenting** - Cares deeply but won't let you off the hook
- **Pattern-aware** - "You said the same thing last Tuesday and didn't follow through"
- **Framework-fluid** - Switches between 20+ modalities naturally, never announces "I'm using CBT now"
- **Action-biased** - Every session ends with a concrete next step
- **BS detector** - Identifies rationalization, avoidance, self-sabotage instantly
- **Celebratory** - Genuinely excited about wins, no matter how small
- **Future Self oriented** - Constantly connects today's actions to who you're becoming
- **Council-aware** - Can invoke your mentors' perspectives when you're stuck

## Notification Strategy

**Scheduled:**
- Morning: "What's the #1 thing you'll do today for [active goal]?"
- Evening: "How did today go? Quick check-in."
- Weekly: Full review + planning session

**AI-Driven:**
- Missed check-in → escalating reminders
- Approaching deadline → urgency increase
- Pattern detected (e.g., always skipping Wednesdays) → targeted intervention
- Breakthrough moment → reinforcement notification next day
- Long silence → "I'm still here. What's going on?"
- Implementation intention triggers → "It's [trigger time]. Time to [action]."

## Environment Variables Needed
```
CONVEX_DEPLOYMENT=       # Convex project URL
ANTHROPIC_API_KEY=       # Claude API key
TWILIO_ACCOUNT_SID=      # For SMS
TWILIO_AUTH_TOKEN=        # For SMS
TWILIO_PHONE_NUMBER=     # For SMS
EXPO_PUSH_TOKEN=         # Generated per device
```
