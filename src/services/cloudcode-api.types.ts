// CloudCode API Service Namespace
export namespace CloudCodeAPITypes {

  export interface ErrorResponse {
    error: {
      message: string;
      code: number;
      status: string
    }
  }

  export interface FetchAvailableModelsResponse {
    models: Models
    defaultAgentModelId: string
    agentModelSorts: AgentModelSort[]
    commandModelIds: string[]
    tabModelIds: string[]
    imageGenerationModelIds: string[]
    mqueryModelIds: string[]
    webSearchModelIds: string[]
  }

  export interface Models {
    "gemini-3-pro-image": Gemini3ProImage
    "claude-opus-4-5-thinking": ClaudeOpus45Thinking
    "gemini-3-pro-low": Gemini3ProLow
    "gemini-2.5-flash": Gemini25Flash
    "claude-sonnet-4-5": ClaudeSonnet45
    "gemini-2.5-pro": Gemini25Pro
    "gpt-oss-120b-medium": GptOss120bMedium
    "gemini-2.5-flash-lite": Gemini25FlashLite
    chat_20706: Chat20706
    "gemini-2.5-flash-thinking": Gemini25FlashThinking
    chat_23310: Chat23310
    "gemini-3-pro-high": Gemini3ProHigh
    "gemini-2.5-flash-image": Gemini25FlashImage
    "claude-sonnet-4-5-thinking": ClaudeSonnet45Thinking
    "rev19-uic3-1p": Rev19Uic31p
  }

  export interface Gemini3ProImage {
    displayName: string
    tokenizerType: string
    quotaInfo: QuotaInfo
    model: string
    apiProvider: string
    modelProvider: string
  }

  export interface QuotaInfo {
    remainingFraction: number
    resetTime: string
  }

  export interface ClaudeOpus45Thinking {
    displayName: string
    supportsImages: boolean
    supportsThinking: boolean
    thinkingBudget: number
    recommended: boolean
    maxTokens: number
    maxOutputTokens: number
    tokenizerType: string
    quotaInfo: QuotaInfo2
    model: string
    apiProvider: string
    modelProvider: string
  }

  export interface QuotaInfo2 {
    remainingFraction: number
    resetTime: string
  }

  export interface Gemini3ProLow {
    displayName: string
    supportsImages: boolean
    supportsThinking: boolean
    thinkingBudget: number
    minThinkingBudget: number
    recommended: boolean
    maxTokens: number
    maxOutputTokens: number
    tokenizerType: string
    quotaInfo: QuotaInfo3
    model: string
    apiProvider: string
    modelProvider: string
    supportsVideo: boolean
  }

  export interface QuotaInfo3 {
    remainingFraction: number
    resetTime: string
  }

  export interface Gemini25Flash {
    displayName: string
    supportsImages: boolean
    supportsThinking: boolean
    thinkingBudget: number
    recommended: boolean
    maxTokens: number
    maxOutputTokens: number
    tokenizerType: string
    quotaInfo: QuotaInfo4
    model: string
    apiProvider: string
    modelProvider: string
  }

  export interface QuotaInfo4 {
    remainingFraction: number
    resetTime: string
  }

  export interface ClaudeSonnet45 {
    displayName: string
    supportsImages: boolean
    recommended: boolean
    maxTokens: number
    maxOutputTokens: number
    tokenizerType: string
    quotaInfo: QuotaInfo5
    model: string
    apiProvider: string
    modelProvider: string
  }

  export interface QuotaInfo5 {
    remainingFraction: number
    resetTime: string
  }

  export interface Gemini25Pro {
    displayName: string
    supportsImages: boolean
    supportsThinking: boolean
    thinkingBudget: number
    minThinkingBudget: number
    recommended: boolean
    maxTokens: number
    maxOutputTokens: number
    tokenizerType: string
    quotaInfo: QuotaInfo6
    model: string
    apiProvider: string
    modelProvider: string
  }

  export interface QuotaInfo6 {
    remainingFraction: number
    resetTime: string
  }

  export interface GptOss120bMedium {
    displayName: string
    supportsThinking: boolean
    thinkingBudget: number
    recommended: boolean
    maxTokens: number
    maxOutputTokens: number
    tokenizerType: string
    quotaInfo: QuotaInfo7
    model: string
    apiProvider: string
    modelProvider: string
  }

  export interface QuotaInfo7 {
    remainingFraction: number
    resetTime: string
  }

  export interface Gemini25FlashLite {
    displayName: string
    maxTokens: number
    maxOutputTokens: number
    tokenizerType: string
    quotaInfo: QuotaInfo8
    model: string
    apiProvider: string
    modelProvider: string
  }

  export interface QuotaInfo8 {
    remainingFraction: number
    resetTime: string
  }

  export interface Chat20706 {
    maxTokens: number
    tokenizerType: string
    quotaInfo: QuotaInfo9
    model: string
    apiProvider: string
    supportsCumulativeContext: boolean
    tabJumpPrintLineRange: boolean
    supportsEstimateTokenCounter: boolean
    isInternal: boolean
    addCursorToFindReplaceTarget: boolean
    promptTemplaterType: string
    toolFormatterType: string
    requiresLeadInGeneration: boolean
  }

  export interface QuotaInfo9 {
    remainingFraction: number
  }

  export interface Gemini25FlashThinking {
    displayName: string
    supportsImages: boolean
    supportsThinking: boolean
    thinkingBudget: number
    recommended: boolean
    maxTokens: number
    maxOutputTokens: number
    tokenizerType: string
    quotaInfo: QuotaInfo10
    model: string
    apiProvider: string
    modelProvider: string
  }

  export interface QuotaInfo10 {
    remainingFraction: number
    resetTime: string
  }

  export interface Chat23310 {
    maxTokens: number
    tokenizerType: string
    quotaInfo: QuotaInfo11
    model: string
    apiProvider: string
    supportsCumulativeContext: boolean
    supportsEstimateTokenCounter: boolean
    isInternal: boolean
    promptTemplaterType: string
    toolFormatterType: string
    requiresLeadInGeneration: boolean
  }

  export interface QuotaInfo11 {
    remainingFraction: number
  }

  export interface Gemini3ProHigh {
    displayName: string
    supportsImages: boolean
    supportsThinking: boolean
    thinkingBudget: number
    minThinkingBudget: number
    recommended: boolean
    maxTokens: number
    maxOutputTokens: number
    tokenizerType: string
    quotaInfo: QuotaInfo12
    model: string
    apiProvider: string
    modelProvider: string
    supportsVideo: boolean
  }

  export interface QuotaInfo12 {
    remainingFraction: number
    resetTime: string
  }

  export interface Gemini25FlashImage {
    displayName: string
    tokenizerType: string
    quotaInfo: QuotaInfo13
    model: string
    apiProvider: string
    modelProvider: string
  }

  export interface QuotaInfo13 {
    remainingFraction: number
    resetTime: string
  }

  export interface ClaudeSonnet45Thinking {
    displayName: string
    supportsImages: boolean
    supportsThinking: boolean
    thinkingBudget: number
    recommended: boolean
    maxTokens: number
    maxOutputTokens: number
    tokenizerType: string
    quotaInfo: QuotaInfo14
    model: string
    apiProvider: string
    modelProvider: string
  }

  export interface QuotaInfo14 {
    remainingFraction: number
    resetTime: string
  }

  export interface Rev19Uic31p {
    supportsImages: boolean
    supportsThinking: boolean
    thinkingBudget: number
    minThinkingBudget: number
    maxTokens: number
    maxOutputTokens: number
    tokenizerType: string
    quotaInfo: QuotaInfo15
    model: string
    apiProvider: string
    modelProvider: string
  }

  export interface QuotaInfo15 {
    remainingFraction: number
    resetTime: string
  }

  export interface AgentModelSort {
    displayName: string
    groups: Group[]
  }

  export interface Group {
    modelIds: string[]
  }

  export interface LoadCodeAssistRequest {
    metadata: {
      ideType: string
    }
  }

  export interface LoadCodeAssistResponse {
    currentTier: Tier
    allowedTiers: Tier[]
    cloudaicompanionProject: string
    gcpManaged: boolean
    upgradeSubscriptionUri: string
  }

  export interface Tier {
    id: string
    name: string
    description: string
    privacyNotice: PrivacyNotice
    upgradeSubscriptionUri?: string
    upgradeSubscriptionText?: string
    upgradeSubscriptionType?: string
    quotaTier: string
    isDefault?: boolean
    userDefinedCloudaicompanionProject?: boolean
  }

  export interface PrivacyNotice {
    showNotice: boolean
    noticeText?: string
  }

  export interface RefreshAccessTokenResponse {
    access_token: string;
    expires_in: number;
    scope: string;
    token_type: string; // Or use literal type 'Bearer'
    id_token: string;   // This is a JWT (Json Web Token)
  }

  export interface UserInfoResponse {
    id: string;
    email: string;
    verified_email: boolean;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
  }

  // ============ Image Generation Types ============

  export interface GenerateImageRequest {
    model: string;
    contents: GenerateImageContent[];
    generationConfig?: GenerateImageConfig;
  }

  export interface GenerateImageContent {
    parts: GenerateImagePart[];
  }

  export interface GenerateImagePart {
    text?: string;
    inlineData?: {
      mimeType: string;
      data: string;
    };
  }

  export interface GenerateImageConfig {
    responseModalities?: string[];
    imageDimensions?: {
      aspectRatio?: string;
      width?: number;
      height?: number;
    };
    numberOfImages?: number;
  }

  export interface GenerateImageResponse {
    candidates: GenerateImageCandidate[];
    usageMetadata?: {
      promptTokenCount: number;
      candidatesTokenCount: number;
      totalTokenCount: number;
    };
  }

  export interface GenerateImageCandidate {
    content: {
      parts: GenerateImageResponsePart[];
      role: string;
    };
    finishReason: string;
    index: number;
  }

  export interface GenerateImageResponsePart {
    text?: string;
    inlineData?: {
      mimeType: string;
      data: string;  // Base64 encoded image data
    };
  }

}

