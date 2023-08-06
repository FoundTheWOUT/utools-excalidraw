const i18n = {
  zh_CN: {
    asideClosed: "展开侧栏",
    "asideClosed.Description": "是否展开侧栏",
    closePreview: "显示预览",
    "closePreview.Description":
      "是否显示画布预览。注意：关闭后无法修改画布名称",
  },
} as { zh_CN: Record<string, string> };

export const t = (id: string) => {
  return i18n.zh_CN?.[id] ?? id;
};
