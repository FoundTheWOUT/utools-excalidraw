import useSWR from "swr";
import App from "./App";
import StoreSystem from "./store";

const Wrapper = () => {
  const { data } = useSWR("store", StoreSystem.getStore);
  if (!data) return null;
  return <App store={data} />;
};

export default Wrapper;
