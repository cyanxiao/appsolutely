import { useEffect } from "react";
import { AppGrid } from "./components/AppGrid";
import { applicationStore } from "./services/applications";

export default function Command() {
  useEffect(() => {
    void applicationStore.refresh();
  }, []);
  return <AppGrid />;
}
