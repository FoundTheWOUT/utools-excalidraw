import { Dialog as HDialog } from "@headlessui/react";
import { XCircleIcon } from "@heroicons/react/outline";
import { PropsWithChildren } from "react";
import cn from "classnames";

export function Dialog({
  children,
  open,
  onClose,
  title,
  className,
}: PropsWithChildren<{
  className?: string;
  open: boolean;
  title: string;
  onClose: (value: boolean) => void;
}>) {
  return (
    <HDialog
      className={cn(className, "relative z-50")}
      open={open}
      onClose={onClose}
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <HDialog.Panel className="bg-white max-w-2xl p-4 rounded-lg shadow-lg">
          <HDialog.Title className="font-bold text-xl flex">
            <span>{title}</span>
            <XCircleIcon
              className="ml-auto h-7 cursor-pointer"
              onClick={() => onClose(false)}
            />
          </HDialog.Title>
          {children}
        </HDialog.Panel>
      </div>
    </HDialog>
  );
}

Dialog.Description = ({ children }: PropsWithChildren<{}>) => (
  <HDialog.Description className="text-xs text-gray-400">
    {children}
  </HDialog.Description>
);
