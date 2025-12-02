import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type FeatureCardProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  tone?: 'default' | 'warning' | 'danger';
};

const toneColors: Record<Exclude<FeatureCardProps['tone'], undefined>, string> = {
  default: '#0f172a',
  warning: '#b45309',
  danger: '#b91c1c',
};

export function FeatureCard({ title, description, icon, tone = 'default' }: FeatureCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconRow}>
        {icon}
        <Text style={[styles.title, { color: toneColors[tone] }]}>{title}</Text>
      </View>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#f8fafc',
    gap: 8,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#334155',
  },
});
