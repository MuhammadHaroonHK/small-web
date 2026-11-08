import { BadRequestException } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';
import { convert } from 'html-to-text';

const ALLOWED_TAGS = [
  'a',
  'b',
  'blockquote',
  'br',
  'code',
  'div',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'li',
  'ol',
  'p',
  'pre',
  's',
  'span',
  'strong',
  'u',
  'ul',
];

export function normalizeSiteAddress(address: string): string {
  const normalized = address.trim().toLowerCase().replace(/\/+$/, '');

  if (!/^smallweb:\/\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
    throw new BadRequestException(
      'Address must use the internal format smallweb://site-name.',
    );
  }

  return normalized;
}

export function sanitizeSiteContent(html: string): {
  html: string;
  textContent: string;
} {
  const sanitizedHtml = sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ['href', 'title'],
    },
    allowedSchemes: ['smallweb'],
    allowedSchemesByTag: {
      a: ['smallweb'],
    },
    allowProtocolRelative: false,
    enforceHtmlBoundary: true,
  });
  const textContent = convert(sanitizedHtml, {
    wordwrap: false,
    selectors: [
      { selector: 'a', options: { ignoreHref: true } },
      ...['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((selector) => ({
        selector,
        options: { uppercase: false },
      })),
    ],
  })
    .replace(/\s+/g, ' ')
    .trim();

  if (!textContent) {
    throw new BadRequestException(
      'HTML must contain readable text after unsafe content is removed.',
    );
  }

  return { html: sanitizedHtml, textContent };
}
