import { AlertTriangle } from 'lucide-react';
import React from 'react'
import { Button } from '../common/Button';

interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    productName: string;
    isDeleting: boolean;
}

const DeleteModal: React.FC<DeleteModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    productName,
    isDeleting
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center backdrop-blur-sm justify-center  z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
                <div className="flex items-center mb-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">Delete Product</h3>
                    </div>
                </div>

                <div className="mb-6">
                    <p className="text-sm text-gray-500">
                        Are you sure you want to delete <span className="font-medium text-gray-900">"{productName}"</span>?
                        This action cannot be undone.
                    </p>
                </div>

                <div className="flex justify-end space-x-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={onConfirm}
                        loading={isDeleting}
                    >
                        Delete Product
                    </Button>
                </div>
            </div>
        </div>
    );
};


export default DeleteModal