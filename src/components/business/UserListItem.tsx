import React from "react";
import {AntigravityAccount} from "@/commands/types/account.types.ts";
import {BaseTooltip} from "@/components/base-ui/BaseTooltip.tsx";
import BusinessActionButton from "@/components/business/ActionButton.tsx";
import {BaseButton} from "@/components/base-ui/BaseButton.tsx";
import {Check, Trash2} from "lucide-react";
import {maskEmail, maskName} from "@/utils/username-masking.ts";
import {cn} from "@/utils/utils.ts";

interface UserListItemProps {
  user: AntigravityAccount;
  isCurrent: boolean;
  onSelect: (user: AntigravityAccount) => void;
  onSwitch: (email: string) => void;
  onDelete: (email: string) => void;
}

export const UserListItem: React.FC<UserListItemProps> = ({
                                                            user,
                                                            isCurrent,
                                                            onSelect,
                                                            onSwitch,
                                                            onDelete,
                                                          }) => {
  const getAvatarUrl = (base64Url: string) => {
    try {
      if (base64Url.startsWith('http') || base64Url.startsWith('data:')) {
        return base64Url;
      }
      return atob(base64Url);
    } catch (error) {
      return '';
    }
  };

  const avatarUrl = getAvatarUrl(user.profile_url);

  return (
    <div
      className={cn(
        "relative cursor-pointer group flex items-center p-4 rounded-xl transition-all duration-300 border mb-2 last:mb-0",
        isCurrent
          ? "bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-100/50 dark:border-blue-800/30 shadow-sm hover:shadow-md"
          : "bg-white/80 dark:bg-gray-800/40 border border-gray-100/50 dark:border-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-800/60 hover:shadow-sm"
      )}
      onClick={() => onSelect(user)}
    >

      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="relative">
          <img
            src={avatarUrl}
            alt={user.name}
            className={cn(
              "h-12 w-12 rounded-full object-cover border-2 transition-all duration-300 flex-shrink-0 ring-2 ring-offset-2",
              isCurrent
                ? "border-blue-400 dark:border-blue-500 ring-blue-100 dark:ring-blue-900/50"
                : "border-gray-200 dark:border-gray-600 group-hover:border-blue-300 dark:group-hover:border-blue-500 ring-gray-100 dark:ring-gray-700/50 group-hover:ring-blue-100 dark:group-hover:ring-blue-900/30"
            )}
          />
          {isCurrent && (
            <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full p-1 border-2 border-white dark:border-gray-900 shadow-sm">
              <Check className="h-3 w-3 text-white" strokeWidth={3}/>
            </div>
          )}
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-semibold truncate transition-colors text-base",
                          isCurrent ? "text-blue-700 dark:text-blue-300" : "text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                        )}>
                            {maskName(user.name)}
                        </span>
            {isCurrent && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-200 border border-blue-200/50 dark:border-blue-700/30">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5 animate-pulse"></span>
                当前使用
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <BaseTooltip content={user.email} side="bottom">
              <span className="text-sm text-gray-600 dark:text-gray-400 truncate font-mono">
                {maskEmail(user.email)}
              </span>
            </BaseTooltip>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              •
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {user.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '未知时间'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-1.5 flex-shrink-0 items-center ml-3">
        {!isCurrent && (
          <>
            <BaseTooltip content="切换到此用户" side="bottom">
              <div onClick={(e) => e.stopPropagation()}>
                <BusinessActionButton
                  variant="secondary"
                  size="sm"
                  className="h-8 px-4 text-xs font-medium bg-white/80 dark:bg-gray-700/80 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 dark:hover:border-blue-700 border border-gray-200 dark:border-gray-600 rounded-lg transition-all duration-200"
                  onClick={() => onSwitch(user.email)}
                  loadingText="切换中..."
                >
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    切换
                  </div>
                </BusinessActionButton>
              </div>
            </BaseTooltip>

            <BaseTooltip content="删除此备份" side="bottom">
              <div onClick={(e) => e.stopPropagation()}>
                <BaseButton
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                  onClick={() => onDelete(user.email)}
                >
                  <Trash2 className="h-3.5 w-3.5"/>
                </BaseButton>
              </div>
            </BaseTooltip>
          </>
        )}
      </div>
    </div>
  );
};
