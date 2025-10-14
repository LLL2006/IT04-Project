import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ModalState {
  isAddProjectModalOpen: boolean;
  isEditProjectModalOpen: boolean;
  isDeleteProjectModalOpen: boolean;
  isMemberListModalOpen: boolean;
  isAddMemberModalOpen: boolean;
}

interface UIState {
  modals: ModalState;
  selectedProject: any | null;
  user: any | null;
}

const initialState: UIState = {
  modals: {
    isAddProjectModalOpen: false,
    isEditProjectModalOpen: false,
    isDeleteProjectModalOpen: false,
    isMemberListModalOpen: false,
    isAddMemberModalOpen: false,
  },
  selectedProject: null,
  user: null,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    openAddProjectModal: (state) => {
      state.modals.isAddProjectModalOpen = true;
      state.selectedProject = null;
    },
    openEditProjectModal: (state, action: PayloadAction<any>) => {
      state.modals.isEditProjectModalOpen = true;
      state.selectedProject = action.payload;
    },
    openDeleteProjectModal: (state, action: PayloadAction<any>) => {
      state.modals.isDeleteProjectModalOpen = true;
      state.selectedProject = action.payload;
    },
    openMemberListModal: (state) => {
      state.modals.isMemberListModalOpen = true;
    },
    openAddMemberModal: (state) => {
      state.modals.isAddMemberModalOpen = true;
    },
    closeAllModals: (state) => {
      state.modals.isAddProjectModalOpen = false;
      state.modals.isEditProjectModalOpen = false;
      state.modals.isDeleteProjectModalOpen = false;
      state.modals.isMemberListModalOpen = false;
      state.modals.isAddMemberModalOpen = false;
    },
    setSelectedProject: (state, action: PayloadAction<any | null>) => {
      state.selectedProject = action.payload ?? null;
    },
    setUser: (state, action: PayloadAction<any>) => {
      state.user = action.payload;
      if (action.payload) {
        localStorage.setItem("user", JSON.stringify(action.payload));
      } else {
        localStorage.removeItem("user");
      }
    },
    logout: (state) => {
      state.user = null;
      localStorage.removeItem("user");
    },
  },
});

export const {
  openAddProjectModal,
  openEditProjectModal,
  openDeleteProjectModal,
  openMemberListModal,
  openAddMemberModal,
  closeAllModals,
  setSelectedProject,
  setUser, 
  logout,  
} = uiSlice.actions;

export default uiSlice.reducer;