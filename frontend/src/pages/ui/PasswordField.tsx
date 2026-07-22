import { InputHTMLAttributes, forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import TextField from "./TextField";

interface PasswordFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label = "Password", id = "password", ...inputProps }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <TextField
        ref={ref}
        id={id}
        label={label}
        type={visible ? "text" : "password"}
        labelAdornment={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="text-[#8B8F9B] hover:text-[#ffffff] transition-colors"
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
        {...inputProps}
      />
    );
  }
);

PasswordField.displayName = "PasswordField";

export default PasswordField;