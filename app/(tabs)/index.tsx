import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal, FlatList, TextInput, ActivityIndicator, TouchableWithoutFeedback, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming, Easing, useAnimatedScrollHandler, useAnimatedRef, runOnJS, withRepeat, SlideInDown, SlideOutUp } from 'react-native-reanimated';
import { router } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';

import { useTheme } from '@/src/context/ThemeProvider';
import { useUser } from '@/src/context/UserContext';
import { useLogs, LogEntry } from '@/src/context/LogsContext';
import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';
import PledgeModal from '@/src/components/PledgeModal';
import PanicModal from '@/src/components/PanicModal';
import ReflectionModal from '@/src/components/ReflectionModal';
import RelapsedModal from '@/src/components/RelapsedModal';
import { apiClient } from '@/src/axios/apiClient';
import { BackendRoutes } from '@/src/axios/backendRoutes';
import WeekBar from '@/src/components/WeekBar';
import oriaService, { StreamEventSource } from '@/src/services/oriaService';
import quotesService from '@/src/services/quotesService';
import { OriaChat, OriaChatWithMessages, SendMessageResponse } from '@/src/types/oria';
import { usePledge } from '@/src/context/PledgeContext';
import PetComingSoonModal from '@/src/components/PetComingSoonModal';
import LeaderboardComingSoon from '@/src/components/LeaderboardComingSoon';
import { useAchievements } from '@/src/context/AchievementsContext';
import { LinearGradient } from 'expo-linear-gradient';
import HomeTopBar from '@/src/components/header/HomeTopBar';
import ContentBlockerComingSoonModal from '@/src/components/ContentBlockerComingSoonModal';

// Helper function to format time with more precision
const formatTimeCounter = (seconds: number) => {
  // Ensure we're working with a positive number
  seconds = Math.max(0, seconds);
  
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  return {
    days,
    hours,
    minutes,
    seconds: remainingSeconds
  };
};

// Helper to determine which time units to display
const getVisibleTimeUnits = (time: ReturnType<typeof formatTimeCounter>) => {
  if (time.days > 0) {
    // If we have days, show days and hours
    return { showDays: true, showHours: true, showMinutes: true, showSeconds: false };
  } else if (time.hours > 0) {
    // If we have hours but no days, show hours, minutes and seconds
    return { showDays: false, showHours: true, showMinutes: true, showSeconds: true };
  } else {
    // If we only have minutes or seconds, show both
    return { showDays: false, showHours: false, showMinutes: true, showSeconds: true };
  }
};

// Get the largest time unit to display at the top
const getLargestTimeUnit = (time: ReturnType<typeof formatTimeCounter>) => {
  if (time.days > 0) {
    return { 
      unit: 'days', 
      value: time.days, 
      formattedText: `${time.days} ${time.days === 1 ? 'Day' : 'Days'}`
    };
  } else if (time.hours > 0) {
    return { 
      unit: 'hours', 
      value: time.hours, 
      formattedText: `${time.hours} ${time.hours === 1 ? 'Hour' : 'Hours'}`
    };
  } else if (time.minutes > 0) {
    return { 
      unit: 'minutes', 
      value: time.minutes, 
      formattedText: `${time.minutes} ${time.minutes === 1 ? 'Minute' : 'Minutes'}`
    };
  } else {
    return { 
      unit: 'seconds', 
      value: time.seconds, 
      formattedText: `${time.seconds} ${time.seconds === 1 ? 'Second' : 'Seconds'}`
    };
  }
};

// Get smaller time units to display in the bubble
const getSmallerTimeUnits = (time: ReturnType<typeof formatTimeCounter>, largestUnit: string) => {
  const units = [];
  
  if (largestUnit !== 'days' && time.days > 0) {
    units.push(`${time.days} ${time.days === 1 ? 'Day' : 'Days'}`);
  }
  
  if (largestUnit !== 'hours' && time.hours > 0) {
    units.push(`${time.hours.toString().padStart(2, '0')}hr`);
  }
  
  if (largestUnit !== 'minutes' && time.minutes > 0) {
    units.push(`${time.minutes.toString().padStart(2, '0')}m`);
  }
  
  if (largestUnit !== 'seconds' && time.seconds > 0) {
    units.push(`${time.seconds.toString().padStart(2, '0')}s`);
  }
  
  return units;
};

// Helper function to get the date string for a specific day of the week
const getDateStringForDay = (dayIndex: number, weekOffset: number = 0): string => {
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate the difference between the target day and current day
  // Add weekOffset * 7 to move to previous/next weeks
  const diff = dayIndex - currentDayOfWeek + (weekOffset * 7);
  
  // Create a new date by adding the difference
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + diff);
  
  // Format the date as YYYY-MM-DD
  return targetDate.toISOString().split('T')[0];
};

// Interface for pledge data
interface PledgeData {
  id: string;
  user_id: string;
  check_in_at: string;
}

interface PledgeHistoryResponse {
  pledges: PledgeData[];
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const oriaInsets = useSafeAreaInsets();
  const { user } = useUser();
  const { logs, lastRelapseData, fetchLogs, isLoading } = useLogs();
  const { refreshFromApi } = useAchievements();
  const styles = createStyles(theme);
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = screenWidth - 40; // Define card width as a constant
  const cardTotalWidth = cardWidth + 40; // Total width including margins
  
  // State for showing the pledge modal
  const [showPledgeModal, setShowPledgeModal] = useState(false);
  
  // State for showing the panic modal
  const [showPanicModal, setShowPanicModal] = useState(false);
  
  // State for showing the reflection modal
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  
  // State for showing the relapsed modal
  const [showRelapsedModal, setShowRelapsedModal] = useState(false);
  
  // State for showing the Oria chat modal
  const [showOriaModal, setShowOriaModal] = useState(false);
  
  // State pentru showing the coming soon modal for Pet
  const [showPetModal, setShowPetModal] = useState(false);
  // State for showing Content Blocker Coming Soon
  const [showContentBlockerModal, setShowContentBlockerModal] = useState(false);
  
  // State for selected conversation
  const [selectedChat, setSelectedChat] = useState<OriaChatWithMessages | null>(null);
  
  // State for chats list
  const [chats, setChats] = useState<OriaChat[]>([]);
  
  // State for loading states
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  
  // State for tracking if response is being generated
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  
  // State for new message
  const [newMessage, setNewMessage] = useState('');
  
  // State for week logs status
  const [weekLogsStatus, setWeekLogsStatus] = useState<Array<'clean' | 'not-clean' | 'no-log'>>([
    'no-log', 'no-log', 'no-log', 'no-log', 'no-log', 'no-log', 'no-log'
  ]);
  
  // State for previous week's logs status
  const [previousWeekLogsStatus, setPreviousWeekLogsStatus] = useState<Array<'clean' | 'not-clean' | 'no-log'>>([
    'no-log', 'no-log', 'no-log', 'no-log', 'no-log', 'no-log', 'no-log'
  ]);
  
  // State for clean days - updated based on last relapse
  const [cleanDays, setCleanDays] = useState(0);
  
  // State for timer - updated based on last relapse
  const [timerSeconds, setTimerSeconds] = useState(0);
  const formattedTime = formatTimeCounter(timerSeconds);
  
  // State for quote
  const [quote, setQuote] = useState("Progress, not perfection, is the goal.");
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  
  // Animated values for the loading indicator
  const loadingScale = useSharedValue(1);
  const loadingOpacity = useSharedValue(1);
  
  // Initialize loading animation
  useEffect(() => {
    // Create pulsing animation for the loading indicator
    loadingScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 600, easing: Easing.ease }),
        withTiming(0.8, { duration: 600, easing: Easing.ease })
      ),
      -1,
      true
    );
    
    loadingOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600, easing: Easing.ease }),
        withTiming(0.5, { duration: 600, easing: Easing.ease })
      ),
      -1,
      true
    );
  }, []);

  // Kick off achievements fetch asynchronously when Home mounts
  useEffect(() => {
    refreshFromApi();
  }, []);
  
  // Animated style for loading indicator
  const loadingIndicatorStyle = useAnimatedStyle(() => {
    return {
      width: '100%',
      height: '100%',
      borderRadius: 6,
      transform: [{ scale: loadingScale.value }],
      opacity: loadingOpacity.value,
    };
  });
  
  // Calculate clean days and timer based on last relapse date
  useEffect(() => {
    console.log('lastRelapseData in timer calculation:', JSON.stringify(lastRelapseData, null, 2));
    
    if (lastRelapseData && lastRelapseData.last_relapse_date) {
      try {
        console.log('Processing last_relapse_date:', lastRelapseData.last_relapse_date);
        
        // Parse the relapse date which comes in UTC format
        const relapseDateTime = new Date(lastRelapseData.last_relapse_date);
        
        // Check if the date is valid
        if (isNaN(relapseDateTime.getTime())) {
          console.error('Invalid date format:', lastRelapseData.last_relapse_date);
          setCleanDays(0);
          setTimerSeconds(0);
          return;
        }
        
        // Log date information
        console.log('Relapse date (UTC):', relapseDateTime.toISOString());
        console.log('Relapse date (Local):', relapseDateTime.toString());
        
        // Get current time
        const now = new Date();
        console.log('Current time (UTC):', now.toISOString());
        console.log('Current time (Local):', now.toString());
        
        // Calculate the time difference in milliseconds using UTC time values to avoid timezone issues
        // This works because both Date objects know their UTC time regardless of local timezone
        const diffTimeMs = now.getTime() - relapseDateTime.getTime();
        console.log('Time difference in ms:', diffTimeMs);
        console.log('Time difference in hours:', diffTimeMs / (1000 * 60 * 60));
        
        // Only proceed if the relapse date is in the past
        if (diffTimeMs > 0) {
          // Calculate seconds since relapse
          const diffSeconds = Math.floor(diffTimeMs / 1000);
          
          // Calculate days based on seconds (1 day = 24 hours = 86400 seconds)
          const diffDays = Math.floor(diffTimeMs / (24 * 3600 * 1000));
          
          console.log(`Setting timer: ${diffDays} days, ${diffSeconds} seconds`);
          setCleanDays(diffDays);
          setTimerSeconds(diffSeconds);
          
          console.log(`Last relapse was on ${relapseDateTime.toLocaleString()} (${diffDays} days, ${diffSeconds} seconds ago)`);
        } else {
          console.log('Last relapse date is in the future, resetting to 0');
          setCleanDays(0);
          setTimerSeconds(0);
        }
      } catch (e) {
        console.error('Error parsing or calculating time from last_relapse_date:', e);
        setCleanDays(0);
        setTimerSeconds(0);
      }
    } else {
      console.log('No last relapse date available');
      setCleanDays(0);
      setTimerSeconds(0);
    }
  }, [lastRelapseData]);
  
  // Update timer continuously based on the last relapse date
  useEffect(() => {
    if (lastRelapseData && lastRelapseData.last_relapse_date) {
      try {
        // Parse the relapse date (in UTC format)
        const relapseDateTime = new Date(lastRelapseData.last_relapse_date);
        
        // Check if the date is valid
        if (isNaN(relapseDateTime.getTime())) {
          console.error('Invalid date format in timer update:', lastRelapseData.last_relapse_date);
          return;
        }
        
        console.log('Setting up continuous timer with relapse date (UTC):', relapseDateTime.toISOString());
        
        // Update every second
        const interval = setInterval(() => {
          // Get current time
          const now = new Date();
          
          // Calculate the time difference in milliseconds using UTC time values
          const diffTimeMs = now.getTime() - relapseDateTime.getTime();
          
          // Only update if the relapse date is in the past
          if (diffTimeMs > 0) {
            // Calculate seconds since relapse
            const diffSeconds = Math.floor(diffTimeMs / 1000);
            setTimerSeconds(diffSeconds);
            
            // Calculate days based on seconds (1 day = 24 hours = 86400 seconds)
            const diffDays = Math.floor(diffTimeMs / (24 * 3600 * 1000));
            setCleanDays(diffDays);
          }
        }, 1000);
        
        return () => clearInterval(interval);
      } catch (e) {
        console.error('Error in timer update effect:', e);
        
        // Fall back to manual increment
        const interval = setInterval(() => {
          setTimerSeconds(prev => prev + 1);
        }, 1000);
        
        return () => clearInterval(interval);
      }
    } else {
      // If no last relapse data, increment timer manually
      const interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [lastRelapseData]);
  
  // Fetch daily quote when component mounts
  useEffect(() => {
    console.log('Fetching daily quote...');
    fetchDailyQuote();
  }, []);
  
  // Determine current day
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // State pentru widget activ
  const [activeWidgetIndex, setActiveWidgetIndex] = useState(0);
  const scrollX = useSharedValue(0);
  const flatListRef = useAnimatedRef<Animated.ScrollView>();
  
  // Animație pentru butonul cu animăluț
  const petScale = useSharedValue(1);
  const petRotate = useSharedValue(0);
  
  const animatePet = () => {
    // Animație de scale
    petScale.value = withSequence(
      withSpring(1.3, { damping: 2, stiffness: 80 }),
      withSpring(1, { damping: 4, stiffness: 100 })
    );
    
    // Animație de rotație
    petRotate.value = withSequence(
      withTiming(-36, { duration: 100, easing: Easing.ease }),
      withTiming(36, { duration: 200, easing: Easing.ease }),
      withTiming(-18, { duration: 150, easing: Easing.ease }),
      withTiming(0, { duration: 100, easing: Easing.ease })
    );
  };
  
  const petAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: petScale.value },
        { rotate: `${petRotate.value}deg` }
      ]
    };
  });
  
  const onScrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
      // Calculate current index based on scroll position
      const currentIndex = Math.round(event.contentOffset.x / cardTotalWidth);
      if (currentIndex !== activeWidgetIndex) {
        runOnJS(setActiveWidgetIndex)(currentIndex);
      }
    },
    onMomentumEnd: (event) => {
      const index = Math.round(event.contentOffset.x / cardTotalWidth);
      runOnJS(setActiveWidgetIndex)(index);
    },
  });
  
  // Process logs to determine week status
  useEffect(() => {
    console.log('Logs data received:', logs);
    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      console.log('No valid logs data available, using default empty status');
      return;
    }
    
    // Create a map of dates to their log status
    const logMap = new Map<string, boolean>();
    logs.forEach((log: LogEntry) => {
      // Handle datetime string (extract just the date part)
      const dateStr = log.date.split('T')[0]; // Extract YYYY-MM-DD from datetime
      logMap.set(dateStr, log.is_clean);
    });
    
    console.log('Processed log map:', Object.fromEntries(logMap));
    
    // Update week status based on logs
    const newWeekStatus = Array(7).fill('no-log').map((_, index) => {
      const dateStr = getDateStringForDay(index);
      if (!logMap.has(dateStr)) return 'no-log';
      return logMap.get(dateStr) ? 'clean' : 'not-clean';
    });
    
    // Calculate previous week's status
    const previousWeekStatus = Array(7).fill('no-log').map((_, index) => {
      const dateStr = getDateStringForDay(index, -1); // -1 week offset
      if (!logMap.has(dateStr)) return 'no-log';
      return logMap.get(dateStr) ? 'clean' : 'not-clean';
    });
    
    console.log('New week status:', newWeekStatus);
    console.log('Previous week status:', previousWeekStatus);
    
    setWeekLogsStatus(newWeekStatus as Array<'clean' | 'not-clean' | 'no-log'>);
    setPreviousWeekLogsStatus(previousWeekStatus as Array<'clean' | 'not-clean' | 'no-log'>);
  }, [logs]);
  
  
  // Widget indicators style
  const getIndicatorStyle = (index: number) => {
    return {
      ...styles.indicator,
      backgroundColor: index === activeWidgetIndex 
        ? theme.colors.primary 
        : theme.colors.textMuted,
      width: index === activeWidgetIndex ? 24 : 8,
    };
  };
  
  // Navigate to specific widget
  const navigateToWidget = (index: number) => {
    flatListRef.current?.scrollTo({ x: index * cardTotalWidth, animated: true });
    setActiveWidgetIndex(index);
  };
  
  // Calculate brain rewiring progress (percentage towards 21 days)
  const calculateBrainRewiring = () => {
    const GOAL_HOURS = 90 * 24; // 90 days in hours
    const currentHours = timerSeconds / 3600; // Convert seconds to hours
    
    // Calculate percentage (0 to 100)
    const percentage = Math.min(100, Math.round((currentHours / GOAL_HOURS) * 100));
    
    return {
      percentage,
      width: `${percentage}%`
    };
  };
  
  // Calculate brain rewiring progress whenever timerSeconds changes
  const [brainRewiring, setBrainRewiring] = useState({ percentage: 0, width: '0%' });
  
  useEffect(() => {
    setBrainRewiring(calculateBrainRewiring());
  }, [timerSeconds]);
  
  // Animație pentru progress bar
  const progressWidth = useSharedValue(0);
  const progressShimmer = useSharedValue(0);
  const growingGlow = useSharedValue(0);
  const movingDot = useSharedValue(0);
  
  useEffect(() => {
    // Update the animated value for progress width
    progressWidth.value = withTiming(parseFloat(brainRewiring.width) / 100, { 
      duration: 800, 
      easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
    });
    
    // Setează animația de shimmer
    progressShimmer.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    
    // Add animation for the growing indicator glow effect
    growingGlow.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [brainRewiring]);
  
  // Animated pulse effect for progress bar
  const pulseAnim = useSharedValue(1);
  
  useEffect(() => {
    // Create a subtle pulsing effect for the progress bar
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);
  
  const progressAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: `${progressWidth.value * 100}%`,
      opacity: 0.7 + (progressShimmer.value * 0.3),
      transform: [{ scaleY: pulseAnim.value }],
    };
  });
  
  // Active growing indicator - small dot at the end of the progress bar
  const growingIndicatorStyle = useAnimatedStyle(() => {
    const shadowOpacityValue = 0.5 + (growingGlow.value * 0.5);
    const shadowRadiusValue = 4 + (growingGlow.value * 4);
    const elevationValue = 2 + (growingGlow.value * 3);
    
    return {
      opacity: 0.7 + (growingGlow.value * 0.3),
      transform: [
        { scale: 0.9 + (growingGlow.value * 0.4) }
      ],
      // Eliminăm proprietățile de umbră din stilul animat
      // Acestea vor fi aplicate prin stilul static styles.growingIndicator
    };
  });

  // Handle relapse and reset counter
  const handleResetCounter = () => {
    // Create today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Create log entry for relapse
    const logEntry = {
      date: today,
      is_clean: false
    };
    
    // Call API to add a log entry for the relapse
    apiClient.post(BackendRoutes.LOGS, logEntry)
      .then(response => {
        console.log('Relapse log added:', response.data);
        // Refresh logs and counters
        fetchLogs();
        // Refresh pledge history to update pledge status after reset
        fetchPledgeHistory();
      })
      .catch(error => {
        console.error('Error recording relapse log:', error);
      });
  };

  // Ref for chat scrolling
  const chatScrollRef = useRef<FlatList>(null);
  const titleInputRef = useRef<TextInput>(null);
  
  // Function to format timestamp for chat messages
  const formatChatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Function to format date
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  // Function to fetch all chats
  const fetchChats = async () => {
    try {
      setIsLoadingChats(true);
      const chatsList = await oriaService.getAllChats();
      setChats(chatsList);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setIsLoadingChats(false);
    }
  };
  
  // Function to fetch a specific chat
  const fetchChat = async (chatId: string) => {
    try {
      setIsLoadingChat(true);
      const chat = await oriaService.getChat(chatId);
      setSelectedChat(chat);
    } catch (error) {
      console.error(`Error fetching chat ${chatId}:`, error);
    } finally {
      setIsLoadingChat(false);
    }
  };
  
  // Function to send a message
  const sendMessage = async () => {
    if (!selectedChat || !newMessage.trim()) return;
    
    try {
      const messageContent = newMessage.trim();
      setNewMessage('');
      
      // Immediately add the user message to the chat UI
      const tempUserMessage = {
        id: `temp-${Date.now()}`,
        role: 'user' as "user",
        content: messageContent,
        created_at: new Date().toISOString(),
      };
      
      // Add the temporary user message to the UI
      setSelectedChat(prevChat => {
        if (!prevChat) return prevChat;
        return {
          ...prevChat,
          messages: [...prevChat.messages, tempUserMessage]
        };
      });
      
      // Scroll to bottom to show the message
      setTimeout(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true });
      }, 50);
      
      // Set states to indicate response generation
      setIsSendingMessage(true);
      setIsGeneratingResponse(true);
      
      // Create a temporary placeholder for the assistant's response with loading indicator
      const tempAssistantMessage = {
        id: `temp-assistant-${Date.now()}`,
        role: 'assistant' as "assistant",
        content: "",
        created_at: new Date().toISOString(),
        isLoading: true, // Flag to indicate this is a loading message
      };
      
      // Add the empty assistant message to the UI with loading indicator
      console.log("Adding temporary assistant message:", tempAssistantMessage);
      setSelectedChat(prevChat => {
        if (!prevChat) return prevChat;
        console.log("Adding temp message to chat with", prevChat.messages.length, "existing messages");
        return {
          ...prevChat,
          messages: [...prevChat.messages, tempAssistantMessage]
        };
      });
      
      // Set up a timeout to detect if no response is received
      const responseTimeoutId = setTimeout(() => {
        console.log("Response timeout triggered after 15 seconds");
        // If we still have a loading message, update it with an error
        setSelectedChat(prevChat => {
          if (!prevChat) return prevChat;
          
          const updatedMessages = [...prevChat.messages];
          const lastIndex = updatedMessages.length - 1;
          
          // Check if the last message is still loading
          if (updatedMessages[lastIndex].isLoading) {
            updatedMessages[lastIndex] = {
              ...updatedMessages[lastIndex],
              isLoading: false,
              content: "I couldn't generate a response at this time. Please try again.",
            };
          }
          
          return {
            ...prevChat,
            messages: updatedMessages,
          };
        });
        
        setIsGeneratingResponse(false);
        setIsSendingMessage(false);
      }, 15000); // 15 seconds timeout
      
      // Send the message to the API - may return an EventSource for streaming or a regular response
      const response = await oriaService.sendMessage(selectedChat.id, { 
        content: messageContent,
        chat_id: selectedChat.id
      });
      
      // Clear the timeout since we received a response
      clearTimeout(responseTimeoutId);
      
      // Prefer HTTP payload when available; otherwise handle streaming
      const isHttpResponse = (resp: any): resp is SendMessageResponse => !!resp && typeof resp === 'object' && typeof resp.content === 'string';
      if (isHttpResponse(response)) {
        // Non-streaming mode - use the HTTP response payload directly
        const result = response as SendMessageResponse;
        const hasContent = typeof result.content === 'string' && result.content.length > 0;
        console.log('HTTP result received:', {
          id: result.id,
          len: hasContent ? result.content.length : 0,
          time: result.created_at,
        });
        
        setSelectedChat(prevChat => {
          if (!prevChat) return prevChat;
          
          const updatedMessages = [...prevChat.messages];
          // Find the latest assistant loading bubble (more robust than assuming last index)
          let loadingIdx = -1;
          for (let i = updatedMessages.length - 1; i >= 0; i--) {
            const msg = updatedMessages[i];
            if (msg.role === 'assistant' && (msg as any).isLoading) {
              loadingIdx = i;
              break;
            }
          }

          if (loadingIdx !== -1) {
            console.log('Updating loading bubble at index', loadingIdx, 'with content length', hasContent ? result.content.length : 0);
            // Update placeholder atomically with final content
            updatedMessages[loadingIdx] = {
              ...updatedMessages[loadingIdx],
              id: result.id,
              content: result.content,
              created_at: result.created_at,
              isLoading: false,
            };
          } else if (hasContent) {
            // No loading bubble found; append as a new assistant message with content
            updatedMessages.push({
              id: result.id,
              role: 'assistant',
              content: result.content,
              created_at: result.created_at,
            });
            console.log('Appended assistant message, new total:', updatedMessages.length);
          }
          
          return {
            ...prevChat,
            messages: updatedMessages,
          };
        });
        
        setIsGeneratingResponse(false);
        setIsSendingMessage(false);
      } else if (response && typeof (response as any).onmessage === 'function' && typeof (response as any).close === 'function') {
        // This is streaming mode
        let assistantMessageContent = '';
        let hasReceivedFirstChunk = false;
        let isProcessing = false; // Prevent concurrent updates
        let updateTimeout: ReturnType<typeof setTimeout> | null = null; // For throttling UI updates
        
        // Listen for message events
        console.log("Setting up onmessage handler for streaming response");
        response.onmessage = (event) => {
          // Prevent concurrent processing
          if (isProcessing) {
            console.log("⏸️ Skipping concurrent message processing");
            return;
          }
          isProcessing = true;
          
          try {
            console.log("🔥 Processing streaming chunk:", event.data);
            const data = JSON.parse(event.data);
            
            // Determine if this is the first chunk and mark received
            const isFirstChunk = !hasReceivedFirstChunk;
            if (isFirstChunk) {
              hasReceivedFirstChunk = true;
              console.log("✅ First chunk received");
            }
            
            // Follow backend spec: append chunks as-is; on done=true replace with full final content
            const incoming = typeof data.content === 'string' ? data.content : '';
            const prevLen = assistantMessageContent.length;
            let action = 'append';
            if (data.done) {
              assistantMessageContent = incoming; // Final content identical with DB
              action = 'final_replace';
            } else {
              // Compare on normalized forms to handle diacritics/Unicode composition
              const normalizedIncoming = (incoming || '').normalize('NFC');
              const normalizedCurrent = (assistantMessageContent || '').normalize('NFC');
              
              if (normalizedIncoming.startsWith(normalizedCurrent)) {
                // Cumulative: replace with the new full content (keep original incoming bytes)
                assistantMessageContent = incoming;
                action = 'replace_cumulative';
              } else if (
                normalizedCurrent.endsWith(normalizedIncoming) ||
                (normalizedIncoming && normalizedCurrent.indexOf(normalizedIncoming) >= 0)
              ) {
                // Incoming already present in current (dup); do nothing
                action = 'noop_duplicate';
              } else {
                // Delta: append as-is
                assistantMessageContent += incoming;
                action = 'append_delta';
              }
            }
            console.log('STREAM_DECISION', { action, prevLen, incLen: incoming.length, newLen: assistantMessageContent.length, done: data.done });
            
            // Throttle UI updates for smoother streaming (update immediately on first chunk)
            const updateUI = () => {
              setSelectedChat(prevChat => {
                if (!prevChat) return prevChat;
                
                const updatedMessages = [...prevChat.messages];
                const lastIndex = updatedMessages.length - 1;
                
                // Update the last message if it's from the assistant
                if (updatedMessages[lastIndex] && updatedMessages[lastIndex].role === 'assistant') {
                  updatedMessages[lastIndex] = {
                    ...updatedMessages[lastIndex],
                    content: assistantMessageContent,
                    isLoading: false,
                  };
                }
                
                return {
                  ...prevChat,
                  messages: updatedMessages,
                };
              });
              
              // Scroll to bottom smoothly
              setTimeout(() => {
                chatScrollRef.current?.scrollToEnd({ animated: true });
              }, 16);
            };
            
            // Update immediately for first chunk, then throttle subsequent updates (~20fps)
            if (isFirstChunk) {
              updateUI();
            } else if (!updateTimeout) {
              updateTimeout = setTimeout(() => {
                updateTimeout = null;
                updateUI();
              }, 50);
            }
            
            // If this is the last chunk, clean up
            if (data.done) {
              console.log("🏁 Streaming complete");
              
              // Clear any pending UI updates
              if (updateTimeout) {
                clearTimeout(updateTimeout);
                updateTimeout = null;
              }
              
              // Final UI update with complete message
              updateUI();
              
              // If backend provided the final message id, update the temp assistant message id
              if (data.id) {
                setSelectedChat(prevChat => {
                  if (!prevChat) return prevChat;
                  
                  const updatedMessages = [...prevChat.messages];
                  const lastIndex = updatedMessages.length - 1;
                  
                  if (updatedMessages[lastIndex] && updatedMessages[lastIndex].role === 'assistant') {
                    updatedMessages[lastIndex] = {
                      ...updatedMessages[lastIndex],
                      id: data.id,
                    };
                  }
                  
                  return {
                    ...prevChat,
                    messages: updatedMessages,
                  };
                });
              }
              
              setIsGeneratingResponse(false);
              setIsSendingMessage(false);
              response.close();
              
              // Log the final assistant message after stream closes
              try {
                const finalContent = assistantMessageContent || '';
                console.log('CHAT_STREAM_LAST_MESSAGE_FINAL', {
                  id: data.id || 'unknown',
                  length: finalContent.length,
                  content: finalContent,
                });
              } catch (e) {
                console.log('CHAT_STREAM_LAST_MESSAGE_FINAL_LOG_ERROR', e);
              }
            }
          } catch (error) {
            console.error('❌ Error processing streaming message:', error);
            
            // Update the message to show an error
            setSelectedChat(prevChat => {
              if (!prevChat) return prevChat;
              
              const updatedMessages = [...prevChat.messages];
              const lastIndex = updatedMessages.length - 1;
              
              if (updatedMessages[lastIndex] && updatedMessages[lastIndex].role === 'assistant') {
                updatedMessages[lastIndex] = {
                  ...updatedMessages[lastIndex],
                  isLoading: false,
                  content: assistantMessageContent || "Error processing response. Please try again.",
                };
              }
              
              return {
                ...prevChat,
                messages: updatedMessages,
              };
            });
            
            setIsGeneratingResponse(false);
            setIsSendingMessage(false);
            response.close();
          } finally {
            isProcessing = false;
          }
        };
        
        // Handle errors
        response.onerror = (error) => {
          console.error('EventSource error:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          
          // Update the UI with an error message if we haven't received any chunks yet
          if (!hasReceivedFirstChunk) {
            setSelectedChat(prevChat => {
              if (!prevChat) return prevChat;
              
              const updatedMessages = [...prevChat.messages];
              const lastIndex = updatedMessages.length - 1;
              
              if (updatedMessages[lastIndex].role === 'assistant') {
                updatedMessages[lastIndex] = {
                  ...updatedMessages[lastIndex],
                  isLoading: false,
                  content: "Connection error. Please try again.",
                };
              }
              
              return {
                ...prevChat,
                messages: updatedMessages,
              };
            });
          }
          
          setIsGeneratingResponse(false);
          setIsSendingMessage(false);
          response.close();
        };
        
        // Implement the stop generation functionality for streaming mode
        globalStopGenerationSource.current = response;
      } else {
        // Fallback: treat as HTTP response missing content; stop loading and show error
        setSelectedChat(prevChat => {
          if (!prevChat) return prevChat;
          const updated = [...prevChat.messages];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
            updated[lastIdx] = {
              ...updated[lastIdx],
              isLoading: false,
              content: updated[lastIdx].content || 'No response content received.',
            } as any;
          }
          return { ...prevChat, messages: updated };
        });
        setIsGeneratingResponse(false);
        setIsSendingMessage(false);
      }
      
      // Scroll to bottom again after response
      setTimeout(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Update the UI to show an error message
      setSelectedChat(prevChat => {
        if (!prevChat) return prevChat;
        
        const updatedMessages = [...prevChat.messages];
        const lastIndex = updatedMessages.length - 1;
        
        // If the last message is from the assistant and is loading, show an error
        if (lastIndex >= 0 && 
            updatedMessages[lastIndex].role === 'assistant' && 
            updatedMessages[lastIndex].isLoading) {
          updatedMessages[lastIndex] = {
            ...updatedMessages[lastIndex],
            isLoading: false,
            content: "Error sending message. Please try again.",
          };
        }
        
        return {
          ...prevChat,
          messages: updatedMessages,
        };
      });
      
      setIsGeneratingResponse(false);
      setIsSendingMessage(false);
    }
  };
  
  // Reference to the current EventSource for stopping generation
  const globalStopGenerationSource = useRef<StreamEventSource | null>(null);
  
  // Function to stop response generation
  const stopResponseGeneration = () => {
    if (globalStopGenerationSource.current) {
      // Close the event source to stop streaming
      globalStopGenerationSource.current.close();
      globalStopGenerationSource.current = null;
      
      // Update the loading message to show that generation was stopped
      setSelectedChat(prevChat => {
        if (!prevChat) return prevChat;
        
        const updatedMessages = [...prevChat.messages];
        const lastIndex = updatedMessages.length - 1;
        
        // If the last message is from the assistant and is loading, mark it as stopped
        if (lastIndex >= 0 && 
            updatedMessages[lastIndex].role === 'assistant') {
          // If there's no content yet, show a message that generation was stopped
          if (!updatedMessages[lastIndex].content.trim()) {
            updatedMessages[lastIndex] = {
              ...updatedMessages[lastIndex],
              isLoading: false,
              content: "Response generation stopped.",
            };
          } else {
            // If there's already some content, just mark it as not loading
            updatedMessages[lastIndex] = {
              ...updatedMessages[lastIndex],
              isLoading: false,
            };
          }
        }
        
        return {
          ...prevChat,
          messages: updatedMessages,
        };
      });
    }
    
    // Update UI states
    setIsGeneratingResponse(false);
    setIsSendingMessage(false);
  };

  // Function to create a new chat
  const createNewChat = async () => {
    try {
      setIsLoadingChat(true);
      const newChat = await oriaService.createChat();
      await fetchChats(); // Refresh the list
      setSelectedChat(await oriaService.getChat(newChat.id)); // Load the new chat
    } catch (error) {
      console.error('Error creating new chat:', error);
    } finally {
      setIsLoadingChat(false);
    }
  };

  // Load chats when the modal opens
  useEffect(() => {
    if (showOriaModal) {
      fetchChats();
    }
  }, [showOriaModal]);

  // Function to toggle title editing
  const startEditingTitle = () => {
    if (selectedChat) {
      setEditedTitle(selectedChat.title);
      setIsEditingTitle(true);
      // Focus the input after a short delay to ensure it's rendered
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  };
  
  // Function to save the updated title
  const saveTitle = async () => {
    if (!selectedChat || !editedTitle.trim() || editedTitle === selectedChat.title) {
      setIsEditingTitle(false);
      return;
    }
    
    try {
      setIsSavingTitle(true);
      await oriaService.updateChatTitle(selectedChat.id, { title: editedTitle });
      
      // Update the selected chat
      const updatedChat = await oriaService.getChat(selectedChat.id);
      setSelectedChat(updatedChat);
      
      // Update the chat in the list
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === selectedChat.id ? { ...chat, title: editedTitle } : chat
        )
      );
    } catch (error) {
      console.error('Error updating chat title:', error);
      // Revert to original title
      setEditedTitle(selectedChat.title);
    } finally {
      setIsSavingTitle(false);
      setIsEditingTitle(false);
    }
  };

  // Function to fetch daily quote
  const fetchDailyQuote = async () => {
    try {
      setIsLoadingQuote(true);
      const quoteData = await quotesService.getDailyQuote();
      setQuote(quoteData.message);
    } catch (error) {
      console.error('Error fetching daily quote:', error);
      // Keep the default quote if there's an error
    } finally {
      setIsLoadingQuote(false);
    }
  };

  // Helper function to get the flame color safely
  const getFlameColor = (): string => {
    if ('flame' in theme.colors) return theme.colors.flame as string;
    if ('accentOrange' in theme.colors) return theme.colors.accentOrange as string;
    return theme.colors.accent as string || '#f97316'; // Default orange
  };
  
  // Helper function to get the emergency color safely
  const getEmergencyColor = (): string => {
    if ('emergency' in theme.colors) return theme.colors.emergency as string;
    return theme.colors.accent as string || '#dc2626'; // Default red
  };

  const { pledgeHistory, canMakePledge, activePledgeTimeRemaining, activePledgeStartTime, activePledgeEndTime, isLoadingPledgeHistory, fetchPledgeHistory } = usePledge();

  // Handle pledge button press
  const handlePledgeButtonPress = () => {
    if (canMakePledge) {
      setShowPledgeModal(true);
    } else {
      Alert.alert(
        "Active Pledge In Progress",
        `You've already committed to 24 hours of sobriety. Your pledge is active until ${activePledgeEndTime}.\n\nStay strong! You can make a new pledge in ${activePledgeTimeRemaining}.`,
        [{ text: "Got it", style: "default" }]
      );
    }
  };

  // Handle successful pledge
  const handleSuccessfulPledge = async () => {
    try {
      // Make API call to /pledge/ with current timestamp
      await apiClient.post(BackendRoutes.PLEDGE, { 
        check_in_at: new Date().toISOString() 
      });
      console.log('Pledge successful');
      // Refresh pledge history to update the UI
      await fetchPledgeHistory();
    } catch (error) {
      console.error('Error during pledge:', error);
      // You can add error handling here
    }
  };

  // State for network connectivity
  const [isConnected, setIsConnected] = useState(true);
  
  // Setup NetInfo listener for connectivity changes
  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);
    });

    // Check initial connection state
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected ?? false);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <GradientBackground>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}>
        {/* Header moved to component */}
        <HomeTopBar
          cleanDays={cleanDays}
          isConnected={isConnected}
          onChatPress={() => setShowOriaModal(true)}
          onPetPress={() => { animatePet(); setShowPetModal(true); }}
          petAnimatedStyle={petAnimatedStyle}
        />
        
        {/* Calendar săptămânal */}
        <WeekBar 
          weekLogsStatus={weekLogsStatus} 
          previousWeekLogsStatus={previousWeekLogsStatus} 
        />
        
        {/* Widgets container */}
        <View style={styles.widgetsContainer}>
          <Animated.ScrollView
            ref={flatListRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScrollHandler}
            scrollEventThrottle={16}
            style={styles.widgetsScrollView}
            contentContainerStyle={styles.widgetsContentContainer}
            snapToInterval={cardTotalWidth}
            snapToAlignment="start"
            disableIntervalMomentum={true}
            decelerationRate="fast"
          >
            {/* Card timer */}
            <View style={[styles.widgetCard, styles.widgetCardTransparent, { width: cardWidth, marginRight: 20 }]}>
              <View style={styles.timerContainer}>
                <View style={styles.timerRow}>
                  {/* Display only the largest time unit */}
                  {(() => {
                    const largestUnit = getLargestTimeUnit(formattedTime);
                    const smallerUnits = getSmallerTimeUnits(formattedTime, largestUnit.unit);
                    
                    return (
                      <>
                        <Text style={styles.timerNumber}>{largestUnit.formattedText}</Text>
                        
                        {/* Bubble for smaller time units */}
                        {smallerUnits.length > 0 && (
                          <Animated.View
                            entering={SlideInDown.duration(220)}
                            exiting={SlideOutUp.duration(180)}
                            style={styles.timerBubble}
                          >
                            <Text style={styles.timerBubbleText}>
                              {smallerUnits.join(' ')}
                            </Text>
                          </Animated.View>
                        )}
                      </>
                    );
                  })()}
                </View>
              </View>
              
              <Text style={styles.cleanDaysText}>Porn-Free Time</Text>
            </View>
            
            {/* Card zile curate */}
            <View style={[styles.widgetCard, styles.widgetCardTransparent, { width: cardWidth, marginLeft: 20 }]}>
              <View style={styles.cleanDaysContent}>
                <Text style={styles.cleanDaysNumber}>{cleanDays}</Text>
                <Ionicons name="flame" size={28} color={getFlameColor()} style={styles.flameIcon} />
              </View>
              <Text style={styles.cleanDaysText}>Clean Days</Text>
              {cleanDays === 0 ? (
                <Text style={styles.cleanDaysSubtext}>Keep going! Enter the streak</Text>
              ) : (
                <Text style={styles.cleanDaysSubtext}>Keep going! You&apos;re on fire</Text>
              )}
            </View>
          </Animated.ScrollView>
          
          {/* Widget indicators */}
          <View style={styles.indicatorsContainer}>
            <TouchableOpacity onPress={() => navigateToWidget(0)}>
              <View style={getIndicatorStyle(0)} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigateToWidget(1)}>
              <View style={getIndicatorStyle(1)} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Brain Rewiring Progress */}
        <View style={styles.brainRewireContainer}>
          <View style={styles.brainRewireHeader}>
            <Text style={styles.brainRewireText}>Brain Rewiring</Text>
            <View style={styles.brainRewirePercentContainer}>
              <Text style={styles.brainRewirePercent}>{brainRewiring.percentage}%</Text>
              {/* Active status indicator */}
              <View style={styles.activeIndicator}>
                <View style={styles.activeIndicatorDot} />
                <Text style={styles.activeIndicatorText}>Growing</Text>
              </View>
            </View>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View style={[styles.progressBarFill, progressAnimatedStyle]}>
                {/* Growing indicator at the end of the progress bar */}
                {brainRewiring.percentage > 0 && (
                  <Animated.View style={[styles.growingIndicator, growingIndicatorStyle]} />
                )}
              </Animated.View>
            </View>
          </View>
          <Text style={styles.brainRewireGoalText}>Goal: 90 days porn-free</Text>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.actionButtonWrapper}
            onPress={handlePledgeButtonPress}
            activeOpacity={canMakePledge ? 0.7 : 1}
          >
            <View style={styles.actionButton}>
              <LinearGradient
                colors={['rgba(0, 0, 0, 0.35)', 'rgba(0, 0, 0, 0.28)']}
                style={[styles.actionButtonGradient, !canMakePledge && styles.disabledActionButton]}
              >
              {!canMakePledge ? (
                <Ionicons name="shield-checkmark" size={24} color={theme.colors.success || '#4ade80'} />
              ) : (
                <Ionicons name="hand-left-outline" size={24} color={theme.colors.textPrimary} />
              )}
              </LinearGradient>
            </View>
            <Text style={[
              styles.actionButtonLabel,
              !canMakePledge && styles.activeActionButtonLabel
            ]}>{!canMakePledge ? 'Active' : 'Pledge'}</Text>
            {!canMakePledge && (
              <View style={styles.pledgeTimerBadge}>
                <Text style={styles.pledgeTimerText}>{activePledgeTimeRemaining}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButtonWrapper}
            onPress={() => router.push('/deep-breathing')}
          >
            <View style={styles.actionButton}>
              <LinearGradient
                colors={['rgba(0, 0, 0, 0.35)', 'rgba(0, 0, 0, 0.28)']}
                style={styles.actionButtonGradient}
              >
              <Ionicons name="leaf-outline" size={22} color={theme.colors.textPrimary} />
              </LinearGradient>
            </View>
            <Text style={styles.actionButtonLabel}>Deep Breathing</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButtonWrapper}
            onPress={() => setShowReflectionModal(true)}
          >
            <View style={styles.actionButton}>
              <LinearGradient
                colors={['rgba(0, 0, 0, 0.35)', 'rgba(0, 0, 0, 0.28)']}
                style={styles.actionButtonGradient}
              >
              <Ionicons name="flower-outline" size={22} color={theme.colors.textPrimary} />
              </LinearGradient>
            </View>
            <Text style={styles.actionButtonLabel}>Meditate</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButtonWrapper}
            onPress={() => setShowRelapsedModal(true)}
          >
            <View style={styles.actionButton}>
              <LinearGradient
                colors={['rgba(0, 0, 0, 0.35)', 'rgba(0, 0, 0, 0.28)']}
                style={styles.actionButtonGradient}
              >
              <Ionicons name="refresh-outline" size={22} color={theme.colors.textPrimary} />
              </LinearGradient>
            </View>
            <Text style={styles.actionButtonLabel}>Reset</Text>
          </TouchableOpacity>
        </View>
        
        {/* Buton Panic (fost CraveOff Mode) */}
        <TouchableOpacity 
          style={styles.panicButton}
          onPress={() => setShowPanicModal(true)}
        >
          <Feather name="shield" size={20} color="#fff" />
          <Text style={styles.panicButtonText}>Panic Button</Text>
        </TouchableOpacity>
        
        {/* Chenare 21 Day Challenge și Pet */}
        <View style={styles.challengeRow}>
          <TouchableOpacity 
            style={styles.challengeCard}
            onPress={() => router.push('/analytics')}
          >
              <LinearGradient
                colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']}
                style={styles.challengeGradient}
          >
            <View style={styles.challengeContent}>
              <Text style={styles.challengeNumber}>90</Text>
              <View style={styles.challengeTextContainer}>
                <Text style={styles.challengeTitle}>Day Challenge</Text>
                <Text style={styles.challengeSubtext}>{cleanDays}/90</Text>
              </View>
            </View>
            <View style={styles.challengeProgressBar}>
              <View style={[styles.challengeProgress, { width: `${Math.min(100, (cleanDays / 90) * 100)}%` }]} />
            </View>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.petCard}
            onPress={() => setShowPetModal(true)}
          >
              <LinearGradient
                colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']}
                style={styles.petGradient}
          >
            <Text style={styles.petCardEmoji}>🐶</Text>
            <Text style={styles.petCardText}>Your buddy</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        {/* Content Blocker Banner */}
        <TouchableOpacity 
          style={styles.contentBlockerCard}
          activeOpacity={0.8}
          onPress={() => router.push('/content-blocker')}
        >
          <LinearGradient
            colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']}
            style={styles.contentBlockerGradient}
          >
            <View style={styles.contentBlockerRow}>
              <View style={styles.contentBlockerLeft}>
                <View style={styles.contentBlockerIconCircle}>
                  <MaterialIcons name="block" size={20} color={theme.colors.textPrimary} />
                </View>
                <View style={styles.contentBlockerTexts}>
                  <Text style={styles.contentBlockerTitle}>Content Blocker</Text>
                  <Text style={styles.contentBlockerDescription}>Block distracting websites and app</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textPrimary} />
            </View>
          </LinearGradient>
        </TouchableOpacity>
        
        {/* Speak to Oria Section */}
        <View style={styles.oriaCard}>
          <LinearGradient
              colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']}
              style={styles.oriaGradient}
          >
          <View style={styles.oriaHeader}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={theme.colors.textPrimary} />
            <Text style={styles.oriaTitle}>Speak to Oria</Text>
          </View>
          <Text style={styles.oriaDescription}>
            24/7 therapist specialized in porn addiction
          </Text>
          <TouchableOpacity 
            style={styles.oriaButton}
            onPress={() => setShowOriaModal(true)}
          >
            <Text style={styles.oriaButtonText}>Start Chat</Text>
            <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.oriaHint}>Also accessible from the chat icon in the header</Text>
          </LinearGradient>
        </View>
        
        {/* Card motivațional */}
        <View style={styles.motivationCard}>
            <LinearGradient
             colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']}
              style={styles.motivationGradient}
            >
          <View style={styles.motivationHeader}>
            <Text style={styles.sectionTitle}>Daily Motivation</Text>
            <TouchableOpacity onPress={fetchDailyQuote}>
              <Ionicons name="refresh-outline" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          {isLoadingQuote ? (
            <View style={styles.quoteLoadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : (
            <Text style={styles.quoteText}>&quot;{quote}&quot;</Text>
          )}
          </LinearGradient>
        </View>
        
        {/* Leaderboard Coming Soon - under Daily Motivation */}
        <LeaderboardComingSoon />
        
        {/* Active Pledge Banner */}
        {!canMakePledge && activePledgeTimeRemaining && (
          <View style={styles.activePledgeBanner}>
            <View style={styles.activePledgeIconContainer}>
              <Ionicons name="shield-checkmark" size={24} color="#fff" />
            </View>
            <View style={styles.activePledgeContent}>
              <Text style={styles.activePledgeTitle}>Pledge Active</Text>
              <Text style={styles.activePledgeText}>
                You&apos;ve committed to 24 hours of sobriety.
              </Text>
              <View style={styles.activePledgeTimerContainer}>
                <Ionicons name="time-outline" size={14} color="#fff" style={styles.activePledgeTimerIcon} />
                <Text style={styles.activePledgeTimerText}>
                  {activePledgeTimeRemaining} remaining
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
      
      {/* Pledge Modal */}
      <PledgeModal 
        visible={showPledgeModal}
        onClose={() => setShowPledgeModal(false)}
        onPledge={handleSuccessfulPledge}
      />
      
      {/* Panic Modal */}
      <PanicModal 
        visible={showPanicModal}
        onClose={() => setShowPanicModal(false)}
      />
      
      {/* Reflection Modal */}
      <ReflectionModal
        visible={showReflectionModal}
        onClose={() => setShowReflectionModal(false)}
      />
      
      {/* Relapsed Modal */}
      <RelapsedModal
        visible={showRelapsedModal}
        onClose={() => setShowRelapsedModal(false)}
        onResetCounter={handleResetCounter}
      />
      
      {/* Oria Chat Modal - Only render when visible */}
      {showOriaModal && (
        <Modal
          animationType="slide"
          transparent={false}
          visible={true}
          presentationStyle="fullScreen"
          onRequestClose={() => {
            setSelectedChat(null);
            setShowOriaModal(false);
          }}
        >
          <GradientBackground ignoreFocus>
          <SafeAreaView
            style={[
              styles.oriaModalContainer,
              { paddingTop: oriaInsets.top || 12, paddingBottom: oriaInsets.bottom || 12 },
            ]}
            edges={[]}
          >
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
            >
            
            {!selectedChat ? (
              // Conversation list view
              <View style={styles.oriaModalContainer}>
                <View style={styles.oriaModalHeader}>
                  <TouchableOpacity
                    onPress={() => setShowOriaModal(false)}
                    style={styles.oriaModalCloseButton}
                  >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
                  </TouchableOpacity>
                  <View style={styles.oriaModalTitleContainer}>
                    <Text style={styles.oriaModalTitle}>Oria AI</Text>
                    <View style={styles.oriaModalStatusContainer}>
                      <View style={styles.oriaModalStatusDot} />
                      <Text style={styles.oriaModalStatusText}>Online</Text>
                    </View>
                  </View>
                </View>
                
                {isLoadingChats ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.loadingText}>Loading conversations...</Text>
                  </View>
                ) : chats.length === 0 ? (
                  <View style={styles.emptyStateContainer}>
                    <Ionicons name="chatbubble-outline" size={48} color={theme.colors.textMuted} />
                    <Text style={styles.emptyStateTitle}>No conversations yet</Text>
                    <Text style={styles.emptyStateDescription}>
                      Start a new chat with Oria to get help with your recovery journey
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={chats}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.conversationListContainer}
                    renderItem={({ item }) => (
                      <TouchableOpacity 
                        style={styles.conversationItem}
                        onPress={() => fetchChat(item.id)}
                      >
                        <View style={styles.conversationIcon}>
                          <Ionicons name="chatbubble-outline" size={22} color={theme.colors.primary} />
                        </View>
                        <View style={styles.conversationContent}>
                          <Text style={styles.conversationTitle}>{item.title}</Text>
                          <Text style={styles.conversationPreview}>
                            Tap to view conversation
                          </Text>
                        </View>
                        <Text style={styles.conversationDate}>{formatDate(item.updated_at)}</Text>
                      </TouchableOpacity>
                    )}
                    ItemSeparatorComponent={() => <View style={styles.conversationSeparator} />}
                  />
                )}
                
                <TouchableOpacity 
                  style={styles.newChatButton}
                  onPress={createNewChat}
                  disabled={isLoadingChat}
                >
                  {isLoadingChat ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="add" size={24} color="#fff" />
                      <Text style={styles.newChatButtonText}>New Chat</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              // Chat view
              <View style={styles.chatContainer}>
                <View style={styles.chatHeader}>
                  <TouchableOpacity
                    onPress={() => setSelectedChat(null)}
                    style={styles.chatBackButton}
                  >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
                  </TouchableOpacity>
                  
                  {isEditingTitle ? (
                    <View style={styles.titleEditContainer}>
                      <TextInput
                        ref={titleInputRef}
                        style={styles.titleInput}
                        value={editedTitle}
                        onChangeText={setEditedTitle}
                        onBlur={saveTitle}
                        onSubmitEditing={saveTitle}
                        returnKeyType="done"
                        autoCapitalize="sentences"
                        maxLength={50}
                      />
                      {isSavingTitle ? (
                        <ActivityIndicator size="small" color={theme.colors.primary} style={styles.titleSaveIndicator} />
                      ) : (
                        <TouchableOpacity onPress={saveTitle} style={styles.titleSaveButton}>
                          <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : (
                    <TouchableWithoutFeedback onPress={startEditingTitle}>
                      <View style={styles.chatTitleContainer}>
                        <Text style={styles.chatTitle}>{selectedChat.title}</Text>
                        <Ionicons name="pencil-outline" size={16} color={theme.colors.textSecondary} style={styles.editTitleIcon} />
                      </View>
                    </TouchableWithoutFeedback>
                  )}
                </View>
                
                {isLoadingChat ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.loadingText}>Loading conversation...</Text>
                  </View>
                ) : (
                  <FlatList
                    ref={chatScrollRef}
                    data={selectedChat.messages}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.messagesContainer}
                    renderItem={({ item }) => (
                      <View style={[
                        styles.messageWrapper,
                        item.role === 'user' ? styles.userMessageWrapper : styles.oriaMessageWrapper
                      ]}>
                        <View style={[
                          styles.messageBubble,
                          item.role === 'user' ? styles.userMessageBubble : styles.oriaMessageBubble
                        ]}>
                          {item.isLoading ? (
                            <View style={styles.loadingIndicator}>
                              <Animated.View 
                                style={loadingIndicatorStyle}
                              />
                            </View>
                          ) : (
                            <Text style={[
                              styles.messageText,
                              item.role === 'user' ? styles.userMessageText : styles.oriaMessageText
                            ]}>
                              {item.content}
                            </Text>
                          )}
                        </View>
                        <Text style={styles.messageTime}>{formatChatTime(item.created_at)}</Text>
                      </View>
                    )}
                    onLayout={() => {
                      // Scroll to bottom on initial render
                      setTimeout(() => {
                        chatScrollRef.current?.scrollToEnd({ animated: false });
                      }, 100);
                    }}
                  />
                )}
                
                <View style={styles.chatInputContainer}>
                  <View style={styles.chatInputWrapper}>
                    <TextInput
                      style={styles.chatInput}
                      placeholder="Type a message..."
                      placeholderTextColor={theme.colors.textMuted}
                      value={newMessage}
                      onChangeText={setNewMessage}
                      multiline
                      returnKeyType="send"
                      onSubmitEditing={sendMessage}
                      editable={!isSendingMessage}
                    />
                  </View>
                  <TouchableOpacity 
                    style={[
                      styles.sendButton,
                      newMessage.trim() || isGeneratingResponse ? styles.sendButtonActive : {}
                    ]}
                    onPress={isGeneratingResponse ? stopResponseGeneration : sendMessage}
                    disabled={(!newMessage.trim() && !isGeneratingResponse) || (isSendingMessage && !isGeneratingResponse)}
                  >
                    {isSendingMessage && !isGeneratingResponse ? (
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                    ) : isGeneratingResponse ? (
                      <Ionicons 
                        name="square" 
                        size={18} 
                        color={getEmergencyColor()} 
                      />
                    ) : (
                      <Ionicons 
                        name="send" 
                        size={20} 
                        color={newMessage.trim() ? theme.colors.primary : theme.colors.textMuted} 
                      />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
            </KeyboardAvoidingView>
          </SafeAreaView>
          </GradientBackground>
        </Modal>
      )}
      
      {/* Pet Coming Soon Modal */}
      <PetComingSoonModal
        visible={showPetModal}
        onClose={() => setShowPetModal(false)}
      />

      {/* Content Blocker Coming Soon Modal */}
      <ContentBlockerComingSoonModal
        visible={showContentBlockerModal}
        onClose={() => setShowContentBlockerModal(false)}
      />
    </GradientBackground>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    paddingBottom: 60, // Increased bottom padding to ensure content is fully visible
    paddingTop: 8,
  },
  // header moved to HomeTopBar
  // moved to HomeTopBar
  // moved to HomeTopBar
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 5,
  },
  // moved to HomeTopBar
  // moved to HomeTopBar
  cleanDaysCard: {
    backgroundColor: theme.colors.backgroundDeep,
    borderRadius: theme.borderRadius.medium,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 16,
  },
  cleanDaysContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cleanDaysNumber: {
    fontSize: 60,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginRight: 8,
  },
  flameIcon: {
     // align vertically with the number
    marginTop: 0,
  },
  cleanDaysText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  cleanDaysSubtext: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  craveOffButton: {
    backgroundColor: theme.colors.emergency,
    borderRadius: theme.borderRadius.medium,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...theme.shadows.redGlow,
  },
  craveOffText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  motivationCard: {
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.medium,
    marginBottom: 20,
    overflow: 'hidden',
  },
  motivationGradient: {
    padding: 16,
    borderRadius: theme.borderRadius.medium,
    // Slight inner border to lift from background very subtly
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  oriaCard: {
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.medium,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  oriaGradient: {
    padding: 16,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  oriaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  oriaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginLeft: 8,
  },
  oriaDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    paddingLeft: 28,
    marginBottom: 12,
  },
  oriaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.backgroundDeep,
    borderRadius: 9999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  oriaButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  oriaModalContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  oriaModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBackground,
  },
  oriaModalCloseButton: {
    padding: 8,
    marginRight: 8,
  },
  oriaModalTitleContainer: {
    flex: 1,
  },
  oriaModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  oriaModalStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  oriaModalStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  oriaModalStatusText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateDescription: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  conversationListContainer: {
    padding: 16,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  conversationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  conversationContent: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  conversationPreview: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  conversationDate: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginLeft: 8,
  },
  conversationSeparator: {
    height: 1,
    backgroundColor: theme.colors.cardBackground,
    marginVertical: 2,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.pill,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  newChatButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBackground,
  },
  chatBackButton: {
    padding: 8,
    marginRight: 8,
  },
  chatTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    flex: 1,
  },
  editTitleIcon: {
    marginLeft: 8,
    opacity: 0.6,
  },
  titleEditContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  titleInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textPrimary,
    paddingVertical: 4,
  },
  titleSaveButton: {
    padding: 4,
  },
  titleSaveIndicator: {
    marginHorizontal: 4,
  },
  messagesContainer: {
    padding: 12,
    paddingBottom: 8,
  },
  messageWrapper: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  userMessageWrapper: {
    alignSelf: 'flex-end',
  },
  oriaMessageWrapper: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userMessageBubble: {
    backgroundColor: theme.colors.primary,
  },
  oriaMessageBubble: {
    backgroundColor: theme.colors.cardBackground,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  oriaMessageText: {
    color: theme.colors.textPrimary,
  },
  messageTime: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBackground,
  },
  chatInputWrapper: {
    flex: 1,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 16,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  chatInput: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    paddingVertical: 8,
    maxHeight: 100,
  },
  chatInputPlaceholder: {
    fontSize: 16,
    color: theme.colors.textMuted,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: theme.colors.cardBackground,
  },
  widgetsContainer: {
    marginBottom: 16,
  },
  widgetsScrollView: {
    overflow: 'visible',
  },
  widgetsContentContainer: {
    paddingHorizontal: 0,
  },
  widgetCard: {
    backgroundColor: theme.colors.backgroundDeep,
    borderRadius: theme.borderRadius.medium,
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
  },
  widgetCardTransparent: {
    backgroundColor: 'transparent',
  },
  widgetBgLottie: {
    display: 'none',
  },
  indicatorsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  timerContainer: {
    marginBottom: 8,
    alignItems: 'center',
  },
  timerRow: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerNumber: {
    fontSize: 58,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
  },
  timerBubble: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 12,
    alignSelf: 'center',
    ...theme.shadows.light,
  },
  timerBubbleText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  brainRewireContainer: {
    marginBottom: 12,
  },
  brainRewireHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  brainRewireText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  brainRewirePercentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brainRewirePercent: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  activeIndicatorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
    marginRight: 4,
  },
  activeIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarBackground: {
    flex: 1,
    // Subtle translucent track to sit well on the dark background
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
    position: 'relative',
    // Soft glow for a cleaner look
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  growingIndicator: {
    position: 'absolute',
    right: -4,
    top: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
    zIndex: 2,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  actionButtonWrapper: {
    alignItems: 'center',
  },
  actionButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'transparent',
    marginBottom: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(209, 213, 219, 0.25)',
    ...theme.shadows.light,
  },
  actionButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  panicButton: {
    backgroundColor: 'rgba(216, 85, 85, 0.85)', // Roșu mai atenuat
    borderRadius: theme.borderRadius.pill,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    // Umbră mai subtilă
    shadowColor: '#d85555',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  panicButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  challengeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  challengeCard: {
    flex: 2,
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.medium,
    marginRight: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  challengeGradient: {
    flex: 1,
    padding: 16,
    borderRadius: theme.borderRadius.medium,
  },
  challengeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  challengeNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginRight: 12,
  },
  challengeTextContainer: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  challengeSubtext: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  challengeProgressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  challengeProgress: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  petCard: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.medium,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  petGradient: {
    flex: 1,
    padding: 16,
    borderRadius: theme.borderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  petCardEmoji: {
    fontSize: 22,
  },
  petCardText: {
    fontSize: 12,
    marginTop: 6,
    color: theme.colors.textSecondary,
  },
  brainRewireGoalText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // moved to HomeTopBar
  // moved to HomeTopBar
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: theme.colors.textPrimary,
    lineHeight: 24,
  },
  quoteLoadingContainer: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  oriaHint: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  loadingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    marginVertical: 6,
    marginHorizontal: 4,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonModal: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.large,
    padding: 24,
    width: '85%',
    maxWidth: 340,
    ...theme.shadows.medium,
  },
  comingSoonContent: {
    alignItems: 'center',
  },
  comingSoonIconContainer: {
    backgroundColor: `${theme.colors.primary}15`,
    borderRadius: 30,
    padding: 16,
    marginBottom: 20,
  },
  comingSoonTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  comingSoonSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 16,
  },
  comingSoonDescription: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  petModalEmoji: {
    fontSize: 36,
  },
  disabledActionButton: {
    opacity: 0.9,
    position: 'relative',
    backgroundColor: 'rgba(74, 222, 128, 0.15)', // Light green background
    borderWidth: 1,
    borderColor: theme.colors.success || '#4ade80',
  },
  activeActionButtonLabel: {
    color: theme.colors.success || '#4ade80',
    fontWeight: '600',
  },
  pledgeTimerBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: theme.colors.success || '#4ade80',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pledgeTimerText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  activePledgeBanner: {
    flexDirection: 'row',
    backgroundColor: theme.colors.success || '#4ade80',
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activePledgeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activePledgeContent: {
    flex: 1,
  },
  activePledgeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  activePledgeText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 6,
  },
  activePledgeTimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activePledgeTimerIcon: {
    marginRight: 4,
  },
  activePledgeTimerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  motivationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  contentBlockerCard: {
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.medium,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  contentBlockerGradient: {
    padding: 16,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  contentBlockerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contentBlockerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  contentBlockerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contentBlockerTexts: {
    flex: 1,
  },
  contentBlockerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  contentBlockerDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});
