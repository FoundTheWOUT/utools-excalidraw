const i18n = {
  zh_CN: {
    asideClosed: "展开侧栏",
    "asideClosed.Description": "是否展开侧栏",
    closePreview: "显示预览",
    "closePreview.Description":
      "是否显示画布预览。注意：关闭后无法修改画布名称",
    asideCloseAutomatically: "自动关闭侧栏",
    "asideCloseAutomatically.Description":
      "当绘画时，自动关闭侧栏，鼠标移至画布左侧可临时打开侧栏",
    deleteSceneDirectly: "启用回收站",
    "deleteSceneDirectly.Description":
      "开启回收站，删除画布时，会将画布直接放入回收站，若关闭则用弹窗提示是否立即删除画布",
    darkMode: "黑暗模式",
    "darkMode.Description": "是否开启黑暗模式",
    "Theme.Light": "光亮主题",
    "Theme.Dark": "黑暗主题",
    "Theme.FollowApp": "跟随应用",
  },
} as const;

export const t = (
  id: keyof typeof i18n.zh_CN | (string & NonNullable<unknown>),
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (i18n.zh_CN as any)?.[id] ?? id;
};
