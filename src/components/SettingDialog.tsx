import { Fragment, useContext, useEffect, useState } from "react";
import {
  Switch,
  Listbox,
  Transition,
  ListboxButton,
  Label,
  Field,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/react";
import { SunIcon, MoonIcon, SparklesIcon } from "@heroicons/react/outline";
import type { DialogProps } from "@/ui/Dialog.tsx";
import { Dialog } from "@/ui/Dialog.tsx";
import { setTheme } from "@/utils/utils.ts";
import { AppContext } from "@/App.tsx";
import SwitchBtn from "@/ui/Switch.tsx";
import { t } from "@/i18n.ts";
import type { DB_KEY, Store } from "@/types.ts";
import { Theme } from "@/types.ts";

type MayBeSettingKey =
  | keyof Store[DB_KEY.SETTINGS]
  | (string & NonNullable<unknown>);

function AppSettingsSwitchItem({
  prop,
  reverse = false,
  ...rest
}: {
  prop: MayBeSettingKey;
  reverse?: boolean;
  onChange?: (value: boolean) => void;
}) {
  const { appSettings, setAndStoreAppSettings } = useContext(AppContext) ?? {};

  if (!appSettings) {
    return null;
  }

  if (!Object.hasOwn(appSettings, prop)) {
    return (
      <Switch.Group>
        <div className="setting-item">
          <SwitchBtn checked={false} notAllow />
          <Switch.Label className="flex-1 text-gray-500">
            <div className="font-semibold">{t(prop)}</div>
            <div className="mt-1 text-sm">{t(`${prop}.Description`)}</div>
          </Switch.Label>
        </div>
      </Switch.Group>
    );
  }

  return (
    <Switch.Group>
      <div className="setting-item">
        <Switch.Label className="w-96 flex-1">
          <div className="setting-label">{t(prop)}</div>
          <div className="setting-description">{t(`${prop}.Description`)}</div>
        </Switch.Label>
        <SwitchBtn
          checked={reverse ? !!appSettings[prop] : !appSettings[prop]}
          onClick={() => {
            setAndStoreAppSettings?.({
              [prop]: !appSettings[prop],
            });
            rest.onChange?.(!appSettings[prop]);
          }}
        />
      </div>
    </Switch.Group>
  );
}

const themeOptions = [
  { key: Theme.Light, name: t("Theme.Light"), Icon: SunIcon },
  { key: Theme.Dark, name: t("Theme.Dark"), Icon: MoonIcon },
  { key: Theme.App, name: t("Theme.FollowApp"), Icon: SparklesIcon },
];

export default function SettingDialog(props: Omit<DialogProps, "title">) {
  const { appSettings, setAndStoreAppSettings } = useContext(AppContext) ?? {};

  const [aiModels, setAiModels] = useState<UtoolsAiModel[]>([]);
  const [currentTheme, setCurrentTheme] = useState(
    themeOptions.find((opt) => opt.key === appSettings?.theme),
  );

  const aiModelOptions = [
    { id: "", label: "无", icon: "", cost: 0 },
    ...aiModels.map((model) => ({
      id: model.id,
      label: model.label,
      icon: model.icon,
      cost: model.cost,
    })),
  ];

  const [currentModel, setCurrentModel] = useState(
    aiModelOptions.find((opt) => opt.id === appSettings?.selectedModel) ||
      aiModelOptions[0],
  );

  useEffect(() => {
    if (window.utools) {
      utools.allAiModels().then(setAiModels);
    }
  }, []);

  useEffect(() => {
    if (currentTheme) {
      setTheme(currentTheme.key);
    }
  }, [currentTheme, setAndStoreAppSettings]);

  useEffect(() => {
    const opt = aiModelOptions.find(
      (opt) => opt.id === appSettings?.selectedModel,
    );
    setCurrentModel(opt || aiModelOptions[0]);
  }, [aiModels, appSettings?.selectedModel]);

  return (
    <Dialog {...props} title="设置">
      <div className="mt-4 flex flex-col gap-4 p-2">
        {/* theme */}
        <Field className="setting-item">
          <Label className="setting-label">主题</Label>
          <Listbox
            value={currentTheme}
            onChange={(newTheme) => {
              setCurrentTheme(newTheme);
              setAndStoreAppSettings?.({
                theme: newTheme.key,
              });
            }}
          >
            <ListboxButton className="rounded-lg border bg-white p-2 text-sm text-gray-500 dark:border-zinc-800 dark:bg-zinc-600 dark:text-zinc-300">
              {currentTheme?.name}
            </ListboxButton>

            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <ListboxOptions
                anchor="bottom end"
                className="max-h-60 overflow-auto rounded-md border bg-white py-1 text-base shadow-lg [--anchor-gap:4px] sm:text-sm dark:border-zinc-800 dark:bg-zinc-600"
              >
                {themeOptions.map((theme, themeIdx) => (
                  <ListboxOption
                    key={themeIdx}
                    className={({ active }) =>
                      `relative cursor-default select-none p-2 px-4 text-gray-900 focus:bg-[#6965db] focus:text-white dark:text-zinc-400 ${
                        active
                          ? "bg-[#6965db] text-white"
                          : "text-gray-900 dark:text-zinc-400"
                      }`
                    }
                    value={theme}
                  >
                    {({ selected }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? "font-medium" : "font-normal"
                          }`}
                        >
                          {theme.name}
                        </span>
                      </>
                    )}
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </Transition>
          </Listbox>
        </Field>

        {/* AI Model */}
        <Field className="setting-item">
          <Label className="setting-label">AI 模型</Label>
          <Listbox
            value={currentModel}
            onChange={(newModel) => {
              setCurrentModel(newModel);
              setAndStoreAppSettings?.({
                selectedModel: newModel.id,
              });
            }}
          >
            <ListboxButton className="rounded-lg border bg-white p-2 text-sm text-gray-500 dark:border-zinc-800 dark:bg-zinc-600 dark:text-zinc-300">
              {currentModel?.label}
            </ListboxButton>

            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <ListboxOptions
                anchor="bottom end"
                className="max-h-60 overflow-auto rounded-md border bg-white py-1 text-base shadow-lg [--anchor-gap:4px] sm:text-sm dark:border-zinc-800 dark:bg-zinc-600"
              >
                {aiModelOptions.map((model, modelIdx) => (
                  <ListboxOption
                    key={modelIdx}
                    className={({ active }) =>
                      `data-focus:bg-red-500 relative cursor-default select-none p-2 px-4 text-gray-900 focus:bg-[#6965db] focus:text-white dark:text-zinc-400 ${
                        active
                          ? "bg-[#6965db] text-white"
                          : "text-gray-900 dark:text-zinc-400"
                      }`
                    }
                    value={model}
                  >
                    {({ selected, active }) => (
                      <div className="flex items-center gap-2">
                        {model.icon && (
                          <img src={model.icon} alt="" className="h-4 w-4" />
                        )}
                        <span
                          className={`block truncate ${
                            selected ? "font-medium" : "font-normal"
                          }`}
                        >
                          {model.label}
                        </span>
                        {model.cost > 0 && (
                          <span
                            className={`text-xs ${active ? "text-white/80" : "text-gray-500"}`}
                          >
                            消耗: {model.cost}
                          </span>
                        )}
                      </div>
                    )}
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </Transition>
          </Listbox>
        </Field>

        <AppSettingsSwitchItem prop="closePreview" />
        <AppSettingsSwitchItem prop="asideClosed" />
        <AppSettingsSwitchItem prop="asideCloseAutomatically" reverse />
        <AppSettingsSwitchItem prop="deleteSceneDirectly" />

        {import.meta.env.DEV && <AppSettingsSwitchItem prop="dev" reverse />}
      </div>
    </Dialog>
  );
}
