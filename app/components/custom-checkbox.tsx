import { Eye, EyeClosed } from "lucide-react";
import { useState, type ReactNode } from "react";

interface CustomCheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  onClick?: () => void;
  icon?: ReactNode;
  uncheckedIcon?: ReactNode;
  className?: string;
}

const CustomCheckbox = ({
  checked: controlledChecked,
  onChange,
  onClick,
  icon = <Eye />,
  uncheckedIcon = <EyeClosed />,
  className = "",
}: CustomCheckboxProps) => {
  const [internalChecked, setInternalChecked] = useState(false);
  const isChecked = controlledChecked ?? internalChecked;

  const handleChange = () => {
    const newValue = !isChecked;
    if (onChange) onChange(newValue);
    if (onClick) onClick();
    if (controlledChecked === undefined) setInternalChecked(newValue);
  };

  return (
    <label
      className={`flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center ${className}`}
    >
      <input
        type="checkbox"
        checked={isChecked}
        onChange={handleChange}
        className="sr-only"
        aria-label={isChecked ? "Hide password" : "Show password"}
      />
      <span className="flex items-center justify-center" aria-hidden="true">
        {isChecked ? icon : uncheckedIcon}
      </span>
    </label>
  );
};

export default CustomCheckbox;
