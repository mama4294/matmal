import {
  DefaultActionsMenu,
  DefaultActionsMenuContent,
  DefaultContextMenu,
  DefaultContextMenuContent,
  DefaultMainMenu,
  DefaultToolbar,
  TLComponents,
  Tldraw,
  TldrawUiMenuGroup,
  TldrawUiMenuItem,
  TLUiContextMenuProps,
  TLUiStylePanelProps,
  useEditor,
  useIsToolSelected,
  useTools,
} from "tldraw";
import "@/tldraw/tldraw.css";
import { customAssetUrls, uiOverrides } from "./overrides";
import { UnitOpUtl } from "./shapes/unitOp/unitOpShapeUtil";
import { UnitOpShapeTool } from "./shapes/unitOp/unitOpShapeTool";
import { StreamShapeUtil } from "./shapes/stream/StreamShapeUtil";
import { StreamShapeTool } from "./shapes/stream/StreamShapeTool";

export default function Draw() {
  const customShapeUtils = [UnitOpUtl, StreamShapeUtil];
  const customTools = [UnitOpShapeTool, StreamShapeTool];
  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <Tldraw
        //inferDarkMode
        tools={customTools} //state for tools
        components={components} //Which TLDRAW default UI components are displayed
        shapeUtils={customShapeUtils}
        overrides={uiOverrides} //menu buttons
        assetUrls={customAssetUrls} //icons
        onMount={(editor) => {
          editor.createShape({ type: "unit-op", x: 100, y: 100 });
          editor.user.updateUserPreferences({ isSnapMode: true });
        }}
      />
    </div>
  );
}

const components: TLComponents = {
  ActionsMenu: CustomActionsMenu,
  ContextMenu: CustomContextMenu,
  // DebugMenu: CustomDebugMenu,
  // HelpMenu: CustomHelpMenu,
  // KeyboardShortcutsDialog: CustomKeyboardShortcutsDialog,
  MainMenu: CustomMainMenu,
  // NavigationPanel: CustomNavigationPanel,
  PageMenu: CustomPageMenu,
  // QuickActions: CustomQuickActions,
  StylePanel: CustomStylePanel,
  Toolbar: CustomToolbar,
  // ZoomMenu: CustomZoomMenu,
  //   ContextMenu: null,
  //   ActionsMenu: null,
  //   HelpMenu: null,
  //   ZoomMenu: null,
  //   MainMenu: null,
  //   Minimap: null,
  //   StylePanel: null,
  //   PageMenu: null,
  //   NavigationPanel: null,
  //   Toolbar: null,
  KeyboardShortcutsDialog: null,
  //   QuickActions: null,
  //   HelperButtons: null,
  //   DebugPanel: null,  //bottom bar
  //   DebugMenu: null, //bottom right
  SharePanel: null,
  //   MenuPanel: null, top left menu
  //   TopPanel: null,
  // CursorChatBubble: null,
};

function CustomContextMenu(props: TLUiContextMenuProps) {
  //Right click menu
  return (
    <div style={{ backgroundColor: "thistle" }}>
      <DefaultContextMenu {...props}>
        <TldrawUiMenuGroup id="example">
          <TldrawUiMenuItem
            id="like"
            label="Add Unit Op"
            icon="external-link"
            readonlyOk
            onSelect={() => {
              window.open("https://x.com/tldraw", "_blank");
            }}
          />
        </TldrawUiMenuGroup>
        <DefaultContextMenuContent />
      </DefaultContextMenu>
    </div>
  );
}

function CustomMainMenu() {
  //Top left menu
  return (
    <DefaultMainMenu>
      <div>
        <TldrawUiMenuGroup id="example">
          <TldrawUiMenuItem
            id="save"
            label="Save"
            icon="external-link"
            readonlyOk
            onSelect={() => {
              console.log("Test");
            }}
          />
          <TldrawUiMenuItem
            id="load"
            label="Load"
            icon="external-link"
            readonlyOk
            onSelect={() => {
              console.log("Test");
            }}
          />
        </TldrawUiMenuGroup>
        <TldrawUiMenuGroup id="example">
          <TldrawUiMenuItem
            id="ingredients"
            label="Ingredients"
            icon=""
            // readonlyOk
            onSelect={() => {
              console.log("Test");
            }}
          />
          <TldrawUiMenuItem
            id="ops"
            label="Unit Ops"
            icon=""
            // readonlyOk
            onSelect={() => {
              console.log("Test");
            }}
          />
          <TldrawUiMenuItem
            id="utilities"
            label="Utilities"
            icon=""
            // readonlyOk
            onSelect={() => {
              console.log("Test");
            }}
          />
        </TldrawUiMenuGroup>
      </div>
      {/* <DefaultMainMenuContent /> */}
    </DefaultMainMenu>
  );
}

function CustomPageMenu() {
  //Removed
  return <div></div>;
}

function CustomActionsMenu() {
  return (
    <div style={{ display: "none" }}>
      <DefaultActionsMenu>
        <div style={{ backgroundColor: "thistle" }}>
          <TldrawUiMenuItem
            id="like"
            label="Like my posts"
            icon="external-link"
            readonlyOk
            onSelect={() => {
              window.open("https://x.com/tldraw", "_blank");
            }}
          />
        </div>
        <DefaultActionsMenuContent />
      </DefaultActionsMenu>
    </div>
  );
}

function CustomStylePanel(props: TLUiStylePanelProps) {
  // Styles are complex, sorry. Check our DefaultStylePanel for an example.
  return <div></div>;
}

function CustomToolbar() {
  const editor = useEditor();
  const tools = useTools();

  return (
    <div>
      <DefaultToolbar>
        <TldrawUiMenuItem
          {...tools["select"]}
          isSelected={useIsToolSelected(tools["select"])}
        />
        <TldrawUiMenuItem
          {...tools["hand"]}
          isSelected={useIsToolSelected(tools["hand"])}
        />
        <TldrawUiMenuItem
          {...tools["text"]}
          isSelected={useIsToolSelected(tools["text"])}
        />
        <TldrawUiMenuItem
          {...tools["arrow"]}
          isSelected={useIsToolSelected(tools["arrow"])}
        />
        <TldrawUiMenuItem
          {...tools["unitop"]}
          isSelected={useIsToolSelected(tools["unitop"])}
        />
        <TldrawUiMenuItem
          {...tools["stream"]}
          isSelected={useIsToolSelected(tools["stream"])}
        />

        {/* <DefaultToolbarContent /> */}
      </DefaultToolbar>
    </div>
  );
}
