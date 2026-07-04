import { initNavigation, setTab } from "./js/navigation.js";
import { initSetup } from "./js/setup.js";
import { renderEmpty } from "./js/views/common.js";

initSetup();
initNavigation();
renderEmpty();
setTab("smart");
