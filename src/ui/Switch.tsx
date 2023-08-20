import cn from "classnames";

function Switch({
  checked,
  notAllow = false,
  ...rest
}: { checked: boolean; notAllow?: boolean } & JSX.IntrinsicElements["button"]) {
  return (
    <button
      className={cn(
        "relative flex h-6 w-10 items-center rounded-full",
        checked ? "bg-[#6965db]" : "bg-gray-300",
        notAllow ? "cursor-not-allowed" : "cursor-pointer",
      )}
      {...rest}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-white transition-transform",
          checked ? "translate-x-[1.1rem]" : "translate-x-[0.1rem]",
        )}
      />
    </button>
  );
}

export default Switch;
