import { Fragment } from 'react';

const BRAND_TOKENS = ['Ordrat', 'أوردرات'] as const;
const BRAND_TEXT_PATTERN = new RegExp(`(${BRAND_TOKENS.join('|')})`, 'g');

export function AuthBrandText({ text }: { text: string }) {
  const parts = text.split(BRAND_TEXT_PATTERN);

  return (
    <>
      {parts.map((part, index) => (
        BRAND_TOKENS.includes(part as (typeof BRAND_TOKENS)[number]) ? (
          <span key={`${part}-${index}`} style={{ color: 'var(--brand)' }}>
            {part}
          </span>
        ) : (
          <Fragment key={`${part}-${index}`}>{part}</Fragment>
        )
      ))}
    </>
  );
}