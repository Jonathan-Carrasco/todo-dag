/**
 * Common props interface for all SVG icon components
 */
interface IconProps {
  onClick?: (e: React.MouseEvent) => void; // Optional click handler
  className?: string; // Optional CSS class name for styling
}

/**
 * ExpandIcon - Right-pointing chevron that can be rotated to indicate expansion state
 * Used in collapsible todo items to show whether dependencies are expanded
 */
export const ExpandIcon = ({ className, onClick }: IconProps) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    onClick={onClick}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5l7 7-7 7"
    />
  </svg>
);

/**
 * EditIcon - Pencil icon for editing functionality
 * Used in todo items to indicate edit action
 */
export const EditIcon = ({ onClick }: IconProps) => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    onClick={onClick}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

/**
 * DeleteIcon - X mark icon for deletion functionality
 * Used in todo items to indicate delete action
 */
export const DeleteIcon = ({ onClick }: IconProps) => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    onClick={onClick}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

/**
 * ZigZagArrowIcon - Dashed arrow icon for critical path visualization
 * Used in todo items to trigger critical path display in the graph
 */
export const ZigZagArrowIcon = ({ onClick }: IconProps) => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    onClick={onClick}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      strokeDasharray="3 2"
      d="M5 12h14m-7-7l7 7-7 7"
    />
  </svg>
); 