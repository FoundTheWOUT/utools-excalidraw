const i18n = {
  zh_CN: {
    asideClosed: "展开侧栏",
    "asideClosed.Description": "是否展开侧栏",
    closePreview: "显示预览",
    "closePreview.Description":
      "是否显示画布预览。注意：关闭后无法修改画布名称",
    asideCloseAutomatically: "自动关闭侧栏",
    "asideCloseAutomatically.Description": "当绘画时，自动关闭侧栏，鼠标移至画布左侧可临时打开侧栏",
    deleteSceneDirectly: "直接删除画布",
    "deleteSceneDirectly.Description":
      "开启后，当删除画布时，不将画布放入回收站，而是弹窗提示是否直接删除",
  },
} as { zh_CN: Record<string, string> };

export const t = (id: string) => {
  return i18n.zh_CN?.[id] ?? id;
};
