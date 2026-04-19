import cn from "clsx";

const Input = ({ className, ...props }: JSX.IntrinsicElements["input"]) => {
  return (
    <input
      {...props}
      type="text"
      className={cn(
        "h-9 truncate rounded-lg px-3 outline-none ring-primary ring-offset-2 focus:ring bg-white dark:bg-zinc-700 dark:text-white dark:ring-offset-zinc-800",
        className,
      )}
    />
  );
};

export default Input;
