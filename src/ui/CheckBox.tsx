import type { PropsWithChildren, ChangeEventHandler } from "react";

const StyledCheckBox = ({
  children,
  checked,
  onChange,
}: PropsWithChildren<{
  checked: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
}>) => (
  <div className="flex items-center gap-2">
    <input
      checked={checked}
      type="checkbox"
      className="form-tick h-5 w-5 appearance-none rounded-sm border-2 border-gray-400 checked:bg-primary"
      onChange={onChange}
    />
    {children}
  </div>
);

export default StyledCheckBox;
