import { Dialog as HDialog, Transition } from "@headlessui/react";
import { XCircleIcon } from "@heroicons/react/outline";
import { Fragment, PropsWithChildren } from "react";
import cn from "clsx";

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
    <Transition show={open}>
      <HDialog className={cn(className, "relative z-50")} onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        </Transition.Child>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="transition ease-out duration-70"
            enterFrom="opacity-0 scale-90 enter-form"
            enterTo="opacity-100 scale-100"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-90 leave-to"
          >
            <HDialog.Panel className="min-w-[25rem] max-w-2xl rounded-lg bg-white p-4 shadow-lg dark:bg-zinc-800">
              <HDialog.Title className="flex text-xl font-bold dark:text-white">
                <span>{title}</span>
                <XCircleIcon
                  className="ml-auto h-7 cursor-pointer"
                  onClick={() => onClose(false)}
                />
              </HDialog.Title>
              {children}
            </HDialog.Panel>
          </Transition.Child>
        </div>
      </HDialog>
    </Transition>
  );
}

Dialog.Description = function DialogDescription({
  children,
}: PropsWithChildren<unknown>) {
  return (
    <HDialog.Description className="text-xs text-gray-400">
      {children}
    </HDialog.Description>
  );
};
