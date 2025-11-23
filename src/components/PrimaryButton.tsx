import { Pressable, StyleSheet, Text } from 'react-native';

type PrimaryButtonProps = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
};

export function PrimaryButton({ label, onPress, disabled }: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={disabled ? undefined : onPress}
    >
      <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  label: {
    color: '#f8fafc',
    fontWeight: '600',
    fontSize: 16,
  },
  labelDisabled: {
    color: '#e2e8f0',
  },
});
