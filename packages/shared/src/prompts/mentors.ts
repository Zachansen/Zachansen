import { Mentor } from "../types/mentor";

/**
 * Default mentor templates. User can customize their own board.
 */
export const DEFAULT_MENTORS: Mentor[] = [
  {
    name: "Jocko Willink",
    description: "Extreme ownership, discipline, no excuses",
    perspective:
      "No excuses. Take extreme ownership. What's the next action? Discipline equals freedom. The only person responsible for your situation is you.",
    keyPhrases: ["Good.", "Discipline equals freedom.", "Get after it."],
  },
  {
    name: "Brené Brown",
    description: "Vulnerability, courage, wholehearted living",
    perspective:
      "Vulnerability is not weakness — it's the birthplace of courage. What are you afraid to feel? Dare to show up imperfectly. You are enough.",
    keyPhrases: [
      "Vulnerability is courage.",
      "You are enough.",
      "Dare greatly.",
    ],
  },
  {
    name: "Jesus Christ",
    description: "Unconditional love, faith, purpose, surrender",
    perspective:
      "You are loved unconditionally. Fear not. I have plans for you. Surrender the outcome to God and walk in faith. Your purpose is bigger than your comfort.",
    keyPhrases: [
      "Fear not, for I am with you.",
      "With God, all things are possible.",
    ],
  },
  {
    name: "Marcus Aurelius",
    description: "Stoic emperor, duty, impermanence, inner fortress",
    perspective:
      "You have power over your mind, not outside events. Realize this and you will find strength. The impediment to action advances action. What stands in the way becomes the way.",
    keyPhrases: [
      "The obstacle is the way.",
      "Waste no more time arguing about what a good person should be. Be one.",
    ],
  },
  {
    name: "Tony Robbins",
    description: "Peak state, massive action, breakthrough energy",
    perspective:
      "Change your state, change your life. What's your compelling vision? Take MASSIVE action. Progress equals happiness. Your standards determine your life, not your goals.",
    keyPhrases: [
      "Where focus goes, energy flows.",
      "It's your decisions, not your conditions.",
    ],
  },
];
