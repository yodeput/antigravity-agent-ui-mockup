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
    if (password.length < 4) return { isValid: false, message: 'Password must be at least 4 characters' };
    if (password.length > 50) return { isValid: false, message: 'Password cannot exceed 50 characters' };
    return { isValid: true };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setValidationError('');

    // Basic password validation: ensure password is not empty
    if (!password.trim()) {
      setValidationError('Please enter a password');
      return;
    }

    // Custom password validation
    const validation = validatePassword(password);
    if (!validation.isValid) {
      setValidationError(validation.message || 'Invalid password');
      return;
    }

    // Confirm password validation
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    onSubmit(password);
    // Reset state
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setValidationError('');
  };

  const handleClose = () => {
    // Reset state
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
        Export Config File
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
          Please set an export password to protect your config file
        </p>

        <div className="space-y-4">
          {/* Password Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
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

          {/* Confirm Password Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Enter password again"
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

          {/* Error Message */}
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
