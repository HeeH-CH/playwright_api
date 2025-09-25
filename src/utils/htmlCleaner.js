const cheerio = require('cheerio');
const sanitizeHtml = require('sanitize-html');
const he = require('he');

const DEFAULT_OPTIONS = {
  removeImages: true,
  removeVideos: true,
  removeAudios: true,
  removeScripts: true,
  removeStyles: true,
  removeComments: true,
  removeEmptyElements: true,
  removeForms: false,
  removeIframes: false,
  removePagination: true,
  removeNaverApiLinks: true,
  extraAnchorRemovePatterns: [],
  useAllowlist: false,
  allowedTags: null,
  allowedAttributes: null,
  useDenylist: false,
  denyTags: [],
  denySelectors: [],
  denyAttributes: { '*': [] },
  denySchemes: [],
  denyAnchorHrefPatterns: [],
};

const DEFAULT_ALLOWED_TAGS = [
  'p',
  'h1',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
  'a',
  'strong',
  'em',
  'code',
  'pre',
  'blockquote',
  'br',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'hr',
  'span',
  'div',
  'section',
  'article',
];

const DEFAULT_ALLOWED_ATTRIBUTES = {
  a: ['href', 'title'],
  td: ['colspan', 'rowspan'],
  th: ['colspan', 'rowspan'],
  '*': ['lang'],
};

const EMPTY_TAG_REGEX = /<(div|span|p|section|article|h[1-6])[^>]*>\s*<\/\1>/gi;
const TRACKING_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'cid',
  'n_media',
  'n_query',
  'n_rank',
  'n_ad_group',
];

function cleanHtmlContent(html, opt = {}) {
  if (!opt.clean) return html;

  const options = { ...DEFAULT_OPTIONS, ...opt };
  const useAllowlist = Boolean(options.useAllowlist);
  const useDenylist = !useAllowlist && Boolean(options.useDenylist);

  const $ = cheerio.load(html || '', { decodeEntities: false, lowerCaseTags: false });

  applyBasicRemovals($, options);
  if (useDenylist) {
    applyDenylistRemovals($, options);
  }

  const allowedTags = useAllowlist ? resolveAllowedTags(options) : false;
  const allowedAttributes = useAllowlist ? resolveAllowedAttributes(options) : false;
  const denySchemeSet = useDenylist && Array.isArray(options.denySchemes)
    ? new Set(options.denySchemes.map((scheme) => String(scheme).toLowerCase()))
    : null;

  const sanitized = sanitizeHtml($.root().html() || '', {
    allowedTags,
    allowedAttributes,
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    disallowedTagsMode: 'discard',
    transformTags: {
      a: (tagName, attribs) => ({
        tagName: 'a',
        attribs: transformAnchorAttributes(attribs, denySchemeSet),
      }),
    },
  });

  let cleaned = options.removeEmptyElements
    ? sanitized.replace(EMPTY_TAG_REGEX, '')
    : sanitized;

  cleaned = cleaned.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();

  return he.decode(cleaned);
}

function applyBasicRemovals($, options) {
  const killSelectors = [];

  if (options.removeScripts) killSelectors.push('script', 'noscript');
  if (options.removeStyles) killSelectors.push('style', 'link[rel="stylesheet"]', '[style]');
  if (options.removeIframes) killSelectors.push('iframe', 'embed', 'object');
  if (options.removeImages) killSelectors.push('img', 'picture', 'figure');
  if (options.removeVideos) killSelectors.push('video', 'source', 'track');
  if (options.removeAudios) killSelectors.push('audio');
  if (options.removeForms) killSelectors.push('form', 'input', 'select', 'textarea', 'button');

  if (killSelectors.length) {
    $(killSelectors.join(',')).remove();
  }

  $('[class*="ad"],[id*="ad"],[class*="banner"],[id*="banner"]').remove();

  if (options.removeNaverApiLinks) {
    $('a[href*="lb_api="], a[href^="/#lb_api"], a[href*="api_type="]').remove();
  }

  if (options.removePagination) {
    $('a').each((_, el) => {
      const $el = $(el);
      const text = ($el.text() || '').trim();
      const href = $el.attr('href') || '';

      if (/^\d+$/.test(text) && /[?&](?:page|start)=\d+/.test(href)) {
        $el.remove();
      }
    });
  }

  const extraAnchorPatterns = compilePatterns(options.extraAnchorRemovePatterns);
  if (extraAnchorPatterns.length) {
    $('a[href]').each((_, el) => {
      const $el = $(el);
      const href = $el.attr('href') || '';

      if (extraAnchorPatterns.some((pattern) => pattern.test(href))) {
        $el.remove();
      }
    });
  }

  if (options.removeComments) {
    removeComments($);
  }
}

function applyDenylistRemovals($, options) {
  if (Array.isArray(options.denyTags) && options.denyTags.length) {
    $(options.denyTags.join(',')).remove();
  }

  if (Array.isArray(options.denySelectors) && options.denySelectors.length) {
    $(options.denySelectors.join(',')).remove();
  }

  if (options.denyAttributes && typeof options.denyAttributes === 'object') {
    const denyMap = options.denyAttributes;
    const globalAttributes = Array.isArray(denyMap['*']) ? denyMap['*'] : [];

    if (globalAttributes.length) {
      $('*').each((_, el) => {
        const $el = $(el);
        globalAttributes.forEach((attr) => $el.removeAttr(attr));
      });
    }

    Object.entries(denyMap).forEach(([tag, attrs]) => {
      if (tag === '*' || !Array.isArray(attrs) || attrs.length === 0) return;

      $(tag).each((_, el) => {
        const $el = $(el);
        attrs.forEach((attr) => $el.removeAttr(attr));
      });
    });
  }

  const denyAnchorPatterns = compilePatterns(options.denyAnchorHrefPatterns);
  if (denyAnchorPatterns.length) {
    $('a[href]').each((_, el) => {
      const $el = $(el);
      const href = $el.attr('href') || '';

      if (denyAnchorPatterns.some((pattern) => pattern.test(href))) {
        $el.remove();
      }
    });
  }
}

function removeComments($) {
  const traverse = (nodes) => {
    nodes.each((_, node) => {
      if (node.type === 'comment') {
        $(node).remove();
      } else if (node.type === 'tag' || node.type === 'root') {
        traverse($(node).contents());
      }
    });
  };

  traverse($.root().contents());
}

function resolveAllowedTags(options) {
  return Array.isArray(options.allowedTags) && options.allowedTags.length
    ? options.allowedTags
    : DEFAULT_ALLOWED_TAGS;
}

function resolveAllowedAttributes(options) {
  if (options.allowedAttributes && typeof options.allowedAttributes === 'object') {
    return options.allowedAttributes;
  }

  return DEFAULT_ALLOWED_ATTRIBUTES;
}

function transformAnchorAttributes(attribs = {}, denySchemeSet) {
  const attrs = { ...attribs };

  if (!attrs.href) {
    return attrs;
  }

  try {
    const url = new URL(attrs.href, 'https://dummy.local');

    if (denySchemeSet && denySchemeSet.size) {
      const scheme = (url.protocol || '').replace(':', '').toLowerCase();
      if (denySchemeSet.has(scheme)) {
        delete attrs.href;
        return attrs;
      }
    }

    TRACKING_PARAMS.forEach((param) => url.searchParams.delete(param));

    attrs.href = `${url.pathname}${url.search || ''}${url.hash || ''}`;
  } catch (err) {
    // If URL construction fails, leave href untouched
  }

  return attrs;
}

function compilePatterns(patterns) {
  if (!Array.isArray(patterns) || patterns.length === 0) {
    return [];
  }

  return patterns
    .map((pattern) => {
      try {
        return new RegExp(pattern, 'i');
      } catch (err) {
        return null;
      }
    })
    .filter(Boolean);
}

module.exports = { cleanHtmlContent };
