import { useEffect, useState } from "react";

// generate a random number from -50 to 300
const randomNumber = () => Math.floor(Math.random() * (300 - (-50 + 1)) + -50);

function AsyncImg(
  props: Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
    src: string | Promise<string | undefined>;
  },
) {
  const [loaded, setLoaded] = useState(false);
  const [src, setSrc] = useState("");

  useEffect(() => {
    const waitSrc = async () => {
      const _src = await props.src;
      if (_src) {
        setSrc(_src);
      }
      setTimeout(() => {
        setLoaded(true);
      }, 300 + randomNumber());
    };
    waitSrc();
    return () => {
      if (src) {
        URL.revokeObjectURL(src);
      }
    };
  }, []);

  return loaded ? (
    <img {...props} src={src} />
  ) : (
    <div className={props.className}>
      <div className="flex h-full w-full items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2 border-t-2"></div>
      </div>
    </div>
  );
}

export default AsyncImg;
