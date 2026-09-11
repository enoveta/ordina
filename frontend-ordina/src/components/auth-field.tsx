import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type AuthFieldProps = TextInputProps & {
  label: string;
  isPassword?: boolean;
};

export function AuthField({ label, isPassword, style, ...rest }: AuthFieldProps) {
  const theme = useTheme();
  const [hidden, setHidden] = useState(Boolean(isPassword));

  return (
    <View style={styles.wrap}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <View style={[styles.field, { backgroundColor: theme.input }]}>
        <TextInput
          {...rest}
          secureTextEntry={hidden}
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }, style]}
        />
        {isPassword ? (
          <Pressable onPress={() => setHidden((v) => !v)} hitSlop={8}>
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={theme.text} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  input: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    paddingVertical: 14,
  },
});
