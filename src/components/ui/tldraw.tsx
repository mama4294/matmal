import {
  DefaultActionsMenu,
  DefaultActionsMenuContent,
  DefaultContextMenu,
  DefaultContextMenuContent,
  DefaultMainMenu,
  DefaultMainMenuContent,
  DefaultPageMenu,
  DefaultStylePanel,
  DefaultToolbar,
  DefaultToolbarContent,
  TLComponents,
  Tldraw,
  TldrawUiButton,
  TldrawUiButtonLabel,
  TldrawUiMenuGroup,
  TldrawUiMenuItem,
  TLUiContextMenuProps,
  TLUiStylePanelProps,
  useEditor,
  useIsToolSelected,
  useRelevantStyles,
  useTools,
} from "tldraw";
import { MyShapeUtil } from "./UnitOp";

export default function Draw() {
  const customShapes = [MyShapeUtil];
  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <Tldraw
        components={components}
        shapeUtils={customShapes}
        onMount={(editor) => {
          editor.createShape({ type: "my-custom-shape", x: 100, y: 100 });
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
  const isScreenshotSelected = useIsToolSelected(tools["rhombus-2"]);
  return (
    <div>
      <DefaultToolbar>
        <TldrawUiMenuItem
          {...tools["rhombus-2"]}
          isSelected={isScreenshotSelected}
        />
        <TldrawUiMenuItem
          {...tools["rectangle"]}
          isSelected={isScreenshotSelected}
        />

        {/* <DefaultToolbarContent /> */}
      </DefaultToolbar>
    </div>
  );
}
