import { AppContext } from "@/App";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";
import {
  DotsVerticalIcon,
  CogIcon,
  TrashIcon,
  ArchiveIcon,
} from "@heroicons/react/outline";
import { useContext, useState } from "react";
import TrashcanDialog from "./TrashcanDialog";
import SettingDialog from "./SettingDialog";

const user = window.utools?.getUser();

function SideBarHeader() {
  const { appSettings } = useContext(AppContext) ?? {};
  const [trashcanDialogOpen, setTrashcanDialogOpen] = useState(false);
  const [settingDialogOpen, setSettingDialogOpen] = useState(false);

  const openSetting = () => {
    setSettingDialogOpen(true);
  };

  const openTrashcan = () => {
    setTrashcanDialogOpen(true);
  };

  if (!appSettings?.asideWidth || appSettings.asideWidth <= 150) {
    return null;
  }
  return (
    <div className="bg-gray-10 sticky top-0 z-10 flex items-center gap-2 bg-gray-100 p-3 dark:bg-zinc-800">
      {/* avatar */}
      <img className="h-8 w-8 rounded-full" src={user?.avatar}></img>
      <span className="flex-1 truncate dark:text-white">{user?.nickname}</span>
      {/* dropdown */}
      <div className="ml-auto flex items-center">
        <Menu as="div">
          <MenuButton>
            <DotsVerticalIcon className="h-5 w-5 text-gray-500"></DotsVerticalIcon>
          </MenuButton>
          <MenuItems
            className="z-10 mt-2 flex w-28 origin-top-right flex-col gap-2 rounded-md bg-white p-1 text-gray-900 shadow-lg outline-none transition duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0 dark:bg-zinc-800 dark:text-white"
            transition
            anchor="bottom end"
          >
            <MenuItem>
              <button
                onClick={openSetting}
                className="flex items-center gap-2 rounded-md p-1 data-[focus]:bg-primary/20"
              >
                <CogIcon className="w-5 text-gray-500 dark:text-gray-300" />
                <span>设置</span>
              </button>
            </MenuItem>
            <MenuItem>
              <button
                onClick={openTrashcan}
                className="flex items-center gap-2 rounded-md p-1 data-[focus]:bg-primary/20"
              >
                <TrashIcon className="w-5 text-red-500" />
                <span>回收站</span>
              </button>
            </MenuItem>
            <MenuItem>
              <button className="flex items-center gap-2 rounded-md p-1 data-[focus]:bg-primary/20">
                <ArchiveIcon className="w-5 text-gray-500 dark:text-gray-300" />
                <span>批量导出</span>
              </button>
            </MenuItem>
          </MenuItems>
        </Menu>
      </div>

      <TrashcanDialog
        open={trashcanDialogOpen}
        onClose={(close) => setTrashcanDialogOpen(close)}
      />

      <SettingDialog
        open={settingDialogOpen}
        onClose={(close) => setSettingDialogOpen(close)}
      />
    </div>
  );
}

export default SideBarHeader;
