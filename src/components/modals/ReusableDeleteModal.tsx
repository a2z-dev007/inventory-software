import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../common/Button';


interface ReusableDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    itemName?: string;
    isDeleting: boolean;
    confirmText?: string;
    cancelText?: string;
    extraInfo?: string;
}

export const ReusableDeleteModal: React.FC<ReusableDeleteModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    itemName,
    isDeleting,
    extraInfo,
    confirmText = "Delete",
    cancelText = "Cancel"
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black backdrop-blur-sm bg-opacity-50 flex items-center justify-center  z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
                <div className="flex items-center mb-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                    </div>
                </div>

                <div className="mb-6">
                    <p className="text-sm text-gray-500">
                        {message}
                        {itemName && (
                            <span className="font-medium text-gray-900"> "{itemName}" </span>
                        )}
                        ?
                    </p>

                    {extraInfo && <p className="text-sm text-gray-500">{extraInfo}</p>}
                </div>

                <div className="flex justify-end space-x-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isDeleting}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        type="button"
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={onConfirm}
                        loading={isDeleting}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
};
