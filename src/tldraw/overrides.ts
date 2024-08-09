import { TLUiAssetUrlOverrides, TLUiOverrides } from "tldraw";

export const uiOverrides: TLUiOverrides = {
  tools(editor, tools) {
    // Create a tool item in the ui's context.
    tools.unitop = {
      id: "unit-op",
      icon: "color",
      label: "Unit Op",
      kbd: "c",
      onSelect: () => {
        editor.setCurrentTool("unit-op");
      },
    };
    return tools;
  },
};

export const customAssetUrls: TLUiAssetUrlOverrides = {
  icons: {
    "heart-icon": "/heart-icon.svg",
  },
};
