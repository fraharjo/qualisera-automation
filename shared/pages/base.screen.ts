/**
 * Base Screen Object containing common utilities for both Web and Mobile
 * Includes Enterprise Multi-Language (i18n) Resilient Locator Engine
 */
export class BaseScreen {
  /**
   * Helper method to wait for an element and click it
   */
  async click(element: any): Promise<void> {
    await element.waitForDisplayed({ timeout: 15000 });
    await element.click();
  }

  /**
   * Helper method to wait for an element and type text
   */
  async setValue(
    element: any,
    value: string
  ): Promise<void> {
    await element.waitForDisplayed({ timeout: 15000 });
    await element.setValue(value);
  }

  /**
   * Helper method to get text from an element
   */
  async getText(element: any): Promise<string> {
    await element.waitForDisplayed({ timeout: 15000 });
    return await element.getText();
  }

  /**
   * Universal locator helper:
   * Supports accessibility id (~id) for mobile, and css/xpath for web
   */
  getSelector(webSelector: string, mobileAccessibilityId: string) {
    if (browser.isMobile) {
      return $(`~${mobileAccessibilityId}`);
    }
    return $(webSelector);
  }

  /**
   * Enterprise i18n Locator Engine:
   * Resolves elements across any active language variant (EN, ID, etc.)
   * by matching both @content-desc (Accessibility ID) and visible @text.
   */
  getByI18n(variants: readonly string[] | string[]) {
    const conditions = variants
      .map((v) => `@content-desc="${v}" or @text="${v}"`)
      .join(' or ');
    return $(`//*[${conditions}]`);
  }

  /**
   * Resolves elements by visible text across all language variants
   */
  getByText(texts: readonly string[] | string[], tag = 'android.widget.TextView') {
    const conditions = texts.map((t) => `@text="${t}"`).join(' or ');
    return $(`//${tag}[${conditions}]`);
  }

  /**
   * Resolves elements by content-desc / accessibility label across all language variants
   */
  getByContentDesc(descs: readonly string[] | string[]) {
    const conditions = descs.map((d) => `@content-desc="${d}"`).join(' or ');
    return $(`//*[${conditions}]`);
  }
}

export default new BaseScreen();
