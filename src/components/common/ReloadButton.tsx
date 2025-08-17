import React from "react";
import { LoadingSpinner } from "./LoadingSpinner";
import { RefreshCcw } from "lucide-react";

type Props = {
  refetch?: () => void,
  isLoading?: boolean,
};

const ReloadButton = ({ refetch, isLoading }: Props) => {
  return (
    <button
      onClick={refetch}
      disabled={isLoading}
      className="fixed bottom-6 right-6 w-14 h-14 gradient-btn hover:from-blue-700 hover:scale-105 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 flex items-center justify-center group"
      aria-label="Refresh"
    >
      {isLoading ? (
        <LoadingSpinner size="sm" color="white" />
      ) : (
        <RefreshCcw
          size={30}
          className="group-hover:rotate-180 transition-transform duration-300"
        />
      )}
    </button>
  );
};

export default ReloadButton;
