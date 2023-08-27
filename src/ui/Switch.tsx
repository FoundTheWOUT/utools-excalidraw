import cn from "clsx";
import "./Switch.css";

function Switch({
  checked,
  notAllow = false,
  ...rest
}: { notAllow?: boolean } & JSX.IntrinsicElements["input"]) {
  return (
    <input
      type="checkbox"
      disabled={notAllow}
      checked={checked}
      className={cn(
        "switch relative",
        notAllow ? "cursor-not-allowed" : "cursor-pointer",
      )}
      {...rest}
    />
  );
}

export default Switch;
