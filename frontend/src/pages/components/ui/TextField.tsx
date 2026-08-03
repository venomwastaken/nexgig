import { InputHTMLAttributes, forwardRef } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  labelAdornment?: React.ReactNode;
}

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, labelAdornment, id, className = "", ...inputProps }, ref) => {
    return (
      <div className="group">
        <div className="flex items-center justify-between">
          <label
            htmlFor={id}
            className="block font-mono text-[11px] uppercase tracking-widest text-[#8B8F9B] group-focus-within:text-[#1b976f]"
          >
            {label}
          </label>
          {labelAdornment}
        </div>
        <input
          ref={ref}
          id={id}
          className={`mt-2 w-full border-0 border-b border-[#2A2E38] bg-transparent py-2 text-[#ffffff] placeholder:text-[#4A4E58] focus:border-[#1b976f] focus:outline-none focus:ring-0 ${className}`}
          {...inputProps}
        />
      </div>
    );
  }
);

TextField.displayName = "TextField";

export default TextField;