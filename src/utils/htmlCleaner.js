// HTML 정리 유틸리티 함수
function cleanHtmlContent(html, options = {}) {
  if (!options.clean) {
    return html;
  }

  let cleanedHtml = html;

  // 기본 정리 옵션들
  const defaultOptions = {
    removeImages: true,
    removeVideos: true,
    removeAudios: true,
    removeScripts: true,
    removeStyles: true,
    removeComments: true,
    removeEmptyElements: true,
    removeForms: false,
    removeIframes: false,
    ...options
  };

  try {
    // 1. 이미지 제거
    if (defaultOptions.removeImages) {
      cleanedHtml = cleanedHtml.replace(/<img[^>]*>/gi, '');
      cleanedHtml = cleanedHtml.replace(/<picture[^>]*>[\s\S]*?<\/picture>/gi, '');
      cleanedHtml = cleanedHtml.replace(/<figure[^>]*>[\s\S]*?<\/figure>/gi, '');
    }

    // 2. 비디오/오디오 제거
    if (defaultOptions.removeVideos) {
      cleanedHtml = cleanedHtml.replace(/<video[^>]*>[\s\S]*?<\/video>/gi, '');
      cleanedHtml = cleanedHtml.replace(/<source[^>]*>/gi, '');
    }

    if (defaultOptions.removeAudios) {
      cleanedHtml = cleanedHtml.replace(/<audio[^>]*>[\s\S]*?<\/audio>/gi, '');
    }

    // 3. 스크립트 제거
    if (defaultOptions.removeScripts) {
      cleanedHtml = cleanedHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
      cleanedHtml = cleanedHtml.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');
    }

    // 4. 스타일 제거
    if (defaultOptions.removeStyles) {
      cleanedHtml = cleanedHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
      cleanedHtml = cleanedHtml.replace(/\sstyle\s*=\s*["'][^"']*["']/gi, '');
      cleanedHtml = cleanedHtml.replace(/<link[^>]*rel\s*=\s*["']stylesheet["'][^>]*>/gi, '');
    }

    // 5. 주석 제거
    if (defaultOptions.removeComments) {
      cleanedHtml = cleanedHtml.replace(/<!--[\s\S]*?-->/g, '');
    }

    // 6. 폼 요소 제거 (옵션)
    if (defaultOptions.removeForms) {
      cleanedHtml = cleanedHtml.replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '');
      cleanedHtml = cleanedHtml.replace(/<input[^>]*>/gi, '');
      cleanedHtml = cleanedHtml.replace(/<textarea[^>]*>[\s\S]*?<\/textarea>/gi, '');
      cleanedHtml = cleanedHtml.replace(/<select[^>]*>[\s\S]*?<\/select>/gi, '');
      cleanedHtml = cleanedHtml.replace(/<button[^>]*>[\s\S]*?<\/button>/gi, '');
    }

    // 7. iframe 제거 (옵션)
    if (defaultOptions.removeIframes) {
      cleanedHtml = cleanedHtml.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
      cleanedHtml = cleanedHtml.replace(/<embed[^>]*>/gi, '');
      cleanedHtml = cleanedHtml.replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '');
    }

    // 8. 광고 및 추적 관련 제거
    cleanedHtml = cleanedHtml.replace(/<div[^>]*class[^>]*ad[^>]*>[\s\S]*?<\/div>/gi, '');
    cleanedHtml = cleanedHtml.replace(/<div[^>]*id[^>]*ad[^>]*>[\s\S]*?<\/div>/gi, '');
    cleanedHtml = cleanedHtml.replace(/<div[^>]*class[^>]*banner[^>]*>[\s\S]*?<\/div>/gi, '');

    // 9. 빈 요소 제거 (옵션)
    if (defaultOptions.removeEmptyElements) {
      // 빈 태그들 제거 (단, br, hr, img 등 self-closing 태그는 제외)
      cleanedHtml = cleanedHtml.replace(/<(div|span|p|h[1-6]|section|article)[^>]*>\s*<\/\1>/gi, '');
      cleanedHtml = cleanedHtml.replace(/^\s*[\r\n]/gm, ''); // 빈 줄 제거
    }

    // 10. 여러 공백을 하나로 정리
    cleanedHtml = cleanedHtml.replace(/\s+/g, ' ');
    cleanedHtml = cleanedHtml.replace(/>\s+</g, '><');

    return cleanedHtml.trim();

  } catch (error) {
    console.error('❌ HTML 정리 중 오류:', error);
    return html; // 오류 시 원본 반환
  }
}

module.exports = {
  cleanHtmlContent
};