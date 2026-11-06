import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api, errorMessage } from "../api.js";

export function createEntitySlice(resource) {
  const loadList = createAsyncThunk(`${resource}/loadList`, async (params, { rejectWithValue, signal }) => {
    try {
      return (await api.get(`/${resource}`, { params, signal })).data;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  });
  const loadOne = createAsyncThunk(`${resource}/loadOne`, async (id, { rejectWithValue, signal }) => {
    try {
      return (await api.get(`/${resource}/${id}`, { signal })).data;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  });
  const save = createAsyncThunk(`${resource}/save`, async ({ id, values }, { rejectWithValue }) => {
    try {
      const response = id
        ? await api.put(`/${resource}/${id}`, values)
        : await api.post(`/${resource}`, values);
      return response.data;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  });
  const remove = createAsyncThunk(`${resource}/remove`, async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/${resource}/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  });
  const slice = createSlice({
    name: resource,
    initialState: { items: [], total: 0, totalPages: 1, current: null, loading: false, detailLoading: false, saving: false, error: null, listRequest: null, detailRequest: null },
    reducers: { clearError(state) { state.error = null; } },
    extraReducers(builder) {
      builder.addCase(loadList.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.listRequest = action.meta.requestId;
      });
      builder.addCase(loadList.fulfilled, (state, action) => {
        if (state.listRequest !== action.meta.requestId) return;
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.totalPages = Math.max(1, action.payload.totalPages);
      });
      builder.addCase(loadList.rejected, (state, action) => {
        if (state.listRequest !== action.meta.requestId) return;
        state.loading = false;
        if (!action.meta.aborted) state.error = action.payload;
      });
      builder.addCase(loadOne.pending, (state, action) => {
        state.detailLoading = true;
        state.current = null;
        state.error = null;
        state.detailRequest = action.meta.requestId;
      });
      builder.addCase(loadOne.fulfilled, (state, action) => {
        if (state.detailRequest !== action.meta.requestId) return;
        state.detailLoading = false;
        state.current = action.payload;
      });
      builder.addCase(loadOne.rejected, (state, action) => {
        if (state.detailRequest !== action.meta.requestId) return;
        state.detailLoading = false;
        if (!action.meta.aborted) state.error = action.payload;
      });
      builder.addCase(save.pending, (state) => { state.saving = true; state.error = null; });
      builder.addCase(save.fulfilled, (state, action) => { state.saving = false; state.current = action.payload; });
      builder.addCase(save.rejected, (state, action) => { state.saving = false; state.error = action.payload; });
      builder.addCase(remove.pending, (state) => { state.saving = true; state.error = null; });
      builder.addCase(remove.fulfilled, (state) => { state.saving = false; });
      builder.addCase(remove.rejected, (state, action) => { state.saving = false; state.error = action.payload; });
    },
  });
  return { ...slice, loadList, loadOne, save, remove };
}
