import React from 'react';

interface FormatTextOptions {
  linkProps?: React.AnchorHTMLAttributes<HTMLAnchorElement>;
}

const urlPattern = /(https?:\/\/[^\s]+)/gi;
const exactUrlPattern = /^https?:\/\/[^\s]+$/i;

export function formatTextWithLinks(
  text: string,
  options?: FormatTextOptions
): React.ReactNode[] {
  if (!text) {
    return [];
  }

  const defaultLinkProps: React.AnchorHTMLAttributes<HTMLAnchorElement> = {
    target: '_blank',
    rel: 'noopener noreferrer',
    ...options?.linkProps,
  };

  return text.split(urlPattern).flatMap((segment, segmentIndex) => {
    if (exactUrlPattern.test(segment)) {
      return (
        <a key={`link-${segmentIndex}`} href={segment} {...defaultLinkProps}>
          {segment}
        </a>
      );
    }

    const lines = segment.split('\n');

    return lines.map((line, lineIndex) => (
      <React.Fragment key={`text-${segmentIndex}-${lineIndex}`}>
        {line}
        {lineIndex < lines.length - 1 ? <br /> : null}
      </React.Fragment>
    ));
  });
}
