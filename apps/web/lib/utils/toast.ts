"use client";

import { toast } from "sonner";

export const showSuccessToast = (message: string) => {
  toast.success(message);
};

export const showErrorToast = (message: string) => {
  toast.error(message);
};

export const showLoadingToast = (message: string) => {
  return toast.loading(message);
};

export const showInfoToast = (message: string) => {
  toast.info(message);
};

export const copyToClipboard = async (text: string, successMessage?: string) => {
  try {
    await navigator.clipboard.writeText(text);
    showSuccessToast(successMessage || 'Copied to clipboard!');
    return true;
  } catch {
    showErrorToast('Failed to copy to clipboard');
    return false;
  }
};