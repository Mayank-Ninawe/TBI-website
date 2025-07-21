import { FileTextIcon, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  title: string;
  description?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function DashboardHeader({
  title,
  description,
  isLoading = false,
  onRefresh,
  className = '',
  children
}: DashboardHeaderProps) {
  return (
    <div className={`bg-white p-8 border-b border-gray-100 rounded-t-3xl shadow-md ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center">
            <FileTextIcon className="mr-3 h-8 w-8 text-blue-500" />
            {title}
          </h2>
          {description && (
            <p className="text-base text-gray-500 mt-2">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {children}
          {onRefresh && (
            <Button 
              variant="outline" 
              size="sm" 
              className="border-gray-200 hover:bg-gray-100 text-gray-700 hover:text-blue-700"
              onClick={onRefresh}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
