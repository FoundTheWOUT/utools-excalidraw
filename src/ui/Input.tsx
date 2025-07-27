import cn from "clsx";

const Input = ({ className, ...props }: JSX.IntrinsicElements["input"]) => {
  return (
    <input
      {...props}
      type="text"
      className={cn(
        "h-9 truncate rounded-lg px-3 outline-none ring-[#6965db] ring-offset-2 focus:ring dark:text-white dark:ring-offset-zinc-800",
        className,
      )}
    />
  );
};

export default Input;
