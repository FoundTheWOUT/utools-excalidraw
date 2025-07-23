import { useEffect, useState, useRef } from "react";

// generate a random number from -50 to 300 (inclusive)
const randomNumber = () => Math.floor(Math.random() * (300 - (-50) + 1)) + -50;

function AsyncImg(
  props: Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
    src: string | Promise<string | undefined>;
  },
) {
  const [loaded, setLoaded] = useState(false);
  const [src, setSrc] = useState("");
  const prevSrcRef = useRef<string>("");

  useEffect(() => {
    setLoaded(false); // reset loaded when src changes
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
      // Only revoke if previous src is a blob url
      if (prevSrcRef.current.startsWith("blob:")) {
        URL.revokeObjectURL(prevSrcRef.current);
      }
    };
  }, [props.src]);

  useEffect(() => {
    prevSrcRef.current = src;
  }, [src]);

  return loaded ? (
    <img {...props} src={src} />
  ) : (
    <div className={props.className}>
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    </div>
  );
}

export default AsyncImg;
