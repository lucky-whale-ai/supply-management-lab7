import { configureStore } from "@reduxjs/toolkit";
import { createEntitySlice } from "./createEntitySlice.js";

export const entitySlices = {
  products: createEntitySlice("products"),
  orders: createEntitySlice("orders"),
  shipments: createEntitySlice("shipments"),
  "shipment-items": createEntitySlice("shipment-items"),
};

export const store = configureStore({
  reducer: Object.fromEntries(Object.entries(entitySlices).map(([name, slice]) => [name, slice.reducer])),
});
