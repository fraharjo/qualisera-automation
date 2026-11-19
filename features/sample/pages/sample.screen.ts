import { BaseScreen } from '../../../shared/pages/base.screen';

class SampleScreen extends BaseScreen {
  /**
   * Screen locators following the {screen}-{element}-{type} convention.
   * Multi-platform pattern using BaseScreen.getSelector(web, mobile)
   */
  get containerMain() {
    return this.getSelector('#main-container', 'sample-main-view');
  }

  async isMainContainerDisplayed(): Promise<boolean> {
    return await this.containerMain.isDisplayed();
  }
}

export default new SampleScreen();
