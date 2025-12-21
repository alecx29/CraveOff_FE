import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/src/context/ThemeProvider';
import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';
import { apiClient } from '@/src/axios/apiClient';

export default function ArticleScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const params = useLocalSearchParams<{
    articleId?: string;
    title?: string;
    description?: string;
    number?: string;
    baseColor?: string;
    accentColor?: string;
    isCompleted?: string;
  }>();

  const title = params.title || 'Article';
  const description = params.description || 'Content coming soon';
  const number = params.number || '';
  const baseColor = (params.baseColor as string) || '#6366f1';
  const accentColor = (params.accentColor as string) || '#4f46e5';
  const articleId = params.articleId;

  const [isMarking, setIsMarking] = useState(false);
  const [isCompleted, setIsCompleted] = useState(
    params?.isCompleted === 'true'
  );

  // Pre-populate read status
  useEffect(() => {
    const fetchReadStatus = async () => {
      if (!articleId) return;
      try {
        const res = await apiClient.get('/articles/read');
        const list = res?.data?.articles || res?.data?.data || res?.data;
        if (Array.isArray(list)) {
          const ids = list
            .map((item: any) => item?.article_id || item)
            .filter((id: any) => typeof id === 'string');
          if (ids.includes(articleId as string)) {
            setIsCompleted(true);
          }
        }
      } catch (e) {
        console.log('Failed to fetch read status', e);
      }
    };
    fetchReadStatus();
  }, [articleId]);

  const handleMarkComplete = async () => {
    if (!articleId || isMarking) return;
    setIsMarking(true);
    try {
      await apiClient.post(`/articles/${articleId}/read`);
      setIsCompleted(true);
    } catch (e) {
      console.log('Failed to mark complete', e);
    } finally {
      setIsMarking(false);
    }
  };

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
          <View style={styles.topSpacer} />
          <TouchableOpacity
            style={[
              styles.markButton,
              (isCompleted || !articleId) && styles.markButtonDisabled,
            ]}
            activeOpacity={0.85}
            disabled={isCompleted || isMarking || !articleId}
            onPress={handleMarkComplete}
          >
            {isMarking ? (
              <ActivityIndicator size="small" color={theme.colors.textPrimary} />
            ) : (
              <View style={styles.markButtonContent}>
                {isCompleted && (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={theme.colors.success || '#4ade80'}
                    style={styles.markButtonIcon}
                  />
                )}
                <Text
                  style={[
                    styles.markButtonText,
                    isCompleted && { color: theme.colors.success || '#4ade80' },
                  ]}
                >
                  {isCompleted ? 'Completed' : 'Mark Complete'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {number ? (
            <LinearGradient
              colors={[baseColor, accentColor]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.numberBadge}
            >
              <Text style={styles.numberText}>{number}</Text>
            </LinearGradient>
          ) : null}

          <Text style={styles.articleTitle}>
            {title}
          </Text>

          <Text style={styles.body}>{description}</Text>
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
    topBar: {
      marginTop: 6,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.08)',
    },
    topSpacer: {
      flex: 1,
    },
    markButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,255,255,0.15)',
    },
    markButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    markButtonIcon: {
      marginRight: 6,
    },
    markButtonText: {
      color: theme.colors.textPrimary,
      fontSize: 13,
      fontWeight: '700',
    },
    markButtonDisabled: {
      opacity: 0.6,
    },
    numberBadge: {
      alignSelf: 'center',
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    numberText: {
      fontSize: 22,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    articleTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      textAlign: 'center',
      marginBottom: 28,
      paddingHorizontal: 12,
    },
    contentContainer: {
      paddingBottom: 32,
    },
    body: {
      fontSize: 16,
      lineHeight: 24,
      color: theme.colors.textPrimary,
    },
  });


