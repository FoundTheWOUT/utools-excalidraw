import { Dialog, DialogProps } from "@/ui/Dialog.tsx";
import { setTheme } from "@/utils/utils.ts";
import { Fragment, useContext, useEffect, useState } from "react";
import { AppContext } from "@/App.tsx";
import { Switch, Listbox, Transition } from "@headlessui/react";
import SwitchBtn from "@/ui/Switch.tsx";
import { t } from "@/i18n.ts";
import { DB_KEY, Store, Theme } from "@/types.ts";
import { SunIcon, MoonIcon, SparklesIcon } from "@heroicons/react/outline";

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
        <div className="flex gap-2">
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
      <div className="flex gap-2">
        <Switch.Label className="w-96 flex-1">
          <div className="font-semibold dark:text-white">{t(prop)}</div>
          <div className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
            {t(`${prop}.Description`)}
          </div>
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

  const [currentTheme, setCurrentTheme] = useState(
    themeOptions.find((opt) => opt.key === appSettings?.theme),
  );
  useEffect(() => {
    if (currentTheme) {
      setTheme(currentTheme.key);
    }
  }, [currentTheme, setAndStoreAppSettings]);
  return (
    <Dialog {...props} title="设置">
      <div className="mt-4 flex flex-col gap-4 p-2">
        {/* theme */}
        <Listbox
          value={currentTheme}
          onChange={(newTheme) => {
            setCurrentTheme(newTheme);
            setAndStoreAppSettings?.({
              theme: newTheme.key,
            });
          }}
        >
          <div className="relative z-10 mt-1">
            <div className="flex justify-between gap-2">
              <Listbox.Label className="font-bold dark:text-white">
                主题
              </Listbox.Label>
              <Listbox.Button className="relative cursor-default rounded-lg border bg-white p-2 text-sm text-gray-500 dark:border-zinc-800 dark:bg-zinc-600 dark:text-zinc-300">
                {currentTheme?.name}
              </Listbox.Button>
            </div>

            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute right-0 mt-1 max-h-60 overflow-auto rounded-md border bg-white py-1 text-base shadow-lg focus:outline-none dark:border-zinc-800 dark:bg-zinc-600 sm:text-sm">
                {themeOptions.map((person, personIdx) => (
                  <Listbox.Option
                    key={personIdx}
                    className={({ active }) =>
                      `relative cursor-default select-none p-2 px-4 ${
                        active
                          ? "bg-[#6965db] text-white"
                          : "text-gray-900 dark:text-zinc-400"
                      }`
                    }
                    value={person}
                  >
                    {({ selected }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? "font-medium" : "font-normal"
                          }`}
                        >
                          {person.name}
                        </span>
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </Listbox>

        <AppSettingsSwitchItem prop="closePreview" />
        <AppSettingsSwitchItem prop="asideClosed" />
        <AppSettingsSwitchItem prop="asideCloseAutomatically" reverse />
        <AppSettingsSwitchItem prop="deleteSceneDirectly" />
      </div>
    </Dialog>
  );
}
