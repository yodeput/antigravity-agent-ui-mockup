import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Download } from 'lucide-react';
import { Modal } from "antd";

interface ExportPasswordDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (password: string) => void;
  onCancel: () => void;
}

const ExportPasswordDialog: React.FC<ExportPasswordDialogProps> = ({
  isOpen,
  onOpenChange,
  onSubmit,
  onCancel
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  const validatePassword = (password: string) => {
    if (password.length < 4) return { isValid: false, message: '密码长度至少为4位' };
    if (password.length > 50) return { isValid: false, message: '密码长度不能超过50位' };
    return { isValid: true };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 清除之前的错误
    setValidationError('');

    // 基本密码验证：确保密码不为空
    if (!password.trim()) {
      setValidationError('请输入密码');
      return;
    }

    // 自定义密码验证
    const validation = validatePassword(password);
    if (!validation.isValid) {
      setValidationError(validation.message || '密码无效');
      return;
    }

    // 确认密码验证
    if (password !== confirmPassword) {
      setValidationError('两次输入的密码不一致');
      return;
    }

    onSubmit(password);
    // 重置状态
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setValidationError('');
  };

  const handleClose = () => {
    // 重置状态
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setValidationError('');
    onOpenChange(false);
  };

  const isValid = password.trim() !== '' &&
    validatePassword(password).isValid &&
    password === confirmPassword;

  return (
    <Modal
      open={isOpen}
      onCancel={() => onOpenChange(false)}
      title={<div className="text-lg font-semibold text-gray-900 flex items-center gap-3">
        <Download className="h-5 w-5 text-antigravity-blue" />
        导出配置文件
      </div>}
      okButtonProps={{
        disabled: !isValid,
        onClick: () => onSubmit(password),
      }}
      cancelButtonProps={{
        onClick: handleClose,
      }}
    >

      <div className="mt-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          请设置导出密码，用于保护您的配置文件
        </p>

        <div className="space-y-4">
          {/* 密码输入 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Lock className="h-4 w-4" />
              密码
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-antigravity-blue focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* 确认密码输入 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Lock className="h-4 w-4" />
              确认密码
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入密码"
                className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-antigravity-blue focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* 错误信息 */}
          {validationError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{validationError}</p>
            </div>
          )}

        </div>
      </div>
    </Modal>
  );
};

export default ExportPasswordDialog;
