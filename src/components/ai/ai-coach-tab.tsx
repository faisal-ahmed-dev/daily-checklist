import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppColors } from '@/constants/theme';
import type { ChatMessage, CoachContext } from '@/hooks/use-ai-coach';

const QUICK_PROMPTS = [
  'Motivate me',
  'What should I eat now?',
  'How do I do a hip thrust?',
  '10-min ab burner',
  'Fix my desk posture',
  'Show my weak spots',
];

type Props = {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  hasApiKey: boolean;
  dailyBrief: string;
  onSend: (text: string, ctx: CoachContext) => void;
  onClear: () => void;
  ctx: CoachContext;
};

export function AiCoachTab({
  messages,
  loading,
  error,
  hasApiKey,
  dailyBrief,
  onSend,
  onClear,
  ctx,
}: Props) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setInput('');
    onSend(trimmed, ctx);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>

        {/* Daily Brief */}
        {dailyBrief.length > 0 && (
          <View style={styles.briefCard}>
            <Text style={styles.briefTitle}>Today's Brief</Text>
            <Text style={styles.briefText}>{dailyBrief}</Text>
          </View>
        )}

        {!hasApiKey && (
          <View style={styles.noKeyBanner}>
            <Text style={styles.noKeyText}>
              Add an API key in Settings → AI Coach to enable chat.
            </Text>
          </View>
        )}

        {/* Chat messages */}
        {messages.map((msg, i) => (
          <View
            key={i}
            style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
            <Text style={[styles.bubbleText, msg.role === 'user' ? styles.userText : styles.aiText]}>
              {msg.content}
            </Text>
          </View>
        ))}

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={AppColors.green} />
            <Text style={styles.loadingText}>Thinking...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Quick prompts */}
      {messages.length === 0 && hasApiKey && (
        <ScrollView
          horizontal
          style={styles.quickRow}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickContent}>
          {QUICK_PROMPTS.map((p) => (
            <Pressable
              key={p}
              style={({ pressed }) => [styles.quickChip, pressed && styles.pressed]}
              onPress={() => send(p)}>
              <Text style={styles.quickText}>{p}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Input row */}
      {hasApiKey && (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask your coach..."
            placeholderTextColor={AppColors.muted}
            returnKeyType="send"
            onSubmitEditing={() => send(input)}
            multiline
          />
          <Pressable
            style={({ pressed }) => [styles.sendBtn, pressed && styles.pressed]}
            onPress={() => send(input)}
            disabled={loading || !input.trim()}>
            <Text style={styles.sendIcon}>▶</Text>
          </Pressable>
        </View>
      )}

      {messages.length > 0 && (
        <Pressable style={styles.clearBtn} onPress={onClear}>
          <Text style={styles.clearText}>Clear chat</Text>
        </Pressable>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 14, gap: 8, paddingBottom: 8 },

  briefCard: {
    backgroundColor: AppColors.greenSoft,
    borderWidth: 1,
    borderColor: AppColors.greenLine,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  briefTitle: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.greenDeep,
    marginBottom: 6,
  },
  briefText: {
    fontSize: 13,
    color: AppColors.greenDeep,
    lineHeight: 20,
  },

  noKeyBanner: {
    backgroundColor: AppColors.amberSoft,
    borderWidth: 1,
    borderColor: AppColors.amberLine,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  noKeyText: {
    fontSize: 13,
    color: AppColors.amberDeep,
    textAlign: 'center',
  },

  bubble: {
    maxWidth: '85%',
    borderRadius: 16,
    padding: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: AppColors.green,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: AppColors.paper,
    borderWidth: 1,
    borderColor: AppColors.line,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  userText: { color: AppColors.white },
  aiText: { color: AppColors.ink },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
  },
  loadingText: { fontSize: 13, color: AppColors.muted },

  errorCard: {
    backgroundColor: '#FDECEA',
    borderRadius: 12,
    padding: 12,
  },
  errorText: { fontSize: 13, color: '#A03030' },

  quickRow: { maxHeight: 44 },
  quickContent: { paddingHorizontal: 14, gap: 8 },
  quickChip: {
    backgroundColor: AppColors.paper,
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  quickText: { fontSize: 13, color: AppColors.ink },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.line,
    backgroundColor: AppColors.paper,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: AppColors.ink,
    backgroundColor: AppColors.cream,
    maxHeight: 80,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: { color: AppColors.white, fontSize: 14 },

  clearBtn: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  clearText: { fontSize: 12, color: AppColors.muted },

  pressed: { opacity: 0.7 },
});
