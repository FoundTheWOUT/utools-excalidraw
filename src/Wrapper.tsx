import useSWR from "swr";
import App from "./App";
import { getStore } from "./store/store";

const Wrapper = () => {
  const { data } = useSWR("store", getStore);
  if (!data) return null;
  return <App store={data} />;
};

export default Wrapper;
