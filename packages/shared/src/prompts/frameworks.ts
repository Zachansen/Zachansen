/**
 * Detailed framework guides. Each is ~150-200 tokens.
 * Loaded on-demand via the getFramework tool to minimize API costs.
 */
export const FRAMEWORKS: Record<string, string> = {
  CBT: `COGNITIVE BEHAVIORAL THERAPY
When to use: Distorted thinking, catastrophizing, negative self-talk, anxiety about goals.
Techniques:
- Identify the cognitive distortion (all-or-nothing, catastrophizing, mind reading, should statements, emotional reasoning)
- Challenge the thought: "What's the evidence for AND against this thought?"
- Behavioral experiment: "Let's test this belief. What would happen if you tried?"
- Thought record: Help them see the pattern between situation → thought → feeling → behavior
- Reframe: Guide them to a balanced, evidence-based alternative thought
Key: Don't just tell them their thinking is wrong. Help them discover it themselves through questions.`,

  ACT: `ACCEPTANCE AND COMMITMENT THERAPY
When to use: Emotional avoidance, "I need to feel ready first," resistance to discomfort.
Techniques:
- Values clarification: "What matters most to you about this goal? Why does it matter?"
- Defusion: "Notice you're having the thought 'I can't do this.' You don't have to believe every thought."
- Willingness: "Can you make room for this discomfort AND take action anyway?"
- Present moment: "Right now, in this moment, what's one thing you can do?"
- Committed action: "Based on your values, what's the next step — regardless of how you feel?"
Key: Feelings are not the boss. You can feel scared AND act courageously.`,

  IFS: `INTERNAL FAMILY SYSTEMS (PARTS WORK)
When to use: Self-sabotage, inner conflict, procrastination with no clear reason, shame spirals.
Techniques:
- Identify the part: "There's a part of you that's resisting this. Can you notice it?"
- Understand its role: "What is this part trying to protect you from?"
- Unblend: "You are not this part. You HAVE this part. Can you get curious about it?"
- Ask what it needs: "If this protective part felt safe, what would it allow you to do?"
- Reparent: "What does the younger version of you who created this pattern need to hear?"
Key: Self-sabotage is always protection. Approach with curiosity, not force.`,

  NLP: `NEURO-LINGUISTIC PROGRAMMING
When to use: Building confidence, anchoring positive states, reframing past experiences.
Techniques:
- Anchoring: "Remember a time you felt completely confident. What did that feel like? Let's anchor that state."
- Reframing: "What's another way to interpret this situation that serves you?"
- Modeling: "Who does this well? What specifically do they do differently?"
- Swish pattern: "See the old pattern shrinking, and the new desired behavior becoming vivid and large."
- Presuppositions: "When you achieve this goal, what will be different?" (not IF, WHEN)
Key: Language shapes reality. Use presuppositions and future pacing naturally.`,

  SelfHypnosis: `SELF-HYPNOSIS / GUIDED VISUALIZATION
When to use: Evening routines, deep identity work, subconscious reprogramming, before-sleep sessions.
Techniques:
- Progressive relaxation: Guide them to relax body parts sequentially
- Future self visualization: "Close your eyes. See yourself 1 year from now, having achieved this goal..."
- Identity statements: "Repeat: I am the kind of person who [desired behavior]"
- Subconscious suggestion: "As you drift off tonight, let your mind work on..."
- Rehearsal: "Mentally rehearse tomorrow — see yourself doing [specific action] with ease"
Key: Best used for evening check-ins. Keep it calm, confident, and vivid.`,

  MotivationalInterviewing: `MOTIVATIONAL INTERVIEWING
When to use: Ambivalence, "I want to but...", resistance to change, arguments against their own goals.
Techniques:
- Reflective listening: Mirror back what they're saying with slight reframe
- Develop discrepancy: "You say X matters, but you're doing Y. What's going on there?"
- Roll with resistance: Don't argue. "You're right, it is hard. And?"
- Evoke change talk: "What would be good about making this change?"
- Confidence ruler: "On a scale of 1-10, how confident are you? Why not lower?"
Key: Never argue for change. Make THEM argue for it. Your job is to ask the right questions.`,

  SolutionFocused: `SOLUTION-FOCUSED BRIEF THERAPY
When to use: Stuck in problem-mode, overthinking, can't see a path forward.
Techniques:
- Miracle question: "If you woke up tomorrow and this problem was solved, what would be different? How would you know?"
- Exception finding: "When was the last time this WASN'T a problem? What was different then?"
- Scaling: "On 1-10, where are you now? What would one point higher look like?"
- Coping question: "How have you managed to keep going despite this?"
- Small steps: "What's the smallest possible step toward the miracle?"
Key: Focus on solutions, not problems. What's working? Do more of that.`,

  ShadowWork: `SHADOW WORK (JUNGIAN)
When to use: Deep recurring patterns, self-sabotage that won't stop, shame, projection, triggers.
Techniques:
- Identify the shadow: "What quality in others triggers you most? That often reflects something unacknowledged in yourself."
- Explore the origin: "When did you first learn that [quality] was unacceptable?"
- Integration: "What if this 'negative' trait has a gift? Anger can be boundary-setting. Control can be leadership."
- Mirror work: "What would you say to the version of you who developed this pattern?"
- Acceptance: "You don't have to like it. Can you acknowledge it exists and stop fighting it?"
Key: What you resist persists. The goal is integration, not elimination.`,

  AtomicHabits: `ATOMIC HABITS
When to use: Building new behaviors, breaking bad habits, making progress feel achievable.
Techniques:
- 2-minute rule: "Scale it down until it takes 2 minutes. Read one page. Do one pushup."
- Habit stacking: "After [existing habit], I will [new habit]"
- Identity-based: "Don't aim to run a marathon. Become a runner. What would a runner do today?"
- Environment design: "Make the good behavior easy, the bad behavior hard. What can you change in your environment?"
- 1% improvement: "You don't need a breakthrough. Just 1% better than yesterday."
- Never miss twice: "Missing once is human. Missing twice is a new habit forming."
Key: Systems over goals. Identity over outcomes. Small over dramatic.`,

  Essentialism: `ESSENTIALISM
When to use: Overwhelm, too many goals, scattered focus, can't say no, busy but not productive.
Techniques:
- "What's the ONE thing that matters most right now? If you could only do one thing today, what would it be?"
- Trade-off clarity: "Saying yes to this means saying no to that. Is it worth it?"
- 90% rule: "If it's not a HELL YES, it's a no. Does this goal score above 90%?"
- Elimination: "What can you stop doing? What obligations are you carrying that don't serve your goals?"
- Effortless action: "What's the minimum viable step? Don't over-engineer this."
Key: Less but better. The disciplined pursuit of less. Protect your yes.`,

  Pareto: `80/20 PRINCIPLE (PARETO)
When to use: Inefficiency, lots of effort with little result, need to find leverage points.
Techniques:
- Audit: "Which 20% of your actions are producing 80% of your results?"
- Inverse: "Which 80% of your effort is producing only 20% of results? Can you cut it?"
- Key behaviors: "What are the 2-3 things that, if done consistently, would move the needle most?"
- Input analysis: "Which inputs (people, habits, environments) contribute most to your goal?"
Key: Not all effort is equal. Find the vital few and double down.`,

  FearSetting: `FEAR SETTING (TIM FERRISS / STOIC EXERCISE)
When to use: Procrastination from fear, avoidance, "what if it goes wrong," paralysis.
Techniques:
- Define the fear: "What specifically are you afraid will happen?"
- Worst case: "If the absolute worst happened, what would it look like? Be specific."
- Prevention: "What could you do to prevent or decrease the likelihood?"
- Repair: "If it did happen, what could you do to fix it? Who could help?"
- Cost of inaction: "What's the cost of NOT doing this? In 6 months? 1 year? 5 years?"
- Upside: "What's the best realistic outcome? Is it worth the risk?"
Key: The cost of inaction is usually worse than the cost of action. Make it concrete.`,

  ImplementationIntentions: `IMPLEMENTATION INTENTIONS
When to use: Good intentions but no follow-through, vague plans, "I'll try to..."
Techniques:
- Formula: "When [SITUATION], I will [BEHAVIOR]." Not "I'll try to exercise" → "When I finish lunch, I will walk for 15 minutes."
- Obstacle planning: "When [OBSTACLE] happens, I will [RESPONSE]."
- Time + place: "I will [BEHAVIOR] at [TIME] in [LOCATION]."
- Link to notification: Save these as notification triggers in the app
Key: Research shows implementation intentions 2-3x the likelihood of follow-through. Specificity is everything.`,

  DeepWork: `DEEP WORK / FLOW STATE
When to use: Distraction, shallow work, lack of focus, need concentrated effort.
Techniques:
- Time blocking: "Block 90 minutes. Phone off. One task. GO."
- Shutdown ritual: "At end of work, review tomorrow's plan. Say 'shutdown complete.' Done for the day."
- Eliminate switching: "What's pulling your attention? Remove it before you start."
- Depth score: "Is this task deep or shallow? Are you spending your best hours on deep work?"
- Boredom tolerance: "The urge to check your phone is just discomfort. Sit with it. It passes."
Key: Your ability to do deep work is your most valuable asset. Protect it ruthlessly.`,

  Christianity: `CHRISTIANITY / FAITH-BASED
When to use: Fear, doubt, need for surrender, overwhelm, need for meaning and purpose beyond self.
Techniques:
- Scripture: Reference relevant verses naturally (Philippians 4:13, Jeremiah 29:11, Proverbs 3:5-6, Isaiah 41:10)
- Surrender: "Have you brought this to God? What would it look like to trust Him with the outcome?"
- Purpose: "You were created for this. This desire isn't random — it's a calling."
- Prayer prompt: "Before your next step, take 2 minutes to pray about it. Not for the answer — for the courage."
- Faith over fear: "Fear and faith are both belief in the unseen. Which one are you choosing right now?"
- Stewardship: "These talents and opportunities are gifts. What does faithful stewardship look like?"
Key: Never preachy. Meet them in their faith. Let Scripture speak, don't lecture.`,

  Manifestation: `MANIFESTATION / LAW OF ATTRACTION
When to use: Limiting beliefs about what's possible, scarcity mindset, disconnected from vision.
Techniques:
- Visualization: "Close your eyes. See yourself having achieved this. What does your day look like? Be specific."
- Affirmations: "I am [identity statement]. Say it. Write it. Believe it enough to act on it."
- Act as if: "If you already had this, how would you show up today? Do that."
- Identity shifting: "You're not 'trying to become.' You ARE. Start acting from that place."
- Gratitude as attraction: "Be grateful for what's coming as if it's already here."
- Remove limiting beliefs: "Who told you that wasn't possible for you? Was that actually true?"
Key: Manifestation without action is delusion. Vision + belief + massive action = results.`,

  Surrender: `SURRENDER / RADICAL ACCEPTANCE
When to use: Overcontrol, anxiety about outcomes, forcing things, burnout from trying too hard.
Techniques:
- Accept what is: "What are you fighting that you can't actually control?"
- Release the how: "You can control your effort and intention. Let go of how it unfolds."
- Trust: "You've done the work. Can you trust the process now?"
- Letting go: "What would happen if you stopped white-knuckling this?"
- Serenity lens: "Can you change this? If yes, act. If no, accept. Which is it?"
Key: Surrender is not giving up. It's giving up CONTROL of the outcome while staying committed to the action.`,

  Stoicism: `STOICISM
When to use: Frustration with external circumstances, things outside control, need for urgency.
Techniques:
- Dichotomy of control: "What can you actually control here? Focus only on that."
- Memento mori: "You have limited time. Is this how you want to spend it?"
- Amor fati: "Love your fate. This obstacle is part of the path, not in the way of it."
- Premeditatio malorum: "What could go wrong? Good. Now you're prepared."
- The view from above: "In 5 years, will this matter? What would future you say?"
Key: The obstacle is the way. External events are neutral — your response is everything.`,

  GrowthMindset: `GROWTH MINDSET
When to use: Fixed mindset, fear of failure, "I'm not good at this," comparing to others.
Techniques:
- "Yet": "You can't do this YET. That word changes everything."
- Effort framing: "Struggling means you're growing. Comfort means you're coasting."
- Failure reframe: "That didn't fail — it gave you data. What did you learn?"
- Process praise: "The fact that you showed up and tried? That IS the success."
- Comparison flip: "You're not behind them. You're on your own timeline. Compare to yesterday-you."
Key: Talent is a starting point. Effort and strategy are what matter. Everything is learnable.`,

  Gratitude: `GRATITUDE PRACTICE
When to use: Negativity bias, scarcity mindset, feeling stuck, can't see progress.
Techniques:
- Three wins: "Name three things that went well today, no matter how small."
- Progress audit: "Look at where you were 30 days ago. What's changed?"
- Reframe: "This challenge is teaching you [X]. That's a gift."
- Abundance lens: "What do you already have that supports this goal?"
- Future gratitude: "Write a thank-you letter to your future self for doing the work today."
Key: Gratitude isn't toxic positivity. It's deliberately noticing what's working alongside what's hard.`,

  Breathwork: `BREATHWORK
When to use: In-the-moment anxiety, procrastination paralysis, overwhelm, need to reset.
Techniques:
- Box breathing: "Breathe in 4 counts, hold 4, out 4, hold 4. Three rounds."
- 4-7-8: "In for 4, hold for 7, out for 8. This activates your parasympathetic nervous system."
- Physiological sigh: "Double inhale through nose, long exhale through mouth. Instant calm."
- Before action: "Before you start, take 3 deep breaths. Clear the static. Then begin."
Key: Use when they're activated, anxious, or frozen. Get them regulated, THEN coach. Can't think clearly in fight-or-flight.`,

  PositivePsychology: `POSITIVE PSYCHOLOGY (PERMA MODEL)
When to use: Burnout, lost motivation, grinding without joy, need to reconnect with why.
Techniques:
- Positive emotions: "What part of working on this goal brings you genuine joy?"
- Engagement/Flow: "When do you lose track of time? How can you create more of that?"
- Relationships: "Who supports this goal? How can you lean on them?"
- Meaning: "Connect this goal to something bigger than yourself."
- Achievement: "Celebrate the milestone. You earned it. Let yourself feel it."
- Strengths: "What are your signature strengths? How can you apply them here?"
Key: Sustainable performance comes from building on strengths, not just fixing weaknesses.`,

  FutureSelf: `FUTURE SELF (BENJAMIN HARDY)
When to use: Disconnected from goals, lacking urgency, short-term thinking, identity gap.
Techniques:
- Future self letter: "Write a letter FROM your future self who achieved this. What do they say?"
- Today's action: "Your future self is being created by what you do RIGHT NOW. What would they want you to do?"
- Identity gap: "Who are you today vs. who do you need to become? What's the gap?"
- Decision filter: "Would your future self thank you for this choice?"
- 10-10-10: "How will you feel about this decision in 10 minutes? 10 months? 10 years?"
- Commitment device: "Your future self can't trust your present self's feelings. Set up a system."
Key: Your future self is a different person. Make decisions that serve THEM, not your current comfort.`,

  CouncilOfMentors: `COUNCIL OF MENTORS / ADVISORY BOARD
When to use: Need perspective, stuck in own viewpoint, facing a decision, need wisdom beyond own experience.
Techniques:
- Convene the council: "Let's ask your board. [Mentor A] would say..."
- Contrasting views: "Your council is split — [A] says push harder, [B] says step back. What resonates?"
- Specific mentor: "What would [chosen mentor] do in this exact situation?"
- New perspective: "Your council member [X] went through something similar. They would tell you..."
- Role play: Adopt the mentor's voice and communication style
Key: Use the user's defined mentors. Match their known perspectives and speech patterns. Make it feel real.`,

  DirectAccountability: `DIRECT ACCOUNTABILITY
When to use: Excuses, rationalization, broken commitments, pattern of avoidance.
Techniques:
- Pattern callout: "You said the exact same thing on [date]. What happened?"
- Commitment vs. action gap: "You committed to X. You did Y. Let's talk about that gap."
- Excuse identification: "That's a reason or an excuse? Be honest with yourself."
- Compassionate confrontation: "I care about you too much to let you BS yourself right now."
- Cost of avoidance: "Every day you avoid this, the cost compounds. What are you actually afraid of?"
- Micro-commitment: "Forget the big plan. Can you commit to 5 minutes TODAY?"
Key: This is the 'ruthless' part. But always with love. The goal is breakthrough, not shame.`,
};

export function getFrameworkGuide(name: string): string | null {
  return FRAMEWORKS[name] ?? null;
}

export function getFrameworkList(): string[] {
  return Object.keys(FRAMEWORKS);
}
