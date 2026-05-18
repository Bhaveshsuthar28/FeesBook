import {
  forwardRef,
} from "react";

import {
  Chrome,
} from "lucide-react";

const variantClass = {
  outline:
    "border-2 border-blue-600 bg-white text-blue-600 shadow-sm hover:bg-blue-50 hover:text-blue-700",
  solid:
    "border border-blue-500 bg-blue-600 text-white shadow-sm hover:bg-blue-700",
};

const iconClass = {
  outline:
    "bg-blue-50 text-blue-600",
  solid:
    "bg-white/20 text-white",
};

const AuthLoginButton =
  forwardRef(function AuthLoginButton(
    {
      variant = "outline",
      className = "",
      ...props
    },
    ref
  ) {
  return (
    <button
      ref={ref}
      type="button"
      {...props}
      className={`
        inline-flex
        h-11
        items-center
        justify-center
        gap-2.5
        rounded-xl
        px-4
        text-sm
        font-bold
        transition
        focus:outline-none
        focus:ring-4
        focus:ring-blue-100
        ${variantClass[variant]}
        ${className}
      `}
    >
      <span
        className={`
          flex
          h-7
          w-7
          items-center
          justify-center
          rounded-full
          ${iconClass[variant]}
        `}
      >
        <Chrome className="h-4 w-4" />
      </span>

      <span>Login with Google</span>
    </button>
  );
});

export default AuthLoginButton;
