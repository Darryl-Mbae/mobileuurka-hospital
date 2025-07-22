
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  chats: [],
  selectedChat: null,
};

const chatSlice = createSlice({
  name: "chats",
  initialState,
  reducers: {
    setChats: (state, action) => {
      state.chats = action.payload;
    },
    addChat: (state, action) => {
      const exists = state.chats.some(
        (chat) => chat.chat_id === action.payload.chat_id
      );
      if (!exists) state.chats.push(action.payload);
    },
 
    
    
  },
});

export const {
  setChats,
  addChat,
  
} = chatSlice.actions;

export default chatSlice.reducer;
