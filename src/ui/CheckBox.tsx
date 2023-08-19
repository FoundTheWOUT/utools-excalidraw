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
      className="form-tick h-5 w-5 appearance-none rounded border-2 border-gray-400 checked:bg-[#6965db]"
      onChange={onChange}
    />
    {children}
  </div>
);

export default StyledCheckBox;
