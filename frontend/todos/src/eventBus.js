
import mitt from "mitt";
export const eventBus = mitt();

export const EVENTS = {
  ITEM_CREATED: "itemCreated",
  ITEM_UPDATED: "itemUpdated",
  ITEM_DELETED: "itemDeleted",
  ITEM_TOGGLE_COMPLETE: "itemToggleComplete",
  RELOAD_LIST: "reloadList",
};
