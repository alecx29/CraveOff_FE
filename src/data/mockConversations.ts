export interface Message {
  id: string;
  sender: "user" | "oria";
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  lastUpdated: string;
  messages: Message[];
}

export const mockConversations: Conversation[] = [
  {
    id: "1",
    title: "Dealing with urges",
    lastUpdated: "2023-11-05T14:30:00Z",
    messages: [
      {
        id: "1-1",
        sender: "user",
        text: "I'm having really strong urges today. What should I do?",
        timestamp: "2023-11-05T14:30:00Z",
      },
      {
        id: "1-2",
        sender: "oria",
        text: "I understand that urges can be challenging. Remember that urges are temporary and will pass. Try the HALT method - are you Hungry, Angry, Lonely, or Tired? Addressing these needs can help reduce urges.",
        timestamp: "2023-11-05T14:31:00Z",
      },
      {
        id: "1-3",
        sender: "user",
        text: "I think I'm mostly lonely. I've been alone all day.",
        timestamp: "2023-11-05T14:32:30Z",
      },
      {
        id: "1-4",
        sender: "oria",
        text: "Loneliness can definitely trigger urges. Consider reaching out to a friend or family member for a chat. Even a brief conversation can help. If that's not possible, try engaging in a social activity online or go to a public place like a café or library where you can be around others. Remember that connecting with others is a healthy way to meet your emotional needs.",
        timestamp: "2023-11-05T14:33:45Z",
      },
      {
        id: "1-5",
        sender: "user",
        text: "That's good advice. I'll call my friend and see if they want to grab coffee.",
        timestamp: "2023-11-05T14:35:10Z",
      },
      {
        id: "1-6",
        sender: "oria",
        text: "That sounds like a great plan! Social connection is one of the best counters to urges. Let me know how it goes, and remember you can always use the panic button in the app if urges become overwhelming.",
        timestamp: "2023-11-05T14:36:20Z",
      },
    ],
  },
  {
    id: "2",
    title: "Recovery progress",
    lastUpdated: "2023-11-12T09:45:00Z",
    messages: [
      {
        id: "2-1",
        sender: "user",
        text: "I've been clean for 2 weeks now. Does recovery get easier?",
        timestamp: "2023-11-12T09:45:00Z",
      },
      {
        id: "2-2",
        sender: "oria",
        text: "Congratulations on your 2 weeks! That's a significant achievement. Recovery typically follows a pattern where the initial days can be the hardest, followed by a period of adjustment. Many people report that it does get easier as your brain rewires and new habits form, but there may still be challenging moments along the way.",
        timestamp: "2023-11-12T09:46:30Z",
      },
      {
        id: "2-3",
        sender: "user",
        text: "That's good to hear. I've noticed I'm sleeping better and have more energy.",
        timestamp: "2023-11-12T09:48:00Z",
      },
      {
        id: "2-4",
        sender: "oria",
        text: "Those are excellent signs! Better sleep and increased energy are common benefits of recovery. Your brain is healing and returning to a more natural state. Keep track of these positive changes - they can be powerful motivators when challenges arise. What other improvements have you noticed?",
        timestamp: "2023-11-12T09:49:15Z",
      },
      {
        id: "2-5",
        sender: "user",
        text: "I'm more focused at work, and I feel less anxious overall.",
        timestamp: "2023-11-12T09:51:00Z",
      },
      {
        id: "2-6",
        sender: "oria",
        text: "Improved focus and reduced anxiety are significant benefits! They show how recovery positively impacts multiple areas of your life. These improvements often continue and strengthen the longer you maintain your recovery. Keep going - you're doing great work, and the benefits will continue to multiply over time.",
        timestamp: "2023-11-12T09:52:30Z",
      },
    ],
  },
  {
    id: "3",
    title: "Building healthy habits",
    lastUpdated: "2023-11-18T18:15:00Z",
    messages: [
      {
        id: "3-1",
        sender: "user",
        text: "What healthy habits should I develop to support my recovery?",
        timestamp: "2023-11-18T18:15:00Z",
      },
      {
        id: "3-2",
        sender: "oria",
        text: "Building healthy habits is crucial for long-term recovery. Some key habits to consider include: regular exercise, consistent sleep schedule, mindfulness or meditation practice, nutritious eating, social connection, and creative outlets or hobbies. Which of these areas are you most interested in developing?",
        timestamp: "2023-11-18T18:16:45Z",
      },
      {
        id: "3-3",
        sender: "user",
        text: "I think exercise and meditation would be good starting points for me.",
        timestamp: "2023-11-18T18:18:30Z",
      },
      {
        id: "3-4",
        sender: "oria",
        text: "Those are excellent choices! For exercise, start small with just 15-20 minutes daily, something you enjoy like walking, jogging, or yoga. For meditation, try 5 minutes daily using the app's meditation feature. Consistency is more important than duration when building habits. Would you like specific suggestions for either of these?",
        timestamp: "2023-11-18T18:20:00Z",
      },
      {
        id: "3-5",
        sender: "user",
        text: "Some meditation tips would be helpful. I've never really done it before.",
        timestamp: "2023-11-18T18:21:45Z",
      },
      {
        id: "3-6",
        sender: "oria",
        text: 'For beginners, I recommend starting with guided meditation. Try the "Deep Breathing" feature in the app. Find a quiet place, sit comfortably, and focus on your breath. When your mind wanders (which is normal), gently bring attention back to your breathing. Start with 3-5 minutes daily, then gradually increase. Morning or evening routines help establish consistency. Remember, meditation is a skill that improves with practice.',
        timestamp: "2023-11-18T18:23:30Z",
      },
      {
        id: "3-7",
        sender: "user",
        text: "Thanks, that sounds doable. I'll try it tonight.",
        timestamp: "2023-11-18T18:25:00Z",
      },
      {
        id: "3-8",
        sender: "oria",
        text: "Wonderful! I look forward to hearing about your experience. Remember, the key is consistency rather than perfection. Even a few minutes daily can have significant benefits for your recovery journey and overall wellbeing.",
        timestamp: "2023-11-18T18:26:15Z",
      },
    ],
  },
];

export default mockConversations;
