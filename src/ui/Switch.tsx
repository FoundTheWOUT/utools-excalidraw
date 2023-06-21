import cn from "classnames";
import React from "react";

function Switch({
  checked,
  ...rest
}: { checked: boolean } & JSX.IntrinsicElements["button"]) {
  return (
    <button
      className={cn(
        "w-10 rounded-full flex items-center cursor-pointer relative h-6",
        checked ? "bg-gray-300" : "bg-[#6965db]"
      )}
      {...rest}
    >
      <span
        className={cn(
          "rounded-full h-5 w-5 transition-transform bg-white inline-block",
          checked ? "translate-x-[0.1rem]" : "translate-x-[1.1rem]"
        )}
      />
    </button>
  );
}

export default Switch;
