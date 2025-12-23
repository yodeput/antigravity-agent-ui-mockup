import { create } from "zustand";
import { AntigravityAccount } from "@/commands/types/account.types.ts";
import { CloudCodeAPI } from "@/services/cloudcode-api.ts";
import { CloudCodeAPITypes } from "@/services/cloudcode-api.types.ts";
import { AccountCommands } from "@/commands/AccountCommands.ts";
import { ProcessCommands } from "@/commands/ProcessCommands.ts";
import { logger } from "@/lib/logger";

type State = {
  data: Record<string, AccountAdditionData>
}

type Actions = {
  update: (antigravityAccount: AntigravityAccount) => Promise<void>
}

// Don't know the ultra tier definition yet, using fuzzy match for now
export type UserTier = 'free-tier' | 'g1-pro-tier' | 'g1-ultra-tier';

export interface AccountAdditionData {
  geminiProQuote: number
  geminiProQuoteRestIn: string
  geminiFlashQuote: number
  geminiFlashQuoteRestIn: string
  geminiImageQuote: number
  geminiImageQuoteRestIn: string
  claudeQuote: number
  claudeQuoteRestIn: string
  userAvatar: string
  userId: string
}

export const useAccountAdditionData = create<State & Actions>((setState, getState) => ({
  data: {},
  update: async (antigravityAccount: AntigravityAccount) => {
    let codeAssistResponse: CloudCodeAPITypes.LoadCodeAssistResponse | CloudCodeAPITypes.ErrorResponse = null

    try {
      codeAssistResponse = await CloudCodeAPI.loadCodeAssist(antigravityAccount.auth.access_token);
    } catch (e) {
      codeAssistResponse = e
    }

    // If there's an error, use oauth to refresh access token
    if ("error" in codeAssistResponse) {
      logger.debug('Failed to get code assist, trying to refresh access token', {
        module: 'use-account-addition-data',
      })
      // Avoid conflict: if this is the current account and Antigravity is running, don't refresh access token
      const currentAccount = await AccountCommands.getCurrentAntigravityAccount()
      const isAntigravityRunning = await ProcessCommands.isRunning()
      if (antigravityAccount.context.email === currentAccount?.context.email && isAntigravityRunning) {
        return
      }
      // Refresh access token
      const refreshTokenResponse = await CloudCodeAPI.refreshAccessToken(antigravityAccount.auth.id_token);
      // Update access token in memory, not writing to local storage here
      antigravityAccount.auth.access_token = refreshTokenResponse.access_token;
    }

    // Fuzzy match tier definition since the exact format is unknown
    if (antigravityAccount.context.plan.slug.includes("ultra")) {
      // antigravityAccount.context.plan.slug = "g1-ultra-tier";
    }

    codeAssistResponse = await CloudCodeAPI.loadCodeAssist(antigravityAccount.auth.access_token);

    const modelsResponse = await CloudCodeAPI.fetchAvailableModels(antigravityAccount.auth.access_token, codeAssistResponse.cloudaicompanionProject);
    const userInfoResponse = await CloudCodeAPI.userinfo(antigravityAccount.auth.access_token);

    logger.debug('Successfully fetched AccountAdditionData', {
      module: 'use-account-addition-data',
      email: antigravityAccount.context.email,
    })

    setState({
      data: {
        ...getState().data,
        [antigravityAccount.context.email]: {
          geminiProQuote: modelsResponse.models["gemini-3-pro-high"].quotaInfo.remainingFraction,
          geminiProQuoteRestIn: modelsResponse.models["gemini-3-pro-high"].quotaInfo.resetTime,
          geminiFlashQuote: modelsResponse.models["gemini-3-flash"].quotaInfo.remainingFraction,
          geminiFlashQuoteRestIn: modelsResponse.models["gemini-3-flash"].quotaInfo.resetTime,
          geminiImageQuote: modelsResponse.models["gemini-3-pro-image"].quotaInfo.remainingFraction,
          geminiImageQuoteRestIn: modelsResponse.models["gemini-3-pro-image"].quotaInfo.resetTime,
          claudeQuote: modelsResponse.models["claude-opus-4-5-thinking"].quotaInfo.remainingFraction,
          claudeQuoteRestIn: modelsResponse.models["claude-opus-4-5-thinking"].quotaInfo.resetTime,
          userAvatar: userInfoResponse.picture,
          userId: userInfoResponse.id,
        }
      }
    })
  }
}))
