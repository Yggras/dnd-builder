import { DetailSection } from '@/features/compendium/components/DetailSection';
import { RichTextLine } from '@/features/compendium/components/RichTextLine';
import { parseInlineText } from '@/features/compendium/utils/inlineText';

interface DetailSummarySectionProps {
  summary: string | null;
}

export function DetailSummarySection({ summary }: DetailSummarySectionProps) {
  if (!summary) {
    return null;
  }

  return (
    <DetailSection title="Summary">
      <RichTextLine tokens={parseInlineText(summary)} variant="summary" />
    </DetailSection>
  );
}
