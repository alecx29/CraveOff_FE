import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme } from '@/src/context/ThemeProvider';
import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';
import { LinearGradient } from 'expo-linear-gradient';
import { apiClient } from '@/src/axios/apiClient';

export default function JournalLearningScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const sections = [
    {
      title: 'Addiction and Myths',
      progress: '0% Complete',
      baseColor: '#c76a2c',
      accentColor: '#e48a3c',
      items: [
        {
          id: 'addiction-1',
          number: '1',
          title: 'The Neuroscience of Porn Addiction—How It Hijacks the Brain',
          description:
            "Understanding porn addiction requires a deep dive into the brain's inner workings. Pornography can significantly alter neural pathways, affecting reward circuits, motivation, and behavior patterns.\n\n" +
            "The Brain's Reward System\n\n" +
            "The brain's reward system is designed to reinforce behaviors essential for survival, such as eating and social interaction. When engaging with pornography, the brain releases high levels of dopamine, a neurotransmitter associated with pleasure and reinforcement. This dopamine surge exceeds natural levels, creating a strong association between pornography and pleasure.\n\n" +
            "Neuroplasticity and Tolerance\n\n" +
            'Repeated exposure to pornography leads to neuroplastic changes in the brain. Over time, dopamine receptors become desensitized due to constant overstimulation. This desensitization means more explicit or prolonged pornography use is needed to achieve the same level of satisfaction, a phenomenon known as tolerance.\n\n' +
            'Impact on Decision-Making and Impulse Control\n\n' +
            'Porn addiction affects the prefrontal cortex—the area responsible for decision-making, impulse control, and foreseeing consequences. Impaired functioning in this region makes it challenging to resist urges to view pornography, even when aware of negative consequences.\n\n' +
            'The Role of Conditioning and Triggers\n\n' +
            'Environmental cues such as stress, boredom, or certain emotional states can trigger cravings for pornography. These triggers are reinforced through conditioning, where the brain associates specific cues with the reward of porn use, making relapse more likely even after periods of abstinence.\n\n' +
            'Conclusion\n\n' +
            'By understanding how porn addiction alters brain function, individuals can better appreciate the challenges faced during recovery. Recognizing that porn addiction is not merely a lack of willpower but a complex interaction of neural processes is a crucial step toward effective treatment and self-compassion.',
        },
        {
          id: 'addiction-2',
          number: '2',
          title: 'Debunking Common Myths About Porn Addiction',
          description:
            "Misconceptions about porn addiction contribute to stigma and hinder recovery efforts. Let's address some prevalent myths to foster a more informed and empathetic perspective.\n\n" +
            'Myth 1: Porn Addiction Isn\'t a "Real" Addiction\n\n' +
            "Some believe that because pornography doesn't involve substance intake, it cannot be addictive. However, porn addiction triggers similar neural pathways as substance addictions, leading to compulsive behavior and significant life disruptions.\n\n" +
            'Myth 2: Only People with High Sex Drives Develop Porn Addiction\n\n' +
            'Porn addiction is not solely about sexual desire; it\'s often linked to underlying issues such as stress, loneliness, or emotional pain. Individuals may use pornography as a coping mechanism, regardless of their sex drive.\n\n' +
            'Myth 3: Porn Use Enhances Sexual Relationships\n\n' +
            'While some believe that pornography can spice up a relationship, excessive use can lead to unrealistic expectations, decreased intimacy, and sexual dysfunction. It can create barriers to genuine connection with partners.\n\n' +
            "Myth 4: Quitting Porn Is Easy and Doesn't Require Help\n\n" +
            'Many assume that stopping porn use is simply a matter of choice. However, due to changes in brain chemistry and behavior patterns, professional help and support networks are often necessary for successful recovery.\n\n' +
            'Myth 5: Porn Addiction Only Affects Men\n\n' +
            'While statistics show higher rates among men, porn addiction affects people of all genders. Ignoring its impact on women and non-binary individuals perpetuates stigma and prevents many from seeking help.\n\n' +
            'Conclusion\n\n' +
            'Dispelling these myths is essential for creating a supportive environment that encourages individuals to seek help. Education and open dialogue can break down barriers, leading to more effective prevention and treatment strategies.',
        },
        {
          id: 'addiction-3',
          number: '3',
          title: 'Psychological and Environmental Factors Contributing to Porn Addiction',
          description:
            "Porn addiction doesn't occur in isolation. Various psychological and environmental factors play significant roles in its development.\n\n" +
            'Psychological Factors\n\n' +
            'Stress and Emotional Pain: Individuals may turn to pornography to escape feelings of stress, anxiety, or depression. It can serve as a temporary distraction from emotional discomfort.\n\n' +
            'Mental Health Disorders: Conditions like depression, anxiety, or trauma-related disorders often co-occur with porn addiction. The use of pornography may intensify these conditions, creating a harmful cycle.\n\n' +
            'Low Self-Esteem: Feelings of inadequacy or low self-worth can lead individuals to seek validation or escape through pornography.\n\n' +
            'Environmental Factors\n\n' +
            'Easy Accessibility: The internet provides unprecedented access to pornography, making it easy to develop compulsive habits.\n\n' +
            'Social Isolation: Lack of meaningful social connections can drive individuals toward pornography as a substitute for real-life interaction.\n\n' +
            'Cultural and Societal Influences: Societal attitudes toward sex and pornography can normalize excessive use or, conversely, create shame that discourages open discussion.\n\n' +
            'The Interplay of Factors\n\n' +
            'These factors often interact. For example, someone experiencing social isolation may also struggle with depression, increasing the likelihood of using pornography as a coping mechanism.\n\n' +
            'Conclusion\n\n' +
            'Recognizing the psychological and environmental contributors to porn addiction underscores the importance of a holistic approach to prevention and treatment. Addressing these underlying issues can significantly enhance recovery outcomes.',
        },
        {
          id: 'addiction-4',
          number: '4',
          title: 'The Porn Addiction Cycle—Recognizing Triggers and Patterns',
          description:
            'Breaking free from porn addiction involves understanding the cycle that perpetuates it. Recognizing triggers and patterns is crucial in disrupting this cycle.\n\n' +
            'The Stages of the Porn Addiction Cycle\n\n' +
            'Emotional Trigger: Negative emotions like stress, loneliness, or boredom initiate the urge to view pornography.\n\n' +
            'Craving: The emotional trigger leads to an intense desire to engage with pornographic material.\n\n' +
            'Ritualization: Engaging in specific routines or behaviors that lead up to porn use, such as isolating oneself or browsing certain websites.\n\n' +
            'Acting Out: Viewing pornography provides temporary relief or pleasure.\n\n' +
            'Guilt and Shame: Afterward, individuals may feel guilt or shame, which can reinforce negative emotions and restart the cycle.\n\n' +
            'Identifying Personal Triggers\n\n' +
            'External Triggers: Situations like being alone at home, late-night internet use, or exposure to sexual content in media.\n\n' +
            'Internal Triggers: Feelings of stress, anxiety, or low self-esteem that prompt the desire to seek comfort in pornography.\n\n' +
            'Keeping a journal can help identify patterns and triggers, offering insight into when and why urges occur.\n\n' +
            'Strategies for Breaking the Cycle\n\n' +
            'Mindfulness and Self-Awareness: Practicing mindfulness can help individuals become aware of triggers and choose alternative responses.\n\n' +
            'Healthy Coping Mechanisms: Engaging in physical activity, hobbies, or social interactions to cope with negative emotions.\n\n' +
            'Establishing Boundaries: Setting limits on internet use or implementing content filters to reduce temptation.\n\n' +
            'Support Networks: Reaching out to friends, family, or support groups for encouragement and accountability.\n\n' +
            'Conclusion\n\n' +
            'Understanding the porn addiction cycle empowers individuals to anticipate challenges and implement strategies to overcome them. Breaking the cycle is a critical step toward sustained recovery and healthier relationships.',
        },
      ],
    },
    {
      title: 'Health Effects',
      progress: '0% Complete',
      baseColor: '#c14fa0',
      accentColor: '#d56cbc',
      items: [
        {
          id: 'health-1',
          number: '1',
          title: 'Physical Health Consequences of Porn Addiction',
          description:
            "Porn addiction is often perceived as a purely psychological issue, but it can also have significant physical health consequences. Understanding these effects is crucial for recognizing the seriousness of the addiction and motivating steps toward recovery.\n\n" +
            'Sexual Dysfunction\n\n' +
            'One of the most direct physical impacts of porn addiction is sexual dysfunction, particularly in men. This can manifest as:\n\n' +
            "Erectile Dysfunction (ED): Chronic consumption of pornography can desensitize the brain's response to sexual stimuli, making it difficult to achieve or maintain an erection with a real-life partner.\n\n" +
            'Delayed Ejaculation: Overstimulation from pornography may lead to difficulties in reaching orgasm during physical intimacy.\n\n' +
            'Decreased Sex drive: An overreliance on pornography can reduce interest in actual sexual encounters.\n\n' +
            'Desensitization and Tolerance\n\n' +
            'Repeated exposure to high-intensity sexual content can lead to desensitization. This means that over time, more extreme or novel content is needed to achieve the same level of arousal. This escalation can:\n\n' +
            'Alter Sexual Preferences: Individuals may develop preferences that do not align with their real-life desires or values.\n\n' +
            'Reduce Sensitivity to Physical Touch: Real-life intimacy may feel less satisfying compared to the exaggerated scenarios depicted in pornography.\n\n' +
            'Hormonal Imbalances\n\n' +
            'Excessive pornography use can affect hormone levels, including:\n\n' +
            "Dopamine Dysregulation: Constant dopamine spikes from porn use can disrupt the brain's reward system, leading to cravings and withdrawal symptoms.\n\n" +
            'Altered Testosterone Levels: Some studies suggest a correlation between porn addiction and fluctuations in testosterone, impacting mood and energy levels.\n\n' +
            'Physical Health Neglect\n\n' +
            'Time spent on pornography can lead to neglecting physical health in other areas:\n\n' +
            'Sedentary Lifestyle: Extended periods of inactivity while viewing pornography can contribute to weight gain and associated health risks.\n\n' +
            'Sleep Disruption: Late-night usage can interfere with sleep patterns, leading to fatigue and weakened immune function.\n\n' +
            'Poor Hygiene and Self-Care: Obsessive behavior may result in neglecting personal hygiene and health maintenance.\n\n' +
            'Impact on Adolescents and Young Adults\n\n' +
            'For younger individuals, porn addiction can interfere with normal sexual development:\n\n' +
            'Developmental Delays: Early exposure may affect the natural maturation of sexual identity and understanding of healthy relationships.\n\n' +
            'Risky Behaviors: Imitating unsafe practices seen in pornography can lead to physical harm or sexually transmitted infections (STIs).\n\n' +
            'Conclusion\n\n' +
            'The physical health consequences of porn addiction are significant and multifaceted. Recognizing these impacts is a crucial step toward seeking help and making positive lifestyle changes. Addressing the addiction can lead to improvements in sexual health, overall well-being, and quality of life.',
        },
        {
          id: 'health-2',
          number: '2',
          title: 'Psychological and Emotional Effects of Porn Addiction',
          description:
            'Porn addiction extends beyond physical health, deeply affecting psychological and emotional well-being. Understanding these impacts can highlight the importance of addressing the addiction holistically.\n' +
            'Increased Anxiety and Depression\n' +
            'Emotional Dependence: Relying on pornography as a coping mechanism can exacerbate feelings of anxiety and depression when not addressed.\n' +
            'Guilt and Shame: Persistent porn use, especially when conflicting with personal values, can lead to intense feelings of guilt and shame.\n' +
            'Isolation: Secretive behavior may result in withdrawal from social activities, intensifying feelings of loneliness.\n' +
            'Low Self-Esteem and Self-Worth\n' +
            "Negative Self-Image: Comparing oneself to unrealistic portrayals in pornography can lead to dissatisfaction with one's own body and abilities.\n" +
            'Feelings of Inadequacy: Believing that one cannot meet the standards depicted in pornographic content may diminish confidence in intimate relationships.\n' +
            'Addictive Thought Patterns\n' +
            'Obsessive Thinking: Constant preoccupation with pornography can dominate thoughts, making it difficult to focus on other aspects of life.\n' +
            'Compulsive Behavior: The inability to control urges despite negative consequences can lead to a sense of helplessness.\n' +
            'Emotional Dysregulation\n' +
            'Difficulty Managing Emotions: Overreliance on pornography to manage emotions can hinder the development of healthy coping strategies.\n' +
            'Mood Swings: Fluctuations in dopamine levels can contribute to irritability, restlessness, and mood instability.\n' +
            'Impact on Mental Health Disorders\n' +
            'Co-occurring Disorders: Porn addiction may co-occur with other mental health issues like obsessive-compulsive disorder (OCD), attention-deficit/hyperactivity disorder (ADHD), or substance abuse.\n' +
            'Exacerbation of Symptoms: The addiction can worsen symptoms of existing mental health conditions, creating a vicious cycle.\n' +
            'Loss of Interest in Previously Enjoyed Activities\n' +
            'Anhedonia: The diminished ability to experience pleasure from activities once found enjoyable due to the overstimulation from pornography.\n' +
            'Reduced Motivation: Apathy towards goals and responsibilities can develop as pornography consumes more time and energy.\n' +
            'Conclusion\n' +
            'The psychological and emotional effects of porn addiction are profound and can significantly diminish quality of life. Recognizing these impacts is essential for seeking appropriate help. Professional support can aid in developing healthier coping mechanisms, rebuilding self-esteem, and improving overall mental health.',
        },
        {
          id: 'health-3',
          number: '3',
          title: 'Impact of Porn Addiction on Relationships and Social Life',
          description:
            "Porn addiction doesn't just affect the individual; it can have far-reaching consequences on relationships and social interactions. Understanding these effects is vital for both the person struggling with the addiction and their loved ones.\n\n" +
            'Erosion of Intimacy\n\n' +
            'Emotional Disconnect: Excessive porn use can lead to a lack of emotional availability, making it difficult to form deep connections with partners.\n\n' +
            'Reduced Physical Intimacy: A preference for pornography over real-life interactions can decrease sexual activity within a relationship.\n\n' +
            'Unrealistic Expectations: Pornography often portrays exaggerated scenarios, leading to unrealistic expectations of partners and sexual experiences.\n\n' +
            'Trust Issues\n\n' +
            'Secrecy and Deception: Hiding porn use can lead to lies and deceit, damaging trust within a relationship.\n\n' +
            'Betrayal Feelings: Partners may feel betrayed or inadequate upon discovering the addiction, leading to emotional hurt and resentment.\n\n' +
            'Communication Breakdown\n\n' +
            'Avoidance: Difficulty discussing pornography use can hinder open communication about needs and concerns.\n\n' +
            'Conflict Escalation: Disagreements about porn use can escalate into larger conflicts, straining the relationship further.\n\n' +
            'Social Isolation\n\n' +
            'Withdrawal from Social Activities: Time spent on pornography may replace time previously allocated to friends and family.\n\n' +
            'Reduced Social Skills: Lack of interaction can lead to decreased confidence in social settings and difficulties in forming new relationships.\n\n' +
            'Impact on Family Dynamics\n\n' +
            "Parental Neglect: An addicted parent may become less attentive to their children's needs, affecting the child's emotional development.\n\n" +
            'Marital Strain: The addiction can be a significant source of tension between spouses, potentially leading to separation or divorce.\n\n' +
            'Effects on Dating and Forming New Relationships\n\n' +
            'Fear of Intimacy: Individuals may avoid dating due to anxiety about sexual performance or fear of disclosure.\n\n' +
            'Objectification: Viewing people through the lens of pornography can lead to objectifying potential partners, hindering genuine connections.\n\n' +
            'Conclusion\n\n' +
            'Porn addiction can profoundly impact relationships and social life, leading to isolation and strained connections. Recognizing these effects is a crucial step toward healing. Open communication, coupled with professional support, can help rebuild trust, enhance intimacy, and restore healthy social interactions.',
        },
        {
          id: 'health-4',
          number: '4',
          title: 'Impact of Porn Addiction on Work and Academic Performance',
          description:
            'Porn addiction can have detrimental effects on professional and academic life. The compulsive behavior and associated cognitive impairments can hinder productivity, performance, and opportunities for advancement.\n\n' +
            'Decreased Productivity\n\n' +
            'Time Management Issues: Time spent viewing pornography detracts from time available for work or study tasks.\n\n' +
            'Procrastination: The addiction can lead to delaying important tasks in favor of immediate gratification.\n\n' +
            'Missed Deadlines: Failure to complete assignments or projects on time due to distraction.\n\n' +
            'Impaired Concentration\n\n' +
            'Difficulty Focusing: Preoccupation with pornographic content can make it challenging to concentrate on work or studies.\n\n' +
            'Task Switching Problems: Frequent interruptions to engage with pornography disrupt workflow and reduce efficiency.\n\n' +
            'Reduced Work Quality\n\n' +
            'Attention to Detail: Cognitive impairments can lead to mistakes and oversight in tasks that require precision.\n\n' +
            'Creative Blocks: The addiction may stifle creativity and problem-solving abilities.\n\n' +
            'Professional Consequences\n\n' +
            'Disciplinary Action: Viewing pornography in the workplace or on company devices can result in warnings, suspensions, or termination.\n\n' +
            'Damaged Reputation: Professional relationships may suffer if colleagues become aware of the addiction.\n\n' +
            'Limited Career Advancement: Poor performance and lack of focus can hinder promotions and career growth.\n\n' +
            'Academic Challenges\n\n' +
            'Poor Grades: Reduced study time and focus can lead to declining academic performance.\n\n' +
            'Absenteeism: Skipping classes or appointments to engage with pornography.\n\n' +
            'Academic Probation or Dismissal: Ongoing poor performance may result in serious academic penalties.\n\n' +
            'Emotional Toll on Performance\n\n' +
            'Increased Stress: Balancing addiction with professional or academic responsibilities can lead to heightened stress levels.\n\n' +
            'Burnout: The mental exhaustion from the addiction can contribute to burnout, further reducing performance.\n\n' +
            'Impact on Professional Relationships\n\n' +
            'Teamwork Difficulties: Withdrawal and irritability can affect collaboration with colleagues or classmates.\n\n' +
            'Communication Breakdown: Preoccupation may lead to disengagement during meetings or discussions.\n\n' +
            'Conclusion\n\n' +
            'Porn addiction can significantly impede work and academic success. Recognizing the impact on professional and educational pursuits is essential for motivating change. Seeking help can restore focus, improve performance, and open up opportunities for personal and career advancement.',
        },
      ],
    },
    {
      title: 'Quiting Benefits',
      progress: '0% Complete',
      baseColor: '#3b82f6',
      accentColor: '#2563eb',
      items: [
        {
          id: 'benefits-1',
          number: '1',
          title: 'Reclaiming Mental Clarity and Emotional Well-being',
          description:
            "Quitting porn is like opening a window in a stuffy room—you let in fresh air that rejuvenates your mind and spirit. One of the most profound benefits you'll experience is improved mental clarity and emotional well-being.\n\n" +
            'Reducing Anxiety and Depression\n\n' +
            "Excessive porn use can disrupt your brain's natural balance of dopamine and other neurotransmitters that regulate mood. By stepping away from porn, you're giving your brain a chance to heal and restore its natural chemistry. Over time, you may notice a significant reduction in feelings of anxiety and depression.\n\n" +
            'Enhancing Emotional Stability\n\n' +
            'Porn can create a roller coaster of emotions—temporary highs followed by crashing lows. Breaking free from this cycle allows for more consistent emotional stability. You\'ll find it easier to manage stress, cope with challenges, and maintain a balanced mood throughout the day.\n\n' +
            'Improving Self-Awareness\n\n' +
            'Without the constant distraction, you become more in tune with your thoughts and feelings. This heightened self-awareness enables you to recognize and address underlying issues that may have contributed to the addiction. Embracing mindfulness can lead to greater peace of mind and a deeper understanding of yourself.\n\n' +
            'Building Resilience\n\n' +
            "Overcoming urges and navigating withdrawal symptoms strengthens your mental resilience. This newfound strength doesn't just apply to quitting porn—it empowers you to face other challenges in life with confidence and determination.\n\n" +
            'Conclusion\n\n' +
            'Imagine your mind as a garden. Porn addiction is like weeds overtaking the flowers, but by quitting, you\'re pulling out those weeds and giving the flowers room to grow. The result is a healthier, more vibrant mental landscape where positivity can flourish.',
        },
        {
          id: 'benefits-2',
          number: '2',
          title: 'Strengthening Relationships and Deepening Intimacy',
          description:
            "Letting go of porn can be the key to unlocking richer, more fulfilling relationships. Just as clearing static from a radio enhances the music, removing porn from your life can enhance the connections you have with others.\n" +
            'Improving Romantic Relationships\n' +
            'Porn addiction can create barriers between partners, leading to feelings of distance and dissatisfaction. Quitting allows you to focus your attention and affection on your partner, fostering deeper emotional and physical intimacy. You\'ll be more present in your relationship, improving communication and building trust.\n' +
            'Enhancing Empathy and Connection\n' +
            "Without the distortions that porn can introduce, you'll find it easier to empathize with others. Your ability to understand and share the feelings of friends and loved ones can strengthen bonds and create more meaningful interactions.\n" +
            'Building Trust\n' +
            "Secrecy often accompanies porn addiction, eroding trust in relationships. By quitting, you're making a commitment to honesty and openness. This transparency can rebuild trust with those around you, laying a foundation for healthier connections.\n" +
            'Expanding Social Circles\n' +
            'Freed from the time-consuming nature of porn addiction, you can invest more energy into social activities. Engaging with others, pursuing shared interests, and forming new friendships become more accessible and enjoyable.\n' +
            'Conclusion\n' +
            'Think of relationships as a dance. Porn addiction steps on toes and disrupts the rhythm, but quitting allows you to move in harmony with your partner and others. The result is a more graceful, fulfilling experience of connection and love.',
        },
      ],
    },
  ];

  const fetchReadArticles = async () => {
    try {
      const res = await apiClient.get('/articles/read');
      const list = res?.data?.articles || res?.data?.data || res?.data;
      if (Array.isArray(list)) {
        const ids = list
          .map((item: any) => item?.article_id)
          .filter((id: any) => typeof id === 'string');
        setReadIds(new Set(ids));
      }
    } catch (e) {
      console.log('Failed to fetch read articles', e);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchReadArticles();
    }, [])
  );

  return (
    <GradientBackground>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Articles</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.sectionsContainer}
          showsVerticalScrollIndicator={false}
        >
          {sections.map((section) => {
            const total = section.items.length || 0;
            const done = section.items.filter((item) => readIds.has(item.id ?? '')).length;
            const percent = total > 0 ? Math.round((done / total) * 100) : 0;

            return (
              <View key={section.title} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Text style={styles.sectionProgress}>{`${percent}% Complete`}</Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.cardsRow}
                >
                  {section.items.map((item, idx) => (
                    <TouchableOpacity
                      key={`${section.title}-${item.number}-${idx}`}
                      activeOpacity={0.85}
                      // Show checkmark state in list and pass to detail
                      onPress={() =>
                        router.push({
                          pathname: '/journal/article',
                          params: {
                            articleId: item.id ?? `${section.title}-${item.number}`,
                            title: item.title,
                            description: 'description' in item && item.description ? item.description : 'Content coming soon',
                            number: item.number,
                            baseColor: section.baseColor,
                            accentColor: section.accentColor,
                            isCompleted: readIds.has(item.id ?? '') ? 'true' : 'false',
                          },
                        })
                      }
                      style={[styles.cardWrapper, idx === section.items.length - 1 && styles.cardWrapperLast]}
                    >
                      <LinearGradient
                        colors={[section.baseColor, section.accentColor]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.card}
                      >
                        {readIds.has(item.id ?? '') ? (
                          <View style={styles.completedWrap}>
                            <Ionicons name="checkmark-circle" size={28} color="#4ade80" />
                          </View>
                        ) : (
                          <Text style={styles.cardNumber}>{item.number}</Text>
                        )}
                      </LinearGradient>
                      <Text style={styles.cardTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </GradientBackground>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 44,
      paddingHorizontal: 20,
    },
    sectionsContainer: {
      paddingBottom: 32,
    },
    topBar: {
      marginTop: 6,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 18,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.08)',
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    section: {
      marginBottom: 28,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    sectionProgress: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    cardsRow: {
      paddingRight: 8,
    },
    cardWrapper: {
      width: 155,
      marginRight: 10,
    },
    cardWrapperLast: {
      marginRight: 0,
    },
    card: {
      height: 76,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
      overflow: 'hidden',
    },
    completedWrap: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardNumber: {
      fontSize: 20,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    cardTitle: {
      fontSize: 12.5,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      lineHeight: 18,
    },
  });
