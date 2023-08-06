import cn from "classnames";
import React from "react";

function Switch({
  checked,
  notAllow = false,
  ...rest
}: { checked: boolean; notAllow?: boolean } & JSX.IntrinsicElements["button"]) {
  return (
    <button
      className={cn(
        "w-10 rounded-full flex items-center relative h-6",
        checked ? "bg-[#6965db]" : "bg-gray-300",
        notAllow ? "cursor-not-allowed" : "cursor-pointer"
      )}
      {...rest}
    >
      <span
        className={cn(
          "rounded-full h-5 w-5 transition-transform bg-white inline-block",
          checked ? "translate-x-[1.1rem]" : "translate-x-[0.1rem]"
        )}
      />
    </button>
  );
}

export default Switch;
