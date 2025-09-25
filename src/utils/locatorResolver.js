// 선택자 해결 유틸리티
function resolveLocator(page, {
  selector,
  frameSelector,
  frameChain,
  // getBy methods
  getByRole,
  getByText,
  getByLabel,
  getByPlaceholder,
  getByAltText,
  getByTitle,
  getByTestId,
  // advanced methods
  filter,
  first,
  last,
  nth
}) {
  // Helper function to apply getBy methods to page/frame
  function applyGetByMethod(pageOrFrame) {
    if (getByRole) {
      const { role, ...options } = typeof getByRole === 'string'
        ? { role: getByRole }
        : getByRole;
      return pageOrFrame.getByRole(role, options);
    }
    if (getByText) {
      const options = typeof getByText === 'string'
        ? { text: getByText }
        : getByText;
      return pageOrFrame.getByText(options.text || options, {
        exact: options.exact,
        ignoreCase: options.ignoreCase
      });
    }
    if (getByLabel) {
      const options = typeof getByLabel === 'string'
        ? { text: getByLabel }
        : getByLabel;
      return pageOrFrame.getByLabel(options.text || options, {
        exact: options.exact,
        ignoreCase: options.ignoreCase
      });
    }
    if (getByPlaceholder) {
      const options = typeof getByPlaceholder === 'string'
        ? { text: getByPlaceholder }
        : getByPlaceholder;
      return pageOrFrame.getByPlaceholder(options.text || options, {
        exact: options.exact,
        ignoreCase: options.ignoreCase
      });
    }
    if (getByAltText) {
      const options = typeof getByAltText === 'string'
        ? { text: getByAltText }
        : getByAltText;
      return pageOrFrame.getByAltText(options.text || options, {
        exact: options.exact,
        ignoreCase: options.ignoreCase
      });
    }
    if (getByTitle) {
      const options = typeof getByTitle === 'string'
        ? { text: getByTitle }
        : getByTitle;
      return pageOrFrame.getByTitle(options.text || options, {
        exact: options.exact,
        ignoreCase: options.ignoreCase
      });
    }
    if (getByTestId) {
      return pageOrFrame.getByTestId(getByTestId);
    }

    // fallback to selector
    return pageOrFrame.locator(selector);
  }

  // A) frameSelector: 단일 프레임 선택자
  if (frameSelector) {
    const frameLocator = page.frameLocator(frameSelector);
    const locator = applyGetByMethod(frameLocator);
    return applyAdvancedMethods(locator);
  }

  // B) frameChain: 중첩 프레임 배열 지원
  if (Array.isArray(frameChain) && frameChain.length > 0) {
    let fl = page;
    for (const fs of frameChain) {
      fl = fl.frameLocator(fs);
    }
    const locator = applyGetByMethod(fl);
    return applyAdvancedMethods(locator);
  }

  // C) '>>' 문법 지원 (frameA >> frameB >> .target)
  if (typeof selector === 'string' && selector.includes('>>')) {
    const parts = selector.split(/\s*>>\s+/).filter(p => p.trim());
    let fl = page;
    while (parts.length > 1) {
      const fs = parts.shift();
      fl = fl.frameLocator(fs);
    }
    const target = parts[0];
    const locator = fl.locator(target);
    return applyAdvancedMethods(locator);
  }

  // D) getBy methods 또는 기본 selector
  const locator = applyGetByMethod(page);
  return applyAdvancedMethods(locator);

  // Helper function to apply advanced methods (filter, first, last, nth)
  function applyAdvancedMethods(locator) {
    // Apply filter method
    if (filter) {
      if (filter.hasText !== undefined) {
        locator = locator.filter({ hasText: filter.hasText });
      }
      if (filter.has !== undefined) {
        locator = locator.filter({ has: page.locator(filter.has) });
      }
      if (filter.hasNot !== undefined) {
        locator = locator.filter({ hasNot: page.locator(filter.hasNot) });
      }
    }

    // Apply positional methods
    if (first === true) {
      locator = locator.first();
    } else if (last === true) {
      locator = locator.last();
    } else if (typeof nth === 'number') {
      locator = locator.nth(nth);
    }

    return locator;
  }
}

module.exports = {
  resolveLocator
};