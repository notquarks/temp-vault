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
    <label className={`cursor-pointer flex ${className}`}>
      <input
        type="checkbox"
        checked={isChecked}
        onChange={handleChange}
        className="absolute opacity-0"
      />
      <span>{isChecked ? icon : uncheckedIcon}</span>
    </label>
  );
};

export default CustomCheckbox;
