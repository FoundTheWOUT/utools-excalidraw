const i18n = {
  zh_CN: {
    asideClosed: "展开侧栏",
    closePreview: "显示预览",
  },
} as { zh_CN: Record<string, string> };

export const t = (id: string) => {
  return i18n.zh_CN?.[id] ?? id;
};
