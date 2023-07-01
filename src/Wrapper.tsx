import useSWR from "swr";
import App from "./App";
import StoreSystem from "./store";

const Wrapper = () => {
  const { data, error } = useSWR("store", StoreSystem.getStore);
  if (!data) {
    error && console.error(error);
    return null;
  }
  return <App store={data} />;
};

export default Wrapper;
