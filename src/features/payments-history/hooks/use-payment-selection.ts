"use client";

import { useEffect, useMemo, useReducer } from "react";

export type DrawerMode = "view" | "edit";

type PaymentSelectionState = {
  drawerMode: DrawerMode;
  isSelectionUiExpanded: boolean;
  selectedPaymentIds: string[];
};

type PaymentSelectionAction =
  | { type: "set-mode"; mode: DrawerMode }
  | { type: "expand-ui" }
  | { type: "collapse-ui" }
  | { type: "clear-selection" }
  | { type: "toggle-payment"; paymentId: string }
  | { type: "toggle-visible-payments"; visiblePaymentIds: string[] }
  | { type: "sync-visible-payments"; visiblePaymentIds: string[] };

const initialPaymentSelectionState: PaymentSelectionState = {
  drawerMode: "view",
  isSelectionUiExpanded: false,
  selectedPaymentIds: [],
};

function paymentSelectionReducer(
  state: PaymentSelectionState,
  action: PaymentSelectionAction,
): PaymentSelectionState {
  switch (action.type) {
    case "set-mode":
      return { ...state, drawerMode: action.mode };
    case "expand-ui":
      return { ...state, isSelectionUiExpanded: true };
    case "collapse-ui":
      return { ...state, isSelectionUiExpanded: false };
    case "clear-selection":
      return { ...state, selectedPaymentIds: [] };
    case "toggle-payment":
      return {
        ...state,
        selectedPaymentIds: state.selectedPaymentIds.includes(action.paymentId)
          ? state.selectedPaymentIds.filter((currentPaymentId) => currentPaymentId !== action.paymentId)
          : [...state.selectedPaymentIds, action.paymentId],
      };
    case "toggle-visible-payments": {
      if (action.visiblePaymentIds.length === 0) {
        return state;
      }

      const visibleIds = new Set(action.visiblePaymentIds);
      const allVisibleSelected = action.visiblePaymentIds.every((paymentId) =>
        state.selectedPaymentIds.includes(paymentId),
      );

      return {
        ...state,
        selectedPaymentIds: allVisibleSelected
          ? state.selectedPaymentIds.filter((paymentId) => !visibleIds.has(paymentId))
          : Array.from(new Set([...state.selectedPaymentIds, ...action.visiblePaymentIds])),
      };
    }
    case "sync-visible-payments": {
      const visibleIds = new Set(action.visiblePaymentIds);
      const selectedPaymentIds = state.selectedPaymentIds.filter((paymentId) => visibleIds.has(paymentId));

      if (selectedPaymentIds.length === state.selectedPaymentIds.length) {
        return state;
      }

      return { ...state, selectedPaymentIds };
    }
    default:
      return state;
  }
}

export function usePaymentSelection({
  transitionMs,
  visiblePaymentIds,
}: {
  transitionMs: number;
  visiblePaymentIds: string[];
}) {
  const [state, dispatch] = useReducer(paymentSelectionReducer, initialPaymentSelectionState);
  const isDrawerEditMode = state.drawerMode === "edit";
  const selectedPaymentIdSet = useMemo(() => new Set(state.selectedPaymentIds), [state.selectedPaymentIds]);
  const allVisiblePaymentsSelected =
    visiblePaymentIds.length > 0 && visiblePaymentIds.every((paymentId) => selectedPaymentIdSet.has(paymentId));

  useEffect(() => {
    if (isDrawerEditMode) {
      const animationFrame = window.requestAnimationFrame(() => {
        dispatch({ type: "expand-ui" });
      });

      return () => window.cancelAnimationFrame(animationFrame);
    }

    dispatch({ type: "collapse-ui" });

    const clearSelectionTimeout = window.setTimeout(() => {
      dispatch({ type: "clear-selection" });
    }, transitionMs);

    return () => window.clearTimeout(clearSelectionTimeout);
  }, [isDrawerEditMode, transitionMs]);

  useEffect(() => {
    dispatch({ type: "sync-visible-payments", visiblePaymentIds });
  }, [visiblePaymentIds]);

  return {
    allVisiblePaymentsSelected,
    drawerMode: state.drawerMode,
    isDrawerEditMode,
    isSelectionUiExpanded: state.isSelectionUiExpanded,
    selectedPaymentIds: state.selectedPaymentIds,
    selectedPaymentIdSet,
    selectedPaymentsCount: state.selectedPaymentIds.length,
    setDrawerMode: (mode: DrawerMode) => dispatch({ type: "set-mode", mode }),
    togglePaymentSelection: (paymentId: string) => dispatch({ type: "toggle-payment", paymentId }),
    toggleVisiblePaymentsSelection: () => dispatch({ type: "toggle-visible-payments", visiblePaymentIds }),
  };
}
