// utils/htmlCleaner.js
const { JSDOM } = require('jsdom');
const sanitizeHtml = require('sanitize-html');
const he = require('he');

function cleanHtmlContent(html, opt = {}) {
  if (!opt.clean) return html;

  const o = {
    // 레거시 플래그 기본값(이전 코드와 동일한 의미)
    removeImages: true,
    removeVideos: true,
    removeAudios: true,
    removeScripts: true,
    removeStyles: true,
    removeComments: true,
    removeEmptyElements: true,
    removeForms: false,
    removeIframes: false,
    // 커스텀 허용 옵션
    allowedTags: null,
    allowedAttributes: null,
    ...opt
  };

  const dom = new JSDOM(html);
  const { document, NodeFilter } = dom.window;

  // 1) 레거시 플래그 해석 → 셀렉터 제거
  const kill = [];
  if (o.removeScripts) kill.push('script','noscript');
  if (o.removeStyles) kill.push('style','link[rel="stylesheet"]','[style]');
  if (o.removeIframes) kill.push('iframe','embed','object');
  if (o.removeImages) kill.push('img','picture','figure');
  if (o.removeVideos) kill.push('video','source','track');
  if (o.removeAudios) kill.push('audio');
  if (o.removeForms)  kill.push('form','input','select','textarea','button');

  if (kill.length) document.querySelectorAll(kill.join(',')).forEach(n => n.remove());

  // 광고/배너 휴리스틱
  document.querySelectorAll('[class*="ad"],[id*="ad"],[class*="banner"],[id*="banner"]').forEach(n => n.remove());

  // 주석 제거
  if (o.removeComments) {
    const walker = document.createTreeWalker(document, NodeFilter.SHOW_COMMENT, null, false);
    const comments = [];
    while (walker.nextNode()) comments.push(walker.currentNode);
    comments.forEach(c => c.parentNode && c.parentNode.removeChild(c));
  }

  // 2) sanitize: 허용 태그/속성
  const defaultAllowedTags = [
    'p','h1','h2','h3','ul','ol','li','a','strong','em','code','pre','blockquote','br',
    'table','thead','tbody','tr','th','td','hr','span','div','section','article'
  ];
  const allowedTags = Array.isArray(o.allowedTags) && o.allowedTags.length
    ? o.allowedTags
    : defaultAllowedTags;

  const defaultAllowedAttrs = { a: ['href','title'], td: ['colspan','rowspan'], th: ['colspan','rowspan'], '*': ['lang'] };
  const allowedAttributes = o.allowedAttributes || defaultAllowedAttrs;

  let cleaned = sanitizeHtml(dom.serialize(), {
    allowedTags,
    allowedAttributes,
    allowedSchemes: ['http','https','mailto','tel'],
    transformTags: {
      a: (tag, attrs) => {
        if (attrs.href) {
          try {
            const u = new URL(attrs.href, 'https://dummy.local');
            ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','cid','n_media','n_query','n_rank','n_ad_group']
              .forEach(p => u.searchParams.delete(p));
            attrs.href = u.pathname + (u.search || '') + (u.hash || '');
          } catch (_) {}
        }
        return { tagName: 'a', attribs: attrs };
      }
    }
  });

  // 3) 빈 요소 제거(옵션)
  if (o.removeEmptyElements) {
    cleaned = cleaned.replace(/<(div|span|p|section|article|h[1-6])[^>]*>\s*<\/\1>/gi, '');
  }

  // 4) 공백 정리 + 엔티티 디코딩
  cleaned = cleaned.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();
  return he.decode(cleaned);
}

module.exports = { cleanHtmlContent };
