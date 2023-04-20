import { OnStart } from "@flamework/core";
import { Component, BaseComponent } from "@flamework/components";
import { Menu } from "client/controllers/Menu";

interface Attributes { }

@Component({ tag: "DefaultMenuPage" })
export class DefaultMenuPage extends BaseComponent<Attributes, Folder & { Cam: CFrameValue }> implements OnStart {
  public constructor(
    private readonly menu: Menu
  ) {
    super();
  }

  /**
   * Set default page then destroy
   * 
   * @hidden
   */
  public onStart(): void {
    this.menu.setPage(this.instance)
    this.destroy();
  }
}
