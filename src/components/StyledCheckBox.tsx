import React, { PropsWithChildren } from "react";

const StyledCheckBox = ({
  children,
  checked,
  onChange,
}: PropsWithChildren<{
  checked: boolean;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}>) => (
  <div className="flex items-center gap-2">
    <input
      checked={checked}
      type="checkbox"
      className="w-5 h-5 appearance-none border-2 border-gray-400 rounded checked:bg-[#6965db] form-tick"
      onChange={onChange}
    />
    {children}
  </div>
);

export default StyledCheckBox;
