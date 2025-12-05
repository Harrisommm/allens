import { StyleSheet, Text, View } from 'react-native';

type SectionHeadingProps = {
  title: string;
  subtitle?: string;
};

export function SectionHeading({ title, subtitle }: SectionHeadingProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
  },
});
