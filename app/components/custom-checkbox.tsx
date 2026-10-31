import React, { useState } from "react";
import { Eye, EyeClosed } from "lucide-react";

interface CustomCheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  onClick?: () => void;
  icon?: React.ReactNode;
  uncheckedIcon?: React.ReactNode;
  className?: string;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  checked: controlledChecked,
  onChange,
  onClick,
  icon = <Eye />,
  uncheckedIcon = <EyeClosed />,
  className = "",
}) => {
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
      className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-paper text-bone transition-colors hover:bg-panel-hover ${className}`}
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
