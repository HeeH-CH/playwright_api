// utils/htmlCleaner.js
const { JSDOM } = require('jsdom');
const sanitizeHtml = require('sanitize-html');
const he = require('he');

function cleanHtmlContent(html, opt = {}) {
  if (!opt.clean) return html;

  const o = {
    // 기존 제거 플래그
    removeImages: true,
    removeVideos: true,
    removeAudios: true,
    removeScripts: true,
    removeStyles: true,
    removeComments: true,
    removeEmptyElements: true,
    removeForms: false,
    removeIframes: false,

    // 추가 제거 옵션
    removePagination: true,
    removeNaverApiLinks: true,
    extraAnchorRemovePatterns: [],

    // 화이트리스트/허용 기반
    useAllowlist: false,          // allowlist 모드
    allowedTags: null,
    allowedAttributes: null,

    // 디나이리스트/비허용 기반
    useDenylist: false,           // denylist 모드
    denyTags: [],                 // ['img','video'] 등
    denySelectors: [],            // ['.sponsored','[data-ad]'] 등
    denyAttributes: { '*': [] },  // { '*':['style','onclick'], a:['rel'] }
    denySchemes: [],              // ['javascript','data'] 등
    denyAnchorHrefPatterns: [],   // ['^/out\\?','\\?ad='] 같은 정규식 문자열

    ...opt
  };

  // allowlist와 denylist가 동시에 true면 allowlist 우선
  const useAllowlist = !!o.useAllowlist;
  const useDenylist  = !useAllowlist && !!o.useDenylist;

  const dom = new JSDOM(html);
  const { document, NodeFilter } = dom.window;

  // 1) 기본 제거 규칙
  const kill = [];
  if (o.removeScripts) kill.push('script','noscript');
  if (o.removeStyles)  kill.push('style','link[rel="stylesheet"]','[style]');
  if (o.removeIframes) kill.push('iframe','embed','object');
  if (o.removeImages)  kill.push('img','picture','figure');
  if (o.removeVideos)  kill.push('video','source','track');
  if (o.removeAudios)  kill.push('audio');
  if (o.removeForms)   kill.push('form','input','select','textarea','button');
  if (kill.length) document.querySelectorAll(kill.join(',')).forEach(n => n.remove());

  // 광고/배너 휴리스틱
  document.querySelectorAll('[class*="ad"],[id*="ad"],[class*="banner"],[id*="banner"]').forEach(n => n.remove());

  // 네이버 특수 링크 제거
  if (o.removeNaverApiLinks) {
    document.querySelectorAll('a[href*="lb_api="], a[href^="/#lb_api="], a[href*="api_type="]').forEach(n => n.remove());
  }

  // 페이지네이션 제거
  if (o.removePagination) {
    document.querySelectorAll('a').forEach(a => {
      const t = (a.textContent || '').trim();
      const href = a.getAttribute('href') || '';
      if (/^\d+$/.test(t) && /[?&](?:page|start)=\d+/.test(href)) a.remove();
    });
  }

  // 커스텀 href 제거 패턴
  if (Array.isArray(o.extraAnchorRemovePatterns) && o.extraAnchorRemovePatterns.length) {
    const regs = o.extraAnchorRemovePatterns.map(p => new RegExp(p, 'i'));
    document.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href') || '';
      if (regs.some(re => re.test(href))) a.remove();
    });
  }

  // 1-추가) DENYLIST 전처리
  if (useDenylist) {
    // 태그 제거
    if (Array.isArray(o.denyTags) && o.denyTags.length) {
      document.querySelectorAll(o.denyTags.join(',')).forEach(n => n.remove());
    }
    // 셀렉터 제거
    if (Array.isArray(o.denySelectors) && o.denySelectors.length) {
      document.querySelectorAll(o.denySelectors.join(',')).forEach(n => n.remove());
    }
    // 속성 제거
    if (o.denyAttributes && typeof o.denyAttributes === 'object') {
      const denyMap = o.denyAttributes;
      // '*' 공통
      const globalAttrs = Array.isArray(denyMap['*']) ? denyMap['*'] : [];
      if (globalAttrs.length) {
        document.querySelectorAll('*').forEach(el => {
          globalAttrs.forEach(a => el.removeAttribute(a));
        });
      }
      // 태그별
      Object.entries(denyMap).forEach(([tag, attrs]) => {
        if (tag === '*' || !Array.isArray(attrs) || attrs.length === 0) return;
        document.querySelectorAll(tag).forEach(el => {
          attrs.forEach(a => el.removeAttribute(a));
        });
      });
    }
    // a[href] 패턴 제거
    if (Array.isArray(o.denyAnchorHrefPatterns) && o.denyAnchorHrefPatterns.length) {
      const regs = o.denyAnchorHrefPatterns.map(p => new RegExp(p, 'i'));
      document.querySelectorAll('a[href]').forEach(a => {
        const href = a.getAttribute('href') || '';
        if (regs.some(re => re.test(href))) a.remove();
      });
    }
  }

  // 주석 제거
  if (o.removeComments) {
    const walker = document.createTreeWalker(document, NodeFilter.SHOW_COMMENT, null, false);
    const comments = [];
    while (walker.nextNode()) comments.push(walker.currentNode);
    comments.forEach(c => c.parentNode && c.parentNode.removeChild(c));
  }

  // 2) sanitize
  const defaultAllowedTags = [
    'p','h1','h2','h3','ul','ol','li','a','strong','em','code','pre','blockquote','br',
    'table','thead','tbody','tr','th','td','hr','span','div','section','article'
  ];
  const defaultAllowedAttrs = { a: ['href','title'], td: ['colspan','rowspan'], th: ['colspan','rowspan'], '*': ['lang'] };

  const allowedTags = useAllowlist
    ? (Array.isArray(o.allowedTags) && o.allowedTags.length ? o.allowedTags : defaultAllowedTags)
    : false; // false = 모두 허용

  const allowedAttributes = useAllowlist
    ? (o.allowedAttributes || defaultAllowedAttrs)
    : false; // false = 모두 허용

  let cleaned = sanitizeHtml(dom.serialize(), {
    allowedTags,
    allowedAttributes,
    allowedSchemes: ['http','https','mailto','tel'],
    disallowedTagsMode: 'discard',
    transformTags: {
      a: (tag, attrs) => {
        if (attrs.href) {
          try {
            const u = new URL(attrs.href, 'https://dummy.local');

            // denylist 스킴 필터
            if (useDenylist && Array.isArray(o.denySchemes) && o.denySchemes.length) {
              const scheme = (u.protocol || '').replace(':','').toLowerCase();
              if (o.denySchemes.includes(scheme)) {
                // href 제거하여 비활성 링크로 전환
                delete attrs.href;
              }
            }

            // 흔한 추적 파라미터 제거
            ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','cid','n_media','n_query','n_rank','n_ad_group']
              .forEach(p => u.searchParams.delete(p));
            attrs.href = u.pathname + (u.search || '') + (u.hash || '');
          } catch (_) { /* ignore */ }
        }
        return { tagName: 'a', attribs: attrs };
      }
    },
    // exclusiveFilter는 allowlist 모드에서만 세밀 필터에 활용 가능
  });

  // 3) 빈 요소 제거
  if (o.removeEmptyElements) {
    cleaned = cleaned.replace(/<(div|span|p|section|article|h[1-6])[^>]*>\s*<\/\1>/gi, '');
  }

  // 4) 공백 정리 + 엔티티 디코딩
  cleaned = cleaned.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();
  return he.decode(cleaned);
}

module.exports = { cleanHtmlContent };
