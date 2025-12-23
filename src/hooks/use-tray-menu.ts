import {useEffect} from "react";
import {listen} from "@tauri-apps/api/event";
import {logger} from "../lib/logger.ts";
import {useAntigravityAccount} from "@/modules/use-antigravity-account.ts";
import {TrayCommands} from "@/commands/TrayCommands.ts";
import toast from "react-hot-toast";

/**
 * System Tray Menu Update Hook
 * Responsible for listening to account changes and updating tray menu
 */
export function useTrayMenu() {
  const { accounts, switchToAccount } = useAntigravityAccount();

  // Update tray menu
  const updateTrayMenu = async (accounts: string[]) => {
    try {
      logger.info("Updating tray menu", { accountCount: accounts.length });

      await TrayCommands.updateMenu(accounts);

      logger.info("Tray menu updated successfully");
    } catch (error) {
      logger.error("Failed to update tray menu", error);
      // Don't show toast error as this may happen in background
    }
  };

  // Listen for account switch requests from backend
  useEffect(() => {
    const unlisten = listen("tray-switch-account", async (event) => {
      const email = event.payload as string;
      logger.info("Received tray account switch request", { email });

      try {
        await switchToAccount(email);
        toast.success(`Switched to account: ${email}`);
      } catch (error) {
        logger.error("Tray account switch failed", error);
        toast.error(`Failed to switch account: ${error}`);
      }
    });

    return () => {
      unlisten.then(f => f());
    };
  }, []);

  // Update tray menu when account list changes
  useEffect(() => {
    if (accounts.length > 0) {
      // Extract email list and update tray menu
      const emails = accounts.map((user) => user.context.email);
      updateTrayMenu(emails);
    } else {
      // Clear tray menu when no accounts
      updateTrayMenu([]);
    }
  }, [accounts]);
}
